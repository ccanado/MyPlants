# Informe de QA nº1 — MyPlants

**Fecha:** 11/08/2026 · **Autor:** `qa-visual`
**Método:** `docs/qa/como-ejecutar.md` · **Contrato:** `docs/qa/checklist.md`

## Veredicto

**No hay ningún bloqueante.** La página carga, se ve, se navega con teclado, no pide nada a
terceros, tiene la consola limpia y respeta el movimiento reducido. Las cuatro comprobaciones
de terminal están en verde y ninguno de los 800+ nodos de texto medidos baja de AA.

**No la doy por terminada todavía**, por un motivo que no es de accesibilidad sino del encargo:
una ficha desplegada mide **4.801 px de alto** y el brief dice, con esas palabras, "leer el dato
concreto sin scroll infinito". Es el hallazgo nº1 y es de diseño de información, no de código.

| | |
| --- | --- |
| Bloqueantes | **0** |
| Altas | **2** |
| Medias | **6** |
| Puntos verificados y correctos | 41 |
| Sin poder verificar | 2 (van al final, dichos como lo que son) |

---

## Cómo se midió

Todo lo de este informe se ha ejecutado, no estimado. Dos vías:

- **`tests/runner.py`** (nuevo). Levanta un servidor que inyecta los `tests/*.js` en la página
  real, la abre en Chrome headless y recoge el informe por POST. Nació porque el servidor MCP
  de Playwright usa un perfil de Chrome único y otro teammate lo tuvo ocupado media sesión:
  QA no puede depender de un recurso compartido. Mide sobre el **DOM ya pintado por `js/`**,
  que es lo único que vale aquí — en `index.html` no hay ninguna ficha, solo un `<template>`.
- **Playwright MCP** para lo que exige teclado de verdad: Tab, `:focus-visible`, 320 px reales
  y la lista de red.

Los cuatro scripts de terminal, en verde:

```
check-tokens.py       ✓ 134 tokens, 115 referencias, 0 literales fuera de tokens.css
check-estatico.py     ✓ cero terceros, imágenes dimensionadas, ES modules
validar-plantas.py    ✓ 7 plantas, campos completos, huecos anotados, toxicidad con fuente
tests/peso-assets.py  ✓ assets dentro de presupuesto, todas las rutas existen
```

---

## Hallazgos

### ALTA-1 · La ficha desplegada es un muro de texto — `builder` + `ux-lead`

**Medido:** con una sola ficha abierta (Begonia Elatior), el `<article>` mide **4.801 px** y la
página entera **7.033 px**. Dentro hay **51 párrafos o viñetas de más de 40 caracteres**.

Evidencia: `docs/qa/1280-ficha-despegada-completa.png`.

El desplegado encadena "LO QUE SE VE" (12 viñetas), "CAUSAS PROBABLES" (7 párrafos largos, cada
uno con su "PATRÓN PARA RECONOCERLA") y "LO QUE LA FOTO NO DICE". Es un informe de diagnóstico
excelente —el contenido de `botanist` es de una calidad que no había visto en este proyecto— y
está mal presentado: se vuelca entero, de golpe, sin jerarquía.

Choca de frente con el brief:

> El diseño tiene que servir a ese momento: encontrar la planta rápido y leer el dato concreto
> **sin scroll infinito**.

Y con el punto 10.3 del checklist. Lo llamativo es que la ficha **cerrada** resuelve esto
perfectamente: riego, luz y temperatura visibles de un vistazo. El problema aparece justo al
abrir, que es cuando alguien ya ha decidido que quiere saber más.

Sugerencia, no prescripción: la misma técnica que ya usáis en `.campo__mas` / `.dato__mas`
(un `<details>` "Más detalle") aplicada a "CAUSAS PROBABLES". Que se vea el diagnóstico y una
línea por causa, y que el razonamiento se despliegue si alguien lo pide. El contenido no sobra
—es lo que hace esta web distinta— pero no puede ser lo primero que cae encima.

### ALTA-2 · El borde del buscador no llega a 3:1 — `ux-lead` + `builder`

**Medido** por `tests/contraste.js` sobre el render real, en los cuatro anchos:

```
input#busqueda   borde #918A7B  sobre fondo #8F4A33  →  1,92:1   (WCAG 1.4.11 exige 3:1)
```

`--color-borde` está bien calculado para lo que se diseñó: 3,28:1 sobre `--color-etiqueta`, la
superficie blanca de las fichas. Pero el buscador no está sobre una ficha: está sobre el
terracota del fondo de página, donde ese mismo gris da 1,92:1.

Y es *el* control de la página: lo primero que alguien usa cuando abre esto porque su planta
tiene un problema. Un borde de control por debajo de 3:1 es fallo de AA (1.4.11 Non-text
Contrast), no una preferencia estética.

Dos salidas: un token de borde específico para sobre-maceta, o darle al buscador la misma
superficie clara que a las fichas. La segunda tiene además sentido narrativo — el buscador
sería otra etiqueta sobre el tiesto.

### MEDIA-1 · 36 dianas por debajo de 24×24 px — `builder`

**Medido** por `tests/foco.js`, aplicando ya las dos excepciones de WCAG 2.2 · 2.5.8 (inline y
espaciado), así que lo que queda son fallos reales:

```
summary.dato__mas-tirador   "Más detalle"   334×20 px, con otra diana a 2–14 px
summary.campo__mas-tirador  "Más detalle"   300×20 px, con otra diana a 1–14 px
a.fuente                    "rhs.org.uk ↗"   90×20 px, con otra diana a 2–23 px
```

20 px de alto contra 24 exigidos. Son controles apilados con muy poco aire entre ellos, así que
no salvan la excepción de espaciado. Cuatro píxeles más de `padding-block` en cada uno lo cierra.

### MEDIA-2 · `a { color: var(--texto-fuente) }` sin acotar — `builder`

En la capa `base` de `css/app.css`. `--texto-fuente` es `--color-boli` #1F3F97, perfecto sobre
el papel de cuaderno (8,39:1) e **ilegible sobre el terracota de página (1,44:1)**.

Hoy no rompe nada porque todos los enlaces viven dentro de fichas. Es una mina: el primer
enlace que alguien meta en la cabecera o el pie sale ilegible y nadie lo verá venir. Acotar a
`.ficha a, .cuaderno a, .fuentes a`.

### MEDIA-3 · `--color-codigo` pasa AA por 0,04 — `ux-lead`

```
--color-codigo #5E7066  sobre  --color-etiqueta-2 #F0EEE8  →  4,54:1   (exige 4,50)
```

Cumple. Pero cualquier retoque futuro de cualquiera de los dos tokens lo tumba, y es el color
del mono de metadatos (EAN, nº fitosanitario), que ya es texto pequeño.

### MEDIA-4 · Hueco en la rejilla al desplegar una ficha — `builder` + `ux-lead`

`.rejilla__celda:has(.despegue[open]) { grid-column: 1 / -1 }` es una solución elegante y sin
JS, pero cuando la ficha abierta no es la primera de su fila, deja las columnas restantes de esa
fila vacías: un rectángulo de terracota de ~850×500 px al lado del Helecho.

Evidencia: `docs/qa/1280-ficha-despegada.png`.

### MEDIA-5 · Todas las imágenes con `loading="lazy"`, incluida la primera — `builder`

Las 12, incluidas las que están sobre la línea de flotación. Retrasa el LCP sin ganar nada.
La primera visible debería ir sin `lazy` (o con `fetchpriority="high"`).

Además se sirven a 800×1067 y se pintan a ~334×445: **2,4× de sobremuestreo**. No es sangrante
—`peso-assets.py` pasa, 1,59 MB en total tras vuestra recompresión, que bajó 760 KB— pero
serviéndolas a 500 px de ancho `assets/img/` se quedaría en torno a 700 KB.

### MEDIA-6 · `js/` supera el presupuesto — `builder`

70,8 KB frente a los 60 KB del presupuesto de `tests/peso-assets.py`. Es un aviso, no un error:
el presupuesto lo puse yo y es discutible. Lo dejo dicho para que sea una decisión y no una
deriva.

---

## Lo que está bien, comprobado

No es relleno: cada línea es un punto del checklist con su evidencia.

**Consola y red.** 0 errores, 0 warnings, 0 recursos caídos (capturado con un vigilante que se
instala *antes* que `js/app.js`, así que también habría cazado sus fallos de arranque). Las 17
peticiones salen todas de `localhost`; ninguna a terceros. Las seis woff2 están self-hosteadas
y subseteadas entre **10 y 18 KB** cada una — muy por debajo de los 90 KB que pedía.

**Contraste de texto.** 781–844 nodos medidos según el estado de la página, **0 por debajo de
AA**, midiendo color computado contra fondo real compuesto. Los once pares que `ux-lead`
documenta con su ratio en `tokens.css` están todos bien calculados; los verifiqué uno a uno.

**Estructura.** 0 fallos. `lang="es"`, un solo `<h1>`, jerarquía sin saltos, landmarks
completos, las 7 fichas son `<article>` con encabezado propio dentro de `<li>`, y todos los
controles tienen nombre accesible.

**Nada por color solo (5.4, era bloqueante).** La severidad se codifica con `!!` / `!` **más**
el nombre del estado ("Crítica", "Atención", "Sana"), y los datos ausentes llevan la trama
diagonal **más** el texto "SIN ETIQUETA DE VIVERO", "SIN CÓDIGO NI PRECIO". Esto resuelve la
duda que le había mandado a `ux-lead` sobre `--color-sin-dato-trama` (1,72:1): es textura
acompañada de texto, no portadora del dato. **No es un fallo.**

**Foco.** Anillo de dos capas —`outline` 2 px `--color-tinta` + halo blanco de 5 px por
`box-shadow`— que funciona sobre cualquier superficie del sistema, que es justo el problema que
tiene una página con fondo terracota y tarjetas blancas. El skip link es el primer enfocable,
se hace visible al recibir foco (154×42 px) y lleva a `#contenido`. `:focus-visible` correcto.
Evidencia: `docs/qa/320-foco-skiplink.png`, `docs/qa/320-foco-chip.png`.

**Orden de Tab.** 145 enfocables, **0 saltos** respecto al orden visual, 0 `tabindex` positivos.

**Buscar y filtrar.** Medido con eventos reales:

| consulta | región `aria-live="polite"` | fichas | foco |
| --- | --- | --- | --- |
| `poto` | "1 de 7 plantas." | 1 | sigue en el buscador |
| `zzzz` | "Ninguna planta coincide. Prueba a quitar algún filtro." | 0 | sigue en el buscador |
| (vacío) | "7 plantas en casa." | 7 | sigue en el buscador |

Puntos 4.1, 4.2 y 4.5: los tres pasan. El "sin resultados" es texto en el DOM y además sugiere
la salida, que es más de lo que pedía el checklist.

**Movimiento.** 26 efectos, ninguno en bucle infinito, ningún parpadeo >3 Hz, ningún SMIL,
ninguna animación por `element.animate()`. Con `prefers-reduced-motion: reduce` forzado:
**0 fallos**. Y no es un parche final: el bloque `@media` decide qué versión reducida tiene cada
transición, y `js/app.js` consulta `matchMedia` para el `scrollIntoView`. Es de las
implementaciones de motion reducido mejor hechas que he auditado.

**Responsive.** Sin scroll horizontal a 320, 500, 768, 1280 ni 1920 px. A 320 px reales
(Playwright, no emulado) `scrollWidth === innerWidth === 320`. Al equivalente de zoom 200 %
(640 px), nada solapado ni cortado — verificado con captura, porque mi comprobación geométrica
daba falsos positivos y no pensaba reportar lo que no había mirado.
Evidencia: `docs/qa/320-inicio.png`, `500-inicio.png`, `768-inicio.png`, `1280-inicio.png`,
`1920-inicio.png`, `zoom200-equivale-1280.png`.

**Textos `alt`.** No solo existen: describen. "Begonia Elatior en su maceta de vivero roja
metida en un cachepot blanco…", "Mano sosteniendo la maceta de vivero roja. La etiqueta ovalada
verde…". Esto no lo puede verificar un script, lo leí yo, y está bien hecho.

---

## El trabajo que la página tiene que hacer (§10)

| # | Punto | Resultado |
| --- | --- | --- |
| 10.1 | Riego de una planta concreta en <10 s | **Pasa, holgado.** `RIEGO` es el primer campo de cada ficha cerrada, con el dato accionable ("cada 3 días en verano, cada 4 en invierno, ~100 ml"). Sin abrir nada, sin modal, sin scroll. |
| 10.2 | Ver de un vistazo cuáles están enfermas | **Pasa, y es lo mejor de la página.** La franja "PARTE DEL DÍA · 3 DE 7 PIDEN MIRADA" con los tres chips nombrados y priorizados (`!!` Helecho, `!` Begonia, `!` Coleo grande) resuelve la pregunta antes de mirar la rejilla. |
| 10.3 | Leer el dato sin scroll infinito | **Falla al desplegar.** Ver ALTA-1. Cerrada, pasa. |
| 10.4 | Las dos capas se distinguen visualmente | **Pasa.** Papel de cuaderno azul y tinta de bolígrafo para lo de Carlos, etiqueta blanca satinada para lo verificado. Se nota sin leer el rótulo. |
| 10.5 | Los `null` se dicen, no se ocultan | **Pasa.** "SIN ETIQUETA DE VIVERO / PROCEDENCIA SIN REGISTRAR" en el Helecho y el Poto, con trama. |
| 10.6 | Toxicidad rápida y con fuente | **Pasa.** Con enlace a ASPCA. |

---

## Revisión visual (§11) — la crítica que no hace falta hacer

Venía preparado para esta conversación. El checklist tiene cuatro casillas para los cuatro
clichés que el brief prohíbe, y mi trabajo era decirlo claro si tocaba. **No toca.**

- **Verde salvia sobre blanco con monsteras:** no. El fondo de página es el **terracota del
  plástico del tiesto** (#8F4A33), y no como acento de 40 px: como fondo, con el brillo satinado
  y el anillo moldeado del plástico dibujados encima.
- **Crema + serif de alto contraste + terracota de acento:** no. La tipografía display es
  **Archivo Narrow en caja alta**, que es la letra de una etiquetadora de vivero, no una serif
  editorial.
- **Casi negro con un acento ácido:** no.
- **Layout tipo periódico:** no. Es una **pegatina troquelada**, con su canto, su código de
  barras real, su precio (6,95 €), su código fitosanitario (ES13-28/0283F) y la dirección y el
  teléfono del vivero de Móstoles.

La **signature** —punto 11.5, el elemento por el que se recuerda la página— se puede nombrar,
que es la prueba de que existe: **la ficha es la etiqueta de plástico de la maceta**, código de
barras incluido, y se **despega** para abrirse (`.despegue`, con su `@keyframes despegar`).
Y el azul del PLANT PASSPORT reservado exclusivamente a la voz de Carlos y a las fuentes citadas
es una decisión de sistema, no de paleta: el color codifica "esto no es dato de catálogo".

Esto sale del mundo del sujeto, que es literalmente lo que pedía el brief. No se parece a
ninguna otra web de plantas.

**Lo único que le pondría a la dirección visual** es lo de ALTA-1: la ficha cerrada es una
etiqueta de vivero preciosa y disciplinada; la desplegada abandona esa disciplina y se convierte
en un documento de texto. La metáfora se sostiene 4.801 px sin sostenerse.

---

## No verificado

Lo digo porque un checklist que no distingue "comprobado" de "supuesto" no sirve:

1. **Orden de Tab dentro de 3 bloques multicolumna** (`section.mas-datos`, 12 enfocables en
   2–5 columnas). Mi comprobación no puede decidir si el orden de lectura correcto es por filas
   o por columnas, así que **no emite veredicto** en vez de inventarlo. Requiere recorrerlos con
   Tab a mano.
2. **Escape sobre una ficha desplegada.** Verifiqué que Escape vacía el buscador sin sacar el
   foco (`js/app.js:169`), pero no el retorno de foco al cerrar un `.despegue` con teclado.

---

## Nota sobre este informe

Dos cosas que reporté mal durante la sesión y que corrijo aquí para que quede constancia:

1. Le mandé a `ux-lead` un "BLOQUEANTE: seis fuentes dan 404" que **no existía**: conté
   `@font-face` con `grep -c`, que también cuenta el código comentado, y los bloques estaban
   comentados a propósito y documentados en el fichero. Retirado y corregido en su momento.
2. Mi propio `tests/foco.js` reportó "198 elementos con orden de Tab distinto del visual".
   Era un fallo del test: comparar toda la página contra un orden de bandas horizontales es
   incorrecto en una rejilla de tarjetas. Corregido — ahora agrupa por contenedor y **se
   abstiene** en los multicolumna. El resultado real es 0.

Un QA que grita donde no hay fuego gasta el crédito que necesita para cuando lo haya. Los dos
tests están arreglados en el repo y las correcciones documentadas en el código.
