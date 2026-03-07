import { Router, Request, Response } from "express";
import { supabaseAdmin, baileysManager } from "../index.js";

export const messagesRouter = Router();

messagesRouter.post("/messages/send", async (req: Request, res: Response) => {
  const { instanceId, conversationId, to, content, mediaUrl, mediaType } = req.body;

  if (!instanceId || !to || (!content && !mediaUrl)) {
    return res.status(400).json({ error: "instanceId, to, e content/mediaUrl são obrigatórios" });
  }

  try {
    await baileysManager.sendMessage(instanceId, to, content || "", mediaUrl, mediaType);

    // Save to database
    if (conversationId) {
      await supabaseAdmin.from("messages").insert({
        conversation_id: conversationId,
        content: content || null,
        direction: "outbound",
        status: "sent",
        media_url: mediaUrl || null,
        media_type: mediaType || null,
      });

      await supabaseAdmin
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: content?.substring(0, 100) || `[${mediaType || "mensagem"}]`,
        })
        .eq("id", conversationId);
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
