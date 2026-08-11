# Alcance congelado y lo que queda fuera

Escrito por el lead el **11 de agosto de 2026**, por decisión de Carlos, después de
constatar que el proyecto no tenía definición de "terminado" y se estaba alimentando a sí mismo.

Este fichero manda sobre las colas de todos los teammates. **Nada que no esté en la sección
"Alcance de v1" genera trabajo.**

## Por qué existe

El proyecto tenía una definición de terminado por tarea —que `qa-visual` la vea en captura— y
ninguna para el conjunto. El equipo desarrolló además un hábito excelente que es a la vez el
motor del bucle: cada hallazgo genera un meta-hallazgo sobre el instrumento que lo encontró, ese
genera una regla de proceso, y esa genera otra auditoría. Solo el 11 de agosto hubo **siete**
casos. Mejora la calidad de verdad y **no converge solo**.

## Alcance de v1 — esto y nada más

| # | Qué | Dueño | Estado |
| --- | --- | --- | --- |
| 1 | `overflow: clip` en `.etiqueta` para que `.expediente__accion` pegue | `builder` | abierto |
| 2 | `data-tarea`, `data-planta`, `data-tarea-estado`, `data-tick` | `builder` | abierto |
| 3 | El parte del día pasa de cintillo a **hero**, con el `h1` a antetítulo | `builder` desde spec de `ux-lead` | spec pendiente |
| 4 | La declaración de límites de la foto, **en banda sólida al lado**, con su `fecha_foto` | `builder` | spec pendiente |
| 5 | Que el **despegue despegue**: bisagra por un canto, expediente descubierto por debajo | `builder` | spec pendiente |
| 6 | Firma del expediente: ocupación medida en **worktree limpio** | `ux-lead` | bloqueado por 1 |
| 7 | Pasada final con capturas y §10/§11 | `qa-visual` | bloqueado por 1–5 |

Condiciones que no se negocian en ninguno de los siete: cero nodos de texto por debajo de AA,
cero bordes de control por debajo de 3:1, cero saltos de orden de foco, cero desborde
horizontal, cero recursos de terceros, `prefers-reduced-motion` con **versión alternativa** y no
solo duración corta, y consola limpia. **Si una idea cuesta una de esas cifras, la idea está
mal, no la cifra.**

Y la regla de contenido, que tampoco: esto se cumple ocupando el ancho, añadiendo anclas de
navegación y borrando gráficos que no informan. **Nunca recortando observaciones, causas,
límites ni fuentes.**

## Fuera de v1 — backlog, especificado y sin dueño activo

- **El índice de síntomas.** Aprobado en concepto y con la decisión de construcción tomada: se
  genera de `senales` y `patron`, no de una taxonomía fija, así que cada entrada tiene al menos
  una planta por construcción. Va en el buscador, no en la portada. Es la única promesa
  incumplida que queda: el placeholder dice "planta, sala o síntoma" y el contenido no está
  organizado así.
- **Que el hero funcione el día bueno.** Diseñar qué dice la portada cuando ninguna planta
  necesita mirada, sin inventar urgencia. Es el estado que el proyecto existe para producir.
- **Revisar el umbral de la métrica de ocupación.** El 62 % y el tope del 20 % no están
  derivados. La mejora medida (del 73–87 % al 9 %) es sólida; el criterio de aprobado no.
- **Revisar el tope de 600 px** de carrera sin ancla de navegación, con la derivación delante,
  después de tener la primera lectura post-expediente.
- **Las notas personales de Carlos.** `notas` está vacío en las siete. El panel de cuaderno solo
  se renderiza con contenido, así que no se ve ningún hueco, pero es la capa por la que ese
  panel existe.
- **Fotos nuevas** cuando Carlos quiera un estado nuevo. El esquema ya es histórico.

## Qué hacer con los hallazgos de instrumental

Van a `docs/aprendizaje.md` y **no generan tarea para nadie**, con una sola excepción: que
impidan verificar algo del alcance de v1. Un test que miente sobre un punto que hay que firmar
sí se arregla; un test que miente sobre algo que está fuera de alcance se anota.

Esto no es desprecio por ese trabajo — es de lo mejor que ha producido el equipo. Es que su
valor está en quedar escrito para el próximo proyecto, no en consumir este.
