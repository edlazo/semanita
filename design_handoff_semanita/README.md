# Handoff: Semanita — rediseño completo (5 pantallas, modo claro y oscuro)

## Overview
Semanita es una app móvil de planificación de comidas. El usuario le saca una foto a su
heladera o alacena (o escribe la lista a mano), la app identifica los ingredientes, genera
un menú de 5 a 7 comidas para la semana usando lo que ya tiene, y arma la lista de lo que
falta comprar agrupada por categoría. Cada comida tiene su receta.

Este paquete contiene el rediseño de la app completa: **Ingreso, Ingredientes, Menú semanal,
Lista de compras, Receta, Perfil, Datos personales y Planes**, en **modo claro y modo oscuro**.

**Cambio estructural**: la app pasa de un flujo lineal a una **barra de pestañas** de tres
destinos — *Semana*, *Compras*, *Perfil*. Dentro de Semana se conserva el indicador de dos
pasos (1 Ingredientes · 2 Menú).

Público: 18 a 30 años, vive solo o comparte casa, poco tiempo. Todo el copy está en
**español rioplatense con voseo** ("sacale", "destildá", "herví", "salpimentá") — mantenerlo
así, es parte de la identidad.

## About the Design Files
Los archivos `.dc.html` de este bundle son **referencias de diseño hechas en HTML**:
prototipos que muestran el aspecto y el comportamiento buscado. **No son código de
producción para copiar y pegar.**

La tarea es **recrear estos diseños en el entorno del codebase existente**, con sus
patrones y librerías. En este proyecto el destino es la app **React Native / Expo** que
vive en `mobile/` (TypeScript, `StyleSheet`, Supabase para auth, backend propio en
`backend/` que llama a Gemini para la visión y la generación del menú).

Traducción esperada del HTML al target:
- `div` → `View`; texto → `Text`; `input` → `TextInput`; áreas con `overflow-y:auto` → `ScrollView`.
- Los tocables (`cursor:pointer` en el HTML) → `Pressable` con `hitSlop` y área mínima de 44x44.
- Variables CSS (`--acc`, `--ink`, …) → el objeto de tema que ya existe en `mobile/theme.ts`
  (tipo `Theme`, `lightTheme`, `darkTheme`, `radii` y el hook `useAppTheme()`). **Editar ese
  archivo con la paleta nueva, no crear un sistema de tokens paralelo.** Más abajo está el
  archivo ya reescrito, listo para pegar.
- Las animaciones `@keyframes` → `Animated` / `react-native-reanimated`, o `LayoutAnimation`
  para lo simple. Son un detalle, no un bloqueante.
- La receta, que en el HTML es una capa `position:absolute`, debe seguir siendo el
  `Modal` que ya existe en `mobile/components/RecipeModal.tsx`.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografías, tamaños, espaciados y estados son
definitivos. Recrear la UI fielmente. Las únicas licencias esperadas son las que impone la
plataforma (comportamiento del teclado, safe areas, scroll físico, ripple en Android).

Dos advertencias de fidelidad:
1. **Las fotos de comida son placeholders** (tramas diagonales con una etiqueta). No hay
   imágenes reales todavía. Dejar el espacio reservado con el mismo aspecto y tamaño.
2. La barra de estado "9:41" del prototipo es parte del marco simulado. **No implementarla**:
   la da el sistema operativo.

---

## Design Tokens

### Paleta — "cobre y humo"
Un único color de acento (cobre) sobre un neutro cálido. **No hay verde ni bordó.** El rojo
queda reservado para errores reales del sistema; el cobre hace de acento, de estado activo
y de color de error de formulario (con borde, no con relleno).

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `bg` | `#F4EEE6` | `#1B1816` | Fondo de pantalla |
| `card` | `#FFFBF5` | `#241F1C` | Tarjetas, campos, fondo de la Receta |
| `ink` | `#211C18` | `#F1E8DE` | Texto principal |
| `mut` | `#6B5D52` | `#ABA096` | Texto secundario, ítems tachados |
| `acc` | `#A9552C` | `#D9834A` | Acento: numerales, hairlines, tildes, botón principal |
| `onAcc` | `#FBF3EC` | `#1B1816` | Texto sobre el acento |
| `ph1` / `ph2` | `#E6DCCF` / `#DCCFC0` | `#2C2622` / `#221D1A` | Trama del placeholder de foto |

Derivados del acento (misma base, distinta opacidad). En claro base `169,85,44`; en oscuro `217,131,74`:

| Token | Alpha | Uso |
|---|---|---|
| `l14` | 0.14 | Separadores de filas en listas |
| `l20` | 0.20 | Bordes de tarjeta incluida, separadores internos |
| `l26` | 0.26 | Hairlines del header y del indicador de pasos |
| `l40` | 0.40 | Bordes de campos, chips y botones secundarios |

Derivados del texto secundario:

| Token | Alpha | Uso |
|---|---|---|
| `mut40` | 0.40 | Línea de puntos entre ingrediente y cantidad |
| `mut60` | 0.60 | Borde de casilla sin tildar |
| ~~`mut75`~~ | — | **Eliminado.** Placeholders y pie usan `mut` pleno: con alpha 0.75 el contraste cae a 3.28:1 sobre `bg` (AA pide 4.5); el pleno da 5.58:1. No bajes texto con alpha para marcar jerarquía secundaria — usá tamaño o peso. |

### Tipografía
Dos familias, sin excepciones. **Newsreader** aporta el carácter; **Plus Jakarta Sans** hace
todo el trabajo funcional.

- **Newsreader** (serif) — títulos grandes, nombres de comida y de receta, encabezados de
  pantalla. **Siempre en Semibold (600) o Bold (700)**, nunca en Regular: en Regular pierde
  presencia contra la sans y el conjunto se ve indeciso. La itálica 400 se reserva para la
  palabra "semanita" del ingreso, y para nada más.
- **Plus Jakarta Sans** (sans) — botones, listas de ingredientes, pasos de preparación,
  cantidades, gramos, fechas, labels, inputs, chips y navegación. **Regular (400) o Medium
  (500)** por defecto; 600 solo en botones y encabezados de sección; 700 solo en la marca y
  en los números de las estadísticas.

Fraunces e Inter quedaron descartadas a propósito: son las dos fuentes más asociadas al
diseño generado por IA, que es justo lo que este rediseño intenta evitar.

Escala exacta (tamaño / line-height / peso / letter-spacing):

| Rol | Fuente | Especificación |
|---|---|---|
| Título del ingreso | Newsreader | 38px / 1.03 / **700** / -0.015em |
| Título de pantalla ("¿Qué hay en tu heladera?", "Lo que falta") | Newsreader | 30–32px / 1.06 / **600** / -0.015em |
| Título del Menú ("Tu semana") | Newsreader | 27px / 1.06 / **600** / -0.015em |
| Título de capa (Receta, Datos personales, Planes) | Newsreader | 30px / 1.08 / **600** / -0.015em |
| Nombre de comida (tarjeta) | Newsreader | 20px / 1.2 / **600** |
| Nombre del perfil | Newsreader | 24px / 1.1 / **600** / -0.01em |
| Título de estado vacío | Newsreader | 17–19px / 1.25 / **600** |
| Encabezado de sección ("Restricciones", "Avisos", "Ingredientes") | Plus Jakarta | 15–16px / **600** / -0.01em |
| Marca "Semanita" | Plus Jakarta | 16px / **700** / -0.02em |
| Número de estadística | Plus Jakarta | 21px / **700** / -0.02em |
| Precio de plan | Plus Jakarta | 17px / **600** |
| Botón principal | Plus Jakarta | 15px / **600** / caja baja |
| Botón de tarjeta / secundario | Plus Jakarta | 13px / **500–600** |
| Pestaña de navegación | Plus Jakarta | 14px / 500 (activa **600**) |
| Ítem de lista de compras | Plus Jakarta | 15px / **400** |
| Paso de receta | Plus Jakarta | 14.5px / 1.6 / **400** |
| Ingrediente de receta | Plus Jakarta | 14.5px / **400** |
| **Cantidad / gramos** | Plus Jakarta | 13.5px / **500** |
| Numeral de paso | Plus Jakarta | 20px / **600** |
| Valor de metadato (porciones, tiempo) | Plus Jakarta | 17px / **500** |
| Descripción de comida | Plus Jakarta | 13.5px / 1.55 / **400** |
| Input | Plus Jakarta | 15px / **400** |
| Chip (ingrediente, restricción, faltante) | Plus Jakarta | 13px / 400 (faltante **500**) |
| Día de la comida | Plus Jakarta | 12.5px / **600** |
| Nota al pie / secundaria | Plus Jakarta | 12–12.5px / **400** |

**Reglas que hacen que no se lea como generado por IA** — son la corrección más importante
de esta revisión, respetalas al implementar:

1. **Nada de rótulos en MAYÚSCULAS con tracking abierto.** El patrón
   `font-size:9px; text-transform:uppercase; letter-spacing:0.22em` repetido en cada bloque
   es la firma visual del diseño generado. Todos los labels van en **caja baja**, a 12–16px,
   y la jerarquía la hace el **peso**, no el espaciado.
2. **Tracking casi neutro.** Máximo 0.10em, y solo en la marca. Los títulos grandes llevan
   tracking **negativo** (-0.01 a -0.03em), que es lo que les da densidad.
3. **Nada baja de 12px.** El piso anterior de 9px existía solo para sostener el tracking.
4. **La copy va en tono de frase**, no en versalitas: "Ver lista de compras", no
   "VER LISTA DE COMPRAS"; "Verdulería", no "VERDULERÍA".

### Radios, bordes, sombras
- Botón principal: **11px**. Botones secundarios y de fuente de foto: **10px**.
- Tarjeta de comida y tarjeta de plan: **14px**. Tarjeta de membresía: **16px**.
  Tarjeta de estadística: **12px**. Bloque de estado vacío: **6px**. Campos: **4px**.
- Chips, avatar, casillas de comida y el botón ✕: **999px** (píldora / círculo).
- Casillas de la lista de compras: **2px** (cuadrado, casi recto) — se distinguen a propósito
  de las de comida, que son redondas.
- Bordes: **1px**, o **1.5px** en las casillas. Sin sombras en la UI: la jerarquía la dan el
  papel (`card` sobre `bg`) y los hairlines. La única sombra es la del marco del prototipo,
  que no se implementa.

### Espaciado
Padding horizontal de pantalla **26px** (30px en el Ingreso). Separación entre tarjetas
**9px**. Padding de tarjeta **13px 16px 12px**. Fila de lista **11px** vertical.
Padding del botón principal **17px**. Barra inferior del CTA **14px 26px 26px**.

---

## Screens / Views

Estructura común a las 4 pantallas del flujo (no al Ingreso): header fijo con marca +
acciones, indicador de pasos, título, **área central con scroll propio**, y CTA fijo abajo
sobre un degradado de `bg` (62% opaco a transparente) para que el contenido pase por
debajo sin cortarse.

El **indicador de pasos** es la columna vertebral de la navegación: `1 Ingredientes —
2 Menú`, todo en Plus Jakarta Sans, tono de frase. El paso activo va en acento y peso 600.
**Los dos pasos son navegables en ambos sentidos** y así se ven: el paso al que se puede ir
lleva una flecha (`← Ingredientes` desde el Menú, `Menú →` desde Ingredientes) y va en
acento, nunca atenuado — un paso al 40% se lee como deshabilitado y nadie lo toca. `Menú →`
solo se ofrece cuando ya hay un menú generado.

### 1. Ingreso
**Propósito**: iniciar sesión o crear cuenta con email y contraseña (Supabase, como hoy).

**Layout**: header con marca a la izquierda y el toggle de modo a la derecha. Bloque central
centrado verticalmente **dentro de un área con scroll** (`flex:1`, `min-height:0`,
`overflow-y:auto`) — es lo que evita que el pie quede inalcanzable en pantallas cortas.
El pie "EMPORIO DE COMIDA CASERA" va dentro de esa área, al final.

**Componentes**:
- Eyebrow "DESDE 2026 · COCINA DE SEMANA", acento, 11px, tracking 0.24em.
- Título en tres líneas: "Comé bien / toda la / *semanita*." — la última palabra en itálica y color acento.
- Hairline de 1px (`l26`) a todo el ancho.
- Bajada, `mut`, máximo 30 caracteres de ancho. Cambia según el modo: en registro dice
  "Creá tu cuenta y en dos minutos tenés la semana resuelta con lo que ya hay en casa.";
  en login, "Sacale una foto a la heladera y te armamos la semana con lo que ya tenés."
- Dos campos con label en mayúsculas arriba y **solo borde inferior** (1px `l40`), sin caja.
  Placeholders: "rocio@correo.com" y "mínimo 6 caracteres".
- Mensaje de error debajo de los campos, en acento, con una sacudida horizontal de 300ms.
- Botón principal: "INICIAR SESIÓN" / "CREAR CUENTA". Opacidad 0.55 mientras falte algún campo.
- Link de cambio de modo: "¿No tenés cuenta? **Creá una**" / "¿Ya tenés cuenta? **Iniciá sesión**".

**Validación** (en cliente, antes de llamar a Supabase):
- Email contra `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` → "Ese email no parece válido. Revisalo."
- Contraseña de menos de 6 caracteres → "La contraseña necesita al menos 6 caracteres."
- El error se limpia al tipear. Enter en la contraseña envía el formulario.

### 2. Ingredientes (pestaña Semana, paso 1)
**Propósito**: cargar lo que hay en casa, por foto o a mano, y fijar restricciones.

**Layout**: header (marca + toggle de modo + SALIR), pasos, título "¿Qué hay en tu heladera?"
en dos líneas, bajada "Una foto alcanza. Si preferís, escribila.", grilla de tres fuentes,
zona de resultado, chips, campo de agregado, restricciones. CTA fijo.

**Componentes**:
- **Tres fuentes** en grilla de 3 columnas iguales, gap 8px, cada una con dos líneas de
  texto centrado ("Sacar / foto", "De la / galería", "Escribir / a mano"), 11px de padding
  vertical, borde `l20`, radio 10px. **La fuente activa se rellena con el acento** y su
  texto pasa a `onAcc`. El cambio es **inmediato, sin transición de fondo** (ver Movimiento).
- **Preview de la foto**: 112px de alto, radio 6px, trama diagonal de `ph1`/`ph2` a 45°
  (bandas de 8px). Etiqueta en monoespaciada 10px abajo a la izquierda ("foto tomada ·
  heladera") y **badge de acento arriba a la derecha con el conteo** ("7 detectados"),
  píldora de radio 999px con texto en `onAcc` 12px.
- **Chips de ingrediente**: píldoras de fondo `card`, borde `l20`, alto mínimo 44px, con una
  ✕ en acento a la derecha. Se borran al tocarlas. Aparecen con un "pop" de 220ms
  (escala 0.82 → 1.06 → 1) — es la única animación de escala del sistema y sirve para que
  un ingrediente recién agregado se note sin robar atención.
- **Campo de agregado** en una fila: "+" en acento, input con placeholder "Ej: crema de maní",
  y "Agregar" en acento a la derecha. Enter agrega. **Acepta varios separados por coma o
  salto de línea**, normaliza a minúsculas y descarta duplicados.
- **Restricciones**: seis píldoras — Ninguna / Vegetariano / Vegano / Sin gluten / Sin
  lactosa / Otros. Selección única; la activa se rellena de acento. **"Otros" abre un campo
  de texto** debajo con placeholder "Ej: sin frutos secos".
- **CTA "Generar menú semanal"**, opacidad 0.55 sin ingredientes.

**Estados**:
- *Analizando*: el preview se reemplaza por un bloque del mismo tamaño con un spinner de
  26px (borde `l40`, tope en acento, giro de 800ms) y el texto "Analizando la foto…".
- *Sin detección*: bloque con borde `l40`, radio 6px, título en Newsreader 17px "No
  reconocimos nada", explicación "La foto salió muy oscura. Probá de nuevo con la puerta
  abierta, o escribí la lista a mano." y dos botones: "Probar de nuevo" (relleno acento) y
  "Escribir a mano" (borde).
- *Lista vacía*: bajo el eyebrow "Tenés en casa", el texto "Todavía no hay nada. Sacá una
  foto o agregá el primero acá abajo."
- *Generando*: el CTA muestra un spinner de 13px y el texto pasa a "Armando tu semana…".
- *Error de generación*: si se toca el CTA sin ingredientes, bloque con borde acento y el
  mensaje "Necesitamos al menos un ingrediente para armarte la semana.", con sacudida.
- *A mano*: se abre un `textarea` de 74px con placeholder "tomate, fideos, queso…", label
  "Una por línea, o separadas por coma" y botón "Sumar a la lista".

**Barra del CTA** (patrón compartido con Menú): el botón principal no scrollea con el
contenido — va fijo, **62px por encima de la barra de pestañas**, sobre un degradado de
`bg` sólido al 62% hacia transparente que difumina lo que pasa por debajo. El contenido
scrolleable reserva ese espacio con `padding-bottom: 152px` para que el último elemento no
quede tapado. En React Native es una `View` absoluta con `LinearGradient` y el mismo
`contentContainerStyle.paddingBottom` en el `ScrollView`.

### 3. Menú semanal (pestaña Semana, paso 2)
**Propósito**: revisar las comidas propuestas, descartar las que no van, ver recetas.

**Layout**: header (marca + toggle + SEMANA NUEVA), pasos, título "Tu semana" con subtítulo
"N de M elegidas · destildá lo que no querés" y contador "N de M" a la derecha. Lista de
tarjetas con scroll. CTA fijo.

**Tarjeta de comida** (el componente más importante del diseño):
- Fondo `card`, borde 1px `l20`, radio 8px, padding 13px 16px 12px.
- Fila superior: **día en eyebrow de acento** ("LUNES") a la izquierda, **casilla de 22px** a
  la derecha (cuadrada, radio 2px; tildada = relleno acento con ✓ en `onAcc`; sin tildar =
  solo borde `mut60`).
- Nombre en Newsreader 20px.
- Descripción en Plus Jakarta Sans 13.5px, `mut`.
- Fila "FALTA": separada por un hairline `l20` arriba, label "Falta" en acento y la lista
  de faltantes en 13px separada por comas.
- Fila de acciones, otro hairline arriba: **"VER RECETA"** con subrayado de 1px en acento, y
  **"REGENERAR"** en `mut` sin subrayado. Tras regenerar una vez, esa comida dice
  "REGENERAR OTRA VEZ".
- **Estado descartado**: fondo transparente, borde **punteado** `l40`, opacidad 0.6,
  nombre en `mut` con tachado, y se ocultan las acciones. Transición de 200ms.

**CTA**: "VER LISTA DE COMPRAS" con el conteo de ítems en itálica a la derecha ("12 ítems"), en `onAcc` pleno — **no** en una versión pálida del acento (`#F0C9AC` sobre `#A9552C` da 3.39:1; `onAcc` da 4.76:1).
Opacidad 0.55 y sin acción si no queda ninguna comida incluida.

### 3b. Regenerar una comida — compuerta de anuncio
**Propósito**: "Otra" es la acción que separa el plan gratis del pago. Con suscripción
activa regenera en el acto; sin suscripción cuesta ver un anuncio.

La decisión vive en la lógica (`askRegen`), **no en el template**: el botón es el mismo en
los dos casos y no anuncia de antemano que va a costar algo. Mostrar un candado o un "ver
anuncio" en el botón convierte cada tarjeta del menú en un recordatorio de que no pagaste;
la fricción aparece cuando el usuario ya decidió, que es cuando la oferta de suscribirse
tiene sentido.

**Hoja inferior** (no pantalla completa: la comida que se va a cambiar tiene que seguir
visible detrás). Fondo `rgba(20,17,16,.55)`, hoja en `card` con radio 20px arriba, entrada
con `rise`.

- *Oferta*: eyebrow "Cambiar comida" + ✕ arriba a la derecha. Título "Mirá un anuncio y te
  la cambio" (Newsreader 25px). Bajada con la duración y **el nombre de la comida en
  cuestión en negrita** — la hoja tiene que decir qué se está por cambiar. CTA principal
  "Ver el anuncio"; secundario con borde "Con Plus no hay anuncios", que abre Planes.
- *Reproduciendo*: eyebrow "Anuncio" con la cuenta regresiva a la derecha, bloque de 150px
  con la trama de placeholder ("espacio publicitario"), barra de progreso de 3px en acento,
  y la línea "Al terminar te propongo otra comida." Al llegar a cero la hoja se cierra sola
  y **la comida ya está cambiada**: no hay un segundo paso de confirmación.

**Salida durante la reproducción**: a los 5 segundos aparece "Saltear y dejar la comida como
está", que cierra la hoja **sin regenerar**. No está antes porque un anuncio salteable desde
el segundo cero no es un anuncio; y no está ausente del todo porque encerrar a alguien 15
segundos sin salida es hostil. Es la misma convención de los videos con recompensa: podés
irte, pero perdés el premio.

`AD_SECONDS = 15` en el prototipo, con `setTimeout` de 1s. En producción lo reemplaza el SDK
de anuncios (AdMob), y la regeneración debe dispararse en el callback de "recompensa
otorgada", **no** al cerrarse el anuncio: si el usuario lo saltea, no hay cambio de comida.
Tanto el ✕ de la oferta como el "Saltear" limpian el timer y no regeneran.

**Decisión de producto a confirmar**: hoy la compuerta se aplica a todo el que no tenga
suscripción paga, **incluida la prueba gratis**. La alternativa es que la prueba dé la
experiencia Plus completa (regeneración directa) y el anuncio aparezca recién al vencer. La
primera opción muestra el modelo de negocio desde el día uno; la segunda hace que la prueba
represente de verdad lo que se está comprando. Está implementada la primera porque el estado
inicial del prototipo es "en prueba" y así la compuerta se puede ver; cambiarla es una línea
en `askRegen`.

### 4. Lista de compras (pestaña Compras)
**Propósito**: comprar. Se usa de pie en el almacén, con una mano.

**Layout**: header, pasos, título "Lo que falta" con contador "N de M" a la derecha, **barra
de progreso de 2px** (fondo `l20`, relleno acento, transición de ancho de 300ms), y las
categorías con scroll. **Sin CTA**: esta es la última pantalla del flujo.

**Componentes**:
- **Encabezado de categoría**: eyebrow en acento con tracking 0.22em, conteo en Newsreader
  itálica a la derecha, y **borde inferior de 1px en acento sólido** (no atenuado).
- **Fila de ítem**: casilla de 20px + nombre, 11px de padding vertical, separador `l14`.
  Toda la fila es tocable. Al tacharse: casilla rellena de acento con ✓, y el nombre pasa a
  `mut` con tachado, con transición de 180ms.
- **Orden fijo de categorías**: Verdulería → Almacén → Carnicería. Las categorías vacías no
  se muestran.
- **Estado completo**: cuando está todo tachado aparece un bloque con borde acento, título
  Newsreader 19px "Listo, ya está todo" y "Andá a cocinar. Volvé al menú para ver las recetas."

**Derivación de la lista** — importante, no es una lista estática: se junta el campo
`missing` de **las comidas incluidas**, se deduplica, y cada ingrediente se mapea a su
categoría. El mapa del prototipo:
- **Verdulería**: limón, cebolla, ajo, cebolla de verdeo, papas, morrón, zanahoria, zapallito, albahaca.
- **Almacén**: aceite de oliva, orégano, salsa de soja, pan rallado, mayonesa, choclo, caldo de verdura, curry, leche, manteca.
- **Carnicería**: pechuga de pollo, carne picada, panceta.
- Sin coincidencia → Almacén. **En producción esta categoría debería venir del backend**
  (junto con el menú), no de un diccionario en el cliente.
- Al destildar una comida o regenerarla, la lista se recalcula y **se limpian los tachados**.

### 5. Perfil (se entra por el avatar del header, **no** es una pestaña)
**Propósito**: ver quién sos, en qué estado está tu membresía, y ajustar lo que la app usa
para armar el menú.

**Layout**: header con marca y toggle de modo. Todo el cuerpo scrollea; no hay CTA fijo
(el único botón grande es "Cerrar sesión", al final). Cuatro bloques, en este orden:

**a) Identidad** — avatar circular de **76px** con las **iniciales** (Plus Jakarta Sans 600, 26px,
`mut`) sobre la trama de placeholder, borde `l20`; nombre en Newsreader 24px, email en
13.5px `mut` truncado con elipsis, y un botón "Editar" con borde que abre Datos personales.
El círculo va en `box-sizing:border-box` y centra el contenido: cualquier padding vertical
lo vuelve elíptico. Las iniciales se derivan de las dos primeras
palabras del nombre.

**b) Tarjeta de membresía** — la pieza central, y **cambia de tratamiento según el estado**:
- *En prueba*: fondo `card`, borde `l20`, badge "Prueba" en `l14` con texto en `ink` (el acento sobre su propio tinte no llega a AA),
  título "Te quedan N días" (y "Último día de prueba" cuando queda uno), bajada explicando
  qué pasa después, **barra de progreso de 2px** con "Día n de 30" y la fecha de fin en
  Newsreader itálica, y CTA "Ver los planes" relleno de acento.
- *Plus activo*: **la tarjeta se invierte y se rellena de acento** — es el único bloque de
  color pleno de toda la app, y por eso se lee como el estado deseable. Título "Semanita
  Plus", badge "Plus mensual" o "Plus anual" en blanco al 18%, bajada con la fecha real de
  renovación, CTA "Cambiar de plan" en blanco translúcido y un link "Cancelar renovación".
  Sin barra de progreso.

Los 30 días salen de `TRIAL_DAYS` en `backend/src/entitlements.ts`; el prototipo lo tiene
como constante para que se vea, pero el valor lo manda el backend.

**c) Estadísticas** — dos tarjetas de igual ancho: semanas planificadas y comidas cocinadas,
número en 21px 700 y label en 12px `mut`. Es refuerzo de valor para la conversión; si los
datos no existen todavía, **omitir el bloque entero antes que mostrar ceros**.

Había una tercera tarjeta de "plata no gastada" y **se quitó a propósito**: la app conoce los
ingredientes que tenías y los que faltaron, pero no los precios ni qué habrías cocinado sin
Semanita, así que cualquier cifra sería una estimación que el usuario no puede verificar —
mala idea justo en la pantalla donde se le pide pagar. Si más adelante se quiere una tercera
métrica, que sea contable de verdad (por ejemplo "ingredientes rescatados", los que estaban
en la heladera y se usaron), no una conversión a dinero.

**d) Preferencias** — dos secciones con eyebrow de acento:
- *Restricciones*: las mismas seis píldoras de la pantalla 2, editables en el acto y con
  "Se guarda solo" a la derecha. **Es la misma fuente de verdad**: lo que se toca acá se ve
  en Ingredientes y viceversa. Por eso en Ingredientes el eyebrow dice "guardadas en tu
  perfil ›" y lleva al perfil.
- *Avisos*: tres filas con label, explicación en `mut` y un **switch de 42x24** — pista
  redondeada que se rellena de acento con la perilla en `onAcc` cuando está activo, o
  transparente con borde `mut60` y perilla `mut60` cuando no. Toda la fila es tocable.

Copy de los avisos: "Recordarme la lista / El sábado a la mañana, antes de salir a comprar",
"Aviso de la comida del día / A las 18, con la receta de esa noche", "Novedades de Semanita /
Recetas nuevas y cambios. Como mucho, una vez por mes."

### 6. Datos personales
**Propósito**: editar los datos de cuenta. Capa a pantalla completa sobre el Perfil, con la
misma entrada deslizada y el mismo ✕ circular que la Receta, fondo `card`.

Tres campos con eyebrow de acento: **Nombre** editable (borde inferior), **Email** de solo
lectura con la nota "Para cambiarlo escribinos: es la llave de tu cuenta", y **Contraseña**
enmascarada con un "Cambiar" a la derecha (13px, área táctil de 44px). CTA "Guardar cambios" al 55% de opacidad mientras
no haya cambios reales, y que pasa a decir "Guardado" al confirmar.

### 7. Planes
**Propósito**: elegir plan. Misma capa a pantalla completa, título "Elegí tu plan".

**Tres tarjetas seleccionables**: nombre en Newsreader 20px a la izquierda, precio en
Newsreader 17px a la derecha, descripción en 13px. La seleccionada toma **borde acento y
fondo `l14`**; las otras quedan con borde `l20` y fondo transparente. La anual lleva un
badge de acento "Dos meses de regalo".

**Los precios se definen una sola vez, en dólares**, y cada país es una conversión de esa
base — nunca dos listas de precios que se puedan desincronizar:

- **Gratis · US$ 0** — Un menú por mes y anuncios para regenerar una comida.
- **Plus mensual · US$ 4,99** — Menús ilimitados, sin anuncios. Se renueva cada mes.
- **Plus anual · US$ 44,90** — Lo mismo, pagando diez meses en vez de doce.

Debajo de las tarjetas, una fila **"Cobramos en — <país> · <moneda>"** con un "Cambiar" que
abre la capa de país, y una nota que explica la conversión: en Estados Unidos dice "Precios
en dólares estadounidenses"; en cualquier otro país, "Convertido desde dólares al cambio de
hoy. Se cobra en <moneda>".

Luego **"Con Plus tenés"**: cuatro beneficios numerados en Newsreader acento. Al pie, la nota
"Se renueva solo. Lo cancelás cuando quieras desde tu perfil." y un CTA fijo cuyo texto
cambia con la selección ("Suscribirme por mes" / "por año" / "Seguir con el plan gratis").

**Importante para la implementación**: las tasas de conversión del prototipo son fijas y
sirven solo para mostrar el comportamiento. En producción, o bien los precios locales los
define la tienda (App Store / Play Store manejan precios por región), o bien se traen de un
servicio de cambio. **No hardcodear tasas.** Los montos en USD sí son la fuente de verdad:
confirmarlos con negocio antes de implementar.

### 7b. País de residencia
**Propósito**: elegir en qué moneda se muestran y se cobran los precios. Capa a pantalla
completa, título "¿Dónde vivís?", con el mismo ✕ circular.

Se entra desde dos lugares: la fila "Cobramos en" de Planes y la fila "País de residencia"
del Perfil. **Vuelve al lugar del que se entró**, no siempre al mismo (`countryFrom`).

Lista de ocho países, cada fila con nombre (15px) y moneda + símbolo debajo en `mut`. El
elegido lleva fondo `l14`, borde acento, texto acento, peso 600 y un ✓ a la derecha. Bajada:
"Los planes están en dólares. Elegí tu país y te mostramos cuánto es en tu moneda."

Países del prototipo: Estados Unidos (USD), Argentina (ARS), Uruguay (UYU), Chile (CLP),
México (MXN), Colombia (COP), Perú (PEN), España (EUR). **La lista real debería salir de las
regiones donde la app esté publicada.**

### 8. Receta
**Propósito**: cocinar. Pantalla completa sobre el Menú.

**Layout**: capa a pantalla completa con fondo **`card`** (más claro que `bg`) para que se
lea como una ficha aparte. Entra deslizándose desde abajo: 24px de traslación + fade, 320ms,
`cubic-bezier(.2,.8,.2,1)`.

**Componentes**:
- Eyebrow "Receta · lunes" en acento.
- Nombre en Newsreader 30px, hasta dos líneas.
- **✕ arriba a la derecha**: círculo de 36px con borde `l40`. Cierra.
- **Tira de tres metadatos** entre dos hairlines `l26`, separados por divisores verticales
  de 1px: Porciones / Tiempo / Dificultad, label 12px en acento y valor en Newsreader 17px.
- **Ingredientes**: nombre a la izquierda, **línea de puntos** (`mut40`) que rellena el
  espacio, cantidad en Newsreader a la derecha. Separador `l14` entre filas. Es una carta de
  emporio, no una lista con viñetas — la línea de puntos importa.
- **Preparación**: numeral en Newsreader 22px acento (ancho mínimo 22px) + texto en Plus Jakarta Sans 14.5px,
  line-height 1.6, gap de 14px, 14px entre pasos.
- El cuerpo scrollea; el encabezado y los metadatos quedan fijos.

---

## Interactions & Behavior

**Navegación**: barra de pestañas persistente de 62px con **dos destinos: Semana y
Compras** — fondo `card`, borde superior `l26`, label 14px. La activa va en acento con peso
600; la inactiva en `mut` con peso 500. **No hay riel, subrayado ni indicador extra**: la
distinción es solo color y peso. Los CTA de Semana quedan flotando **62px por encima** de la
barra, sobre su degradado.

**El Perfil no es una pestaña.** Se entra por el avatar del header y se sale con la flecha
de volver, que regresa a la pantalla desde la que se entró (`backTo`). Meterlo como tercera
pestaña le daría el mismo peso que al flujo de comida, que es lo que la app hace; el avatar
es el patrón que la gente ya reconoce para "mi cuenta".

**Acceso al perfil**: en el header de las tres pantallas del flujo, **solo el avatar** —
círculo de 36px con las iniciales, sin nombre, sin chevron y sin píldora alrededor. Es el
patrón que la gente ya reconoce y no compite con la marca. Área táctil de 44px vía
`data-tap`.

*Semana* recuerda en qué paso estabas: si ya hay menú entra al Menú, si no a Ingredientes.
Dentro, el indicador de dos pasos navega en ambos sentidos (ver arriba) y "Semana nueva" limpia
foto, ingredientes, menú y tachados — **pero no las restricciones**, que ahora viven en el
perfil. Compras sin menú muestra un vacío explicado. Receta, Datos personales, Planes y País son
capas a pantalla completa con ✕. **Cerrar una capa y entrar al perfil son acciones
distintas** (`closeLayer` vs `goProfile`): si el ✕ reusa el handler de entrada, la capa se
reabre sola y queda un bucle. "Cerrar sesión" está al final del Perfil.

### Movimiento

Cuatro animaciones en toda la app. No hay más, y no debería haberlas: cada una responde a
un evento distinto y agregar una quinta las vuelve ruido.

| Nombre | Curva y duración | Dónde | Qué comunica |
|---|---|---|---|
| `scr` | 6px ↑ + fade, 350ms ease (400ms el Ingreso) | Entrada de cada pantalla del flujo, y de los bloques que aparecen dentro (sin detección, campo "Otros", "Listo para cocinar", "Listo, ya está todo") | Esto es nuevo, llegó recién |
| `rise` | 24px ↑ + fade, 320ms `cubic-bezier(.2,.8,.2,1)` | Capas a pantalla completa: Receta, Datos personales, Planes, País | Esto se apoya **encima** de lo anterior, no lo reemplaza |
| `pop` | escala 0.82 → 1.06 → 1, 220ms | Chips de ingrediente al agregarse | Se sumó un elemento a una lista que ya estabas mirando |
| `shake` | ±4px horizontal, 300ms | Error de ingreso y error de generación | Algo salió mal acá, no avanzaste |

Más el `spin` de 800ms lineal de los dos spinners (26px en el análisis de foto, 13px dentro
del CTA al generar), que es indicador de progreso, no animación de interfaz.

La distinción entre `scr` y `rise` es intencional y conviene sostenerla: **la distancia
codifica la jerarquía**. 6px es "cambió el contenido"; 24px es "se abrió una capa que vas a
cerrar". Si las dos usan la misma distancia, se pierde la pista de si hay que apretar ✕ o
volver con la pestaña.

**Los cambios de estado de casillas, chips y botones son inmediatos, sin transición de
fondo.** En el prototipo web, una transición sobre el color de fondo dejaba el control
pintado en su valor anterior aunque el estado ya hubiera cambiado. En React Native no aplica
esa limitación, pero el criterio se mantiene — el feedback correcto vale más que un
desvanecido de 180ms. Nada más largo de 400ms: la app tiene que sentirse rápida.

En React Native: `scr`, `rise` y `pop` salen bien con `Animated.timing` sobre
`translateY`/`opacity`/`scale`; `shake` con una secuencia de cuatro tramos. `LayoutAnimation`
alcanza para la aparición y borrado de chips.

**Tiempos simulados en el prototipo** (reemplazar por las llamadas reales):
- Análisis de foto: 1700ms → `POST` de la imagen al backend, que llama a Gemini Vision.
- Generación del menú: 1500ms → `POST` con ingredientes + restricción, devuelve las comidas
  con `missing` y receta.

**Regenerar**: toma la primera comida del banco que no esté ya en el menú, conserva el día y
el estado de incluida, e incrementa el contador de regeneraciones de esa tarjeta. En
producción es una llamada al backend pidiendo un reemplazo, excluyendo las comidas ya
propuestas.

**Modo claro / oscuro**: toggle en el header de todas las pantallas ("MODO OSCURO" /
"MODO CLARO"). En la app debería arrancar siguiendo `useColorScheme()` — el hook ya está en
`mobile/theme.ts` — y que el toggle lo override manualmente.

## State Management
Estado del prototipo, para mapear a hooks o al store que use la app:

| Estado | Tipo | Notas |
|---|---|---|
| `screen` | `'auth' \| 'ing' \| 'menu' \| 'shop' \| 'profile' \| 'account' \| 'plans' \| 'country'` | Reemplazar por el navigator real |
| `dark` | boolean | Inicializa desde `useColorScheme()` |
| `signup` | boolean | Login vs registro |
| `email`, `pass`, `authError` | string | Validación en cliente antes de Supabase |
| `photo` | `'none' \| 'loading' \| 'ok' \| 'empty'` | Estado de la visión |
| `manualOpen`, `manualText` | boolean, string | Carga a mano |
| `chips` | string[] | Minúsculas, sin duplicados |
| `draft` | string | Input de agregado |
| `restriction` | string | Selección única. **Vive en el perfil**, se lee en Ingredientes |
| `otherText` | string | Solo con "Otros" |
| `generating`, `genError` | boolean, string | Estado del CTA |
| `meals` | objeto[] | `day, name, desc, missing[], servings, time, difficulty, ing[][], steps[], on, regen` |
| `bought` | string[] | Ítems tachados; se limpia al cambiar el menú |
| `recipeIdx` | number \| null | Receta abierta |
| `userName`, `nameDraft`, `nameSaved` | string, string, boolean | Edición de nombre |
| `plan` | `'trial' \| 'plus'` | Mapea a `Entitlement.status` de `mobile/lib/plan.ts` |
| `trialLeft` | number | `Entitlement.trialDaysLeft` |
| `pickedPlan` | `'free' \| 'mensual' \| 'anual'` | Selección en la pantalla de Planes |
| `country` | string | Código ISO del país. Define moneda y conversión de todos los precios |
| `countryFrom` | `'plans' \| 'profile'` | A dónde vuelve la capa de país al cerrarse |
| `ad` | `null \| {i, phase, left}` | Compuerta de regeneración: índice de la comida, `'offer'`/`'playing'`, segundos restantes |
| `notifs` | `{lista, receta, semana}` | Tres switches de avisos |
| `weeksPlanned`, `mealsCooked` | number | Estadísticas del perfil |

**Datos**: el prototipo trae 9 comidas completas con receta (5 en el menú inicial + 4 de
reemplazo), con las tres comidas del brief textuales. Sirven de datos de prueba y de
**referencia del tono de las recetas** — instrucciones cortas, en voseo, con el truco
práctico incluido ("Usá arroz del día anterior: seco saltea mucho mejor"). Vale la pena que
el prompt del backend apunte a ese registro.

## Assets
Ninguno propio. Los avatares son **iniciales tipográficas**, no imágenes: si más adelante se
sube foto, ocupa el mismo círculo (36px en el header, 76px en el Perfil) y las iniciales
quedan de fallback. Fuentes de Google Fonts: **Newsreader** (500, 600, itálica) y
**Plus Jakarta Sans** (400, 500, 600, 700). En Expo, cargarlas con `expo-font` /
`@expo-google-fonts`.
Las fotos de comida son placeholders: no hay imágenes reales todavía.

## Files
- `Semanita Prototipo.dc.html` — **la referencia principal**: el prototipo navegable con las
  9 pantallas, los dos modos y todos los estados (carga, error, sin detección, lista vacía,
  todo comprado, prueba y Plus activo). Para ver el estado Plus: Perfil → Ver los planes →
  elegir uno → suscribirme; "Cancelar renovación" vuelve a la prueba. Se abre directo en el navegador. La lógica del flujo está en el bloque
  `<script data-dc-script>` del final; el markup y los estilos, arriba.
- `Semanita Tablero.dc.html` — el tablero de exploración, ordenado del turno más reciente al
  más antiguo: la dirección final, las dos alternativas tipográficas que se descartaron, las
  paletas que se evaluaron, tres variantes de la pantalla de Menú y la recreación del diseño
  anterior. Útil para entender **por qué** el diseño quedó así.

  **Solo el turno de arriba refleja la dirección vigente.** Todo lo de abajo son
  exploraciones históricas que se dejan a propósito sin actualizar: vas a ver ahí otras
  tipografías, versalitas y montos en pesos. Ante cualquier diferencia, **manda el prototipo
  y este README** — el tablero no es referencia de implementación.

## Los checkmarks NO son texto

Los tildes **ya están como SVG en el prototipo**: buscá `<svg viewBox="0 0 12 12">` y vas a
encontrar exactamente el trazo a implementar.

Antes estaban escritos como el carácter `✓` (U+2713) con `font-family: 'Plus Jakarta Sans'`,
y esa es la trampa a evitar: Plus Jakarta Sans no tiene ese glifo, así que el sistema lo
sustituye en silencio por cualquier fuente instalada que sí lo tenga — en el navegador una,
en iOS otra, en Android otra. Por eso el tilde se veía distinto en cada lugar. Lo mismo pasa
con `✕`, `←`, `→` y `›`: **ninguno queda ya como texto en el prototipo.**

**Implementalo como vector, nunca como texto.** En React Native, `react-native-svg`:

```tsx
import Svg, { Path } from 'react-native-svg';

export function Check({ size = 12, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path d="M2.5 6.2 L4.8 8.5 L9.5 3.5" stroke={color} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
```

Reglas del tilde, iguales en los tres lugares donde aparece (casilla de comida, casilla de
la lista de compras, fila del país):

- **Trazo de 2px** con extremos y unión redondeados. El vértice cae aproximadamente en el
  40% del ancho: brazo corto a la izquierda, largo a la derecha.
- **Tamaño**: 12px de alto dentro de una casilla de 20–22px. El tilde ocupa poco más de la
  mitad de la casilla; llenarla lo hace ver tosco.
- **Color**: `onAccent` cuando la casilla está rellena de acento; `accent` cuando va suelto
  sobre el fondo (la fila del país).
- El mismo componente en todos lados. Si aparece un `✓`, una fuente de íconos o un emoji en
  el código, está mal.
- **La casilla no desaparece cuando no está tildada**: se oculta el tilde, no la casilla. En
  el prototipo eso es `opacity` sobre el `<svg>`, nunca sobre el contenedor — si va sobre el
  contenedor, al destildar se borran también el borde y el relleno.

Lo mismo vale para el resto de los glifos del prototipo: `✕`, `←`, `→` y `›` son atajos de
maqueta. En la app van como íconos vectoriales del mismo set, con el mismo grosor de trazo
de 2px, para que todo el sistema de íconos se vea de una sola familia.

## Cómo se relaciona con el código actual

### `mobile/theme.ts` — el primer archivo a tocar
El archivo ya tiene la forma correcta (tipo `Theme`, `lightTheme`/`darkTheme`, `radii`,
y `useAppTheme()` con override manual sobre `useColorScheme()`). **La estructura se conserva;
cambian los valores y se agregan claves.** El toggle de modo del diseño se conecta
directamente a `toggleMode()`, que ya existe.

Mapa de la nomenclatura del prototipo a las claves de `Theme`:

| Prototipo | `Theme` | Cambio |
|---|---|---|
| `bg` | `bg` | `#F7F1E4` → `#F4EEE6` / `#16241B` → `#1B1816` |
| `card` | `surface` | `#FFFEF9` → `#FFFBF5` / `#1E3024` → `#241F1C` |
| `ink` | `ink` | `#211A11` → `#211C18` / `#F4ECDA` → `#F1E8DE` |
| `mut` | `inkSoft` | `#6B5D45` → `#6B5D52` / `#B4A98F` → `#ABA096` |
| `acc` | `accent` | `#A9812E` → `#A9552C` / `#C9A227` → `#D9834A` |
| `onAcc` | `accentInk` | queda `#1B140A` → `#FBF3EC` en claro, `#1B1816` en oscuro |
| `acc` | `accentText` | se unifica con `accent`: ahora hay **un solo** cobre |
| — | `accent2`, `onAccent2` | **eliminar**: el bordó `#8C2C34`/`#9C2E37` sale del sistema |
| `l40` | `border` | `rgba(169,85,44,0.40)` / `rgba(217,131,74,0.40)` |
| `card` | `chipBg` | los chips ahora van sobre papel, no sobre un tinte del acento |
| `l14/20/26` | nuevas | tres niveles de hairline |
| `mut40/60` | nuevas | punteado, borde de casilla |
| `ph1`, `ph2` | nuevas | trama del placeholder de foto |

El bordó era el problema principal de la paleta anterior: los tildes de "incluir esta
comida" leían como error. Ahora **incluido = cobre**, y el rojo no se usa en la UI.

`radii` cambia: `card: 12 → 14`, `btn: 4 → 11`, `check: 3 → 2`, `chip: 999` queda, y se
suman `btnSecondary: 10`, `cardMembership: 16`, `cardStat: 12`, `photo: 6`, `empty: 6`.

Las fuentes dejan de resolverse con `Platform.select`: **Newsreader** y **Plus Jakarta Sans**
se cargan explícitamente con `expo-font` (`@expo-google-fonts/newsreader`,
`@expo-google-fonts/plus-jakarta-sans`), y hay que sumar la itálica de Newsreader
(`Newsreader_500Medium_Italic`) porque el diseño la usa en contadores y en la palabra
"semanita".

**El reparto entre las dos familias no es decorativo, es la regla del sistema**: Newsreader
solo en títulos grandes, nombres de receta y cifras destacadas, en 500/600. Plus Jakarta Sans
en absolutamente todo lo funcional — botones, listas de ingredientes, pasos de preparación,
gramos, fechas — en 400/500/600.

```ts
export type Theme = {
  bg: string; surface: string; ink: string; inkSoft: string;
  accent: string; accentInk: string;
  border: string;      // l40
  l14: string; l20: string; l26: string;
  mut40: string; mut60: string;
  ph1: string; ph2: string;
  chipBg: string;
  fontDisplay: string; fontDisplayItalic: string; fontBody: string;
};

export const radii = {
  btn: 11, btnSecondary: 10, card: 14, cardMembership: 16, cardStat: 12,
  chip: 999, check: 2, photo: 6, empty: 6, field: 4,
};

export const lightTheme: Theme = {
  bg: '#F4EEE6', surface: '#FFFBF5', ink: '#211C18', inkSoft: '#6B5D52',
  accent: '#A9552C', accentInk: '#FBF3EC',
  border: 'rgba(169,85,44,0.40)',
  l14: 'rgba(169,85,44,0.14)', l20: 'rgba(169,85,44,0.20)', l26: 'rgba(169,85,44,0.26)',
  mut40: 'rgba(107,93,82,0.40)', mut60: 'rgba(107,93,82,0.60)',
  ph1: '#E6DCCF', ph2: '#DCCFC0',
  chipBg: '#FFFBF5',
  fontDisplay: 'Newsreader_600SemiBold',
  fontDisplayItalic: 'Newsreader_500Medium_Italic',
  fontBody: 'PlusJakartaSans_400Regular',
};

export const darkTheme: Theme = {
  bg: '#1B1816', surface: '#241F1C', ink: '#F1E8DE', inkSoft: '#ABA096',
  accent: '#D9834A', accentInk: '#1B1816',
  border: 'rgba(217,131,74,0.40)',
  l14: 'rgba(217,131,74,0.14)', l20: 'rgba(217,131,74,0.20)', l26: 'rgba(217,131,74,0.26)',
  mut40: 'rgba(171,160,150,0.40)', mut60: 'rgba(171,160,150,0.60)',
  ph1: '#2C2622', ph2: '#221D1A',
  chipBg: '#241F1C',
  fontDisplay: 'Newsreader_600SemiBold',
  fontDisplayItalic: 'Newsreader_500Medium_Italic',
  fontBody: 'PlusJakartaSans_400Regular',
};
```

Nota sobre pesos: en React Native los pesos de Plus Jakarta Sans se cargan como familias
separadas (`PlusJakartaSans_500Medium`, `PlusJakartaSans_600SemiBold`,
`PlusJakartaSans_700Bold`), no con `fontWeight`. Conviene un helper o cuatro claves de fuente
en el tema en lugar de pasar `fontWeight` en los estilos.

### Los demás archivos
- `mobile/components/AuthScreen.tsx` — pantalla 1. Los campos pasan de caja con borde a
  **solo borde inferior** con label en mayúsculas arriba, y se agrega la validación en
  cliente (email y largo mínimo) antes de llamar a Supabase.
- `mobile/App.tsx` — hoy es un `ScrollView` único donde se apila todo el flujo. El rediseño
  lo **separa en tres pasos** con indicador de progreso: hay que partirlo en pantallas
  (Ingredientes, Menú, Compras) y agregar la navegación.
- `mobile/components/RecipeModal.tsx` — pantalla 5, con el layout nuevo (metadatos en tira,
  ingredientes con línea de puntos).
- `mobile/components/ProfileModal.tsx` — hoy el perfil es un `Modal`; el rediseño lo
  convierte en **una pestaña de primer nivel**. El contenido del modal actual (nombre, email,
  estado de suscripción) es la base de los bloques a) y b); se le suman estadísticas,
  restricciones y avisos. Lo que hoy es el modal pasa a ser la capa "Datos personales".
- `mobile/lib/plan.ts` — el `Entitlement` (`status`, `trialDaysLeft`, `subscribed`) alcanza
  para los dos estados diseñados. Para la tarjeta de Plus falta **la fecha de renovación** y
  **cuál de los dos planes** está activo; conviene sumarlos al payload en vez de inferirlos.
- `backend/src/entitlements.ts` — `TRIAL_DAYS` alimenta la barra de progreso de la prueba.
- **Navegación** — hoy no hay navigator. Hay que introducir uno con tres pestañas; las capas
  (Receta, Datos personales, Planes) siguen siendo `Modal` con `presentationStyle` deslizado.
- `mobile/components/Checkbox.tsx` — casilla de 20–22px, radio 2, borde 1.5px: relleno
  `accent` con ✓ en `accentInk` cuando está activa, solo borde `mut60` cuando no. Ya no usa
  `accent2`. El área tocable real debe llegar a 44x44 con `hitSlop`.
- `mobile/components/Buttons.tsx` — botón principal: radio 11, padding 17, Plus Jakarta Sans
  600 a 14px, **tono de frase y sin `letterSpacing`**. Secundario: radio 10, borde `border`,
  sin relleno. Alto mínimo de 44px en ambos. Agregar la variante con spinner y label alternativo para el estado de carga.
- `mobile/lib/telemetry.ts` — vale la pena registrar los eventos nuevos: fuente elegida
  (foto / galería / a mano), regeneraciones por comida, comidas destildadas y porcentaje de
  la lista tachado. Son las cuatro señales que dicen si el menú generado sirve.
- `backend/` — sin cambios de diseño. Lo único que pediría el rediseño es que el menú venga
  con la **categoría de cada faltante** y con el campo de dificultad, para no inferirlos en
  el cliente.
