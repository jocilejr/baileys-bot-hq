import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  proto,
} from "@whiskeysockets/baileys";
import { makeInMemoryStore } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as QRCode from "qrcode";
import { SupabaseClient } from "@supabase/supabase-js";
import { Logger } from "pino";
import { mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

interface Session {
  socket: WASocket;
  store: ReturnType<typeof makeInMemoryStore>;
  instanceId: string;
  retryCount: number;
}

const SESSIONS_DIR = join(process.cwd(), "sessions");

export class BaileysManager {
  private sessions = new Map<string, Session>();
  private supabase: SupabaseClient;
  private logger: Logger;
  private startingInstances = new Set<string>();
  private reconnectTimers = new Map<string, NodeJS.Timeout>();
  private intentionalStops = new Set<string>();

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
      this.intentionalStops.add(instanceId);
      const session = this.sessions.get(instanceId)!;
      session.socket.end(undefined);
      this.sessions.delete(instanceId);
      await new Promise(resolve => setTimeout(resolve, 500));
      this.intentionalStops.delete(instanceId);
    }

    const sessionDir = join(SESSIONS_DIR, instanceId);
    mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    // In-memory store per session — required for getMessage callback (retry decryption)
    const store = makeInMemoryStore({ logger: this.logger.child({ store: instanceId }) as any });

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
      keepAliveIntervalMs: 30000,
      syncFullHistory: false,
      shouldIgnoreJid: (jid: string | undefined | null) => !jid || jid === "status@broadcast" || jid.includes("@newsletter"),
      emitOwnEvents: true,
      fireInitQueries: true,
      retryRequestDelayMs: 600,
      maxMsgRetryCount: 3,
      defaultQueryTimeoutMs: 60_000,
      transactionOpts: { maxCommitRetries: 5, delayBetweenTriesMs: 1500 },
      getMessage: async (key) => {
        if (store) {
          const msg = await store.loadMessage(key.remoteJid!, key.id!);
          return msg?.message || undefined;
        }
        return proto.Message.fromObject({});
      },
    });

    // Bind store to socket events — MUST be called before any other ev handlers
    store.bind(socket.ev);

    const session: Session = { socket, store, instanceId, retryCount: 0 };
    this.sessions.set(instanceId, session);

    // contacts.update — log for debugging only
    socket.ev.on("contacts.update", (updates) => {
      this.logger.info(`contacts.update for ${instanceId}: ${updates.length} contacts`);
    });

    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
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
        this.startingInstances.delete(instanceId);
        const phone = socket.user?.id?.split(":")[0] || null;
        await this.supabase
          .from("instances")
          .update({ status: "connected", qr_code: null, phone })
          .eq("id", instanceId);
        this.logger.info(`Instance ${instanceId} connected (${phone})`);
      }

      if (connection === "close") {
        this.startingInstances.delete(instanceId);
        
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
          if (existsSync(sessionDir)) rmSync(sessionDir, { recursive: true });
          this.logger.info(`Instance ${instanceId} logged out`);
        } else {
          await this.supabase
            .from("instances")
            .update({ status: "connecting" })
            .eq("id", instanceId);

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

    // Helper: determine chat type from JID
    const getChatType = (jid: string): "private" | "group" => {
      return jid.includes("@g.us") ? "group" : "private";
    };

    // Helper: unwrap nested message wrappers (Baileys v6)
    const unwrapMessage = (message: proto.IMessage | null | undefined): proto.IMessage | null => {
      if (!message) return null;
      if (message.ephemeralMessage?.message) return unwrapMessage(message.ephemeralMessage.message);
      if (message.viewOnceMessage?.message) return unwrapMessage(message.viewOnceMessage.message);
      if (message.viewOnceMessageV2?.message) return unwrapMessage(message.viewOnceMessageV2.message);
      if (message.viewOnceMessageV2Extension?.message) return unwrapMessage(message.viewOnceMessageV2Extension.message);
      if (message.documentWithCaptionMessage?.message) return unwrapMessage(message.documentWithCaptionMessage.message);
      if (message.editedMessage?.message) return unwrapMessage(message.editedMessage.message);
      return message;
    };

    // Helper: process and save a single message
    const processMessage = async (msg: proto.IWebMessageInfo, isHistorySync: boolean) => {
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid === "status@broadcast") return;
      if (remoteJid.includes("@newsletter")) return;

      const chatType = getChatType(remoteJid);
      const isFromMe = msg.key.fromMe === true;
      
      // Resolve LID (@lid) to real phone number
      let identifier: string = remoteJid.replace(/@.*$/, "");
      const isLid = remoteJid.includes("@lid");
      
      if (chatType === "private" && isLid) {
        const lidNumber = identifier;
        const participant = msg.key.participant;
        if (participant && participant.includes("@s.whatsapp.net")) {
          identifier = participant.replace(/@.*$/, "");
          this.logger.info(`LID resolved via participant: ${lidNumber} -> ${identifier}`);
        } else if (msg.pushName && msg.pushName !== lidNumber) {
          this.logger.info(`LID unresolved, using pushName "${msg.pushName}" for matching: ${lidNumber}`);
        } else {
          this.logger.warn(`LID unresolved, storing raw: ${lidNumber}`);
        }
      }
      
      const pushName = msg.pushName || identifier;

      this.logger.info(`processMessage: jid=${remoteJid}, chatType=${chatType}, fromMe=${isFromMe}`);
      const direction = isFromMe ? "outbound" : "inbound";

      const senderName = chatType === "group" 
        ? (msg.key.participant ? (msg.pushName || msg.key.participant.replace(/@.*$/, "")) : null)
        : (isFromMe ? null : pushName);

      // Unwrap nested message wrappers
      const unwrapped = unwrapMessage(msg.message);

      const content = unwrapped?.conversation
        || unwrapped?.extendedTextMessage?.text
        || unwrapped?.imageMessage?.caption
        || unwrapped?.videoMessage?.caption
        || "";

      let mediaType: string | null = null;
      if (unwrapped?.imageMessage) mediaType = "image";
      else if (unwrapped?.videoMessage) mediaType = "video";
      else if (unwrapped?.audioMessage) mediaType = "audio";
      else if (unwrapped?.documentMessage) mediaType = "document";
      else if (unwrapped?.stickerMessage) mediaType = "sticker";

      // Skip protocol/system messages with no content
      if (!content && !mediaType) {
        const msgKeys = Object.keys(msg.message || {}).join(", ");
        this.logger.debug(`Skipping message ${msg.key.id}: no content/media. Raw keys: [${msgKeys}]`);
        return;
      }

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
          const { data: existing, error: dupErr } = await this.supabase
            .from("messages")
            .select("id")
            .eq("external_id", externalId)
            .maybeSingle();
          if (dupErr) this.logger.error(`Supabase dup check error: ${JSON.stringify(dupErr)}`);
          if (existing) return;
        }

        // Find or create contact
        let { data: contact, error: contactErr } = await this.supabase
          .from("contacts")
          .select("id")
          .eq("phone", identifier)
          .eq("instance_id", instanceId)
          .single();
        if (contactErr && contactErr.code !== "PGRST116") {
          this.logger.error(`Supabase contact select error: ${JSON.stringify(contactErr)}`);
        }

        // If not found and identifier looks like a LID, try finding by pushName
        if (!contact && isLid && pushName && pushName !== identifier) {
          const { data: nameContact, error: nameErr } = await this.supabase
            .from("contacts")
            .select("id")
            .eq("name", pushName)
            .eq("instance_id", instanceId)
            .limit(1)
            .maybeSingle();
          if (nameErr) this.logger.error(`Supabase contact name lookup error: ${JSON.stringify(nameErr)}`);
          if (nameContact) {
            contact = nameContact;
            this.logger.info(`LID contact matched by name: "${pushName}" -> ${nameContact.id}`);
          }
        }

        if (!contact) {
          const { data: newContact, error: insertContactErr } = await this.supabase
            .from("contacts")
            .insert({ phone: identifier, name: pushName, instance_id: instanceId })
            .select("id")
            .single();
          if (insertContactErr) this.logger.error(`Supabase contact insert error: ${JSON.stringify(insertContactErr)}`);
          contact = newContact;
        }

        if (!contact) return;

        // Find or create conversation
        let { data: conversation, error: convErr } = await this.supabase
          .from("conversations")
          .select("id")
          .eq("contact_id", contact.id)
          .eq("instance_id", instanceId)
          .eq("chat_type", chatType)
          .single();
        if (convErr && convErr.code !== "PGRST116") {
          this.logger.error(`Supabase conversation select error: ${JSON.stringify(convErr)}`);
        }

        if (!conversation) {
          const { data: newConv, error: insertConvErr } = await this.supabase
            .from("conversations")
            .insert({
              contact_id: contact.id,
              instance_id: instanceId,
              status: "open",
              chat_type: chatType,
            })
            .select("id")
            .single();
          if (insertConvErr) this.logger.error(`Supabase conversation insert error: ${JSON.stringify(insertConvErr)}`);
          conversation = newConv;
        }

        if (!conversation) return;

        // Insert message
        const messageData: any = {
          conversation_id: conversation.id,
          content: content || null,
          direction,
          status: isFromMe ? "sent" : "delivered",
          sender_name: senderName,
          external_id: externalId,
          media_type: mediaType,
          created_at: createdAt || new Date().toISOString(),
        };

        const { error: msgInsertErr } = await this.supabase.from("messages").insert(messageData);
        if (msgInsertErr) this.logger.error(`Supabase message insert error: ${JSON.stringify(msgInsertErr)}`);

        // Update conversation preview
        if (!isHistorySync) {
          const { error: updateErr } = await this.supabase
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
          if (updateErr) this.logger.error(`Supabase conversation update error: ${JSON.stringify(updateErr)}`);
        }
      } catch (err) {
        this.logger.error(`Error processing message: ${err}`);
      }
    };

    // Incoming messages (real-time + append)
    socket.ev.on("messages.upsert", async ({ messages, type }) => {
      this.logger.info(`>>> UPSERT EVENT for ${instanceId}: ${messages.length} msgs, type=${type}`);

      for (const msg of messages) {
        const jid = msg.key.remoteJid || "";
        const rawKeys = Object.keys(msg.message || {}).join(",");
        this.logger.info(`MSG RAW: jid=${jid}, id=${msg.key.id}, fromMe=${msg.key.fromMe}, type=${type}, keys=${rawKeys}`);
        await processMessage(msg, type !== "notify");
      }
    });

    // Capture decrypted content that arrives after initial empty upsert (retry decryption)
    socket.ev.on("messages.update", async (updates) => {
      for (const { key, update } of updates) {
        if (!key.remoteJid || !(update as any).message) continue;

        const updMsg = update as any;
        this.logger.info(`MSG UPDATE (retry decrypt): jid=${key.remoteJid}, id=${key.id}, keys=${Object.keys(updMsg.message || {}).join(",")}`);

        const fullMsg: proto.IWebMessageInfo = {
          key,
          message: updMsg.message,
          messageTimestamp: updMsg.messageTimestamp || Math.floor(Date.now() / 1000),
          pushName: updMsg.pushName || undefined,
        };

        await processMessage(fullMsg, false);
      }
    });
  }

  async stopSession(instanceId: string): Promise<void> {
    this.intentionalStops.add(instanceId);
    
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
