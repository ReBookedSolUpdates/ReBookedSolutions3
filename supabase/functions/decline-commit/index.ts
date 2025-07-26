import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";
import { testFunction } from "../_mock-data/edge-function-tester.ts";
import { refundTransaction } from "../_shared/paystack-refund.ts";
import { validateUUIDs, createUUIDErrorResponse } from "../_shared/uuid-validator.ts";
import { jsonResponse, errorResponse, handleCorsPreflightRequest, safeErrorResponse } from "../_shared/response-utils.ts";
import { logError } from "../_shared/error-utils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest();
  }

  // 🧪 TEST MODE: Check if this is a test request with mock data
  const testResult = await testFunction("decline-commit", req);
  if (testResult.isTest) {
    return testResult.response;
  }

    try {
    // Use safe body parser
    const bodyParseResult = await parseRequestBody(req, corsHeaders);
    if (!bodyParseResult.success) {
      return bodyParseResult.errorResponse!;
    }
    const { order_id, seller_id, reason } = bodyParseResult.data;

    // Validate UUIDs using shared validator
    const validation = validateUUIDs({ order_id, seller_id });
    if (!validation.isValid) {
      return createUUIDErrorResponse(validation.errors, corsHeaders);
    }

    // Check environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ENVIRONMENT_CONFIG_ERROR",
          details: {
            missing_env_vars: [
              !SUPABASE_URL ? "SUPABASE_URL" : null,
              !SUPABASE_SERVICE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
            ].filter(Boolean),
            message: "Required environment variables are not configured",
          },
          fix_instructions:
            "Configure missing environment variables in your deployment settings",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get order details with enhanced error handling
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .eq("status", "pending_commit")
      .single();

    if (orderError) {
      if (orderError.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "ORDER_NOT_FOUND",
            details: {
              order_id,
              seller_id,
              database_error: orderError.message,
              possible_causes: [
                "Order ID does not exist",
                "Order does not belong to this seller",
                "Order is not in 'pending_commit' status",
                "Order may have already been processed",
              ],
            },
            fix_instructions:
              "Verify the order_id and seller_id are correct, and check that the order status is 'pending_commit'",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "DATABASE_QUERY_FAILED",
          details: {
            error_code: orderError.code,
            error_message: orderError.message,
            query_details:
              "SELECT from orders table with order_id, seller_id, and status filters",
          },
          fix_instructions:
            "Check database connection and table structure. Ensure 'orders' table exists with proper columns.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ORDER_STATUS_INVALID",
          details: {
            order_id,
            seller_id,
            expected_status: "pending_commit",
            message: "Order not found or not in pending commit status",
            possible_reasons: [
              "Order status is not 'pending_commit'",
              "Order has already been declined or committed",
              "Order belongs to different seller",
            ],
          },
          fix_instructions:
            "Only orders with status 'pending_commit' can be declined. Check order status first.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
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

    // Update order status to declined (handle missing decline_reason column gracefully)
    const updateFields: any = {
      status: "declined",
      declined_at: new Date().toISOString(),
    };

    // Only add decline_reason if the column exists
    try {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          ...updateFields,
          decline_reason: reason || "Seller declined to commit",
        })
        .eq("id", order_id);

      if (updateError && updateError.code === "PGRST204" && updateError.message.includes("decline_reason")) {
        // Column doesn't exist, update without it
        console.warn("decline_reason column not found, updating without it");
        const { error: fallbackError } = await supabase
          .from("orders")
          .update(updateFields)
          .eq("id", order_id);

        if (fallbackError) {
          throw new Error(`Failed to update order status: ${fallbackError.message}`);
        }
      } else if (updateError) {
        throw new Error(`Failed to update order status: ${updateError.message}`);
      }
    } catch (error) {
      if (error.message.includes("decline_reason")) {
        // Try without decline_reason column
        const { error: fallbackError } = await supabase
          .from("orders")
          .update(updateFields)
          .eq("id", order_id);

        if (fallbackError) {
          throw new Error(`Failed to update order status: ${fallbackError.message}`);
        }
      } else {
        throw error;
      }
    }

    if (updateError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ORDER_UPDATE_FAILED",
          details: {
            error_code: updateError.code,
            error_message: updateError.message,
            update_fields: ["status", "declined_at", "decline_reason"],
          },
          fix_instructions:
            "Check database permissions and ensure the orders table allows updates to these fields",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Process Paystack refund if payment reference exists
    let refundResult = null;
    if (order.payment_reference) {
      console.log(`🔄 Processing Paystack refund for order ${order_id}`);

      try {
        refundResult = await refundTransaction(
          order.payment_reference,
          null, // Full refund
          reason || "Order declined by seller",
        );

        if (refundResult.success) {
          console.log(`✅ Refund processed successfully for order ${order_id}`);

          // Store refund details in database
          const { error: refundError } = await supabase
            .from("refund_transactions")
            .insert({
              id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              order_id: order_id,
              transaction_reference: order.payment_reference,
              refund_reference: refundResult.data.id,
              amount: order.total_amount,
              reason: reason || "Order declined by seller",
              status: refundResult.data.status || "pending",
              paystack_response: refundResult.data,
              created_at: new Date().toISOString(),
            });

          if (refundError) {
            console.warn("Failed to store refund transaction:", refundError);
          }

          // Update order with refund info
          await supabase
            .from("orders")
            .update({
              refund_status: refundResult.data.status,
              refund_reference: refundResult.data.id,
              refunded_at: new Date().toISOString(),
            })
            .eq("id", order_id);
        } else {
          console.error(
            `❌ Refund failed for order ${order_id}:`,
            refundResult.error,
          );
        }
      } catch (refundError) {
        console.error("Refund processing error:", refundError);
        refundResult = { success: false, error: refundError.message };
      }
    } else {
      console.warn(`⚠️ No payment reference found for order ${order_id}`);
    }

    // Send notification emails
    try {
      const emailPromises = [];

      // Notify buyer
      if (buyer?.email) {
        const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Declined - Refund Processed</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
      margin: 0;
    }
    .container {
      max-width: 500px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .btn {
      display: inline-block;
      padding: 12px 20px;
      background-color: #3ab26f;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
    }
    .link {
      color: #3ab26f;
    }
    .header-error {
      background: #dc2626;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .footer {
      background: #f3fef7;
      color: #1f4e3d;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      margin: 30px -30px -30px -30px;
      border-radius: 0 0 10px 10px;
      border-top: 1px solid #e5e7eb;
    }
    .info-box-error {
      background: #fef2f2;
      border: 1px solid #dc2626;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .info-box-success {
      background: #f0fdf4;
      border: 1px solid #10b981;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-error">
      <h1>❌ Order Declined</h1>
    </div>

    <p>Hello ${buyer.name || "Customer"},</p>
    <p>We're sorry to inform you that your order has been declined by the seller.</p>

    <div class="info-box-error">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Amount:</strong> R${order.total_amount?.toFixed(2) || "0.00"}</p>
      <p><strong>Reason:</strong> ${reason || "Seller declined to commit"}</p>
    </div>

    ${
      refundResult?.success
        ? `
    <div class="info-box-success">
      <h3>💰 Refund Information</h3>
      <p><strong>Refund Status:</strong> ${refundResult.data.status}</p>
      <p><strong>Refund Reference:</strong> ${refundResult.data.id}</p>
      <p><strong>Processing Time:</strong> 3-5 business days</p>
      <p><strong>��� Your refund has been successfully processed.</strong></p>
    </div>
    `
        : `
    <div class="info-box-error">
      <h3>⚠️ Refund Processing</h3>
      <p>Your refund is being processed manually and will appear in your account within 3-5 business days.</p>
    </div>
    `
    }

    <p>We apologize for any inconvenience. Please feel free to browse our marketplace for similar books from other sellers.</p>

    <a href="https://rebookedsolutions.co.za/books" class="btn">Browse Books</a>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

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
              text: `Order Declined\n\nHello ${buyer.name || "Customer"},\n\nWe're sorry to inform you that your order has been declined by the seller.\n\nOrder ID: ${order_id}\nAmount: R${order.total_amount?.toFixed(2) || "0.00"}\nReason: ${reason || "Seller declined to commit"}\n\nYour refund has been processed and will appear in your account within 3-5 business days.\n\nReBooked Solutions`,
            }),
          }),
        );
      }

      // Notify seller
      if (seller?.email) {
        const sellerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Decline Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; margin: 0; }
    .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .header { background: #3ab26f; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
    .footer { background: #f3fef7; color: #1f4e3d; padding: 20px; text-align: center; font-size: 12px; line-height: 1.5; margin: 30px -30px -30px -30px; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb; }
    .info-box { background: #f3fef7; border: 1px solid #3ab26f; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Decline Confirmed</h1>
    </div>

    <h2>Hello ${seller.name || "Seller"},</h2>
    <p>You have successfully declined the order commitment.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Reason:</strong> ${reason || "You declined to commit"}</p>
    </div>

    <p>The buyer has been notified and their payment has been refunded.</p>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

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
              text: `Order Decline Confirmed\n\nHello ${seller.name || "Seller"},\n\nYou have successfully declined the order commitment.\n\nOrder ID: ${order_id}\nReason: ${reason || "You declined to commit"}\n\nThe buyer has been notified and their payment has been refunded.\n\nReBooked Solutions`,
            }),
          }),
        );
      }

      // Wait for emails (but don't fail if they don't send)
      const emailResults = await Promise.allSettled(emailPromises);
      const emailErrors = emailResults.filter(
        (result) => result.status === "rejected",
      ).length;

      if (emailErrors > 0) {
        console.warn(
          `${emailErrors} email(s) failed to send out of ${emailPromises.length}`,
        );
      }
    } catch (emailError) {
      console.error("Failed to send notification emails:", emailError);
      // Don't fail the decline process for email errors
    }

    return jsonResponse({
      message: "Order declined successfully",
      details: {
        order_id,
        status: "declined",
        declined_at: new Date().toISOString(),
        refund_amount: order.total_amount,
        refund_processed: refundResult?.success || false,
        refund_reference: refundResult?.data?.id,
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
