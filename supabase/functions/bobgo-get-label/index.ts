import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyResult = await parseRequestBody<{ shipment_id?: string; tracking_number?: string }>(req, corsHeaders);
    if (!bodyResult.success) return bodyResult.errorResponse!;

    const { shipment_id, tracking_number } = bodyResult.data!;

    console.log("Label request:", { shipment_id, tracking_number });

    if (!shipment_id && !tracking_number) {
      return new Response(
        JSON.stringify({ success: false, error: "shipment_id or tracking_number required" }),
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

    const identifier = shipment_id || tracking_number!;

    if (!BOBGO_API_KEY) {
      console.warn("No BOBGO_API_KEY - returning simulated label");
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          waybill_url: `https://example.com/labels/${identifier}.pdf`,
          message: "Simulated waybill - API key not configured"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      console.log("Fetching label for:", identifier);
      const params = new URLSearchParams({ tracking_references: JSON.stringify([identifier]) });
      const resp = await fetch(`${BOBGO_BASE_URL}/shipments/waybill?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${BOBGO_API_KEY}`,
          Accept: "application/pdf, application/json",
        },
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        console.error("BobGo label HTTP error:", resp.status, text);
        throw new Error(`BobGo label HTTP ${resp.status}: ${text}`);
      }

      const contentType = resp.headers.get("content-type") || "";
      console.log("Response content type:", contentType);

      if (contentType.includes("application/pdf")) {
        const arrayBuffer = await resp.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        console.log("Received PDF label, size:", arrayBuffer.byteLength);

        return new Response(
          JSON.stringify({
            success: true,
            waybill_base64: base64,
            content_type: "application/pdf",
            tracking_reference: identifier
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (contentType.includes("application/json")) {
        const json = await resp.json();
        console.log("Received JSON response:", json);

        return new Response(
          JSON.stringify({
            success: true,
            waybill_url: json.waybill_download_url || json.url || json.download_url,
            tracking_reference: identifier,
            raw: json
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        throw new Error(`Unexpected content type: ${contentType}`);
      }
    } catch (err: any) {
      console.error("bobgo-get-label error:", err);
      return new Response(
        JSON.stringify({ success: false, error: err.message || "Failed to get label" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("bobgo-get-label fatal:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
