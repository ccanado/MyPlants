# Informe de QA nº2 — MyPlants

**Fecha:** 11/08/2026 · **Autor:** `qa-visual`
**Medido sobre:** commit `7168e58`, **árbol limpio**, y sobre `https://ccanado.github.io/MyPlants/`
**Contrato:** `docs/qa/checklist.md`

## Veredicto

**Cero bloqueantes. Cero fallos de accesibilidad.** El bloqueante de `estados[]` del informe 1
está cerrado, y con él vuelve el diagnóstico, el filtro `CÓMO VA`, el orden por urgencia y los
tres escalones de severidad.

Queda **una alta**, la misma del informe 1 y por el mismo motivo: la ficha desplegada mide
**4.042 px**. Ha bajado de 4.801, pero sigue a **+68 % del objetivo de 2.400 px que `ux-lead`
se puso a sí mismo**. Y ahora sé por qué, que es lo que faltaba: **la mitad del ancho está
vacía**. No son dos problemas, es uno.

| | informe 1 | informe 2 |
| --- | --- | --- |
| Bloqueantes | 0 (+1 aparecido después) | **0** |
| Altas | 2 | **1** |
| Medias | 6 | **0** |
| Nodos de texto bajo AA | 0 de 844 | **0 de 1.055** |
| Bordes de control < 3:1 | 8 | **0** |
| Saltos de orden de Tab | 0 | **0** de 194 enfocables |

---

## La medición es atribuible, y esta vez se puede demostrar

```
commit 7168e58 (árbol limpio) · 12 ficheros medidos
```

`tests/runner.py` ahora sella cada pasada con el commit, si el árbol está sucio, y el `mtime`
de los doce ficheros que miden el resultado. Si alguno cambia **durante** la medición, el
informe lo dice y se niega a atribuir el número:

```
⚠  EL CÓDIGO CAMBIÓ MIENTRAS SE MEDÍA — este resultado no es atribuible:
     content/plantas.json
   Repite la pasada con el árbol quieto.
```

Sale de la petición del lead y **cazó una edición en vivo en su primera ejecución**: `botanist`
estaba tocando el JSON. Es exactamente el fallo que hizo que la misma pasada diera 10 fallos y
luego 0, y que costó un ciclo entero discutiendo si mi test parpadeaba. No parpadeaba: el
blanco se movía. Un número sin su estado no es una medición.

---

## Batería completa, en verde

```
check-tokens.py        ✓  135 tokens
check-estatico.py      ✓  cero terceros, imágenes dimensionadas
validar-plantas.py     ✓  (ver nota)
peso-assets.py         ✓  1.592 KB
coherencia.py          ✓  url() locales, foto_etiqueta, sin pegatinas inventadas
enlaces-fuentes.py     ✓  26/29 con 200 · 3 bloqueadas por bot, verificadas a mano

runner.py (commit 7168e58, árbol limpio)
  ✓ estructura   0 fallos · 12 img · 7 article · 194 enfocables
  ✓ contraste    1.055 nodos · 0 bajo AA · 0 bordes < 3:1 · 24 no medibles
  ✓ foco         194 enfocables · 0 saltos · 0 problemas de diana
  ✓ movimiento   26 efectos · 0 fallos · bloque @media reduce: sí
  ✓ terceros     29 recursos · 0 externos
  ✓ consola      0 errores, 0 warnings, 0 recursos caídos
```

**Los tres hallazgos de contraste del informe 1 están cerrados y verificados:** el borde del
buscador (era 1,92:1 sobre la teja), los siete tiradores `despegar` (1,49:1) y los diez nodos
a **1,19:1** —gris sobre rojo sólido, en el bloque crítico del helecho, o sea texto invisible
en la única planta que se está muriendo—. Los tres medidos otra vez sobre el render real: cero.

---

## Confirmado con los ojos, que era lo que faltaba

Todo esto es sobre la **web publicada**, no sobre local.

**`docs/qa/pages-1280-inicio.png`**

- La franja dice **«PARTE DEL DÍA · 3 DE 7 PIDEN MIRADA»**, con los tres chips priorizados:
  `!! Helecho`, `! Begonia Elatior`, `! Coleo grande`.
- **El helecho sale primero**, con el filete rojo en el canto. `ordenarPorUrgencia()` vive.
- Filtro `CÓMO VA` presente: `Crítica 1 · Atención 2 · Sana 4`. Las cuatro sanas **no llevan
  distintivo**, que es lo que pedía el brief.
- Las **siete siluetas de hoja** están, arriba a la derecha de cada ficha. La del helecho lleva
  `role="img"` y `<title>` = «Fronde de helecho sin identificar», y **la trama está dentro del
  contorno de la fronde**, no en la pegatina: la retirada de la decisión 51, confirmada.
- La distinción código/EAN es correcta: `Cód. 2040 1849` en el coleo de Projardín,
  `EAN 8437018857012` solo en la begonia.
- Helecho y poto: `SIN ETIQUETA DE VIVERO / PROCEDENCIA SIN REGISTRAR`. **Ni un precio, ni un
  EAN, ni un fitosanitario inventado.**

**`docs/qa/pages-1280-helecho-critica.png`** — la ficha crítica abierta

- Los **cuatro diagramas se construyen y se ven** (riego, luz, temperatura, recuperación).
  El lead los había dado por ausentes leyendo una captura; `builder` tenía razón.
- El bloque crítico es **blanco sobre rojo sólido y perfectamente legible**. El 1,19:1 ya no
  existe.
- Las causas van **plegadas**: una línea por causa y un `Por qué` que despliega el
  razonamiento. Los 35 `resumen` de `botanist` hacen su trabajo.
- 15 iconos de campo con `aria-hidden`, incluido el guante de `manipulacion`.

**`docs/qa/pages-1280-escala-de-grises.png`** — la prueba que `ux-lead` pedía

Los **tres escalones se distinguen sin color**: `!!` / `!` / nada, más la palabra
(`Crítica` / `Atención` / `Sana`) y el filete en el canto de la crítica. Ningún estado depende
del tono. **Punto 5.4 aprobado.**

**Toxicidad — el hallazgo con consecuencias fuera de la pantalla, medido en las siete:**

| estado | plantas | borde | texto |
| --- | --- | --- | --- |
| `toxica` | begonia, margarita, poto | `2,5px solid` | «Gatos: Tóxica · Perros: Tóxica» |
| `sin_datos` | coleo grande, coleo pequeño, ficus | `2,5px dashed` | «Sin datos en ASPCA… **No significa que sea segura**» |
| `sin_identificar` | helecho | `2,5px dashed` | «Sin identificar la especie, no se puede valorar. **No significa que sea segura**» |

**Cero elementos legibles como aprobación**: sin check, sin tick, sin verde, sin círculo
relleno. La frase obligatoria está literal y sin abreviar en las cuatro que la necesitan.
Dado que ASPCA sí tiene ficha de *Prostrate Coleus* —otra especie— como no tóxica, esto era el
riesgo real del proyecto y está bien resuelto.

---

## ALTA-1 (sigue abierta) · La ficha desplegada y la mitad vacía son el mismo problema

**Medido en la ficha del helecho, publicada:**

```
alto de la ficha abierta        4.042 px   (informe 1: 4.801 · −16 %)
objetivo de ux-lead             2.400 px   (+68 % por encima)
alto del bloque de diagnóstico  2.208 px
párrafos/viñetas largos            56      (informe 1: 51 — ha crecido)
```

Plegar las causas ha funcionado, pero ha recuperado solo 759 px. Y esto es lo que no sabíamos:

```
ancho de la ficha                1.200 px
ancho de la prosa del diagnóstico  557 px   (termina en x=640)
ancho sin usar a su derecha        600 px   = 50 % de la ficha
superficie vacía                600 × 2.208 px ≈ 1,3 millones de px²
```

**La columna de 557 px no es el fallo: son 74 caracteres por línea, que es medida de lectura
correcta.** El fallo es que **no hay nada en la otra mitad** durante 2.208 px de alto. El
diagnóstico se lee en una columna estrecha y a su derecha hay medio kilómetro de rojo.

O sea: la altura y el vacío son **el mismo problema visto por dos lados**. Y la medida nº1 que
`ux-lead` ya tiene planificada —dos columnas semánticas, `QUÉ HAGO AHORA` sticky y `EN QUÉ ME
BASO`— los resuelve los dos a la vez: ocupa la mitad vacía y, al hacerlo, parte la altura.
Un cálculo grueso deja la ficha en torno a **2.200–2.400 px**, justo en su objetivo.

**No está implementada todavía.** Lo que hay hoy es el plegado de causas. Así que no levanto
esto como una objeción a su plan: lo levanto como la confirmación medida de que su plan es el
correcto y de que hace falta entero.

---

## Lo que no puedo cerrar

1. **Orden de Tab dentro de 2 bloques multicolumna** (`section.mas-datos`). Mi test **se
   abstiene** a propósito: no puede decidir si el orden de lectura correcto es por filas o por
   columnas. El criterio de `builder` —en tarjetas se lee columna a columna, que es lo que hace
   el DOM— me parece correcto, y lo dejo dicho como criterio aceptado, no como comprobación.
2. **Escape sobre una ficha desplegada** y el retorno de foco al disparador.
3. **FOUT en carga fría.** Medido siempre con las fuentes ya cacheadas.

---

## Nota de proceso

Este informe se apoya en tres correcciones de instrumental hechas durante la sesión, y las
apunto porque son el aprendizaje reutilizable:

- `tests/foco.js` reportaba 198 saltos de orden inexistentes (comparaba una rejilla de tarjetas
  contra un orden de bandas horizontales). Hoy agrupa por contenedor y **se abstiene** en los
  multicolumna: 0 saltos reales.
- El cruce estático JSON↔JS daba 25 errores, ninguno real. **Retirado entero** y sustituido por
  `tests/cobertura-datos.js`, que mide en ejecución.
- `tests/enlaces-fuentes.py` daba 4 citas rotas que eran bot-blocking de POWO. Verificado en
  navegador —la URL del poto devuelve *Epipremnum aureum*— y reclasificado a `MANUAL`.

Los tres son el mismo error: **una herramienta que opina cuando no puede saber.** En un equipo
de agentes el coste de un falso positivo no lo paga quien lo emite, lo paga el teammate al que
manda a arreglar lo que no está roto. Esta sesión hemos gastado al menos tres ciclos así, entre
los míos y los ajenos. Por eso los tests ahora dicen «no medible» en vez de inventarse un
veredicto, y por eso la pasada se sella con el commit.
