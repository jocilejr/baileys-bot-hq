import { SupabaseClient } from "@supabase/supabase-js";
import { Logger } from "pino";
import { ParsedMessage } from "./baileys-manager.js";

export async function handleIncomingMessage(
  supabase: SupabaseClient,
  logger: Logger,
  data: ParsedMessage,
  isHistorySync: boolean
): Promise<void> {
  const {
    instanceId,
    chatType,
    fromMe,
    content,
    mediaType,
    senderName,
    externalId,
    timestamp,
    pushName,
    identifier,
    isLid,
  } = data;

  const direction = fromMe ? "outbound" : "inbound";

  try {
    // Skip duplicate messages by external_id
    if (externalId) {
      const { data: existing, error: dupErr } = await supabase
        .from("messages")
        .select("id")
        .eq("external_id", externalId)
        .maybeSingle();
      if (dupErr) logger.error(`Dup check error: ${JSON.stringify(dupErr)}`);
      if (existing) return;
    }

    // Find or create contact
    let { data: contact, error: contactErr } = await supabase
      .from("contacts")
      .select("id")
      .eq("phone", identifier)
      .eq("instance_id", instanceId)
      .single();
    if (contactErr && contactErr.code !== "PGRST116") {
      logger.error(`Contact select error: ${JSON.stringify(contactErr)}`);
    }

    // If not found and identifier is LID, try matching by pushName
    if (!contact && isLid && pushName && pushName !== identifier) {
      const { data: nameContact, error: nameErr } = await supabase
        .from("contacts")
        .select("id")
        .eq("name", pushName)
        .eq("instance_id", instanceId)
        .limit(1)
        .maybeSingle();
      if (nameErr) logger.error(`Contact name lookup error: ${JSON.stringify(nameErr)}`);
      if (nameContact) {
        contact = nameContact;
        logger.info(`LID matched by name: "${pushName}" -> ${nameContact.id}`);
      }
    }

    if (!contact) {
      const { data: newContact, error: insertErr } = await supabase
        .from("contacts")
        .insert({ phone: identifier, name: pushName, instance_id: instanceId })
        .select("id")
        .single();
      if (insertErr) logger.error(`Contact insert error: ${JSON.stringify(insertErr)}`);
      contact = newContact;
    }

    if (!contact) return;

    // Find or create conversation
    let { data: conversation, error: convErr } = await supabase
      .from("conversations")
      .select("id")
      .eq("contact_id", contact.id)
      .eq("instance_id", instanceId)
      .eq("chat_type", chatType)
      .single();
    if (convErr && convErr.code !== "PGRST116") {
      logger.error(`Conversation select error: ${JSON.stringify(convErr)}`);
    }

    if (!conversation) {
      const { data: newConv, error: insertErr } = await supabase
        .from("conversations")
        .insert({
          contact_id: contact.id,
          instance_id: instanceId,
          status: "open",
          chat_type: chatType,
        })
        .select("id")
        .single();
      if (insertErr) logger.error(`Conversation insert error: ${JSON.stringify(insertErr)}`);
      conversation = newConv;
    }

    if (!conversation) return;

    // Insert message
    const { error: msgErr } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      content: content || null,
      direction,
      status: fromMe ? "sent" : "delivered",
      sender_name: senderName,
      external_id: externalId,
      media_type: mediaType,
      created_at: timestamp,
    });
    if (msgErr) logger.error(`Message insert error: ${JSON.stringify(msgErr)}`);

    // Update conversation preview (only for real-time, not history sync)
    if (!isHistorySync) {
      const { error: updateErr } = await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: content?.substring(0, 100) || `[${mediaType || "mensagem"}]`,
          unread_count: fromMe ? 0 : (
            (await supabase
              .from("conversations")
              .select("unread_count")
              .eq("id", conversation.id)
              .single()
            ).data?.unread_count + 1 || 1
          ),
        })
        .eq("id", conversation.id);
      if (updateErr) logger.error(`Conversation update error: ${JSON.stringify(updateErr)}`);
    }
  } catch (err) {
    logger.error(`Error handling message: ${err}`);
  }
}
