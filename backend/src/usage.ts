import { createClient } from "@supabase/supabase-js";
import { Response } from "express";
import { AuthedRequest } from "./auth";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export type Operation = "photo" | "menu" | "swap" | "recipe" | "shopping";

/**
 * Pedidos por usuario por día. Por operación y no un cupo total, para que un
 * tester que lee muchas recetas no se quede sin menú.
 *
 * Holgados para uso real: una semana se arma con una o dos fotos y un menú.
 * El tope existe para que nadie agote la cuota de Gemini de todos, no para
 * racionar a quien usa la app normalmente.
 */
const LIMITS: Record<Operation, number> = {
  photo: 10,
  menu: 5,
  swap: 20,
  recipe: 30,
  shopping: 10,
};

const LIMIT_MESSAGES: Record<Operation, (limit: number) => string> = {
  photo: (n) => `Llegaste a las ${n} fotos de hoy. Mañana se renueva; mientras tanto podés escribir los ingredientes a mano.`,
  menu: (n) => `Ya armaste ${n} menús hoy, que es el máximo por día. Mañana se renueva.`,
  swap: (n) => `Ya cambiaste ${n} comidas hoy, que es el máximo por día. Mañana se renueva.`,
  recipe: (n) => `Ya abriste ${n} recetas hoy, que es el máximo por día. Mañana se renueva.`,
  shopping: (n) => `Ya armaste ${n} listas de compras hoy, que es el máximo por día. Mañana se renueva.`,
};

/**
 * Descuenta un pedido del cupo del día. Si ya no queda, responde 429 y devuelve
 * `false`: la ruta tiene que cortar ahí.
 *
 * Se llama después de validar el pedido — uno mal formado no debería gastar
 * cupo — y antes de Gemini. Un pedido que después falla en Gemini igual cuenta:
 * devolverlo exigiría una segunda escritura, y con estos límites no vale la pena.
 *
 * Con el usuario y su token, igual que `getEntitlement`: la función de Supabase
 * toma el usuario de la sesión, así que no hay forma de gastar el cupo de otro.
 */
export async function consumeQuota(req: AuthedRequest, res: Response, operation: Operation): Promise<boolean> {
  const limit = LIMITS[operation];

  const scoped = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${req.accessToken}` } },
  });

  const { data, error } = await scoped.rpc("consume_ai_quota", {
    p_operation: operation,
    p_limit: limit,
  });

  if (error) {
    // Mismo criterio que `withEntitlement`: si falla la infraestructura se deja
    // pasar. Cubre también el hueco entre desplegar esto y correr el SQL.
    console.error(`quota check failed (${operation}):`, error.message);
    return true;
  }

  if (data === false) {
    res.status(429).json({ error: LIMIT_MESSAGES[operation](limit) });
    return false;
  }
  return true;
}
