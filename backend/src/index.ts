import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { detectIngredients, generateMenu, generateShoppingList } from "./gemini";

const app = express();
const port = process.env.PORT ?? 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Formato de imagen no soportado"));
      return;
    }
    cb(null, true);
  },
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/detect-ingredients", upload.single("photo"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "Falta el archivo 'photo'." });
    return;
  }

  try {
    const ingredients = await detectIngredients(req.file.buffer, req.file.mimetype);
    res.json({ ingredients });
  } catch (err) {
    console.error("detect-ingredients failed:", err);
    res.status(502).json({ error: "No se pudo procesar la imagen. Probá de nuevo." });
  }
});

app.post("/api/generate-menu", async (req: Request, res: Response) => {
  const { ingredients, count, avoidNames, restrictions } = req.body ?? {};

  if (!Array.isArray(ingredients) || ingredients.length === 0 || !ingredients.every((i) => typeof i === "string")) {
    res.status(400).json({ error: "Falta 'ingredients' (array de strings no vacío)." });
    return;
  }
  if (count !== undefined && (typeof count !== "number" || count < 1 || count > 14)) {
    res.status(400).json({ error: "'count' debe ser un número entre 1 y 14." });
    return;
  }
  if (avoidNames !== undefined && (!Array.isArray(avoidNames) || !avoidNames.every((i) => typeof i === "string"))) {
    res.status(400).json({ error: "'avoidNames' debe ser un array de strings." });
    return;
  }
  if (restrictions !== undefined && (typeof restrictions !== "string" || restrictions.length > 300)) {
    res.status(400).json({ error: "'restrictions' debe ser un string de hasta 300 caracteres." });
    return;
  }

  try {
    const menu = await generateMenu(ingredients, { count, avoidNames, restrictions });
    res.json({ menu });
  } catch (err) {
    console.error("generate-menu failed:", err);
    res.status(502).json({ error: "No se pudo generar el menú. Probá de nuevo." });
  }
});

app.post("/api/generate-shopping-list", async (req: Request, res: Response) => {
  const { items } = req.body ?? {};

  if (!Array.isArray(items) || items.length === 0 || !items.every((i) => typeof i === "string")) {
    res.status(400).json({ error: "Falta 'items' (array de strings no vacío)." });
    return;
  }

  const deduped = [...new Set(items.map((i) => i.trim().toLowerCase()))];

  try {
    const categories = await generateShoppingList(deduped);
    res.json({ categories });
  } catch (err) {
    console.error("generate-shopping-list failed:", err);
    res.status(502).json({ error: "No se pudo generar la lista de compras. Probá de nuevo." });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(400).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`Backend listo en http://localhost:${port}`);
});
