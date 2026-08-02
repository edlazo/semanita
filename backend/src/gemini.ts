import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set. Create backend/.env from .env.example.");
}

const client = new GoogleGenerativeAI(apiKey);

/**
 * La cuota gratuita se cuenta por modelo, no por proyecto: el error de tope la
 * identifica como `GenerateRequestsPerDayPerProjectPerModel-FreeTier`. Repartir
 * las operaciones entre modelos distintos les da a cada una su propio cupo
 * diario en lugar de competir por uno solo.
 *
 * No usar alias `-latest`: resuelven a un modelo concreto y comparten su cupo.
 * El reparto pesa calidad contra volumen esperado — la visión es el paso más
 * delicado del producto, y las recetas son las que más se piden por sesión.
 */
const MODELS = {
  vision: process.env.GEMINI_MODEL_VISION ?? "gemini-3.5-flash",
  menu: process.env.GEMINI_MODEL_MENU ?? "gemini-3.6-flash",
  recipe: process.env.GEMINI_MODEL_RECIPE ?? "gemini-3.5-flash-lite",
  shopping: process.env.GEMINI_MODEL_SHOPPING ?? "gemini-3.1-flash-lite",
} as const;

function modelFor(task: keyof typeof MODELS) {
  return client.getGenerativeModel({ model: MODELS[task] });
}

const DETECT_PROMPT = `Mirá esta foto de una heladera o alacena y listá todos los ingredientes y alimentos que puedas identificar.
Respondé UNICAMENTE con un array JSON de strings en español, sin texto adicional ni markdown. Ejemplo: ["tomate", "leche", "arroz"]`;

function extractJson(rawText: string): unknown {
  const jsonText = rawText.trim().replace(/^```json\s*|^```\s*|```$/g, "").trim();
  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error(`Gemini no devolvió JSON válido: ${rawText.slice(0, 200)}`);
  }
}

export async function detectIngredients(imageBuffer: Buffer, mimeType: string): Promise<string[]> {
  const result = await modelFor("vision").generateContent([
    { inlineData: { data: imageBuffer.toString("base64"), mimeType } },
    { text: DETECT_PROMPT },
  ]);

  const parsed = extractJson(result.response.text());

  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new Error("Gemini no devolvió un array de strings.");
  }

  return parsed;
}

export type Meal = {
  name: string;
  description: string;
  ingredientsUsed: string[];
  ingredientsToBuy: string[];
};

function isMeal(value: unknown): value is Meal {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.name === "string" &&
    typeof m.description === "string" &&
    Array.isArray(m.ingredientsUsed) &&
    m.ingredientsUsed.every((i) => typeof i === "string") &&
    Array.isArray(m.ingredientsToBuy) &&
    m.ingredientsToBuy.every((i) => typeof i === "string")
  );
}

export async function generateMenu(
  ingredients: string[],
  options: { count?: number; avoidNames?: string[]; restrictions?: string } = {}
): Promise<Meal[]> {
  const count = options.count ?? 7;
  const avoidNames = options.avoidNames ?? [];
  const restrictions = options.restrictions?.trim();

  const prompt = `Tengo estos ingredientes disponibles: ${ingredients.join(", ")}.
Armá un menú de ${count} comida(s) para la semana, priorizando usar lo disponible y sugiriendo qué comprar para completar cada receta.
${avoidNames.length > 0 ? `No repitas estas comidas ya usadas: ${avoidNames.join(", ")}.` : ""}
${restrictions ? `Restricciones alimentarias a respetar estrictamente: ${restrictions}.` : ""}
Respondé UNICAMENTE con un array JSON de objetos con esta forma, sin texto adicional ni markdown:
[{"name": "nombre de la comida", "description": "descripción corta de 1 línea", "ingredientsUsed": ["ingrediente1"], "ingredientsToBuy": ["ingrediente2"]}]`;

  const result = await modelFor("menu").generateContent(prompt);
  const parsed = extractJson(result.response.text());

  if (!Array.isArray(parsed) || !parsed.every(isMeal)) {
    throw new Error("Gemini no devolvió un menú con el formato esperado.");
  }

  return parsed;
}

export type ShoppingCategory = {
  category: string;
  items: string[];
};

function isShoppingCategory(value: unknown): value is ShoppingCategory {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.category === "string" &&
    Array.isArray(c.items) &&
    c.items.every((i) => typeof i === "string")
  );
}

export async function generateShoppingList(items: string[]): Promise<ShoppingCategory[]> {
  const prompt = `Agrupá esta lista de compras en categorías típicas de un supermercado en español (ej: Verdulería, Almacén, Carnicería, Lácteos, Panadería, Otros): ${items.join(", ")}.
Respondé UNICAMENTE con un array JSON de objetos con esta forma, sin texto adicional ni markdown:
[{"category": "Verdulería", "items": ["tomate", "lechuga"]}]`;

  const result = await modelFor("shopping").generateContent(prompt);
  const parsed = extractJson(result.response.text());

  if (!Array.isArray(parsed) || !parsed.every(isShoppingCategory)) {
    throw new Error("Gemini no devolvió una lista de compras con el formato esperado.");
  }

  return parsed;
}

/** El diseño muestra nombre y cantidad en columnas separadas, unidas por una línea de puntos. */
export type RecipeIngredient = {
  name: string;
  qty: string;
};

export type Recipe = {
  servings: string;
  time: string;
  difficulty: string;
  ingredients: RecipeIngredient[];
  steps: string[];
};

function isRecipeIngredient(value: unknown): value is RecipeIngredient {
  if (typeof value !== "object" || value === null) return false;
  const i = value as Record<string, unknown>;
  return typeof i.name === "string" && typeof i.qty === "string";
}

function isRecipe(value: unknown): value is Recipe {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.servings === "string" &&
    typeof r.time === "string" &&
    typeof r.difficulty === "string" &&
    Array.isArray(r.ingredients) &&
    r.ingredients.every(isRecipeIngredient) &&
    Array.isArray(r.steps) &&
    r.steps.every((s) => typeof s === "string")
  );
}

export async function generateRecipe(
  mealName: string,
  options: { description?: string; restrictions?: string } = {}
): Promise<Recipe> {
  const description = options.description?.trim();
  const restrictions = options.restrictions?.trim();

  const prompt = `Escribí la receta completa para preparar: ${mealName}.
${description ? `Descripción de la comida: ${description}.` : ""}
${restrictions ? `Respetá estrictamente estas restricciones alimentarias: ${restrictions}.` : ""}
Escribí en español rioplatense con voseo ("herví", "salpimentá", "poné"). Usá medidas caseras
(tazas, cucharadas, gramos). Los pasos van cortos y directos, e incluí el truco práctico cuando
lo haya (por ejemplo: "Usá arroz del día anterior: seco saltea mucho mejor").
"difficulty" es una sola palabra: Fácil, Media o Difícil.
Separá cada ingrediente en su nombre y su cantidad.
Respondé UNICAMENTE con un objeto JSON con esta forma, sin texto adicional ni markdown:
{"servings": "2 porciones", "time": "30 min", "difficulty": "Fácil", "ingredients": [{"name": "fideos", "qty": "200 g"}, {"name": "tomate", "qty": "1"}], "steps": ["Herví agua con sal.", "Cociná los fideos 8 minutos."]}`;

  const result = await modelFor("recipe").generateContent(prompt);
  const parsed = extractJson(result.response.text());

  if (!isRecipe(parsed)) {
    throw new Error("Gemini no devolvió una receta con el formato esperado.");
  }

  return parsed;
}
