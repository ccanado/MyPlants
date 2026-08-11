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

## Segunda vuelta — después de los datos reales de `botanist` y de las fotos de `builder`

- [ux-lead] Los 5 SVG se reescriben sobre los ejes que existen de verdad en el JSON (`riego.dias_*` 2–10, `luz.nivel` 1–5, `temperatura.min_c/max_c` 7–30) — descartados los diagramas de centímetros de profundidad, mililitros y metros hasta la ventana: nadie produce esos datos y dibujarlos habría sido precisión fingida.
- [ux-lead] El plano de casa se aparca y su hueco lo ocupa "el calendario del domingo" (las 7 plantas en un eje común de días entre riegos) — descartado mantener el plano con datos inventados; y el calendario resulta responder mejor al trabajo primario ("¿a cuál le toca?") que el propio plano.
- [ux-lead] Cuando falta un dato se dibuja el eje con el hueco en `--trama-sin-dato` y el texto dice "sin dato" — descartado ocultar el diagrama, que hace creer que no había nada que saber, y descartado estimar el valor, que `CLAUDE.md` prohíbe.
- [ux-lead] `--color-sin-dato #63625B`, gris neutro, nunca verde, y explícitamente no es un estado — descartado el semáforo de dos posiciones para toxicidad: `botanist` confirma que **no hay ni una planta "no tóxica" verificada**, así que un icono verde mentiría en cinco de siete fichas.
- [ux-lead] Toxicidad con tres presentaciones distinguibles por borde e icono además de color (`toxica` / `sin_datos_aspca` / `sin_identificar`) — descartado agrupar "sin datos" con "no tóxica", que convierte un hueco documental en una afirmación de seguridad.
- [ux-lead] `critica` se pinta **invertida** (blanco sobre rojo sólido) y `atencion` se queda en texto sobre relleno — descartado usar dos intensidades del mismo tratamiento: con una sola planta crítica y dos en atención, el salto tenía que ser de peso y no de tono, o la crítica no destaca.
- [ux-lead] La fecha de observación va pegada al diagnóstico, no al pie — descartado omitirla: `estado` describe el 11 ago 2026 y sin fecha la ficha estará afirmando algo falso en tres semanas.
- [ux-lead] El panel de cuaderno se renderiza solo si hay contenido — descartado el placeholder "aún no hay notas", que es decorar una ausencia siete veces; `historia` y `notas_carlos` están a `null` en las 7 y eso es una pregunta para Carlos.
- [ux-lead] Las 5 fotos de etiqueta entran en la UI, pero solo en el bloque de procedencia, a `--ancho-prueba` y sin estilizar — descartado dejarlas fuera (son la fuente más fuerte de qué compró Carlos) y descartado subirlas junto a la cabecera, donde la foto real le comería la escena a la etiqueta dibujada.
- [ux-lead] `helecho` y `poto` usan la variante "sin etiqueta de vivero": mismo nombre a sangre, y las barras y el precio sustituidos por trama y una raya `—` — descartado darles una ficha de otra forma, que rompería el sistema justo en las dos plantas que peor se identifican.
- [ux-lead] El nº fitosanitario no se usa como identificador de planta — el ficus y el coleo grande comparten el mismo: es del vivero, no de la planta.
- [ux-lead] "Funciona sin JS" se corrige a "el abrir y cerrar no lleva JS": la ficha se renderiza con `fetch` y sin JS no hay página — la frase original del brief era incorrecta y `builder` hizo bien en pararla; la exigencia que sí queda es que ningún comportamiento nativo se reimplemente en JS.
- [ux-lead] **Las 5 fotos de etiqueta entran en la UI (opción B), pero solo en el bloque de procedencia de la ficha abierta**, a `--ancho-prueba` y sin estilizar — descartada la opción A (dejarlas fuera): para cinco de las siete plantas la pegatina es la fuente más fuerte que existe de qué compró Carlos, más que POWO, que dice qué es una especie pero no qué hay en ese tiesto. El riesgo de que la foto le coma la escena a la etiqueta dibujada se desactiva por separación —cabecera a ancho completo contra 9rem al pie, en otro contexto de lectura— y no por filtros.
- [ux-lead] Los seis `@font-face` van comentados mientras `assets/fonts/` esté vacío — descartado declararlos "por dejarlo listo": seis 404 por carga rompen la condición de consola limpia, y las pilas de `font-family` ya nombran las familias primero, así que descomentar el día que lleguen no toca nada más.
- [ux-lead] La única fuente de verdad de los nombres de token es `css/tokens.css`; el brief es explicación, no contrato — descartado mantener los nombres humanos del brief (Alarma, Bolígrafo) como si fueran normativos: `builder` los habría copiado de la tabla y no habrían existido.
- [team-lead] La teja se queda como fondo y no se invierte con el verde botella — descartado el verde de fondo porque es a la vez el cliché nº 2 (campo oscuro con acentos) y el color que cualquier generador elegiría para "web de plantas".

## Tercera vuelta — auditoría de `qa-visual` y contexto real del salón

- [ux-lead] `--color-sin-dato-trama` sube de `#B9B5AA` (1,72:1) a `#847F70` (3,35:1) — descartado defender que las diagonales son textura decorativa: son el portador **no cromático** de "aquí no hay dato", así que son gráfico informativo y les aplica el 3:1. La auditoría de `qa-visual` tenía razón.
- [ux-lead] `--color-codigo` sube de `#5E7066` a `#4F6157` — descartado dejarlo en 4,54:1 sobre la superficie hundida: pasaba AA por 0,04 y cualquier retoque futuro de cualquiera de los dos colores lo tumbaba. Un margen no es un aprobado.
- [ux-lead] Añadido `--texto-fuente-sobre-maceta` y acotada la regla de enlaces a la ficha y al panel — descartado dejar `a { color: var(--texto-fuente) }` suelto en la capa `base`: sobre el fondo teja da 1,44:1 y es una mina para el primer enlace que alguien meta en el pie.
- [ux-lead] **El plano de casa se cierra definitivamente**: las siete plantas están en el salón — descartado dibujarlo con las habitaciones reales, porque serían siete puntos amontonados en una sola habitación, o sea cero información y por tanto diagrama decorativo.
- [ux-lead] El SVG 2 pasa de "escala de luz de 5 escalones" a **"la mañana del salón"**, un eje de un día con el tramo de sol directo y el de sombra luminosa — descartada la categoría abstracta `luz.nivel` como única fuente: Carlos confirma que por la mañana les da sol directo y luego se va, y esa historia con dos tramos es un dato real que el diagrama puede contar.
- [ux-lead] El SVG 3 recupera los marcadores de casa con números reales (28 °C de tope en verano por el aire acondicionado) — descartado dejarlo como rango botánico abstracto: la utilidad está en ver dónde cae la casa dentro de la banda, no la banda sola.
- [ux-lead] El calendario del domingo deja de ser una comparación entre sitios y pasa a ser **una sola escena de riego** — las siete comparten microclima, lo que refuerza el diagrama en vez de debilitarlo.

## Cuarta vuelta — verificación contra el JSON real

- [ux-lead] **Retiro mi propio SVG 2 del turno anterior**: `plantas.json` afirma ventanal NE y "cero sol directo" planta por planta, en contra de la frase de Carlos que me llegó de segunda mano — descartado elegir la versión que me convenía para el diagrama; el conflicto queda documentado en el brief y lo cierra Carlos mirando por la ventana, no yo deduciéndolo.
- [ux-lead] El SVG 2 pasa a **"lo que quiere y lo que tiene"**, dos marcas sobre la escala 1–5 — descartada la escala de una sola marca: el dato interesante no es en qué escalón vive sino cuánto le falta, que es lo que dicen los propios textos de `botanist` ("quiere más luz de la que tiene"). Requiere partir `luz.nivel` en `nivel_actual` / `nivel_ideal`.
- [ux-lead] **La toxicidad sale del registro de alarma**: se pinta en tinta sobre superficie hundida, con borde sólido e icono, no en rojo — `meta.contexto` dice que no hay mascotas en casa, así que el rojo la habría igualado visualmente al helecho, que sí se está muriendo. En este sistema el color significa "haz algo hoy" y hay una sola planta crítica: gastarlo en un dato informativo se la come.
- [ux-lead] La toxicidad se pinta como **dos campos** (`gatos` y `perros`), no como uno — descartado el badge único: hoy coinciden en las siete, pero el esquema permite que diverjan y un badge que promedia dos animales miente el día que la fuente los separe.
- [ux-lead] `estado.no_visible_en_foto` se muestra **dentro del bloque de diagnóstico**, no plegado en un detalle — es la misma lógica que las fuentes citadas visibles: decir hasta dónde llega lo que sabes es parte de saberlo, y en el helecho ese bloque será más largo que el propio diagnóstico.
- [ux-lead] `riego.ml_aprox` vuelve al texto del SVG 1 — lo había descartado por creer que no existía; `botanist` lo tenía y es el dato que convierte "cada 4 días" en una instrucción ejecutable.

## Quinta vuelta — tipografías reales y la cronología

- [ux-lead] Los seis `woff2` se descargan ya subseteados al rango latino y se sirven desde `assets/fonts/` (82,1 KB) — descartado `fonttools` para subsetear, que sería una dependencia; y descartado dejar la system stack ahora que Carlos ha aprobado el self-hosting. La descarga es de desarrollo, una vez: en runtime no hay ni una petición a terceros.
- [ux-lead] La procedencia y la licencia OFL de las tres familias quedan anotadas dentro de `css/tokens.css` — en un proyecto sin dependencias esos seis ficheros son lo único con licencia de terceros que hay en el repo, y un `LICENSES.md` aparte se separa del sitio donde se lee.
- [ux-lead] El `unicode-range` declarado es exactamente el del fichero descargado, no el que yo había escrito a ojo — declarar un rango más ancho que el real hace que el navegador se descargue la fuente para glifos que no contiene y caiga al fallback igual.
- [ux-lead] **"Recién llegada" NO entra como cuarto estado de severidad** — descartado añadirlo a la escala: severidad es "cómo está" y esto es "desde cuándo", y son ejes independientes (se puede estar sana y recién llegada, o llevar veinte años y estar crítica). Un cuarto escalón que no compite con los otros tres obliga a leer una escala que no existe.
- [ux-lead] "En aclimatación" se calcula de `fecha_llegada` y se muestra tres semanas — descartado el campo de estado explícito: en dos semanas será falso y así desaparece solo, sin tocar diseño ni contenido.
- [ux-lead] **La ausencia de etiqueta de vivero pasa de hueco a antigüedad**: el bloque `LA PRUEBA` dice "sin etiqueta: lleva más de veinte años en la familia" — descartado seguir tratándola como dato que falta; la signature deja de ser recurso estético y pasa a ser cronología, que es sentido gratis.
- [ux-lead] **El patrón de que las dos plantas tocadas son los dos regalos NO se subraya** — descartado el rótulo, la agrupación y la nota al pie: el trabajo del diseño es poner origen y estado en el mismo golpe de vista para que se vea solo; señalarlo con el dedo lo convertiría en una gracia.

## Sexta vuelta — más superficie visual, y el lector resulta ser Noah

- [ux-lead] El tramo de sol vuelve como **segunda fila del mismo SVG 2**, no como diagrama aparte — el JSON estaba caduco, no en desacuerdo: la frase "sin sol directo" era una deducción de la orientación NE, y Carlos describe su propio salón. La escala con el hueco es el dato y el tramo de sol es el porqué; separarlos habría partido en dos una sola explicación.
- [ux-lead] Diagrama 6, **la cronología**, con eje **logarítmico** y marcas rotuladas — descartado el eje lineal, en el que el poto (20 años) ocupa todo el ancho y las otras seis son un borrón; y descartado no rotular las marcas, porque un eje logarítmico sin rótulos miente sobre las proporciones.
- [ux-lead] **Siete siluetas de hoja de línea en la rejilla cerrada** — arregla un agujero que abrí yo: al quitar las fotos, las siete fichas se distinguían solo por el texto del nombre. La silueta es legítima porque la forma de la hoja **es la clave de identificación botánica**, no un adorno vegetal; y el sistema no se importa de fuera, se levanta de la fila de pictogramas que ya trae la etiqueta real de la begonia.
- [ux-lead] La silueta del helecho se dibuja **con trama de sin-dato dentro del contorno** — descartado dibujarle una hoja de *Adiantum* bonita: está sin identificar, y afirmar una especie con un lápiz es la misma mentira que rellenar un campo a ojo.
- [ux-lead] Las siluetas **no se animan** — descartada la entrada escalonada: son el ancla para escanear la rejilla y algo que se mueve no ancla nada. Es el único elemento del sistema sin versión reducida, porque no hay versión.
- [ux-lead] Iconos de campo **junto a la versalita, nunca en su lugar** — descartado el icono solo: obliga a aprender un vocabulario antes de poder usar una web que se abre con prisa una vez cada quince días.
- [ux-lead] El aviso de savia irritante va **dentro del paso de tratamiento** que la provoca, no en el campo de toxicidad — el campo describe la especie; el riesgo real es de manipulación y pertenece a la acción, no a la ficha.
- [ux-lead] **La toxicidad no vuelve al rojo** pese al aviso de que había un niño (Noah tiene 20 años) — se mantiene el principio: el color significa "haz algo hoy", y tres fichas en rojo se comerían al helecho, que es el único que se está muriendo.
- [ux-lead] El panel personal se queda en **una sola superficie con el nombre del autor tomado del dato** (`nota.autor`), no en dos paneles para Carlos y Noah — descartadas dos superficies: el panel codifica un **registro** ("esto no tiene fuente y no la necesita"), no una persona, y dos superficies para el mismo tipo de enunciado obligan a aprender dos cosas para entender una. Además así cabe una tercera voz (Vanesa) sin inventar nada.

## Accesibilidad

- [ux-lead] Anillo de foco doble (2 px Tinta + halo 3 px Etiqueta) en un solo token — descartado el anillo de un color, porque ningún color de la paleta pasa 3:1 contra el blanco de la ficha y contra la teja del fondo a la vez.
- [ux-lead] Sobre el fondo teja solo se escribe en blanco; Tinta sobre Maceta queda prohibido y anotado en `tokens.css` — el par da 2,05:1 y habría entrado por descuido en la primera cabecera que alguien escribiera.
- [ux-lead] Los contrastes se calcularon con un script antes de fijar los hex, no después — descartado ajustar la paleta en QA, que siempre acaba en "casi pasa" y en repintar media web.
