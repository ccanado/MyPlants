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

| Nombre | Hex | Qué es en el mundo real | Dónde se usa |
| --- | --- | --- | --- |
| **Maceta** | `#8F4A33` | El plástico teja del tiesto del coleo | Fondo de página. Nunca lleva texto que no sea blanco |
| **Tinta** | `#16342A` | El verde botella del tiesto del ficus | Tinta principal: todo el texto sobre la etiqueta |
| **Etiqueta** | `#FBFAF7` | El blanco satinado de la pegatina térmica | Superficie de las fichas, franjas y paneles |
| **Bolígrafo** | `#1F3F97` | El azul del recuadro `PLANT PASSPORT` de la begonia | **Solo la capa de Carlos** y los enlaces a fuentes |
| **Alarma** | `#A4161A` | El rojo del tiesto de la begonia, saturado a señal | Severidad `critica` |
| **Aviso** | `#8C5A05` | El ocre de la tierra seca en el borde del cepellón | Severidad `atencion` |

Derivados que también viven en tokens (no son decisiones nuevas, son la misma paleta):
`--color-tinta-suave #4A6357` (texto secundario), `--color-codigo #5E7066` (mono de metadatos),
`--color-borde #918A7B` (bordes informativos), `--color-cuaderno #EEF1FA` (papel del panel de
Carlos), rellenos pálidos de alarma/aviso, y las dos caras del plástico
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
| Código sobre Etiqueta | **5,05** | 4,5 | ✅ (cuerpo 11 px, por eso se mide como texto normal) |
| Bolígrafo sobre Etiqueta | **9,08** | 4,5 | ✅ |
| Bolígrafo sobre Cuaderno | **8,77** | 4,5 | ✅ |
| Alarma sobre Etiqueta | **7,43** | 4,5 | ✅ |
| Alarma sobre relleno-alarma `#FBEAE8` | **6,66** | 4,5 | ✅ |
| Aviso sobre Etiqueta | **5,62** | 4,5 | ✅ |
| Aviso sobre relleno-aviso `#FCF2DC` | **5,27** | 4,5 | ✅ |
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

**Tarea pendiente (no bloquea a `builder`):** los tres `woff2` no están en el repo. Hay que
descargar y subsetear a latín + `áéíóúüñ¿¡€°·`. Hasta entonces `tokens.css` ya declara las
pilas completas con el fallback delante en la cascada de `font-family`, así que **la web se ve
bien hoy, sin un solo fichero de fuente**. Cuando lleguen, se añaden los `@font-face` y no se
toca nada más.

**Escala tipográfica.** Base 17 px (`1.0625rem`) — deliberadamente no 16, para que el texto
corrido de la ficha se lea de un vistazo con la regadera en la mano. Todo en `rem`, nunca `px`.
`--texto-3xs` 11 px · `2xs` 12 · `xs` 13 · `s` 15 · `m` 17 (base) · `l` 20 · `xl` 24 · `2xl` 32,
más dos escalones fluidos: `--texto-etiqueta` `clamp(2.25rem, 7cqi, 3.75rem)` (el nombre de la
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
- Las plantas con `estado.severidad != sana` van **las primeras** en el DOM. El orden es
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

### Los cinco SVG explicativos

Regla que los gobierna a todos, y es eliminatoria: **si el SVG se puede borrar sin perder
información, es decoración y se borra**. El dato va siempre también en texto, al lado, y el SVG
lleva `role="img"` con `<title>`/`<desc>`, o `aria-hidden="true"` cuando el texto contiguo ya lo
dice todo. Sin librerías: SVG en línea + CSS, y `@property` para animar valores numéricos.
**Nada arranca solo y nada va en bucle infinito.**

**Se dibujan sobre los datos que existen de verdad.** `botanist` confirmó los ejes numéricos
reales del JSON, y los cinco diagramas se han reescrito para usarlos. Un diagrama de centímetros
de profundidad o de metros hasta la ventana habría sido precisión fingida: esos datos no los
tiene nadie, y `CLAUDE.md` prohíbe rellenarlos a ojo.

| # | SVG | Campo del JSON que consume | Qué dato explica | Animación completa | Versión reducida (obligatoria) |
| --- | --- | --- | --- | --- | --- |
| 1 | **El reloj de riego** — corte vertical del tiesto | `riego.dias_verano` · `riego.dias_invierno` (2–10 días) | Cada cuánto se riega, y cuánto cambia de verano a invierno — que es lo que de verdad se falla | El sustrato se seca de arriba abajo a lo largo del intervalo (`--frente-humedo`), 900 ms, **una vez** al despegar la ficha | Sustrato ya dibujado en su estado final; 120 ms de opacidad. Sin gota |
| 2 | **La escala de luz** — cinco escalones rotulados | `luz.nivel` (entero 1–5; el set real va de 2 a 5) | En cuál de los cinco escalones vive esta planta, de sombra a pleno sol | El escalón de esta planta se rellena de izquierda a derecha, 260 ms | Escalón ya relleno, solo opacidad |
| 3 | **Rango térmico** — eje de 0 a 40 °C | `temperatura.min_c` · `max_c` (el set real va de 7 a 30 °C) | La banda que aguanta y dónde empieza a sufrir | La banda crece desde `min_c` hacia `max_c`, 260 ms | Banda completa, solo opacidad |
| 4 | **Curso de recuperación** — línea de tiempo | `estado.tratamiento[]` · `estado.revisar_en` · `estado.fecha_foto` | Solo en las 3 plantas tocadas: de la fecha del diagnóstico a la revisión, con cada paso y la señal observable de cada hito | La línea se traza de izquierda a derecha (`--recorrido`, 900 ms) y el hito de hoy late **una sola vez** | Línea completa desde el principio, sin latido |
| 5 | **El calendario del domingo** — eje compartido de 2 a 10 días | `riego.dias_verano` de **las siete** | Cuál toca antes. Es la respuesta a "voy a regar y no me acuerdo de a cuál", que es el trabajo primario de la página | Los siete marcadores entran escalonados, 160 ms + `--retardo-*` | Los siete ya en su sitio, sin escalonar |

Redundancia textual obligatoria, por SVG: (1) "cada 4 días en verano, cada 9 en invierno";
(2) "luz indirecta brillante — nivel 3 de 5"; (3) "7–30 °C"; (4) el mismo tratamiento como `<ol>`
numerado, del que el SVG es una segunda vista; (5) cada marcador es un `<button>` real con nombre
accesible ("Poto — cada 7 días"), así que el diagrama es una vista redundante de una lista que ya
funciona sin él.

`prefers-reduced-motion: reduce` no apaga: **cambia de versión**. Y el diagrama 4, que es el que
más importa, es legible entero sin una sola animación.

> **El plano de casa queda aparcado, no descartado.** Era el SVG 5 original y sigue siendo la
> mejor vía para "¿cuál es la del baño?", pero necesita `ubicacion.habitacion` de las siete y hoy
> `docs/inventario.md` está vacío. **Es una pregunta para Carlos, no para `botanist`**: RHS no
> sabe dónde está su tiesto. En cuanto haya habitaciones lo recupero como sexto diagrama. Mientras
> tanto, el calendario del domingo ocupa ese hueco y usa datos que sí existen.

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

| Estado | Quién | Tratamiento visual | Texto obligatorio |
| --- | --- | --- | --- |
| `toxica` | begonia, poto, margarita | `--color-alerta` sobre `--color-alerta-relleno`, borde sólido, icono de alerta | "Tóxica para gatos y perros — ASPCA" + enlace |
| `sin_datos_aspca` | los dos coleos, ficus | `--color-sin-dato` sobre `--color-sin-dato-relleno`, borde discontinuo, icono `?` | "**Sin datos** en ASPCA para esta especie. No significa que sea segura" |
| `sin_identificar` | helecho | `--trama-sin-dato`, mismo gris, icono `?` | "Especie sin identificar: no se puede valorar" |

Los tres se distinguen por **forma de borde e icono además de color**, así que en escala de grises
siguen siendo tres cosas distintas. La frase "no significa que sea segura" es literal y no se
abrevia: es información de seguridad.

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

### La ficha diagnostica un momento, no el presente

`estado` describe lo que se veía el `fecha_foto`, no lo de hoy. Si no se dice, en tres semanas la
ficha estará afirmando algo falso. Por eso **la fecha va pegada al diagnóstico**, en
`--fuente-dato`, dentro del mismo bloque y no al pie: *"observado el 11 ago 2026"*. Y el SVG 4
arranca su línea de tiempo en esa fecha, no en "hoy".

### La capa personal está vacía hoy — y eso es un problema de contenido, no de diseño

`historia` y `notas_carlos` están a `null` en las siete: Carlos no las ha contado todavía. Dos
consecuencias, y las asumo:

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

### La etiqueta cuando no hay etiqueta

`helecho` y `poto` necesitan la variante de la signature, porque el sistema es la etiqueta y no
puede haber dos fichas construidas de otra forma. La pegatina se dibuja igual, pero **imprime lo
que sabe**:

```
┌─ ETIQUETA ───────────────┐          ┌─ ETIQUETA · sin vivero ──┐
│ VIVEROS PROJARDIN        │          │ SIN ETIQUETA DE VIVERO   │  ← microlínea sustituida
│ Avda. de Móstoles s/n    │          │ procedencia sin registrar│
│ C O L E O                │   vs.    │ H E L E C H O            │  ← idéntico
│ ‹nombre científico›      │          │ ‹nombre científico›      │
│ ▌▌▎▌▎▌▌▎▌      2,25€     │          │ ░░ trama sin dato ░  —   │  ← barras → trama, precio → raya
│ P.FITOSANITARIO ES13-28… │          │ ░░░░░░░░░░░░░░░░░░░░░░░  │
└──────────────────────────┘          └──────────────────────────┘
```

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
- Cuándo el lead se puso a implementar en vez de esperar a los teammates.
- Si los teammates marcaron sus tareas como completadas o se quedaron colgadas.
- Coste en tokens frente a hacerlo en una sola sesión.
