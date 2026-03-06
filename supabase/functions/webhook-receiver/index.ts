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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { event, instanceId, data } = body;

    switch (event) {
      case "message": {
        const { from, message, timestamp } = data;
        const phone = from.replace("@s.whatsapp.net", "");

        // Find or create contact
        let { data: contact } = await supabase.from("contacts").select("id").eq("phone", phone).single();
        if (!contact) {
          const { data: newContact } = await supabase.from("contacts").insert({ name: phone, phone }).select("id").single();
          contact = newContact;
        }

        // Find or create conversation
        let { data: conversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("contact_id", contact!.id)
          .eq("instance_id", instanceId)
          .eq("status", "open")
          .single();

        if (!conversation) {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({ contact_id: contact!.id, instance_id: instanceId, status: "open" })
            .select("id")
            .single();
          conversation = newConv;
        }

        // Insert message
        await supabase.from("messages").insert({
          conversation_id: conversation!.id,
          content: message.text || "",
          media_url: message.mediaUrl || null,
          media_type: message.mediaType || null,
          direction: "inbound",
          status: "delivered",
          sender_name: data.pushName || phone,
          external_id: message.id,
        });

        // Update conversation
        await supabase.from("conversations").update({
          last_message_at: new Date().toISOString(),
          last_message_preview: message.text?.substring(0, 100) || "[mídia]",
          unread_count: (await supabase.from("conversations").select("unread_count").eq("id", conversation!.id).single()).data?.unread_count + 1,
        }).eq("id", conversation!.id);

        break;
      }

      case "message_status": {
        const { messageId, status } = data;
        await supabase.from("messages").update({ status }).eq("external_id", messageId);
        break;
      }

      case "instance_status": {
        const { status } = data;
        await supabase.from("instances").update({ status }).eq("id", instanceId);
        break;
      }

      case "qr_code": {
        const { qr } = data;
        await supabase.from("instances").update({ qr_code: qr, status: "qr_pending" }).eq("id", instanceId);
        break;
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
