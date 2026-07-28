import { createClient } from "@supabase/supabase-js";
import { NextFunction, Request, Response } from "express";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "SUPABASE_URL / SUPABASE_ANON_KEY no están seteadas. Copiá backend/.env.example a backend/.env."
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type AuthedRequest = Request & { userId?: string };

/**
 * Rejects any request without a valid Supabase access token. Without this the
 * Gemini-backed endpoints are an open API that anyone can call, burning the
 * project's daily AI quota.
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    res.status(401).json({ error: "Falta el token de sesión." });
    return;
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: "Sesión inválida o vencida. Iniciá sesión de nuevo." });
      return;
    }
    req.userId = data.user.id;
    next();
  } catch (err) {
    console.error("auth check failed:", err);
    res.status(503).json({ error: "No se pudo validar la sesión. Probá de nuevo." });
  }
}
