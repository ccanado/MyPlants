# Informe 5 — de siete plantas a diez, y la casa deja de ser una habitación

**13 de agosto de 2026.** Pasada tras añadir `poto2`, `helecho2` y `croton`: contenido nuevo,
segunda tanda de fotos, y lo que su llegada dejó desfasado en el código y en los instrumentos.

> ## Sello de la medición
>
> **commit `ab28895` · árbol limpio · 14 ficheros medidos · 13 de agosto de 2026.**
> Ejecutado en un worktree aparte (`git worktree add --detach`), que es la única forma en que este
> proyecto acepta una firma: el runner se niega a medir con el árbol sucio y estampa
> `NO ATRIBUIBLE` si se le fuerza con `--sucio`.
>
> Y la otra mitad del sello, **la fecha**: el contenido de la portada se calcula con `new Date()`,
> así que estas cifras son del **13 de agosto**. Hoy eso se ve más que nunca en la propia salida —
> `12 COSAS QUE HACER HOY` incluye tareas fechadas hoy mismo, y mañana serán otras.

## Lo que se midió

```
1280×1400   ✓ sin desborde · 27 img · 10 article · 410 enfocables
1920×813    ✓ sin desborde · mismos 0 fallos de estructura
320×900     ✓ sin desborde (scrollWidth 320 = viewport) · 0 imágenes rotas de 27
            medido con Playwright, NO con el runner — ver «el instrumental» del informe 4

contraste   ✓ 2.522 nodos medidos · 0 por debajo de AA · 0 bordes de control < 3:1
            (con --reduce: 2.680 nodos, mismo resultado)
            154 no medibles, todos por el mismo motivo: `background-image` ancestro
            (eran 112 con siete plantas; el peor caso sigue declarado en css/tokens.css)
foco        ✓ 410 enfocables · 0 saltos de orden
movimiento  ✓ 254 efectos · 0 fallos · con --reduce: 192 efectos · 0 fallos
terceros    ✓ 46 recursos · 0 externos · consola limpia (0 errores, 0 warnings, 0 caídos)
            158 enlaces <a> externos, que son las fuentes citadas

franja-hoy  ✓ 0 fallos, 0 abstenciones · 65 tareas con data-tarea (eran 41)
diagramas   ✓ 38 diagramas · 0 fallos — después de arreglar el comprobador, ver D1
expediente  ✓ 10 fichas · ocupación 0 % de bandas cortas (tope 20 %)
              carrera sin ancla: peor 566 px (tope 600) · alto máx 5.516 px (observación)
cobertura   ✓ 10 plantas · 20 campos con contenido · 0 campos que no llegan a la página
autoprueba  ✓ 4 defectos inyectados; franja-hoy y diagramas dan ✗ con ellos puestos,
              que ES el resultado bueno

check-tokens     ✓ 137 tokens, 139 referencias · 0 tokens sin usar
check-estatico   ✓ estático, sin terceros, imágenes dimensionadas
validar-plantas  ✓ 10 plantas · campos completos, huecos anotados, toxicidad con fuente
coherencia       ✓ rutas resueltas, 7 con foto de etiqueta y 3 sin pegatina, derivados presentes
peso-assets      ✓ dentro de presupuesto · 2 avisos (los dos topes sin derivar de siempre)
enlaces-fuentes  ✓ 40 URLs citadas · 35 resuelven con 200 · 5 a comprobar a mano (POWO)
```

**El punto que más importaba, otra vez, es `cobertura-datos`: 0 campos que no llegan a la página.**
Con tres fichas nuevas escritas de cero, es la guarda de que ningún campo se quedó sin renderizar —
que es el fallo silencioso típico de añadir contenido: el dato existe, nadie lo pinta y nadie se
entera.

Y el segundo, `franja-hoy` con **0 abstenciones y 65 tareas**: las tareas de las plantas nuevas
entran en el día (`Meter el dedo en el sustrato y regar si está seco: llegó sin regar`) y **la guarda
de seguridad sigue puesta** — el abonado del helecho nuevo y del croton lleva `condicion` («no antes
de 3 o 4 semanas desde la compra») y por eso NO aparecen en la lista de `ESTE MES ABONAR`, donde sí
están las seis que pueden abonarse ya. Es exactamente el comportamiento que evita decirle a Noah que
abone una planta que acaba de llegar.

## Lo que trajo el contenido nuevo, medido

| | Antes (11-12 ago) | Ahora (13 ago) |
| --- | --- | --- |
| Plantas | 7 | **10** |
| Habitaciones | 1 (salón) | **2** (salón y cocina) |
| Tareas con `data-tarea` | 41 | **65** |
| Nodos de texto medidos | 1.788 | **2.522** |
| Elementos enfocables | 294 | **410** |
| Con riego registrado | 3 de 7 | **8 de 10** |
| Ítems de `causas_probables` | 38 | **56** |
| Fuentes citadas | 253 | **342** |
| Plantas `no_toxica` confirmadas | 0 | **1** |

## §11 · Revisión visual con criterio

| # | Punto | Veredicto |
| --- | --- | --- |
| 11.1 | No es verde salvia sobre blanco con monstera | ✓ |
| 11.2 | Cada elección tiene su procedencia escrita | ✓ |
| 11.5 | **Signature nombrable** | ✓ — y ahora la pegatina reconstruida tiene **tres emisores**: Projardín, el productor de la begonia y Leroy Merlin. Se dibuja con el dato de cada planta, no con una constante |
| 11.7 | Jerarquía tipográfica real | ✓ — `3 DE 10 PIDEN MIRADA` a 96 px |
| 11.9 | A 320 px sigue siendo bonita | ✓ — captura `p5-320-portada.png` |

### El criterio de aceptación heredado, con diez fotos en vez de siete

> *«Con las siete fotos puestas, la marca del helecho tiene que seguir siendo lo primero que se ve
> al abrir la portada. Se comprueba en captura, en color y en escala de grises.»*

Pasa, y conviene decir **por qué** pasa ahora, porque el motivo ha cambiado y eso importa más que el
✓. Con siete fotos el criterio dependía del grosor del filete —6 px la crítica, 3 la atención, 2 la
sana—, que es lo que se arregló en el informe 4 al descubrir que en gris la alarma era la marca más
floja. Con diez fotos el trabajo lo hace sobre todo **la separación en bandas**: la crítica está en
`PIDEN MIRADA · 3 DE 10`, arriba y con su propio encabezado, así que es lo primero que se lee incluso
sin distinguir un tono de otro. El grosor sigue ahí y sigue haciendo falta *dentro* de la banda,
donde conviven crítica y atención.

Capturas: `p5-1280-rejilla.png` en color y `p5-1280-escala-de-grises.png` en gris.

**Lo que este criterio ya no cubre, y hay que decirlo:** las tres plantas nuevas están sanas, así que
la banda de arriba tiene las mismas tres de antes. El criterio no se ha ejercitado con una alarma
nueva ni con una planta enferma en la segunda banda. Sigue verde y sigue sin haberse puesto a prueba
en el caso que vendrá.

## Defectos encontrados y arreglados en esta pasada

| # | Qué | Cómo se encontró |
| --- | --- | --- |
| D1 | **`diagramas` daba 7 fallos de «el dato solo existe en el dibujo»** sobre las siluetas de hoja. El rótulo con el rasgo existe, pero es hermano del `<div class="identificacion__silueta">` y el test solo miraba `parentElement`. **Falso positivo anterior a las plantas nuevas**: el mismo comprobador da 4 fallos sobre `aa7838e`. Lo que lo delató fue que **creciera con el inventario** | el runner, al pasar de 7 a 10 plantas |
| D2 | **El tope de imágenes daba ERROR con fotos correctas.** 2.500 KB planos para todas juntas: tres plantas más lo pasaron sin que nada estuviera mal. Sustituido por dos topes por planta derivados de lo medido | `peso-assets.py` |
| D3 | **`enlaces-fuentes` declaraba rota una API que responde JSON.** Pedía `Accept: text/html` y `api.gbif.org` contestaba 406 Not Acceptable, que es la respuesta correcta a lo que se le pedía | su propia salida, al no cuadrar con lo que devolvía la URL abierta a mano |
| D4 | **Rango «óptimo» de temperatura que repetía el tolerado** en los dos potos y el croton. El equivalente en texto del diagrama lo decía en voz alta: «aguanta de 18 a 30 °C, le gusta entre 18 y 30». Uno de los tres venía del 11 de agosto | **leyendo la página en el navegador.** Ningún validador podía cazarlo: los dos campos son válidos por separado |
| D5 | **El rótulo del diagrama térmico decía «el salón» escrito a mano.** Con los campos de la cocina en null la frase se calla sola, así que hoy no se veía — se arregla igual, porque el día que alguien mida la cocina habría rotulado como del salón una temperatura de otra habitación | lectura del código al escribir la ficha de la cocina |
| D6 | **La cabecera afirmaba una fecha de diagnóstico única.** Con dos tandas de fotos, «visto el 13 de agosto» habría sido falso para siete de las diez fichas. Ahora calcula el rango de las plantas | escribir el `estados[0]` de las nuevas |

### Sobre D1, que es el que enseña algo

El arreglo de un falso positivo es el sitio donde se cuela el vicio de *enseñarle al test a pasar*.
Aquí se comprobó explícitamente que no: **con la autoprueba puesta y una ficha abierta, `diagramas`
sigue dando ✗** por el eje rotulado como logarítmico que es lineal, y ✓ sin ella. Ese defecto
inyectado es lo único que separa «he arreglado el instrumento» de «he apagado el instrumento», y por
eso la autoprueba existe.

Detalle del procedimiento que conviene copiar: **antes de contar el fallo se atribuyó**. Se midió el
mismo comprobador sobre `aa7838e` —el commit anterior— y dio 4 fallos con siete plantas. Sin ese
paso, siete fallos aparecidos el día de un cambio grande se habrían leído como causados por el
cambio.

## Peso, medido y dicho

```
derivados de rejilla   692,3 KB los diez (480×640, el mismo encuadre a la mitad)
                       presupuesto 950 KB = 95 KB × 10 plantas
por planta, peor caso  411,5 KB el ficus (ficha 233,2 + rejilla 87,8 + etiqueta 90,5)
                       la más pesada de las nuevas es el croton, 394,6 KB
                       presupuesto 440 KB por planta
assets/img total       3.080 KB — informativo, ya sin tope plano
transferido peor caso  3.896 KB con TODO cargado (46 recursos), que no es la carga inicial:
                       las fotos de ficha son `lazy` y viven en un <details> cerrado
```

**Sigue faltando la medición en frío real** (checklist 9.7) con el panel de red sobre la web
publicada, y ahora hace más falta que antes porque hay tres fotos más. Es lo único de esta pasada que
se estima en vez de medirse, y queda dicho en vez de descubierto.

## Lo que queda, y por qué no se ha tocado

- **Los dos presupuestos que se incumplen en verde**: `css/app.css` 79,5 KB (tope 60) y `js/`
  162,4 KB (tope 60). El tercero de esa lista —el de imágenes— se ha resuelto esta pasada, y no por
  gusto: **daba error**. Sirve de pauta para los otros dos, que es la que ya estaba escrita: un tope
  se deriva de una medición o se retira. Y la lección nueva es más específica: **la pregunta a un
  tope no es solo de dónde sale el número, es de qué depende.** Si depende de algo que decide Carlos
  —cuántas plantas tiene—, tiene que escalar con ello o no es un tope, es un techo al proyecto.
- **La medición en frío del peso transferido**, arriba.
- **La publicación.** Estas cifras son de local sobre `ab28895`; el punto 9.6 del checklist pide
  además la pasada sobre la URL real (`runner.py --url`). Se hace cuando Pages haya desplegado.
- **`eje log R²=undefined`** en el modo que mide todo el documento. No es nuevo: el mismo modo da lo
  mismo sobre `aa7838e`. La regresión del eje logarítmico de la cronología (R² 0,9995 en el informe
  3) se mide en otra invocación, y este modo no la produce. Anotado, no arreglado: no impide firmar
  nada de esta pasada.

## El instrumental (esto no genera tarea, salvo lo dicho)

Tres hallazgos, en `docs/aprendizaje.md`, y **los tres cayeron en la excepción de «impide verificar
algo del alcance»**, que es la primera vez que pasa con todos:

1. Un presupuesto con la forma equivocada convierte añadir una planta en un fallo de rendimiento
   (D2).
2. Un comprobador que solo acepta HTML declara rota una API que funciona (D3).
3. Un dato puede ser coherente en el JSON, pasar los comprobadores y **solo verse mal en la frase
   renderizada** (D4). Es el simétrico del código de barras que no se pintaba: allí faltaba un
   dibujo, aquí sobraba una frase, y las dos cosas solo existen cuando algo se pinta.

Y una cuarta, que es del método y no del instrumental: **un falso positivo que crece con el
inventario se detecta mejor que uno estable.** Los 4 fallos de `diagramas` llevaban desde el 12 de
agosto sin que nadie los mirara; al convertirse en 7 el mismo día de un cambio grande, se
investigaron. Un fallo que no cambia se vuelve paisaje.
