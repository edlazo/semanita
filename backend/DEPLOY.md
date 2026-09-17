# Desplegar el backend

Estado: **preparado, sin desplegar.** Plataforma elegida: **Render, plan
gratis.** El `Dockerfile` compila el TypeScript sin errores, pero la imagen
todavía no se construyó en local: el primer build real va a ser el de Render.

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

En Supabase, además, tienen que estar corridos los SQL de `backend/supabase/`
(SQL Editor, uno por vez): `entitlements.sql` y después `ai_usage.sql`. Sin
`ai_usage.sql` el backend no se cae — deja pasar todo y lo avisa en los logs
como `quota check failed` —, pero el tope diario no limita nada.

## Dos restricciones que condicionan la plataforma

**El menú tarda entre 7 y 22 segundos.** Cualquier serverless con timeout corto
de función corta el pedido a la mitad. Hace falta un contenedor de larga
duración, no una función efímera.

**El arranque en frío se paga entero.** Render gratis duerme el servicio a los
**15 minutos sin tráfico** y despertarlo tarda **cerca de un minuto**, que se
suma al primer pedido. Bajamos el menú de 22s a 7s; ese minuto se lleva puesto
el trabajo justo en la primera impresión. A quien pruebe la app hay que avisarle
que el primer intento del día puede tardar.

## Por qué Render

Se comparó contra Railway, que no duerme el servicio. Railway da USD 5 de
crédito por 30 días y después cobra por uso real — un backend prendido todo el
mes excede el crédito de USD 1 del plan gratis. Render gratis no vence: 750
horas de instancia por mes, y el tiempo dormido no las consume.

Si el arranque en frío termina pesando más que el costo, mudarse es barato: el
`Dockerfile` no tiene nada de Render y corre igual en Railway o Fly.

## Pasos en Render

1. New → Web Service → conectar el repo de GitHub
2. Root Directory: `backend`
3. Language: Docker (toma el `Dockerfile` solo)
4. Instance Type: Free
5. Cargar las variables de la tabla en Environment
6. Health Check Path: `/health`

Cada push a `main` redespliega solo. Con Trunk-Based Development eso es lo
esperado, y es otra razón para que `main` quede siempre deployable.

Para verificar: `https://<tu-servicio>.onrender.com/health` → `{"ok":true}`.

## Después de desplegar: apuntar la app

En `mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://<tu-servicio>.onrender.com
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
