# MyPlants

Web estática con las fichas de cuidado de las plantas que Carlos tiene en casa.

El criterio de éxito es que la web sea **visualmente excelente** y que su contenido sea fiable:
todo dato verificado con su fuente, y todo hueco declarado en vez de rellenado a ojo.

El proyecto nació también como sandbox para aprender Agent Teams. **Esa fase está cerrada** y se
trabaja en solitario; lo aprendido está en `docs/aprendizaje.md`, que es la mitad del entregable y
se escribió a base de equivocarse.

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
assets/img/             fotos de ficha (800×1067) y de etiqueta (500×667)
assets/img/rejilla/     derivados de 480×640 para la rejilla — mismo encuadre, la mitad de tamaño.
                        La ruta la deriva js/datos.js del campo `foto`: cuál es el fichero pequeño
                        de una foto es presentación, no contenido
docs/                   ver el mapa de abajo: un fichero de estado y el resto, registro
tests/                  los comprobadores, y docs/qa/ sus informes sellados
```

## Los documentos: uno es estado, el resto es registro

Esta distinción existe porque el proyecto ya se ha equivocado por lo contrario. El 12 de agosto la
misma lista de pendientes estaba escrita en tres ficheros a la vez, y **un documento que se queda
desfasado no avisa: alguien lo cita como si fuera cierto.** Antes de crear un fichero nuevo en
`docs/`, mira si su sitio es uno de estos.

| Fichero | Qué es | Se actualiza |
| --- | --- | --- |
| **`docs/retomar.md`** | **EL ESTADO.** Qué es la web hoy, qué queda y cómo trabajar sin tropezar con los instrumentos. Es por donde se empieza | **sí, siempre** — y es el único |
| `docs/decisiones.md` | REGISTRO. Una línea por decisión, con la alternativa descartada y el motivo | solo crece, por vueltas |
| `docs/aprendizaje.md` | REGISTRO. Los instrumentos que han mentido y el mecanismo de coordinación. **No genera trabajo** salvo que impida verificar algo | solo crece |
| `docs/brief.md` | REGISTRO. La dirección visual y cómo se llegó a ella. **Su piel está sustituida**; dos tercios son historia y lleva su propio aviso al principio | no |
| `docs/inventario.md` | INPUT HUMANO. Las siete plantas y el hueco de las notas de la casa | lo rellena Carlos |
| `docs/qa/checklist.md` | El criterio de aceptación, punto por punto | cuando cambia un criterio |
| `docs/qa/como-ejecutar.md` | Cómo se pasa cada comprobador y qué NO mide cada uno | cuando cambia un instrumento |
| `docs/qa/informe-N.md` | REGISTRO. Cada pasada, sellada contra un commit y una fecha | solo se añade uno nuevo |

**Regla dura:** ningún color, tamaño de fuente ni espaciado se escribe a mano fuera de
`css/tokens.css`. En el resto del CSS solo `var(--…)`. Si falta un token, se añade al fichero
de tokens, no se hardcodea. Y si al terminar hay tokens definidos y sin usar, se borran o se usan:
paleta muerta es deuda, y `check-tokens.py` los cuenta.

## Contenido

`content/plantas.json` es la única fuente de verdad. Campos por planta:

`id`, `nombre_comun`, `nombre_cientifico`, `familia`, `foto`, `historia`, `riego`, `luz`,
`humedad`, `temperatura`, `sustrato`, `abonado`, `trasplante`, `plagas_comunes`,
`toxicidad_mascotas`, `dificultad`, `notas_carlos`, `fuentes`

Reglas de contenido:

- **La lista de plantas la da Carlos.** No inventar plantas ni añadir especies "de relleno" para
  que la rejilla quede simétrica.
- Los datos botánicos se **verifican** y se citan en `fuentes` (POWO/Kew, RHS, GBIF).
  Si un dato no se puede verificar, se marca como `null` y se anota — nunca se rellena a ojo.
- `toxicidad_mascotas` es información de seguridad: se cita fuente siempre, o se deja `null`.
- `historia` y `notas` son personales. Se preguntan; **no se fabrican nunca**. `notas` está vacío
  en las siete y es el hueco más grande que tiene el proyecto: el panel del cuaderno solo se pinta
  con contenido, así que no se ve un hueco — se ve una web sin voz. El sitio para escribirlas es
  `docs/inventario.md`.

## Cómo se trabaja aquí

**Se trabaja en solitario.** El proyecto se construyó con un equipo de agentes en paralelo los
días 10 y 11 de agosto de 2026, y ese modo está retirado. Si lees referencias a `ux-lead`,
`builder`, `botanist`, `qa-visual` o `ui-designer` en `docs/`, son **el registro de quién escribió
qué**, no instrucciones: no hay nadie a quien mandar un mensaje.

Empieza por **`docs/retomar.md`**, que dice en qué estado está todo y qué queda.

Qué escribió cada uno, que sigue siendo útil para saber dónde buscar el porqué de algo:

| Quién fue | Qué ficheros |
| --- | --- |
| `ux-lead` | `css/tokens.css`, `docs/brief.md`, `docs/decisiones.md` |
| `builder` | `index.html`, `css/app.css`, `js/`, `assets/img/` |
| `botanist` | `content/plantas.json` |
| `qa-visual` | `tests/`, `docs/qa/` |
| `ui-designer` | la piel oscura que hoy tiene la web. La propuso en `alternativa/`, Carlos la eligió
  mirando las dos versiones y el 12 de agosto de 2026 se aplicó a la web entera; la carpeta se
  borró y queda su captura en `docs/qa/piel-elegida-alternativa-1280.png` |

## Proceso

- **Nada se considera terminado sin haberlo visto en captura.** "Compila" no es "está bien", y
  esto se ha cobrado una web publicada en blanco durante horas — y un código de barras que no se
  pintó nunca con los diez comprobadores en verde, porque ninguno mira si un `background-image`
  llega a pintarse.
- **Una medición se sella con el commit y con el DÍA.** El contenido de la portada se calcula con
  `new Date()`: el «cero desborde» del 11 de agosto era falso el 12 sin que nadie tocara nada.
- **No se mide con el árbol sucio.** `python3 tests/runner.py` se niega a dar número si hay
  ficheros sin commitear, y es deliberado: la salida es `--raiz` sobre un worktree limpio. Para
  comprobar si algo está hecho, `git show HEAD:fichero`, nunca `grep` sobre el directorio.
- Las decisiones con alternativas descartadas van a `docs/decisiones.md`, una línea por decisión.
- **Los hallazgos sobre el instrumental y la coordinación van a `docs/aprendizaje.md` y no generan
  trabajo**, salvo que impidan verificar algo del alcance. Ese fichero recoge doce casos del mismo
  patrón y merece leerse antes de fiarse de un test.
- **El imperativo está reservado a lo que tiene dueño humano.** Lo que escriba un agente se redacta
  como propuesta con su motivo, porque una recomendación citada varias veces asciende a requisito
  sin que nadie mienta. Ocurrió: una restricción de diseño escrita por un asistente se le citó a
  Carlos dos días como si fuera su encargo. Ver `docs/aprendizaje.md`.
- Sobre el "look de IA": si una elección de paleta, tipografía o layout es la que harías para
  cualquier otra web, es un default y no una elección. **Pero es un argumento, no una prohibición**
  — y si Carlos prefiere la opción convencional, gana Carlos.
