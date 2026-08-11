# Plan — la vuelta visual y el cierre de lo pendiente

> ## ✅ EJECUTADO el 12 de agosto de 2026 — este fichero es ya registro, no plan
>
> Carlos decidió mirando: *«me gustan las imágenes que veo en alternativa; me gustaría que las
> utilizaras como base para diseñar acorde a ellas toda la web completa»*. O sea **la variante A**
> de la Decisión 1, y aplicada a la web entera y no solo a la portada.
>
> Qué se hizo de este plan: F1 (campo oscuro y matriz nueva), F2 (fotos con derivados propios), F3
> (la tarjeta, en la variante que eligió Carlos), F4 (las dos bandas y el día bueno), F5 (escala y
> aire), F6 (profundidad y movimiento), F7 (los arreglos: el desborde y el código de barras), F8
> nivel 1 (el buscador ya indexa síntomas), F9 (pasada de QA → `docs/qa/informe-4.md`), F10
> (limpieza) y F11 (documentación).
>
> Las otras cinco decisiones del anexo se resolvieron así: **2** las tarjetas sanas SÍ llevan
> distintivo, y el criterio de «no hay color para sana» se retira con su motivo escrito; **3** el
> presupuesto se rederivó y falta la medición en frío; **4** el índice de síntomas entró a nivel 1;
> **5** y **6** siguen esperando a Carlos.
>
> Lo que queda vive en `docs/retomar.md` y `docs/pendiente.md`, que son los ficheros de estado.
> Esto se queda como el registro de cómo se llegó aquí.

Escrito el **12 de agosto de 2026** por el agente único, después de leer el repo entero y de
**medir el estado de hoy** en worktree limpio sobre `856c847`. Sustituye a nada: es el plan de
ejecución de lo que `docs/retomar.md` y `docs/pendiente.md` dejaron abierto.

## Cómo leer este fichero

La lección más cara del proyecto está en `docs/aprendizaje.md`: **una recomendación citada varias
veces asciende a requisito sin que nadie mienta.** Así que aquí la modalidad va dentro de la frase:

- **Lo que decide Carlos** va marcado con **[CARLOS]**. Nada de eso se ejecuta sin su palabra.
- **Lo que ya decidió Carlos** va marcado con **[YA DECIDIDO]** y sí es norma, con la cita.
- Todo lo demás es **una propuesta con su motivo**, y se puede tirar.
- Los números que propongo llevan su derivación al lado. Si no la llevan, lo digo.

Y el suelo que no propongo porque no es estética —es no mentir—: cero nodos de texto por debajo de
AA, cero bordes de control por debajo de 3:1, cero saltos de orden de foco, cero desborde
horizontal, cero recursos de terceros, `prefers-reduced-motion` con **versión alternativa**,
ninguna información solo por color, las fotos de diagnóstico sin filtrar, ni un dato inventado, y
ningún literal de color/tamaño/espaciado fuera de `css/tokens.css`.

---

## 1. Estado medido hoy, no recordado

`python3 tests/runner.py` en worktree limpio sobre **`856c847`**, 12 de agosto de 2026:

```
1280×813   ✗ DESBORDE HORIZONTAL: scrollWidth 1348 > 1280   ← nuevo, ver abajo
1920×813   ✓ sin desborde
"320"      ✗ 584 > 500  · OJO: Chrome no baja de 500 px de ventana, así que
             `--ancho 320` mide 500. El runner imprime el ancho real (es honesto),
             pero la petición no ocurre. Para 320 de verdad: `--ancho 640 --dpr 2`.
contraste  ✓ 1.764 nodos medidos · 0 por debajo de AA · 0 bordes de control < 3:1 · 24 no medibles
foco       ✓ 294 enfocables · 0 saltos de orden
movimiento ✓ 27 efectos · 0 fallos · bloque @media reduce: sí
terceros   ✓ 32 recursos · 0 externos · consola limpia
```

Más los comprobadores de disco: `check-tokens` ✓ (con 2 avisos), `check-estatico` ✓,
`validar-plantas` ✓, `peso-assets` ✓ (con 2 avisos), `coherencia` y el resto sin ejecutar aún.

### Lo que ha cambiado desde el cierre del equipo, y por qué importa

`docs/retomar.md` firma «cero desborde a 320 y 1280». **Era verdad el 11 de agosto y hoy es
falsa**, y no porque nadie tocara el código: la franja `HOY` se calcula con `new Date()`, así que
al pasar el día una tarea se ha vuelto más larga («debería haberse hecho hace N días») y la línea
desborda 68 px. Los culpables medidos son `li.tarea-hoy__cosa`, `span.tarea-hoy__titulo` y
`span.tarea-hoy__cuando` dentro del `subgrid` de `.parte__tareas`.

> **Consecuencia para el proceso, y es nueva: en esta web una medición se sella con el commit Y
> con el día.** El contenido de la portada depende del reloj. Un ✓ de ayer no es un ✓.

### Defectos que he encontrado leyendo, y que nadie había levantado

| # | Qué | Evidencia | Gravedad |
| --- | --- | --- | --- |
| D1 | **Desborde horizontal de 68 px** en la franja a 1280 y a 500 | medición de arriba | bloqueante |
| D2 | **El código de barras de la pegatina no se pinta nunca.** El HTML tiene `.etiqueta__barras`; el CSS estiliza `.etiqueta__ean` y `.etiqueta__sin-codigo`, que no existen en el DOM. `.etiqueta__codigo` y `.etiqueta__derecha` tampoco tienen regla | `grep` cruzado HTML/CSS + se ve en `docs/qa/pages-1280-inicio.png`: «Cód. 2040 1849» sin barras | alta — es la mitad de la signature, y **ningún comprobador mira si un `background-image` llega a pintarse** |
| D3 | CSS huérfano: `.parte__resto`, `.estado__diagnostico`, `.etiqueta__ean`, `.etiqueta__sin-codigo` | sus elementos ya no se renderizan | media |
| D4 | JS muerto: `diagramaRecuperacion()` sigue exportado en `js/svg.js` y no lo llama nadie — el diagrama se borró por afirmar algo falso | `grep -rn diagramaRecuperacion` → 1 sola línea, su propia definición | media |
| D5 | `filtros.js` indexa `p.estado?.diagnostico`, campo que `normalizarEstado()` no produce: es un `undefined` silencioso en el índice de búsqueda | lectura cruzada `datos.js` ↔ `filtros.js` | media |
| D6 | **`alternativa/LEEME.md` no existe.** `docs/retomar.md` dice «empieza leyendo» ese fichero y nunca se commiteó (`git log --all` no lo conoce). El mapa de aplicación de la piel nueva **no existe**: hay que derivarlo, y es lo que hace la §3 de este plan | `git log --oneline --all -- alternativa/LEEME.md` → vacío | alta (de proceso) |
| D7 | `docs/inventario.md` sigue siendo la plantilla vacía, mientras `CLAUDE.md` lo presenta como «las plantas reales de Carlos (input humano)» | el fichero | media |
| D8 | Presupuestos incumplidos con aviso: `css/app.css` 74,9 KB (tope 60) y `js/` 153,6 KB (tope 60) | `peso-assets.py` | media — y los dos topes **no están derivados**, como el 20/62/600 |

D1 y D2 caen dentro de esta vuelta. D3–D5 son limpieza y van en la fase 10. D6 lo resuelve este
plan. D7 y D8, propuesta al final.

---

## 2. La decisión de arquitectura, y es la que decide todo lo demás

**[YA DECIDIDO]** Carlos eligió la piel de `alternativa/`: *«me gusta el diseño de alternativa; que
quede que el agente único que lance lo aplique»*.

Lo que hay que decidir es **cómo** se aplica, y hay dos caminos que no son equivalentes:

| | Camino A — adoptar `alternativa/` como base | Camino B — llevar su piel a la versión principal |
| --- | --- | --- |
| Qué se toma | `index.html`, `estilo.css`, `pagina.js` de `alternativa/` | solo la **dirección visual**: paleta, escala, layout, agrupación, fotos |
| Qué cuesta | reimplementar **dos días de funcionalidad y contenido** | reescribir `tokens.css` y buena parte de `app.css` |
| Qué se pierde | ver la lista de abajo | nada funcional |

`alternativa/` es una piel de portada y ficha, y **no reimplementó** —esto es inventario, no
opinión, y sale de leer sus 515 líneas de `pagina.js` contra las 3.500 de `js/`—:

- La franja `HOY` con la fecha real del navegador y **la guarda de seguridad**: una tarea con
  `condicion` nunca entra en el día. Sin eso la web le dice a Noah que abone un helecho sin hojas,
  que es el único fallo de esta página capaz de matar una planta (`checklist.md` 13.3).
- Los cinco tipos de tarea y las tres estaciones de riego. `alternativa/` pinta las tareas en
  bruto, incluida `condicion`, sin clasificar.
- Los diagramas (riego, luz con signo, rango térmico con la banda del salón rotulada como del
  salón) y la cronología logarítmica (R² 0,9995).
- Las siete siluetas de hoja, los diez iconos de campo, el buscador, los filtros por faceta y el
  histórico de estados.
- Las fuentes citadas **campo por campo** (las 34 del helecho; el bloque que las rescató del limbo).
- El expediente a dos columnas semánticas con la de acción `sticky` (bajó el hueco del 53–65 % al
  0–7 %).
- Y tres cosas que además contradicen reglas escritas del proyecto: lee el estado con
  `estados?.[0]` en vez de `estadoVigente()` —el orden de un array es una convención y la fecha es
  un dato—, compone con `innerHTML` en vez de plantillas + `textContent`, y escribe «siete macetas»
  a mano en el HTML.

**Propongo el camino B**, y el motivo no es apego: es que la piel se puede mover en un fichero de
tokens y la funcionalidad no se puede mover en ninguno. `alternativa/` es un **boceto renderizado
excelente** —hizo su trabajo, que era ganar la comparación— y su valor ahora es de referencia.

> Y hay un hallazgo suyo que sí es mejor que cualquier cosa de la versión principal, y se aplica
> tal cual: **agrupar en «PIDEN MIRADA» / «ESTÁN BIEN» con su recuento resuelve el problema del día
> bueno.** Cuando ninguna planta necesite nada, la primera sección desaparece y la página dice
> `ESTÁN BIEN · 7 de 7` sin inventar urgencia. Ese estado es el que el proyecto existe para
> producir, y estaba en el backlog sin solución.

---

## 3. El mapa de aplicación que falta (esto sustituye al `LEEME.md` que no existe)

Qué de `alternativa/estilo.css` entra, qué se traduce y qué se queda fuera.

### 3.1 Entra tal cual (traducido a tokens)

| De `alternativa/` | A dónde va | Nota |
| --- | --- | --- |
| Campo oscuro cálido `#15110E` + tres superficies (`#201A15`, `#2B231C`, `#362C23`) | `tokens.css` §color | La profundidad en oscuro es **superficie más clara + filo de luz**, no solo sombra |
| Tinta sobre oscuro en tres pesos (`#F4EFE8`, `#C3B7AA`, `#A5988A`) | `tokens.css` | Sustituye la matriz de validez entera: ver §4.1 |
| Acento chartreuse `#CFE84F` (borde de hoja del coleo grande real) | `tokens.css` | **Es un segundo acento**, y el brief argumentaba contra él. Carlos eligió la piel que lo lleva, así que entra — con la guarda medida de §4.1 |
| Severidad `#F1728F` / `#EBA94C` | `tokens.css` | Siempre con **palabra + punto + filete**, nunca color solo |
| El papel claro para la voz de la casa | ya existe como `.cuaderno` | Ver §3.3 |
| Escala de display grande (`clamp(2.75rem, 9vw, 6.5rem)` para el veredicto) | `--texto-parte` | Hoy es `clamp(1.75rem, 5vw, 3.25rem)`. El salto es el punto: *nada era grande* |
| Agrupación en dos bandas con recuento | `index.html` + `js/app.js` | La mejor idea de `alternativa/`. Ver §4.4 |
| Fotos a sangre llevando la rejilla | `index.html`/`ficha.js` + `assets/img/` | La palanca 1 del brief. Ver §4.2 |
| Entrada escalonada con `IntersectionObserver` | `js/` + `--retardo-1/2/3` | Tokens ya definidos y sin usar |
| Filo de luz interior (`inset 0 1px 0 rgb(255 255 255 / .07)`) | `tokens.css` | Es lo que hace que el oscuro no sea plano |

### 3.2 Se traduce, no se copia

- **`alternativa/` usa nombres de token propios** (`--fondo`, `--acido`, `--e-4`). Los nombres del
  proyecto se quedan (`--fondo-pagina`, `--space-4`…) porque `app.css`, `js/svg.js` y los tres
  comprobadores los conocen. Cambiar de vocabulario cuesta un refactor que no compra nada.
- **`alternativa/` pone estilos en línea** (`style="color:var(--meta)"`, 14 sitios). No entran: en
  `js/` el markup vive en `<template>` y la presentación en CSS.
- **Su rejilla es de columnas fijas** (`repeat(3, 1fr)` / `repeat(4, 1fr)` con dos media queries).
  La del proyecto es `auto-fill minmax(min(--ancho-minimo, 100%), 1fr)`, que es lo que le da el
  cero desborde a 320. Se conserva la del proyecto y se le dan **dos densidades por grupo** con
  `--ancho-minimo` distinto, que es el efecto que buscaba `alternativa/` sin su fragilidad.

### 3.3 Lo que propongo NO tomar de `alternativa/`, con el motivo

1. **El verde `--sana: #9FD17C` con la palabra «SANA» en las cuatro tarjetas.** El criterio
   escrito —y está en la columna «CRITERIO, sigue valiendo con cualquier piel» del brief— es que
   **no existe color para «sana»**: el color solo aparece cuando hay un problema y su fuerza viene
   de la escasez. Con la agrupación de `alternativa/`, el rótulo `ESTÁN BIEN · 4 de 7` ya lo dice
   una vez por las cuatro; repetirlo en cada tarjeta con un color nuevo gasta justo lo que hace
   visible al helecho. **Propuesta: las tarjetas del grupo «están bien» van sin distintivo.**
   **[CARLOS]** si prefiere verlo en cada tarjeta, gana él, y entonces el verde se mide como
   cualquier otro token.
2. **`aspect-ratio: 1/1.1` para la foto de la tarjeta.** Las doce imágenes son 3:4 y
   `--aspecto-foto` ya existe. Un recorte cuadrado corta la maceta del poto y la del helecho, que
   es donde está la prueba. Propuesta: 3:4 en la tarjeta, con `object-fit: cover` para el ajuste
   fino.
3. **`servir.py`.** Duplica `python3 -m http.server`, que es lo que dice `README.md`.

### 3.4 La pregunta abierta que sí quiero que decida Carlos mirando

`alternativa/` hace las tarjetas **oscuras con texto claro**. La versión principal tiene una
signature nombrable —la pegatina térmica de Projardín, opaca y blanca— y el checklist la exige
(11.5: «si no se puede nombrar, no existe»).

Las dos se pueden tener: **la foto arriba y la pegatina blanca opaca pegada debajo, sobre el campo
oscuro.** No es una componenda; es literalmente lo que hay en
`assets/img/coleo-grande-etiqueta.jpg` —la mata real arriba, la pegatina pegada al tiesto— y es la
frase con la que el brief cambió la unidad de la metáfora: *«la planta en su tiesto con la pegatina
puesta»*.

Y tiene una consecuencia técnica grande a favor: **si el texto sigue sobre superficie blanca, la
matriz de validez entera sobrevive** y los 1.764 nodos por encima de AA se conservan sin volver a
medir uno por uno. Solo hay que medir de nuevo los pares **de página** (cabecera, pie, rótulos de
grupo, legends de filtros, recuento), que son unas decenas.

> **[CARLOS] Decisión 1 — la piel de la tarjeta.** Dos variantes renderizadas y decides mirando,
> que es el procedimiento que este proyecto adoptó cuando se descubrió que una prohibición de
> diseño no la había escrito nadie:
>
> - **A · tarjeta oscura**, fiel a `alternativa/`: foto, y debajo superficie `--sup-1` con tinta
>   clara. Más unidad de campo; la pegatina desaparece como objeto.
> - **B · foto + pegatina blanca**, la evolución: foto a sangre arriba, pegatina opaca debajo con
>   su nombre a sangre, su código y su precio. Conserva la signature y el suelo medido de AA.
>
> Cuestan lo mismo de construir (es la misma foto y el mismo DOM, distinto CSS) y las dos se
> entregan en captura a 1280, 768 y 320, en color y en escala de grises. **Mi recomendación es B**,
> por la signature y por el suelo de AA; y si la de A gusta más, gana A.

---

## 4. Las fases, en orden, con su verificación

Cada fase termina con una comprobación **ejecutada**, no leída, y sobre worktree limpio. El orden no
es negociable en un punto: **los tokens antes que el CSS, y las fotos antes que la tarjeta.**

### F0 · Sellar la línea de partida (media hora)

- `git worktree add --detach /tmp/verif HEAD` y pasar los diez comprobadores, guardando la salida
  en `docs/qa/informe-4.md` como «estado de partida, 12 de agosto, commit `856c847`».
- Capturas de partida a 1280, 768 y 320 real (`--ancho 640 --dpr 2`) en `docs/qa/`.
- Anotar en `docs/aprendizaje.md` los dos hallazgos de instrumental de hoy: **Chrome no baja de 500
  px de ventana**, así que `--ancho 320` mide 500 y hay que usar el truco del dpr; y **ningún
  comprobador mira si un `background-image` llega a pintarse** (es lo que dejó pasar D2 durante
  todo el proyecto). Por la regla del proyecto esto no genera tarea… salvo que impida verificar
  algo del alcance, y el 320 sí lo impide, así que el truco del dpr entra en `docs/qa/como-ejecutar.md`.

### F1 · El campo oscuro: `tokens.css` primero (la fase de más riesgo)

Riesgo alto y conocido: **este proyecto lleva cuatro fallos del mismo error** —un token medido
contra un fondo y usado contra otro: el enlace azul (1,44:1), el borde del buscador (1,92:1), el
borde en superficie hundida (2,87:1) y los siete tiradores de despegar (1,49:1)—. Invertir el campo
los reabre todos a la vez.

1. Añadir la paleta oscura a `tokens.css` con los alias semánticos ya existentes apuntando a ella
   (`--fondo-pagina`, `--texto-sobre-maceta` → renombrar o realiasar; ver nota abajo).
2. **Reescribir la matriz de validez por superficie** del principio de `tokens.css`. La de
   `alternativa/estilo.css` (líneas 764–795) trae 25 pares ya calculados y es un punto de partida
   honesto, pero **la calculó su autor**: se vuelve a medir con `tests/contraste.js`, que mide el
   color computado contra el fondo compuesto en el navegador, que es el único sitio donde el
   contraste existe.
3. El par prohibido nuevo, que `alternativa/` ya documenta: **chartreuse sobre el papel claro =
   1,18:1.** Dentro de `.cuaderno` la tinta es la del papel y el anillo de foco se invierte.
4. Rehacer el bloque `@media (prefers-contrast: more)`: hoy endurece seis tokens claros que van a
   dejar de existir.
5. El `@media (prefers-reduced-motion)` de `tokens.css` baja `--dur-media/larga/dibujo` a **1 ms**,
   y el propio brief dice que 1 ms parpadea. Hoy funciona porque `app.css` anula la animación y
   pinta el estado final en cada caso. Al reescribir `app.css` hay que **conservar cada una de esas
   anulaciones**; la lista está en `css/app.css:2037-2071`. Es el punto donde un descuido castiga a
   quien activó una opción de accesibilidad (`checklist.md` 13.13).

Nota sobre nombres: `--texto-sobre-maceta` y `--color-borde-control-sobre-maceta` nombran una
superficie que va a cambiar de color pero no de papel: sigue siendo «el campo de página». Propongo
**conservar los nombres y cambiar los valores**, y anotarlo en `decisiones.md`; renombrarlos toca
`app.css` en 20 sitios y no compra nada. `--color-maceta` sí merece un comentario nuevo: deja de
ser el plástico del tiesto.

**Verificación de F1:** `check-tokens.py` ✓ y `runner.py --test contraste` con **0 nodos por debajo
de AA y 0 bordes de control por debajo de 3:1** a 1280 y a 320. Si sale un solo nodo, no se avanza.

### F2 · Las fotos en la rejilla, con el peso medido y dicho

**[YA DECIDIDO]** Es la palanca 1 y la queja original: *«las fotos, que hoy no se ven en la
rejilla»*.

1. **Derivados nuevos, no los actuales.** Las siete fotos de ficha son 800×1067 y pesan 78–233 KB.
   Meter esas siete en la rejilla son ~1 MB de carga inicial. Se generan derivados de rejilla desde
   los originales de `docs/plants/` (34 MB, en disco y fuera del repo, que es exactamente para lo
   que sirven) con `sips`, que es de sistema y no es una dependencia — el mismo criterio con el que
   se aceptó descargar las tipografías ya subseteadas.
2. **Mismo recorte, no otro:** 3:4 a 480×640, `object-fit: cover` para el ajuste. Así el derivado
   es el **mismo encuadre** más pequeño y no hay que decidir nada por planta. Si alguna queda mal
   encuadrada, el ajuste va en un mapa de presentación en `js/` con su comentario —**nunca en
   `content/plantas.json`**, que es contenido y no maquetación.
3. Ruta: `assets/img/rejilla/<misma-foto>.jpg`, derivada en `js/datos.js` del campo `foto`. Y se
   extiende `tests/coherencia.py` para que exija **las dos** rutas: un derivado que falte es un
   hueco en la rejilla y no un error en consola.
4. **Sin un solo filtro.** Ni duotono, ni grado, ni viñeta. Más grandes y mejor presentadas sí;
   mejor de lo que están, no.
5. `width`/`height` explícitos que coincidan con el fichero (lo comprueba `peso-assets.py`),
   `aspect-ratio` para que la rejilla no baile, y `loading="lazy"` salvo la primera fila.
6. **El presupuesto hay que rederivarlo, y decirlo.** El de hoy (`checklist.md` 9.7: «< 400 KB con
   la rejilla cerrada, cero bytes de foto») **está escrito sobre la premisa que estamos cambiando**,
   así que no se puede ni cumplir ni incumplir: hay que sustituirlo. Propuesta con derivación:
   `HTML+CSS+JS+JSON+fuentes` medidos hoy ≈ 640 KB sin comprimir (`json` 312 + `js` 154 + `css` 90
   + fuentes 82) **más** las fotos que de verdad entran en el primer viewport a 1280 (tres o
   cuatro), a ~55 KB cada derivado ⇒ **tope propuesto: 900 KB de transferencia en frío con la
   rejilla cerrada**, y se mide con la carga en frío, no se estima. **[CARLOS]** el número es mío y
   es discutible; lo que no es discutible es medirlo y escribirlo en vez de descubrirlo.

**Verificación de F2:** `peso-assets.py` ✓ (dimensiones que cuadran, sobremuestreo ≤2,5×),
`coherencia.py` ✓, y la medición de carga en frío anotada en `informe-4.md`.

### F3 · La tarjeta: las dos variantes y la decisión de Carlos

Construir A y B sobre el mismo DOM, capturar a 1280/768/320 en color y **en escala de grises**, y
parar. Aquí hay un criterio de aceptación heredado que no es opinión:

> **Con las siete fotos puestas, la marca del helecho tiene que seguir siendo lo primero que se ve
> al abrir la portada** — comprobado en captura, en color y en escala de grises. Y si deja de
> serlo, la salida **no** es quitarle el color a las plantas sanas: es subir la saliencia de la
> alarma por vía no cromática (peso, tamaño, posición) y decirlo.

Con el chartreuse en juego hay que medir además una cosa que antes no existía: **el acento se gasta
en «ABRIR LA FICHA» siete veces**, y eso es siete manchas vivas compitiendo con una marca de
alarma. Propuesta: el acento en los tiradores baja de relleno a texto+filete, o se reserva a la
cifra del veredicto y a los enlaces de fuente. Se decide con la captura en grises delante.

### F4 · Agrupar en «piden mirada» / «están bien»

La idea de `alternativa/`, llevada a la arquitectura de `js/`:

1. `index.html`: dos `<section>` con su `<h2>`/`<h3>` y su recuento, cada una con su `<ul>`. Ojo al
   esquema de encabezados (`checklist.md` 1.2): hoy `main` tiene un `h2` oculto «Las plantas»; los
   rótulos de grupo entran como `h3` debajo, y el veredicto **sigue siendo un `<p>`** por grande
   que se pinte.
2. `js/app.js`: `pintar()` reparte `visibles` en dos grupos por `grupoSeveridad()` y **esconde el
   grupo vacío**. El orden por urgencia de `ordenarPorUrgencia()` se conserva dentro de cada grupo.
3. **Lo que hay que no romper:** el recuento de `#resultado` con `aria-live`, el «ninguna planta
   coincide» cuando el filtro deja los dos grupos vacíos —que no es lo mismo que un grupo vacío—,
   `irAFicha()` (que quita filtros para llegar a una ficha), y `data-vacio` de la rejilla.
4. `tests/estructura.js` cuenta `<article>` contra el JSON y exige que la rejilla sea `<ul>/<li>`:
   con dos listas, hay que comprobar que sigue sumando siete y no se abstiene.

**Y el regalo:** el día que las siete estén bien, la portada dice `ESTÁN BIEN · 7 de 7` sin
inventar urgencia. Eso cierra un punto del backlog de `pendiente.md` («que el hero funcione el día
bueno») **por construcción y sin diseñar un caso especial**, que era lo que lo tenía parado. Se
verifica con un JSON de prueba en el worktree —nunca tocando `content/plantas.json`.

### F5 · Escala, jerarquía y aire

- `--texto-parte` sube a escala de display real (la de `alternativa/`), con la cifra en acento.
  Verificar a 320 antes de cerrarlo: cero desborde no se negocia, y el veredicto es el renglón más
  largo de la página.
- Los rótulos de grupo a `--texto-sub` con su recuento en monoespaciada alineado a la derecha.
- **`--space-9` (6rem)**, definido y nunca usado, entra entre bandas: buena parte de la sensación de
  «pobre» es densidad, no falta de adorno.
- Y **la monoespaciada en toda cifra** sigue siendo criterio, no piel: ml, °C, cm, €, EAN, fechas.

### F6 · Profundidad y movimiento, con lo que ya estaba especificado

- Profundidad: superficie más clara + filo de luz + sombra, **y oclusión** (la pegatina/tarjeta
  encima de la foto). `--sombra-contacto` existe para esto y hoy no se usa. `--radio-troquel` (3 px)
  no se toca: la suavidad viene de la luz y del aire, no de redondear más.
- Movimiento, todo con tokens ya definidos y sin usar: `--retardo-1/2/3` para el escalonado de
  entrada (un disparo, al cargar, **sobre la tarjeta y no sobre la carga de la imagen**, o el gesto
  se rompe distinto en cada visita), `--dur-larga` para el reordenado al filtrar, y se conservan la
  bisagra del despegue y el revelado del veredicto.
- **`reduce` con versión alternativa en las cuatro**, no duración corta: escalonado → aparecen
  juntas; bisagra → sin bisagra, la sombra marca el estado; zoom de foto → no existe; revelado →
  entero. Umbral heredado y derivado: bajo `reduce`, una animación que solo toca `opacity`/`color`
  tiene tope de **120 ms** (`--dur-corta`), y es tope de latencia, no de movimiento.

**Verificación de F6:** `runner.py --test movimiento` normal y `--reduce`, más
`--test diagramas --reduce` (13.12 y 13.13: con `reduce` las de un disparo pintan el estado final y
**ningún diagrama desaparece**).

### F7 · Los arreglos que caen dentro de esta vuelta

- **D1, el desborde de la franja.** Es bloqueante y es de hoy. Diagnóstico a hacer con el navegador
  abierto, no leyendo: el sospechoso es el `subgrid` de `.parte__tareas` con dos columnas `auto` y
  una línea larga en la tercera. La regla del proyecto aplica: **un título que envuelve se lee, uno
  truncado miente** — se arregla dejándolo envolver, no recortándolo.
- **D2, el código de barras muerto.** Si gana la variante B, se arregla (es la signature). Si gana
  A y la pegatina desaparece, se borran las reglas huérfanas y se anota. En los dos casos se añade
  al checklist un punto nuevo: **un `background-image` de trama se comprueba en captura**, porque
  ningún test lo mira.
- Repasar que el foco visible funcione sobre el campo oscuro: el anillo doble existe justo porque
  ningún color pasa 3:1 contra dos superficies a la vez, y ahora las superficies son otras.

### F8 · La promesa del buscador (fuera de la vuelta visual, pero es la única promesa que miente)

El placeholder dice «poto, salón, hojas amarillas…» y el índice de búsqueda **no contiene ningún
síntoma**: `filtros.js` indexa nombre, binomio, familia, dificultad, luz, ubicación y los resúmenes
de cuidado. Dos niveles, y el primero es casi gratis:

1. **Añadir al índice** `estado.senales`, `estado.causas[].resumen` y `patron` (y quitar el
   `p.estado?.diagnostico` de D5, que no existe). Con eso «hojas amarillas» encuentra algo y el
   placeholder deja de mentir. Media hora.
2. **El índice de síntomas** como lista navegable, generado de `senales`/`patron` y no de una
   taxonomía fija —así cada entrada tiene al menos una planta por construcción—, dentro del
   buscador y no en la portada. Es una tarde. **[CARLOS]** ¿entra en esta vuelta o se queda en el
   backlog? Recomiendo el nivel 1 ahora (cierra la mentira) y el nivel 2 después de la piel.

### F9 · La pasada de QA final, sellada

Es lo único del alcance de v1 que quedó sin firmar. Sobre worktree limpio y **después del último
commit** —la cara B de verificar ejecutando, que aquí costó una web en blanco durante horas—:

```
git worktree add --detach /tmp/verif HEAD
cd /tmp/verif
python3 tests/runner.py --puerto 8123                       # 1280
python3 tests/runner.py --puerto 8123 --ancho 640 --dpr 2   # 320 de verdad
python3 tests/runner.py --puerto 8123 --ancho 1920
python3 tests/runner.py --puerto 8123 --reduce
python3 tests/runner.py --puerto 8123 --abrir-todas --alto 3000 --test cobertura-datos
python3 tests/runner.py --puerto 8123 --abrir 0 --alto 6000 --test autoprueba --test franja-hoy --test diagramas
python3 tests/peso-assets.py && python3 tests/coherencia.py && python3 tests/enlaces-fuentes.py
```

Y las dos cosas que no se automatizan y son la mitad del encargo: **§10** (el trabajo que la página
hace, con cronómetro) y **§11** (revisión visual con criterio, incluida la captura en escala de
grises y el «¿se puede nombrar la signature?»). Resultado en `docs/qa/informe-4.md`, punto por
punto, con estado, evidencia y dueño.

Dos guardas de esta pasada, que están en el checklist y son fáciles de olvidar:
- **`cobertura-datos` no puede bajar.** Ningún objetivo de forma se cumple recortando contenido: si
  un campo que hoy llega a pantalla deja de llegar, el que está mal es el objetivo.
- **`autoprueba` se lee al revés**: ✗ en los dos es el resultado bueno; ✓ significa que el
  instrumento no ve.

### F10 · Limpieza del repo

Lo que sobra hoy, con el motivo y con lo que propongo hacer:

| Qué | Cuánto | Propuesta |
| --- | --- | --- |
| `alternativa/capturas/*.png` (8 ficheros) | **8,7 MB**, el 11 % del repo | Conservar **una** (`1280-portada.png`) en `docs/qa/` como «de dónde salió la piel» y borrar las siete restantes: están en el historial de git y su trabajo —ganar la comparación— ya está hecho |
| `alternativa/{index.html,estilo.css,pagina.js,servir.py}` | 57 KB | Borrar **al terminar F5**, no antes: hasta entonces es la referencia. El historial las conserva y `decisiones.md` dirá en qué commit |
| `diagramaRecuperacion()` en `js/svg.js` (D4) | ~28 líneas | Borrar. El diagrama se retiró por afirmar algo falso; su código no debería sobrevivirle |
| CSS huérfano (D3) | 4 bloques | Borrar con el resto del repintado de `app.css` |
| `p.estado?.diagnostico` en `filtros.js` (D5) | 1 línea | Borrar en F8 |
| 18 tokens definidos y sin usar | aviso de `check-tokens` | Siete los gasta esta vuelta (`--retardo-*`, `--dur-larga`, `--space-9`, `--ease-entrada`, `--dur-instante`). Los que sigan sin usar al final —`--color-sustrato`, `--aspecto-diagrama`, `--diana-comoda`…— **se borran o se usan**: paleta muerta es deuda |
| Capturas de `docs/qa/` superadas por la piel nueva | ~2,5 MB de 17 PNG | Las que citan `informe-1/2/3` **se quedan** (una evidencia sin su captura no es evidencia). Las de trabajo que no cita nadie se borran, listándolas en `informe-4.md` |
| `docs/inventario.md` vacío (D7) | — | **[CARLOS]** o lo rellena (y entonces es el input humano que dice ser) o se sustituye por un puntero a `content/plantas.json` diciendo que el inventario se recogió hablando. Hoy es un formulario en blanco que `CLAUDE.md` presenta como fuente |
| `.DS_Store`, `__pycache__/`, `.playwright-mcp/`, `preview-cerrada.png`, `docs/plants/` | 38 MB en disco | **Nada que hacer: los cinco ya están en `.gitignore` y ninguno está versionado.** Y `docs/plants/` **no se borra**: son los originales de los que salen los derivados de rejilla de F2 |

### F11 · Dejar el repo contando la verdad

Documentación que queda desalineada en cuanto se aplique la piel, y arreglarla es parte del trabajo
—no un extra—, porque este proyecto ya se ha equivocado por creerse un documento viejo:

- **`docs/decisiones.md`**: una vuelta nueva con cada decisión de este plan y su alternativa
  descartada. Y **lo que se afloje, con su motivo escrito**: si en dos sesiones alguien lee que el
  campo es oscuro, tiene que poder leer también que la teja era el plástico medido del tiesto y por
  qué se fue.
- **`docs/brief.md`**: el aviso del principio ya dice que la piel está sustituida. Actualizarlo para
  que diga **por cuál**, y que la columna «PIEL» pasó a ser registro cerrado.
- **`docs/retomar.md`**: reescribir el relevo. Hoy manda leer un `alternativa/LEEME.md` que no
  existe (D6) y firma un «cero desborde» que hoy es falso.
- **`docs/pendiente.md`**: cerrar los puntos hechos y mover lo que quede.
- **`README.md`**: la tabla de teammates, la frase «pendiente de activar GitHub Pages» (ya está
  publicado) y la sección de estado.
- **`CLAUDE.md`**: la fila de `ui-designer` apunta a `alternativa/` «pendiente de comparar». Ya se
  comparó y se eligió.
- **`docs/qa/checklist.md`**: los puntos 11.2/11.3 dicen que la web **no** debe ser «fondo casi
  negro con un único acento verde ácido». La piel elegida por Carlos es casi exactamente eso.
  **No se puede dejar un checklist que suspenda la decisión del dueño**: esos puntos se reescriben
  como lo que son —el argumento de que un default no es una elección hasta que alguien lo elige a
  la vista de otra cosa— y se anota que **aquí alguien lo eligió mirando dos versiones**, que es la
  condición que el propio proyecto puso. El resto de §11 (signature nombrable, jerarquía real,
  bonita a 320) se queda intacto porque no depende de la paleta.

---

## 5. Lo que no puede hacer un agente

- **Las `notas` de Carlos.** Están vacías en las siete. El panel solo se renderiza con contenido,
  así que hoy no se ve un hueco: se ve una web sin voz. Y es la capa por la que ese panel existe.
  **No se inventan nunca.** Basta una frase por planta, de quien la cuida. **[CARLOS]**
- **Fotos nuevas** cuando quiera registrar un estado nuevo: el esquema ya es histórico y la ficha
  diagnostica un momento fechado, no el presente.
- **Los datos de la casa que sigan abiertos**, como el radiador que preguntó `botanist`: mientras no
  esté, la banda térmica se rotula como del salón y no de la planta, que es lo que hace hoy.

## 6. Backlog que sigue sin dueño (no entra en esta vuelta)

- **Los tres umbrales sin derivar**: ocupación ≤20 %, tinta parando antes del 62 %, carrera de 600
  px sin ancla. Cumplen los tres; ninguno está justificado. Úsalos, no los defiendas como física.
- **Los dos presupuestos de peso sin derivar** (D8): `app.css` 60 KB y `js/` 60 KB, incumplidos con
  aviso desde antes de esta vuelta y que el repintado va a empeorar. O se derivan o se retiran; lo
  que no vale es un tope que se incumple en verde.
- **La prueba del imperativo a los dos skills** (`vanilla-web-craft`, `plant-expert`). Están
  escritos en imperativo y son el vehículo más peligroso del ascenso de calificadores, porque se
  leen como el manual del proyecto. La prueba es barata: leer cada imperativo y preguntar *«¿esto
  tiene dueño humano, o soy yo con voz de norma?»*.
- **La propuesta de `botanist`** para hacer comprobable una cita correcta que apunta al taxón
  equivocado.

## 7. Riesgos, y cuál me preocupa de verdad

| Riesgo | Por qué es real | Guarda |
| --- | --- | --- |
| **Invertir el campo reabre los cuatro fallos de contraste del proyecto** | los cuatro fueron el mismo error: un token medido contra un fondo y usado contra otro. Ningún checker estático lo ve | F1 no se cierra sin `--test contraste` en 0. Y si gana la variante B, el texto sigue sobre blanco y la mayoría de los pares no se toca |
| **Siete fotos en color se comen la única alarma** | la saliencia es relativa al campo, y el riesgo lo levantó el propio equipo | criterio de aceptación heredado: el helecho sigue siendo lo primero que se ve, en color **y en grises**. Si falla, se sube por vía no cromática |
| **El peso se descubre en vez de medirse** | 7 fotos de ficha en la rejilla son ~1 MB | derivados de F2 + medición en frío + presupuesto rederivado y escrito |
| **Perder funcionalidad al portar la piel** | `alternativa/` no la tiene, y el trozo que se pierda no dará ningún error | `cobertura-datos` antes y después: el número de campos que llegan a pantalla no puede bajar |
| **Que `reduce` deje algo invisible** | `animation: none` sin fijar `opacity`/`stroke-dashoffset` deja el elemento en su estado inicial, sin error en consola | `--test diagramas --reduce`, puntos 13.12 y 13.13 |
| **Medir el día equivocado** | el contenido de la portada depende de `new Date()`, como demuestra D1 | toda medición sellada con commit **y fecha**, y la franja re-mirada el día de la firma |

## 8. Cuándo está terminada esta vuelta

No cuando compile. Cuando, sobre un commit concreto y en worktree limpio:

1. Los diez comprobadores en verde, con `autoprueba` leído al revés.
2. Cero nodos de texto por debajo de AA, cero bordes de control por debajo de 3:1, cero saltos de
   orden de foco, cero desborde a 320/1280/1920, consola limpia, cero recursos de terceros.
3. `cobertura-datos` igual o mayor que el de partida.
4. Capturas a 320, 768, 1280 y 1920 **más una en escala de grises**, guardadas y citadas.
5. La carga en frío medida y escrita, con su presupuesto rederivado.
6. §10 y §11 del checklist recorridos a mano, con la signature nombrada.
7. `informe-4.md`, `decisiones.md`, `retomar.md`, `pendiente.md`, `README.md` y `CLAUDE.md`
   diciendo lo que la web hace hoy.
8. Y la única pregunta que no contesta ningún instrumento, que la contesta Carlos mirando:
   **¿sigue pareciendo pobre?**

---

## Anexo · Las decisiones que espero de Carlos, juntas

| # | Decisión | Mi recomendación | Bloquea |
| --- | --- | --- | --- |
| 1 | **Tarjeta oscura (A) o foto + pegatina blanca (B)** | **B**: conserva la signature y el suelo medido de AA | F3, y con ella F5 y F6 |
| 2 | Las tarjetas de «están bien», ¿con distintivo verde o sin distintivo? | **sin distintivo**: el rótulo del grupo ya lo dice, y no existe color para «sana» | F4 |
| 3 | El presupuesto de carga en frío: **900 KB** propuesto | medirlo y escribirlo, sea el número que sea | F2 |
| 4 | El índice de síntomas, ¿en esta vuelta o después? | el nivel 1 (indexar síntomas) ahora; el nivel 2 después | F8 |
| 5 | `docs/inventario.md`: ¿lo rellenas o lo sustituimos por un puntero? | puntero, y las notas por separado | F10 |
| 6 | Las `notas` de las siete plantas | una frase por planta, de quien las cuida | nada, pero es la web sin voz |
