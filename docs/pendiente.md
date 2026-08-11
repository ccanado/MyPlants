# Alcance y lo que queda fuera

Escrito el **11 de agosto de 2026** por decisión de Carlos, después de constatar que el proyecto no
tenía definición de "terminado" y se estaba alimentando a sí mismo. **Actualizado el 12 de agosto**,
al aplicar la piel oscura.

Este fichero manda sobre las colas de todos. **Nada que no esté en la sección de alcance genera
trabajo.**

## Por qué existe

El proyecto tenía una definición de terminado por tarea —que se vea en captura— y ninguna para el
conjunto. El equipo desarrolló además un hábito excelente que es a la vez el motor del bucle: cada
hallazgo genera un meta-hallazgo sobre el instrumento que lo encontró, ese genera una regla de
proceso, y esa genera otra auditoría. Solo el 11 de agosto hubo **siete** casos. Mejora la calidad
de verdad y **no converge solo**.

## v1 — cerrada el 12 de agosto de 2026

| # | Qué | Estado |
| --- | --- | --- |
| 1 | `overflow: clip` en la tarjeta para que la columna de acción pegue | **hecho** |
| 2 | `data-tarea`, `data-planta`, `data-tarea-estado` | **hecho** |
| 3 | **Vuelta de riqueza visual** — las cuatro palancas de Carlos | **hecho**: piel oscura aplicada a la web entera |
| 4 | La franja `HOY` muestra **todas** las tareas del día | **hecho** |
| 5 | El tiempo relativo se **calcula** en el render | **hecho** |
| 6 | Firma del expediente: ocupación medida en worktree limpio | **hecho** |
| 7 | Pasada final con capturas y §10/§11 | **hecho** — `docs/qa/informe-4.md` |

Las cuatro cosas que Carlos echaba en falta el 11 de agosto —las fotos, el color, la profundidad y
el movimiento— están resueltas, y las cuatro por el mismo cambio: **el sujeto vuelve a su propia
portada.** Las fotos traen el color real de las plantas sin añadir un acento de paleta; la
profundidad la dan tres superficies, un filo de luz y la oclusión; el movimiento son la entrada
escalonada, el revelado del veredicto y el descubrimiento del expediente, los tres con versión
alternativa bajo `prefers-reduced-motion`.

Condiciones que no se negociaron en ninguno de los siete, y siguen sin negociarse: cero nodos de
texto por debajo de AA, cero bordes de control por debajo de 3:1, cero saltos de orden de foco,
cero desborde horizontal, cero recursos de terceros, `prefers-reduced-motion` con **versión
alternativa** y no solo duración corta, y consola limpia. **Si una idea cuesta una de esas cifras,
la idea está mal, no la cifra.**

Y la regla de contenido, que tampoco: esto se cumple ocupando el ancho, añadiendo anclas de
navegación y borrando gráficos que no informan. **Nunca recortando observaciones, causas, límites
ni fuentes.**

## Lo que queda, y por qué no está hecho

Por orden. El detalle de cada uno, en `docs/retomar.md`.

1. **Las `notas` de la casa.** Vacías en las siete. **No lo puede hacer un agente**: es la voz de
   quien riega. Una frase por planta basta. No se inventan nunca.
2. **El índice de síntomas como lista navegable.** El nivel 1 está hecho —el buscador ya indexa
   `senales`, `causas[].resumen` y `patron`, así que el placeholder dejó de mentir—. Falta la
   entrada por síntoma como lista, generada de esos campos y no de una taxonomía fija: así cada
   entrada tiene al menos una planta por construcción. Va en el buscador, no en la portada.
3. **Los presupuestos de peso sin derivar.** `css/app.css` pesa 78,8 KB contra un tope de 60 y
   `js/` 156,6 KB contra 60. Los dos topes son números redondos sin procedencia, igual que el
   20/62/600. **Un tope que se incumple en verde no es un tope**: o se deriva o se retira.
4. **Los tres umbrales sin derivar.** El 62 % de la ocupación, el tope del 20 % y los 600 px de
   carrera sin ancla. Cumplen los tres; el criterio de aprobado no está justificado.
5. **La prueba del imperativo a los dos skills.** `.claude/skills/vanilla-web-craft/` y
   `plant-expert/` están escritos en imperativo y **son el vehículo más peligroso del ascenso de
   calificadores**, porque se leen como el manual del proyecto. La prueba es barata: leer cada
   imperativo y preguntar *«¿esto tiene dueño humano, o soy yo con voz de norma?»*.
6. **La propuesta de `botanist`** para hacer comprobable una cita correcta que apunta al taxón
   equivocado.
7. **Fotos nuevas** cuando Carlos quiera registrar un estado nuevo. El esquema ya es histórico, y
   la ficha diagnostica un momento fechado y no el presente.
8. **`docs/inventario.md` sigue siendo una plantilla en blanco** mientras `CLAUDE.md` lo presenta
   como el input humano del contenido. O se rellena o se sustituye por un puntero que diga que el
   inventario se recogió hablando. Decide Carlos.

## Qué hacer con los hallazgos de instrumental

Van a `docs/aprendizaje.md` y **no generan tarea para nadie**, con una sola excepción: que impidan
verificar algo del alcance. Un test que miente sobre un punto que hay que firmar sí se arregla; un
test que miente sobre algo fuera de alcance se anota.

El 12 de agosto hubo cinco hallazgos y **dos cayeron en la excepción**: que el runner no pueda
medir 320 px de verdad (impedía firmar «cero desborde a 320») y que ningún comprobador mire si un
`background-image` llega a pintarse (había un código de barras que no se pintaba desde el primer
día). Los otros tres están anotados y no generaron trabajo.

Esto no es desprecio por ese trabajo — es de lo mejor que ha producido el proyecto. Es que su valor
está en quedar escrito para el próximo, no en consumir este.
