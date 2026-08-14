export type Entitlement = {
  status: 'trial' | 'subscribed' | 'expired';
  trialDaysLeft: number;
  subscribed: boolean;
  /**
   * Qué momentos del día habilita el plan. Lo manda el backend y ahí se
   * recorta de verdad: la app lo usa solo para no ofrecer lo que igual
   * volvería rechazado.
   */
  allowedMoments: string[];
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
