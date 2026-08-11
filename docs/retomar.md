# Retomar el trabajo

Escrito al pausar la sesión del **11 de agosto de 2026**. Este fichero lo mantiene el lead.

Lo primero que hay que entender: **los teammates no sobreviven a la sesión.** Mañana se
relanzan de cero y no recuerdan nada. Lo que sí sobrevive es lo que dejaron escrito, y por eso
`docs/brief.md` tiene 1.482 líneas y `docs/decisiones.md` 138 decisiones con sus alternativas
descartadas. Ese es el mecanismo: la memoria del equipo es el repo.

## Dónde está todo

- **Web publicada:** https://ccanado.github.io/MyPlants/ — se actualiza en cada push a `main`.
- **Repo:** github.com/ccanado/MyPlants (público, Pages desde `main` / raíz).
- **En local:** `python3 -m http.server 8000` desde la raíz.

## Estado al pausar

Los cuatro comprobadores en verde: tokens (142, sin un literal hardcodeado), estático (cero
terceros), contenido (huecos anotados, toxicidad con fuente) y el runner de QA (0 nodos bajo AA,
0 bordes de control bajo 3:1, 0 saltos de foco, 0 problemas de diana, consola limpia).

Hecho: las siete fichas con contenido verificado y entre 15 y 19 fuentes citadas por planta;
dirección visual cerrada y aprobada; tipografía self-hosted; siete siluetas de hoja; diez
iconos de campo; cuatro diagramas; histórico de estados; campo de manipulación.

**No terminado.** Falta lo que este proyecto considera la puerta de cierre: que `qa-visual`
firme una pasada con captura sobre el estado actual. Nadie ha visto todavía con los ojos los
cuatro diagramas ni la ficha crítica legible después del último arreglo.

## Verificado al cerrar, después de escribir lo de arriba

Llegaron informes tardíos y comprobé lo que afirmaban, porque uno decía que seguía habiendo un
bloqueante abierto. **No lo hay:**

- **El bloqueante de `estados` está cerrado.** `js/datos.js` usa `estadoVigente(p)`, que ordena
  por `fecha_foto` y no coge `estados[0]`, con el razonamiento escrito en el propio código. El
  informe que lo daba por abierto medía un estado anterior. Y `severidadesDe()` toma el **peor**
  de todos los estados, no solo el vigente: una planta con histórico sigue siendo crítica
  mientras alguna observación lo diga.
- **El diagnóstico llega a pantalla:** `tests/runner.py --abrir-todas --test cobertura-datos`
  da 7 plantas, 20 campos con contenido y **0 campos que no llegan a la página**.
- **El bloque de la ficha crítica ya va en pálido**, así que la decisión de no invertir un
  contenedor de texto está aplicada.
- **GitHub Pages está limpio:** 7 fichas pintadas bajo `/MyPlants/`, 0 recursos con error, 0
  peticiones externas, 6 de 6 fuentes cargadas. El fallo clásico de subdirectorio no se da.
- **Carga inicial: 218 KB** con la rejilla cerrada y **0 bytes de foto**, porque cada ficha es
  la etiqueta dibujada en CSS. El presupuesto del checklist se reescribió en esos términos:
  carga inicial < 400 KB, y el peso de abrir una ficha es una foto, no un acumulado.

`tests/` tiene ahora diez herramientas, todas ejecutables sin el MCP: `coherencia.py`
(todo `url()` local resuelve, y ninguna planta sin pegatina trae precio, EAN ni fitosanitario),
`enlaces-fuentes.py` (una petición por cita: 26 de 29 con 200, y clasifica 401/403/429/503 como
`MANUAL` y no como cita rota, porque POWO/Kew bloquea clientes automáticos) y
`cobertura-datos.js` (que el contenido llegue a la pantalla).

Queda una duda menor para `botanist`: `ipni.org` no está en la lista de dominios citables del
proyecto. IPNI es la fuente de la que POWO toma los nombres, así que probablemente sea legítimo
y lo que falte sea añadirlo a la lista.

## Cola pendiente, por dueño

**`builder`** — `index.html`, `css/app.css`, `js/`, `assets/img/`
1. La franja `HOY` con `tareas[]` y fecha real del navegador.
2. El diagrama de cronología (décadas / semanas / horas, eje logarítmico rotulado).
3. El expediente: dos columnas semánticas (`QUÉ HAGO AHORA` / `EN QUÉ ME BASO`), índice con
   recuento, y suprimir el resumen duplicado en los campos que ya traen diagrama. **No se va a
   reducir solo**: los 4.801 px se midieron con los diagramas dentro.

**`ux-lead`** — `css/tokens.css`, `docs/brief.md`
Nada bloqueante. Revisar la captura del expediente cuando exista.

**`botanist`** — `content/plantas.json`
Nada bloqueante. Las tres fechas de último riego que faltan (begonia, helecho, poto) dependen
de Carlos.

**`qa-visual`** — `tests/`, `docs/qa/`
La pasada 2 con capturas sobre el estado actual, y la pasada contra la URL publicada, que sirve
desde subdirectorio y es lo único no comprobable en local.

## Lo que hace falta de Carlos

1. **Temperatura de la calefacción en invierno.** Falta el segundo marcador del diagrama
   térmico. El tope de verano (28 °C, aire acondicionado) ya está.
2. **Cuándo se regaron por última vez la begonia, el helecho y el poto.** Es el ancla del
   calendario de tareas. Las cuatro compradas el 11 de agosto ya la tienen. Si no se sabe, se
   queda en `null` — no se estima.
3. **Las notas personales.** `notas` está vacío en las siete. `historia` sí está escrita. El
   panel de cuaderno solo se renderiza cuando hay contenido, así que no se ve ningún hueco,
   pero es la capa que distingue esto de cualquier web de jardinería.
4. **Fotos nuevas** cuando quiera un estado nuevo. El esquema ya es un histórico: `estados[]`
   con `fecha_foto` y `foto` por entrada.

## Cómo relanzar el equipo

Leer `CLAUDE.md`, este fichero y `docs/brief.md`. Después lanzar los cuatro teammates con el
reparto estricto de ficheros de `CLAUDE.md` y decirle a cada uno que invoque su skill:
`vanilla-web-craft` para `builder` y `qa-visual`, `plant-expert` para `botanist`,
`frontend-design` + `vanilla-web-craft` para `ux-lead`.

Dos avisos de operación que costaron tiempo y conviene no repetir:

- **El navegador de Playwright es un recurso exclusivo.** El MCP usa un perfil único de Chrome,
  así que dos teammates no pueden navegar a la vez. Usar `python3 tests/runner.py`, que levanta
  su propio Chrome y no depende del MCP. Acepta `--captura`, `--ancho`, `--completa` y `--abrir`.
- **Los mensajes se cruzan.** Antes de encargar algo, comprobar si ya está hecho:
  `grep -n "^### " docs/brief.md` y `git status`. Cuatro turnos se perdieron demostrando que
  algo ya estaba resuelto.

## Notas de aprendizaje

Están en `docs/brief.md` § "Notas de aprendizaje", y son la mitad del entregable. Las tres que
más valen:

1. **Un dato deducido entró en el contenido como si viniera del cliente.** El lead dedujo "sin
   sol directo" de la orientación noreste y lo pasó como contexto de la casa; se propagó a las
   siete fichas. Se detectó porque el reparto de ficheros obligaba a que el dato y el fichero
   estuvieran en manos distintas, y porque un teammate se negó a elegir entre dos fuentes en
   conflicto y lo marcó como abierto. Un solo agente con las dos cosas en la cabeza habría
   cerrado la contradicción sin enterarse de que existía.
2. **Un cambio correcto por un lado deja mudo a otro sin que nada dé error.** El contenido pasó
   de `estado` a `estados[]` y el render siguió leyendo el campo viejo: las siete fichas
   perdieron el diagnóstico entero con la consola limpia y los tres comprobadores en verde. De
   ahí salieron `avisarDeCamposAusentes()` en `js/datos.js` y `tests/cobertura-datos.js`.
3. **Cinco falsos positivos, todos del mismo tronco: una herramienta que opina cuando no puede
   saber.** Contar `@font-face` con `grep` (cuenta el código comentado), comparar orden de foco
   contra bandas horizontales en una rejilla de tarjetas, cruzar JSON contra JS con una regex que
   casaba cualquier variable llamada `p`, medir texto con `innerText` (omite lo que
   `content-visibility` salta), y tratar un 403 de bot-blocking como cita rota. La formulación de
   `qa-visual` es la que hay que recordar: **el coste de un falso positivo en un equipo de
   agentes no es el tuyo, es el del teammate al que mandas a arreglar lo que no está roto.** De
   ahí que los tests digan ahora "no medible" en lugar de inventarse un veredicto.

4. **Quien revisa necesita ejecutar, no leer.** El lead afirmó tres defectos que no existían
   —fuentes con 404, desbordamiento a 320 px, diagramas sin renderizar— las tres veces
   inspeccionando ficheros estáticos en vez de ejecutar la web, y dos de ellas mandaron a un
   teammate a arreglar algo intacto. El corolario: un resultado de QA solo vale si se puede
   atribuir a un estado concreto del código, porque medir mientras alguien edita produce
   conclusiones sobre el instrumento en lugar de sobre el objeto.
