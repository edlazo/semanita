/**
 * Los ítems de la lista vuelven del backend normalizados y reagrupados por
 * Gemini, mientras que los `ingredientsToBuy` de cada comida son los originales.
 * Todo el emparejamiento entre ambos lados pasa por acá.
 */

export type ShoppingCategory = {
  category: string;
  items: string[];
};

export function normalizeItem(value: string): string {
  return value.trim().toLowerCase();
}

export function itemKey(category: string, item: string): string {
  return `${category}::${item}`;
}

/** Nombres tachados, sin la categoría, para comparar contra cualquier comida. */
export function checkedNamesFrom(checked: Set<string>): Set<string> {
  const names = new Set<string>();
  for (const key of checked) {
    const item = key.slice(key.indexOf('::') + 2);
    if (item) names.add(normalizeItem(item));
  }
  return names;
}

/** Lo que a una comida todavía le falta comprar. */
export function pendingFor(ingredientsToBuy: string[], checkedNames: Set<string>): string[] {
  return ingredientsToBuy.filter((item) => !checkedNames.has(normalizeItem(item)));
}

/**
 * La lista guardada es la categorización completa; se muestra filtrada a lo que
 * las comidas elegidas todavía necesitan. Así destildar una comida no obliga a
 * pedirle a Gemini que categorice de nuevo.
 */
export function visibleCategories(
  categories: ShoppingCategory[],
  neededItems: string[]
): ShoppingCategory[] {
  const needed = new Set(neededItems.map(normalizeItem));
  return categories
    .map((c) => ({ ...c, items: c.items.filter((i) => needed.has(normalizeItem(i))) }))
    .filter((c) => c.items.length > 0);
}

/** Sólo hace falta llamar al backend si aparecieron ítems sin categorizar. */
export function needsCategorization(
  categories: ShoppingCategory[] | null,
  neededItems: string[]
): boolean {
  if (!categories) return neededItems.length > 0;
  const known = new Set(categories.flatMap((c) => c.items).map(normalizeItem));
  return neededItems.some((i) => !known.has(normalizeItem(i)));
}
