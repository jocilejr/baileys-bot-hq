import { Router, Request, Response } from "express";
import { supabaseAdmin, baileysManager } from "../index.js";

export const instancesRouter = Router();

instancesRouter.get("/instances", async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("instances")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

instancesRouter.post("/instances", async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

  const userId = (req as any).user?.id;

  const { data, error } = await supabaseAdmin
    .from("instances")
    .insert({ name, created_by: userId })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Start Baileys session
  try {
    await baileysManager.startSession(data.id);
  } catch (e: any) {
    console.error("Failed to start session:", e);
  }

  res.json(data);
});

instancesRouter.delete("/instances/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  await baileysManager.stopSession(id);

  const { error } = await supabaseAdmin.from("instances").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

instancesRouter.post("/instances/:id/reconnect", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await baileysManager.startSession(id);
    res.json({ success: true, message: "Reconectando..." });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

instancesRouter.get("/instances/:id/status", async (req: Request, res: Response) => {
  const { id } = req.params;
  const status = baileysManager.getStatus(id);

  const { data } = await supabaseAdmin
    .from("instances")
    .select("status, qr_code, phone")
    .eq("id", id)
    .single();

  res.json({ ...status, ...(data || {}) });
});
