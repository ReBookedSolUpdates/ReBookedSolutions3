import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";
import { refundTransaction } from "../_shared/paystack-refund.ts";
import { validateUUIDs, createUUIDErrorResponse } from "../_shared/uuid-validator.ts";
import { jsonResponse, handleCorsPreflightRequest, safeErrorResponse } from "../_shared/response-utils.ts";
import { logError, logInfo, logWarning } from "../_shared/error-utils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest();
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("decline-commit", req);
  if (testResult.isTest && testResult.response) {
    return testResult.response;
  }

  try {
    // Parse request body safely
    const bodyParseResult = await parseRequestBody(req, corsHeaders);
    if (!bodyParseResult.success) {
      return bodyParseResult.errorResponse!;
    }
    const { order_id, seller_id, reason } = bodyParseResult.data;

    // Validate UUIDs
    const validation = validateUUIDs({ order_id, seller_id });
    if (!validation.isValid) {
      return createUUIDErrorResponse(validation.errors, corsHeaders);
    }

    // Check environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      logError("Environment check", "Missing required environment variables");
      return safeErrorResponse(
        "ENVIRONMENT_CONFIG_ERROR",
        { missing: [!SUPABASE_URL ? "SUPABASE_URL" : null, !SUPABASE_SERVICE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null].filter(Boolean) },
        "Required environment variables are not configured",
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    logInfo("Decline commit", `Processing decline for order ${order_id}`);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .eq("status", "pending_commit")
      .single();

    if (orderError || !order) {
      logError("Order fetch", orderError || "Order not found");
      return safeErrorResponse(
        "ORDER_NOT_FOUND",
        { order_id, seller_id, database_error: orderError?.message },
        "Order not found or not in pending_commit status",
        { status: 404 }
      );
    }

    // Get buyer and seller profiles
    const [{ data: buyer }, { data: seller }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", order.buyer_id)
        .single(),
      supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", order.seller_id)
        .single(),
    ]);

    // Update order status to declined
    const updateFields: any = {
      status: "declined",
      declined_at: new Date().toISOString(),
    };

    // Try to include decline_reason if column exists
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        ...updateFields,
        decline_reason: reason || "Seller declined to commit",
      })
      .eq("id", order_id);

    // If decline_reason column doesn't exist, update without it
    if (updateError && updateError.message?.includes("decline_reason")) {
      logWarning("Order update", "decline_reason column not found, updating without it");
      const { error: fallbackError } = await supabase
        .from("orders")
        .update(updateFields)
        .eq("id", order_id);

      if (fallbackError) {
        logError("Order update", fallbackError);
        return safeErrorResponse("ORDER_UPDATE_FAILED", fallbackError, "Failed to update order status", { status: 500 });
      }
    } else if (updateError) {
      logError("Order update", updateError);
      return safeErrorResponse("ORDER_UPDATE_FAILED", updateError, "Failed to update order status", { status: 500 });
    }

    logInfo("Order update", `Order ${order_id} status updated to declined`);

    // Process Paystack refund if payment reference exists
    let refundResult: any = null;
    if (order.payment_reference) {
      logInfo("Refund", `Processing Paystack refund for payment ${order.payment_reference}`);

      try {
        refundResult = await refundTransaction(
          order.payment_reference,
          null, // null = full refund (recommended approach per Paystack docs)
          reason || "Order declined by seller"
        );

        if (refundResult.success) {
          logInfo("Refund", `✅ Refund successful for order ${order_id}`);

          // Store refund details in database
          const refundRecord = {
            id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            order_id: order_id,
            transaction_reference: order.payment_reference,
            refund_reference: refundResult.data?.id?.toString() || refundResult.data?.refund_reference,
            amount: refundResult.data?.amount ? refundResult.data.amount / 100 : order.total_amount,
            reason: reason || "Order declined by seller",
            status: refundResult.data?.status || "pending",
            paystack_response: refundResult.data,
            created_at: new Date().toISOString(),
          } as any;

          const { error: refundError } = await supabase
            .from("refund_transactions")
            .insert(refundRecord);

          if (refundError) {
            logWarning("Refund storage", `Failed to store refund transaction: ${refundError.message}`);
          }

          // Update order with refund info
          await supabase
            .from("orders")
            .update({
              refund_status: refundResult.data?.status || "pending",
              refund_reference: refundResult.data?.id?.toString() || refundResult.data?.refund_reference,
              refunded_at: new Date().toISOString(),
            })
            .eq("id", order_id);
        } else {
          logError("Refund", `❌ Refund failed for order ${order_id}: ${refundResult.error}`);
        }
      } catch (refundError) {
        logError("Refund processing", refundError);
        refundResult = { success: false, error: refundError instanceof Error ? refundError.message : "Unknown error" };
      }
    } else {
      logWarning("Refund", `No payment reference found for order ${order_id}`);
    }

    // Create database notifications
    try {
      const notificationPromises: Promise<any>[] = [];

      // Notify buyer
      if (buyer?.id) {
        notificationPromises.push(
          supabase.from("notifications").insert({
            user_id: buyer.id,
            type: "error",
            title: "❌ Order Declined",
            message: `Your order has been declined by the seller. ${refundResult?.success ? 'Refund processed and will appear in 3-5 business days.' : 'Refund is being processed.'} Order ID: ${order_id}`,
            order_id: order_id,
            action_required: false
          })
        );
      }

      // Notify seller
      if (seller?.id) {
        notificationPromises.push(
          supabase.from("notifications").insert({
            user_id: seller.id,
            type: "info",
            title: "✅ Order Decline Confirmed",
            message: `You have successfully declined order ${order_id}. The buyer has been notified and refunded.`,
            order_id: order_id,
            action_required: false
          })
        );
      }

      await Promise.allSettled(notificationPromises);
      logInfo("Notifications", "Database notifications created");
    } catch (notificationError) {
      logError("Notifications", notificationError);
    }

    // Send notification emails
    try {
      const emailPromises: Promise<any>[] = [];

      // Email to buyer
      if (buyer?.email) {
        const buyerHtml = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Order Declined - Refund Processed</title><style>body{font-family:Arial,sans-serif;background-color:#f3fef7;padding:20px;color:#1f4e3d;margin:0}.container{max-width:500px;margin:auto;background-color:#ffffff;padding:30px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.05)}.header-error{background:#dc2626;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0;margin:-30px -30px 20px -30px}.btn{display:inline-block;padding:12px 20px;background-color:#3ab26f;color:white;text-decoration:none;border-radius:5px;margin-top:20px;font-weight:bold}.info-box-error{background:#fef2f2;border:1px solid #dc2626;padding:15px;border-radius:5px;margin:15px 0}.info-box-success{background:#f0fdf4;border:1px solid #10b981;padding:15px;border-radius:5px;margin:15px 0}.footer{background:#f3fef7;color:#1f4e3d;padding:20px;text-align:center;font-size:12px;line-height:1.5;margin:30px -30px -30px -30px;border-radius:0 0 10px 10px;border-top:1px solid #e5e7eb}.link{color:#3ab26f}</style></head><body><div class=\"container\"><div class=\"header-error\"><h1>❌ Order Declined</h1></div><p>Hello ${buyer.name || "Customer"},</p><p>We're sorry to inform you that your order has been declined by the seller.</p><div class=\"info-box-error\"><h3>📋 Order Details</h3><p><strong>Order ID:</strong> ${order_id}</p><p><strong>Amount:</strong> R${order.total_amount?.toFixed(2) || "0.00"}</p><p><strong>Reason:</strong> ${reason || "Seller declined to commit"}</p></div>${refundResult?.success ? `<div class=\"info-box-success\"><h3>💰 Refund Information</h3><p><strong>Refund Status:</strong> ${refundResult.data?.status || "Processing"}</p><p><strong>Refund Reference:</strong> ${refundResult.data?.id || refundResult.data?.refund_reference || "N/A"}</p><p><strong>Processing Time:</strong> 3-5 business days</p><p><strong>✅ Your refund has been successfully processed.</strong></p></div>` : `<div class=\"info-box-error\"><h3>⚠️ Refund Processing</h3><p>Your refund is being processed and will appear in your account within 3-5 business days.</p></div>`}<p>We apologize for any inconvenience. Please feel free to browse our marketplace for similar books from other sellers.</p><a href=\"https://rebookedsolutions.co.za/books\" class=\"btn\">Browse Books</a><div class=\"footer\"><p><strong>This is an automated message from ReBooked Solutions.</strong><br>Please do not reply to this email.</p><p>For assistance, contact: <a href=\"mailto:support@rebookedsolutions.co.za\" class=\"link\">support@rebookedsolutions.co.za</a><br>Visit us at: <a href=\"https://rebookedsolutions.co.za\" class=\"link\">https://rebookedsolutions.co.za</a></p><p>T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em></p></div></div></body></html>`;

        emailPromises.push(
          fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              to: buyer.email,
              subject: "Order Declined - Refund Processed",
              html: buyerHtml,
            }),
          })
        );
      }

      // Email to seller
      if (seller?.email) {
        const sellerHtml = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Order Decline Confirmation</title><style>body{font-family:Arial,sans-serif;background-color:#f3fef7;padding:20px;color:#1f4e3d;margin:0}.container{max-width:500px;margin:auto;background-color:#ffffff;padding:30px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.05)}.header-error{background:#dc2626;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0;margin:-30px -30px 20px -30px}.btn{display:inline-block;padding:12px 20px;background-color:#3ab26f;color:white;text-decoration:none;border-radius:5px;margin-top:20px;font-weight:bold}.info-box-error{background:#fef2f2;border:1px solid #dc2626;padding:15px;border-radius:5px;margin:15px 0}.info-box-success{background:#f0fdf4;border:1px solid #10b981;padding:15px;border-radius:5px;margin:15px 0}.footer{background:#f3fef7;color:#1f4e3d;padding:20px;text-align:center;font-size:12px;line-height:1.5;margin:30px -30px -30px -30px;border-radius:0 0 10px 10px;border-top:1px solid #e5e7eb}.link{color:#3ab26f}</style></head><body><div class=\"container\"><div class=\"header-error\"><h1>✅ Order Decline Confirmed</h1></div><p>Hello ${seller.name || "Seller"},</p><p>You have successfully declined the order commitment.</p><div class=\"info-box-success\"><h3>📋 Order Details</h3><p><strong>Order ID:</strong> ${order_id}</p><p><strong>Reason:</strong> ${reason || "You declined to commit"}</p></div><p>The buyer has been notified and their payment has been refunded.</p><div class=\"footer\"><p><strong>This is an automated message from ReBooked Solutions.</strong><br>Please do not reply to this email.</p><p>For assistance, contact: <a href=\"mailto:support@rebookedsolutions.co.za\" class=\"link\">support@rebookedsolutions.co.za</a><br>Visit us at: <a href=\"https://rebookedsolutions.co.za\" class=\"link\">https://rebookedsolutions.co.za</a></p><p>T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em></p></div></div></body></html>`;

        emailPromises.push(
          fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
              to: seller.email,
              subject: "Order Decline Confirmation",
              html: sellerHtml,
            }),
          })
        );
      }

      await Promise.allSettled(emailPromises);
      logInfo("Emails", "Notification emails sent");
    } catch (emailError) {
      logError("Email sending", emailError);
    }

    return jsonResponse({
      message: "Order declined successfully",
      details: {
        order_id,
        status: "declined",
        declined_at: new Date().toISOString(),
        refund_amount: order.total_amount,
        refund_processed: refundResult?.success || false,
        refund_reference: refundResult?.data?.id || refundResult?.data?.refund_reference,
        refund_status: refundResult?.data?.status,
        notifications_sent: {
          buyer: !!buyer?.email,
          seller: !!seller?.email,
        },
      },
    });
  } catch (error) {
    logError("Decline commit", error);
    return safeErrorResponse(
      "UNEXPECTED_ERROR",
      error,
      "Unexpected error occurred during decline commit",
      { status: 500 }
    );
  }
});
