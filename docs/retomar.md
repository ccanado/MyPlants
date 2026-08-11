# Retomar el trabajo — relevo para un solo agente

Escrito por el lead al **cerrar el equipo el 11 de agosto de 2026**. Sustituye al relevo anterior.

**Se trabaja en solitario.** El equipo de cinco agentes que construyó esto está parado y el modo
Agent Teams retirado. Si encuentras referencias a `ux-lead`, `builder`, `botanist`, `qa-visual` o
`ui-designer`, son **el registro de quién escribió qué**, no instrucciones: no hay nadie a quien
mandar un mensaje.

Lee, en este orden: este fichero, `CLAUDE.md`, y **`docs/aprendizaje.md`** — que no es opcional,
porque documenta doce formas en que los instrumentos de este proyecto han mentido, y vas a usar
esos instrumentos.

---

## LA TAREA 1, decidida por Carlos: aplicar el diseño de `alternativa/`

**Carlos ha visto las dos versiones y elige la de `alternativa/`.** Textual: *"me gusta el diseño
de alternativa; que quede que el agente único que lance lo aplique cuando todos ellos terminen
aquí"*, y luego: *"no hace falta que lo hagan ahora; que quede todo lo hecho para que cuando
cerremos el team y yo arranque un solo agente, lo aplique."*

**Empieza leyendo `alternativa/LEEME.md`**, que su autor escribió como mapa de aplicación: qué
tokens cambian, qué reglas se sustituyen, qué no implementó y qué decisiones tomó y por qué.

### Qué es y por qué se eligió

Fondo casi negro cálido, **las fotos a sangre llevando la página**, y chartreuse ácido como acento
—sacado del coleo grande real, que es chartreuse con granate de vino—. El veredicto del día
(`3 DE 7 PIDEN MIRADA`) a escala de display. Las fichas agrupadas en dos secciones, **PIDEN
MIRADA** y **ESTÁN BIEN**, con su recuento. Cada tarjeta: distintivo de severidad con **palabra**
además de color, nombre, nombre científico, una línea de diagnóstico y los datos en monoespaciada.

Se eligió porque resuelve las cuatro cosas que Carlos echaba en falta —las fotos no se veían, el
color solo existía como alarma, faltaba profundidad y faltaba movimiento— y porque su diagnóstico
era correcto: el diseño anterior **presumía de esquivar el cliché de "web de plantas" exhibiendo la
ausencia de las fotos como prueba de virtud**, y esa ausencia era justo la queja.

Dos efectos colaterales buenos que conviene conservar al aplicarlo:

- **Agrupar en «piden mirada» / «están bien» resuelve el problema del día bueno**: cuando ninguna
  planta necesite nada, la primera sección desaparece y la página dice `ESTÁN BIEN · 7 de 7` sin
  tener que inventar urgencia. Ese estado es el que el proyecto existe para producir.
- **La foto del helecho no desaparece sobre fondo oscuro**, que era el riesgo que se temía: está
  tomada de noche y casi negra, y sobre oscuro se integra en lugar de perderse.

### Lo que NO puede perderse al aplicarlo

Esto es lo que más riesgo tiene, porque `alternativa/` es una piel de portada y ficha, y la versión
principal tiene **dos días de funcionalidad y contenido** que su autor no reimplementó:

- El **expediente a dos columnas semánticas** (`QUÉ HAGO AHORA` / `EN QUÉ ME BASO`), con la de
  acción primero en el DOM y `position: sticky`. Bajó el hueco vacío del 53–65 % al 0–7 %.
- La **franja `HOY`** con la fecha real del navegador, **una línea por planta**, y **la guarda de
  seguridad**: una tarea con `condicion` **nunca** entra en el día. Sin eso, la web le dice a Noah
  que abone un helecho sin hojas, que es el único fallo capaz de matar una planta.
- Los **diagramas**: riego, luz como hueco entre lo que quiere y lo que tiene, rango térmico con la
  banda de la casa rotulada **como banda de la casa**, y la cronología con eje logarítmico de
  verdad (verificado por regresión: R² 0,9995 contra log).
- Las **siete siluetas de hoja** con el rasgo diagnóstico de cada especie, y la del helecho con la
  trama de sin-dato **dentro del contorno** porque su especie no está identificada.
- Los **diez iconos de campo**, la búsqueda, los filtros, el histórico de estados y las fuentes
  citadas al pie de cada campo.

### El suelo que no se negocia, y aplica a la piel nueva igual que a la vieja

- **Cero recursos de terceros** en runtime. Sin CDN, sin Google Fonts, sin librerías.
- **HTML + CSS + JS vanilla, sin build step.** Se sirve estático y funciona.
- **Cero nodos de texto por debajo de AA**, cero bordes de control por debajo de 3:1, cero saltos de
  orden de foco, cero desborde horizontal a 320 px, consola limpia.
- **`prefers-reduced-motion` con versión alternativa**, no con duración corta: 1 ms parpadea.
- **Ninguna información transmitida solo por color.**
- **Las fotos de diagnóstico no se filtran.** Ni duotono, ni grado, ni viñeta. Más grandes y mejor
  presentadas sí; mejor de lo que están, no. En la única planta que se muere, embellecer la foto
  corrompe la prueba.
- **Ni un dato inventado.** Siete plantas y son las que hay. Un campo vacío está vacío a propósito.

---

## Estado al cerrar

Publicado en **https://ccanado.github.io/MyPlants/** (Pages desde `main`, se actualiza en cada
push). En local: `python3 -m http.server 8000`.

Medido en worktree limpio sobre el último commit del equipo:

```
ocupación del ancho 0 % (tope 20 %) · carrera sin ancla 506 px (tope 600)
0 de 1.740 nodos de texto bajo AA · 0 bordes de control < 3:1
0 saltos de orden de foco / 293 enfocables · cero desborde a 320 y 1280
cero recursos de terceros · consola limpia · diez comprobadores en verde
```

**Contenido:** siete plantas verificadas con 15–19 fuentes citadas cada una, histórico de estados
fechados, tareas con condiciones, y los huecos declarados en vez de rellenados.

---

## Pendiente, por orden

1. **Aplicar `alternativa/`** — arriba. Es la tarea grande.
2. **Una pasada de QA final con capturas**, sellada contra un commit concreto. `python3
   tests/runner.py` y `docs/qa/checklist.md`. Es lo único del alcance de v1 que quedó sin firmar,
   porque el equipo se cerró antes: **los cinco puntos de código están hechos**, incluido el
   buscador dentro de la franja (commit `18fdf35`), que cerró el hueco de 325 px de la cabecera y
   dos críticas de QA.
3. **Las `notas` de Carlos.** Vacías en las siete. Es la única cosa que no puede hacer un agente:
   la voz de las personas de la casa. El panel solo se renderiza con contenido, así que hoy no se ve
   un hueco — se ve una web sin voz. **No las inventes nunca.**
4. **El índice de síntomas.** Aprobado en concepto: se genera de `senales` y `patron`, no de una
   taxonomía fija, así que cada entrada tiene al menos una planta por construcción. Va en el
   buscador. Es la única promesa incumplida que queda: el placeholder dice "planta, sala o síntoma"
   y el contenido no está organizado así.
5. **Backlog sin dueño**, con su razonamiento en `docs/pendiente.md`: revisar los umbrales sin
   derivar (el 62 % de la ocupación, los 600 px de carrera), pasar la prueba del imperativo a los
   dos skills, y la propuesta de `botanist` para hacer comprobable una cita correcta que apunta al
   taxón equivocado.

---

## Cómo trabajar sin tropezar con el instrumental

Esto ahorra horas y está aquí porque el equipo las perdió:

- **`python3 tests/runner.py` se niega a medir con el árbol sucio**, y es deliberado: sale con
  `exit 3` antes de abrir el navegador. La salida es `--raiz` sobre un worktree limpio:
  ```
  git worktree add --detach /tmp/verif HEAD
  cd /tmp/verif && python3 tests/runner.py --puerto 8123
  ```
  Hay `--sucio` para medir el árbol a propósito, y estampa `NO ATRIBUIBLE` en cada línea.
- **`--url` audita la web publicada.** Es la única medición inmune al problema del estado en
  movimiento, porque **producción no puede estar sucia**.
- **`--completa` no captura la página entera** —Chrome ignora el flag— y el runner protesta cuando
  lo detecta. Para ver algo largo, `--alto` grande.
- **Para saber si algo está hecho: `git show HEAD:fichero`, nunca `grep` sobre el directorio.** Un
  `grep` responde sobre un estado que no existe para nadie más.
- Los tres comprobadores de los skills: `check-tokens.py`, `check-estatico.py` y
  `validar-plantas.py`. Y `docs/qa/como-ejecutar.md` para el resto.
- **Un `TypeError` en un módulo de render no se ve**: se traga el trozo de interfaz y la página
  parece bien. `js/datos.js` tiene `avisarDeCamposAusentes()` para eso; úsalo.
- El estado vigente de una planta se lee con **`estadoVigente(p)`**, que ordena por `fecha_foto`.
  **Nunca `estados[0]`**: el orden de un array es una convención y la fecha es un dato.

## Lo que este proyecto considera "terminado"

Nada está terminado sin haberlo visto en captura. "Compila" no es "está bien" — y aquí eso costó
una web publicada en blanco durante horas, con los cinco comprobadores en verde, porque el verde
era de dos commits atrás.
