# Decisiones

Una línea por decisión, con la alternativa descartada y el motivo.
Formato: `- [quién] decisión — alternativa descartada y por qué`.

## Dirección visual

- [ux-lead] La dirección de arte sale de las fotos reales de `docs/plants/` (etiqueta térmica de Viveros Projardín, Móstoles) — descartado el registro "herbario botánico del XIX", que es bonito pero es de otra casa: estas plantas costaron 2,25 € y vienen con código fitosanitario, no con una lámina de Kew.
- [ux-lead] Fondo de página en teja `#8F4A33`, el plástico del tiesto — descartado el fondo crema `#F4F1EA` (cliché nº 1 del brief) y el casi negro (cliché nº 2); descartado también el blanco, que habría dejado las fichas sin borde perceptible y sin identidad.
- [ux-lead] Verde botella `#16342A` como **tinta**, nunca como fondo — descartado el verde salvia sobre blanco, que es exactamente el cliché de dominio que prohíbe el brief; usarlo como tinta lo convierte en decisión en vez de en decorado.
- [ux-lead] `severidad: sana` no tiene color propio, se pinta en Tinta — descartado el semáforo verde/ámbar/rojo, que habría gastado un color en la información menos urgente de la página; el color solo aparece cuando hay un problema.
- [ux-lead] Azul `#1F3F97` (el del `PLANT PASSPORT` de la begonia) reservado en exclusiva a la capa personal de Carlos y a las fuentes — descartado usarlo como acento general, que habría borrado la única señal cromática que separa las dos capas de contenido.
- [ux-lead] La separación entre capa dura y capa de Carlos usa cuatro señales simultáneas (superficie cuadriculada, itálica, tinta azul, rótulo `CARLOS`) — descartado separarlas solo por color, que incumple "ninguna información puede depender solo del color".
- [ux-lead] Las fuentes citadas van al pie de cada campo con el dominio visible y a `--texto-xs` — descartado el bloque de bibliografía al final de la ficha, que las convierte en letra pequeña cuando son parte del valor.

## Tipografía

- [ux-lead] `Archivo Narrow` 700 para el display, con fallback real `Arial Narrow` — descartadas `Oswald` (marcada como Google Fonts de 2015) y `Bebas Neue` (cartel, no etiqueta); Archivo Narrow es una grotesca de impresión y es el registro literal de la etiquetadora del vivero.
- [ux-lead] `Alegreya Sans` para el cuerpo, y su itálica como voz de Carlos — descartado `Inter` por ser el default absoluto de cualquier web actual, y descartada toda serif de alto contraste por ser la mitad del cliché nº 1.
- [ux-lead] `IBM Plex Mono` para cifras, °C, ml, €, EAN y códigos — descartado `JetBrains Mono` (registro de editor de código) y descartado usar la misma sans para los números, que les quita el efecto de dato medido.
- [ux-lead] Ninguna fuente se carga hoy: las tres pilas declaran el fallback de sistema y los `woff2` quedan como tarea pendiente — descartado enlazar Google Fonts, que rompe la restricción de cero requests a terceros, y descartado bloquear a `builder` hasta tener los ficheros.
- [ux-lead] Base tipográfica de 17 px (`1.0625rem`), no 16 — el texto se lee con prisa y con una mano ocupada; el escalón extra se nota y no cuesta nada.

## Layout e interacción

- [ux-lead] Una sola pantalla: la ficha se abre en su sitio a ancho completo (`grid-column: 1 / -1`) — descartadas la página de detalle y la modal, porque el trabajo primario ("una planta mía tiene un problema ahora") no admite perder el sitio en la lista.
- [ux-lead] La ficha es `<details>` y funciona sin JS; el JS solo añade buscar, filtrar y el plano — descartado renderizar la apertura desde JS, que deja la web inservible si falla un módulo.
- [ux-lead] Sin fotos en la rejilla cerrada: identifica la etiqueta de precio, no una miniatura de hoja — descartada la rejilla de fotos, donde las siete plantas se parecen entre sí y no se encuentra ninguna rápido.
- [ux-lead] Las plantas con `estado != sana` van primeras en el DOM — descartado el orden alfabético; el orden es información y ordenar por nombre esconde justo lo urgente.
- [ux-lead] Container queries para las fichas, media queries solo para decisiones de página — descartado el breakpoint global, que obliga a tocar CSS cada vez que la ficha cambia de hueco.
- [ux-lead] Las pegatinas van rectas — descartada la rotación ligera tipo "sticker pegado a mano", que es simpática una vez, molesta al escanear la rejilla y se lee como truco.

## Signature y SVG

- [ux-lead] Signature: la etiqueta de Projardín reconstruida en HTML/CSS, con el botón "despegar" — descartado apostar la identidad a un SVG bonito de hoja, que es lo que haría cualquier generador; la etiqueta con nº fitosanitario no sale de un prompt genérico.
- [ux-lead] Código de barras con `repeating-linear-gradient` — descartada una imagen o un SVG generado, que añade peso y ficheros para algo que es una trama.
- [ux-lead] Los cinco SVG explican un dato y el dato está también en texto al lado — descartado el diagrama decorativo: si se puede borrar sin perder información, se borra.
- [ux-lead] Cada animación tiene definida su versión reducida, y ninguna arranca sola ni va en bucle — descartado el `@media (prefers-reduced-motion)` que pone todo a `animation: none`, que trata la accesibilidad como un parche final en vez de como una segunda versión diseñada.

## Accesibilidad

- [ux-lead] Anillo de foco doble (2 px Tinta + halo 3 px Etiqueta) en un solo token — descartado el anillo de un color, porque ningún color de la paleta pasa 3:1 contra el blanco de la ficha y contra la teja del fondo a la vez.
- [ux-lead] Sobre el fondo teja solo se escribe en blanco; Tinta sobre Maceta queda prohibido y anotado en `tokens.css` — el par da 2,05:1 y habría entrado por descuido en la primera cabecera que alguien escribiera.
- [ux-lead] Los contrastes se calcularon con un script antes de fijar los hex, no después — descartado ajustar la paleta en QA, que siempre acaba en "casi pasa" y en repintar media web.
