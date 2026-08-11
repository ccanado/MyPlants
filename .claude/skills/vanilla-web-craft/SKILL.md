---
name: vanilla-web-craft
description: Cómo construir web estática sin build step — HTML semántico, CSS nativo moderno (custom properties, @layer, nesting, container queries, color-mix) y JS vanilla como ES modules, con disciplina estricta de design tokens, cero requests a terceros y accesibilidad AA. Úsala siempre que vayas a escribir o editar index.html, css/*.css o js/*.js en este proyecto, cuando dudes si algo necesita build o dependencia, cuando vayas a poner un color o un tamaño en CSS, cuando montes render de datos desde JSON sin framework, o cuando alguien proponga añadir una librería, un CDN o una fuente de Google. También cuando revises si un cambio rompe la restricción de "servir ficheros estáticos y listo".
---

# Vanilla web craft

## Por qué existe este skill

En este proyecto el navegador **es** el runtime. No hay bundler que arregle un import mal
escrito, no hay PostCSS que rellene un fallback, no hay `npm install` que tape un hueco.
Eso suena a limitación y en 2026 casi no lo es: casi todo aquello por lo que se metía una
herramienta —variables, nesting, scoping, componentes, media queries por contenedor— tiene
equivalente nativo. Lo que sí desaparece es el margen de error: cada fichero que escribes
es exactamente lo que ejecuta el navegador.

Trabaja desde esa idea. Antes de añadir cualquier cosa, pregúntate qué plataforma nativa
resuelve el problema. Casi siempre hay una, y suele ser más pequeña.

## Las restricciones, y qué las motiva

| Restricción | Motivo real |
| --- | --- |
| Sin framework, sin build, sin dependencias | El proyecto tiene que seguir funcionando dentro de cinco años sin reinstalar nada |
| Un único `index.html`, JS como ES modules | Sin transpilar: lo que lees en el fichero es lo que corre |
| CSS nativo moderno, sin preprocesador | `@layer` + nesting + custom properties cubren lo que daba Sass |
| `python3 -m http.server 8000` y listo | Si necesita un paso previo, está roto |
| Cero requests a terceros | Privacidad y permanencia: nada que dependa de que un CDN siga vivo |
| Tokens como única fuente de color/tipo/espaciado | Un rediseño se hace en un fichero, no en trescientas líneas |
| Accesibilidad AA no negociable | La página existe para consultarse con prisa, a veces con una mano |

Cuando una restricción parezca estorbar, dilo en voz alta en vez de saltártela en silencio.
Casi siempre el problema es el enfoque, no la restricción.

## Disciplina de tokens

La regla es simple y no tiene excepciones cómodas: **fuera de `css/tokens.css` no se escribe
ningún valor literal de color, tamaño de fuente ni espaciado.** Solo `var(--…)`.

```css
/* mal — tres decisiones de diseño enterradas en un componente */
.ficha {
  padding: 1.25rem;
  color: #2b3a2f;
  font-size: 15px;
}

/* bien — el componente compone, no decide */
.ficha {
  padding: var(--space-4);
  color: var(--color-texto);
  font-size: var(--texto-s);
}
```

Si falta un token, **no lo inventes en tu fichero**: mándale un mensaje a `ux-lead`, que
posee `css/tokens.css`, y espera. Un token improvisado en `app.css` es una bomba de relojería
para el siguiente rediseño, y además rompe el reparto de ficheros del equipo.

Valores que sí puedes escribir literales porque no son decisiones de diseño: `0`, `100%`,
`1fr`, `auto`, `min-content`, `currentColor`, `transparent`, `1px` en un borde estructural
que el diseño no tematiza. Si dudas, es que era un token.

Comprueba tu trabajo con el script incluido antes de decir que has terminado:

```bash
python3 .claude/skills/vanilla-web-craft/scripts/check-tokens.py
```

Detecta literales de color, tamaños y espaciados fuera de `tokens.css`, y también `var(--x)`
usadas pero nunca definidas — el fallo silencioso más frecuente de este estilo de CSS, porque
una custom property inexistente no da error: simplemente no pinta nada.

## CSS: lo nativo primero

El orden de capas se declara **una vez, arriba**, y decide toda la especificidad del proyecto.
Con `@layer` bien puesto casi nunca necesitas subir selectores ni usar `!important`:

```css
@layer reset, base, layout, componentes, utilidades;
```

Lo que conviene usar de forma deliberada aquí:

- **Nesting** para mantener el componente junto, pero plano. Más de dos niveles de anidación
  y estás recreando el problema que Sass hizo famoso.
- **Container queries** en vez de media queries para todo lo que sea un componente. Una ficha
  de planta debe reaccionar al hueco que le dan, no al ancho de la ventana; así funciona igual
  en una rejilla de dos o de cuatro columnas sin tocar nada.
- **`color-mix()`** para estados (hover, disabled, superficies elevadas) derivándolos del token
  base en lugar de pedir un token nuevo por cada variación.
- **`:has()`** para lógica que antes obligaba a meter JS: una tarjeta que cambia si contiene
  una imagen, un formulario que reacciona a su input inválido.
- **`@property`** cuando quieras animar una custom property; sin registrar el tipo, el navegador
  la interpola como texto y la animación no ocurre.
- **`prefers-reduced-motion`**: no como parche final, sino decidiendo qué versión de cada
  transición es la reducida.

Detalle completo con ejemplos y trampas: `references/css-nativo.md`.

## JS: módulos pequeños y datos que fluyen en una dirección

El JS de este proyecto hace tres cosas: cargar `content/plantas.json`, renderizarlo y
responder a la interacción (buscar, filtrar, abrir una ficha). No necesita más arquitectura
que esa, y meterle más la hace peor.

Principios que aguantan bien sin framework:

- **Un módulo, una responsabilidad, exports nombrados.** `js/app.js` orquesta; el resto son
  funciones puras siempre que se pueda: datos entran, DOM sale.
- **Render desde datos, no mutación del DOM a mano.** Ten una función que dada una planta
  devuelva su nodo. Cuando cambia el estado, vuelves a renderizar el trozo afectado. Es más
  fácil de leer que quince `querySelector` corrigiendo el DOM a posteriori.
- **`<template>` + `cloneNode`** para el markup repetido. Mantiene el HTML en el HTML, donde
  se puede auditar la semántica, y evita `innerHTML` con datos del JSON.
- **Delegación de eventos** en el contenedor en lugar de un listener por tarjeta.
- **Nada de estado global suelto.** Un objeto de estado y una función que lo actualiza y
  re-renderiza es suficiente; ver el patrón mínimo en `references/js-vanilla.md`.
- **`fetch` relativo** (`./content/plantas.json`) y manejo explícito del fallo: si el JSON no
  carga, la página dice algo, no se queda en blanco.

Ojo con una consecuencia de no tener build: los ES modules exigen servidor. Abrir
`index.html` con doble clic (`file://`) rompe los imports y el `fetch` por CORS. Verifica
siempre con `python3 -m http.server 8000`.

Patrones concretos, incluido el de render y el de estado: `references/js-vanilla.md`.

## Accesibilidad, integrada y no auditada al final

Se construye accesible desde el primer commit porque retrofitarlo cuesta el triple:

- Un solo `<h1>`, jerarquía de encabezados sin saltos. Cada planta es un `<article>` con su
  encabezado real.
- Landmarks: `header`, `nav`, `main`, `footer`. Un `skip link` al principio.
- Lo que navega es `<a>`; lo que actúa es `<button>`. Nunca un `div` con `onclick`.
- Focus visible **diseñado**, no el default eliminado. `:focus-visible` con un anillo que
  contraste sobre cualquier superficie del sistema.
- Contraste AA (4.5:1 texto normal, 3:1 texto grande y bordes de controles). Se comprueba,
  no se estima a ojo.
- Imágenes: `alt` que describa la planta útilmente ("Monstera deliciosa junto a la ventana
  del salón"), o `alt=""` si es puramente decorativa. Siempre `width`/`height` explícitos
  y `loading="lazy"`, que además evita el salto de layout.
- Filtros y búsqueda: anuncia los resultados con una región `aria-live="polite"`, o quien
  use lector de pantalla no sabrá que la lista cambió.

Checklist operativa y cómo verificar cada punto: `references/a11y.md`.

## Cero terceros y rendimiento

Sin dependencias, el rendimiento es casi todo disciplina de assets:

- Tipografías **self-hosted** en `assets/fonts/`, en `woff2`, subseteadas a los glifos que
  usa el español, con `font-display: swap` y `@font-face` local. Si una tipografía no se
  puede self-hostear legalmente, no se usa: hay alternativas libres buenas y la system stack
  es una elección válida, no un fallback de derrota.
- Imágenes: dimensiones intrínsecas correctas en el HTML, `loading="lazy"` salvo la primera
  visible, y `aspect-ratio` en CSS para que la rejilla no baile mientras cargan.
- Sin polyfills, sin shims, sin `<script>` de nadie. Ni analytics, ni "solo esta fuentecita".

Verifica antes de cerrar cualquier tarea:

```bash
python3 .claude/skills/vanilla-web-craft/scripts/check-estatico.py
```

Comprueba que no hay ninguna URL externa en HTML/CSS/JS, que todas las `<img>` llevan
`width`, `height` y `loading`, y que los scripts van como `type="module"`.

## Cómo cerrar una tarea

"No da error en consola" no es "está bien". Antes de decir que algo está hecho:

1. `python3 -m http.server 8000` en la raíz y abrir la página de verdad.
2. Consola limpia: sin errores, sin 404, sin warnings de CSS.
3. Los dos scripts de comprobación en verde.
4. Recorrer la página **solo con teclado**: Tab llega a todo, el foco se ve siempre, Escape
   cierra lo que se abrió.
5. Estrechar la ventana hasta 320px y comprobar que nada desborda en horizontal.
6. Pasarlo a `qa-visual` para screenshot. Nada se considera terminado sin eso.

## Antipatrones de este proyecto

| Tentación | Qué hacer en su lugar |
| --- | --- |
| "Meto Alpine/htmx, es minúsculo" | Es una dependencia. Delegación de eventos y una función de render. |
| `<link href="fonts.googleapis.com">` | `@font-face` con el `woff2` en `assets/fonts/`. |
| Hardcodear un hex "solo para probar" | Se queda para siempre. Pide el token a `ux-lead`. |
| `innerHTML = datos` | `<template>` + `textContent`. |
| `!important` para ganar especificidad | Estaba mal la capa `@layer`. |
| `div` con `role="button"` y `tabindex` | `<button>`. |
| `px` para tipografía | Token en `rem`, que respeta el zoom del usuario. |
| Editar `css/tokens.css` sin ser `ux-lead` | Mensaje al dueño del fichero. |
| Un `index.html` de 900 líneas con todo dentro | HTML semántico + `<template>`; el CSS en `css/`, el JS en `js/`. |

## Ficheros de referencia

- `references/css-nativo.md` — capas, nesting, container queries, `color-mix()`, `:has()`,
  `@property`, motion reducido. Léelo antes de escribir CSS nuevo.
- `references/js-vanilla.md` — estructura de módulos, patrón de render, patrón de estado,
  delegación, carga de JSON con manejo de error.
- `references/a11y.md` — checklist verificable punto por punto, y cómo comprobar cada uno.
