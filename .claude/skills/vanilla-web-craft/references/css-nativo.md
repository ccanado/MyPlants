# CSS nativo moderno — patrones para este proyecto

Sin preprocesador. Todo lo que sigue lo entiende el navegador tal cual.

## Índice

1. Capas y especificidad (`@layer`)
2. Nesting sin recrear el infierno de Sass
3. Container queries: el componente reacciona a su hueco
4. `color-mix()`: derivar estados sin pedir tokens nuevos
5. `:has()`: lógica que antes pedía JS
6. `@property`: animar custom properties
7. Motion y `prefers-reduced-motion`
8. Fuentes self-hosted
9. Trampas conocidas

---

## 1. Capas y especificidad

Se declara el orden una sola vez, arriba de `app.css`. A partir de ahí, la capa decide
quién gana, no el número de clases del selector:

```css
@layer reset, base, layout, componentes, utilidades;

@layer base {
  body { color: var(--color-texto); }
}

@layer componentes {
  .ficha { … }
}

@layer utilidades {
  .oculto-visual { … }   /* gana a componentes aunque el selector sea más simple */
}
```

Por qué importa: una utilidad debe poder pisar a un componente sin `!important`. Si te ves
escribiendo `!important` o `.a .b .c .d`, el problema es que ese bloque está en la capa
equivocada.

Lo que queda **fuera** de cualquier capa gana a todo lo que esté dentro. Úsalo con cuidado
y de forma consciente, no por accidente.

## 2. Nesting sin recrear el infierno de Sass

Nesting nativo funciona, y `&` se comporta como esperas:

```css
.ficha {
  padding: var(--space-4);

  & > h3 { font-size: var(--texto-l); }

  &:hover { … }

  /* estados y variantes junto al componente: esto es lo que aporta valor */
  &[data-estado="enferma"] { … }
}
```

Regla práctica: **máximo dos niveles**. Cada nivel extra hace el selector más frágil y más
difícil de encontrar con Ctrl+F. Si necesitas un tercer nivel, casi siempre lo que quieres es
una clase nueva para ese hijo.

## 3. Container queries

Para componentes, prefiere container queries a media queries. La ficha de una planta no
debería preguntar cuánto mide la ventana; debería preguntar cuánto sitio le han dado:

```css
.rejilla-fichas { container-type: inline-size; }

.ficha {
  display: grid;
  gap: var(--space-3);

  @container (min-width: 30rem) {
    grid-template-columns: auto 1fr;   /* foto al lado en vez de arriba */
  }
}
```

Ventaja concreta: el mismo componente funciona en una rejilla de dos columnas, en una de
cuatro y dentro de un panel lateral, sin que ningún breakpoint global lo sepa.

Las media queries siguen siendo lo correcto para decisiones de **página**: el número de
columnas de la rejilla, el layout general, la tipografía fluida.

## 4. `color-mix()`

Evita la proliferación de tokens casi-iguales. En lugar de pedir `--verde-hover`,
`--verde-activo` y `--verde-disabled`, deriva del token base:

```css
.boton {
  background: var(--color-acento);

  &:hover  { background: color-mix(in oklab, var(--color-acento) 88%, black); }
  &:active { background: color-mix(in oklab, var(--color-acento) 78%, black); }
  &:disabled { background: color-mix(in oklab, var(--color-acento) 35%, var(--color-fondo)); }
}
```

Mezcla en `oklab` u `oklch`, no en sRGB: la interpolación perceptual evita los grises sucios
que salen al mezclar en el espacio por defecto.

Ojo: derivar no exime de comprobar contraste. Un `color-mix` puede tumbar el AA sin avisar.

## 5. `:has()`

Permite que el padre reaccione a su contenido, y quita bastante JS de encima:

```css
/* la ficha se maqueta distinto si trae foto */
.ficha:has(> img) { grid-template-columns: 12rem 1fr; }

/* aviso visible si la planta está marcada como enferma */
.ficha:has([data-alerta]) { border-color: var(--color-alerta); }

/* el formulario de búsqueda se marca cuando su input tiene foco */
.buscador:has(:focus-visible) { outline: var(--borde-foco); }
```

## 6. `@property`

Una custom property sin registrar es una cadena de texto para el motor de animación, así que
no interpola. Registrar el tipo lo arregla:

```css
@property --progreso {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 0%;
}

.barra-riego {
  background: linear-gradient(90deg, var(--color-agua) var(--progreso), transparent 0);
  transition: --progreso var(--dur-media) ease-out;
}
```

Muy útil para los SVG y las barras de escala de riego/luz: animas un número, no un keyframe.

## 7. Motion y `prefers-reduced-motion`

Decide **las dos versiones** de cada transición, no una versión y un parche. La reducida no es
"sin animación": suele ser un cambio de opacidad corto en lugar de un desplazamiento.

```css
.ficha { transition: transform var(--dur-media) var(--ease-salida); }

@media (prefers-reduced-motion: reduce) {
  .ficha { transition: opacity var(--dur-corta) linear; transform: none; }
}
```

Nada que se mueva en bucle sin que el usuario lo pida. Un SVG animado en autoplay infinito es
exactamente lo que esta media query existe para apagar.

## 8. Fuentes self-hosted

```css
@font-face {
  font-family: "NombreFuente";
  src: url("../assets/fonts/nombre-fuente.woff2") format("woff2");
  font-weight: 400 700;          /* rango si es variable */
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC;
}
```

`woff2` únicamente: lo soportan todos los navegadores que soportan `:has()`, así que un
`woff` de respaldo es peso muerto. Subsetea a latín + puntuación; el español necesita
`áéíóúüñ¿¡`, poco más.

## 9. Trampas conocidas

| Síntoma | Causa real |
| --- | --- |
| Un color no se aplica y no hay error | `var(--nombre-mal-escrito)` — las custom properties inexistentes fallan en silencio. Pásale `check-tokens.py`. |
| La animación de una custom property no ocurre | Falta `@property` con `syntax`. |
| Una utilidad no consigue pisar al componente | Orden de `@layer` mal, o el componente está fuera de capa. |
| El layout salta mientras cargan las imágenes | Falta `width`/`height` en el HTML o `aspect-ratio` en CSS. |
| `@container` no hace nada | Falta `container-type` en el ancestro, o lo pusiste en el propio elemento consultado. |
| Fallo de contraste tras un `hover` bonito | El `color-mix()` no se comprobó; hay que medirlo como cualquier otro color. |
| El foco desaparece | Alguien puso `outline: none` sin dar alternativa. Usa `:focus-visible` y diseña el anillo. |
