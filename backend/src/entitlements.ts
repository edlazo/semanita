import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

/** Días de prueba gratuita desde el alta de la cuenta. */
export const TRIAL_DAYS = Number(process.env.TRIAL_DAYS ?? 30);

export type Entitlement = {
  status: "trial" | "subscribed" | "expired";
  /** Días enteros que le quedan de prueba. 0 si ya venció o si está suscripto. */
  trialDaysLeft: number;
  subscribed: boolean;
};

/**
 * Lee la fila del usuario con SU token, no con una clave de servicio: así la
 * política RLS sigue aplicando y el backend no puede leer de más por error.
 */
export async function getEntitlement(accessToken: string, userId: string): Promise<Entitlement> {
  const scoped = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data, error } = await scoped
    .from("entitlements")
    .select("trial_started_at, subscribed_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  // Sin fila (cuenta creada antes de la migración, o trigger que no corrió):
  // se trata como recién empezada en lugar de dejar al usuario afuera.
  const trialStart = data?.trial_started_at ? new Date(data.trial_started_at) : new Date();
  const subscribedUntil = data?.subscribed_until ? new Date(data.subscribed_until) : null;

  const now = Date.now();
  const subscribed = subscribedUntil !== null && subscribedUntil.getTime() > now;

  const msLeft = trialStart.getTime() + TRIAL_DAYS * 86_400_000 - now;
  const trialDaysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000));

  if (subscribed) return { status: "subscribed", trialDaysLeft: 0, subscribed: true };
  if (trialDaysLeft > 0) return { status: "trial", trialDaysLeft, subscribed: false };
  return { status: "expired", trialDaysLeft: 0, subscribed: false };
}
