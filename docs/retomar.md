# Estado — qué es la web hoy y qué queda

**Este es el único fichero de estado del proyecto.** Todo lo demás en `docs/` es registro
histórico: cuenta cómo se llegó aquí y no se actualiza, solo crece. El mapa completo de qué es cada
fichero está en `CLAUDE.md`.

Última actualización: **13 de agosto de 2026**, con las tres plantas nuevas dentro.

**Se trabaja en solitario.** El equipo de cinco agentes que construyó esto está parado y el modo
Agent Teams retirado. Si encuentras referencias a `ux-lead`, `builder`, `botanist`, `qa-visual` o
`ui-designer`, son **el registro de quién escribió qué**, no instrucciones: no hay nadie a quien
mandar un mensaje.

Lee, en este orden: este fichero, `CLAUDE.md`, y **`docs/aprendizaje.md`** — que no es opcional,
porque documenta diecisiete formas en que los instrumentos de este proyecto han mentido, y vas a
usar esos instrumentos.

---

## Qué es la web hoy

Campo oscuro cálido, **las diez fotos de las plantas llevando la página**, y chartreuse ácido
—sacado del borde de hoja del coleo grande real— como único acento. El veredicto del día
(`3 DE 10 PIDEN MIRADA`) a escala de display, que es lo más grande de la pantalla. Las fichas
agrupadas en dos bandas, **PIDEN MIRADA** y **ESTÁN BIEN**, con su recuento.

**Son diez plantas desde el 13 de agosto de 2026, y ya no todas viven en el salón**: nueve sí, y el
segundo poto está en la cocina. Eso no es un detalle de inventario — es lo que obligó a dejar en
null los tres campos de temperatura de casa en esa ficha, porque los 21-24 °C de invierno y los
28 °C de tope de verano son del salón y nadie ha medido la cocina.

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
- Las **siluetas de hoja** —ocho dibujos para diez plantas: los dos coleos comparten forma y los
  dos potos, especie—, que bajaron al expediente con su rasgo en palabras. Los dos helechos son el
  mejor ejemplo de para qué sirven: mismo lenguaje gráfico y **la única diferencia es la trama de
  sin-dato**, que lleva el del salón porque su especie no está identificada y no lleva el nuevo,
  que trae la especie en la etiqueta.
- Los **diez iconos de campo**, la búsqueda, los filtros, el histórico de estados y las **fuentes
  citadas al pie de cada campo**.
- La **pegatina reconstruida** en HTML y CSS —el código de barras es un gradiente repetido—
  dentro del bloque `LA PRUEBA`, al lado de la foto de la etiqueta real. Ya no es solo la de
  Projardín: se dibuja con el emisor que traiga cada planta, y desde el 13 de agosto hay tres
  procedencias distintas (Projardín, el productor de la begonia y Leroy Merlin).

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
- **Ni un dato inventado.** Diez plantas y son las que hay. Un campo vacío está vacío a propósito.

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

## 13 de agosto de 2026 · tres plantas más

Carlos añadió tres plantas y las fotografió: **poto2**, que llevaba más de veinte años en la cocina
sin ficha; y **helecho2** y **croton**, comprados ese día en Leroy Merlin para la parte del salón
alejada del ventanal. Se hizo con ellas lo mismo que con las siete: identificación verificada,
derivados de imagen, ficha completa con sus fuentes, silueta y diagnóstico fechado.

Lo que trajeron, además del contenido:

- **La casa dejó de ser una habitación.** El poto nuevo está en la cocina, así que `meta.contexto`
  ya no puede decir «las siete, en el salón» y los tres campos `casa_*` de esa ficha van en null.
  El rótulo del diagrama térmico decía «el salón» **escrito a mano**: ahora sale del dato
  (`ubicacion.habitacion`), porque el literal habría rotulado como del salón una temperatura de la
  cocina en cuanto alguien la midiera.
- **Segunda tanda de fotos**, y con ella la primera fecha de diagnóstico que no vale para todas. La
  cabecera decía «visto el 11 de agosto»; con tres fichas del 13 eso habría sido **falso para siete
  de las diez**, así que ahora calcula el rango de las plantas: «visto entre el 11 y el 13».
  `meta.tandas` guarda qué se fotografió cada día.
- **La primera planta `no_toxica` de la casa**: ASPCA lista el helecho de Boston como no tóxico
  para perros ni gatos. Hasta ese día la escala decía que ninguna lo era, y era verdad.
- **La primera cita que no es ASPCA**: no tiene entrada para *Codiaeum variegatum* —comprobado en
  su listado por letra y en el imprimible para perros—, así que la toxicidad del croton se apoya en
  Pet Poison Helpline y en RHS. Suplente, no sustituto.
- **Una discrepancia de familia declarada en vez de escondida**: IPNI archiva el helecho nuevo en
  Oleandraceae y GBIF en Nephrolepidaceae. Se elige la de GBIF y se escribe la otra al lado; quien
  lo cerraría es POWO, que devuelve 403.
- Y **el riego de las siete viejas cambió**: Carlos dio fechas nuevas (helecho, begonia y los dos
  potos el 12; los dos coleos, el ficus y la margarita el 13). Ocho de las diez tienen ya riego
  registrado; las dos que no son las que llegaron el 13 sin regar.

Tres cosas se arreglaron en los instrumentos porque impedían verificar algo del alcance, y están
contadas en `docs/aprendizaje.md`: el presupuesto de imágenes, el comprobador de enlaces y un dato
que solo se veía mal en la frase renderizada.

---

## Lo que queda

Por orden, y con lo que hace falta para cerrarlo.

### 1. Las `notas` de la casa — **solo puede hacerlo una persona**

Vacías en las diez, y ahora hay tres huecos más: las plantas nuevas tampoco tienen voz. El panel
del cuaderno se renderiza con `historia` —que sí tienen—, así que no se ve un vacío; lo que no se
ve es a nadie de la casa hablando. Basta una frase por planta, de quien la riega.
**No se inventan nunca.**

Sitio para escribirlas: `docs/inventario.md`, que está preparado con las diez y su hueco.

### 2. Marcar lo hecho, y que quede — **aprobado en concepto por Carlos el 12 de agosto**

La web pide cosas al que cuida las plantas y no puede recibir respuesta: no hay forma de decir
«esto ya está». Carlos quiere que la haya. Sus respuestas a las tres preguntas que se le hicieron:

1. **¿Quién marca?** *«El que use la web, por eso hay que hacer 1+2 para que viva en todos los
   clientes.»*
2. **¿Tiene que sobrevivir?** *«Si queda sería mejor, pero estoy de acuerdo en no complicar con
   servidores. Lo que podamos hacer gracias a Pages de GitHub —quizás hay que explorar qué se puede
   hacer.»*
3. **¿Por dónde se empieza?** *«Yo diría de hacer todo.»*

#### Esto ya está medio hecho, y por ahí se entra

**Ocho de las diez** tienen ya `riego.ultimo` con `ancla_tipo: riego_registrado` — el 12 de agosto
el helecho, la begonia y los dos potos; el 13, los dos coleos, el ficus y la margarita. **Eso ya es
una marca**: alguien regó, se registró como dato con su fecha, y la ficha dice «se regó hace tres
días» en vez de «sin registrar». El campo existe, el render lo usa y el test lo verifica. Así que
esto **no es añadir persistencia: es automatizar la entrada de un campo que ya existe**, y por eso
es mucho más pequeño y mucho más seguro de lo que parece.

Y el 13 de agosto dio la mejor prueba de por qué hace falta: las ocho fechas las dijo Carlos **en
una frase, en el chat**, y hubo que traducirlas a mano a ocho pares de campos. Ese es exactamente
el trabajo que la marca elimina. De paso enseñó un caso que hay que tratar: dijo el 12 donde la
ficha traía el 11, y no consta si fueron dos riegos o una corrección. `ultimo` guarda el más
reciente y la nota lo dice; una marca automática tendrá que decidir lo mismo y decirlo igual.

#### La regla que gobierna, y no la afloja el alcance

«Hacer todo» significa las cinco clases de tarea, **no** que marcar signifique lo mismo en todas. El
`tipo` que ya está escrito en el dato lo decide:

Recuento a 13 de agosto de 2026, con las tres plantas nuevas dentro — **eran 35 tareas y ahora son
53**, así que si vuelve a cambiar el inventario hay que contarlas otra vez y no fiarse de esta
tabla:

| tipo | cuántas | qué hace la marca |
| --- | --- | --- |
| `fecha` | 23 | **cierra la tarea**: el calendario manda de verdad |
| `temporada` | 14 | **cierra la ventana** de este año |
| `vencida` | 1 | **deja de vencer** |
| `ritmo` (riego) | 10 | **solo enriquece la observación**: «se regó hace 3 días». **NUNCA «hoy toca»** |
| `condicionada` | 5 | **nada**: su disparador es mirar la planta, no el calendario |

Los dos últimos renglones no son alcance recortado, son honestidad de contenido. Está argumentado
en `js/tareas.js`: para el riego el disparador real **no es el calendario, es el sustrato**. Con una
marca perfecta la aritmética saldría —«regaste hace 4 días, cada 3 en verano, toca»— y sería
*aritméticamente impecable y agronómicamente falsa*. Marcar convierte un hueco en una **observación
fechada**; no convierte una observación en una orden.

Y entra también **el plan de recuperación** —los seis pasos del helecho, cada uno con su señal
observable—, que probablemente sea el mejor caso de todos: baja frecuencia, riesgo cero y es
justo lo que esta web debería recordar.

#### Dónde viven las marcas: 1 + 2, decidido

1. **`localStorage`**, para que marcar sea inmediato. Gratis, cero peticiones, cero terceros,
   funciona offline y no rompe ninguna restricción dura. Su coste **se dice en voz alta y no se
   descubre** —ya estaba decidido así en `docs/decisiones.md`, décima vuelta—: es por navegador, y
   si se limpian datos la marca se va **en silencio**, que es peor que no tenerla.
2. **Que la marca vuelva al repo.** La web acumula lo marcado y ofrece un gesto deliberado
   —copiar/descargar— que se le pasa a Claude Code, que lo escribe en `content/plantas.json` como
   dato de verdad con su fecha. Es el único camino que sobrevive al móvil de uno, al portátil del
   otro y a un borrado de caché, y usa el canal que ya existe para plantas y fotos nuevas.

**Regla de reconciliación, escrita antes de programar nada:** si el JSON trae una fecha más reciente
que la marca local, gana el JSON y la marca local se borra sola. La fuente de verdad sigue siendo
`content/plantas.json`; `localStorage` es un buzón, no un archivo.

**Descartado: cualquier servicio externo** (Firebase, un backend, un formulario de terceros). Rompe
«cero recursos de terceros en runtime», que es de las cuatro cosas que el brief dice que no son
estética sino no mentir.

#### Lo que hay que explorar antes de decidir el punto 2 — **sin verificar, para mañana**

GitHub Pages sirve ficheros y **no escribe nada**: eso es seguro. Lo que no está comprobado es qué
alternativas hay para que la marca viaje entre clientes sin servidor propio. Candidatas a mirar, con
lo que ya se sospecha de cada una:

- **Un enlace con el estado codificado en la URL.** Cero servidores de verdad: marcas en el móvil y
  te mandas el enlace. Funciona seguro; la duda es si el gesto es aceptable o es un juguete.
- **Descargar un `.json` pequeño y commitearlo con Claude Code.** Es la opción 2 tal cual. Sin
  incógnitas técnicas; la duda es la fricción.
- **Escribir en el repo desde el navegador con la API de GitHub.** Necesitaría un token en el
  cliente, y el repo es público: **casi con seguridad descartable**, pero conviene escribir por qué
  para no re-descubrirlo.
- **Una issue de GitHub prerrellenada por enlace.** Ojo con el matiz que hay que decidir: navegar a
  github.com al pulsar **no es una petición a terceros en runtime**, pero se le parece bastante como
  para que merezca una línea en `decisiones.md` en vez de colarse.

#### El riesgo, que no es técnico

Está escrito en el proyecto: *«sin notificaciones, sin rachas, sin porcentaje de cumplimiento, sin
premiar la visita — la página se abre con prisa una vez cada quince días»*. Poner casillas es **la
puerta de entrada a convertirse en un gestor de tareas**, que es justo lo que se decidió que no
fuera. La contención no es no hacerlo: es que marcar registre una observación fechada y **no puntúe
a nadie**.

#### Coste estimado

El código es pequeño —un módulo de almacén, el botón por tarea, que el render lo lea y la
reconciliación—: dos o tres tardes. Lo caro es lo de arriba, que ya está pensado.

### 3. La pasada con `--url` sobre la web publicada

`python3 tests/runner.py --url https://ccanado.github.io/MyPlants/`. Es el punto 9.6 del checklist y
la única medición inmune al problema del estado en movimiento, **porque producción no puede estar
sucia**. Falta también la medición en frío del peso transferido (9.7), que hoy se estima.

### 4. Dos presupuestos que se incumplen en verde

`peso-assets.py` avisa de `css/app.css` (79,5 KB contra un tope de 60) y de `js/` (156,3 KB contra
60). Los dos topes son números redondos sin procedencia, igual que el 20/62/600. **Un tope que se
incumple en verde no es un tope**: o se deriva o se retira. Y no lo decide un informe de QA — un
informe puede medir contra un objetivo, no crearlo.

**El tercero de esa lista ya no está, y lo resolvió chocarse con él.** El tope de imágenes eran
2.500 KB planos, y las tres plantas del 13 de agosto lo pasaron a ERROR sin que nada estuviera mal:
las fotos nuevas pesan lo mismo que las viejas. El fallo era la FORMA del número — un total fijo
depende de cuántas plantas tenga Carlos, y eso lo decide Carlos, así que «arreglarlo» habría sido
recomprimir fotos correctas o no añadir la planta. Sustituido por dos presupuestos por planta
derivados de lo medido: 440 KB de imágenes por planta (peor caso real 411,5, el ficus) y 95 KB de
derivado de rejilla (peor caso 89,6), que es lo único que baja al abrir la web. Queda como pauta
para los otros dos: **un tope se deriva de una medición o se retira.**

### 5. El índice de síntomas como lista navegable

El nivel 1 está hecho: el buscador ya indexa `senales`, `causas[].resumen` y `patron`, así que
«hojas amarillas» encuentra algo y el placeholder dejó de mentir. Falta la entrada por síntoma como
lista, **generada de esos mismos campos y no de una taxonomía fija** — así cada entrada tiene al
menos una planta por construcción y desaparece el problema de qué decir de un síntoma que hoy nadie
tiene. Va en el buscador, no en la portada.

### 6. Los tres umbrales sin derivar

Ocupación ≤ 20 %, tinta parando antes del 62 %, carrera de 600 px sin ancla. Cumplen los tres
(0 %, y 566 px el peor); el criterio de aprobado no está justificado. Úsalos; no los defiendas como
física.

### 7. La prueba del imperativo a los dos skills

`.claude/skills/vanilla-web-craft/` y `plant-expert/` están escritos en imperativo y **son el
vehículo más peligroso del ascenso de calificadores**, porque se leen como el manual del proyecto.
La prueba es barata: leer cada imperativo y preguntar *«¿esto tiene dueño humano, o soy yo con voz
de norma?»*. Lo que no lo tenga, se reescribe como propuesta con su motivo.

### 8. La propuesta de `botanist`

Hacer comprobable una cita correcta que apunta al taxón equivocado.

### 9. Fotos nuevas, cuando Carlos quiera registrar un estado nuevo

El esquema ya es histórico: la ficha diagnostica un momento fechado y no el presente. Añadir un
estado nuevo no rompe nada — el distintivo toma el peor de todos y el vigente se lee por
`fecha_foto`.

**El 13 de agosto se ejercitó por primera vez**, aunque en la variante fácil: tres plantas nuevas
con su primer estado, no un segundo estado de una planta ya fichada. Lo que se aprendió y sirve para
la próxima vez: el camino de la imagen es `docs/plants/<nombre>.jpg` (original, fuera de git) →
`assets/img/<id>.jpg` a 800×1067 → `assets/img/rejilla/<id>.jpg` a 480×640 con **el mismo
encuadre** → y `assets/img/<id>-etiqueta.jpg` a 500×667 si hay pegatina. Con `sips` basta; si la
foto viene apaisada hay que recortar a 3:4 antes, y el recorte se elige mirándolo. Lo que sigue sin
ejercitarse es el caso interesante: una segunda foto de la MISMA planta, que es la que convierte
`estados[].verificacion` de campo vacío en el sitio donde una hipótesis se confirma o se cae.

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
