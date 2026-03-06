import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: authError } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Get API settings
    const { data: apiUrlSetting } = await supabase.from("settings").select("value").eq("key", "api_url").single();
    const { data: apiTokenSetting } = await supabase.from("settings").select("value").eq("key", "api_token").single();

    const apiUrl = apiUrlSetting?.value ? String(apiUrlSetting.value).replace(/"/g, "") : "";
    const apiToken = apiTokenSetting?.value ? String(apiTokenSetting.value).replace(/"/g, "") : "";

    if (!apiUrl) {
      return new Response(JSON.stringify({ error: "API URL not configured. Go to Settings." }), { status: 400, headers: corsHeaders });
    }

    const body = await req.json();
    const { action, instanceId, data } = body;

    let endpoint = "";
    let method = "GET";
    let fetchBody: string | undefined;

    switch (action) {
      case "list_instances":
        endpoint = "/instances";
        break;
      case "create_instance":
        endpoint = "/instances";
        method = "POST";
        fetchBody = JSON.stringify(data);
        break;
      case "delete_instance":
        endpoint = `/instances/${instanceId}`;
        method = "DELETE";
        break;
      case "get_qr":
        endpoint = `/instances/${instanceId}/qr`;
        break;
      case "get_status":
        endpoint = `/instances/${instanceId}/status`;
        break;
      case "reconnect":
        endpoint = `/instances/${instanceId}/reconnect`;
        method = "POST";
        break;
      case "send_message":
        endpoint = `/instances/${instanceId}/send`;
        method = "POST";
        fetchBody = JSON.stringify(data);
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiToken) headers["Authorization"] = `Bearer ${apiToken}`;

    const response = await fetch(`${apiUrl}${endpoint}`, {
      method,
      headers,
      body: fetchBody,
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
