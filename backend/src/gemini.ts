import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set. Create backend/.env from .env.example.");
}

const client = new GoogleGenerativeAI(apiKey);
const model = client.getGenerativeModel({ model: "gemini-flash-latest" });

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
  const result = await model.generateContent([
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

  const result = await model.generateContent(prompt);
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

  const result = await model.generateContent(prompt);
  const parsed = extractJson(result.response.text());

  if (!Array.isArray(parsed) || !parsed.every(isShoppingCategory)) {
    throw new Error("Gemini no devolvió una lista de compras con el formato esperado.");
  }

  return parsed;
}
