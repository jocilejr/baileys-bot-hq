import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as QRCode from "qrcode";
import { SupabaseClient } from "@supabase/supabase-js";
import { Logger } from "pino";
import { mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

interface Session {
  socket: WASocket;
  instanceId: string;
  retryCount: number;
}

const SESSIONS_DIR = join(process.cwd(), "sessions");

export class BaileysManager {
  private sessions = new Map<string, Session>();
  private supabase: SupabaseClient;
  private logger: Logger;
  private startingInstances = new Set<string>(); // Mutex para prevenir chamadas concorrentes
  private reconnectTimers = new Map<string, NodeJS.Timeout>(); // Rastrear timers de reconexão
  private intentionalStops = new Set<string>(); // Rastrear paradas intencionais

  constructor(supabase: SupabaseClient, logger: Logger) {
    this.supabase = supabase;
    this.logger = logger;
    mkdirSync(SESSIONS_DIR, { recursive: true });
  }

  async startSession(instanceId: string): Promise<void> {
    // Mutex: evitar chamadas concorrentes para a mesma instância
    if (this.startingInstances.has(instanceId)) {
      this.logger.info(`Session ${instanceId} already starting, ignoring duplicate call`);
      return;
    }
    this.startingInstances.add(instanceId);

    // Cancelar qualquer timer de reconexão pendente
    const existingTimer = this.reconnectTimers.get(instanceId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.reconnectTimers.delete(instanceId);
    }

    // Limpar flag de parada intencional
    this.intentionalStops.delete(instanceId);

    if (this.sessions.has(instanceId)) {
      this.logger.info(`Session ${instanceId} already active, stopping first...`);
      // Marcar como intencional para não disparar reconexão automática
      this.intentionalStops.add(instanceId);
      const session = this.sessions.get(instanceId)!;
      session.socket.end(undefined);
      this.sessions.delete(instanceId);
      // Aguardar socket fechar completamente
      await new Promise(resolve => setTimeout(resolve, 500));
      this.intentionalStops.delete(instanceId);
    }

    const sessionDir = join(SESSIONS_DIR, instanceId);
    mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.logger as any),
      },
      printQRInTerminal: false,
      logger: this.logger.child({ instance: instanceId }) as any,
      generateHighQualityLinkPreview: true,
      browser: ["ZapManager", "Chrome", "120.0.0"],
      qrTimeout: 60000,
      syncFullHistory: true,
    });

    const session: Session = { socket, instanceId, retryCount: 0 };
    this.sessions.set(instanceId, session);


    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          // Store raw QR string instead of data URL - frontend will render it
          await this.supabase
            .from("instances")
            .update({ qr_code: qr, status: "qr_pending" })
            .eq("id", instanceId);
          this.logger.info(`QR raw string saved for ${instanceId} (length: ${qr.length})`);
        } catch (qrErr) {
          this.logger.error(`Failed to save QR for ${instanceId}: ${qrErr}`);
        }
      }

      if (connection === "open") {
        session.retryCount = 0;
        this.startingInstances.delete(instanceId); // Liberar mutex
        const phone = socket.user?.id?.split(":")[0] || null;
        await this.supabase
          .from("instances")
          .update({ status: "connected", qr_code: null, phone })
          .eq("id", instanceId);
        this.logger.info(`Instance ${instanceId} connected (${phone})`);
      }

      if (connection === "close") {
        this.startingInstances.delete(instanceId); // Liberar mutex
        
        // Se foi parada intencional, não reconectar
        if (this.intentionalStops.has(instanceId)) {
          this.logger.info(`Instance ${instanceId} closed intentionally, no reconnect`);
          this.intentionalStops.delete(instanceId);
          return;
        }

        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (loggedOut) {
          await this.supabase
            .from("instances")
            .update({ status: "disconnected", qr_code: null, phone: null })
            .eq("id", instanceId);
          this.sessions.delete(instanceId);
          // Clean session files
          if (existsSync(sessionDir)) rmSync(sessionDir, { recursive: true });
          this.logger.info(`Instance ${instanceId} logged out`);
        } else {
          await this.supabase
            .from("instances")
            .update({ status: "connecting" })
            .eq("id", instanceId);

          // Reconnect with exponential backoff
          session.retryCount++;
          const delay = Math.min(session.retryCount * 2000, 30000);
          this.logger.info(`Reconnecting ${instanceId} in ${delay}ms (attempt ${session.retryCount})`);
          
          const timer = setTimeout(() => {
            this.reconnectTimers.delete(instanceId);
            this.startSession(instanceId);
          }, delay);
          this.reconnectTimers.set(instanceId, timer);
        }
      }
    });

    // Save credentials
    socket.ev.on("creds.update", saveCreds);

    // Helper: check if JID is a private chat (not group, newsletter, or lid)
    const isPrivateChat = (jid: string): boolean => {
      return jid.endsWith("@s.whatsapp.net") && !jid.includes("@g.us") && !jid.includes("@newsletter") && !jid.includes("@lid");
    };

    // Helper: process and save a single message
    const processMessage = async (msg: proto.IWebMessageInfo, isHistorySync: boolean) => {
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid === "status@broadcast") return;

      // Only process private chats
      if (!isPrivateChat(remoteJid)) return;

      const isFromMe = msg.key.fromMe === true;
      const phone = remoteJid.replace("@s.whatsapp.net", "");
      const pushName = msg.pushName || phone;
      const direction = isFromMe ? "outbound" : "inbound";

      const content = msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || msg.message?.imageMessage?.caption
        || msg.message?.videoMessage?.caption
        || "";

      let mediaType: string | null = null;
      if (msg.message?.imageMessage) mediaType = "image";
      else if (msg.message?.videoMessage) mediaType = "video";
      else if (msg.message?.audioMessage) mediaType = "audio";
      else if (msg.message?.documentMessage) mediaType = "document";
      else if (msg.message?.stickerMessage) mediaType = "sticker";

      // Skip protocol/system messages with no content
      if (!content && !mediaType) return;

      const externalId = msg.key.id || null;

      // Convert messageTimestamp to ISO string
      let createdAt: string | undefined;
      if (msg.messageTimestamp) {
        const ts = typeof msg.messageTimestamp === "number"
          ? msg.messageTimestamp
          : Number(msg.messageTimestamp);
        if (ts > 0) {
          createdAt = new Date(ts * 1000).toISOString();
        }
      }

      try {
        // Skip duplicate messages by external_id
        if (externalId) {
          const { data: existing } = await this.supabase
            .from("messages")
            .select("id")
            .eq("external_id", externalId)
            .maybeSingle();
          if (existing) return;
        }

        // Find or create contact
        let { data: contact } = await this.supabase
          .from("contacts")
          .select("id")
          .eq("phone", phone)
          .eq("instance_id", instanceId)
          .single();

        if (!contact) {
          const { data: newContact } = await this.supabase
            .from("contacts")
            .insert({ phone, name: pushName, instance_id: instanceId })
            .select("id")
            .single();
          contact = newContact;
        }

        if (!contact) return;

        // Find or create conversation
        let { data: conversation } = await this.supabase
          .from("conversations")
          .select("id")
          .eq("contact_id", contact.id)
          .eq("instance_id", instanceId)
          .single();

        if (!conversation) {
          const { data: newConv } = await this.supabase
            .from("conversations")
            .insert({
              contact_id: contact.id,
              instance_id: instanceId,
              status: "open",
            })
            .select("id")
            .single();
          conversation = newConv;
        }

        if (!conversation) return;

        // Insert message with correct timestamp
        const messageData: any = {
          conversation_id: conversation.id,
          content: content || null,
          direction,
          status: isFromMe ? "sent" : "delivered",
          sender_name: isFromMe ? null : pushName,
          external_id: externalId,
          media_type: mediaType,
        };
        if (createdAt) {
          messageData.created_at = createdAt;
        }

        await this.supabase.from("messages").insert(messageData);

        // Update conversation preview (only for real-time messages, not history sync)
        if (!isHistorySync) {
          await this.supabase
            .from("conversations")
            .update({
              last_message_at: new Date().toISOString(),
              last_message_preview: content?.substring(0, 100) || `[${mediaType || "mensagem"}]`,
              unread_count: isFromMe ? 0 : (
                (await this.supabase
                  .from("conversations")
                  .select("unread_count")
                  .eq("id", conversation.id)
                  .single()
                ).data?.unread_count + 1 || 1
              ),
            })
            .eq("id", conversation.id);
        }
      } catch (err) {
        this.logger.error(`Error processing message: ${err}`);
      }
    };

    // Incoming messages (real-time)
    socket.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        await processMessage(msg, false);
      }
    });

    // Historical messages sync
    socket.ev.on("messaging-history.set", async ({ messages, isLatest }) => {
      this.logger.info(`History sync for ${instanceId}: ${messages.length} messages (isLatest: ${isLatest})`);
      
      for (const msg of messages) {
        await processMessage(msg, true);
      }
      
      this.logger.info(`History sync completed for ${instanceId}`);
    });
  }

  async stopSession(instanceId: string): Promise<void> {
    this.intentionalStops.add(instanceId); // Marcar como parada intencional
    
    // Cancelar timer de reconexão pendente, se existir
    const timer = this.reconnectTimers.get(instanceId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(instanceId);
    }

    const session = this.sessions.get(instanceId);
    if (session) {
      session.socket.end(undefined);
      this.sessions.delete(instanceId);
      await this.supabase
        .from("instances")
        .update({ status: "disconnected" })
        .eq("id", instanceId);
    }
  }

  async sendMessage(instanceId: string, to: string, content: string, mediaUrl?: string, mediaType?: string): Promise<void> {
    const session = this.sessions.get(instanceId);
    if (!session) throw new Error("Instância não conectada");

    const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;

    if (mediaType === "image" && mediaUrl) {
      await session.socket.sendMessage(jid, { image: { url: mediaUrl }, caption: content || undefined });
    } else if (mediaType === "video" && mediaUrl) {
      await session.socket.sendMessage(jid, { video: { url: mediaUrl }, caption: content || undefined });
    } else if (mediaType === "audio" && mediaUrl) {
      await session.socket.sendMessage(jid, { audio: { url: mediaUrl }, mimetype: "audio/ogg; codecs=opus", ptt: true });
    } else if (mediaType === "document" && mediaUrl) {
      await session.socket.sendMessage(jid, { document: { url: mediaUrl }, mimetype: "application/pdf", fileName: "documento.pdf" });
    } else {
      await session.socket.sendMessage(jid, { text: content });
    }
  }

  getStatus(instanceId: string): { connected: boolean; hasSession: boolean } {
    const session = this.sessions.get(instanceId);
    return {
      connected: !!session,
      hasSession: existsSync(join(SESSIONS_DIR, instanceId)),
    };
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}
