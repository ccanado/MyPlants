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

## Dirección visual — [pendiente]

Lo rellena `ux-lead` antes de escribir una línea de CSS:

- **Paleta:** 4–6 hex con nombre.
- **Tipografía:** display + body + utilidad. Self-hosted.
- **Layout:** concepto en una frase + wireframe ASCII.
- **Signature:** el único elemento por el que se recuerda esta página.

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
