# Checklist de aceptación — MyPlants

Derivado de `.claude/skills/vanilla-web-craft/references/a11y.md` más las restricciones duras
de `CLAUDE.md` y el trabajo que el brief le encarga a la página. Lo mantiene `qa-visual`.

**Regla de la casa:** un punto solo se marca cuando hay **evidencia**, y la evidencia dice
*cómo* se comprobó. "Se ve bien" y "no da error en consola" no marcan nada. Cada punto lleva
al lado su método y, cuando lo hay, el fichero de `tests/` que lo automatiza.

Leyenda de gravedad:
**B** bloqueante (no se entrega así) · **A** alta (hay que arreglarlo antes de cerrar) ·
**M** media (se puede entregar con ello anotado).

---

## 0. Que arranque siquiera

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 0.1 | B | `python3 -m http.server 8000` en la raíz y la página carga entera, sin paso previo | arrancar el servidor y abrir `http://localhost:8000/` |
| 0.2 | B | Consola del navegador limpia: 0 errores, 0 warnings, 0 404 | `browser_console_messages` tras cargar y tras interactuar |
| 0.3 | B | Las fichas se pintan de verdad desde `content/plantas.json` (no hay HTML hardcodeado de plantas) | contar `<article>` en el DOM vs plantas en el JSON — `tests/estructura.js` |
| 0.4 | A | Si el JSON falla, la página dice algo en el DOM; no se queda en blanco | renombrar temporalmente `content/plantas.json` y recargar |
| 0.5 | B | `check-tokens.py` en verde | `python3 .claude/skills/vanilla-web-craft/scripts/check-tokens.py` |
| 0.6 | B | `check-estatico.py` en verde | `python3 .claude/skills/vanilla-web-craft/scripts/check-estatico.py` |
| 0.7 | B | `validar-plantas.py` en verde | `python3 .claude/skills/plant-expert/scripts/validar-plantas.py` |
| 0.8 | A | `peso-assets.py` en verde | `python3 tests/peso-assets.py` |
| 0.9 | B | `coherencia.py` en verde: todo `url()` local resuelve, `foto_etiqueta`/`alt_etiqueta` correctos, ninguna pegatina inventada | `python3 tests/coherencia.py` |
| 0.10 | B | **Cero cables sueltos**: ningún campo con contenido en las 7 plantas que no se vea en ninguna | `python3 tests/runner.py --abrir-todas --alto 3000 --test cobertura-datos` |
| 0.11 | A | Toda cita del JSON resuelve (los 403 de POWO se comprueban a mano en navegador) | `python3 tests/enlaces-fuentes.py` |
| 0.12 | B | La franja del parte **coincide con el JSON**: si hay una `critica`, no puede decir "no hay nada urgente" | comparar `estados[].severidad` del JSON con el texto de `.parte` en el DOM |

## 1. Estructura semántica

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 1.1 | B | `<html lang="es">` | `tests/estructura.js` → punto `lang` |
| 1.2 | B | Exactamente un `<h1>`, jerarquía sin saltos (`h1→h2→h3`) | `tests/estructura.js` imprime el esquema de encabezados; leerlo entero y ver si tiene sentido a solas |
| 1.3 | B | Landmarks: un solo `main`, más `header` y `footer`. Contenido nada suelto fuera de landmark | `tests/estructura.js` → punto `landmarks` |
| 1.4 | A | Skip link como **primer** elemento enfocable, y **visible** al recibir foco | `tests/estructura.js` lo localiza; Tab una vez desde la barra de URL y screenshot para probar que se ve |
| 1.5 | B | Cada planta es un `<article>` con su encabezado real dentro | `tests/estructura.js` → punto `fichas` |
| 1.6 | A | La rejilla de plantas es `<ul>`/`<li>` (se anuncia "lista de N elementos") | `tests/estructura.js` → punto `listas` |
| 1.7 | M | Cada `<article>` con `aria-labelledby` apuntando a su título | `tests/estructura.js` |
| 1.8 | A | `<title>` útil y `<meta name="viewport">` sin bloquear el zoom | `tests/estructura.js` |

## 2. Teclado

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 2.1 | B | Tab llega a **todo** lo interactivo | recorrido real: `browser_press_key Tab` en bucle hasta volver al inicio, anotando cada parada |
| 2.2 | B | El orden de Tab coincide con el orden visual | `tests/foco.js` → `qaFoco.orden()` compara orden de DOM con posición en pantalla |
| 2.3 | B | Sin `tabindex` positivos | `tests/foco.js` y `tests/estructura.js` |
| 2.4 | B | Foco **siempre** visible, con anillo ≥3:1 contra la superficie donde aparece | tras cada Tab real: `qaFoco.actual()`; además screenshot de al menos 3 paradas distintas (fondo claro, tarjeta, botón) |
| 2.5 | A | Enter y Espacio activan lo que parece activable; ningún `div` con `onclick` | `browser_press_key Enter` / `Space` sobre cada tipo de control + `tests/estructura.js` punto `semántica` |
| 2.6 | A | Escape cierra lo que se haya abierto (ficha ampliada, filtro, diálogo) y **el foco vuelve al disparador** | abrir con teclado, `Escape`, y comprobar `document.activeElement` con `qaFoco.actual()` |
| 2.7 | A | Nada que solo funcione con hover: ni tooltips, ni datos que aparezcan al pasar el ratón | listar reglas `:hover` que muestren contenido (`tests/contraste.js` → `estados_a_medir_a_mano`) y confirmar que ese contenido también se alcanza con Tab |
| 2.8 | M | Dianas de al menos 24×24 px | `tests/foco.js` → `qaFoco.orden()` marca las pequeñas |
| 2.9 | A | El foco no se escapa a elementos ocultos ni queda atrapado | recorrido con Tab y Shift+Tab completo, ida y vuelta |

## 3. Semántica de controles

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 3.1 | B | Navega → `<a href>`. Actúa → `<button type="button">` | `tests/estructura.js` → `semántica` |
| 3.2 | B | El buscador tiene `<label>` asociado, no solo `placeholder` | `tests/estructura.js` → `labels` |
| 3.3 | B | Todo control tiene nombre accesible (texto, `<label>` o `aria-label`) | `tests/estructura.js` → `nombre accesible` |
| 3.4 | A | Los filtros reflejan su estado: `aria-pressed` / `aria-current` / `aria-expanded`, actualizados desde donde cambia el estado | pulsar cada filtro y releer el atributo con `browser_evaluate` |
| 3.5 | M | Sin ARIA decorativo ni `role` redundante sobre elementos que ya lo son | `tests/estructura.js` → `aria` |

## 4. Contenido dinámico — buscar y filtrar

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 4.1 | A | Al buscar o filtrar, el número de resultados se anuncia en `aria-live="polite"` | escribir en el buscador y leer el `textContent` de la región live con `browser_evaluate` |
| 4.2 | A | "Sin resultados" es texto en el DOM, no una rejilla vacía y ya está | buscar `"zzz"` y screenshot |
| 4.3 | A | Error de carga del JSON: mensaje en el DOM, no solo `console.error` | renombrar el JSON y recargar |
| 4.4 | M | Si hay estado de carga, se percibe sin depender del color | throttling lento en DevTools y screenshot |
| 4.5 | A | Filtrar no rompe el foco: quien filtró con teclado sigue donde estaba | filtrar con Enter y comprobar `document.activeElement` |

## 5. Color y contraste

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 5.1 | B | Texto normal ≥4.5:1 · texto grande (≥24px, o ≥18.66px con weight≥700) ≥3:1, **sobre su fondo real** | `tests/contraste.js` — mide color computado contra fondo compuesto, no token contra token |
| 5.2 | A | Bordes de controles y elementos gráficos con información ≥3:1 | `tests/contraste.js` → `controles_fallos` |
| 5.3 | A | Estados derivados (`:hover`, `:focus`, `:disabled`, `color-mix()`) también cumplen | `tests/contraste.js` lista las reglas; medirlas con hover real (`browser_hover` + `browser_evaluate`) |
| 5.4 | B | **Ninguna información solo por color.** Riego, luz, dificultad y salud se leen sin distinguir tonos | `tests/contraste.js` marca las manchas sin texto; además screenshot con filtro de escala de grises y leer la ficha entera |
| 5.5 | B | La toxicidad para mascotas nunca se codifica solo con color: lleva texto o icono con nombre | inspección directa de la ficha + escala de grises |
| 5.6 | M | Si hay modo oscuro, todo lo anterior se repite en oscuro | ejecutar `tests/contraste.js` en ambos esquemas |

## 6. Imágenes y SVG

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 6.1 | B | Toda `<img>` con `alt`: descriptivo si informa ("Begonia Elatior con los bordes de las hojas secos"), `alt=""` si decora | `tests/estructura.js` detecta ausencias y `alt` genéricos; los buenos se leen a mano — un checker no sabe si el `alt` es útil |
| 6.2 | B | `width` y `height` explícitos, y que **coincidan con el fichero real** | `tests/peso-assets.py` lee las dimensiones del JPEG y las compara |
| 6.3 | A | `loading="lazy"` en todas menos la primera visible | `tests/estructura.js` |
| 6.4 | A | Ninguna imagen rota (404 o ruta mal) | `tests/estructura.js` (`naturalWidth === 0`) + `tests/peso-assets.py` (rutas del JSON) |
| 6.5 | A | SVG informativo: `role="img"` + `<title>`. Decorativo: `aria-hidden="true"` + `focusable="false"` | `tests/estructura.js` → `svg` |
| 6.6 | B | Un SVG que explica un concepto (escala de riego, niveles de luz) tiene **su equivalente en texto al lado** | leer la ficha con las imágenes desactivadas y comprobar que no falta ningún dato |
| 6.7 | M | Ninguna imagen por encima de 300 KB; total por debajo de 2,5 MB | `tests/peso-assets.py` |

## 7. Movimiento

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 7.1 | B | Existe al menos un bloque `@media (prefers-reduced-motion: reduce)` si hay algo que se mueva | `tests/movimiento.js` → `hayBloqueReduce` |
| 7.2 | B | Con `reduce` activo no queda ninguna animación en bucle ni transición de `transform` | recargar emulando reduce y ejecutar `tests/movimiento.js` |
| 7.3 | A | Nada en bucle infinito por defecto | `tests/movimiento.js` con movimiento normal |
| 7.4 | B | Ningún parpadeo por encima de 3 Hz | `tests/movimiento.js` (marca ciclos < 0,34 s) |
| 7.5 | A | SMIL de SVG y `element.animate()` también se paran con reduce — la media query no los toca | `tests/movimiento.js` → `SMIL` y `animacionesJS` |
| 7.6 | M | `scroll-behavior: smooth` desactivado con reduce | `tests/movimiento.js` |

## 8. Zoom y responsive

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 8.1 | B | 320 px de ancho: **cero** scroll horizontal | `browser_resize 320` + `document.scrollingElement.scrollWidth <= innerWidth` + screenshot |
| 8.2 | A | Screenshots limpias a 320, 768, 1280 y 1920 px | `browser_resize` + `browser_take_screenshot`, guardadas en `docs/qa/` |
| 8.3 | B | Zoom del navegador al 200 %: nada solapado ni cortado | emular ancho 640 con DPR 2 (equivale a 1280 al 200 %) y screenshot a página completa |
| 8.4 | A | Bloques anchos (tablas, listas de fuentes, nombres científicos largos) scrollean dentro de su contenedor, no del body | inspección + 8.1 |
| 8.5 | B | Tipografía en `rem`, nunca `px` | `check-tokens.py` + rejilla: subir el tamaño base del navegador a 24px y recargar |
| 8.6 | M | Con el tamaño base del sistema al 200 % la página sigue usable | ajuste en el navegador y screenshot |

## 9. Cero terceros y rendimiento

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 9.1 | B | Ninguna petición sale del origen, ni al cargar ni al interactuar | `browser_network_requests` tras el recorrido completo + `tests/terceros.js` |
| 9.2 | B | Tipografías self-hosted en `assets/fonts/`, en woff2, con `font-display: swap` | `tests/terceros.js` → `fuentes_cargadas` + `peso-assets.py` |
| 9.3 | A | Sin `preconnect`/`dns-prefetch`/analytics/beacons | `tests/terceros.js` → `sospechas` |
| 9.4 | M | Los `<a>` externos de las fuentes citadas son enlaces legítimos y **no** peticiones; con `rel="noopener"` si abren en pestaña nueva | `tests/terceros.js` → `enlaces_externos` |
| 9.6 | B | **Publicada en GitHub Pages** (`/MyPlants/`, subdirectorio): las fichas pintan, 0 recursos con error, 0 peticiones externas, 0 imágenes rotas | `browser_navigate` + `performance.getEntriesByType('resource')` sobre la URL real |
| 9.7 | A | **Peso transferido en la carga inicial** con la rejilla cerrada (HTML+CSS+JS+JSON+fuentes, cero bytes de foto) | suma de `transferSize` en la carga en frío. Presupuesto: **< 400 KB** |
| 9.8 | M | Peso de abrir una ficha: **una** foto, no acumulado | `transferSize` de la imagen tras desplegar |
| 9.5 | M | Sin salto de layout al cargar (las imágenes reservan su hueco) | grabar la carga y comparar el primer frame con el estable; `aspect-ratio` + width/height |

## 10. El trabajo que la página tiene que hacer

Esto no está en ningún checklist de a11y y es la mitad del encargo. Se comprueba **con el
cronómetro**, no con la intuición.

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 10.1 | B | **Menos de 10 s**: abrir la página y averiguar cuánto hay que regar una planta concreta | cronómetro desde la carga en frío hasta leer el dato de riego de una planta nombrada. Si hace falta buscar, filtrar y abrir un modal, ya se han ido |
| 10.2 | A | **De un vistazo**: se ve cuáles están enfermas o regular sin abrir nada | screenshot de la vista inicial: ¿se distinguen los estados desde ahí? |
| 10.3 | A | El dato de riego es visible **sin scroll infinito** dentro de la ficha | abrir una ficha y medir cuánto scroll hace falta |
| 10.4 | A | Las dos capas —dato botánico verificado y nota personal de Carlos— se distinguen **visualmente**, no solo por el rótulo | screenshot de una ficha: ¿se nota que "notas_carlos" es otra cosa que "riego"? |
| 10.5 | A | Los datos `null` (no verificables) se muestran como "no verificado", no se ocultan ni se rellenan | buscar una planta con campos `null` en el JSON y ver qué pinta la ficha |
| 10.6 | A | La toxicidad para mascotas se encuentra rápido y cita su fuente | cronómetro: de la portada al dato de toxicidad de una planta |
| 10.7 | M | Buscar por el nombre que Carlos usa ("la de la entrada") funciona igual que buscar por nombre científico | probar los dos en el buscador |

## 11. Revisión visual con criterio

El criterio de éxito nº1 es que la web sea **visualmente excelente**. Esto no se automatiza;
se mira y se dice. Y el brief prohíbe explícitamente el "look de IA".

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 11.1 | A | **No** es verde salvia sobre blanco con fotos de monstera | mirar la screenshot de 1280 y preguntarse: ¿es esto lo que saldría de pedirle "web de plantas" a cualquier generador? |
| 11.2 | A | **No** es fondo crema `#F4F1EA` + serif de alto contraste + acento terracota | leer `css/tokens.css` y comparar con los tres clichés del brief |
| 11.3 | A | **No** es fondo casi negro con un único acento verde ácido | ídem |
| 11.4 | A | **No** es layout tipo periódico con hairlines y `border-radius: 0` por defecto | ídem |
| 11.5 | A | Hay una **signature** reconocible: un elemento por el que se recuerda esta página | señalarlo por su nombre. Si no se puede nombrar, no existe |
| 11.6 | A | La dirección sale del mundo del sujeto (etiqueta de vivero, cuaderno de campo, lámina botánica, escala de riego), no del catálogo de defaults | contrastar con la sección "Restricción anti-genérico" de `docs/brief.md` |
| 11.7 | M | La jerarquía tipográfica es una decisión: hay contraste de tamaño y peso reales, no todo a 16 px | medir los `font-size` computados de la ficha |
| 11.8 | M | El espaciado tiene ritmo: no todo separado por lo mismo | inspección de la rejilla |
| 11.9 | A | En 320 px sigue siendo bonita, no solo funcional | screenshot de 320 |

## 12. Higiene de proyecto

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 12.1 | M | Ningún valor de color, tipo o espaciado fuera de `css/tokens.css` | `check-tokens.py` |
| 12.2 | M | Sin tokens definidos y no usados que sean paleta muerta | `check-tokens.py` (avisos) |
| 12.3 | M | Sin `.DS_Store` ni `docs/plants/` duplicando `assets/img/` en el repo | `git status` y `.gitignore` |
| 12.4 | M | Las decisiones con alternativas descartadas están en `docs/decisiones.md` | leer el fichero |

---

## 13. La franja `HOY`, el expediente y la cronología

Superficies nuevas de la pasada 3. La franja `HOY` es **contenido de uso**, y el estándar de
honestidad de este proyecto no baja porque el dato no sea botánico: si un dato botánico que no
se puede verificar va a `null` y se anota, un dato de calendario que no se puede calcular no
puede presentarse como una orden.

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 13.1 | B | **Ningún «hoy le toca» para un riego que nadie ha marcado.** `helecho`, `begonia-elatior` y `poto` tienen `riego.calculable: false` y `ancla: null` | `tests/franja-hoy.js` → caso `riego afirmado sin dato`. No necesita atributos: la frase se juzga sola |
| 13.2 | A | **Exactamente una tarea vencida**, y es `begonia-elatior` / `trasplante` (`desde: 2026-06-15`), con el rótulo `VA TARDE` visible | `tests/franja-hoy.js` → casos `vencida inventada` / `vencida perdida` + captura para el rótulo |
| 13.3 | B | **Ninguna tarea condicionada presentada como debida, aunque el calendario cuadre.** El caso afilado es `helecho` / `abonado`: `tipo: temporada`, `meses: [4,5,6,7,8]`, agosto **sí** entra, pero `condicion` exige 3-4 frondes sanas y el helecho está sin hoja | `tests/franja-hoy.js` → caso `condicionada presentada como debida`. Es el único punto de la web donde un fallo de filtrado **daña la planta** |
| 13.4 | A | La fecha de la franja es la del navegador, no una constante | `tests/franja-hoy.js` → caso `fecha congelada` |
| 13.5 | M | Las tareas que sí tocan hoy aparecen: no se pierde trabajo real | `tests/franja-hoy.js` → caso `trabajo real que no se muestra` |
| 13.6 | A | **La ficha desplegada ≤ 2.400 px** (el objetivo que `ux-lead` se puso a sí mismo) | `tests/expediente.js` → `alto_ficha_px` |
| 13.7 | A | **El ancho se usa:** hueco derecho medio < 25 %. Altura y hueco son el mismo problema (informe 2) | `tests/expediente.js` → `hueco_derecho_medio_pct`, `superficie_vacia_px2` |
| 13.8 | M | El expediente pinta **dos columnas de tinta de verdad**, no un `grid` declarado y sin repartir | `tests/expediente.js` → `columnas_de_tinta` |
| 13.9 | M | La prosa sigue en medida de lectura (≈65-80 caracteres por línea) después de repartir el ancho | `tests/expediente.js` → `caracteres_por_linea_max` |
| 13.10 | A | **El eje logarítmico de la cronología lleva marcas rotuladas** | `tests/diagramas.js` → caso `eje logarítmico sin marcas rotuladas` |
| 13.11 | A | **Y es logarítmico de verdad:** la posición en px es lineal en `log(valor)`, R² ≥ 0,97 | `tests/diagramas.js` → `eje_logaritmico.r2_contra_log`, contrastado con `r2_contra_lineal`. Un eje rotulado y mal escalado engaña **más** que uno sin rotular, porque parece verificado |
| 13.12 | A | **Con `reduce`, las de un disparo pintan el estado final; no parpadean en 1 ms** | `tests/diagramas.js --reduce` → caso `con reduce parpadea en vez de pintarse` |
| 13.13 | B | **Con `reduce`, ningún diagrama desaparece.** `animation: none` sin fijar `opacity`/`stroke-dashoffset` deja el elemento en su estado inicial: invisible, y sin un error en consola | `tests/diagramas.js --reduce` → caso `con reduce el diagrama no se pinta`. La página no puede castigar a quien activó una opción de accesibilidad |
| 13.14 | A | Los cinco diagramas tienen equivalente en texto (6.6) y `role`/`title` o `aria-hidden` coherente (6.5) | `tests/diagramas.js` → `inventario` |

## 14. Que los instrumentos vean

Un test que nunca he visto fallar no es un test verificado, es una intención. El falso negativo
—un test en verde que no mira nada— es el error simétrico del falso positivo y no deja rastro.

| # | Gr | Punto | Cómo se comprueba |
| --- | --- | --- | --- |
| 14.1 | A | `franja-hoy` y `diagramas` cazan los defectos que dicen cazar | `python3 tests/runner.py --abrir 0 --alto 6000 --test autoprueba --test franja-hoy --test diagramas`. **Se lee invertido:** ✗ en los dos = los instrumentos ven; ✓ = falso negativo |
| 14.2 | B | Toda medición va sellada con su commit, y ninguna se firma con el árbol sucio | cabecera de `tests/runner.py`: `commit`, `árbol limpio` / `N sin commitear`, y `⚠ EL CÓDIGO CAMBIÓ MIENTRAS SE MEDÍA` |
| 14.3 | A | Cuando un test no puede saber, dice `no medible` con el motivo en vez de inventar un veredicto | campos `no_medible` / `abstenciones` en los informes |

## Cómo se marca

En `docs/qa/informe-N.md`, por punto: **estado** (✓ / ✗ / n/a), **evidencia** (comando ejecutado,
captura, o valor medido) y, si falla, **dueño** (`builder`, `ux-lead`, `botanist`).
Un ✗ bloqueante significa que la respuesta a "¿esto está terminado?" es no.
