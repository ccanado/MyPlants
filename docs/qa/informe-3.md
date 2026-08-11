# Informe de QA nº3 — MyPlants

**Fecha:** 11/08/2026 · **Autor:** `qa-visual`
**Contrato:** `docs/qa/checklist.md` (§13 y §14 son nuevos de esta pasada)
**Método:** `docs/qa/como-ejecutar.md` §2f, §2g y la regla 0

---

## Lo primero, porque cambia el encargo: la única ALTA no existía, y la escribí yo

El informe 2 cerró con «queda una alta: la ficha desplegada mide 4.042 px, un 68 % por encima
del objetivo de 2.400 px que `ux-lead` se puso a sí mismo». **Ese objetivo nunca existió.** Lo
levantó `ux-lead` en `4f1b350` y lo he verificado antes de aceptarlo, porque una acusación
sobre mi propio trabajo merece el mismo método que cualquier otra:

```
git grep "2.400" / "2400"
  docs/qa/informe-2.md   ← mío, atribuyéndoselo a ux-lead
  docs/brief.md          ← su commit de hoy, retirándolo
  docs/decisiones.md     ← idem
git log -S"2.400" --all  → dd34652 (mi informe 2) · 4f1b350 (su corrección)
git log -S"2400"  --all  → 014effb — límite de dimensiones de imagen en mi propio
                            peso-assets.py. Sin relación.
```

No está en `brief.md`, ni en `decisiones.md`, ni en ningún commit de `ux-lead`. Nació en un
informe mío, y de ahí pasó a ser el criterio con el que se midió un ALTA durante dos pasadas y
con el que se le encargó el trabajo de hoy a `builder`.

Nadie mintió y nadie editó un fichero ajeno. **Una cita se volvió fuente.** Y es la formulación
que yo misma escribí en el informe 2, ahora aplicada a su autora: el coste de un falso positivo
en un equipo de agentes no es el de quien lo emite, es el del teammate al que manda a arreglar
lo que no está roto. Aquí lo ha pagado `builder`, rediseñando el expediente entero para acertar
un número que no existía.

### Y un segundo error, este de instrumento: medía una sola ficha

`--abrir 0` abre la primera ficha; la rejilla va ordenada por urgencia; la primera es siempre
el helecho. **Dos informes midiendo la misma planta y llamándolo «la ficha desplegada».** Las
fichas son `<details name="planta">` —acordeón exclusivo nativo, cero JS, buena decisión de
`builder`— así que dos no pueden estar abiertas a la vez y hay que abrir, medir y restaurar de
una en una. Ahora se miden las siete:

| planta | severidad | alto | pantallas (tope) | bandas cortas (tope 20 %) |
| --- | --- | --- | --- | --- |
| begonia-elatior | atencion | 4.719 px | 5,24 (3) | 76 % |
| coleo-grande | atencion | 4.560 px | 5,07 (3) | 73 % |
| ficus-sunny | sana | 4.111 px | 4,57 (2) | 70 % |
| margarita | sana | 3.727 px | 4,14 (2) | 69 % |
| coleo-pequeno | sana | 3.717 px | 4,13 (2) | 69 % |
| **helecho** | critica | **3.710 px** | 4,12 (3) | 72 % |
| poto | sana | 3.543 px | 3,94 (2) | 68 % |

**El helecho, la ficha sobre la que giraban mis dos informes, es el 6º de 7.** El peor caso
—la begonia, a +75 % de su tope— no se midió nunca.

Contra las medidas de `ux-lead`: begonia 4.719 vs 4.727, ficus 4.111 vs 4.109, helecho 3.710
vs 3.718. Instrumento y método independientes —yo barro tinta con `Range.getClientRects()` en
líneas de 4 px— y coincidimos en el píxel largo. Esa sí es una verificación cruzada: dos
mediciones distintas del mismo objeto, no dos lecturas de la misma fuente.

### Lo que sustituye al número inventado

De `docs/brief.md` § «Los objetivos que sustituyen al de 2.400 px», con procedencia y con forma
de falsarse:

1. **Ocupación** — ninguna ficha con más del **20 %** de sus bandas de 100 px donde el contenido
   pare antes del **62 %** del ancho. Es la métrica de «la mitad está vacía», que era el
   hallazgo real, y no se aprueba a ojo. `ux-lead` publicó después su **algoritmo completo**
   (`5f3282e`): referencia, ancho de caja de contenido, qué cuenta como contenido, y que las
   bandas vacías se excluyen del numerador **y** del denominador. Mi instrumento mide esa
   definición y no la mía, porque el objetivo es suyo.
2. **Ninguna carrera de más de 600 px sin un ancla de navegación** — un rótulo de bloque, una
   entrada del índice o un diagrama. Es lo que «muro de texto» significa de verdad: una ficha de
   2.886 px con un rótulo cada 400 px se lee bien y una de 1.800 de un solo bloque no.
3. **La columna de acción tiene que pegar de verdad.** Sin `sticky` funcionando se cumple la
   ocupación y se pierde el motivo del reparto en dos columnas.

**Y la altura en píxeles pasó a observación, no a objetivo** — porque `ux-lead` retiró también su
propio tope de 1.800 px, en el mismo documento y por el mismo defecto que le había reprochado al
mío: lo había derivado de «dos pantallas», un número redondo de viewports y no del contenido. Lo
comprobó midiendo: una ficha sana borrando el bloque de causas **entero** seguiría en ~2.527 px,
así que el tope no se alcanzaba maquetando — solo recortando contenido. Es más de lo que exige el
proceso, y conviene que quede escrito que lo hizo sin que nadie se lo pidiera.

La distinción que quiero heredar: **el objetivo manda cortar, la observación manda mirar.**

Y su línea roja, que he metido como punto **bloqueante 13.14** y no como comentario: estos
objetivos se cumplen ocupando el ancho, quitando rótulos falsos y borrando gráficos que no
informan — **nunca recortando observaciones, causas, límites ni fuentes.** Si un objetivo de
altura obliga a borrar una observación de `botanist`, el que está mal es el objetivo. Se mide
comparando `cobertura-datos` antes y después: el número de campos que llegan a pantalla no
puede bajar.

---

## Los instrumentos de esta pasada, y por qué hay uno que audita a los otros

Cuatro herramientas nuevas (`c88c36a` → `e021f83`), más `--url` en el runner.

| fichero | qué responde |
| --- | --- |
| `tests/expediente.js` | alto y ocupación de las **siete** fichas, contra los objetivos derivados |
| `tests/franja-hoy.js` | ¿la franja `HOY` afirma solo lo que el JSON sostiene? |
| `tests/diagramas.js` | ¿el eje sostiene sus rótulos? ¿con `reduce` se pinta el estado final? |
| `tests/autoprueba.js` | **no audita: contamina.** Verifica que los dos de arriba vean |

**`--url` libera la pasada de producción del MCP de Playwright.** Servir desde subdirectorio era
lo único no reproducible en local, y por tanto la única parte de la pasada que dependía de un
recurso exclusivo que bloquea a otros teammates. Ahora el runner hace de espejo: reenvía todo el
tráfico al sitio publicado, así que el navegador ve un único origen, las rutas relativas del
documento siguen resolviendo sin tocarlo y el `fetch` del JSON no se topa con CORS. Y el sello
cambia de naturaleza — contra un remoto el commit local no dice nada, así que se pregunta al
remoto por su HEAD y se guarda el **sha256 del `index.html` servido**, que es la única prueba de
qué se midió.

### `autoprueba.js`, y el error que en esta sesión nadie había mirado

La sesión lleva contados cinco falsos positivos y la conclusión ya está escrita. Pero hay un
error simétrico que no deja rastro en ninguna parte: **el falso negativo.** Un test en verde que
no mira nada. `franja-hoy` y `diagramas` eran nuevos, y si su primera ejecución salía en verde
yo no podía distinguir «no hay defectos» de «mi test no sabe verlos».

**Un test que nunca se ha visto fallar no está verificado: es una intención.** Así que
`autoprueba.js` inyecta defectos conocidos y exige que los encuentren. Se lee al revés — ✗ en
los otros dos es el resultado bueno. Los cuatro se cazaron, y el discriminante del eje fue
inequívoco: **R² 0,563 contra log frente a 0,9994 contra lineal.**

### Ya me ha ahorrado dos falsos positivos míos

Los dos cazados antes de mandárselos a nadie, y el primero es el que más me interesa contar:

**1. Mi auditor de ejes «confirmó» de forma independiente un hallazgo de `ux-lead`, y era un bug
mío.** `ux-lead` encontró a mano que el diagrama de recuperación codificaba el índice del paso y
no el tiempo. Generalicé el test, lo apunté al diagrama, y salió `veredicto: índice` con
`r2_indice 0,978` contra `r2_lineal 0,425`. Encajaba con su conclusión. Antes de escribirlo miré
los datos crudos:

```
'1'          → valor 1  px 115        '5'          → valor 5  px 365
'2'          → valor 2  px 178        '01/09/2026' → valor 1  px 376   ← aquí
'3'          → valor 3  px 240        '6'          → valor 6  px 428
'4'          → valor 4  px 303
```

Parseaba la fecha `01/09/2026` como el valor `1` y lo situaba a 376 px, entre el `5` y el `6`.
Ese único punto fuera de sitio hundía el ajuste lineal de 0,99 a 0,425 y dejaba ganar al del
índice. Los rótulos reales son `1…6`, seis pasos numerados espaciados regularmente, **que es lo
correcto**.

Lo que sí miente en ese diagrama son las duraciones reales —inmediato / esta semana / 3 semanas
/ 2-3 meses— y **no están en ningún `<text>` del SVG**: no es medible desde el DOM. `ux-lead` lo
encontró leyendo el contenido, que es donde estaba el dato, y mi instrumento no lo habría cazado
nunca. Corregido: se rechazan las fechas y los rótulos ordinales consecutivos se abstienen.

Estuvo a punto de pasar **porque coincidía con una conclusión que yo ya creía**. Es el sesgo de
confirmación con forma de verificación cruzada, y da más miedo que un falso positivo normal
porque llega disfrazado de buena noticia. **Un acierto por el motivo equivocado es un fallo que
todavía no se ha manifestado.**

**2. Una comprobación bloqueante se quedó sin sujeto y mi autoprueba se calló.** El caso 13.1
vigila que la página no diga «hoy le toca» para un riego que nadie marcó. Cuando lo escribí,
helecho, begonia y poto tenían `ancla: null`. A media sesión Carlos dio las fechas
(`3a5b2da`) y las siete pasaron a `calculable: true`. Mi test dejó de disparar —correctamente,
porque lee el JSON en vez de fijar las tres plantas— pero **la autoprueba siguió diciendo «4
defectos inyectados» cuando solo inyectaba 3.** En verde y sin decirlo, que es exactamente cómo
se esconde un falso negativo. Ahora elige la planta leyendo el JSON y, si no hay ninguna sin
ancla, declara `NO INYECTADO — este defecto no se puede probar hoy` y no lo cuenta como probado.

Y por eso, en esta pasada, **el punto 13.1 va como NO VERIFICADO, no como aprobado.** La
comprobación sigue viva y saltará sola si alguna planta vuelve a quedarse sin ancla; hoy no hay
contra qué probarla, y decir «cumple» sería exactamente el problema que este informe denuncia.

---

## Método: el sello, y una medición que no llegó al informe

Todo lo de aquí va sellado con el commit. Y esta pasada tuvo su propio caso, que apunto porque
demuestra que el mecanismo del informe 2 funciona en la práctica y no solo en el commit:

Midiendo la ficha del helecho me salieron **3.710 px con `js/ficha.js` modificado y sin
commitear**. El número era real. No significaba nada: no se podía atribuir a ningún estado del
código, así que no entró en el informe como resultado. La cabecera del runner lo dijo sola
(`+ 4 fichero(s) sin commitear`), y en otra pasada saltó el aviso fuerte:

```
⚠  EL CÓDIGO CAMBIÓ MIENTRAS SE MEDÍA — este resultado no es atribuible:
     js/app.js
   Repite la pasada con el árbol quieto.
```

También medí `movimiento.js --reduce` con el árbol sucio y salieron 3 fallos donde el informe 2
daba 0, dos de ellos bloqueantes por `element.animate()` ignorando la media query. **Se lo mandé
a `builder` etiquetado como aviso no atribuible, explícitamente no como hallazgo**, y la pasada
posterior contra producción limpia dio `26 efectos · 0 fallos`. Eran trabajo en curso. Si lo
hubiera reportado como defecto, habría mandado a alguien a arreglar algo que no estaba roto.

**Un número sin su estado no es una medición, es una anécdota.** Y quedó escrito como regla 0 de
`docs/qa/como-ejecutar.md`: no se mide con el árbol sucio.

---

## Referencia de producción antes de que aterrice la pasada 3

Sobre `3a5b2da` publicado (`index.html` sha256 `f6d839a85a7e`), la batería de accesibilidad
sigue entera en verde, igual que en el informe 2:

```
✓ estructura   0 fallos · 12 img · 7 article · 194 enfocables
✓ contraste    1.055 nodos · 0 bajo AA · 0 bordes < 3:1 · 24 no medibles
✓ foco         194 enfocables · 0 saltos · 2 bloques multicolumna (abstención) · 0 problemas
✓ movimiento   26 efectos · 0 fallos · bloque @media reduce: sí
✓ terceros     29 recursos, 2.141 KB · 0 externos · 69 <a> externos legítimos
✓ consola      0 errores, 0 warnings, 0 recursos caídos
```

Y los ejes de los diagramas publicados, con el auditor ya limpio:

| diagrama | veredicto | R² log / lineal / índice |
| --- | --- | --- |
| temperatura | **lineal** ✓ | 0,000 / **0,998** / 0,994 |
| recuperación | no medible — rótulos ordinales (1…6) | — |
| luz | no medible — categórico ordinal, y entonces es correcto | — |
| riego | no medible — solo 2 marcas con valor | — |

Coincide con las cuatro lecturas a mano de `ux-lead`, incluida la razón por la que `luz` es
correcto siendo de bandas regulares: sus categorías son ordinales, no tiempo.

---

---

## Veredicto de la pasada 3

**Medido sobre la web publicada**, `2a35d2d @origin/main`, `index.html` sha256 `4cc2e619d8ea`.

| | informe 1 | informe 2 | **informe 3** |
| --- | --- | --- | --- |
| Bloqueantes | 0 (+1 aparecido) | 0 | **0** |
| Altas | 2 | 1 | **0** |
| Medias | 6 | 0 | **1** |
| Nodos de texto bajo AA | 0 de 844 | 0 de 1.055 | **0 de 1.280** |
| Bordes de control < 3:1 | 8 | 0 | **0** |
| Saltos de orden de Tab | 0 | 0 de 194 | **0 de 234** |

**La ALTA que venía de los informes 1 y 2 está cerrada**, y esta vez con los objetivos de su
dueño y medida en las siete fichas.

Queda **una sola MEDIA**, y no es un defecto del producto: es un choque entre mi umbral de
movimiento con `reduce` (50 ms) y `--dur-corta` del proyecto (120 ms), que decide `ux-lead` y no
su medidor.

Levanté durante esta pasada una «ALTA-2» y **la he retirado: era un falso positivo mío y llegó
hasta `builder`.** Está contada más abajo con su causa, porque es el hallazgo más instructivo del
día y borrarla dejaría el informe más limpio y menos útil.

---

## CERRADA · El expediente ocupa el ancho, y ya no hay muros de texto

Contra los objetivos de `ux-lead` (`4f1b350`, `69ce939`, `5f3282e`), las siete:

| planta | sev. | ocupación (tope 20 %) | por tinta | carrera máx (tope 600) | sticky | alto (observación) |
| --- | --- | --- | --- | --- | --- | --- |
| begonia-elatior | atencion | **0 %** | 3 % | 552 px | ✓ `top:16px` | 4.049 px |
| coleo-grande | atencion | **3 %** | 6 % | 379 px | ✓ | 3.375 px |
| ficus-sunny | sana | **0 %** | 6 % | 424 px | ✓ | 3.307 px |
| coleo-pequeno | sana | **0 %** | 3 % | 200 px | ✓ | 3.229 px |
| poto | sana | **3 %** | 7 % | 169 px | ✓ | 3.037 px |
| margarita | sana | **0 %** | 4 % | 326 px | ✓ | 2.845 px |
| helecho | critica | **0 %** | 4 % | 401 px | ✓ | 2.802 px |

- **Ocupación: 0–3 % contra un tope del 20 %**, viniendo de 53–65 %. Y por mi perfil de tinta
  —el estricto— 3–7 %, así que las dos definiciones coinciden en que está cumplido. Los dos
  números están porque divergen en un caso concreto: un `<p>` a ancho completo cuya última línea
  llena la mitad. Hoy no se da.
- **Carreras sin ancla: la mayor son 552 px**, por debajo de los 600, viniendo de 1.109 px. Es la
  métrica que sustituyó a la altura y es la que de verdad medía «muro de texto».
- **La columna de acción pega de verdad** en las siete: `div.expediente__accion` con
  `position: sticky` y `top: 16px`. Comprobado que tiene desplazamiento y no un `top: auto`, que
  es el `sticky` declarado que no pega y no da ningún error. Que se quede pegada al scrollear no
  lo mido —hace falta scroll real y el runner usa viewport alto— y me abstengo en vez de firmarlo.
- **La altura bajó sola**, sin ser objetivo: de 3.543–4.719 a 2.802–4.049. Y **el helecho pasó a
  ser la más corta de las siete**, que es coherente con que su contenido no se tocó y lo que
  cambió fue el reparto.

**`docs/qa/p3-1280-helecho-expediente.png`** — las dos columnas, `QUÉ HAGO AHORA` a la izquierda
con los tres diagramas y el plan de seis pasos, `EN QUÉ ME BASO` a la derecha con el diagnóstico,
las causas plegadas con su `Por qué`, `LO QUE LA FOTO NO DICE` y la foto como prueba. El bloque
crítico va en rosa pálido con texto oscuro: el 1,19:1 del informe 1 sigue enterrado.

---

## VERIFICADA · La franja `HOY` no afirma nada que el JSON no sostenga

Texto literal de la franja publicada:

> **HOY** · MARTES, 11 DE AGOSTO — 10 TAREAS · 3 DE 7 PIDEN MIRADA.
> **VA TARDE** · BEGONIA ELATIOR · Cambiarla de la maceta de vivero a una de 15-17 cm con agujero
> · Debería haberse hecho hace 57 días.
> **HOY** · HELECHO · Cortar a ras los tocones secos de la poda — y 8 más, cada una en su ficha.

Cuatro comprobaciones, y las cuatro cierran con número:

1. **La fecha es la del navegador.** «martes, 11 de agosto» — y el 11/08/2026 **es** martes.
2. **«hace 57 días» es exacto.** De `desde: 2026-06-15` a hoy hay 57 días justos.
3. **Una sola vencida, y es la que toca.** Hay **3 rótulos «VA TARDE»** en pantalla y eso
   *parecía* un fallo, pero al atribuirlos son **1 sola planta**: begonia-elatior, mostrada en el
   chip, en el expediente y en la prosa. Mostrar la misma tarea en tres sitios es correcto. Mi
   test lo dejó como **indicio y no como fallo** precisamente para no mandar a nadie a arreglar
   esto, y luego lo cerré haciéndole contar plantas distintas en vez de rótulos.
4. **Las condicionadas están excluidas, y lo demuestra la aritmética.** La franja declara
   **10 tareas**:

   ```
   1 vencida + 4 de hoy + 5 de temporada sin condición   = 10   ← lo que dice la página
   … + las 8 condicionadas                               = 18   ← lo que diría el defecto
   ```

   Un solo entero decide si el render filtra por condición o solo por mes. **Filtra bien.** Y con
   eso queda cerrado el caso afilado: **`helecho`/`abonado` no aparece.** Es `tipo: temporada` con
   `meses: [4,5,6,7,8]`, agosto entra, el calendario cuadra perfectamente — y su `condicion` pide
   3 o 4 frondes sanas cuando al helecho le queda menos del 5 % de masa foliar. Abonarlo le
   quemaría las raíces. Es el único punto de esta web donde un fallo de filtrado **daña la
   planta**, y está bien resuelto.

### NO VERIFICADO (no «aprobado») · 13.1, el riego sin ancla

El punto que vigila que la página no diga «hoy le toca» para un riego que nadie marcó **se ha
quedado sin sujeto**: a mediodía helecho, begonia y poto tenían `ancla: null`, y Carlos dio las
fechas (`3a5b2da`), así que las siete están en `calculable: true`. No hay ninguna planta contra la
que probarlo, y no existe ningún «hoy toca regar» en la página.

**Va como no verificado a propósito.** La comprobación sigue viva y saltará sola si alguna planta
vuelve a quedarse sin ancla; decir «cumple» cuando no hay caso que lo pruebe sería exactamente lo
que denuncia este informe. `tests/autoprueba.js` lo declara `NO INYECTADO` en vez de contarlo.

---

## VERIFICADO · La cronología tiene un eje logarítmico de verdad

`ux-lead` sostenía que este diagrama era sólido, y lo es. Medido con la regresión, no con la
vista:

```
marcas del eje    1 semana → 388 px    1 mes → 518 px    1 año → 755 px    10 años → 949 px
R² contra log(valor)   0,9993     ← gana
R² contra el valor     0,7102
R² contra el índice    0,9885
veredicto              logarítmico
```

Y lleva la nota que hace legible la escala, que es la mitad del trabajo: *«El eje es logarítmico:
cada marca es diez veces la anterior. Sin eso, el poto ocuparía el ancho entero y las cuatro de
agosto serían un solo punto.»* Marcas rotuladas `HOY · 1 SEMANA · 1 MES · 1 AÑO · 10 AÑOS`, una
pista por planta —así los cuatro del día 0 no se apilan— y el valor en texto a la derecha.

Comprobado además que **«ayer» es correcto** y no un desfase: `fecha_llegada: 2026-08-10` y
`dias_en_casa: 1` en los cuatro. Iba a levantarlo como fallo y lo verifiqué antes.

**Y retiro una MEDIA que sí llegué a mandar a `botanist`:** le dije que en las cuatro compradas
`riego.ancla` (11) no cuadraba con `fecha_llegada` (10). Ya no ocurre — las anclas pasaron al 10 en
`6506081`, el mismo commit que movió las llegadas, y **mi pasada lo pilló abierto**. Mi segunda
hipótesis era la correcta («un arrastre de cuando `fecha_llegada` era el 11»), solo que el arrastre
duró lo que tardó en escribirse ese commit. Es la lección 4 de `retomar.md` otra vez, y esta vez la
provocó medir mientras se editaba el JSON. Retirada, y la invariante que sacó de ella —si
`ancla_tipo` es `llegada_a_casa`, `ancla` == `fecha_llegada`— queda anotada como test futuro.

**Los cinco diagramas: 0 fallos en normal y 0 en `reduce`.** Ninguno se queda invisible con
`reduce`, que era el fallo silencioso que buscaba: `animation: none` sin fijar el estado final.

---

## RETIRADA · La «ALTA-2» era un falso positivo mío, y llegó hasta `builder`

Este informe llevaba una ALTA que decía: *«con `reduce`, abrir una ficha lanza dos
animaciones de JS»*, con dos bloqueantes citando `element.animate()`. **La mandé a `builder` y
era falsa.** Él contestó lo único que hacía falta: en `js/` **no hay ni una llamada a
`.animate()`**. Comprobado sobre los seis módulos publicados:

```
app.js 0 · ficha.js 0 · tareas.js 0 · cronologia.js 0 · datos.js 0 · svg.js 0
```

El bug estaba en `tests/movimiento.js`. `document.getAnimations()` **no devuelve solo** las de
`element.animate()`: devuelve también `CSSAnimation` y `CSSTransition`. Mi código llamaba
«WAAPI» a todo lo que no tuviera `animationName` —o sea a cualquier transición de CSS— y después,
con `reduce` activo, culpaba **siempre** a `element.animate()`. Lo que corría de verdad:

```
article#helecho   box-shadow   transición CSS            1 ms
div.despegada     aparecer     animación CSS @keyframes  120 ms
```

Una transición de sombra de 1 ms y la animación de opacidad que `ux-lead` conserva **a
propósito** bajo `reduce`, porque orienta sin desplazar. Ninguna de las dos es lo que dije.

**Es mi propio patrón en su forma más cara: una herramienta que opina sobre la CAUSA cuando solo
puede ver el EFECTO.** El efecto era real —había animación viva con `reduce`— y la causa que
nombré no existía, así que **el arreglo que pedía era imposible de hacer.** Un teammate que se
hubiera fiado habría buscado durante media hora una llamada que no está en el código.

Y encontré una incoherencia interna que lo agravaba: la rama de transiciones ya eximía
`opacity`/`color` («el movimiento debe anularse, opacity/color sí puede quedarse») y la de
animaciones no, así que suspendía cualquier `@keyframes` de más de 50 ms **aunque no moviera
nada**. Dos reglas distintas para el mismo criterio en el mismo fichero. Ahora lee del CSSOM qué
propiedades toca el keyframe: si ninguna desplaza, se anota como aceptada. Y si no puede leerlo,
trata la duda como movimiento — en accesibilidad la duda se resuelve del lado seguro.

Con eso, `movimiento --reduce` sobre la ficha desplegada queda en **0 fallos**, y `aparecer`
aparece en el inventario como *«solo toca opacity: no desplaza, así que conservarla con reduce es
legítimo»*.

### Queda una MEDIA, y es un choque de especificaciones, no un bug

Mi umbral de movimiento perceptible con `reduce` son **50 ms**; `--dur-corta` de este proyecto son
**120**. La opacidad del despegue cae del lado suspendido por 70 ms. **Eso no lo decide el
medidor: lo decide el dueño de la dirección visual.** Está anotado en el código con esa frase, y
las animaciones que vienen de CSS bajan a `media` con la nota de que se citen en
`docs/decisiones.md` — porque el bloque `@media (prefers-reduced-motion)` **sí** las alcanza, y si
siguen vivas es porque alguien decidió conservarlas. Conservarlas puede ser correcto; lo que no
puede es no estar escrito.

---

## Sobre si el expediente estaba commiteado cuando lo medí: sí, y aquí está la prueba

`ux-lead` y el lead me dijeron —los dos, por separado y con buen argumento— que mi cierre de la
ALTA no era atribuible, porque `git grep expediente` sobre `HEAD` daba **cero** y por tanto el
reparto en dos columnas vivía solo en el árbol de trabajo de `builder`. Lo verifiqué antes de
defenderme, porque es exactamente lo que pido a los demás:

```
5f3282e   expediente en css/js/index.html:  0     ← el HEAD que midió ux-lead
347665d   expediente en css/js/index.html: 22     ← "Expediente, franja HOY y cronologia"
54d8050   expediente en css/js/index.html: 22     ← el commit que yo medí
2a35d2d   expediente en css/js/index.html: 22

publicado ahora:  js/ficha.js 5 · css/app.css 10
index.html publicado: 20.010 bytes (era 12.177 antes del expediente)
```

**Los dos teníamos razón sobre estados distintos.** `5f3282e` es anterior a `347665d`, que es
donde el lead commiteó el trabajo de `builder`; entre uno y otro hay cinco commits. Yo medí
`54d8050` y `2a35d2d`, los dos posteriores, y contra **producción**, que es un estado commiteado
por definición. **El cierre de la ALTA se mantiene.**

Y esto refuerza el argumento de `ux-lead` sobre por qué merece la pena auditar lo publicado
aunque duplique trabajo: la costumbre que parecía más incómoda es la única que fue inmune a este
fallo, porque producción no puede estar sucia.

---

## Batería completa sobre la web publicada

```
estructura   0 fallos · 12 img · 7 article · 234 enfocables
contraste    1.280 nodos · 0 bajo AA · 0 bordes < 3:1 · 24 no medibles
foco         234 enfocables · 0 saltos · 2 bloques multicolumna (abstención) · 0 problemas
movimiento   26 efectos · 0 fallos (portada) · 3 al abrir ficha con reduce → ALTA-2
terceros     31 recursos, 2.222 KB · 0 externos · 69 <a> externos legítimos
consola      0 errores, 0 warnings, 0 recursos caídos

check-tokens · check-estatico · validar-plantas · peso-assets · coherencia   los cinco en verde
```

`coherencia.py` incluye ya la regla nueva de `ux-lead`: **toda ficha `sana` lleva al menos una
`afirmacion`**. Verde en las cuatro. Es el defecto simétrico del rótulo `CAUSAS PROBABLES` — aquel
manufacturaba contenido, y una ficha sana que solo enseña riesgos manufactura alarma.

---

## §10 · El cronómetro

**10.1 — cuánto regar una planta concreta, en menos de 10 s.** Sobre `p3-1280-portada.png`, sin
scroll: el buscador está arriba a la derecha con su rótulo `BUSCAR PLANTA, SALA O SÍNTOMA` y el
placeholder *«poto, salón, hojas amarillas…»*, y la cronología nombra las siete. La ruta es
escribir el nombre → desplegar → `RIEGO` es el **primer** campo de `QUÉ HAGO AHORA`, con el reloj
de riego y el volumen en ml. **Tres acciones y el dato es el primero de la columna: cumple.**

**10.2 — de un vistazo, cuáles están mal.** La franja dice `3 DE 7 PIDEN MIRADA` con los tres
chips priorizados (`!! Helecho`, `! Begonia Elatior`, `! Coleo grande`) y el filtro `CÓMO VA` da
`Crítica 1 · Atención 2 · Sana 4`. **Cumple, y sin abrir nada.**

**10.5 — los `null` se muestran, no se rellenan.** El helecho: `nombre_cientifico` en `null` y la
ficha dice *«hace falta una fronde desarrollada, fotografiada de día, del haz y del envés»* en vez
de inventar la especie. `SIN ETIQUETA DE VIVERO` en helecho y poto. **Cumple.**

**10.6 — toxicidad.** Sin cambios respecto al informe 2, donde se verificó en las siete: cero
elementos legibles como aprobación y la frase «No significa que sea segura» literal en las cuatro
sin datos.

---

## §11 · Crítica visual, sin cortarme

El criterio de éxito nº1 es que sea **visualmente excelente**, y esto es lo que no automatiza
ningún script.

**Lo que está bien, y no por defecto:**

- **La paleta no es ninguno de los tres clichés del brief.** No es verde salvia sobre blanco, no
  es crema con serif y terracota de acento, no es casi-negro con verde ácido. Es **terracota
  saturado a sangre** —el barro de la maceta, no un acento— con las fichas como etiquetas de
  vivero en papel claro encima. La decisión de que el fondo sea el color de la maceta y no un
  neutro es la que salva la página de parecer generada.
- **La signature se puede nombrar, que es la prueba del 11.5: la etiqueta de vivero.** Código de
  barras, `Cód. 2040 1849`, precio, calibre, número de fitosanitario. Y lo que la hace buena es
  que **es honesta**: las dos plantas sin pegatina dicen `SIN ETIQUETA DE VIVERO / PROCEDENCIA SIN
  REGISTRAR` en vez de llevar un precio inventado. La signature no es decoración, es un dato.
- **La cronología logarítmica es lo mejor de la portada.** Enseña de un golpe algo que ninguna
  ficha cuenta —que en esta casa conviven una planta de veinte años y cuatro de ayer— y lo hace
  con la representación correcta en vez de la fácil. Con su nota explicando la escala. Es un
  gráfico que informa, no que decora, y son pocos.
- **La jerarquía tipográfica es una decisión.** Display condensada en mayúsculas para los
  rótulos, monoespaciada para todo lo que es dato (ml, °C, cm, €, EAN, fechas), y serif para la
  prosa del diagnóstico. Tres voces con tres trabajos. Lo de meter la cifra en monoespaciada es lo
  que le da el aire de cuaderno de campo y no de landing.
- **El expediente a dos columnas con los rótulos `QUÉ HAGO AHORA` / `EN QUÉ ME BASO`** es la mejor
  decisión de estructura de la sesión. Separa la acción de la justificación con palabras del
  dominio y no con jerga («resumen»/«detalle»), y hace que la columna izquierda se pueda leer sola
  cuando llevas la regadera en la mano.

**Lo que criticaría, en orden de cuánto me molesta:**

1. **La franja `HOY` está tipográficamente plana para ser lo primero que se lee.** `10 TAREAS · 3
   DE 7 PIDEN MIRADA` compite en peso con `VA TARDE` y con el nombre de la planta, y los tres van
   en tamaños parecidos. Lo que quiero saber al llegar es *qué hago hoy*, y ahora mismo hay que
   leer tres líneas para extraer «cambia la begonia de maceta». La cifra `57` de «hace 57 días»
   debería tener el peso que tiene el dato, no el del cuerpo de texto.
2. **`ayer` cuatro veces seguidas en la cronología pide una agrupación.** Cuatro filas con el
   mismo marcador en la misma x y la misma palabra a la derecha son cuatro filas diciendo lo
   mismo. Es correcto y es redundante; agrupar las cuatro en una banda («las cuatro de agosto»)
   contaría lo mismo con una cuarta parte de la tinta y dejaría el contraste real —20 años contra
   un día— más limpio.
3. **A 1280 el buscador queda visualmente descolgado.** Está en una tarjeta propia arriba a la
   derecha, alineada con el título pero sin relación de ritmo con él ni con la franja; parece
   pegada después. Es el único elemento de la portada que no participa de la retícula.
4. **La cronología ocupa una tarjeta enorme para siete filas de dato.** Mucho aire vertical entre
   pistas para lo poco que hay en cada una. Con las cuatro de agosto agrupadas y las pistas más
   apretadas, el mismo gráfico cabría en la mitad y ganaría densidad.

**11.9 — a 320 px sigue siendo bonita**, no solo funcional: la etiqueta aguanta porque su diseño
es vertical de origen. Sin scroll horizontal (`p3-320-portada.png`).

**Veredicto de §11:** esto **no** parece hecho por una IA, y la razón concreta es que las
decisiones que más se notan —el barro a sangre, la pegatina de vivero, el eje logarítmico, la
monoespaciada para las cifras— salen del mundo del sujeto y no del catálogo de defaults. Lo que le
falta para «excelente» sin matices es una vuelta de jerarquía en la franja `HOY` y densificar la
cronología. Las dos son de `ux-lead` y ninguna es bloqueante.

---

## Lo que sigue sin poder cerrarse, y lo digo en vez de firmarlo

1. **Escape sobre una ficha desplegada y el retorno de foco al disparador** (2.6). Necesita Tab y
   Escape reales; el runner no teclea. Tercer informe con esto abierto.
2. **Que la columna `sticky` se quede pegada al scrollear.** Compruebo que la propiedad está y que
   tiene desplazamiento —lo que descarta el `top: auto` que no pega— pero no el comportamiento,
   porque mido con viewport alto y sin scroll.
3. **Orden de Tab dentro de los 2 bloques multicolumna.** Mi test se abstiene a propósito: no
   puede decidir si el orden correcto es por filas o por columnas. Criterio de `builder` aceptado.
4. **FOUT en carga fría.** Medido siempre con fuentes cacheadas.
5. **El sello remoto solo huellea `index.html`.** Si cambian `css/`, `js/` o el JSON sin tocar el
   HTML, el sha256 no se mueve. En esta pasada el `index.html` publicado fue el mismo
   (`4cc2e619d8ea`) en todas las mediciones, así que son comparables entre sí — pero la garantía
   es más débil de lo que parece y conviene arreglarla antes de apoyarse en ella otra vez.

---

## La nota de método que quiero que sobreviva a la sesión

Esta pasada me ha cazado **cuatro falsos positivos propios**, todos antes de mandárselos a nadie,
y los cuatro del mismo tronco: **generalizar un instrumento sin generalizar sus criterios.**

| # | qué «detectó» | qué era en realidad |
| --- | --- | --- |
| 1 | el eje de recuperación codifica el índice | `01/09/2026` parseado como el valor `1` |
| 2 | ídem, otra vez, tras el primer arreglo | `+21 días` colado entre los pasos `1…6` |
| 3 | la cronología no se ajusta a nada (R² 0,18) | metí los nombres de planta como marcas de eje |
| 4 | la cronología es un SVG sin `role`/`<title>` | es un `<div>`: le aplicaba la regla de SVG |
| 5 | dos bloqueantes de `element.animate()` con `reduce` | **no hay ni una llamada a `.animate()`** en `js/`: `getAnimations()` también devuelve animaciones y transiciones de CSS |

**El nº5 es el único de los cinco que llegó a un teammate**, y es el más caro precisamente por lo
que tiene de distinto: los otros cuatro afirmaban un defecto inexistente, y éste **afirmaba un
efecto real con una causa inventada.** Había animación viva con `reduce` —eso era cierto— pero la
llamada que yo señalaba no existe en el código, así que el arreglo que pedía era imposible de
hacer. Lo cazó `builder` en una línea. **Una herramienta que opina sobre la causa cuando solo
puede ver el efecto es peor que una que se calla, porque manda a alguien a buscar algo que no
está.**

El nº1 es el que da más miedo, y no por el bug: **coincidía con una conclusión que `ux-lead` había
alcanzado a mano, así que llegó disfrazado de verificación cruzada independiente.** Estuve a punto
de escribirlo como una victoria del instrumento. **Un acierto por el motivo equivocado es un fallo
que todavía no se ha manifestado**, y el sesgo de confirmación es más peligroso en QA que un bug,
porque el bug no te felicita.

El nº2 enseña la corrección de la corrección: arreglé el caso (las fechas) en vez del criterio, y
el mismo diagrama volvió a colarse por otra puerta. La regla buena no era «rechaza fechas» sino
«si la mayoría de las marcas son ordinales consecutivos, esto no es una escala».

Y el nº3 y el nº4 vienen de haber ampliado el auditor a diagramas HTML sin preguntarme qué de lo
que medía seguía aplicando. La cronología ni siquiera se veía al principio: informaba de 28
diagramas y de ella **nada, ni fallo ni abstención**. Silencio, que es el peor resultado posible —
un instrumento que no encuentra algo y no dice que no lo encuentra.

De ahí `tests/autoprueba.js`, que existe por el error simétrico del que esta sesión no había
hablado. Los cinco falsos positivos de ayer eran de tests que opinaban sin poder saber; el falso
**negativo** es un test en verde que no mira nada, y no deja rastro en ninguna parte. **Un test que
nunca se ha visto fallar no está verificado: es una intención.**

Y me lo demostró a mí misma: cuando Carlos dio las fechas de riego, mi comprobación 13.1 se quedó
sin sujeto y la autoprueba siguió diciendo «4 defectos inyectados» inyectando 3. En verde y sin
decirlo. Ahora elige la planta leyendo el JSON y declara `NO INYECTADO` cuando no hay caso.

**La formulación del informe 2 sigue siendo la buena, y esta vez me la he aplicado a mí:** el coste
de un falso positivo en un equipo de agentes no es el de quien lo emite, es el del teammate al que
manda a arreglar lo que no está roto. El 2.400 px lo pagó `builder` durante dos pasadas. Los
cuatro de hoy no los ha pagado nadie, y esa es toda la diferencia.
