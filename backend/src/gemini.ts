import { GenerationConfig, GoogleGenerativeAI } from "@google/generative-ai";

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
 *
 * **El reparto pesa velocidad antes que cupo.** Los `flash` grandes generan a
 * 26-60 tok/s y los `-lite` a 112-217: medido con las mismas 7 cenas, 22s
 * contra 5s. La diferencia es rendimiento del modelo, no cuánto piensa — se
 * midió con thinking en cero en ambos y las 7 comidas bien formadas.
 *
 * Por eso el menú comparte `gemini-3.1-flash-lite` con compras en vez de tener
 * modelo propio: esperar 22 segundos en la pantalla principal costaba más que
 * el cupo separado. Compras es el compañero barato — la lista queda cacheada y
 * solo se pide cuando aparece un ítem sin categorizar, así que casi nunca
 * compiten. La contra a saber: si se agota ese cupo, caen las dos juntas.
 *
 * Visión se queda en un `flash` grande a propósito: es el paso más delicado
 * del producto y ahí la calidad vale la espera.
 */
const MODELS = {
  vision: process.env.GEMINI_MODEL_VISION ?? "gemini-3.5-flash",
  menu: process.env.GEMINI_MODEL_MENU ?? "gemini-3.1-flash-lite",
  recipe: process.env.GEMINI_MODEL_RECIPE ?? "gemini-3.5-flash-lite",
  shopping: process.env.GEMINI_MODEL_SHOPPING ?? "gemini-3.1-flash-lite",
} as const;

/**
 * Armar el menú es dar formato, no razonar: los modelos con "thinking" gastan
 * ~1500 tokens de pensamiento en esta tarea y eso es casi todo el tiempo de
 * espera. Medido sobre `gemini-3.6-flash`: 1523 tokens de thinking con 7
 * comidas y 1506 con 3 — o sea que no escala con el pedido, es fijo.
 *
 * `thinkingLevel: "low"` es lo mínimo que acepta el modelo; `thinkingBudget: 0`
 * lo rechaza con 400. Los modelos `-lite` no piensan y no necesitan esto.
 *
 * El SDK 0.21 no tipa `thinkingConfig` pero reenvía `generationConfig` entero
 * sin filtrar campos, así que el cast alcanza y no hace falta actualizarlo.
 */
const LOW_THINKING = { thinkingConfig: { thinkingLevel: "low" } } as unknown as GenerationConfig;

/**
 * Plan B de cada operación, para cuando Google devuelve 503 ("high demand") o se
 * agota el cupo del modelo principal. Siempre un modelo distinto del principal:
 * la saturación y la cuota son por modelo, así que reintentar en otro esquiva las
 * dos. Todos son `-lite` porque leen imágenes igual y, en un momento de
 * saturación, una detección un poco peor vale más que ninguna.
 *
 * Van sin `LOW_THINKING`: no se midió si cada uno acepta `thinkingLevel`, y un
 * 400 en el plan B sería peor que el problema que viene a resolver.
 */
const FALLBACKS: Record<keyof typeof MODELS, string> = {
  vision: process.env.GEMINI_FALLBACK_VISION ?? "gemini-3.5-flash-lite",
  menu: process.env.GEMINI_FALLBACK_MENU ?? "gemini-3.5-flash-lite",
  recipe: process.env.GEMINI_FALLBACK_RECIPE ?? "gemini-3.1-flash-lite",
  shopping: process.env.GEMINI_FALLBACK_SHOPPING ?? "gemini-3.5-flash-lite",
};

/** Lo que tarda en bajar un pico de demanda suele ser segundos, no minutos. */
const RETRY_DELAY_MS = 1500;

type GenerateInput = Parameters<ReturnType<typeof client.getGenerativeModel>["generateContent"]>[0];

function statusOf(err: unknown): number | undefined {
  return (err as { status?: number } | null)?.status;
}

/**
 * Principal → si está saturado, un reintento en el mismo → plan B.
 *
 * El 429 no se reintenta en el mismo modelo: la cuota diaria no vuelve en un
 * segundo y medio. Va directo al plan B, que tiene cupo propio.
 *
 * Si el plan B también falla se propaga *ese* error, con su `status`, para que
 * `index.ts` le pueda decir al usuario qué pasó.
 */
async function generate(task: keyof typeof MODELS, input: GenerateInput, options: { lowThinking?: boolean } = {}) {
  const primary = client.getGenerativeModel({
    model: MODELS[task],
    ...(options.lowThinking ? { generationConfig: LOW_THINKING } : {}),
  });

  try {
    return await primary.generateContent(input);
  } catch (err) {
    const status = statusOf(err);
    if (status !== 503 && status !== 429) throw err;

    if (status === 503) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      try {
        return await primary.generateContent(input);
      } catch (retryErr) {
        const retryStatus = statusOf(retryErr);
        if (retryStatus !== 503 && retryStatus !== 429) throw retryErr;
      }
    }

    console.warn(`${MODELS[task]} respondió ${status}; usando ${FALLBACKS[task]} para ${task}.`);
    return client.getGenerativeModel({ model: FALLBACKS[task] }).generateContent(input);
  }
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
  const result = await generate("vision", [
    { inlineData: { data: imageBuffer.toString("base64"), mimeType } },
    { text: DETECT_PROMPT },
  ]);

  const parsed = extractJson(result.response.text());

  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new Error("Gemini no devolvió un array de strings.");
  }

  return parsed;
}

export const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

/**
 * No hay `ingredientsUsed`. Se pedía y nadie lo leía nunca — ni la app ni el
 * handoff lo mencionan — y cada campo de más es salida que el modelo tiene que
 * generar, que es lo que manda el tiempo de espera. Si alguna vez hace falta
 * mostrar qué usa cada comida, se vuelve a pedir entonces.
 */
export type Meal = {
  name: string;
  description: string;
  ingredientsToBuy: string[];
  day: string;
  moment: string;
};

type RawMeal = Omit<Meal, "day" | "moment">;

function isRawMeal(value: unknown): value is RawMeal {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.name === "string" &&
    typeof m.description === "string" &&
    Array.isArray(m.ingredientsToBuy) &&
    m.ingredientsToBuy.every((i) => typeof i === "string")
  );
}

/** Qué se espera de cada momento, para que el desayuno no salga un guiso. */
const MOMENT_HINT: Record<string, string> = {
  Desayuno: "algo rápido y liviano, de menos de 10 minutos",
  Almuerzo: "un plato completo, que se pueda llevar en vianda",
  Merienda: "algo liviano, dulce o salado, sin cocción compleja",
  Cena: "un plato completo para preparar en casa",
};

async function generateForMoment(
  ingredients: string[],
  moment: string,
  count: number,
  avoidNames: string[],
  restrictions?: string
): Promise<RawMeal[]> {
  const hint = MOMENT_HINT[moment] ?? "un plato completo";

  const prompt = `Tengo estos ingredientes disponibles: ${ingredients.join(", ")}.
Armá ${count} opción(es) de ${moment.toUpperCase()} para la semana: ${hint}.
Priorizá usar lo disponible y sugerí qué comprar para completar cada receta.
${avoidNames.length > 0 ? `No repitas estas comidas ya usadas: ${avoidNames.join(", ")}.` : ""}
${restrictions ? `Restricciones alimentarias a respetar estrictamente: ${restrictions}.` : ""}
Respondé UNICAMENTE con un array JSON de objetos con esta forma, sin texto adicional ni markdown:
[{"name": "nombre de la comida", "description": "descripción corta de 1 línea", "ingredientsToBuy": ["ingrediente2"]}]`;

  const result = await generate("menu", prompt, { lowThinking: true });
  const parsed = extractJson(result.response.text());

  if (!Array.isArray(parsed) || !parsed.every(isRawMeal)) {
    throw new Error(`Gemini no devolvió el ${moment} con el formato esperado.`);
  }

  return parsed;
}

export async function generateMenu(
  ingredients: string[],
  options: {
    count?: number;
    moments?: string[];
    avoidNames?: string[];
    restrictions?: string;
    /** Día de la comida que se está reemplazando, al regenerar. */
    day?: string;
  } = {}
): Promise<Meal[]> {
  const count = options.count ?? DAYS.length;
  const moments = options.moments?.length ? options.moments : ["Cena"];
  const avoidNames = options.avoidNames ?? [];
  const restrictions = options.restrictions?.trim();

  // Un pedido por momento, en paralelo. Los cuatro juntos serían 28 comidas en
  // una sola respuesta, con riesgo de que se corte y quede el JSON inválido;
  // así cada respuesta mantiene el tamaño que ya sabemos que funciona.
  const perMoment = await Promise.all(
    moments.map((moment) =>
      generateForMoment(ingredients, moment, count, avoidNames, restrictions).then((meals) =>
        meals.map((meal, i) => ({
          ...meal,
          moment,
          day: options.day ?? DAYS[i % DAYS.length],
        }))
      )
    )
  );

  return perMoment.flat();
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

  const result = await generate("shopping", prompt);
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

  const result = await generate("recipe", prompt);
  const parsed = extractJson(result.response.text());

  if (!isRecipe(parsed)) {
    throw new Error("Gemini no devolvió una receta con el formato esperado.");
  }

  return parsed;
}
