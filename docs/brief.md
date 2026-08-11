# Brief — MyPlants

Documento vivo. Lo posee `ux-lead`. Las secciones marcadas **[pendiente]** se resuelven
en la fase de diseño, no antes.

## El encargo

Una web estática, de una sola página, con las plantas que Carlos tiene en casa.
Cada planta es una **ficha de cuidado** consultable: cómo se riega, qué luz quiere,
cómo se llama de verdad, de dónde vino, qué le pasa cuando se pone fea.

No es un catálogo botánico. Es el manual de una casa concreta, con plantas concretas
que alguien riega los domingos.

## El trabajo que hace la página

Alguien abre esto porque **una planta suya tiene un problema ahora mismo**, o porque va a
regar y no se acuerda de cuánto. El diseño tiene que servir a ese momento: encontrar la
planta rápido y leer el dato concreto sin scroll infinito.

Segundo trabajo, más blando: es bonita y da gusto abrirla. Las dos cosas no están en conflicto,
pero cuando lo estén gana la primera.

## Contenido por ficha

Datos duros verificables (los llena `botanist` con fuentes):
riego, luz, humedad, temperatura, sustrato, abonado, trasplante, plagas comunes,
toxicidad para mascotas, dificultad.

Datos personales (los da Carlos):
historia de la planta, notas propias, dónde está en la casa, qué tal le va.

La mezcla de las dos capas es lo que hace esto distinto de cualquier web de jardinería.
El diseño debería **notar esa diferencia visualmente** en vez de tratar todo como campos de una tabla.

## Dirección visual

Cerrada por `ux-lead`. Todo lo que hay aquí es normativo: `css/tokens.css` la implementa y
`css/app.css` solo la compone. Si algo de aquí no se puede construir, se habla, no se improvisa.

### De dónde sale

De las fotos que hay en `docs/plants/`. Las plantas vienen de **Viveros Projardín, Avda. de
Móstoles s/n, Tfno. 91.644.22.13**, y traen pegada su etiqueta térmica: fondo blanco brillante,
negro sucio de impresora térmica, grotesca estrechísima estirada de borde a borde
(`COLEO`, `FICUS SUNNY / MACETA 15 CM`), precio enorme con coma decimal y `€`
(`2,25€`, `8,95€`), código EAN, y abajo del todo, en cuerpo diminuto,
`P. FITOSANITARIO Nº ES13-28/0283F`. La begonia trae una etiqueta distinta —óvalo verde lima,
`Product from ALMERÍA`, recuadro azul de `PLANT PASSPORT`—.

Los tiestos son plástico inyectado en tres colores: **teja** (el coleo), **verde botella muy
oscuro** (el ficus) y **rojo** (la begonia), con el borde gris.

Ese es el mundo del sujeto y de ahí sale todo: **plástico y etiqueta térmica española**, no
herbario inglés. Ni una decisión de esta sección es "porque queda bien en una web de plantas".

### Paleta — 6 colores

> **La única fuente de verdad de los nombres es `css/tokens.css`.** Esta tabla es
> explicación, no contrato: si algún día discrepan, manda el fichero. `builder` copia los
> nombres de ahí, nunca de aquí.

| Nombre | Token | Hex | Qué es en el mundo real | Dónde se usa |
| --- | --- | --- | --- | --- |
| **Maceta** | `--color-maceta` | `#8F4A33` | El plástico teja del tiesto del coleo | Fondo de página. Nunca lleva texto que no sea blanco |
| **Tinta** | `--color-tinta` | `#16342A` | El verde botella del tiesto del ficus | Tinta principal: todo el texto sobre la etiqueta |
| **Etiqueta** | `--color-etiqueta` | `#FBFAF7` | El blanco satinado de la pegatina térmica | Superficie de las fichas, franjas y paneles |
| **Bolígrafo** | `--color-boli` | `#1F3F97` | El azul del recuadro `PLANT PASSPORT` de la begonia | **Solo la capa de Carlos** y los enlaces a fuentes |
| **Alerta** | `--color-alerta` | `#A4161A` | El rojo del tiesto de la begonia, saturado a señal | Severidad `critica` |
| **Aviso** | `--color-aviso` | `#8C5A05` | El ocre de la tierra seca en el borde del cepellón | Severidad `atencion` |

Derivados que también viven en tokens (no son decisiones nuevas, son la misma paleta):
`--color-tinta-suave #4A6357` (texto secundario), `--color-codigo #4F6157` (mono de metadatos),
`--color-borde #918A7B` (bordes informativos), `--color-cuaderno #EEF1FA` (papel del panel de
Carlos), `--color-sin-dato #63625B` (la ausencia de dato, que **no es un estado** y nunca es
verde), los rellenos pálidos `--color-alerta-relleno` y `--color-aviso-relleno`, y las dos caras del plástico
(`--color-maceta-alta #A85C43`, `--color-maceta-baja #6E3826`) para el anillo moldeado del tiesto.

**Decisión de jerarquía, no de gusto:** `severidad: sana` **no tiene color propio**. Una planta
sana se pinta en Tinta como todo lo demás. El color solo aparece cuando hay un problema, que es
justo el trabajo primario de la página. Añadir un verde "OK" habría gastado color en la
información menos urgente.

#### Contrastes verificados (WCAG 2.1, calculados, no estimados)

| Par | Ratio | Umbral | |
| --- | --- | --- | --- |
| Tinta sobre Etiqueta | **12,91** | 4,5 | ✅ |
| Tinta-suave sobre Etiqueta | **6,26** | 4,5 | ✅ |
| `--color-codigo` sobre Etiqueta | **6,33** | 4,5 | ✅ (cuerpo 11 px, se mide como texto normal) |
| `--color-codigo` sobre `--color-etiqueta-2` | **5,69** | 4,5 | ✅ era 4,54 — corregido tras auditoría |
| `--color-sin-dato` sobre Etiqueta | **5,87** | 4,5 | ✅ |
| `--color-sin-dato-trama` sobre su relleno | **3,35** | 3,0 | ✅ era 1,72 — **suspendía**, corregido |
| `--texto-sobre-alerta` sobre `--color-alerta` | **7,43** | 4,5 | ✅ severidad crítica, invertida |
| Bolígrafo sobre Etiqueta | **9,08** | 4,5 | ✅ |
| Bolígrafo sobre Cuaderno | **8,77** | 4,5 | ✅ |
| `--color-alerta` sobre Etiqueta | **7,43** | 4,5 | ✅ |
| `--color-alerta` sobre `--color-alerta-relleno` | **6,66** | 4,5 | ✅ |
| `--color-aviso` sobre Etiqueta | **5,62** | 4,5 | ✅ |
| `--color-aviso` sobre `--color-aviso-relleno` | **5,27** | 4,5 | ✅ |
| Etiqueta sobre Maceta | **6,30** | 4,5 | ✅ |
| Etiqueta sobre Maceta-baja | **8,92** | 4,5 | ✅ |
| Borde `#918A7B` sobre Etiqueta | **3,28** | 3,0 | ✅ |
| Maceta sobre Etiqueta (filete) | **6,30** | 3,0 | ✅ |

**Par prohibido:** Tinta sobre Maceta = **2,05**. Sobre el fondo de página solo se escribe en
Etiqueta (blanco). Está anotado en `tokens.css`.

**Foco.** Ningún color único pasa 3:1 contra Etiqueta *y* contra Maceta a la vez (Bolígrafo sobre
Maceta es 1,44). Por eso el anillo de foco es **doble**: 2 px de Tinta pegados al elemento más un
halo de 3 px en Etiqueta por fuera. Sobre blanco manda el anillo oscuro (12,91), sobre la maceta
manda el halo claro (6,30). Token único: `--anillo-foco`.

### Tipografía

Tres papeles, tres registros, y los dos primeros existen porque el contenido tiene **dos capas**.

| Papel | Familia | Fallback de sistema (funciona hoy, sin ficheros) | Para qué |
| --- | --- | --- | --- |
| **Etiqueta** (display) | `Archivo Narrow` 700 — SIL OFL, Omnibus-Type | `"Arial Narrow", "Helvetica Neue Condensed", …` | Nombre de la planta en caja alta, cabeceras de campo, la franja del parte del día |
| **Cuerpo** | `Alegreya Sans` 400/500/700 + **itálica** — SIL OFL, Huerta Tipográfica | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", …` | Todo el texto corrido. La **itálica** es la voz de Carlos |
| **Dato** (utilidad) | `IBM Plex Mono` 400/600 — SIL OFL | `ui-monospace, "SF Mono", Menlo, Consolas, …` | Cifras, °C, ml, cm, €, EAN, nº fitosanitario, URLs de fuentes |

Por qué estas y no otras:
- **Archivo Narrow** es una grotesca de alto rendimiento para impresión: es literalmente el
  registro de la etiqueta térmica. El fallback `Arial Narrow` no es una derrota — es la fuente
  que el software de la etiquetadora de Projardín estaría usando.
- **Alegreya Sans** es humanista, con carácter, diseñada para español desde el español. Descartado
  `Inter` por default absoluto, y descartada cualquier serif de alto contraste porque es la mitad
  del cliché nº 1 y además nos empuja al herbario elegante.
- **IBM Plex Mono** para el dato: mecánica sin ser de terminal, y da el efecto contador de la
  báscula del vivero.

**Resuelto.** Los seis `woff2` están en `assets/fonts/`: **82,1 KB en total**, subset latino, y
los seis `@font-face` activos. Cero peticiones a terceros en runtime — se descargaron una vez, en
desarrollo, que es lo que la restricción permite. Las tres familias son SIL OFL y su procedencia y
licencia están anotadas en `css/tokens.css`, porque en un proyecto sin dependencias esos seis
ficheros son lo único con licencia de terceros que hay dentro. Las pilas de fallback se quedan:
cubren el instante previo al `swap` y el caso de servir esto sin la carpeta.

**Escala tipográfica.** Base 17 px (`1.0625rem`) — deliberadamente no 16, para que el texto
corrido de la ficha se lea de un vistazo con la regadera en la mano. Todo en `rem`, nunca `px`.
`--texto-3xs` 11 px · `2xs` 12 · `xs` 13 · `s` 15 · `m` 17 (base) · `l` 20 · `xl` 24 · `2xl` 32,
más dos escalones fluidos: `--texto-nombre` `clamp(2.25rem, 7cqi, 3.75rem)` (el nombre de la
planta, dimensionado contra su contenedor) y `--texto-precio` `clamp(1.75rem, 4.5cqi, 2.5rem)`.

**Espaciado.** Escala de 4 px en `rem`: `--space-1` .25 → `--space-9` 6rem. Nada fuera de escala.

### Layout

> **Una frase:** la página es la pared de macetas del vivero y cada planta es su propia etiqueta
> blanca troquelada pegada encima; el parte del día y el plano de casa van arriba porque son las
> dos formas de llegar a una planta con prisa, y la ficha se abre **en su sitio**, ocupando el
> ancho completo de la rejilla, sin sacarte nunca de la lista.

Sin página de detalle, sin modal, sin router. Todo es una sola pantalla porque el trabajo
primario ("una planta mía tiene un problema ahora") no admite navegación.

```
┌────────────────────────────────────────────────────────────────────────┐
│▓▓▓ fondo MACETA · anillo moldeado del tiesto (gradiente, sin imagen) ▓▓▓│
│                                                                        │
│  LAS PLANTAS DE CASA                     ┌──────────────────────────┐  │
│  siete macetas · Móstoles → casa         │ ⌕ planta, sala o síntoma │  │
│                                          └──────────────────────────┘  │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ PARTE DEL DÍA · 2 de 7 piden mirada  [!! begonia] [! helecho]      │ │ ← franja ETIQUETA
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌── PLANO DE CASA ───────────────────────────────────────────────────┐ │
│ │  ▨ SVG 5 · planta del piso, ventanas rotuladas N/S/E/O,            │ │
│ │    7 puntos = 7 <button> reales que filtran la rejilla             │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌─ ETIQUETA ───────────────┐  ┌─ ETIQUETA ───────────────┐             │
│ │ VIVEROS PROJARDIN        │  │ VIVEROS PROJARDIN        │             │
│ │ Avda. de Móstoles s/n    │  │ Avda. de Móstoles s/n    │             │
│ │ C O L E O                │  │ FICUS SUNNY              │             │  ← nombre a sangre
│ │ ‹nombre científico›      │  │ MACETA 15 CM             │             │
│ │ ▌▌▎▌▎▌▌▎▌      2,25€     │  │ ▌▌▎▌▎▌▌▎▌      8,95€     │             │
│ │ P.FITOSANITARIO ES13-28… │  │ P.FITOSANITARIO ES13-28… │             │
│ ├──────────────────────────┤  ├──────────────────────────┤             │
│ │ RIEGO  cada 4–5 días     │  │ RIEGO  sustrato húmedo   │             │  ← 3 resúmenes
│ │ LUZ    este · 1,2 m      │  │ LUZ    norte · 0,5 m     │             │     y nada más
│ │ TEMP   12–28 °C          │  │ TEMP   10–24 °C          │             │
│ │            [ despegar ▾ ]│  │            [ despegar ▾ ]│             │
│ └──────────────────────────┘  └──────────────────────────┘             │
│                                                                        │
│ ┌─ ETIQUETA DESPEGADA · grid-column: 1 / -1 ─────────────────────────┐ │
│ │ B E G O N I A   ELATIOR TM 15                    [!! CRÍTICA]      │ │
│ │ ┌────────────────┐ ┌───────────────────────────────────────────┐   │ │
│ │ │ foto           │ │ QUÉ LE PASA  señales · causas             │   │ │
│ │ │ 4:5            │ │ ▨ SVG 4 · línea de recuperación + <ol>    │   │ │
│ │ └────────────────┘ └───────────────────────────────────────────┘   │ │
│ │ ┌─ RIEGO ────────┐ ┌─ LUZ ──────────┐ ┌─ TEMPERATURA ─────────┐    │ │
│ │ │ ▨ SVG 1 dedo   │ │ ▨ SVG 2 ventana│ │ ▨ SVG 3 rango °C      │    │ │
│ │ │ resumen+detalle│ │ resumen+detalle│ │ resumen+detalle       │    │ │
│ │ │ ᶠ RHS ↗        │ │ ᶠ RHS ↗        │ │ ᶠ POWO ↗              │    │ │
│ │ └────────────────┘ └────────────────┘ └───────────────────────┘    │ │
│ │ sustrato · abonado · trasplante · plagas · toxicidad · dificultad  │ │
│ │ ╔═ cuaderno cuadriculado, filete azul a la izquierda ═══════════╗  │ │
│ │ ║ CARLOS  la compré en marzo, se me fue la mano con el agua…    ║  │ │  ← itálica, BOLÍGRAFO
│ │ ╚═══════════════════════════════════════════════════════════════╝  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

- Rejilla: `repeat(auto-fill, minmax(20rem, 1fr))`. Sin fotos en la rejilla cerrada — la etiqueta
  del vivero identifica la planta mejor y más rápido que una miniatura de hoja verde, que es lo
  que todas se parecen entre sí. La foto aparece al despegar.
- La ficha abierta es `<details open>` con `grid-column: 1 / -1`. **Funciona sin JS**: el JS solo
  añade buscar, filtrar y el plano. Progresivo de verdad, no de boquilla.
- Las fichas usan **container queries**, no media queries: la misma etiqueta sirve en la rejilla
  cerrada, abierta a ancho completo y en 320 px.
- Las plantas con `estados[].severidad != sana` van **las primeras** en el DOM. El orden es
  información.
- Móvil: una columna, la franja del parte del día se vuelve `position: sticky`.

### Las dos capas de contenido

Ésta es la exigencia del brief que el diseño tenía que **notar**. Se resuelve con
**cuatro señales simultáneas**, ninguna de ellas solo el color:

| | Capa dura (verificada) | Capa de Carlos (personal) |
| --- | --- | --- |
| Superficie | Etiqueta blanca | Panel **Cuaderno**, cuadriculado 5 mm, filete de 3 px a la izquierda |
| Tipografía | Cuerpo redonda + **Dato** mono para las cifras | Cuerpo **itálica**, un escalón mayor |
| Tinta | Tinta (verde botella) | **Bolígrafo** (azul del plant passport) |
| Rótulo | Cabecera del campo en Etiqueta, caja alta | La palabra `CARLOS` como rótulo explícito |
| Procedencia | Fuente citada visible con enlace y dominio, nunca escondida | Sin fuente, y no la necesita: es suyo |

Las fuentes citadas **son contenido, no letra pequeña**: van al pie de cada campo, en mono, con
el dominio visible (`rhs.org.uk ↗`), a `--texto-xs`, en Bolígrafo. Nunca a 10 px en gris.

### Signature

**La etiqueta de Projardín, reconstruida en HTML y CSS.**

Cada ficha *es* su pegatina: `VIVEROS PROJARDIN` y la dirección de Móstoles en microtipografía
arriba, el nombre a sangre de caja en condensada negra, el código de barras EAN y el precio real
en euros con coma abajo, y el `P. FITOSANITARIO Nº ES13-28/0283F` en 11 px. Troquel de 3 px de
radio, filete gris de pegatina, y un brillo satinado apenas perceptible.
El código de barras se dibuja con `repeating-linear-gradient`: cero imágenes, cero peso.

Y el gesto: el botón dice **"despegar"**, y la ficha se abre como si levantaras la pegatina del
tiesto — el borde superior queda anclado, el contenido baja. Una sola idea, ejecutada bien, y
todo lo demás en la página se calla para que se vea. No hay ninguna otra floritura.

Sostiene el examen del brief: nadie llega a una etiqueta de vivero de Móstoles con código
fitosanitario partiendo del prompt "haz una web de plantas".

### Los diagramas explicativos

Regla que los gobierna a todos, y es eliminatoria: **si el SVG se puede borrar sin perder
información, es decoración y se borra**. El dato va siempre también en texto, al lado, y el SVG
lleva `role="img"` con `<title>`/`<desc>`, o `aria-hidden="true"` cuando el texto contiguo ya lo
dice todo. Sin librerías: SVG en línea + CSS, y `@property` para animar valores numéricos.
**Nada arranca solo y nada va en bucle infinito.**

> ### ✔ Conflicto del sol: resuelto — y el diagrama vuelve, encima del otro
>
> Retiré este diagrama al ver que el JSON decía "cero sol directo". **El JSON estaba caduco**: la
> frase venía de una deducción a partir de la orientación NE, no de una observación, y `botanist`
> la propagó porque se la dieron como contexto. Carlos, que es quien vive en la casa, dice
> **"por la mañana da sol directo donde están, luego se va"**. Sobre ese hecho no hay fuente más
> fuerte que el dueño mirando su propio salón.
>
> Retirarlo fue correcto igualmente: tenía una frase de segunda mano contra la fuente escrita del
> proyecto, y la frase de segunda mano era la que mejoraba mi diagrama. Elegir la que me convenía
> habría sido el error aunque hubiera acertado.
>
> **Los dos diagramas no compiten, se apilan:** la escala con el hueco es **el dato** —cuánta luz
> le falta— y el tramo de sol es **el porqué** —de dónde viene la que tiene—. Van en el mismo SVG,
> en dos filas. Y con el matiz que sigue siendo bueno: sol directo de primera hora en un NE de
> Madrid es de incidencia baja. Es "sol directo", no "sol directo duro".

**Se dibujan sobre los datos que existen de verdad.** `botanist` confirmó los ejes numéricos
reales del JSON, y los cinco diagramas se han reescrito para usarlos. Un diagrama de centímetros
de profundidad o de metros hasta la ventana habría sido precisión fingida: esos datos no los
tiene nadie, y `CLAUDE.md` prohíbe rellenarlos a ojo.

| # | SVG | Campo del JSON que consume | Qué dato explica | Animación completa | Versión reducida (obligatoria) |
| --- | --- | --- | --- | --- | --- |
| 1 | **El reloj de riego** — corte vertical del tiesto | `profundidad_cm` (1–2) · `dias_verano` · `dias_invierno` (2–10) · `ml_aprox` (90–300) | Cada cuánto se riega, y cuánto cambia de verano a invierno — que es lo que de verdad se falla | El sustrato se seca de arriba abajo a lo largo del intervalo (`--frente-humedo`), 900 ms, **una vez** al despegar la ficha | Sustrato ya dibujado en su estado final; 120 ms de opacidad. Sin gota |
| 2 | **Lo que quiere y lo que tiene** — dos filas: la escala de 1 a 5 con dos marcas, y debajo la tira del día | `luz.nivel_actual` · `luz.nivel_ideal` · el tramo de sol directo de la mañana | **Arriba, el dato**: cuánto le falta — los dos coleos quieren más de la que tienen, el poto está más oscuro de lo ideal, y cuando las marcas coinciden no hay nada que hacer. **Abajo, el porqué**: de dónde sale esa luz — sol directo de primera hora y después claridad sin sol | La marca de "lo que tiene" entra, el hueco hasta "lo que quiere" se rellena, y el tramo de sol se dibuja de izquierda a derecha; 260 ms + 900 ms, **una vez** | Las dos marcas, el hueco y los dos tramos ya dibujados; solo opacidad |
| 3 | **Rango térmico** — eje de 0 a 40 °C | `min_c` · `max_c` · `optimo_*` (solo 2 de 7) · `casa_verano_max_c` (28) · `rusticidad_rhs` | La banda que aguanta, la óptima **donde exista**, y dónde cae la casa dentro de ella. **No hay mínima letal**: `minima_letal_c` es `null` en las siete y RHS no publica ese dato | La banda crece de `min_c` a `max_c` y la marca de casa entra después, 260 ms | Banda y marca ya en su sitio, solo opacidad |
| 4 | **Curso de recuperación** — eje de **hitos**, no de fechas | `estados[].plan_recuperacion[]` (`{paso, senal, hito}`) · `estados[].revisar_fecha` · `estados[].revisar_en` (prosa con plazo **y** criterio) | Solo en begonia (5 pasos) y helecho (6): cada nodo es un paso y debajo la **señal observable** que confirma que funcionó. Lo que deja avanzar no es que pasen siete días, es que veas el brote | La línea se traza de izquierda a derecha (`--recorrido`, 900 ms) y el hito de hoy late **una sola vez** | Línea completa desde el principio, sin latido |
| 5 | **El calendario del domingo** — eje compartido de 2 a 10 días | `riego.dias_verano` de **las siete** | Cuál toca antes. Es la respuesta a "voy a regar y no me acuerdo de a cuál", que es el trabajo primario de la página | Los siete marcadores entran escalonados, 160 ms + `--retardo-*` | Los siete ya en su sitio, sin escalonar |

Redundancia textual obligatoria, por SVG: (1) "cuando los 2 cm de arriba estén secos · cada 4 días
en verano, 9 en invierno · 250 ml";
(2) "quiere nivel 4 de 5 y tiene 3: le falta un escalón · sol directo a primera hora, después claridad"; (3) "7–30 °C · en casa, 28 °C de tope en verano"; (4) el mismo tratamiento como `<ol>`
numerado, del que el SVG es una segunda vista; (5) cada marcador es un `<button>` real con nombre
accesible ("Poto — cada 7 días"), así que el diagrama es una vista redundante de una lista que ya
funciona sin él.

`prefers-reduced-motion: reduce` no apaga: **cambia de versión**. Y el diagrama 4, que es el que
más importa, es legible entero sin una sola animación.

> **El plano de casa está cerrado, no aparcado.** Carlos confirma que **las siete están en el
> salón**. Un plano sería una habitación con siete puntos amontonados: cero información, que es la
> definición de diagrama decorativo y por tanto de diagrama que se borra. No vuelve.
>
> Y el dato que lo mata mejora dos cosas. Al compartir las siete el mismo microclima, **el
> calendario del domingo deja de ser una comparación y pasa a ser lo que de verdad es: una sola
> escena de riego**, siete plantas en el mismo sitio y el mismo aire. Y la luz deja de ser una
> categoría abstracta por planta y pasa a ser una historia común, que es lo que arregla el SVG 2.

### Más superficie visual — tres sistemas nuevos

Carlos pide, y es su criterio nº 1: *"iconos SVG, animaciones, gráficos… todo muy útil para
entender todo visualmente"*. La regla eliminatoria no cambia —**si se puede borrar sin perder
información, es decoración y se borra**— pero se aplica a más superficie. Lo que sigue son tres
sistemas nuevos, y los tres salen de material que existe, no de ganas de dibujar.

#### 6. La cronología — "cuánto lleva aquí"

Ocupa el hueco que dejó el plano de casa, y lo ocupa mejor de lo que lo habría ocupado el plano.
La cronología real de las siete abarca **tres órdenes de magnitud**:

| | Llegó | Lleva |
| --- | --- | --- |
| poto | hace más de 20 años | **décadas** |
| begonia, helecho | 29 mayo 2026, regalo de Vanesa a Noah | **74 días** |
| coleo pequeño, coleo grande, ficus, margarita | 11 agosto 2026, Projardín | **horas** |

Décadas, semanas y horas en siete macetas del mismo salón. **Un eje lineal es inservible aquí**:
el poto ocuparía el ancho entero y las otras seis serían un borrón en el extremo derecho. Así que
el eje es **logarítmico**, con las marcas rotuladas —`hoy · 1 semana · 1 mes · 1 año · 10 años`—
porque un eje logarítmico sin rótulos miente sobre las proporciones.

**Qué explica, y por qué no es decoración:** que las cuatro impecables lo están, en parte, porque
**no han tenido tiempo de que nada les salga mal**, y que el poto es el único con dos décadas de
prueba de que ese sitio funciona. Eso reencuadra las otras fichas y no está dicho en ningún otro
sitio. La comparación entre tres órdenes de magnitud solo es legible como gráfico; en texto son
siete frases que nadie relaciona.

- **Animación:** los siete marcadores entran de derecha a izquierda —de lo más reciente a lo más
  antiguo—, 160 ms escalonados con `--retardo-*`. **Reducida:** los siete ya en su sitio.
- **Texto redundante:** cada marcador es un `<button>` con nombre accesible ("Poto — más de 20 años
  en casa"). El diagrama es una vista redundante de una lista que funciona sin él.
- **Degradado:** sin `fecha_llegada`, ese marcador va a la zona `--trama-sin-dato` del eje, con su
  rótulo. No se omite la planta: faltar en un censo de siete es información falsa.

#### Las siete siluetas de hoja — y esto arregla un agujero mío

Decidí que en la rejilla cerrada no hubiera fotos, porque una miniatura de hoja verde no
identifica nada: todas se parecen. Eso era cierto y dejó un agujero que no había visto —**las
siete fichas se distinguen solo por el texto del nombre**—. La idea de la silueta de línea lo
cierra, y es mejor que la foto por la razón que la hace legítima: **la forma de la hoja es la
clave de identificación botánica**, no un adorno con tema vegetal. Es el dato que usa cualquiera
para saber qué planta tiene delante.

Y hay un anclaje que la vuelve inevitable en este proyecto: **la etiqueta real de la begonia ya
trae una fila de pictogramas de cuidado**. El sistema de iconos no se importa de fuera, se
levanta del propio artefacto que es la signature.

Siete dibujos, un solo trazo (`--trazo`), silueta cerrada, sin relleno, en `--texto-principal`:

Los rasgos los ha corregido `botanist` y mandan los suyos, no los míos. **Prefiero un dibujo feo
y cierto a uno bonito que identifique mal**, y cuatro de mis seis descripciones eran lo segundo:

| Planta | Qué tiene que leerse | Corrección |
| --- | --- | --- |
| begonia | base **asimétrica** —exagerarla, es EL rasgo del género— y margen **crenado-serrado**, dientes redondeados con puntita. Lámina orbicular-cordada | yo decía "ondulado" |
| coleo (×2) | margen **serrado** profundo, punta acuminada, y **un trozo de tallo con el par de hojas opuestas y cruzadas**: dice "labiada" de un golpe. Los distingue el tamaño | el par opuesto lo aporta `botanist` |
| *Ficus pumila* | diminuta, oval, margen **festoneado** y **red de nervios hundidos** que la hace rugosa. RHS: "broadly oval, scalloped". A la misma escala que las demás, para que se vea que es pequeña | yo decía "nervio marcado" |
| margarita | lámina ancha con **3–5 lóbulos gruesos e irregulares, profundamente hendidos, base en cuña** | ver abajo: aquí el dibujo **es la prueba** |
| poto | **acorazonada, entera**, ápice en punta. **Juvenil**: la adulta es pinnatisecta y la nuestra no lo es | aviso para que nadie la "mejore" |
| helecho | **fronde** con raquis y pinnas, contorno genérico. Y ver abajo | `botanist` confirma el dibujo |

**La margarita es el caso que justifica todo el sistema.** La etiqueta dice MARGARITA y la planta
es un crisantemo, y **lo que lo demuestra es la hoja**. Dibujada finamente dividida parecería una
*Argyranthemum*; estrecha y dentada, una *Leucanthemum*. Gruesa y lobulada, **el dibujo argumenta**
— deja de ilustrar la identificación y pasa a ser su evidencia. Eso es exactamente lo que separa
un diagrama que explica de uno que decora, aplicado a un dibujo.

**El helecho es el caso que hace honesto el sistema**, y `botanist` precisa hasta dónde llega el
dibujo: **que es un helecho sí se sostiene** —la morfología de los segmentos lo es—, lo que no se
sostiene es el género. Así que el contorno puede ser un fronde genérico sin miedo, y la trama va
donde está la incertidumbre real. Su silueta se dibuja **con `--trama-sin-dato`
dentro del contorno** y `aria-label` "fronde de helecho sin identificar". El dibujo dice
exactamente lo que sabemos —que es un helecho— y marca lo que no. Si algún día `botanist` cierra
la identificación, se rellena. Un dibujo bonito de *Adiantum* ahí sería afirmar una especie con un
lápiz, que es la misma mentira que rellenar un campo a ojo.

**La tensión grabado / plástico: está en el sitio, no en la textura.** El brief nombra los
diagramas botánicos del XIX entre el material del que salen las buenas decisiones, y la colisión
entre ese registro y un vivero de plástico de Móstoles es lo mejor que tiene el proyecto. Pero
**no se consigue añadiendo tramas de grabado a la hoja**: a 40 px el rayado de volumen es barro, y
un rayado ilegible es decoración disfrazada de técnica. A ese tamaño, el registro de lámina
decimonónica lo dan tres cosas que ya están en el spec — **trazo de grosor único, ausencia total
de relleno y fidelidad al margen de la hoja**, que es como se dibuja una lámina de identificación.

La colisión la produce **dónde está**: un dibujo en registro de grabado, impreso en la misma tinta
que el código de barras, dentro del troquel de una pegatina que dice `2,25€`. No hay que empujarla
más. Si además le pusiéramos textura de aguafuerte, dejaría de ser una etiqueta de vivero con un
dibujo serio y pasaría a ser una web bonita de plantas — que es exactamente el lugar del que
llevamos todo el proyecto huyendo.

- **Sitio:** en el troquel de la etiqueta, arriba a la derecha, a `--silueta-tam`. Nunca sustituye
  al nombre: acompaña.
- **Animación: ninguna.** Es un elemento de identificación y tiene que estar quieto para servir
  de ancla al escanear. Aquí menos es más y no hay versión reducida porque no hay versión.
- **`aria-hidden="true"`** cuando el nombre de la planta está al lado, que es siempre — salvo la
  del helecho, que sí lleva `role="img"` porque su trama comunica algo que el texto no repite.

#### El sistema de iconos de campo

`RIEGO`, `LUZ`, `TEMPERATURA`, `SUSTRATO`, `ABONADO`, `TRASPLANTE`, `PLAGAS`, `TOXICIDAD`,
`DIFICULTAD` son hoy rótulos en versalitas. Un icono delante los hace escaneables, que es
literalmente el trabajo primario de la página: encontrar el campo con la regadera en la mano.

**El texto no se sustituye, se acompaña.** Un icono solo obliga a aprender un vocabulario antes de
poder usar la web, y esta se abre con prisa y una vez cada quince días. Icono + versalita.

Especificación única para los nueve: caja de `--icono-tam`, trazo `--trazo`, `currentColor`,
`stroke-linecap: round`, sin relleno, **sin detalle interior** —a 20 px el detalle es ruido—, y
`aria-hidden="true"` siempre, porque la palabra está al lado.

| Campo | Icono |
| --- | --- |
| riego | regadera con una gota |
| luz | sol de medio disco con rayos cortos |
| temperatura | termómetro de bulbo |
| humedad | gota sola |
| sustrato | tres bandas horizontales, la de arriba granulada |
| abonado | cuchara de medida |
| trasplante | maceta con flecha ascendente |
| plagas | insecto de seis patas, muy esquemático |
| toxicidad | triángulo de aviso |
| manipulación | **guante** — campo nuevo `manipulacion`, ver abajo |
| dificultad | uno, dos o tres círculos rellenos según `fácil` / `media` / `exigente` |

`dificultad` es el único que **codifica un valor** en vez de nombrar un campo, y por eso es el
único que necesita la palabra al lado sí o sí: uno, dos o tres puntos no dicen cuál es cuál. La
regla de siempre — nada depende solo de la forma, igual que nada depende solo del color.

#### Nota de manejo — el aviso que sí va en el tratamiento

Con savia irritante, el riesgo real no es la ingestión: es **manipular la planta** al podar o
trasplantar. Eso no pertenece al campo de toxicidad, que describe la especie: pertenece **al paso
del tratamiento donde toca**, junto a la acción que lo provoca.

Va como una línea dentro del `<li>` del `<ol>` de tratamiento, marcada con el icono de toxicidad a
`--icono-tam`, en `--texto-secundario`, sin relleno de color y sin borde. No es alarma: es cómo se
hace la tarea que ya se ha decidido hacer. Ejemplo: en el trasplante de la begonia, *"la savia
irrita piel y ojos: guantes, y no te toques la cara"*.

**Y esto no reabre lo de la toxicidad.** El campo se queda como está — tinta sobre superficie
hundida, borde, icono y la palabra `TÓXICA`— porque en este sistema **el color significa "haz algo
hoy"** y tres fichas en rojo se comerían al helecho, que es el único que se está muriendo de
verdad. Con Noah en veinte años no hay riesgo de ingestión accidental. Si alguien vuelve a
empujar hacia el rojo, este párrafo es la respuesta.

### La voz del panel de cuaderno: una superficie, el nombre variable

El lector de esta web **no es Carlos: es Noah**, que tiene veinte años, cuida las plantas, y es el
dueño de las dos que están tocadas. Eso pone en cuestión el rótulo fijo `CARLOS`.

**Criterio: una sola superficie personal, con el nombre de quien habla tomado del dato.** El
rótulo pasa de `CARLOS` a `nota.autor`. Ni un token nuevo, ni una superficie nueva.

Por qué una y no dos:

1. **El panel no codifica una persona, codifica un registro.** La itálica, el azul de bolígrafo y
   el papel cuadriculado dicen *"esto no tiene fuente y no la necesita, lo dice alguien que estaba
   aquí"*. Eso es igual de cierto en boca de Carlos —"el poto lleva veinte años con la familia"—
   que de Noah —"no quiero que se me muera otra vez"—. Dos superficies para el mismo tipo de
   enunciado obligan a aprender dos cosas para entender una.
2. **La distinción se gasta donde hace falta.** Es el mismo principio que el color: hay una sola
   planta crítica y por eso el rojo no se reparte. Quien abre esto va a regar, no a auditar quién
   dijo qué; separar por autor gasta jerarquía visual en una diferencia que no cambia ninguna
   decisión.
3. **Con el nombre en el dato, escala gratis.** Vanesa regaló las dos plantas de mayo. Si algún
   día habla ella, ya cabe. Con dos superficies fijas habría que inventar una tercera.

Lo que sí cambia, y es más importante que el rótulo: **la segunda persona de los textos apunta a
quien riega.** "Riega cuando…", "no te toques la cara". Eso ya era así y ahora se sabe por qué.

`notas_carlos` debería llamarse `notas` y traer `{ autor, texto }`. Es cosa de `botanist`; se lo
paso, y mientras el campo se llame como se llame, el rótulo sale del `autor` y no del nombre del
campo.

### Revisión contra el JSON definitivo — lo que cambia, y por qué

`botanist` ha cerrado `content/plantas.json` (7 plantas, 157 fuentes) y ha corregido cuatro cosas
que yo daba por buenas. Todas afectan al diseño y tres afectan a la **signature**, que es lo más
caro de tocar. Se tocan igual: una etiqueta que imprime un dato falso no es una signature, es un
error tipografiado en grande.

#### 1. El código de barras: solo la begonia tiene un EAN de verdad

Yo estaba tratando `"2040 2174"` como código EAN. **No lo es**: es el **código interno del vivero**,
ocho dígitos, y va en `codigo_vivero`. El único EAN-13 real del inventario es el de la begonia,
`8437018857012`, que es etiqueta de productor (GONZA S.A.T., `Product from ALMERÍA`).

Qué se hace, y la distinción es fina pero es la que separa verdad de adorno:

- **La banda de barras se sigue dibujando** en las etiquetas de Projardín, porque la pegatina real
  la lleva impresa: eso no es invención, es lo que hay pegado en el tiesto.
- **Lo que cambia es el rótulo de los dígitos.** Bajo las barras se imprime lo que el dato es:
  `CÓD. 2040 2174` en las de Projardín, `EAN 8437018857012` solo en la begonia. Nunca la palabra
  EAN sobre un número que no lo es.
- Donde no hay ni una cosa ni otra —helecho y poto—, no hay barras. Ver más abajo.

#### 2. La begonia no tiene precio, y no es un fallo

Su etiqueta es **de productor, no de vivero**: no lleva precio porque no se puso a la venta con
ella. Mi maqueta de la pegatina daba el precio por hecho. La celda del precio pasa a ser **la celda
de procedencia**, y cada ficha imprime lo que su etiqueta trae de verdad:

```
coleo pequeño   CÓD. 2040 2174        2,25 €        (sin calibre de maceta)
coleo grande    CÓD. …                4,95 €        MACETA 1,6 L      ← volumen, no diámetro
ficus sunny     CÓD. …                8,95 €        MACETA 15 CM
margarita       CÓD. …                …             MACETA 12 CM
begonia         EAN 8437018857012     —             PASAPORTE A/B/C/D · ALMERÍA · V-IX
```

`maceta_cm` es `null` en los dos coleos y **eso también se imprime como es**: el grande dice
`MACETA 1,6 L` porque su etiqueta da volumen y no diámetro, y el pequeño no dice nada de la maceta
porque su etiqueta no lo indica. Los 9 cm que aparecen en su ficha son estimación de `botanist`
sobre la foto, y una estimación no se imprime en la pegatina — la pegatina reproduce lo impreso.

El pasaporte fitosanitario de la begonia (`A BEGONIA ELATIOR · B ES01042001 · C L1 · D NL`) ocupa
en su ficha el sitio de la línea `P. FITOSANITARIO` de las de Projardín. Es el mismo renglón
funcional: la trazabilidad legal de la planta, en cuerpo `--texto-3xs`.

> `ES13-28/0283F` identifica **al vivero**, no a la planta, y por eso se repite en ficus, los dos
> coleos y la margarita. No es un identificador y no se usa como tal.

#### 3. Helecho y poto: el vacío es la información

`etiqueta_vivero` es `null` **entero** en las dos, no parcialmente. `botanist` avisa de que el
diseño «se cae en 2 de 7 fichas» si la ficha es una reconstrucción de la pegatina. Tiene razón en
el diagnóstico y la salida ya estaba tomada: **la ausencia de etiqueta no es un hueco, es
antigüedad y es procedencia**. La pegatina se dibuja igual —el sistema no se rompe en dos de siete—
pero imprime lo que sabe:

```
poto      SIN ETIQUETA DE VIVERO     Sin trazabilidad comercial: probablemente un esqueje.
                                     Más de veinte años en la familia.
helecho   SIN ETIQUETA DE VIVERO     Regalo del 29 de mayo. Rescatado de una desecación.
```

Sin barras, sin precio, sin fitosanitario: **una raya `—` donde iría cada uno**, que es un carácter
y dice "no hay", no "se nos olvidó". Y el renglón de procedencia, que en las otras cinco es
burocracia comercial, en estas dos es lo único que hay y resulta ser mejor. Esa observación es de
`botanist` y entra tal cual.

#### 4. Las fuentes van agrupadas, y se citan por nombre corto

`fuentes` es un array de `{campo, fuente, url, consultado, nota?}`, de 15 a 24 por planta. Se
filtra por `campo` y se pinta la citación **junto a su dato**, que es el efecto que buscaba: el
cambio es de dónde se lee, no de dónde se ve.

Y se cita por el **nombre corto** —`RHS`, `POWO`, `ASPCA`, `IPNI (Kew)`— no por el dominio, que era
lo que yo había especificado. `RHS ↗` se lee mejor que `rhs.org.uk ↗` y es lo que el campo trae.
Cuando `fuente` es `Carlos` u `observación de foto`, **no se pinta como enlace** porque no lo es:
va en `--texto-secundario`, sin flecha, y `consultado` al lado.

> **Y una línea que es obligatoria, no opcional.** `botanist` avisa de que los mililitros y los
> días entre riegos son **su traducción** a esta maceta y a este clima, no cifras publicadas por
> RHS. El pie del diagrama de riego tiene que decirlo: *"días y ml estimados para esta maceta —
> RHS no publica mililitros"*. Presentarlos con el sello de RHS sería atribuir a una fuente algo
> que no dice. Es el mismo principio que separa la capa dura de la capa personal, aplicado dentro
> de la capa dura.

#### 5. Los diagramas, corregidos contra los campos que existen

**Riego (1).** Gana un dato que yo había dado por perdido: **`riego.profundidad_cm`** existe y vale
1 o 2 cm en las siete. Así que el corte del tiesto vuelve a tener su marca de profundidad, que era
la idea original. Consume `riego.profundidad_cm`, `dias_verano`, `dias_invierno` y `ml_aprox`, y
lleva el pie de atribución de arriba. Texto: *"cuando los 2 cm de arriba estén secos · cada 4 días
en verano, 9 en invierno · 250 ml"*.

**Luz (2) — y aquí `botanist` mejora el diagrama, no lo corrige.** Yo lo había planteado como
"cuánto le falta". El dato real tiene **signo**: `nivel` es lo que la especie necesita y
`nivel_actual` lo que recibe donde está, y la diferencia va en las dos direcciones:

| | Quién | Qué significa |
| --- | --- | --- |
| **exceso** | helecho (necesita 2, recibe 4), begonia (3 vs 4), ficus (3 vs 4) | riesgo de **quemadura** |
| **en su sitio** | coleo pequeño, coleo grande, margarita (4 vs 4) | nada que hacer |
| **déficit** | poto (3 vs 2) | pierde **variegación** |

Tres estados con signo, no una escala plana — y el más frecuente es el que yo no había previsto.
El hueco se dibuja **con dirección**: hacia la derecha si sobra, hacia la izquierda si falta, con
la palabra `EXCESO` o `DÉFICIT` y la consecuencia al lado. **Sin color**: exceso y déficit no son
alarmas, son diagnósticos, y el color en este sistema significa "haz algo hoy".
La segunda fila —la tira del día con el tramo de sol directo matinal— explica **de dónde sale el
exceso**, y ahora se entiende por qué las tres que sobran de luz están las tres tocadas o al
límite. `distancia_m` es `null` en las siete: se dibuja el eje sin escala métrica.

**Temperatura (3) — hay que quitarle una cosa que no existe.** Yo había especificado una marca de
**mínima letal**: `minima_letal_c` es `null` en las siete y `botanist` explica por qué —RHS publica
bandas de rusticidad, que dicen dónde puede vivir una planta, no a qué grado muere—. **Fuera del
diagrama.** Lo que sí hay:
- banda tolerada `min_c`–`max_c` en las siete;
- banda óptima **solo en begonia (15–22) y poto (18–30)**; en las otras cinco, `--trama-sin-dato`
  con el rótulo "sin óptimo publicado";
- `casa_verano_max_c: 28` en las siete, como marca de casa;
- `casa_invierno_c` `null` → segunda marca en trama, pendiente de que Carlos lo mida;
- `rusticidad_rhs` (`H1C`, `H2`) como etiqueta de texto donde exista, no como marca en el eje:
  es una banda climática, no una temperatura, y ponerla en un eje de grados la convierte en otra
  cosa.
- **El helecho necesita el eje abierto por la derecha:** `max_c` es `null`, así que su banda se
  dibuja como `≥ 10 °C`, con el extremo derecho desvanecido en trama y sin punta. Un eje cerrado
  ahí sería inventar un máximo.

**Recuperación (4) — cambia de eje.** Yo lo había especificado como línea de tiempo de fechas.
`revisar_en` **no es una fecha ISO**: es texto con plazo *y criterio*, porque dice qué mirar además
de cuándo. Y `botanist` ha añadido **`plan_recuperacion[]`**, array ordenado de `{paso, senal,
hito}` — exactamente lo que faltaba. Así que el eje **no es el calendario, son los hitos**: cada
nodo es un paso, y bajo cada nodo la **señal observable** que confirma que ese paso funcionó. Es
mejor eje que el temporal, porque lo que decide si avanzas no es que pasen siete días: es que veas
el brote. Solo en begonia (5 pasos) y helecho (6).

**Cronología (6).** Sin cambios. `fecha_llegada` con el poto en texto aproximado.

#### 6. Las siete sanas también tienen `estado`, y hoy no tienen dónde

`estados` está poblado en las siete, **también en las cuatro sanas**: llevan preventivo, plazo y
qué mirar. Mi sistema les da distintivo cero —y eso sigue bien, cuatro insignias de "todo bien" son
ruido— pero eso no puede significar que su contenido no se vea.

Va bajo el rótulo `QUÉ VIGILAR`, en la misma posición de la ficha que ocupa `QUÉ LE PASA` en las
tocadas, en `--texto-principal` sin relleno ni borde. Misma estructura, distinto rótulo y ningún
color. Una planta sana no necesita una alarma; necesita saber qué la va a estropear.

#### 7. Toxicidad: el sitio donde el diseño tiene más responsabilidad

`botanist` señala el riesgo concreto, y es serio: ASPCA tiene una entrada **"Prostrate Coleus"**
que **sí** es no tóxica y que es **otra especie**. Si nuestro distintivo de `sin_datos` se lee como
"seguro", la web puede acabar contribuyendo a una urgencia veterinaria.

Refuerzos, y ninguno es negociable:

- **Nada que se lea como aprobación.** Ni check, ni tick, ni círculo relleno, ni pulgar, ni verde.
  El icono de `sin_datos` es un `?` y el borde es **discontinuo** — un borde roto no se lee nunca
  como confirmación.
- El texto completo, sin abreviar: **"Sin datos en ASPCA para esta especie. No significa que sea
  segura."** Si no cabe, se agranda la caja, no se recorta la frase.
- En los coleos, además, la nota del casi-homónimo: *"ASPCA sí tiene ficha de otra especie de
  nombre parecido; no es esta."* Es el caso que puede hacer daño y se dice explícito.
- `clave` es el valor que manda (`toxica` · `sin_datos` · campo `null`). El texto se pinta desde
  `gatos` y `perros` por separado.

### Corrección tras ver la ficha del helecho renderizada

Tres fallos, y los tres son míos. Salen de mirar la captura de `docs/qa/1280-inicio.png`, no de
releer el spec: en el papel los tres estaban bien escritos.

#### La trama de "sin dato" estaba mal usada, y es un error conceptual

En la pegatina del helecho hay **un rectángulo tramado donde iría el código de barras** y **una
raya `—` suelta** donde iría el precio. Lo especifiqué yo y está mal, por una razón que invalida
mi propia regla:

> **`--trama-sin-dato` significa "no lo sabemos". Que una planta no traiga etiqueta de vivero no
> es un dato desconocido: es un hecho conocido.**

Son cosas opuestas. La trama dice "aquí había que poner algo y no se pudo averiguar"; el helecho
**no tiene** pegatina, y eso no es una laguna, es su procedencia. Renderizado, el rectángulo
tramado se lee como un placeholder de carga y la raya suelta no se lee como nada.

Corrección: en la variante sin etiqueta de vivero **no hay banda de barras y no hay raya**. Ese
espacio lo ocupa la única cosa que sí se sabe, en texto:

```
SIN ETIQUETA DE VIVERO
Sin trazabilidad comercial de una planta que lleva
más de veinte años en la familia.
```

Ni trama, ni gris de sin-dato, ni marca de hueco: **`--texto-secundario`, como contenido normal,
porque es contenido normal.** Es la misma conclusión a la que llegó `botanist` desde el contenido
—«ese vacío es información, no un fallo de datos»— y yo la había escrito y luego la había
traicionado en la implementación.

**Dónde sí sigue la trama:** en la silueta del helecho, dentro del contorno de la fronde. Ahí es
correcta y por el motivo contrario — la especie **sí** es un dato desconocido. Esa es exactamente
la línea que separa los dos casos, y verlos juntos en la misma ficha es lo que la hace visible.

#### "(sin identificar)" no es parte del nombre

La pegatina imprime `HELECHO (SIN IDENTIFICAR)` a cuerpo de titular, en dos líneas. El nombre a
sangre existe para **encontrar la planta de un vistazo**, y "(sin identificar)" es metadato: no
ayuda a encontrarla, y de paso duplica el largo de la cadena más larga de la página.

`nombre_comun` va grande y solo. El estado de identificación baja al renglón del nombre
científico, en `--texto-s`, en `--fuente-dato`, en `--color-sin-dato`: *"especie sin identificar"*.
Ese renglón ya existe para decir qué es la planta; decir que no se sabe qué es le corresponde a él.

Efecto colateral y bienvenido: la cadena más larga de la rejilla pasa de 25 a 7 caracteres, que es
la mitad del problema de 320 px.

#### La ficha corta deja una banda vacía

El helecho tiene menos texto que sus vecinas y, al igualar alturas la rejilla, su bloque de
resúmenes acaba antes y queda una franja blanca sobre el botón de despegar que las otras no
tienen. **El bloque hundido de resúmenes tiene que estirarse hasta el pie de la ficha**, no el
texto. Una ficha con menos contenido debe verse más vacía por dentro, no rota por fuera.

#### Y una que no es mía pero es del mismo tipo

El pasaporte de la begonia parte dejando `NL` solo en la línea siguiente. Los cuatro segmentos
(`A …`, `B …`, `C L1`, `D NL`) son **unidades indivisibles**: cada uno en su `<span>` con
`white-space: nowrap`, y que el salto ocurra entre segmentos. Un código de trazabilidad partido
por la mitad deja de ser un código.

### La página tiene dos modos, y yo solo había diseñado uno

Con una ficha desplegada a 1280 px quedan **dos tercios de fila en vacío**: unos 850 × 480 px de
teja continua a la derecha del helecho. No es un hueco de respiración; es el mayor área de la
pantalla. Y ahí se cobra el riesgo que asumí por escrito: la teja se sostiene porque *"el color
agresivo ocupa los huecos, nunca la lectura"* — con un hueco de ese tamaño deja de ocupar huecos y
pasa a mandar.

Ninguna de las tres salidas evidentes me convence. `grid-auto-flow: dense` rellena el hueco pero
**desacopla el orden visual del orden del DOM**, y con él el orden de foco: llevo todo el proyecto
negándome a que la información dependa de una sola señal, y esto haría que el recorrido con
teclado dejara de coincidir con lo que se ve. No se cambia accesibilidad por relleno. Reducir la
ficha abierta a dos columnas de tres deja el hueco en una y le quita sitio justo al bloque de
diagnóstico, que es el que más contenido tiene. Y reordenar al desplegar mueve la ficha que
acabas de tocar.

**El diagnóstico real es otro: esta página hace dos trabajos y yo le había dado una sola forma.**

| | Qué haces | Qué forma le sirve |
| --- | --- | --- |
| **Modo estantería** | buscar cuál es, comparar, ver quién pide mirada | **rejilla de columnas** — muchas pegatinas de un vistazo |
| **Modo ficha** | leer una planta, mirar sus diagramas, hacer lo que dice | **una sola columna** — nada más compite |

Cuando hay una ficha abierta estás en el segundo, y la rejilla de al lado ya no te sirve para
nada: es ruido alrededor de lo que has decidido leer.

**Regla:** mientras haya una ficha desplegada, **la rejilla colapsa a una columna**.

```css
.rejilla:has(details[open]) { grid-template-columns: 1fr; }
```

Una regla, cero JS, y desaparece el hueco **en todos los anchos** en vez de parchear 1280. El
orden del DOM, el visual y el de foco siguen siendo el mismo, que es lo que no estaba dispuesto a
negociar. Y no es una degradación estética: **una pegatina ancha se parece más a la etiqueta real
que una cuadrada** — las de Projardín son apaisadas. El modo ficha se ve como una estantería
vista de cerca.

**Y las fichas pasan a ser un acordeón exclusivo nativo:** `<details name="planta">`. Solo una
abierta a la vez, sin una línea de JS. Garantiza que el modo ficha va siempre de **una** planta, y
de paso elimina que dos fichas a ancho completo abran dos huecos.

**Lo único que hay que compensar es el salto.** Al colapsar la rejilla, la ficha que acabas de
tocar cambia de sitio. Al abrir, se ancla el `<summary>` desplegado con
`scrollIntoView({ block: "start" })` y `behavior: "auto"` bajo `prefers-reduced-motion`, más
`scroll-margin-block-start` para que no lo tape la franja del parte del día. Eso **no es
reimplementar algo que el navegador ya hace**: es corregir un desplazamiento que provoca nuestro
propio cambio de layout, que es distinto.

### `manipulacion` — la vía de exposición que sí existe en esta casa

`botanist` ha añadido un campo que corrige un hueco del esquema, y el razonamiento es el que yo
debería haber hecho: bajé la toxicidad del registro de alarma porque **no hay mascotas y quien
cuida tiene veinte años**, y eso sigue siendo correcto. Pero de ahí no se sigue que no haya
riesgo: **quien poda y trasplanta es Noah**, y la vía relevante es **dérmica y ocular**.

`manipulacion` = `{resumen, detalle, epi}`, en las siete, con fuente propia — la lista de plantas
potencialmente dañinas de **RHS**, que cubre personas, no ASPCA, que es veterinaria. Poto, ficus y
margarita están en categoría C; begonia, coleo y helecho **no figuran**, y eso se escribe como
ausencia de clasificación, nunca como inocuidad.

Tratamiento visual, y no es alarma:

- **Campo propio en la ficha**, con icono de **guante**, al mismo nivel que sustrato o abonado.
  `--texto-principal`, sin relleno, sin borde, sin color. Describe cómo se hace una tarea.
- **Y la precaución concreta, además, dentro del paso de tratamiento que la provoca** —que es donde
  se lee cuando hace falta—: *"cámbiala de maceta con guantes: al manipular raíces es donde irritan
  los oxalatos"*.
- **El campo se pinta también cuando dice que no hace falta.** En el helecho, `botanist` escribe
  expresamente que ahí los guantes sobran —tejido seco, sin savia—. Esa frase **entra tal cual**:
  *inflar la precaución donde no aplica es la forma de que nadie se la crea donde sí*. Es la misma
  regla que hace que `sana` no lleve distintivo y que el color solo aparezca cuando hay problema,
  aplicada a la seguridad.

### La ficha abierta tiene dos velocidades de lectura, no una

`docs/qa/1280-ficha-despegada-completa.png`: el bloque de diagnóstico es una columna de ~370 px
sobre una ficha de 1.280, con **la mitad derecha vacía** y más de dos mil píxeles de scroll. En la
ficha que más importa.

**Y el problema no es que sobre contenido.** Las trece observaciones de `botanist`, cada causa con
su patrón, y sobre todo la que descarta con evidencia negativa —*"ninguna hoja caída, blanda ni
amarilla sobre el sustrato: el cuadro NO es el del exceso de riego"*— son lo mejor que tiene el
proyecto. Recortarlo destruiría justo lo que hace fiable la web.

El problema es que **todo está al mismo nivel**, y ahí hay dos lecturas distintas compitiendo:

| | Cuándo | Qué se busca |
| --- | --- | --- |
| **Con la regadera en la mano** | ahora, de pie, con prisa | *"sepárala del cristal y cámbiale la maceta"* |
| **El domingo, sentado** | cuando te la miras en serio | *cómo distingo quemadura de aire seco* |

Yo tenía especificadas dos **capas** (dato duro / voz personal) pero no dos **velocidades**. Es el
eje que faltaba, y resuelve el hueco y la jerarquía de una vez.

#### La ficha abierta se parte en dos columnas semánticas

No es partir el texto en dos para ahorrar scroll: **es que son dos cosas distintas.**

```
┌─ FICHA DESPEGADA · ancho completo ──────────────────────────────────┐
│  QUÉ HAGO AHORA            │  EN QUÉ ME BASO                        │
│  ── 2fr, sticky ────────── │  ── 3fr ────────────────────────────── │
│  ▨ riego  ▨ luz  ▨ temp    │  LO QUE SE VE                          │
│  los diagramas: el dato    │  — 13 observaciones                    │
│  de un golpe               │                                        │
│                            │  CAUSAS PROBABLES                      │
│  QUÉ HACER                 │  — causa                               │
│  1. Sepárala del cristal   │    ╞ PATRÓN PARA RECONOCERLA ────────╡ │
│  2. Cámbiala de maceta     │    ╞ cómo se distingue de las otras  ╡ │
│     ⚠ con guantes          │                                        │
│  3. …                      │  LO QUE LA FOTO NO DICE                │
│  ▨ línea de hitos          │  — …                                   │
│                            │                                        │
│  Revisar: 1 sep 2026       │  FUENTES  RHS ↗ · POWO ↗ · ASPCA ↗     │
└─────────────────────────────────────────────────────────────────────┘
```

- **Izquierda, `QUÉ HAGO AHORA`:** los diagramas y los pasos. Es lo accionable, va **primero en el
  DOM** y por tanto primero al apilarse en móvil, que es donde de verdad se lee con una mano.
- **Derecha, `EN QUÉ ME BASO`:** lo que se ve, las causas con su patrón, lo que la foto no dice y
  las fuentes. Es material de consulta y su sitio es el segundo.
- **Los diagramas van en la columna izquierda a propósito.** Son la capa de resumen: el SVG dice
  "cada 4 días, 250 ml" de un golpe y el párrafo de la derecha explica por qué. Y de paso
  equilibran la masa de las dos columnas, que si no la izquierda acabaría media página antes.
- **La izquierda va `position: sticky`** mientras se lee la derecha, con
  `max-block-size: calc(100dvh - var(--space-7))` y `overflow: auto` para que nunca se coma la
  pantalla. Lo que hay que hacer se queda a la vista mientras lees por qué.
- **Qué se pliega y qué no — regla corregida.** Mi versión anterior decía "nada se pliega", y era
  demasiado gruesa. `builder` la aplicó mejor de lo que estaba escrita y su reparto es el correcto:

  | | Se pliega | Por qué |
  | --- | --- | --- |
  | `causa__resumen` — la afirmación | **no** | es lo que la ficha sostiene |
  | `PARA RECONOCERLA` — el patrón | **no** | es lo que necesitas **delante de la planta** |
  | `causa__detalle` — el razonamiento | **sí**, tras "Por qué" | es la segunda velocidad de lectura, y el rótulo lo dice |
  | `LO QUE SE VE` · `LO QUE LA FOTO NO DICE` | **no** | son las observaciones y los límites de lo que sabemos |

  **La regla real, que es la que quería decir: no se pliegan ni las afirmaciones ni los límites de
  lo que sabemos. El razonamiento sí puede.** Esconder "esto no lo podemos afirmar" decide por el
  lector que no le interesa; esconder el porqué detrás de un rótulo que dice "Por qué" no esconde
  nada, lo ordena.
- **Container query, no media query:** `@container etiqueta (min-width: 52rem)`. Por debajo se
  apila en una sola columna, acción arriba.

#### `PATRÓN PARA RECONOCERLA` es un elemento, no una frase en versalitas

Hoy va en mayúsculas dentro del mismo párrafo de la causa, y se pierde. **No es una afirmación más:
es una instrucción para mirar** — lo que hay que hacer con los ojos para distinguir esta causa de
la de al lado. Merece forma propia: bloque aparte, sangrado, con filete izquierdo en
`--color-borde-sutil`, rótulo en versalitas a `--texto-2xs` y el texto a `--texto-s`. Sin color:
no es alarma, es método.

Es la pieza que convierte un listado de causas en algo que se puede usar delante de la planta, y
ahora mismo es invisible.

### `HOY` — la franja del parte del día, con fecha real

Carlos pide que la web diga **qué hay que hacer hoy**. No es una pieza nueva: es subir de
categoría la franja que ya existe y que hoy cuenta severidades estáticas. Con `new Date()` en el
cliente, cero servidor, la franja pasa de decir *"3 de 7 piden mirada"* a decir qué toca.

#### La regla que lo gobierna, y es la misma que rige el contenido

> **La franja no dice nunca "hoy le toca" si nadie ha marcado nunca ese riego.**

Es la línea que este proyecto no cruza en el contenido —no se rellena a ojo— y no la va a cruzar
en la interacción. **Un contador que se cree más listo de lo que es miente peor que no tener
contador**, porque un dato ausente se detecta y un dato inventado no. Tres niveles de certeza, y
cada uno se dice con las palabras que le corresponden:

| Certeza | De dónde sale | Cómo se dice |
| --- | --- | --- |
| **Fecha dura** | `revisar_en` como fecha (helecho: 1 sep 2026) | *"Faltan 11 días para comprobar si el rebrote sale con entrenudos cortos"* |
| **Ritmo** | `dias_verano` / `dias_invierno` + la estación de hoy | *"Cada 4 días — última vez: sin registrar"* |
| **Vencimiento** | ritmo **+ una marca que alguien puso** | *"Le tocaba ayer"* |

La tercera fila **no existe** hasta que alguien marca. Y la ausencia se dice como ausencia
—`sin registrar`, en `--color-sin-dato`— exactamente igual que un campo sin verificar. La página
no cambia de estándar de honestidad porque el dato sea de uso en vez de botánico.

#### Lo que se calcula sin memoria ninguna

- **La estación**, y con ella qué columna de riego manda. En agosto, `dias_verano`. Es un cambio
  real de contenido que ocurre solo, sin que nadie edite nada, y es el mejor argumento de que la
  fecha sirve para algo.
- **Ventanas de abonado y trasplante**, si `botanist` da los meses. *"El trasplante de la begonia
  va tarde"* es una tarea de hoy, no un consejo de manual.
- **Días en casa** desde `fecha_llegada`: las cuatro de hoy están en aclimatación.
- **Plazos de revisión** desde `estados[].fecha_foto` hasta `revisar_en`.

#### La memoria: `localStorage`, **opcional**, y dicha en voz alta

> Ya no es un requisito. Con los tipos de tarea de `botanist` la franja es correcta **sin
> persistencia ninguna**: lo que tiene fecha se calcula y lo que no la tiene se dice como
> comprobación. `localStorage` queda como mejora — reanclar una cuenta cuando Noah riega en un día
> distinto al previsto —. Si no se implementa nunca, la función sigue siendo cierta.

Un control por planta, **`Regada hoy`**, dentro de la ficha —no en la franja: la franja informa,
la ficha es donde estás cuando riegas—. Al confirmarse, el rótulo pasa a pasado y a dato:
`Regada el 11 ago`. Verbo en la misma forma antes y después, que es la regla de siempre.

Y **una línea, una sola vez, al pie de la franja**: *"lo que marcas se guarda solo en este
navegador"*. No un aviso de cookies, no un modal: una frase en `--texto-xs`, `--color-sin-dato`.
El coste honesto es que la memoria no se sincroniza entre el móvil de Noah y el portátil de
Carlos, y eso se dice en vez de descubrirse.

#### Lo que esto NO es

**No es una app de tareas.** Sin notificaciones, sin rachas, sin porcentaje de cumplimiento, sin
felicitar a nadie por regar. Esta página se abre con prisa una vez cada quince días: lo que se
pide es que al abrirla sepas qué hacer hoy, no que te gestione la vida. Cualquier cosa que
premie abrir la web más a menudo está trabajando contra el uso real.

Y una consecuencia de forma: **la franja no crece.** Sigue siendo una franja de una o dos líneas.
Si un día hay siete tareas, dice el número y las dos primeras, y el resto están en sus fichas —que
es donde se hacen—.

#### Accesibilidad y motion

- La franja es `aria-live="polite"`: cuando el filtro o la marca cambian el recuento, quien usa
  lector de pantalla se entera.
- El control `Regada hoy` es un `<button>`, y su cambio de estado se anuncia por el propio texto
  del botón, no solo por un color o un icono.
- **Nada parpadea ni cuenta atrás en vivo.** Se calcula al cargar. Un número que se mueve solo en
  pantalla es exactamente lo que `prefers-reduced-motion` existe para apagar, y aquí no aporta:
  la diferencia entre "faltan 11 días" y "faltan 11 días" dentro de un minuto es ninguna.

#### Lo que hace falta de `botanist`

`revisar_en` es prosa (*"3 semanas: …"*) y para contar días hace falta una fecha. Se pide
`revisar_en_fecha` **además** del texto, no en su lugar: el texto dice *qué* mirar y eso no lo
sustituye una fecha. Y las ventanas de `abonado` y `trasplante` como meses, si son afirmables.
Donde no haya fecha, la franja se calla sobre esa planta — no estima.

### La etiqueta se despega y debajo hay un expediente — y hay que decirlo

`qa-visual` mide la ficha abierta: **4.801 px de alto, 51 párrafos seguidos**, en una página de
7.033. Y su diagnóstico es mejor que el número: *"la ficha cerrada es una etiqueta de vivero
disciplinada; la desplegada deja de ser una etiqueta y se convierte en un documento de texto. La
metáfora no aguanta 4.801 px."* Tiene razón, y es una decisión de dirección, no de maquetación.

**Pero la salida no es recortar.** Las trece observaciones visuales, las siete causas con su
patrón y la que descarta con evidencia negativa son lo que hace fiable la web. Cortarlas para que
la metáfora encaje sería subordinar el contenido a la ocurrencia, que es exactamente el fallo que
el brief prohíbe.

**La salida es admitir que la metáfora cambia al abrir, y decirlo en el diseño.**

> La ficha cerrada **es la pegatina**. Al despegarla no aparece el reverso de una pegatina —un
> reverso de pegatina no tiene 4.800 px—: aparece **el expediente de la planta**. Y un expediente
> se maqueta como un expediente: con secciones nombradas, con un índice y con recuento.

Eso no es rendirse: es que las plantas de vivero **tienen** expediente —pasaporte fitosanitario,
lote, productor, país— y la pegatina es su portada. La página pasa de imitar una etiqueta a imitar
la relación real entre una etiqueta y lo que hay detrás de ella.

#### Tres medidas, en este orden

**1. Las dos columnas semánticas** (§ anterior) recortan el alto casi a la mitad sin tocar una
palabra. Es la medida que más devuelve por menos.

**2. Un índice con recuento, dentro de la columna sticky de acción.** No para esconder: **para
entrar**.

```
QUÉ HACER ─────────────
  1. Sepárala del cristal
  2. Cámbiala de maceta ⚠
  3. …
  ▨ línea de hitos
─────────────────────────
EN EL EXPEDIENTE
  Lo que se ve ········ 13
  Causas probables ····  7
  Lo que la foto
    no dice ···········  6
  Fuentes ············· 24
```

**El recuento es información, no adorno.** «13 observaciones» y «24 fuentes» dicen algo verdadero
sobre esta ficha antes de leerla: que el diagnóstico está trabajado. Un índice de un documento que
oculta cuánto documento hay es un índice que engaña.

**3. Y una supresión de verdad, que es lo que faltaba.** En la ficha abierta, los campos que
muestran **diagrama + `detalle`** ya no repiten su `resumen`: el resumen existe para la rejilla
cerrada, donde es lo único que hay. Hoy se pinta dos veces la misma frase en la misma pantalla.
No se pierde nada y se van varios cientos de píxeles.

#### Lo que sigue sin plegarse, y por qué

Nada. Ni `LO QUE LA FOTO NO DICE`, ni los patrones, ni las causas. La regla se mantiene y ahora
tiene mejor argumento: **con dos columnas y un índice, esconder además sería cobrar dos veces por
la misma decisión.** Se ha resuelto el problema de navegación sin tocar el de honestidad, que era
justo lo que había que conseguir.

Y una línea que separa las dos cosas, por si vuelve la tentación: **plegar por longitud es
razonable; plegar los límites de lo que sabemos, no.** Un índice mueve al lector; un `<details>`
sobre "esto no lo podemos afirmar" decide por él que no le interesa.

### Las tareas no son todas del mismo tipo — y el riego no es una de calendario

`botanist` cierra el calendario con `tareas[].tipo`, conjunto cerrado de cinco, y ahí está la
decisión de diseño entera: **cada tipo permite decir una cosa distinta, y pintarlos todos igual
sería mentir en cuatro de los cinco.**

| Tipo | Cuántas | Qué se puede decir | Cómo se pinta |
| --- | --- | --- | --- |
| **`vencida`** | **1** — el trasplante de la begonia | *"debería haberse hecho hace 57 días"* | ver abajo: es la única con peso |
| `fecha` | 14 | *"faltan N días"*, *"hoy"* | texto normal, sin distintivo |
| `temporada` | 9 | *"toca este mes"* | texto normal |
| `condicionada` | 4 | **solo la condición**, nunca "hoy toca" | texto normal + la condición delante |
| `ritmo` | 7 — el riego | **nunca una fecha** | ver abajo |

#### El riego no puede llevar fecha, y esto es lo que más hay que respetar

`riego.ultimo` es `null` en las siete y `calculable: false`. Un intervalo sin día de partida no
produce un vencimiento: decir "hoy toca regar" desde "cada 4 días" es **inventarse el origen de la
cuenta**. Es el mismo caso que la mínima letal, y se resuelve igual — mejor un hueco honesto que
un número fabricado.

Pero `botanist` da algo mejor que un hueco: **`riego.disparador`**, una frase que es cierta todos
los días — *"comprobar que los 2 cm de arriba del sustrato están secos al meter el dedo"*. Esa
frase ocupa la casilla donde iba a ir la cuenta atrás. Y su argumento es el que cierra el asunto:

> **Una web que dice "comprueba" enseña a cuidar plantas; una que dice "riega hoy" solo da
> órdenes, y a los cuatro días se equivoca.**

Eso vale como principio general de esta interfaz y no solo para el riego. Donde el disparador
real sea una observación y no el calendario, **la interfaz pide mirar, no manda hacer.**

> **Nota sobre la fecha de ancla.** Con una fecha de partida y el intervalo, la aritmética daría
> todos los vencimientos: es cierto. Pero para el riego el disparador correcto **nunca es el
> calendario, es el sustrato**, así que un ancla exacta produciría un vencimiento aritméticamente
> impecable y agronómicamente falso — regar por calendario en una casa con aire acondicionado y
> sol de mañana es cómo se ahoga una planta. El ancla se usa donde el calendario **sí** manda
> (abonado, trasplante, revisión); en riego, no.

#### Una sola `vencida`, y el mismo problema de calibración que la severidad

`botanist` lo ve antes que yo: es idéntico al de la única `critica`. Si las catorce tareas con
fecha se pintan con urgencia, la única que de verdad va tarde no destaca.

Y hay algo mejor: **la `critica` es el helecho y la `vencida` es la begonia**, plantas distintas.
Son dos ejes independientes y tienen que leerse como tales, así que **no comparten registro
visual**:

- **`critica`** (helecho) → `--color-alerta` invertido y el filete rojo en el canto. Sigue siendo
  el único rojo de la página.
- **`vencida`** (begonia) → `--color-aviso` sobre `--color-aviso-relleno`, con el rótulo
  **`VA TARDE`** y el número de días. Sin rojo: no compite con el helecho, y una planta que
  necesita trasplante no está en el mismo apuro que una que se secó entera.
- Las otras catorce con fecha: **sin distintivo ninguno**. Es la misma economía que hace que las
  cuatro sanas no lleven insignia.

**El rótulo es `VA TARDE`, nunca "incumplido" ni "pendiente desde".** `vencida` significa *"tiene
fecha de referencia y ya pasó"*, no *"alguien lo ha hecho mal"* — y la fecha de referencia es
criterio de `botanist`, no norma de RHS, así que la interfaz no puede sonar a multa. Lo dice él y
tiene toda la razón: acusar al lector de una tarea que nadie le había dicho es la forma más rápida
de que cierre la página.

#### La condición gana al mes

Dos tareas —abonar y trasplantar el helecho— tienen el mes a favor y una condición en contra
(*"solo cuando tenga 3 o 4 frondes"*). **Si las dos cosas se contradicen, manda la condición y la
tarea no aparece como "toca este mes".** Abonar una planta sin hoja le quema las raíces: una tarea
condicionada mostrada porque el mes cuadra no sería inexacta, sería **consejo dañino**.

Regla para la franja: **`condicionada` nunca entra en la lista de "hoy"**. Aparece en su ficha, con
la condición delante y en forma de comprobación, igual que el riego.

#### Plazos relativos

La begonia lleva `revisar_fecha: null`, `revisar_dias: 21` y `revisar_desde: "el día en que la
cambies de maceta"`: su revisión cuenta desde el trasplante, no desde hoy, porque el trasplante es
lo que se está midiendo. Se pinta **relativo y con su origen** —*"tres semanas después de
cambiarla de maceta"*— y **nunca como fecha**. Es un solo caso, y pintado como fecha miente.

### Nombres de campo — el brief se sincroniza con el JSON, no al revés

`botanist` ha renombrado cosas y el brief tenía **rutas obsoletas apuntando a campos que ya no
existen**. Corregidas todas. Como `builder` maqueta leyendo esto, una ruta vieja aquí es un
`TypeError` silencioso allí — que es exactamente lo que pasó con `p.medidas.*` y costó los cuatro
diagramas.

| Antes (en este brief) | Ahora (en el JSON) |
| --- | --- |
| `estado.*` | **`estados[].*`** — es un **array** |
| `riego.profundidad_seco_cm` | `riego.profundidad_cm` |
| `luz.nivel_recibido_estimado` | `luz.nivel_actual` (con `luz.nivel_ideal`) |
| `luz.orientacion_ventana` | `luz.orientacion` |

**`estados` es un array y hoy todas las plantas tienen exactamente uno.** El diseño no lo va a
ignorar por eso: el distintivo de severidad toma **el peor** de los estados, y el bloque
`QUÉ LE PASA` se repite por estado con su propio `titulo` —que ya existe y es bueno: *"Podado a
ras tras secarse: un solo brote y ningún margen de error"*—. Diseñar para uno y romperse con dos
es la clase de deuda que se paga cuando nadie mira.

**Y dos campos nuevos que sí cambian cosas:**

- **`estados[].revisar_fecha`** existe además de `revisar_en`. La fecha se usa para contar días; la
  prosa **no se sustituye por ella**, porque dice *qué mirar* y describe **dos formas distintas de
  fracasar y cómo distinguirlas**. Eso no lo reemplaza un `2026-09-01`. Van los dos: la fecha en la
  franja `HOY`, la prosa en el expediente.
- **`tareas[].prioridad`** (1, 2, 3). Es el orden dentro de una planta, no una cuarta escala de
  urgencia: **no se pinta con color ni con distintivo**, solo ordena la lista. La única jerarquía
  cromática de tareas sigue siendo `VA TARDE`.
- **`riego.ancla_tipo: "sin_dato"`** y `calculable: false` en las siete: el JSON dice explícitamente
  que el riego no es calculable. La casilla la ocupa `riego.disparador`, ya especificado.

### El bloque crítico no puede ir invertido — y ya no es un problema de contraste

`builder` arregló el 1,19:1 y lo hizo bien: el bloque de la crítica va sobre `--color-alerta`
sólido y **enumeró catorce selectores** para que todo su texto sea blanco. Medido: 0 nodos por
debajo de AA. El fallo está cerrado.

**Y aun así el patrón tiene que salir**, por tres razones que no son el contraste medido.

**1. Es frágil por construcción, y su propio comentario lo dice.** `builder` escribió al lado:
*"cualquier color que se añada aquí dentro tiene que entrar en esta lista"*. Eso es la definición
de una deuda: invertir un contenedor obliga a enumerar cada descendiente, y el día que alguien
añada uno y no lo apunte, desaparece. **Ya pasó una vez** — de ahí salieron los 1,19:1. Y lo que
viene son justo elementos nuevos ahí dentro: `PATRÓN PARA RECONOCERLA`, la nota de manejo, las
fuentes citadas, el índice del expediente.

**2. Sobre el rojo sólido no hay ni un token del sistema que se lea. Ninguno.**

| Sobre `--color-alerta` sólido | | Sobre `--color-alerta-relleno` | |
| --- | --- | --- | --- |
| `--texto-fuente` (los 24 enlaces) | **1,22** ✗ | `--texto-fuente` | 8,14 ✓ |
| `--texto-secundario` | **1,19** ✗ | `--texto-secundario` | 5,61 ✓ |
| `--texto-meta` | **1,17** ✗ | `--texto-meta` | 5,67 ✓ |
| `--texto-principal` | **1,74** ✗ | `--texto-principal` | 11,57 ✓ |
| `--color-sin-dato` | **1,27** ✗ | `--color-sin-dato` | 5,26 ✓ |
| `--color-aviso` (`VA TARDE`) | **1,32** ✗ | `--color-aviso` | 5,04 ✓ |
| solo el blanco | 7,43 ✓ | | |

**Seis de seis fallan a un lado; cinco de cinco pasan al otro y sin enumerar nada.** Un contenedor
donde solo un color del sistema es válido no es un contenedor: es una excepción con forma de
bloque. Y los enlaces de fuentes en azul sobre rojo, además de ilegibles, son el par que peor
funciona para quien no distingue rojo y verde.

**3. Gasta justo lo que el sistema declara escaso.** Toda la paleta se sostiene sobre una frase:
**el color significa "haz algo hoy"**, y por eso hay un solo rojo en la página. Un bloque rojo de
varios miles de píxeles no es un acento escaso: es el fondo dominante de la ficha más larga. La
decisión que hacía que el filete del helecho se viera desde el otro lado del monitor se anula sola
si al abrirlo el rojo lo ocupa todo.

**Corrección:** el bloque `QUÉ LE PASA` de una crítica va en `--fondo-critica` (relleno pálido)
con tinta normal, y **solo el distintivo** —el chip `!! CRÍTICA` y el filete del canto— va en
`--fondo-distintivo-critica` con `--texto-sobre-alerta`. Los catorce selectores enumerados
desaparecen: sobre el pálido todo hereda bien y no hay lista que mantener.

Sigue habiendo un solo rojo en la página, y sigue viéndose desde lejos. Pero ocupa el tamaño de un
distintivo, que es lo que un distintivo es.

### Estados degradados — qué se dibuja cuando falta el dato

Regla, y es de honestidad, no de estética: **cuando falta un dato se dibuja el marco con el hueco
marcado y el texto dice "sin dato".** Nunca se oculta el diagrama, porque ocultarlo hace creer que
no había nada que saber; y nunca se estima, porque fingir precisión es peor que no tenerla.
La propuesta de `builder` es correcta y queda aprobada tal cual.

- El hueco se pinta con `--trama-sin-dato` (trama diagonal) sobre `--color-sin-dato-relleno`, y el
  rótulo va en `--color-sin-dato`. **Ese gris no es un color de estado**: es la ausencia de estado.
- Nunca se usa verde para "no hay dato". Verde diría "está bien", y no lo sabemos.
- El eje, la escala y los rótulos se dibujan siempre: son la mitad de la información.

### Toxicidad para mascotas — tres estados, y ninguno es verde

`botanist` avisa de algo que el diseño tenía que corregir: **no hay ni una sola planta con
"no tóxica" confirmada**. Un distintivo verde/rojo mentiría en cinco de las siete fichas.

**Y el rojo de alarma sale de aquí.** `meta.contexto` dice que **no hay mascotas en casa**, así
que la toxicidad es un dato informativo, no una urgencia. Pintarla en `--color-alerta` la habría
puesto al mismo nivel visual que el helecho, que sí se está muriendo ahora mismo, y con una sola
planta crítica en toda la web ese ruido se la come. En este sistema **el color significa "haz algo
hoy"**, y una planta tóxica en una casa sin gato no lo es. El dato se ve entero; lo que no se
gasta es la alarma.

| Estado | Quién | Tratamiento visual | Texto obligatorio |
| --- | --- | --- | --- |
| `toxica` | begonia, poto, margarita | `--texto-principal` sobre `--fondo-hundido`, **borde sólido**, icono de alerta, la palabra `TÓXICA` | "Tóxica para gatos y perros — ASPCA" + enlace |
| `sin datos` | los dos coleos, ficus | `--color-sin-dato` sobre `--color-sin-dato-relleno`, **borde discontinuo**, icono `?` | "**Sin datos** en ASPCA para esta especie. No significa que sea segura: significa que nadie la ha evaluado" |
| `sin identificar` | helecho (`toxicidad_mascotas: null`) | `--trama-sin-dato`, mismo gris, icono `?` | "Especie sin identificar: no se puede valorar" |

Los tres se distinguen por **forma de borde e icono además de color**, así que en escala de grises
siguen siendo tres cosas distintas. La frase "no significa que sea segura" es literal y no se
abrevia: es información de seguridad.

**Son dos campos, no uno.** El JSON trae `toxicidad_mascotas.gatos` y `.perros` por separado. Hoy
coinciden en las siete, pero el esquema permite que diverjan, así que se pintan **los dos** y el
distintivo toma el peor de ambos. Un badge único que promedie dos animales es un badge que miente
el día que la fuente los separe.

### Severidad — tres escalones, y el de arriba tiene que ganar

Distribución real: **1 crítica** (helecho), **2 atención** (begonia, coleo grande), **4 sanas**.
Con una sola crítica, el riesgo que señala `botanist` es real: si `atencion` grita, `critica` no
destaca. Se resuelve con **peso**, no con más color:

| | Distintivo | Ficha | Refuerzo no cromático |
| --- | --- | --- | --- |
| `sana` | **ninguno** | sin marca | — |
| `atencion` | texto `--color-aviso` sobre `--color-aviso-relleno`, sin borde | sin marca | la palabra `ATENCIÓN` |
| `critica` | **invertido**: `--color-etiqueta` sobre `--color-alerta` sólido (7,43:1) | filete de `--filete-severidad` en `--color-alerta` en el canto izquierdo | la palabra `CRÍTICA` + posición primera |

El salto de "texto de color" a "bloque sólido invertido" es un escalón mucho mayor que el de un
ocre a un rojo, y funciona igual en escala de grises. Sana no lleva distintivo: cuatro insignias
verdes de "todo bien" son ruido justo alrededor de lo urgente.

### "Lo que la foto no dice" — el campo que no esperaba y que hay que enseñar

`botanist` ha metido en `estados[]` un campo que yo no había pedido y que es lo mejor del JSON:
**`no_visible_en_foto`**, la lista de lo que el diagnóstico **no** puede afirmar. En el helecho son
cinco cosas, y la primera es la identificación de la especie.

Eso no se esconde en un `detalle` plegado. Va **dentro del bloque de diagnóstico**, debajo de las
señales y las causas, bajo el rótulo `LO QUE LA FOTO NO DICE`, en `--texto-secundario`, como lista.
Es la misma idea que hace que las fuentes citadas no sean letra pequeña: **decir hasta dónde llega
lo que sabes es parte de saberlo**, y es lo que separa esta web de cualquier buscador de síntomas.

En la ficha del helecho ese bloque será más largo que el diagnóstico. Está bien que lo sea.

### La ficha diagnostica un momento, no el presente

`estados[0]` describe lo que se veía el `fecha_foto`, no lo de hoy. Si no se dice, en tres semanas la
ficha estará afirmando algo falso. Por eso **la fecha va pegada al diagnóstico**, en
`--fuente-dato`, dentro del mismo bloque y no al pie: *"observado el 11 ago 2026"*. Y el SVG 4
arranca su línea de tiempo en esa fecha, no en "hoy".

### La capa personal está vacía hoy — y eso es un problema de contenido, no de diseño

> **Actualización: la capa ya existe.** Carlos ha contado el origen de las siete — el poto lleva
> más de veinte años en la familia, el helecho y la begonia son dos regalos del mismo día de mayo,
> y las otras cuatro se compraron hoy en Projardín. La tesis del diseño deja de ser una promesa.
> Lo de abajo se mantiene como regla de construcción, porque el panel debe seguir siendo
> condicional: no todas las plantas tendrán siempre nota, y un hueco decorado sigue siendo peor
> que un hueco ausente.

`historia` y `notas_carlos` estaban a `null` en las siete cuando escribí esto. Dos consecuencias,
y las mantengo:

1. **El panel de cuaderno se renderiza solo si hay contenido.** Nada de siete huecos vacíos ni de
   placeholders tipo "aún no hay notas", que es decorar una ausencia.
2. **Es el mayor riesgo del entregable**, y hay que decirlo claro: la tesis de este diseño es que
   la web mezcla datos verificados con la voz de una persona, y hoy la segunda capa no existe.
   Sin ella queda una ficha de cuidados correcta y bonita, pero igual a otras. **Basta con siete
   frases de Carlos** —una por planta, de dónde vino o qué ha aprendido fallando— para que la
   mitad de la dirección visual empiece a existir. Es una pregunta para él, y merece hacerse.

### Las fotos de etiqueta: dentro, y como prueba

Decisión: **entran en la interfaz** (`*-etiqueta.jpg`, 675×900, cinco de siete), pero
**solo en el bloque de procedencia de la ficha abierta**, a `--ancho-prueba`, bajo el rótulo
`LA PRUEBA`, junto a las fuentes citadas. Nunca en la rejilla cerrada y nunca cerca de la cabecera.

Por qué no se quedan fuera: para cinco de las siete plantas, la pegatina **es la fuente más fuerte
que existe** de qué compró Carlos — más que POWO, que dice qué es una especie pero no qué hay en
ese tiesto. El brief exige que la procedencia sea contenido visible; esto es exactamente eso.
Y explica por qué dos plantas no la tienen.

El riesgo de que la foto le coma la escena a la etiqueta dibujada es real y se desactiva por
separación, no por filtros: la reconstruida ocupa la cabecera a ancho completo, la foto vive
abajo a `--ancho-prueba` y en otro contexto de lectura. **No se estiliza**: sin duotono, sin
recorte artístico, sin sombra. Es una prueba documental, y una prueba retocada no prueba nada.
`aspect-ratio: var(--aspecto-foto)` (3/4) sirve para las doce imágenes, así que no hay desajuste.

`helecho` y `poto` no tienen etiqueta. En su bloque de procedencia va la frase
"Sin etiqueta de vivero: no se conserva", en `--color-sin-dato`. La ausencia se dice, no se tapa.

### "Recién llegada" no es un cuarto estado — es una fecha, y ya tiene sitio

La pregunta era si "recién llegada / en aclimatación" necesita entrar en el sistema de severidad.
**No, y añadirlo habría sido el error.** Severidad es un eje —cómo está— y esto es otro —desde
cuándo—. Meterlos en la misma escala fuerza a leer un cuarto escalón que no compite con los otros
tres: una planta puede estar sana y recién llegada, o llevar veinte años y estar crítica.

Y resulta que el segundo eje **ya está dibujado**: es la signature. La cronología real es

| | Cuándo llegó | Qué dice su etiqueta |
| --- | --- | --- |
| coleo pequeño, coleo grande, ficus, margarita | **hoy**, Viveros Projardín | pegatina con precio y fecha |
| begonia | mayo, regalo | pegatina, aún en su maceta de vivero |
| helecho | mayo, regalo | **sin pegatina** |
| poto | hace **más de veinte años** | **sin pegatina** |

O sea: **la ausencia de etiqueta no es un hueco, es antigüedad.** Es lo contrario de un dato que
falta. Eso cambia el bloque de procedencia, que pasa de "aquí no hay nada" a decir la única cosa
que importa de esa planta:

```
coleo grande   LA PRUEBA   [foto pegatina]  Projardín · hoy · 2,25 €
poto           LA PRUEBA   Sin etiqueta de vivero: no hay trazabilidad comercial de una
                           planta que lleva más de veinte años en la familia.
helecho        LA PRUEBA   Sin etiqueta de vivero: no se compró, se regaló. En casa desde
                           el 29 de mayo de 2026, y rescatado de una desecación.
```

Y "en aclimatación" es **una línea que se calcula de una fecha**, no un estado: se muestra
mientras `fecha_llegada` esté a menos de tres semanas, en `--texto-secundario`, dentro de ese
mismo bloque. En dos semanas será falsa y desaparecerá sola sin que nadie toque una línea de CSS,
que era la condición. Cero tokens nuevos, cero colores nuevos, cero escalones nuevos.

**Y lo que el diseño no va a hacer:** las dos plantas tocadas son las dos que le regalaron, y las
cuatro que compró hoy están impecables. Es el hallazgo que más se parece a lo que el brief pedía
cuando decía que el diseño debía "notar" la mezcla de las dos capas. **No se subraya.** No hay
rótulo, ni agrupación, ni nota al pie que diga "qué casualidad". El trabajo del diseño es poner el
origen y el estado en el mismo golpe de vista —y en la ficha están a dos centímetros— para que
quien lo vea lo vea solo. Señalarlo con el dedo lo convertiría en una gracia; dejarlo callado lo
deja siendo lo que es.

Si hay una ficha que mirar con lupa cuando lleguen las capturas, es la del helecho: es a la vez la
más urgente y la más personal, y es el único sitio donde las dos capas se tocan de verdad.

### La etiqueta cuando no hay etiqueta

`helecho` y `poto` necesitan la variante de la signature, porque el sistema es la etiqueta y no
puede haber dos fichas construidas de otra forma. La pegatina se dibuja igual, pero **imprime lo
que sabe**:

```
┌─ ETIQUETA ───────────────┐          ┌─ ETIQUETA · sin vivero ──┐
│ VIVEROS PROJARDIN        │          │ SIN ETIQUETA DE VIVERO   │  ← microlínea sustituida
│ Avda. de Móstoles s/n    │          │                          │
│ C O L E O                │   vs.    │ H E L E C H O            │  ← idéntico, y solo el nombre
│ ‹nombre científico›      │          │ especie sin identificar  │  ← el estado baja aquí
│ ▌▌▎▌▎▌▌▎▌      2,25€     │          │ Regalo del 29 de mayo.   │  ← NI trama NI raya:
│ CÓD. 2040 2174           │          │ Rescatado de una         │     el texto de procedencia
│ P.FITOSANITARIO ES13-28… │          │ desecación.              │     ocupa ese espacio
└──────────────────────────┘          └──────────────────────────┘
```

⚠ **Corregido tras ver la ficha renderizada.** La versión anterior de este wireframe ponía trama
de sin-dato en las barras y una raya en el precio. Está mal: la trama significa "no lo sabemos" y
que el helecho no traiga pegatina es un hecho conocido, no una laguna. Ver
§ "Corrección tras ver la ficha del helecho renderizada".

El nombre —que es lo que se busca con prisa— se imprime idéntico en las siete. Lo que cambia es
solo el bloque de procedencia, que es justo el dato que falta. La raya `—` es un carácter, no un
hueco en blanco: dice "no hay precio", no "se nos olvidó".

⚠ El precio, el EAN y el nº fitosanitario son **transcripción de una foto**, no dato verificado en
fuente: van al JSON con `fuente: "observación de foto"` y `url: null`. Y el nº fitosanitario es
del **vivero**, no de la planta — el ficus y el coleo grande comparten el mismo. No se puede usar
como identificador.

### Lo que le toca a `builder` en `prefers-reduced-motion`

Los tokens bajan las duraciones solos, pero **eso no cierra el tema**, y conviene que quede
escrito para que nadie lo dé por resuelto. En `app.css` hace falta además:

- Sustituir `transform` por `opacity` en el despegue de la etiqueta y en la entrada de las fichas.
- **No lanzar** las animaciones de un solo disparo: el trazado del SVG 4 y el secado del SVG 1 se
  pintan directamente en su estado final (`--recorrido: 1`, `--frente-humedo` a su valor), en vez
  de animarse en 1 ms, que produce un parpadeo.
- Quitar el latido del hito de hoy y el escalonado de los siete marcadores del SVG 5.

Cada versión reducida está definida en la tabla de arriba. No hay que inventar ninguna.

### Cuerpos mínimos — dónde no puede ir un dato

`--texto-3xs` (11 px) existe **solo** para metadato de la pegatina: nº fitosanitario, microlínea
del vivero, dígitos del EAN. **Ningún dato que Carlos necesite leer con prisa puede vivir ahí.**
Los resúmenes de riego, luz y temperatura van a `--texto-s` como mínimo, y el resumen de riego de
la rejilla cerrada a `--texto-m`. Si un resumen acaba en 11 px, es un error, no una variante.

### "Funciona sin JS" — lo que quise decir, dicho bien

`builder` tiene razón y la frase original del brief era incorrecta. La ficha se renderiza desde
`content/plantas.json` con `fetch`, que es la regla dura de `CLAUDE.md`, así que **sin JS no hay
página**. Lo que sí es cierto, y es lo que buscaba, es esto:

> **El abrir y cerrar la ficha no lleva ni una línea de JS.** Es `<details>`/`<summary>` nativo,
> con su foco, su Enter/Espacio y su semántica de estado gratis y correctos.

Y de ahí sale una exigencia real, no una frase bonita: **ningún comportamiento que el navegador ya
sepa hacer se reimplementa en JS.** El JS carga los datos, ordena, busca y filtra. No gestiona
apertura, ni foco, ni teclado. Si un componente necesita `tabindex` o `role`, es que se eligió el
elemento equivocado.

### Motion

Duraciones: `--dur-instante 80ms` (foco, marca) · `--dur-corta 160ms` (hover, filtros) ·
`--dur-media 260ms` (despegar la etiqueta) · `--dur-larga 420ms` (reordenar la rejilla) ·
`--dur-dibujo 900ms` (los SVG que se trazan).
Curvas: `--ease-salida cubic-bezier(.2,.8,.25,1)` · `--ease-entrada cubic-bezier(.4,0,1,1)` ·
`--ease-estandar cubic-bezier(.4,0,.2,1)` · `--ease-troquel cubic-bezier(.34,1.28,.64,1)`, el
rebote mínimo del despegue, y **solo** ahí.
Con `reduce`, `--dur-*` no se ponen a cero: bajan a 1 ms las que desplazan y se conservan las de
opacidad. Está resuelto en `tokens.css` con un bloque `@media`, así `builder` no tiene que
acordarse en cada componente.

### Restricción anti-genérico

El skill `frontend-design` identifica los tres clichés en los que cae la IA. Están **prohibidos**
salvo justificación explícita:

1. Fondo crema (~`#F4F1EA`) + serif de alto contraste + acento terracota.
2. Fondo casi negro + un único acento verde ácido o vermellón.
3. Layout tipo periódico: filetes hairline, `border-radius: 0`, columnas densas.

Y el cliché específico de este dominio: **verde salvia sobre blanco con fotos de monstera**.
Es exactamente lo que produciría cualquier generador para "web de plantas". No es una elección.

El material del que salen las buenas decisiones es el mundo del sujeto: la vernácula de vivero,
las etiquetas de plástico clavadas en el sustrato, los diagramas botánicos del siglo XIX,
los cuadernos de campo, las escalas de riego. Ahí hay dirección de arte de verdad.

### Auto-crítica de la dirección propuesta

Pasada por los cuatro clichés, honestamente:

1. **Crema + serif de alto contraste + terracota.** El fondo no es crema: es teja saturada
   `#8F4A33`, y es el **campo** de la página, no un acento. No hay ninguna serif en el proyecto.
   Riesgo residual: la teja pertenece a la familia terracota. Se acepta porque es el color medido
   del plástico del tiesto real, no una elección de humor.
2. **Casi negro + un acento ácido.** No hay fondo oscuro y hay seis colores en uso, no uno.
3. **Periódico: filetes hairline, radio 0, columnas densas.** El radio no es 0, es el troquel de
   3 px de una pegatina; el registro no es editorial sino señalética de retail; y la rejilla es de
   tarjetas, no de columnas de texto.
4. **Verde salvia sobre blanco con monsteras.** No hay salvia en la paleta, el verde que hay es
   verde botella oscuro y se usa como **tinta**, no como fondo. Y en la rejilla cerrada **no hay
   fotos de hojas**: hay etiquetas de precio.

Prueba del algodón: si me dieran el encargo "web de plantas" sin las fotos de `docs/plants/`,
no habría llegado a `P. FITOSANITARIO Nº ES13-28/0283F` ni a un precio de 2,25 € como elemento
tipográfico. La dirección depende de este material concreto, que es la definición de no ser
un default.

**El riesgo asumido:** un fondo de página en teja saturada es incómodo y mucha gente no lo
haría. Se sostiene porque las fichas son blancas y todo el texto largo vive sobre blanco: el
color agresivo ocupa los huecos, nunca la lectura.

> **Verificado en pantalla, y en el ancho donde yo decía que era peor.** `qa-visual` revisó los
> 320 px expresamente: *"la teja no agobia; con el `h1` en dos líneas y los chips en tres filas la
> proporción queda cómoda, el fondo respira y la ficha domina igual"*. Y aporta el motivo, que yo
> no había previsto: **la franja del parte del día, al ser una banda blanca a sangre, corta el
> terracota justo donde empezaba a pesar**. No hace falta apretar `--hueco-rejilla`, que era el
> plan de contingencia acordado con el lead.
>
> Donde el riesgo **sí** se cobró fue en un sitio que nadie había mirado: con una ficha desplegada
> quedaban ~850 × 480 px de teja continua. Ahí la frase "ocupa los huecos, nunca la lectura" dejaba
> de ser cierta, y por eso la rejilla colapsa a una columna en modo ficha. La declaración de riesgo
> sirvió para saber **dónde** mirar; no para acertar a la primera.

## Fases

| Fase | Qué | Quién |
| ---- | --- | ----- |
| 0 | Activar Agent Teams, instalar skills | Carlos + lead |
| 1 | Crear los skills que no existen (`vanilla-web-craft`, `plant-expert`) | lead con `skill-creator` |
| 2 | Rellenar `docs/inventario.md` | Carlos |
| 3 | Dirección visual (plan mode, requiere aprobación) ‖ contenido verificado | `ux-lead` ‖ `botanist` |
| 4 | Construcción | `builder` |
| 5 | QA visual, a11y, rendimiento — en bucle | `qa-visual` |

Fases 3 en paralelo: diseño y contenido son independientes y es el caso de uso donde
los Agent Teams lucen. `builder` arranca cuando hay tokens y hay JSON.

## Notas de aprendizaje de Agent Teams

Ir apuntando aquí lo que se observa, que es la mitad del objetivo del proyecto:

- Qué reparto de tareas funcionó y cuál generó conflictos.
- **El reparto de ficheros no cubre los recursos de ejecución.** `CLAUDE.md` evita que dos agentes
  se pisen editando, pero no dice nada del navegador: el MCP de Playwright usa un perfil único de
  Chrome, así que mientras `builder` previsualizaba, `qa-visual` no podía navegar — y yo tampoco
  pude medir el desbordamiento de 320 px cuando quise. Se resolvió construyendo `tests/runner.py`,
  que no depende del MCP. Un problema de coordinación que produjo la herramienta más reutilizable
  del proyecto.
- **Un dato deducido por el lead entró en el JSON como si viniera del cliente** (la orientación NE
  y el "sin sol directo"), y solo se detectó porque el reparto obligaba a que el dato y el fichero
  estuvieran en manos distintas y hubo un tercero que se negó a elegir entre dos fuentes. Un solo
  agente con las dos cosas en la cabeza habría cerrado la contradicción sin enterarse de que
  existía.
- **Los mensajes cruzados costaron cuatro turnos** de demostrar que algo ya estaba hecho. Se
  corrigió con dos hábitos: el lead comprueba `grep -n "^### " docs/brief.md` antes de encargar, y
  los informes dan **líneas exactas** en vez de nombres de sección.
- Cuándo el lead se puso a implementar en vez de esperar a los teammates.
- Si los teammates marcaron sus tareas como completadas o se quedaron colgadas.
- Coste en tokens frente a hacerlo en una sola sesión.
