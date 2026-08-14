/**
 * Los momentos del día del menú. Tienen que coincidir con `ALL_MOMENTS` de
 * `backend/src/entitlements.ts`: el backend recorta contra esa lista y un
 * nombre que no matchee vuelve rechazado.
 */

export const ALL_MOMENTS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'] as const;

/** Lo que entra sin suscripción. El backend manda; esto es solo para la UI. */
export const FREE_MOMENTS = ['Cena'] as const;

/**
 * Cada momento es una llamada aparte a Gemini contra el mismo modelo, así que
 * pedir los cuatro consume cuatro veces el cupo diario. Por eso el arranque es
 * la cena sola, que además es lo único que incluye el plan gratis.
 */
export const DEFAULT_MOMENTS: string[] = [...FREE_MOMENTS];

export function isAllowed(moment: string, allowed: string[] | undefined): boolean {
  // Sin dato del backend no se bloquea nada: él decide de verdad, y atenuar
  // por una respuesta que no llegó sería inventar un límite que no existe.
  if (!allowed) return true;
  return allowed.includes(moment);
}

/**
 * Ordena como transcurre el día, no como se tildaron. El menú se lee de
 * corrido y un almuerzo antes del desayuno se lee como un error.
 */
export function sortByDayOrder(moments: string[]): string[] {
  return [...moments].sort(
    (a, b) => ALL_MOMENTS.indexOf(a as never) - ALL_MOMENTS.indexOf(b as never)
  );
}
