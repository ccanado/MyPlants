# Informe 4 — la piel oscura aplicada a toda la web

**12 de agosto de 2026.** Pasada de la piel elegida por Carlos entre dos versiones renderizadas, y
cierre de los puntos que quedaban de v1.

> ## Sello de la medición
>
> **commit `730e97d` · árbol limpio · 14 ficheros medidos · 12 de agosto de 2026.**
> Ejecutado en un worktree aparte (`git worktree add --detach`), que es la única forma en que este
> proyecto acepta una firma: el runner se niega a medir con el árbol sucio y estampa
> `NO ATRIBUIBLE` si se le fuerza con `--sucio`.
>
> Y la otra mitad del sello, que este proyecto aprendió el mismo día: **la fecha.** El contenido de
> la portada se calcula con `new Date()`, así que estas cifras son del **12 de agosto**. El «cero
> desborde» del informe anterior era cierto el 11 y falso el 12 sin que nadie tocara el código.
> Un ✓ de ayer no es un ✓.

## Lo que se midió

```
1280×813    ✓ sin desborde · 19 img · 7 article · 294 enfocables
1920×813    ✓ sin desborde
320×900     ✓ sin desborde (scrollWidth 320 = viewport) · 0 imágenes rotas de 19
            medido con Playwright, NO con el runner — ver «el instrumental», abajo

contraste   ✓ 1.788 nodos medidos · 0 por debajo de AA · 0 bordes de control < 3:1
            (con --reduce: 1.903 nodos, mismo resultado)
            112 no medibles, todos por el mismo motivo: `background-image` ancestro
            PEOR CASO MEDIDO APARTE → 1.788 nodos · 0 bajo AA · 0 no medibles
foco        ✓ 294 enfocables · 0 saltos de orden (a 1280 y a 1920)
movimiento  ✓ 185 efectos · 0 fallos · con --reduce: 141 efectos · 0 fallos
terceros    ✓ 38 recursos · 0 externos · consola limpia (0 errores, 0 warnings, 0 caídos)

franja-hoy  ✓ 0 fallos, 0 abstenciones · 41 tareas con data-tarea
diagramas   ✓ 5 diagramas · 0 fallos
expediente  ✓ 7 fichas · ocupación 0 % de bandas cortas (tope 20 %)
              carrera sin ancla: peor 566 px (tope 600) · alto máx 5.621 px (observación)
cobertura   ✓ 7 plantas · 20 campos con contenido · 0 campos que no llegan a la página
autoprueba  ✓ 4 defectos inyectados; franja-hoy y diagramas dan ✗ con ellos puestos,
              que ES el resultado bueno: los instrumentos ven

check-tokens     ✓ 137 tokens, 139 referencias · 0 tokens sin usar
check-estatico   ✓ estático, sin terceros, imágenes dimensionadas
validar-plantas  ✓ campos completos, huecos anotados, toxicidad con fuente
coherencia       ✓ rutas locales resueltas, derivados de rejilla presentes
peso-assets      ✓ dentro de presupuesto · 2 avisos (ver «lo que queda»)
```

**El punto que más importaba de toda la pasada es `cobertura-datos`: 0 campos que no llegan a la
página.** Es la guarda contra el riesgo real de un rediseño —perder contenido sin que nadie se
entere— y dice que la piel nueva no se ha comido ni un dato de `botanist`.

## §11 · Revisión visual con criterio

| # | Punto | Veredicto |
| --- | --- | --- |
| 11.1 | No es verde salvia sobre blanco con monstera | ✓ |
| 11.2 | Cada elección tiene su procedencia escrita | ✓ — la cabecera de `tokens.css` dice de qué foto sale cada color |
| 11.3 | *(retirado: la web es campo oscuro con acento ácido, por decisión de Carlos)* | n/a |
| 11.4 | No es layout de periódico con hairlines | ✓ |
| 11.5 | **Signature nombrable** | ✓ — la pegatina térmica de Projardín, reconstruida en HTML y CSS dentro de `LA PRUEBA`, con su código de barras de gradiente al lado de la foto de la etiqueta real |
| 11.6 | La dirección sale del mundo del sujeto | ✓ — campo, ácido y rosa muestreados de las fotos de las plantas de la casa |
| 11.7 | Jerarquía tipográfica real | ✓ — del veredicto (hasta 96 px) al fitosanitario (11 px) |
| 11.8 | El espaciado tiene ritmo | ✓ — `--aire-banda` entre bandas, `--space-9` sin gastar hasta hoy |
| 11.9 | A 320 px sigue siendo bonita | ✓ — captura `p4-320-portada.png` |

### El criterio de aceptación heredado, y **no pasó a la primera**

> *«Con las siete fotos puestas, la marca del helecho tiene que seguir siendo lo primero que se ve
> al abrir la portada. Se comprueba en captura, en color y en escala de grises.»*

En color, sí. **En escala de grises, no**, y la medición lo dijo antes que el ojo: el contraste de
cada filete contra la tarjeta era **crítica 6,18 · atención 8,45 · sana 9,74**, o sea que la alarma
era la marca **más floja** de la rejilla en cuanto se iba el color. Exactamente al revés.

El brief ya decía qué hacer si esto pasaba, y no es tocar el color: *«la salida no es quitarle el
color a las plantas sanas, es subir la saliencia de la alarma por vía no cromática»*. Así que **el
grosor del canto codifica la severidad**: 6 px la crítica, 3 la atención, 2 la sana. Medido después,
como peso visual (grosor × contraste):

```
crítica  6 px × 6,18 = 37,1
atención 3 px × 8,45 = 25,3
sana     2 px × 9,74 = 19,5
```

El orden ya es el de la severidad y no depende de distinguir un tono de otro. Captura:
`p4-1280-escala-de-grises.png`.

## §10 · El trabajo que la página hace

| # | Punto | Veredicto |
| --- | --- | --- |
| 10.1 | < 10 s para saber cuánto regar una planta | ✓ — está en la cara de la tarjeta, sin abrir nada: `3 d riego verano` · `100 ml por riego` |
| 10.2 | De un vistazo se ve cuáles están mal | ✓ — y ahora además están **separadas en dos bandas** con su recuento |
| 10.3 | El riego se ve sin scroll infinito dentro de la ficha | ✓ — primer bloque de la columna de acción |
| 10.4 | Las dos capas se distinguen visualmente | ✓ — la voz de la casa es el único papel claro de la página, con itálica, tinta azul y el nombre de quien habla |
| 10.5 | Los `null` se muestran como no verificados | ✓ — «≥ 10 °C» en el helecho en vez de un máximo inventado |
| 10.6 | La toxicidad se encuentra rápido y cita fuente | ✓ |
| 10.7 | Buscar por síntoma funciona | ✓ **por primera vez** — el índice ya lleva `senales`, `causas[].resumen` y `patron`. Antes el placeholder prometía «síntoma» y el índice no tenía ninguno |

## Defectos encontrados y arreglados en esta pasada

| # | Qué | Cómo se encontró |
| --- | --- | --- |
| D1 | **Desborde horizontal de 68 px a 1280** (y 47 a 320). El rótulo de la franja iba con `hidden`, y siendo hijo de un `subgrid` eso lo saca de la rejilla: la fila perdía su primera celda y el nombre de la planta se corría a la columna de los títulos largos. **El comentario del código afirmaba lo contrario** y estaba escrito para prevenir justo ese fallo | `runner.py`, y solo porque cambió el día |
| D2 | **El código de barras de la pegatina no se pintó nunca.** El HTML traía `.etiqueta__barras` y el CSS estilizaba `.etiqueta__ean`, que no existe en el DOM. Es media signature del proyecto | leyendo el CSS contra el HTML. **Ningún comprobador lo mira** |
| D3 | En escala de grises la alarma era la marca más débil | la captura en gris del criterio de aceptación |
| D4 | CSS huérfano (`.parte__resto`, `.estado__diagnostico`, `.etiqueta__ean`, `.etiqueta__sin-codigo`) | lectura cruzada |
| D5 | `diagramaRecuperacion()` seguía exportada sin que la llamara nadie, dos semanas después de que su diagrama se borrara por afirmar algo falso | `grep` |
| D6 | El índice de búsqueda leía `p.estado?.diagnostico`, campo que el normalizador nunca ha producido, y volcaba `...p.plagas` —objetos— con lo que metía `[object Object]` | lectura cruzada `datos.js` ↔ `filtros.js` |
| D7 | `peso-assets.py` informaba de siete «huérfanos» que no lo eran: usaba `f.name` y desde que hay derivados en `rejilla/` hay dos ficheros con el mismo nombre | su propia salida, al no cuadrar |
| D8 | Bajo `reduce`, `.chip__enlace` seguía **declarando** una transición de `transform` aunque el valor no cambiara | `movimiento.js`, y tiene razón en mirar la propiedad declarada: es una promesa de movimiento aunque hoy no mueva |

## Peso, medido y dicho

El presupuesto viejo —«< 400 KB con la rejilla cerrada, **cero bytes de foto**»— estaba escrito
sobre la premisa que esta vuelta cambia, así que no se puede ni cumplir ni incumplir: se sustituye.

```
derivados de rejilla   468 KB los siete (480×640, el mismo encuadre a la mitad)
                       el más pesado 87,8 KB · el más ligero 31,9 KB
fotos de ficha         1.593 KB, y NO entran en la carga inicial: son `lazy` y viven
                       dentro de un <details> cerrado
assets/img total       2.061 KB (tope 2.500) ✓
```

Con `loading="lazy"`, de la rejilla solo baja lo que entra en el primer viewport. **Falta la
medición en frío real** (checklist 9.7) con el panel de red sobre la web publicada: es lo único de
esta pasada que se estima en vez de medirse, y queda dicho en vez de descubierto.

## Lo que queda, y por qué no se ha tocado

- **Dos presupuestos que se incumplen en verde**: `css/app.css` 78,8 KB (tope 60) y `js/` 156,6 KB
  (tope 60). Los dos topes son números redondos sin derivación, como el 20/62/600. **Un tope que se
  incumple en verde no es un tope**: o se deriva o se retira. No lo decido yo en una pasada de QA —
  un informe puede medir contra un objetivo, no crearlo.
- **La medición en frío del peso transferido**, arriba.
- **La publicación.** Estas cifras son de local sobre `730e97d`; el punto 9.6 del checklist pide
  además la pasada sobre la URL real (`runner.py --url`), que es la única medición inmune al
  problema del estado en movimiento, porque producción no puede estar sucia. Se hace cuando Pages
  haya desplegado el commit.

## El instrumental (esto no genera tarea, salvo lo dicho)

Cinco hallazgos, en `docs/aprendizaje.md`. Dos cayeron en la excepción de «impide verificar algo del
alcance» y por eso se arreglaron:

1. **`runner.py --ancho 320` no mide 320**: Chrome no baja de 500 px de ventana. El runner imprime
   el ancho real —es honesto— pero la petición no ocurre. Y `--dpr 2` tampoco vale: eso es el zoom
   al 200 %, que es otra cosa. Los 320 de este informe están medidos con Playwright, y el
   procedimiento quedó escrito en `como-ejecutar.md`.
2. **Ningún comprobador mira si un `background-image` llega a pintarse** (D2).
3. El auditor de contraste se abstiene ante cualquier `background-image` ancestro: 112 nodos. Aquí
   el peor caso **sí era construible** —los dos tonos del halo son más claros que el campo— así que
   se midió de verdad y salió limpio. Queda declarado en `css/tokens.css`.
4. Un aviso que nombra mal el fichero manda a alguien a mirar donde no está (D7).
5. Los descendientes de un `<details>` cerrado devuelven rectángulos con anchura en Chrome, así que
   un barrido de `getBoundingClientRect()` da cientos de falsos positivos de desborde. El dato que
   manda es el `scrollWidth` del documento.
