# Estado — qué es la web hoy y qué queda

**Este es el único fichero de estado del proyecto.** Todo lo demás en `docs/` es registro
histórico: cuenta cómo se llegó aquí y no se actualiza, solo crece. El mapa completo de qué es cada
fichero está en `CLAUDE.md`.

Última actualización: **12 de agosto de 2026**, commit `730e97d`.

**Se trabaja en solitario.** El equipo de cinco agentes que construyó esto está parado y el modo
Agent Teams retirado. Si encuentras referencias a `ux-lead`, `builder`, `botanist`, `qa-visual` o
`ui-designer`, son **el registro de quién escribió qué**, no instrucciones: no hay nadie a quien
mandar un mensaje.

Lee, en este orden: este fichero, `CLAUDE.md`, y **`docs/aprendizaje.md`** — que no es opcional,
porque documenta diecisiete formas en que los instrumentos de este proyecto han mentido, y vas a
usar esos instrumentos.

---

## Qué es la web hoy

Campo oscuro cálido, **las siete fotos de las plantas llevando la página**, y chartreuse ácido
—sacado del borde de hoja del coleo grande real— como único acento. El veredicto del día
(`3 DE 7 PIDEN MIRADA`) a escala de display, que es lo más grande de la pantalla. Las fichas
agrupadas en dos bandas, **PIDEN MIRADA** y **ESTÁN BIEN**, con su recuento.

Esa piel la propuso `ui-designer` en la carpeta `alternativa/`, **Carlos la eligió mirando dos
versiones renderizadas** y el 12 de agosto se aplicó a la web entera. La carpeta ya no está: hizo
su trabajo, y queda su captura en `docs/qa/piel-elegida-alternativa-1280.png` y el historial de git.

Al abrir una tarjeta se ensancha **esa y solo esa**; las demás mantienen sus columnas. Hay una sola
abierta a la vez y no cuesta JS: son `<details name="planta">`, acordeón exclusivo nativo.

**Publicada** en https://ccanado.github.io/MyPlants/ (Pages desde `main`, se actualiza en cada
push). En local: `python3 -m http.server 8000`.

### Lo que la piel NO se llevó por delante, y es lo que más riesgo tenía

- El **expediente a dos columnas semánticas** (`QUÉ HAGO AHORA` / `EN QUÉ ME BASO`), con la de
  acción primero en el DOM y `position: sticky`.
- La **franja `HOY`** con la fecha real del navegador, una línea por planta, y **la guarda de
  seguridad**: una tarea con `condicion` **nunca** entra en el día. Sin eso, la web le dice a Noah
  que abone un helecho sin hojas, que es el único fallo capaz de matar una planta.
- Los **diagramas**: riego, luz como hueco entre lo que quiere y lo que tiene, y rango térmico con
  la banda de la casa rotulada **como banda de la casa**. Y la **cronología** con eje logarítmico
  de verdad (R² 0,9995), que ahora va debajo de la rejilla.
- Las **siete siluetas de hoja**, que bajaron al expediente con su rasgo en palabras, y la del
  helecho con la trama de sin-dato **dentro del contorno** porque su especie no está identificada.
- Los **diez iconos de campo**, la búsqueda, los filtros, el histórico de estados y las **fuentes
  citadas al pie de cada campo**.
- La **pegatina de Projardín**, reconstruida en HTML y CSS —el código de barras es un gradiente
  repetido— dentro del bloque `LA PRUEBA`, al lado de la foto de la etiqueta real.

Lo garantiza un número y no una impresión: `cobertura-datos` da **0 campos que no llegan a la
página**. Es la guarda contra el riesgo real de un rediseño, que es perder contenido sin enterarse.

## El suelo que no se negocia, y aplica a cualquier piel

- **Cero recursos de terceros** en runtime. Sin CDN, sin Google Fonts, sin librerías.
- **HTML + CSS + JS vanilla, sin build step.** Se sirve estático y funciona.
- **Cero nodos de texto por debajo de AA**, cero bordes de control por debajo de 3:1, cero saltos
  de orden de foco, cero desborde horizontal a 320 px, consola limpia.
- **`prefers-reduced-motion` con versión alternativa**, no con duración corta: 1 ms parpadea.
- **Ninguna información transmitida solo por color.** La severidad lleva palabra, punto y filete —
  y el **grosor** del filete, que es lo que la salva en escala de grises.
- **Las fotos de diagnóstico no se filtran.** Ni duotono, ni grado, ni viñeta. Más grandes y mejor
  presentadas sí; mejor de lo que están, no. En la única planta que se muere, embellecer la foto
  corrompe la prueba.
- **Ni un dato inventado.** Siete plantas y son las que hay. Un campo vacío está vacío a propósito.

---

## v1, cerrada el 12 de agosto de 2026

El alcance se congeló el 11 de agosto por decisión de Carlos, porque el proyecto tenía definición
de terminado **por tarea** —que se vea en captura— y ninguna para el conjunto, así que se
alimentaba a sí mismo: cada hallazgo generaba un meta-hallazgo sobre el instrumento que lo
encontró, ese una regla de proceso, y esa otra auditoría. Los siete puntos de aquel congelado están
hechos:

| # | Qué | Dónde quedó |
| --- | --- | --- |
| 1 | `overflow: clip` para que la columna de acción pegue | `css/app.css`, en `.planta` |
| 2 | `data-tarea`, `data-planta`, `data-tarea-estado` | `js/app.js` y `js/ficha.js` |
| 3 | **Vuelta de riqueza visual** — las cuatro palancas | la piel oscura, aplicada a la web entera |
| 4 | La franja `HOY` muestra **todas** las tareas del día | `js/tareas.js` + `js/app.js` |
| 5 | El tiempo relativo se **calcula** en el render | `js/tareas.js` |
| 6 | Ocupación medida en worktree limpio | 0 % de bandas cortas, tope 20 % |
| 7 | Pasada final con capturas y §10/§11 | `docs/qa/informe-4.md`, sellado contra `730e97d` |

Las cuatro cosas que Carlos echaba en falta —fotos, color, profundidad y movimiento— las resolvió
el mismo cambio: **el sujeto vuelve a su propia portada.**

---

## Lo que queda

Por orden, y con lo que hace falta para cerrarlo.

### 1. Las `notas` de la casa — **solo puede hacerlo una persona**

Vacías en las siete. El panel del cuaderno solo se renderiza con contenido, así que hoy no se ve un
hueco: se ve una web sin voz, y esa capa es la razón de que el panel exista. Basta una frase por
planta, de quien la riega. **No se inventan nunca.**

Sitio para escribirlas: `docs/inventario.md`, que está preparado con las siete y su hueco.

### 2. La pasada con `--url` sobre la web publicada

`python3 tests/runner.py --url https://ccanado.github.io/MyPlants/`. Es el punto 9.6 del checklist y
la única medición inmune al problema del estado en movimiento, **porque producción no puede estar
sucia**. Falta también la medición en frío del peso transferido (9.7), que hoy se estima.

### 3. Dos presupuestos que se incumplen en verde

`peso-assets.py` avisa de `css/app.css` (78,8 KB contra un tope de 60) y de `js/` (156,6 KB contra
60). Los dos topes son números redondos sin procedencia, igual que el 20/62/600. **Un tope que se
incumple en verde no es un tope**: o se deriva o se retira. Y no lo decide un informe de QA — un
informe puede medir contra un objetivo, no crearlo.

### 4. El índice de síntomas como lista navegable

El nivel 1 está hecho: el buscador ya indexa `senales`, `causas[].resumen` y `patron`, así que
«hojas amarillas» encuentra algo y el placeholder dejó de mentir. Falta la entrada por síntoma como
lista, **generada de esos mismos campos y no de una taxonomía fija** — así cada entrada tiene al
menos una planta por construcción y desaparece el problema de qué decir de un síntoma que hoy nadie
tiene. Va en el buscador, no en la portada.

### 5. Los tres umbrales sin derivar

Ocupación ≤ 20 %, tinta parando antes del 62 %, carrera de 600 px sin ancla. Cumplen los tres
(0 %, y 566 px el peor); el criterio de aprobado no está justificado. Úsalos; no los defiendas como
física.

### 6. La prueba del imperativo a los dos skills

`.claude/skills/vanilla-web-craft/` y `plant-expert/` están escritos en imperativo y **son el
vehículo más peligroso del ascenso de calificadores**, porque se leen como el manual del proyecto.
La prueba es barata: leer cada imperativo y preguntar *«¿esto tiene dueño humano, o soy yo con voz
de norma?»*. Lo que no lo tenga, se reescribe como propuesta con su motivo.

### 7. La propuesta de `botanist`

Hacer comprobable una cita correcta que apunta al taxón equivocado.

### 8. Fotos nuevas, cuando Carlos quiera registrar un estado nuevo

El esquema ya es histórico: la ficha diagnostica un momento fechado y no el presente. Añadir un
estado nuevo no rompe nada — el distintivo toma el peor de todos y el vigente se lee por
`fecha_foto`.

---

## Qué hacer con los hallazgos sobre los instrumentos

Van a `docs/aprendizaje.md` y **no generan tarea para nadie**, con una sola excepción: que impidan
verificar algo del alcance. Un test que miente sobre un punto que hay que firmar sí se arregla; un
test que miente sobre algo fuera de alcance se anota.

El 12 de agosto hubo cinco y **dos cayeron en la excepción**: que el runner no pueda medir 320 px de
verdad (impedía firmar «cero desborde a 320») y que ningún comprobador mire si un
`background-image` llega a pintarse (había un código de barras que no se pintaba desde el primer
día). Los otros tres están anotados y no generaron trabajo.

No es desprecio por ese trabajo — es de lo mejor que ha producido el proyecto. Es que su valor está
en quedar escrito para el próximo, no en consumir este.

## Cómo trabajar sin tropezar con el instrumental

Esto ahorra horas y está aquí porque el equipo las perdió:

- **`python3 tests/runner.py` se niega a medir con el árbol sucio**, y es deliberado. La salida es
  sobre un worktree limpio:
  ```
  git worktree add --detach /tmp/verif HEAD
  cd /tmp/verif && python3 tests/runner.py --puerto 8123
  ```
  Hay `--sucio` para medir el árbol a propósito, y estampa `NO ATRIBUIBLE` en cada línea.
- **Y séllala también con el DÍA.** El contenido de la portada se calcula con `new Date()`: el
  «cero desborde» del 11 de agosto era falso el 12 sin que nadie tocara el código.
- **`--ancho 320` NO mide 320.** Chrome no baja de 500 px de ventana; el runner imprime el ancho
  real, así que míralo. Y `--dpr 2` tampoco vale: eso es el zoom al 200 %, que es otra cosa. Para
  320 de verdad hace falta conducir el navegador por fuera — ver `docs/qa/como-ejecutar.md`.
- **`--url` audita la web publicada**, y producción no puede estar sucia.
- **`--completa` no captura la página entera** —Chrome ignora el flag— y el runner protesta cuando
  lo detecta. Para ver algo largo, `--alto` grande.
- **Para saber si algo está hecho: `git show HEAD:fichero`, nunca `grep` sobre el directorio.**
- **Ningún comprobador mira si un `background-image` llega a pintarse.** El código de barras de la
  pegatina no se pintó en todo el proyecto con los diez comprobadores en verde. Eso solo se ve en
  captura.
- **El auditor de contraste se abstiene ante un `background-image` ancestro**: con el halo del
  campo son 112 abstenciones. El peor caso está medido y declarado en `css/tokens.css`; si se toca
  el halo, hay que repetir esa medición.
- **Los descendientes de un `<details>` cerrado devuelven rectángulos con anchura** en Chrome, así
  que barrer `getBoundingClientRect()` sobre `*` da cientos de falsos desbordes. El dato que manda
  es el `scrollWidth` del documento.
- **Un `TypeError` en un módulo de render no se ve**: se traga el trozo de interfaz y la página
  parece bien. `js/datos.js` tiene `avisarDeCamposAusentes()` para eso; úsalo.
- El estado vigente de una planta se lee con **`estadoVigente(p)`**, que ordena por `fecha_foto`.
  **Nunca `estados[0]`**: el orden de un array es una convención y la fecha es un dato.

## Lo que este proyecto considera "terminado"

Nada está terminado sin haberlo visto en captura. "Compila" no es "está bien" — y aquí eso costó
una web publicada en blanco durante horas, con los cinco comprobadores en verde, porque el verde
era de dos commits atrás.
