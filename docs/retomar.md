# Retomar el trabajo — relevo

Reescrito el **12 de agosto de 2026**, después de aplicar la piel oscura. Sustituye al relevo
anterior, que mandaba leer un fichero que no existe y firmaba un «cero desborde» que ese día ya era
falso.

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

## Lo que la piel NO se llevó por delante, y es lo que más riesgo tenía

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

## El suelo que no se negocia, y aplica a la piel nueva igual que a la vieja

- **Cero recursos de terceros** en runtime. Sin CDN, sin Google Fonts, sin librerías.
- **HTML + CSS + JS vanilla, sin build step.** Se sirve estático y funciona.
- **Cero nodos de texto por debajo de AA**, cero bordes de control por debajo de 3:1, cero saltos
  de orden de foco, cero desborde horizontal a 320 px, consola limpia.
- **`prefers-reduced-motion` con versión alternativa**, no con duración corta: 1 ms parpadea.
- **Ninguna información transmitida solo por color.** La severidad lleva palabra, punto y filete.
- **Las fotos de diagnóstico no se filtran.** Ni duotono, ni grado, ni viñeta. Más grandes y mejor
  presentadas sí; mejor de lo que están, no. En la única planta que se muere, embellecer la foto
  corrompe la prueba.
- **Ni un dato inventado.** Siete plantas y son las que hay. Un campo vacío está vacío a propósito.

---

## Pendiente, por orden

1. **Las `notas` de la casa.** Vacías en las siete. Es la única cosa que no puede hacer un agente:
   la voz de las personas que viven ahí. El panel solo se renderiza con contenido, así que hoy no
   se ve un hueco — se ve una web sin voz. **No las inventes nunca.**
2. **El índice de síntomas como lista navegable.** El nivel 1 ya está hecho: el buscador indexa
   `senales`, `causas[].resumen` y `patron`, así que «hojas amarillas» encuentra algo y el
   placeholder dejó de mentir. Lo que queda es la entrada por síntoma como lista, generada de esos
   mismos campos y no de una taxonomía fija — así cada entrada tiene al menos una planta por
   construcción. Va en el buscador, no en la portada.
3. **Los presupuestos de peso sin derivar.** `peso-assets.py` avisa de `css/app.css` (78,8 KB
   contra un tope de 60) y de `js/` (156,6 KB contra 60). Los dos topes son números redondos sin
   procedencia, como el 20/62/600. O se derivan o se retiran: un tope que se incumple en verde no
   es un tope.
4. **Los tres umbrales sin derivar**: ocupación ≤20 %, tinta parando antes del 62 %, carrera de
   600 px sin ancla. Cumplen los tres; ninguno está justificado.
5. **La prueba del imperativo a los dos skills.** `.claude/skills/vanilla-web-craft/` y
   `plant-expert/` están escritos en imperativo y son el vehículo más peligroso del ascenso de
   calificadores, porque se leen como el manual del proyecto. La prueba es barata: leer cada
   imperativo y preguntar *«¿esto tiene dueño humano, o soy yo con voz de norma?»*.
6. **La propuesta de `botanist`** para hacer comprobable una cita correcta que apunta al taxón
   equivocado.

## Cómo trabajar sin tropezar con el instrumental

Esto ahorra horas y está aquí porque el equipo las perdió:

- **`python3 tests/runner.py` se niega a medir con el árbol sucio**, y es deliberado. La salida es
  `--raiz` sobre un worktree limpio:
  ```
  git worktree add --detach /tmp/verif HEAD
  cd /tmp/verif && python3 tests/runner.py --puerto 8123
  ```
  Hay `--sucio` para medir el árbol a propósito, y estampa `NO ATRIBUIBLE` en cada línea.
- **Y séllala también con el DÍA.** El contenido de la portada se calcula con `new Date()`: el
  «cero desborde» del 11 de agosto era falso el 12 sin que nadie tocara el código.
- **`--ancho 320` NO mide 320.** Chrome no baja de 500 px de ventana; el runner imprime el ancho
  real, así que míralo. Y `--dpr 2` tampoco vale: sube el ratio y deja el viewport en 640. Para 320
  de verdad hace falta conducir el navegador por fuera — ver `docs/qa/como-ejecutar.md`.
- **`--url` audita la web publicada.** Es la única medición inmune al problema del estado en
  movimiento, porque **producción no puede estar sucia**.
- **`--completa` no captura la página entera** —Chrome ignora el flag— y el runner protesta cuando
  lo detecta. Para ver algo largo, `--alto` grande.
- **Para saber si algo está hecho: `git show HEAD:fichero`, nunca `grep` sobre el directorio.**
- **Ningún comprobador mira si un `background-image` llega a pintarse.** El código de barras de la
  pegatina no se pintó en todo el proyecto y los diez comprobadores estuvieron en verde. Eso solo
  se ve en captura.
- **El auditor de contraste se abstiene ante un `background-image` ancestro.** Con el halo del
  campo son 112 abstenciones. El peor caso está medido y declarado en `css/tokens.css`; si se toca
  el halo, hay que repetir esa medición.
- **Un `TypeError` en un módulo de render no se ve**: se traga el trozo de interfaz y la página
  parece bien. `js/datos.js` tiene `avisarDeCamposAusentes()` para eso; úsalo.
- El estado vigente de una planta se lee con **`estadoVigente(p)`**, que ordena por `fecha_foto`.
  **Nunca `estados[0]`**: el orden de un array es una convención y la fecha es un dato.

## Lo que este proyecto considera "terminado"

Nada está terminado sin haberlo visto en captura. "Compila" no es "está bien" — y aquí eso costó
una web publicada en blanco durante horas, con los cinco comprobadores en verde, porque el verde
era de dos commits atrás.
