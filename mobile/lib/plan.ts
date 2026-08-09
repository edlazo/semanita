export type Entitlement = {
  status: 'trial' | 'subscribed' | 'expired';
  trialDaysLeft: number;
  subscribed: boolean;
};

/**
 * Ver un anuncio para regenerar.
 *
 * STUB: el SDK de AdMob necesita un development build de Expo, así que por ahora
 * esto resuelve sin mostrar nada. Al reemplazarlo, la verificación real de que
 * el anuncio se vio tiene que pasar por el callback servidor-a-servidor de
 * AdMob — un `true` que devuelve el cliente es falsificable.
 */
export async function showRewardedAd(): Promise<boolean> {
  return true;
}

/**
 * STUB: la compra real es RevenueCat + in-app purchases, que también necesitan
 * development build y las cuentas de las tiendas publicadas. Cuando exista, al
 * confirmarse el pago el backend escribe `subscribed_until` con la service role
 * key — nunca la app, que no es una fuente confiable de "ya pagué".
 */
export async function startSubscription(): Promise<boolean> {
  return false;
}

export function trialLabel(entitlement: Entitlement | null): string | null {
  if (!entitlement) return null;
  if (entitlement.subscribed) return null;
  if (entitlement.status === 'expired') return 'Prueba terminada';
  const d = entitlement.trialDaysLeft;
  return d === 1 ? 'Último día de prueba' : `${d} días de prueba`;
}
