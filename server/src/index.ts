import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { instancesRouter } from "./routes/instances.js";
import { messagesRouter } from "./routes/messages.js";
import { healthRouter } from "./routes/health.js";
import { BaileysManager } from "./baileys-manager.js";
import pino from "pino";

const logger = pino({ level: "info" });

const app = express();
const port = parseInt(process.env.PORT || "3001");

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const baileysManager = new BaileysManager(supabaseAdmin, logger);

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "50mb" }));

// Auth middleware — validates Supabase JWT
app.use("/api", async (req, res, next) => {
  if (req.path === "/health") return next();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: "Token inválido" });
  }

  (req as any).user = data.user;
  next();
});

// Routes
app.use("/api", healthRouter);
app.use("/api", instancesRouter);
app.use("/api", messagesRouter);

// Auto-start saved sessions
async function autoStartSessions() {
  const { data: instances } = await supabaseAdmin
    .from("instances")
    .select("id")
    .in("status", ["connected", "connecting"]);

  if (instances?.length) {
    logger.info(`Auto-starting ${instances.length} session(s)...`);
    for (const inst of instances) {
      try {
        await baileysManager.startSession(inst.id);
      } catch (e) {
        logger.error(`Failed to auto-start ${inst.id}: ${e}`);
      }
    }
  }
}

app.listen(port, () => {
  logger.info(`ZapManager API running on port ${port}`);
  autoStartSessions();
});
