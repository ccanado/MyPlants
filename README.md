# MyPlants

Fichas de cuidado de las siete plantas que hay en un salón de Móstoles.

No es un catálogo botánico. Es el manual de una casa concreta, con plantas concretas que
alguien riega de verdad — y ese alguien es Noah, que es quien las cuida. La página existe
para dos momentos: cuando una planta tiene un problema **ahora mismo**, y cuando vas a regar
y no te acuerdas de cuánto.

**Web:** https://ccanado.github.io/MyPlants/ (Pages desde `main`, se actualiza en cada push)

## Verla en local

No hay nada que instalar, ni build, ni `npm install`. Desde la raíz del repo:

```bash
python3 -m http.server 8000
```

Y abrir `http://localhost:8000`. Hace falta el servidor: los ES modules y `fetch` no funcionan
abriendo el fichero con doble clic (`file://`).

## Las plantas

Siete, las que hay. Ni una de relleno para que la rejilla quede simétrica.

| Planta | Especie | En casa desde |
| --- | --- | --- |
| Poto | *Epipremnum aureum* | hace más de 20 años |
| Begonia Elatior | *Begonia × hiemalis* | 29 de mayo de 2026 |
| Helecho | sin identificar — ver abajo | 29 de mayo de 2026 |
| Coleo pequeño | *Coleus scutellarioides* | 11 de agosto de 2026 |
| Coleo grande | *Coleus scutellarioides* | 11 de agosto de 2026 |
| Ficus Sunny | *Ficus pumila* | 11 de agosto de 2026 |
| Margarita | *Chrysanthemum × morifolium* | 11 de agosto de 2026 |

La "margarita" del vivero resultó ser un crisantemo de floristería, no una margarita
arbustiva. El "helecho" se secó y se podó a ras, y sin fronde desarrollada no hay evidencia
para llegar a especie: su ficha lo dice en lugar de elegir un binomio por eliminación.

## Cómo se decide qué se escribe

La regla que gobierna el contenido: **si no se puede verificar, va como `null` con una nota
que explique por qué.** Un hueco honesto es información útil; un dato plausible inventado
envenena la ficha entera, porque el lector ya no sabe qué partes creer.

- Los datos botánicos se verifican y se citan **campo por campo**, con la URL que se abrió y
  la fecha. Entre 15 y 19 fuentes por planta. Las citas van visibles al pie de cada campo, con
  el dominio a la vista — son contenido, no letra pequeña.
- Reparto de autoridad: [POWO](https://powo.science.kew.org/) para nomenclatura,
  [RHS](https://www.rhs.org.uk/plants/) para cultivo, [GBIF](https://www.gbif.org/) para
  distribución, [ASPCA](https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants)
  para toxicidad. Cada fuente manda sobre lo suyo y sobre nada más.
- El consejo de cultivo está **traducido a esta casa**: Móstoles, ventanal a noreste con sol
  directo a primera hora, aire acondicionado en verano con techo de 28 °C, calefacción en
  invierno. Una guía británica no sabe nada de eso.
- Los datos personales —de dónde vino cada planta, qué se ha aprendido fallando— **se preguntan
  y no se fabrican**.
- El estado de salud se diagnostica desde foto, separando lo observado de lo deducido, con
  tratamiento, plazo de revisión y **qué no se puede saber desde una foto**.

## Restricciones del stack

Duras, y son parte del encargo:

- HTML + CSS + JavaScript **vanilla**. Sin framework, sin build step, sin bundler, sin una sola
  dependencia. Servir ficheros estáticos y listo.
- CSS nativo moderno: custom properties, nesting, `@layer`, container queries, `color-mix()`,
  `:has()`, `@property`.
- **Cero requests a terceros en runtime.** Tipografías self-hosted en `assets/fonts/`. Ni CDN,
  ni Google Fonts, ni analytics.
- Ningún color, tamaño de fuente ni espaciado se escribe a mano fuera de `css/tokens.css`.
  En el resto del CSS, solo `var(--…)`.
- Accesibilidad AA: HTML semántico, navegable con teclado, foco visible, contraste medido y no
  estimado, `prefers-reduced-motion` respetado en todas las animaciones — incluidas las de los
  SVG explicativos, donde `reduce` no apaga la animación sino que cambia de versión.

Tres scripts hacen exigibles esas reglas en vez de solo pedirlas:

```bash
python3 .claude/skills/vanilla-web-craft/scripts/check-tokens.py     # literales fuera de tokens.css, var() sin definir
python3 .claude/skills/vanilla-web-craft/scripts/check-estatico.py   # terceros, <img> sin dimensiones, señales de build
python3 .claude/skills/plant-expert/scripts/validar-plantas.py       # campos, huecos anotados, toxicidad con fuente
```

## Estructura

```
index.html              una sola página
css/tokens.css          design tokens — única fuente de color, tipografía y espaciado
css/app.css             layout y componentes, solo var(--…)
js/                     ES modules: datos, render de ficha, filtros, estado, SVG
content/plantas.json    única fuente de verdad del contenido
assets/fonts/           tipografías self-hosted (woff2, subseteadas a latín)
assets/img/             fotos de ficha; assets/img/rejilla/ son sus derivados de 480×640
docs/brief.md           dirección visual y de contenido
docs/decisiones.md      log de decisiones, con las alternativas descartadas
docs/qa/                checklist de aceptación, capturas e informes
tests/                  comprobaciones de contraste, foco, movimiento, terceros y estructura
.claude/skills/         los dos skills que dirigen el trabajo
```

Las fotos originales del móvil no están en el repo (34 MB): solo las versiones web derivadas, en
`assets/img/` (800×1067 para la ficha) y sus derivados de rejilla en `assets/img/rejilla/`
(480×640, el mismo encuadre a la mitad). Las siete de ficha en la rejilla serían ~1 MB de carga
inicial; los derivados suman 468 KB y con `loading="lazy"` solo baja lo que se ve.

Y una nota de documentación, porque el proyecto se ha equivocado por lo contrario: **`docs/` tiene
un solo fichero de estado —`docs/retomar.md`— y el resto es registro histórico.** El mapa está en
`CLAUDE.md`.

## El otro objetivo: aprender Agent Teams

Este proyecto es también un sandbox para probar equipos de agentes con
[Claude Code](https://claude.com/claude-code). Se hizo en paralelo con cuatro teammates y un
reparto **estricto** de ficheros, porque dos agentes editando el mismo fichero se pisan:

| Teammate | Rol | Ficheros que posee |
| --- | --- | --- |
| `ux-lead` | Dirección visual: tokens, tipografía, layout, motion | `css/tokens.css`, `docs/brief.md` |
| `builder` | HTML semántico, CSS de componentes, JS | `index.html`, `css/app.css`, `js/`, `assets/img/` |
| `botanist` | Contenido: especies, cuidados, toxicidad, fuentes | `content/plantas.json` |
| `qa-visual` | Screenshots, a11y, rendimiento, revisión visual | `tests/`, `docs/qa/` |
| `ui-designer` | La piel oscura que hoy tiene la web, propuesta como versión alternativa a comparar | — |

Dos skills propios (`.claude/skills/`) codifican el criterio en lugar de repetirlo en cada
prompt: **`vanilla-web-craft`** para construir sin build step, y **`plant-expert`** para no
inventarse datos botánicos.

Lo que se observó por el camino está en `docs/aprendizaje.md`, que es la mitad del entregable y se
escribió a base de equivocarse: diecisiete casos de instrumentos que afirman lo que no pueden
saber. Un par de cosas que merecen contarse: los teammates se corrigieron entre ellos y las correcciones fueron buenas
—`botanist` avisó a `ux-lead` de que no había ninguna planta con "no tóxica" confirmada, así que
un distintivo verde habría mentido en cinco de siete fichas—, y el lead se equivocó al menos dos
veces con datos que había deducido en vez de preguntar. Los mensajes de commit registran las dos.

Y el cierre del sandbox lo dijo `ux-lead` mejor que nadie: **un equipo de agentes puede mejorar
indefinidamente algo que ya estaba bien, y la única cosa que no puede hacer solo es decidir que ha
terminado.**

## Cómo se ve

Campo oscuro cálido, las siete fotos llevando la página y chartreuse ácido —el borde de hoja del
coleo grande real— como único acento. El veredicto del día a escala de display, y las fichas en dos
bandas: **piden mirada** y **están bien**. Cuando ninguna necesite nada, la primera desaparece y la
página dice `ESTÁN BIEN · 7 DE 7` sin inventar urgencia — que es el estado que esto existe para
producir.

La paleta no sale de un moodboard: sale de las mismas fotos. El campo es el marrón casi negro de la
encimera y de la foto nocturna del helecho; el ácido, el borde de hoja del coleo; el rosa de la
alarma, la vena de ese mismo coleo.

## Estado

El contenido está verificado y validado, el diseño elegido por Carlos entre dos versiones
renderizadas y aplicado, y los diez comprobadores en verde. Lo que queda está en
`docs/retomar.md`, y lo primero de la lista no lo puede hacer un agente: las notas de la casa,
que son la voz de quien riega.

## Licencias

El código es de Carlos Cañado. Las tipografías son de terceros y se redistribuyen bajo
[SIL Open Font License 1.1](https://openfontlicense.org/):

- **Archivo Narrow** — Omnibus-Type
- **Alegreya Sans** — Huerta Tipográfica
- **IBM Plex Mono** — IBM / Bold Monday

Las fotos de las plantas son de Carlos. Los datos botánicos son de sus fuentes, citadas una a
una en `content/plantas.json`.
