# MyPlants

Web estática con las fichas de cuidado de las plantas que Carlos tiene en casa.

Objetivo doble:
1. Que la web sea **visualmente excelente** — es el criterio de éxito principal.
2. Que el proyecto sirva de **sandbox para aprender Agent Teams**. Preferimos hacer las cosas
   en paralelo con teammates aunque en solitario fuera más rápido: el aprendizaje es parte del entregable.

## Stack — restricciones duras

- HTML + CSS + JavaScript **vanilla**. Sin framework, sin build step, sin bundler, sin dependencias.
- Un único `index.html`. JS como ES modules (`<script type="module">`), sin transpilar.
- CSS nativo moderno: custom properties, nesting, `@layer`, container queries, `color-mix()`.
  Sin preprocesadores, sin Tailwind, sin CSS-in-JS.
- Debe funcionar sirviendo ficheros estáticos: `python3 -m http.server 8000` desde la raíz y listo.
- **Cero requests a terceros.** Tipografías self-hosted en `assets/fonts/` o system stack.
  Nada de Google Fonts, CDNs ni analytics.
- Imágenes en `assets/img/`, siempre con `width`/`height` explícitos y `loading="lazy"`.
- Accesibilidad no negociable: HTML semántico, contraste AA mínimo, navegable con teclado,
  focus visible, `prefers-reduced-motion` respetado.

## Estructura

```
index.html
css/tokens.css          design tokens — única fuente de color, tipografía y espaciado
css/app.css             layout y componentes
js/app.js               entry point
js/*.js                 módulos
content/plantas.json    datos de las plantas — única fuente de contenido
assets/fonts/           tipografías self-hosted
assets/img/             fotos
docs/brief.md           brief de diseño y contenido
docs/inventario.md      las plantas reales de Carlos (input humano)
docs/decisiones.md      log de decisiones del equipo
```

**Regla dura:** ningún color, tamaño de fuente ni espaciado se escribe a mano fuera de
`css/tokens.css`. En el resto del CSS solo `var(--…)`. Si falta un token, se añade al fichero
de tokens (hablando con `ux-lead`), no se hardcodea.

## Contenido

`content/plantas.json` es la única fuente de verdad. Campos por planta:

`id`, `nombre_comun`, `nombre_cientifico`, `familia`, `foto`, `historia`, `riego`, `luz`,
`humedad`, `temperatura`, `sustrato`, `abonado`, `trasplante`, `plagas_comunes`,
`toxicidad_mascotas`, `dificultad`, `notas_carlos`, `fuentes`

Reglas de contenido:

- **La lista de plantas la da Carlos** (ver `docs/inventario.md`). No inventar plantas ni añadir
  especies "de relleno" para que la rejilla quede simétrica.
- Los datos botánicos se **verifican** y se citan en `fuentes` (POWO/Kew, RHS, GBIF).
  Si un dato no se puede verificar, se marca como `null` y se anota — nunca se rellena a ojo.
- `toxicidad_mascotas` es información de seguridad: se cita fuente siempre, o se deja `null`.
- `historia` y `notas_carlos` son personales. Se preguntan a Carlos; no se fabrican.

## Equipo (Agent Teams)

Reparto estricto de ficheros — dos teammates editando el mismo fichero se pisan:

| Teammate    | Rol                                                      | Ficheros que posee                        |
| ----------- | -------------------------------------------------------- | ----------------------------------------- |
| `ux-lead`   | Dirección visual: tokens, tipografía, layout, motion     | `css/tokens.css`, `docs/brief.md`         |
| `builder`   | HTML semántico y JS vanilla                              | `index.html`, `js/`, `css/app.css`        |
| `botanist`  | Contenido: especies, cuidados, toxicidad, fuentes        | `content/plantas.json`                    |
| `qa-visual` | Screenshots, a11y, rendimiento, revisión visual          | `tests/`, `docs/qa/`                      |

Si necesitas cambiar un fichero que no es tuyo, manda un mensaje a su dueño. No lo edites.

## Proceso

- `ux-lead` trabaja en **plan mode** y necesita aprobación del lead antes de tocar código.
- Nada se considera terminado sin que `qa-visual` lo haya visto en screenshot. "Compila" no es "está bien".
- Las decisiones de diseño con alternativas descartadas van a `docs/decisiones.md`, una línea por decisión.
- Evitar el "look de IA": si una elección de paleta, tipografía o layout es la que harías para
  cualquier otra web, no es una elección — es un default. Ver `docs/brief.md`.
