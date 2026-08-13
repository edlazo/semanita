# Semanita

App para sacarle una foto a la heladera, detectar los ingredientes con IA y armar
el menú de la semana más la lista de compras.

- `mobile/` — Expo / React Native (SDK 56, RN 0.85)
- `backend/` — Express + TypeScript, proxy de la API de Gemini
- `design_handoff_semanita/` — el rediseño: HTML navegable + README

## Cómo se corre

Son **dos procesos separados**, y los dos tienen que estar arriba:

```bash
cd backend && npm run dev
```

```bash
cd mobile && npx expo start --web
```

Si la app tira **`Failed to fetch`**, el primer sospechoso es el backend caído,
no el código. Reiniciar Metro no reinicia el backend.

`mobile/.env` apunta a `EXPO_PUBLIC_API_URL=http://192.168.0.5:3000`, la IP LAN
fija de la máquina de desarrollo. Si el router la cambia, aparece el mismo
`Failed to fetch` con el backend perfectamente vivo.

**Expo Go solo habla el SDK más nuevo.** No soporta versiones viejas: si el
proyecto queda atrás, tira "Incompatible SDK version" y no hay forma de forzarlo.
Por eso el proyecto sigue al SDK vigente en vez de quedarse pinneado.

Web (`--web`) es la superficie de iteración rápida, pero **no alcanza para dar
algo por probado**: react-native-web difiere en flex, fuentes y animaciones.
Lo que toca módulos nativos se verifica en el teléfono.

No hay runner de tests configurado. Lo que hay para validar es
`npx tsc --noEmit` en `mobile/`, y mirar la app en el navegador.

## Git

**Trunk-Based Development.** `main` es el tronco y siempre tiene que quedar
deployable. Cambios chicos e integrados seguido; para trabajo que no entra en un
commit, rama de vida corta que se mergea el mismo día — nunca ramas largas que
divergen. Nada de force push a `main`.

Los mensajes de commit llevan prefijo:

- `Feature:` — capacidad nueva
- `Bugfix:` — arreglo de algo roto
- `Refactor:` — reestructura sin cambio funcional
- `Documentation:` — docs y comentarios
- `Deployment:` — build, dependencias, CI

Cuando dude entre dos, gana lo que le pasó al usuario: alinear una pantalla con
el handoff es `Bugfix:` si estaba mal, `Feature:` si no existía.

El cuerpo explica **por qué**, no qué — el diff ya dice qué.

Commitear solo cuando el usuario lo pide.

## Diseño

`design_handoff_semanita/` es la fuente de verdad de la UI. Cuando el README y
el HTML se contradicen, **manda el HTML**: el README lo dice explícitamente.

El prototipo tiene cosas que no se copian:
- **Tasas de cambio hardcodeadas.** El README las prohíbe. Mostrar un precio
  convertido a mano cotiza algo que el usuario no va a pagar.
- **La bajada de la prueba** dice que sin suscripción no podés seguir. Dejó de
  ser cierto cuando el plan gratis se quedó con la cena.
- **El bloque de estadísticas** se omite hasta que haya datos: el README manda
  omitirlo entero antes que mostrar ceros.

## Gotchas de React Native

Los cuatro salieron de romperse la cabeza, no de la documentación:

1. **La cuota de Gemini es por modelo, no por proyecto.** Por eso
   `backend/src/gemini.ts` reparte las cuatro operaciones en cuatro modelos
   (`vision`, `menu`, `recipe`, `shopping`). Juntarlas agota la cuota diaria.
2. **Los pesos de una fuente cargada por archivo son familias distintas.**
   `fontWeight` no las selecciona; se referencian por nombre desde `theme.ts`
   (`PlusJakartaSans_600SemiBold`, etc.).
3. **Una fuente cargada por archivo no tiene fallback de glifos.** Plus Jakarta
   Sans no trae ✓ (U+2713) ni ✕ (U+2715), y el glifo faltante simplemente no se
   dibuja. Los tildes, cruces, flechas y chevrons son SVG en
   `mobile/components/Icons.tsx`. **No usarlos como carácter.**
4. **`flex: 0` compila a `flex: 0 1 0%` en react-native-web** — base cero y
   encogible, así que un elemento de tamaño fijo colapsa dentro de una fila. Va
   `flexShrink: 0`. Aplica igual a un SVG adentro de un contenedor con borde: sin
   `flexShrink` se achica en un solo eje y el trazo sale deformado.

## Movimiento

El handoff define **cuatro animaciones y nada más** — `scr` (6px + fade),
`rise` (24px + fade), `pop` (escala) y `shake` — y dice explícitamente que una
quinta las vuelve ruido. Antes de inventar una, ver si alguna existente ya
significa lo que hace falta: `scr` es "esto es nuevo, llegó recién", y volver a
dispararlo con una `key` cubre casi todos los casos de contenido que cambia.

La distancia codifica jerarquía: 6px es "cambió el contenido", 24px es "se abrió
una capa que vas a cerrar". Nada más largo de 400ms.

`Motion.tsx` usa `useNativeDriver: true`. En web no existe el módulo nativo y RN
avisa por consola que cae a animación por JS — no es un error y se ve igual,
pero **la fluidez real solo se juzga en el teléfono**.

## Backend

La clave de Gemini vive solo en el backend — nunca en el bundle de la app.
`requireAuth` exige token de Supabase válido: los endpoints cuestan plata.

El estado de la prueba y la suscripción vive en Supabase con RLS de solo lectura
propia, no en el dispositivo. En el dispositivo se lo saltea reinstalando.

## Trabajo

Editar archivos con la herramienta Edit, **nunca con scripts de shell** que
reescriban archivos.

Preguntar antes de decisiones grandes de arquitectura o diseño.
