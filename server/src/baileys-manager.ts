import { EventEmitter } from "events";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { SupabaseClient } from "@supabase/supabase-js";
import { Logger } from "pino";
import { mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

export interface ParsedMessage {
  instanceId: string;
  remoteJid: string;
  chatType: "private" | "group";
  fromMe: boolean;
  content: string;
  mediaType: string | null;
  senderName: string | null;
  externalId: string | null;
  timestamp: string;
  pushName: string;
  identifier: string;
  isLid: boolean;
}

interface Session {
  socket: WASocket;
  instanceId: string;
  retryCount: number;
}

const SESSIONS_DIR = join(process.cwd(), "sessions");

export class BaileysManager extends EventEmitter {
  private sessions = new Map<string, Session>();
  private supabase: SupabaseClient;
  private logger: Logger;
  private startingInstances = new Set<string>();
  private reconnectTimers = new Map<string, NodeJS.Timeout>();
  private intentionalStops = new Set<string>();

  constructor(supabase: SupabaseClient, logger: Logger) {
    super();
    this.supabase = supabase;
    this.logger = logger;
    mkdirSync(SESSIONS_DIR, { recursive: true });
  }

  // --- Helpers for parsing messages ---

  private getChatType(jid: string): "private" | "group" {
    return jid.includes("@g.us") ? "group" : "private";
  }

  private unwrapMessage(message: proto.IMessage | null | undefined): proto.IMessage | null {
    if (!message) return null;
    if (message.ephemeralMessage?.message) return this.unwrapMessage(message.ephemeralMessage.message);
    if (message.viewOnceMessage?.message) return this.unwrapMessage(message.viewOnceMessage.message);
    if (message.viewOnceMessageV2?.message) return this.unwrapMessage(message.viewOnceMessageV2.message);
    if (message.viewOnceMessageV2Extension?.message) return this.unwrapMessage(message.viewOnceMessageV2Extension.message);
    if (message.documentWithCaptionMessage?.message) return this.unwrapMessage(message.documentWithCaptionMessage.message);
    if (message.editedMessage?.message) return this.unwrapMessage(message.editedMessage.message);
    return message;
  }

  private parseMessage(msg: proto.IWebMessageInfo, instanceId: string): ParsedMessage | null {
    const remoteJid = msg.key.remoteJid;
    if (!remoteJid || remoteJid === "status@broadcast") return null;
    if (remoteJid.includes("@newsletter")) return null;

    const chatType = this.getChatType(remoteJid);
    const isFromMe = msg.key.fromMe === true;

    let identifier: string = remoteJid.replace(/@.*$/, "");
    const isLid = remoteJid.includes("@lid");

    if (chatType === "private" && isLid) {
      const participant = msg.key.participant;
      if (participant && participant.includes("@s.whatsapp.net")) {
        identifier = participant.replace(/@.*$/, "");
      }
    }

    const pushName = msg.pushName || identifier;

    const senderName = chatType === "group"
      ? (msg.key.participant ? (msg.pushName || msg.key.participant.replace(/@.*$/, "")) : null)
      : (isFromMe ? null : pushName);

    const unwrapped = this.unwrapMessage(msg.message);

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

    if (!content && !mediaType) return null;

    let timestamp: string;
    if (msg.messageTimestamp) {
      const ts = typeof msg.messageTimestamp === "number"
        ? msg.messageTimestamp
        : Number(msg.messageTimestamp);
      timestamp = ts > 0 ? new Date(ts * 1000).toISOString() : new Date().toISOString();
    } else {
      timestamp = new Date().toISOString();
    }

    return {
      instanceId,
      remoteJid,
      chatType,
      fromMe: isFromMe,
      content,
      mediaType,
      senderName,
      externalId: msg.key.id || null,
      timestamp,
      pushName,
      identifier,
      isLid,
    };
  }

  // --- Session management ---

  async startSession(instanceId: string): Promise<void> {
    if (this.startingInstances.has(instanceId)) {
      this.logger.info(`Session ${instanceId} already starting, ignoring`);
      return;
    }
    this.startingInstances.add(instanceId);

    const existingTimer = this.reconnectTimers.get(instanceId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.reconnectTimers.delete(instanceId);
    }

    this.intentionalStops.delete(instanceId);

    if (this.sessions.has(instanceId)) {
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
      getMessage: async () => proto.Message.fromObject({}),
    });

    const session: Session = { socket, instanceId, retryCount: 0 };
    this.sessions.set(instanceId, session);

    // Connection management
    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          await this.supabase
            .from("instances")
            .update({ qr_code: qr, status: "qr_pending" })
            .eq("id", instanceId);
          this.logger.info(`QR saved for ${instanceId}`);
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
          this.logger.info(`Instance ${instanceId} closed intentionally`);
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

    socket.ev.on("creds.update", saveCreds);

    // Messages: parse and emit — NO persistence here
    socket.ev.on("messages.upsert", async ({ messages, type }) => {
      this.logger.info(`messages.upsert for ${instanceId}: ${messages.length} msgs, type=${type}`);

      for (const msg of messages) {
        const parsed = this.parseMessage(msg, instanceId);
        if (parsed) {
          this.emit("message.received", parsed, type !== "notify");
        }
      }
    });

    socket.ev.on("messages.update", async (updates) => {
      for (const { key, update } of updates) {
        if (!key.remoteJid || !(update as any).message) continue;

        const updMsg = update as any;
        const fullMsg: proto.IWebMessageInfo = {
          key,
          message: updMsg.message,
          messageTimestamp: updMsg.messageTimestamp || Math.floor(Date.now() / 1000),
          pushName: updMsg.pushName || undefined,
        };

        const parsed = this.parseMessage(fullMsg, instanceId);
        if (parsed) {
          this.emit("message.received", parsed, false);
        }
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
