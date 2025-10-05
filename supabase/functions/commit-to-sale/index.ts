import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id } = body || {};
    if (!order_id) {
      throw new Error("Order ID is required");
    }

    console.log(`[commit-to-sale] Processing commitment for order ${order_id} by user ${user.id}`);

    // Fetch the order
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Verify seller is committing to their own order
    if (order.seller_id !== user.id) {
      throw new Error("Only the seller can commit to this order");
    }

    // Allow a few valid pre-commit states
    const validStatuses = new Set(["paid", "pending_commit", "payment_verified", "authorized"]);
    if (!validStatuses.has(order.status)) {
      throw new Error(`Order cannot be committed in status: ${order.status}`);
    }

    // Ensure items is an array
    let items: any[] = [];
    try {
      items = Array.isArray(order.items) ? order.items : (order.items ? JSON.parse(order.items) : []);
    } catch {
      items = [];
    }

    // Decrypt seller pickup address (pass through user auth header)
    console.log(`[commit-to-sale] Decrypting seller pickup address`);
    const pickupResponse = await supabaseClient.functions.invoke("decrypt-address", {
      body: {
        table: "profiles",
        target_id: order.seller_id,
        address_type: "pickup",
      },
      headers: { Authorization: authHeader },
    });

    if (pickupResponse.error || !pickupResponse.data?.success) {
      throw new Error("Failed to decrypt seller pickup address");
    }
    const pickupAddress = pickupResponse.data.data || {};

    // Decrypt buyer shipping address
    console.log(`[commit-to-sale] Decrypting buyer shipping address`);
    const shippingResponse = await supabaseClient.functions.invoke("decrypt-address", {
      body: {
        table: "orders",
        target_id: order_id,
        address_type: "shipping",
      },
      headers: { Authorization: authHeader },
    });

    if (shippingResponse.error || !shippingResponse.data?.success) {
      throw new Error("Failed to decrypt buyer shipping address");
    }
    const shippingAddress = shippingResponse.data.data || {};

    // Get seller profile for contact info
    const { data: sellerProfile } = await supabaseClient
      .from("profiles")
      .select("id, full_name, name, email, phone_number")
      .eq("id", order.seller_id)
      .single();

    // Get buyer profile for contact info
    const { data: buyerProfile } = await supabaseClient
      .from("profiles")
      .select("id, full_name, name, email, phone_number")
      .eq("id", order.buyer_id)
      .single();

    const sellerName = (sellerProfile as any)?.full_name || (sellerProfile as any)?.name || "Seller";
    const buyerName = (buyerProfile as any)?.full_name || (buyerProfile as any)?.name || "Customer";

    // Prepare Bob Go rates request (match our bobgo-get-rates API)
    const fromAddress = {
      streetAddress: pickupAddress.streetAddress || pickupAddress.street_address || "",
      suburb: pickupAddress.local_area || pickupAddress.suburb || pickupAddress.city || "",
      city: pickupAddress.city || pickupAddress.local_area || pickupAddress.suburb || "",
      province: pickupAddress.province || pickupAddress.zone || "",
      postalCode: pickupAddress.postalCode || pickupAddress.postal_code || pickupAddress.code || "",
    };

    const toAddress = {
      streetAddress: shippingAddress.streetAddress || shippingAddress.street_address || "",
      suburb: shippingAddress.local_area || shippingAddress.suburb || shippingAddress.city || "",
      city: shippingAddress.city || shippingAddress.local_area || shippingAddress.suburb || "",
      province: shippingAddress.province || shippingAddress.zone || "",
      postalCode: shippingAddress.postalCode || shippingAddress.postal_code || shippingAddress.code || "",
    };

    const parcels = (items || []).map((item: any) => ({
      description: item?.title || "Book",
      weight: 1,
      length: 25,
      width: 20,
      height: 3,
      value: Number(item?.price) || 100,
    }));

    const declaredValue = parcels.reduce((sum, p) => sum + (p.value || 0), 0) || order.total_amount || order.amount || 0;

    console.log(`[commit-to-sale] Getting Bob Go rates`);
    const ratesResponse = await supabaseClient.functions.invoke("bobgo-get-rates", {
      body: { fromAddress, toAddress, parcels, declaredValue },
    });

    if (ratesResponse.error) {
      console.error("[commit-to-sale] Failed to get rates:", ratesResponse.error);
      throw new Error("Failed to get shipping rates");
    }

    const quotes: any[] = ratesResponse.data?.quotes || [];
    if (!Array.isArray(quotes) || quotes.length === 0) {
      throw new Error("No shipping quotes available");
    }

    // Select the most economical quote (handle different shapes)
    const selectedQuote = quotes
      .slice()
      .sort((a, b) => {
        const costA = typeof a.cost === "number" ? a.cost : (typeof a.rate_amount === "number" ? a.rate_amount : Infinity);
        const costB = typeof b.cost === "number" ? b.cost : (typeof b.rate_amount === "number" ? b.rate_amount : Infinity);
        return costA - costB;
      })[0];

    const providerName = selectedQuote.provider_name || selectedQuote.carrier || selectedQuote.provider || "bobgo";
    const serviceName = selectedQuote.service_level_name || selectedQuote.service_name || selectedQuote.service_level_code || "Standard";

    console.log(`[commit-to-sale] Selected quote: ${providerName} - ${serviceName}`);

    // Create shipment with Bob Go (match our create-shipment API)
    const shipmentPayload = {
      order_id,
      provider_slug: selectedQuote.provider_slug,
      service_level_code: selectedQuote.service_level_code,
      pickup_address: {
        company: sellerName,
        streetAddress: fromAddress.streetAddress,
        suburb: fromAddress.suburb,
        city: fromAddress.city,
        province: fromAddress.province,
        postalCode: fromAddress.postalCode,
        contact_name: sellerName,
        contact_phone: (sellerProfile as any)?.phone_number || "0000000000",
        contact_email: (sellerProfile as any)?.email || "seller@example.com",
      },
      delivery_address: {
        company: "",
        streetAddress: toAddress.streetAddress,
        suburb: toAddress.suburb,
        city: toAddress.city,
        province: toAddress.province,
        postalCode: toAddress.postalCode,
        contact_name: buyerName,
        contact_phone: (buyerProfile as any)?.phone_number || "0000000000",
        contact_email: order.buyer_email || (buyerProfile as any)?.email || "buyer@example.com",
      },
      parcels,
      reference: `ORDER-${order_id}`,
    };

    console.log(`[commit-to-sale] Creating Bob Go shipment`);
    const shipmentResponse = await supabaseClient.functions.invoke("bobgo-create-shipment", {
      body: shipmentPayload,
    });

    if (shipmentResponse.error) {
      console.error("[commit-to-sale] Failed to create shipment:", shipmentResponse.error);
      throw new Error("Failed to create shipment");
    }

    const shipmentData = shipmentResponse.data || {};
    console.log(`[commit-to-sale] Shipment created:`, shipmentData);

    // Update order with commitment and (minimal) shipment details
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        status: "committed",
        committed_at: new Date().toISOString(),
        delivery_status: "pickup_scheduled",
        tracking_number: shipmentData.tracking_number || order.tracking_number || null,
        delivery_data: {
          ...(order.delivery_data || {}),
          provider: providerName,
          provider_slug: selectedQuote.provider_slug,
          service_level: serviceName,
          service_level_code: selectedQuote.service_level_code,
          rate_amount: selectedQuote.cost ?? selectedQuote.rate_amount,
          shipment_id: shipmentData.shipment_id,
          waybill_url: shipmentData.waybill_url,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("[commit-to-sale] Failed to update order:", updateError);
      throw new Error("Failed to update order");
    }

    // Send emails
    const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Pickup Scheduled</title>
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
      <h1>🎉 Order Confirmed!</h1>
    </div>
    <h2>Great news, ${buyerName}!</h2>
    <p><strong>${sellerName}</strong> has confirmed your order and is preparing your book(s) for delivery.</p>
    <div class="info-box">
      <h3>📚 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Book(s):</strong> ${(items || []).map((item: any) => item.title || "Book").join(", ")}</p>
      <p><strong>Seller:</strong> ${sellerName}</p>
      <p><strong>Estimated Delivery:</strong> 2-3 business days</p>
    </div>
    <p>Happy reading! 📖</p>
    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br/>Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br/>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

    const sellerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Commitment Confirmed - Prepare for Pickup</title>
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
      <h1>Order Commitment Confirmed!</h1>
    </div>
    <h2>Thank you, ${sellerName}!</h2>
    <p>You've successfully committed to sell your book(s). The buyer has been notified and pickup has been scheduled.</p>
    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Book(s):</strong> ${(items || []).map((item: any) => item.title || "Book").join(", ")}</p>
      <p><strong>Buyer:</strong> ${buyerName}</p>
    </div>
    <p>A courier will contact you within 24 hours to arrange pickup.</p>
    <p>Thank you for selling with ReBooked Solutions! 📚</p>
    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br/>Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br/>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

    // Send email to buyer
    console.log(`[commit-to-sale] Sending buyer notification email`);
    await supabaseClient.functions.invoke("send-email", {
      body: { to: order.buyer_email || (buyerProfile as any)?.email, subject: "Order Confirmed - Pickup Scheduled", html: buyerHtml },
    });

    // Send email to seller
    console.log(`[commit-to-sale] Sending seller notification email`);
    if ((sellerProfile as any)?.email) {
      await supabaseClient.functions.invoke("send-email", {
        body: { to: (sellerProfile as any).email, subject: "Order Commitment Confirmed - Prepare for Pickup", html: sellerHtml },
      });
    }

    // Create notifications for both parties (use existing notifications table)
    const notificationsToInsert: any[] = [];
    if (order.buyer_id) {
      notificationsToInsert.push({
        user_id: order.buyer_id,
        type: "success",
        title: "Order Confirmed",
        message: `Your order has been confirmed and a shipment has been created. Tracking: ${shipmentData.tracking_number || "TBA"}`,
        order_id,
        action_required: false,
      });
    }
    if (order.seller_id) {
      notificationsToInsert.push({
        user_id: order.seller_id,
        type: "success",
        title: "Order Committed",
        message: `You have successfully committed to the order. Tracking: ${shipmentData.tracking_number || "TBA"}`,
        order_id,
        action_required: false,
      });
    }
    if (notificationsToInsert.length > 0) {
      try {
        await supabaseClient.from("notifications").insert(notificationsToInsert);
      } catch (notifErr) {
        console.warn("[commit-to-sale] Failed to create notifications:", notifErr);
      }
    }

    console.log(`[commit-to-sale] Order ${order_id} committed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order committed successfully",
        tracking_number: shipmentData.tracking_number,
        waybill_url: shipmentData.waybill_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[commit-to-sale] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
