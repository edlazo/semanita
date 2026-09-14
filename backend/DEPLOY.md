# Desplegar el backend

Estado: **preparado, sin desplegar.** El `Dockerfile` está listo y probado en
build local; falta elegir plataforma y correr los pasos.

## Lo que el servicio necesita

| Variable | De dónde sale | Obligatoria |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio | sí |
| `SUPABASE_URL` | Supabase → Project Settings → API | sí |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API | sí |
| `PORT` | la inyecta la plataforma | no, cae a 3000 |
| `GEMINI_MODEL_*` | ver `.env.example` | no, hay defaults |

`GEMINI_API_KEY` es la única que es un secreto de verdad. La `anon key` de
Supabase es pública por diseño — acá se usa solo para validar tokens de sesión.

Health check: `GET /health` → `{"ok":true}`.

## Dos restricciones que condicionan la plataforma

**El menú tarda entre 7 y 22 segundos.** Cualquier serverless con timeout corto
de función corta el pedido a la mitad. Hace falta un contenedor de larga
duración, no una función efímera.

**El arranque en frío se paga entero.** Los planes gratuitos duermen el servicio
tras unos minutos sin uso y el primer pedido después despierta el contenedor.
Bajamos el menú de 22s a 7s; un cold start de casi un minuto se lleva puesto ese
trabajo. Si el deploy es para mostrar la app, tenerlo despierto importa.

## Render

1. New → Web Service → conectar el repo
2. Root Directory: `backend`
3. Runtime: Docker (toma el `Dockerfile` solo)
4. Cargar las variables de la tabla
5. Health Check Path: `/health`

## Fly

```bash
cd backend && fly launch --no-deploy
fly secrets set GEMINI_API_KEY=... SUPABASE_URL=... SUPABASE_ANON_KEY=...
fly deploy
```

`fly launch` escribe un `fly.toml`; revisar que el `internal_port` coincida con
lo que expone el contenedor y que el health check apunte a `/health`.

## Después de desplegar: apuntar la app

En `mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://<tu-servicio>/
```

Y **reiniciar Metro**: las `EXPO_PUBLIC_*` se incrustan al armar el bundle, no
se releen solas. Sin eso la app sigue pegándole a la IP de tu máquina y el
síntoma es `Failed to fetch` con el backend desplegado y perfectamente vivo.

Para un build del dev client hay que regenerarlo, porque el valor queda adentro
del bundle de JS que sirve Metro — en desarrollo alcanza con reiniciar.

## Pendiente cuando esto sea real

`app.use(cors())` hoy acepta cualquier origen. Para la app nativa da igual — no
hay origen que el navegador haga cumplir — pero si alguna vez se publica el
build web conviene acotarlo. Los endpoints ya exigen token de Supabase, así que
abierto no significa gratis, pero significa que cualquiera puede intentarlo.
