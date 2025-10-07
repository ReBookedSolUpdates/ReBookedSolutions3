import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyResult = await parseRequestBody<{
      order_id?: string;
      shipment_id?: string;
      tracking_number?: string;
      reason?: string;
    }>(req, corsHeaders);
    if (!bodyResult.success) return bodyResult.errorResponse!;

    const { order_id, shipment_id, tracking_number, reason } = bodyResult.data!;

    console.log("Cancel request:", { order_id, shipment_id, tracking_number, reason });

    if (!order_id && !shipment_id && !tracking_number) {
      return new Response(
        JSON.stringify({ success: false, error: "order_id, shipment_id, or tracking_number required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const BOBGO_API_KEY = Deno.env.get("BOBGO_API_KEY");

    function resolveBaseUrl() {
      const env = (Deno.env.get("BOBGO_BASE_URL") || "").trim().replace(/\/+$/, "");
      if (!env) return "https://api.bobgo.co.za/v2";
      if (env.includes("sandbox.bobgo.co.za") && !env.includes("api.sandbox.bobgo.co.za")) {
        return "https://api.sandbox.bobgo.co.za/v2";
      }
      if (env.includes("bobgo.co.za") && !/\/v2$/.test(env)) {
        return env + "/v2";
      }
      return env;
    }

    const BOBGO_BASE_URL = resolveBaseUrl();
    console.log("Using BobGo URL:", BOBGO_BASE_URL);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let identifier = shipment_id || tracking_number || null;
    if (!identifier && order_id) {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("tracking_number, delivery_data")
        .eq("id", order_id)
        .single();

      if (orderError) {
        console.error("Error fetching order:", orderError);
      }

      if (order) {
        identifier = order.tracking_number || order.delivery_data?.shipment_id || null;
        console.log("Found identifier from order:", identifier);
      }
    }

    if (!BOBGO_API_KEY) {
      console.warn("No BOBGO_API_KEY - simulating cancellation");
      if (order_id) {
        await supabase
          .from("orders")
          .update({
            status: "cancelled",
            cancellation_reason: reason || "manual",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", order_id);
      }
      return new Response(
        JSON.stringify({ success: true, simulated: true, message: "Simulated cancellation - API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!identifier) {
      return new Response(
        JSON.stringify({ success: false, error: "Unable to determine shipment identifier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      console.log("Cancelling shipment:", identifier);
      const resp = await fetch(`${BOBGO_BASE_URL}/shipments/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BOBGO_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          tracking_reference: identifier,
          cancellation_reason: reason || "Cancelled by merchant",
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        console.error("BobGo cancel HTTP error:", resp.status, text);
        throw new Error(`BobGo cancel HTTP ${resp.status}: ${text}`);
      }

      const data = await resp.json();
      console.log("Cancellation response:", data);

      if (order_id) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "cancelled",
            cancellation_reason: reason || "Cancelled via API",
            cancelled_at: new Date().toISOString(),
            delivery_data: { cancellation_response: data },
            updated_at: new Date().toISOString(),
          })
          .eq("id", order_id);

        if (updateError) {
          console.error("Error updating order:", updateError);
        }
      } else if (identifier) {
        const { data: orders } = await supabase
          .from("orders")
          .select("id")
          .eq("tracking_number", identifier)
          .limit(1);
        if (orders && orders.length > 0) {
          await supabase
            .from("orders")
            .update({
              status: "cancelled",
              cancellation_reason: reason || "Cancelled via API",
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", orders[0].id);
        }
      }

      return new Response(
        JSON.stringify({ success: true, result: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      console.error("bobgo-cancel-shipment error:", err);
      return new Response(
        JSON.stringify({ success: false, error: err.message || "Cancel failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("bobgo-cancel-shipment fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
