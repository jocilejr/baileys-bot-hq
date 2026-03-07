import { Router, Request, Response } from "express";
import { baileysManager } from "../index.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req: Request, res: Response) => {
  const activeSessions = baileysManager.getActiveSessions();
  res.json({
    status: "online",
    uptime: process.uptime(),
    activeSessions: activeSessions.length,
    sessions: activeSessions,
  });
});
