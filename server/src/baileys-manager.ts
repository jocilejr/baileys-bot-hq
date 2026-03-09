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
    });

    const session: Session = { socket, instanceId, retryCount: 0 };
    this.sessions.set(instanceId, session);


    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrDataUrl = await QRCode.toDataURL(qr, { width: 400, margin: 2, errorCorrectionLevel: 'M' });
        await this.supabase
          .from("instances")
          .update({ qr_code: qrDataUrl, status: "qr_pending" })
          .eq("id", instanceId);
        this.logger.info(`QR generated for ${instanceId} (size: ${qrDataUrl.length} bytes)`);
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

    // Incoming messages
    socket.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (msg.key.fromMe) continue;
        
        const remoteJid = msg.key.remoteJid;
        if (!remoteJid || remoteJid === "status@broadcast") continue;

        const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
        const pushName = msg.pushName || phone;
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

        try {
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

          if (!contact) continue;

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

          if (!conversation) continue;

          // Insert message
          await this.supabase.from("messages").insert({
            conversation_id: conversation.id,
            content: content || null,
            direction: "inbound",
            status: "delivered",
            sender_name: pushName,
            external_id: msg.key.id || null,
            media_type: mediaType,
          });

          // Update conversation
          await this.supabase
            .from("conversations")
            .update({
              last_message_at: new Date().toISOString(),
              last_message_preview: content?.substring(0, 100) || `[${mediaType || "mensagem"}]`,
              unread_count: (await this.supabase
                .from("conversations")
                .select("unread_count")
                .eq("id", conversation.id)
                .single()
              ).data?.unread_count + 1 || 1,
            })
            .eq("id", conversation.id);

        } catch (err) {
          this.logger.error(`Error processing message: ${err}`);
        }
      }
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
