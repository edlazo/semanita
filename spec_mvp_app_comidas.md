# App de comidas — Spec de MVP

## 1. Problema y propuesta de valor

Elias (y mucha gente en la misma situación) no planifica comidas con anticipación, lo que lleva a saltear comidas o a decidir mal último momento. La app resuelve esto: el usuario indica qué tiene disponible (foto o texto) y la app genera un menú semanal + lista de compras, sin fricción.

**Propuesta de valor en una frase:** "Sacale una foto a tu heladera y te armamos la semana."

## 2. Usuario objetivo (MVP)

Gente joven (18-30), vive sola o comparte casa, tiene poco tiempo/ganas de planificar comidas, ya usa apps de productividad o fitness. Se promociona en redes (TikTok/Reels/Shorts) mostrando la app en uso — sin venta directa ni contacto con clientes.

## 3. Flujo principal (core loop)

1. Usuario abre la app → saca foto de la heladera/alacena, o escribe una lista rápida de lo que tiene.
2. La app (vía IA) identifica ingredientes disponibles.
3. Usuario indica preferencias básicas: cuántas comidas necesita para la semana, restricciones (vegetariano, sin gluten, etc. — opcional en MVP).
4. La app genera un menú de la semana (ej. 5-7 comidas) usando lo disponible + sugiere qué comprar para completar.
5. Usuario ve la lista de compras generada (agrupada por categoría: verdulería, almacén, etc.).
6. Usuario puede regenerar/ajustar una comida individual si no le gusta la sugerencia.

## 4. Features del MVP (lo mínimo para lanzar)

- Input por foto o texto de ingredientes disponibles.
- Generación de menú semanal con IA (usando la API de un modelo de lenguaje con visión, ej. Claude).
- Lista de compras auto-generada a partir del menú.
- Guardar/ver el menú de la semana actual.
- Registro de usuario simple (email o Google/Apple sign-in).

**Fuera del MVP (fase 2+):** seguimiento nutricional/calorías, historial de menús pasados, compartir menú, integración con supermercados, modo "batch cooking", recordatorios push, comunidad/recetas de otros usuarios.

## 5. Stack técnico recomendado

| Capa | Recomendación | Por qué |
|---|---|---|
| App móvil | React Native + Expo | Un solo código para iOS y Android, ecosistema grande, fácil de iterar rápido, buen soporte para publicar en ambas tiendas |
| Backend / DB | Supabase (Postgres + Auth + Storage) | Gratis para empezar, auth lista, storage para las fotos, no hay que mantener servidor propio |
| IA (parseo de imagen + generación de menú) | API de Claude (modelo con visión) | Ya conocés el ecosistema, buena relación calidad/costo para este caso de uso |
| Pagos / suscripción | RevenueCat + Apple/Google in-app purchases | Maneja las suscripciones en ambas plataformas sin reinventar la rueda |
| Analytics | PostHog o Mixpanel (plan gratuito) | Para saber qué pantallas usan, dónde abandonan, etc. |

**Nota:** este stack está pensado para que puedas avanzar solo con conocimientos de JavaScript/React, sin necesitar Swift/Kotlin nativos.

## 6. Monetización

- **Freemium**: X menús gratis por mes, después pide suscripción.
- **Suscripción**: mensual, precio a definir (referencia de mercado: apps similares suelen ir de USD 3-8/mes).
- Sin anuncios en el MVP — simplifica el desarrollo y no distrae del producto.

*(Esto es una recomendación inicial, no una decisión cerrada — ajustar precio y límites del free tier una vez que haya usuarios reales dando feedback.)*

## 7. Marketing (según lo conversado)

Contenido orgánico en redes (TikTok/Instagram Reels) mostrando el flujo real de uso ("le saco foto a mi heladera y mirá lo que me arma"). Nada de venta directa ni contacto uno a uno — el objetivo es que el usuario llegue solo desde el contenido o la tienda de apps (ASO: buen nombre, ícono, capturas de pantalla claras).

## 8. Métricas de éxito iniciales

- Usuarios que completan el flujo completo (foto → menú → lista de compras) en su primer uso.
- Retención a 7 días (¿vuelven la semana siguiente a generar otro menú?).
- Conversión de free a suscripción.

## 9. Riesgos / cosas a validar rápido

- **Costo de la API de IA por usuario**: hay que calcular cuánto cuesta cada generación de menú (imagen + texto) y asegurarse de que el precio de suscripción lo cubra con margen.
- **Calidad del reconocimiento de ingredientes en fotos reales** (heladeras desordenadas, mala luz) — probar con fotos reales propias antes de construir toda la app.
- **¿La gente confía en un menú generado por IA?** — vale la pena testear el concepto con un prototipo simple (incluso manual) antes de invertir mucho tiempo de desarrollo.

## 10. Próximos pasos concretos

1. Instalar Claude Code y crear la carpeta del proyecto.
2. Armar un prototipo mínimo: una sola pantalla que reciba una foto, la mande a la API de Claude, y devuelva una lista de ingredientes detectados. Validar que esto funciona bien antes de construir el resto.
3. Una vez validado el reconocimiento, sumar la generación del menú semanal.
4. Recién después: pantallas de lista de compras, guardado, auth, suscripción.

**Sugerencia:** no construyas todo el flujo de una — validá el paso más riesgoso (reconocimiento de ingredientes desde foto) primero, con el mínimo código posible.
