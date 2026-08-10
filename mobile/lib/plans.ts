/**
 * Los precios se definen una sola vez, en dólares, y nunca como dos listas que
 * se puedan desincronizar.
 *
 * NO hay tasas de cambio acá a propósito. Mostrar un monto convertido con una
 * tasa fija es decirle al usuario un precio que no es el que va a pagar. En
 * producción el precio local lo define la tienda (App Store y Play Store
 * manejan precios por región); hasta entonces se muestra el de referencia en
 * dólares y en qué moneda se cobra.
 */

export type PlanId = 'free' | 'mensual' | 'anual';

export type Plan = {
  id: PlanId;
  name: string;
  usd: number;
  /** Cómo se lee el precio, ya con su período. */
  price: string;
  description: string;
  badge?: string;
};

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    usd: 0,
    price: 'US$ 0',
    description: 'La cena de cada día y anuncios para cambiar una comida.',
  },
  {
    id: 'mensual',
    name: 'Plus mensual',
    usd: 3.99,
    price: 'US$ 3,99',
    description: 'Las cuatro comidas del día, sin anuncios. Se renueva cada mes.',
  },
  {
    id: 'anual',
    name: 'Plus anual',
    usd: 39.9,
    price: 'US$ 39,90',
    description: 'Lo mismo, pagando diez meses en vez de doce.',
    badge: 'Dos meses de regalo',
  },
];

export const BENEFITS = [
  'Desayuno, almuerzo, merienda y cena',
  'Cambiar una comida sin ver anuncios',
  'Recetas paso a paso de todo el menú',
  'Lista de compras siempre al día',
];

export type Country = {
  code: string;
  name: string;
  currency: string;
  symbol: string;
};

/** La lista real debería salir de las regiones donde la app esté publicada. */
export const COUNTRIES: Country[] = [
  { code: 'US', name: 'Estados Unidos', currency: 'USD', symbol: 'US$' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', symbol: '$' },
  { code: 'UY', name: 'Uruguay', currency: 'UYU', symbol: '$U' },
  { code: 'CL', name: 'Chile', currency: 'CLP', symbol: '$' },
  { code: 'MX', name: 'México', currency: 'MXN', symbol: '$' },
  { code: 'CO', name: 'Colombia', currency: 'COP', symbol: '$' },
  { code: 'PE', name: 'Perú', currency: 'PEN', symbol: 'S/' },
  { code: 'ES', name: 'España', currency: 'EUR', symbol: '€' },
];

export function countryByCode(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

/** Nota al pie de los precios, según dónde vive el usuario. */
export function pricingNote(country: Country): string {
  return country.code === 'US'
    ? 'Precios en dólares estadounidenses.'
    : `Precios de referencia en dólares. Se cobra en ${country.currency}, al cambio que aplique la tienda.`;
}
