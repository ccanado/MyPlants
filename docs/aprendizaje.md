# Aprendizaje — el instrumental y el mecanismo del equipo

Destino de los hallazgos sobre **cómo medimos y cómo nos coordinamos**, en lugar de sobre el
producto. Por decisión de Carlos del 11 de agosto de 2026, **lo que se anota aquí no genera
trabajo**, salvo que impida verificar algo del alcance. La regla completa, con su
excepción, está en `docs/retomar.md`.

Quien encuentre algo de esta clase lo escribe aquí y sigue con lo suyo. Cualquier teammate puede
añadir; el lead mantiene el orden. La dirección visual y sus decisiones siguen en
`docs/brief.md` y `docs/decisiones.md`.

## El patrón dominante: una herramienta que afirma donde no puede saber

Nueve casos en dos sesiones, y todos del mismo tronco. Se listan porque la repetición **es** el
hallazgo: no fue el descuido de nadie, fue una propiedad del montaje.

1. **Contar `@font-face` con `grep`.** Cuenta el código comentado. El lead declaró un bloqueante
   inexistente y `qa-visual` cometió el mismo error por separado, "confirmándolo" con `curl` a
   rutas que efectivamente no existían — pero que el navegador nunca pedía.
2. **Orden de foco comparado contra bandas horizontales** en una rejilla de tarjetas: 198 saltos
   inexistentes. Habrían enterrado 36 hallazgos reales.
3. **Cruce estático JSON↔JS con una regex** que casaba cualquier variable llamada `p`, incluida
   `plagas.map(p => p.nombre)`: 25 errores, cero reales. Se retiró entero.
4. **Medir texto con `innerText`**, que omite lo que `content-visibility` salta: 15 "cables
   sueltos" falsos.
5. **Un 403 de bot-blocking tratado como cita rota.** POWO/Kew bloquea clientes automáticos: 4
   fuentes "muertas" que cargaban perfectamente en el navegador.
6. **`check-tokens.py` exigiendo que `--x` esté en `tokens.css`**, cuando es una coordenada por
   elemento que el JS establece con `setProperty`. Obedecer al script habría metido la fecha de
   una planta concreta en el fichero que define el sistema.
7. **`runner.py --completa` capturando siempre exactamente `--alto`.** No producía un dato falso:
   producía **un dato ausente disfrazado de completo**. El lead dio por vista una ficha de
   4.000 px habiendo visto 900.
8. **`estructura.js` aprobando con 0 `<article>`.** El test más importante del proyecto daba
   verde sobre una página en blanco. Un checker que aprueba el caso peor no protege nada.
9. **El sello del runner avisando donde debía negarse.** Imprime `commit X + N ficheros sin
   commitear` y solo se niega si algo cambia *durante* la pasada. Con el árbol sucio de antes,
   informa y sigue: **la línea está redactada para quien ya sospecha**, porque nombra primero lo
   que tranquiliza y deja la advertencia detrás de un `+`.

**El corolario que cierra la lista, y que nadie había mirado en dos días:** el error simétrico de
un falso positivo es **un test en verde que no comprueba nada**. De ahí salió `tests/autoprueba.js`,
que inyecta defectos conocidos en los instrumentos y se lee al revés — ✗ es el resultado bueno.

### El complementario, que es peor: el marco demasiado estrecho

Los diez casos de arriba son herramientas que **afirman** donde no pueden saber. El
complementario apareció el último y no lo teníamos nombrado: **una herramienta que no ve un
defecto porque el defecto está fuera de su referencia — y la referencia la escribió quien
buscaba.**

`ux-lead` definió su métrica de ocupación sobre *"el contenedor del expediente de una ficha
abierta"*. Al ascender la franja a hero introdujo un hueco de **325 px** en la cabecera, con el
mismo perfil que había pasado el día persiguiendo en las fichas. **Su instrumento le daba 0 %
mientras el defecto estaba a dos pantallas, visible a simple vista.** Lo encontró mirando con los
ojos, no midiendo.

Por qué es peor que un falso positivo: **un falso positivo hace ruido y alguien va a mirar; un
marco demasiado estrecho produce silencio, y el silencio se lee como ausencia de defecto.** Y lo
agrava que el marco lo escriba el interesado.

**La regla operativa, y no es ampliar el marco** —ampliarlo habría sido el 0,62 viajando a un sitio
donde no aplica, que es el error del 2.400 otra vez—:

> **Cuando un instrumento dé verde, preguntar qué queda fuera de su referencia antes de creerle.**
> Basta con que el instrumento **declare qué no mide**. Uno que declara su alcance no produce
> silencio: produce un hueco declarado — que es exactamente lo que hacemos con los `null` del
> contenido.

Esa última equivalencia es la que cierra el proyecto sobre sí mismo: **la regla del hueco anotado
del contenido y la del alcance declarado del instrumento son la misma regla.** Un dato que falta
se dice; una cosa que no se mide, también.

## Reglas que quedan del proceso

- **Un objetivo que se cita se cita con fichero y línea.** Si no lo tiene, es una estimación de
  quien la escribió. Nació de que un número inventado en un informe de QA —2.400 px— sostuviera
  un ALTA durante dos pasadas y dirigiera el encargo de un día entero.
- **El reparto de ficheros protege quién edita un dato, no quién lo cita.** Nadie escribió en un
  fichero ajeno: una cita se volvió fuente. Es el hueco que el reparto de `CLAUDE.md` no cubre.
- **Un informe de QA puede medir contra un objetivo, no crearlo.** Sin objetivo definido, el
  informe dice "sin objetivo definido" en lugar de poner un número.
- **Un dato sin el instante al que corresponde no es comparable con otro.** Cinco tropiezos
  vinieron de mediciones ciertas sobre estados distintos presentadas como contradicciones.
- **Verificar ejecutando no basta: hay que verificar la causa.** El lead acertó tres veces en que
  había un problema y falló en qué lo causaba. Una mitigación construida sobre la causa
  equivocada no es media solución: es cero, y manda a alguien a buscar donde no está. **Un aviso
  sin causa verificada se manda como pregunta, no como instrucción.**
- **Medir y publicar exigen lo mismo: un worktree limpio.** La lección nació para publicar y
  tardó una sesión en trasladarse a medir, que es donde se había originado.
- **`grep` sobre el directorio de trabajo responde sobre un estado que no existe para nadie más.**
  Formulación de `ux-lead`. La versión fiable es `git show HEAD:fichero` o un worktree, y cuesta un
  carácter más. Válido para el caso del expediente por la mañana, donde el lead reportó una
  ocupación del 9 % medida sobre árbol sucio.

  **Corrección, y es del propio `builder`: el caso del `overflow: clip` NO era éste, y yo lo
  escribí aquí como si lo fuera.** Comprobado con `git show`: el `clip` estaba commiteado en
  `eb8e25e`, **anterior al commit en que escribí esta lección**. `ux-lead` midió en worktree
  limpio —el método correcto— sobre `0c81869`, y `builder` commiteó mientras él medía. Las tres
  mediciones eran correctas y ninguna usó `grep` sobre el árbol.

  **Lo que pasaba de verdad, con su formulación:** el blanco en movimiento no era el fichero, era
  `HEAD`. **Una medición hay que sellarla con el commit y también con el instante**, y cuando la
  firma y los commits corren en paralelo, quien mide tiene que decir contra qué hash mide *antes*
  de empezar. El sello del runner ya imprime el hash; lo que faltaba era que alguien lo comparara
  con el del que estaba commiteando.

  Y la recursión merece quedar escrita, porque es la prueba más fuerte de todo este fichero:
  **el lead escribió una lección sobre atribuir mal la causa, atribuyendo mal la causa.** Ni
  saberse el patrón de memoria protege de cometerlo — solo protege verificar antes de escribir, y
  esta entrada se escribió sin verificar.
- **Un sticky puede estar declarado, con su `top` resuelto, y no pegar.** Tercer modo de fallo que
  ninguna de las dos comprobaciones cubría: un ancestro con `overflow: hidden` es el contenedor de
  scroll más cercano. Se detecta **scrolleando de verdad**, no leyendo el estilo computado. Y el
  arreglo es `overflow: clip`, que recorta igual sin crear contenedor de scroll.
- **Un umbral que aprueba con margen en su primera medición sigue sin estar derivado.** De
  `ux-lead`, sobre su propia métrica de carreras sin ancla, que salió holgada —169–552 px contra un
  tope de 600— y se quedó en el backlog igualmente. Aprobar no es lo mismo que estar justificado.
- **Cada agente commitea sus propios ficheros, por nombre, nunca `git add -A`.** El lead publicó
  una página en blanco durante horas por barrer con `-A` una edición a medias ajena. Auditados
  los commits de los teammates, todos respetaron la propiedad: la disciplina funcionaba, el
  problema era el atajo del lead.
- **Un acierto por el motivo equivocado es un fallo que todavía no se ha manifestado.** Un
  auditor "confirmó de forma independiente" un hallazgo real por un bug de parseo, y estuvo a
  punto de pasar **porque coincidía con lo que quien lo leía ya creía**.
- **El coste de un falso positivo no lo paga quien lo emite**, lo paga el teammate al que se
  manda a arreglar lo que no está roto. De ahí que los tests digan "no medible" en vez de
  inventarse un veredicto.

## El caso más grande: la restricción que nadie había pedido

La sección "Restricción anti-genérico" del brief —tres clichés visuales **prohibidos**— se citó a
Carlos durante dos días como si fuera su encargo, y sirvió para rebatirle una opinión que él
repitió tres veces. **No la había escrito él.** Estaba en el andamiaje inicial del proyecto,
redactada en una sesión anterior con un asistente, tomada del skill `frontend-design`.

La formulación del mecanismo es de `ux-lead`, y es mejor que "una cita se volvió fuente" porque
nombra qué se degrada y por tanto qué hay que vigilar:

> **Nadie inventó una cita en ningún paso. Lo que se perdió en cada salto fue un calificador.**
> El skill **describe** tres clichés → el andamiaje inicial los **cita** → la sección del brief los
> **prohíbe** → el equipo se los cita al cliente **como su propio encargo**.

Cada paso era defendible por separado. Lo que no lo era es el resultado: **una guía se volvió
prohibición y una prohibición se volvió requisito del cliente**, sin que nadie mintiera. Y el
único salto que tenía a una persona delante capaz de desmentirlo —el cuarto— lo ejecutó el lead
en voz alta, tres veces.

Lo que hay que buscar, entonces, no son citas falsas: son **calificadores que desaparecen**. "Se
observa a menudo" → "es un cliché" → "está prohibido" → "lo pide el cliente".

### La defensa no es vigilar, es redactar

Nombrar el mecanismo permite vigilarlo y **no evita que ocurra**, porque nadie revisa una frase
que ya está escrita. La parte operativa, y es de `ux-lead`:

> **Se redacta de forma que la frase se resista al ascenso.** *"El skill recomienda evitar X"*
> aguanta ser citada sin convertirse en prohibición; *"X está prohibido"* **invita** al siguiente
> a citarlo como requisito. **La modalidad va dentro de la frase, no en el contexto del que la
> lee — porque el contexto es exactamente lo que no viaja.**

Y el corolario, comprobable en el propio brief: **casi todo lo que estaba escrito en imperativo
era una opinión en imperativo.** Eso no lo arregla una regla de vigilancia posterior; lo arregla
escribir distinto, y sale más barato que auditar cadenas de citas después de que hayan hecho daño.

**La mitad que le faltaba a la regla, y evita el error contrario —huir de todo imperativo—:**

> **El problema no era el imperativo, era el imperativo sin procedencia.** Una norma que el dueño
> humano del proyecto ha aprobado **sí** es un requisito, y ahí el imperativo es la forma correcta
> de escribirla. Lo que no puede es nacer imperativa en el fichero de un agente y ascender por
> citas hasta parecer suya.
>
> Regla completa: **la modalidad va dentro de la frase, y el imperativo está reservado a lo que
> tiene dueño humano.** Todo lo demás se escribe como lo que es: una propuesta con su motivo.

Y la observación que lo cierra, de `ux-lead`: **preguntarle al dueño antes de escribir en su
fichero es lo que da la procedencia.** La misma frase, en el mismo tono imperativo, es una norma
legítima si él la aprueba y un ascenso indebido si aparece sola en el fichero de un agente. **La
diferencia no está en la redacción: está en que haya un dueño humano detrás.**

**Prueba barata para auditar un fichero propio:** leer cada imperativo y preguntar *"¿esto tiene
dueño humano, o soy yo con voz de norma?"*. Aplicada al brief, la respuesta fue incómoda más veces
de las esperadas. Los **skills** son el vehículo más peligroso para este ascenso, porque se leen
como el manual del proyecto: queda pendiente en el backlog pasarles esa prueba.

Corolario del reparto de responsabilidad, también suyo, y vale para cualquier cadena de este tipo:
**el eslabón que convierte una descripción en una norma es el que carga con los siguientes.** El
que después la cita como requisito solo pudo hacerlo porque encontró una norma escrita.

**Cómo se cerró**, y esto es la parte reutilizable: la sección baja de **prohibición a argumento**,
escrito en el propio fichero. Ya no vale "el brief lo prohíbe"; hay que decir "creo que queda peor,
y aquí está el porqué", y si el cliente prefiere la otra opción, gana el cliente. Con el matiz que
lo hace funcionar, también de `ux-lead`:

> Que algo sea lo que produciría cualquier generador **no lo hace malo, lo hace un default. Y un
> default no es una elección hasta que alguien lo elige a la vista de otra cosa.**

De ahí el procedimiento que sustituye a la prohibición: **dos versiones renderizadas y el cliente
decide mirando.** Para eso se trajo un quinto agente sin historia en el proyecto — no porque los
demás no supieran, sino porque el autor de una decisión lleva dos días de coste hundido en ella y
eso no se quita con un encargo.

## Sobre cómo se dan las instrucciones

- **Un veredicto se acata; un mecanismo se puede aplicar en otro sitio.** Formulación de
  `botanist`. `ux-lead` le dijo "tu dato es correcto, no toques nada" y **explicó por qué** había
  encontrado su propio error de sobre-alcance: deducir una propiedad de la planta desde un número
  de la habitación. `botanist` fue a comprobar si su prosa cometía el mismo error y lo cometía —
  el ficus deducía uniformidad térmica de la planta a partir del dato del salón, y ese ficus
  cuelga junto al cristal. Lo que le hizo mirarlo no fue el veredicto, fue el mecanismo.
- **Una regla llega mejor a la vez que el contenido al que se aplica.** También de `botanist`, y
  es la versión más incómoda de lo anterior: *si el criterio hubiera llegado como especificación
  cerrada en vez de como pregunta sobre 38 ítems reales, habría rellenado el hueco con algo
  plausible y nadie lo habría notado nunca — porque una buena noticia no la audita nadie.* Lo que
  funciona no es que el teammate sea prudente: es que **el contenido se resiste y quien escribe la
  regla no lo tiene delante.**
- **Un mensaje largo entierra la petición.** Tres avisos del lead sobre un cambio de tres líneas
  no se aplicaron hasta que el cuarto fue de cinco líneas y sin contexto.

## Sobre inventar números que el dominio ya acota

Dos casos el mismo día, los dos de `ux-lead` y los dos retirados por él:

1. **El tope de altura de la ficha** (1.800 px en `sana`, 2.700 en `critica`). Derivado de "dos
   pantallas", un número redondo de viewports y no del contenido. Se demostró inalcanzable sin
   borrar foto, diagramas, límites o fuentes.
2. **El tope de la franja del día** ("dice el número y las dos primeras"). Protegía el caso *"hay
   muchas tareas y la portada explota"* cuando el caso real era *"hay diez tareas cortas y quiero
   verlas de un tirón"*. Y **el techo ya estaba en el dominio**: hay siete plantas, así que una
   línea por planta no puede pasar de siete renglones ni el día que todas necesiten algo. El tope
   resolvía un problema que no puede ocurrir y creaba uno que ocurría a diario.

De ahí sale la distinción que conviene aplicar antes de escribir un límite: **un índice que dice
cuánto documento hay es información; un contador que dice cuánto trabajo te oculta es una traba.**

## Sobre la metáfora y el sujeto

**"La metáfora ganó al sujeto."** El diseño eligió que cada ficha fuera la etiqueta del vivero
reconstruida en CSS, y de ahí se siguió que en la rejilla cerrada no hubiera fotos —porque una
pegatina de vivero no lleva foto de la planta—. El resultado: siete etiquetas impecables y **el
sujeto ausente de su propia portada**. Carlos dijo tres veces que la web se veía "pobre y simple"
antes de que nadie mirara esa decisión.

Y el agravante, dicho por su propio autor: la justificación escrita en el brief era *"carga
inicial 218 KB y cero bytes de foto"*, o sea **un argumento de ingeniería sosteniendo una
decisión estética** — el movimiento que ese mismo brief prohíbe en otros sitios. El motivo real
era que la metáfora gustaba.

Corolario para el próximo proyecto: **cuando el cliente repite un juicio y el equipo lo explica,
el equipo suele estar defendiendo una decisión propia.** Tres veces no es ruido, es un veredicto.
Y la pregunta que sirve no pide un adjetivo: pide un sitio. "¿Pobre en qué pantalla?" y "¿qué
echas en falta al abrir?" producen respuestas accionables; "¿qué te parece el diseño?" deja
adivinando.

## Sobre el mecanismo de equipo

- **El hallazgo del sol directo no lo cazó ningún agente: lo cazó el reparto.** El lead dedujo
  "sin sol directo" de la orientación noreste y lo pasó como contexto de la casa; se propagó a
  las siete fichas. Se detectó porque el dato y el fichero estaban en manos distintas y porque un
  teammate **se negó a elegir** entre dos fuentes en conflicto y lo marcó como abierto. Un solo
  agente con las dos cosas en la cabeza habría cerrado la contradicción sin enterarse de que
  existía.
- **Los teammates cierran la parte más pequeña de un encargo múltiple y se quedan inactivos.** Un
  encargo de tres puntos rara vez vuelve con los tres. El lead no puede fiarse del informe: tiene
  que comprobar el fichero. De cuatro verificaciones en disco antes de contestar, tres cambiaron
  lo que iba a decir.
- **Los mensajes se cruzan y cuesta turnos.** Cuatro turnos se perdieron demostrando que algo ya
  estaba hecho. Mitigación: comprobar antes de encargar (`grep -n "^### " docs/brief.md`,
  `git status`) y dar líneas exactas en los informes en lugar de nombres de sección.
- **El navegador del MCP es un recurso exclusivo** y el reparto de ficheros no dice nada de los
  recursos de ejecución. Bloqueó a QA media sesión. Se resolvió con `tests/runner.py`, que
  levanta su propio Chrome — y salió de un conflicto de coordinación, no del plan.
- **Un mensaje largo entierra la petición.** Tres avisos del lead sobre un cambio de tres líneas
  no se aplicaron hasta que el cuarto fue de cinco líneas y sin contexto.
- **La explicación de un hallazgo viaja tan rápido como el hallazgo.** Un informe que nombraba mal
  el objeto —"cronología" donde quería decir "recuperación"— estuvo a punto de matar un diagrama
  correcto.
- **El proyecto no tenía definición de terminado**, solo de tarea terminada, y por eso se
  alimentaba a sí mismo. Ese fue el motivo de congelar el alcance el 11 de agosto; v1 se cerró
  el 12 y el registro de aquel congelado está en `docs/retomar.md` § «v1, cerrada».

## Cuatro del instrumental, apuntadas por `builder` al cerrar v1

Van aquí y no como tarea, por la regla del lead. Ninguna me impidió verificar, salvo la primera.

- **Un test puede no encontrar algo y no decir que no lo encuentra.** `tests/diagramas.js` informa
  `eje log: no medible` sobre la cronología, y no es que el eje falle: es que el auditor recorre la
  ficha desplegada y la cronología es **de página**, fuera de cualquier `<article>`. El instrumento
  está bien escrito —tiene incluso un comentario explicando que la cronología es HTML y no SVG— y
  aun así no llega. Medido a mano por regresión: **R² 0,9995 contra log y 0,615 contra lineal.**
  Es la única de las cuatro que cae en la excepción, porque deja sin verificar la honestidad de un
  diagrama, así que se la pasé a `qa-visual` en vez de solo apuntarla.
- **Un test puede nombrar un causante que no existe.** `movimiento.js` atribuye dos bloqueantes a
  `element.animate()`, y en `js/` no hay ni una llamada. Lo que corre es una animación CSS. Medido
  con `getAnimations()`: bajo `reduce` corre **exactamente una**, `aparecer`, 120 ms, opacidad. El
  test ve bien el efecto e inventa la causa — es el patrón dominante de esta sesión, aplicado al
  diagnóstico en vez de al hallazgo.
- **Un umbral sin derivar convierte una decisión en un fallo.** Los 50 ms de `movimiento.js` no
  distinguían mover de no mover, así que suspendían una decisión deliberada y documentada. Lo
  resolvió `ux-lead` con una regla y no subiendo la cifra: *la duración solo tiene umbral si la
  animación mueve algo*. Un umbral que no dice de qué es umbral no se puede cumplir ni discutir.
- **Un test puede aprobar el caso peor.** `estructura.js` dio ✓ con **0 `<article>`** sobre una
  página completamente en blanco. Es el mismo tronco por el otro extremo: no una herramienta que
  opina sin poder saber, sino una que **calla cuando sí puede**. Un suelo mínimo lo cierra, y el
  número sale del propio JSON.

Y una que no es del instrumental sino del método, y es la que más me costó:

> **Verificar ejecutando tiene una cara B: hay que ejecutar DESPUÉS del último commit.** La web
> estuvo en blanco en `main` con un árbol limpio y cinco comprobadores en verde, porque el verde
> era de dos commits atrás. El sello de commit del runner funcionó perfectamente; lo que faltaba
> era volver a pasarlo.

## La conclusión, y es de `ux-lead` al cerrar

> **Un equipo de agentes puede mejorar indefinidamente algo que ya estaba bien, y la única cosa
> que no puede hacer solo es decidir que ha terminado.**

Lo dice quien retiró ocho decisiones propias en una sola sesión —el tope de altura, la definición
de ocupación, la regla de la franja, el acento por planta, un diagrama, un rótulo, su definición de
perfil y la restricción fundacional— y añade que **cada retirada estaba bien y aun así el conjunto
no convergía**. El rigor no era el problema; la ausencia de final sí. Y el final no lo pone quien
está midiendo: lo pone quien puede decir "esto ya sirve".

## Cinco del instrumental, del día de la piel oscura (12 de agosto de 2026)

Van aquí y no como tarea, por la regla de Carlos. Dos de las cinco sí generaron trabajo, porque
impedían verificar algo del alcance.

- **Una medición se sella con el commit Y con el día.** `docs/retomar.md` firmaba «cero desborde a
  320 y 1280» y era verdad el 11 de agosto. El 12 era falsa **sin que nadie tocara el código**: la
  franja se calcula con `new Date()`, así que al pasar el día una tarea se volvió más larga
  («debería haberse hecho hace 58 días») y la línea sacó 68 px de scroll horizontal. En una web
  cuyo contenido depende del reloj, un ✓ de ayer no es un ✓.
- **Chrome no baja de 500 px de ventana, así que `runner.py --ancho 320` mide 500.** El runner es
  honesto —imprime el ancho real en la cabecera— pero la petición no ocurre y nadie lo mira. Y el
  truco del zoom (`--ancho 640 --dpr 2`) **tampoco sirve para esto**: sube el device pixel ratio y
  deja el viewport CSS en 640. Para 320 de verdad hace falta otro navegador conducido por fuera.
  Cae en la excepción —impide verificar «cero desborde a 320», que es del alcance—, así que se hizo
  con Playwright y se apunta en `docs/qa/como-ejecutar.md`.
- **Ningún comprobador mira si un `background-image` llega a pintarse.** El código de barras de la
  pegatina —la mitad de la signature del proyecto— **no se pintó nunca**: el HTML traía
  `.etiqueta__barras` y el CSS estilizaba `.etiqueta__ean`, que no existía en el DOM. Pasó en verde
  todo el proyecto porque los diez comprobadores miran texto, foco, movimiento, terceros y
  estructura, y una clase que no casa con nada no es un error para ninguno. Solo se ve mirando la
  captura, y en la captura parece que la pegatina «es así».
- **El auditor de contraste se abstiene ante cualquier `background-image` ancestro, y con la piel
  oscura eso pasó de 24 abstenciones a 112.** Su abstención es correcta —no puede componer un
  degradado— pero el silencio caía sobre el texto más leído de la página. Aquí el peor caso SÍ era
  calculable, porque los dos tonos del halo son más claros que el campo: se midió de verdad
  poniendo el campo en el tono más claro y quitando los tres gradientes, y salió **1.788 nodos, 0
  por debajo de AA, 0 no medibles**. La lección no es «el instrumento falla»: es que **cuando un
  instrumento se abstiene, a veces el peor caso se puede construir a mano y medirlo de verdad**, y
  entonces la abstención deja de ser un hueco.
- **Un aviso que nombra mal el fichero manda a alguien a mirar donde no está.** `peso-assets.py`
  informaba de siete «huérfanos» usando `f.name`, y desde que hay derivados en `rejilla/` hay dos
  ficheros con el mismo nombre: señalaba a las fotos grandes, que sí se usan. Arreglado a ruta
  relativa. Es el mismo tronco que el informe que decía «cronología» donde quería decir
  «recuperación» y estuvo a punto de matar un diagrama correcto.

Y una del método, que es la más incómoda de las cinco:

> **Un comentario en el código puede afirmar lo contrario de lo que hace el código, y sobrevive
> porque suena a explicación.** El de la franja decía *«sin rótulo se queda `hidden`, NO se borra:
> con `subgrid` la columna existe igual»*. `hidden` es `display: none` y un elemento así **no es
> ítem de la rejilla**, así que la columna no existía y la fila entera se corría. El comentario
> estaba escrito para prevenir exactamente el fallo que causaba.
