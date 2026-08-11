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
   hallazgo real, y no se aprueba a ojo.
2. **Altura por severidad**, a 1280×900 — **≤ 3 pantallas (2.700 px)** en `critica` y
   `atencion`, **≤ 2 (1.800 px)** en `sana`. Dos tramos a propósito, y es la parte que mi número
   único hacía imposible: un solo umbral obliga a que una planta sin problema y una que se muere
   quepan en lo mismo, y la única forma de lograrlo es recortarle contenido a la que lo necesita
   o inventárselo a la que no.

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

## PENDIENTE — la pasada sobre el trabajo de `builder`

`builder` está construyendo `js/tareas.js` y `js/cronologia.js`. **No se mide hasta que sea
atribuible a un commit.** Queda por rellenar, con captura y dueño:

- §13.1–13.5 · la franja `HOY`: vencida única con `VA TARDE`, ninguna condicionada presentada
  como debida (caso afilado `helecho`/`abonado`), fecha del navegador.
- §13.6–13.9 · el expediente después: ocupación, altura por severidad, siete fichas, columnas.
- §13.10–13.15 · los diagramas en normal y en `reduce`.
- §10 con cronómetro · §11 crítica visual · la ficha del helecho para `ux-lead`.
- La pasada contra `https://ccanado.github.io/MyPlants/` con el trabajo ya publicado.
