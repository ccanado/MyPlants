# Cómo ejecutar el QA de MyPlants

Todo lo de aquí funciona sin instalar nada: Python 3 de sistema y un navegador. `tests/` no es
un framework — son cinco comprobaciones de navegador (`*.js`), una de disco (`peso-assets.py`)
y un lanzador que junta las dos cosas (`runner.py`). Sin dependencias, sin build: el proyecto
no tiene paso de compilación y el QA tampoco debería tenerlo.

**Si solo vas a ejecutar una cosa, que sea esta:**

```bash
python3 tests/runner.py          # 0 = todo bien · 1 = hay incidencias
```

El checklist que hay que rellenar con lo que salga de aquí es `docs/qa/checklist.md`.

---

## 0. Levantar la página

Desde la raíz del repo:

```bash
python3 -m http.server 8000
```

y abrir `http://localhost:8000/`.

**Con `file://` no vale.** Los ES modules y el `fetch` de `content/plantas.json` fallan por
CORS abriendo el `index.html` con doble clic. Si alguien reporta "a mí no me carga nada", esto
es lo primero que hay que preguntar.

Para dejarlo en segundo plano y poder seguir trabajando:

```bash
python3 -m http.server 8000 >/dev/null 2>&1 &
# al terminar:  kill %1
```

---

## 1. Comprobaciones de terminal

Se lanzan las cuatro seguidas. Las tres primeras son de los skills; la última es de `tests/`.

```bash
python3 .claude/skills/vanilla-web-craft/scripts/check-tokens.py     # disciplina de design tokens
python3 .claude/skills/vanilla-web-craft/scripts/check-estatico.py   # cero terceros, img dimensionadas, ES modules
python3 .claude/skills/plant-expert/scripts/validar-plantas.py       # contenido: campos, fuentes, toxicidad
python3 tests/peso-assets.py                                         # peso, dimensiones reales, rutas rotas
python3 tests/coherencia.py                                          # url() locales, foto_etiqueta, pegatinas inventadas
python3 tests/enlaces-fuentes.py                                     # que cada cita del JSON resuelva (sale a la red)
```

`tests/coherencia.py` y `tests/enlaces-fuentes.py` cubren huecos que no mira nadie más:

- Un `url()` **local** roto: `check-estatico.py` busca URLs externas, así que una ruta
  relativa que no existe le parece correcta. Descarta comentarios antes de buscar, que es
  el error que nos hizo reportar seis 404 de fuentes que estaban comentadas a propósito.
- `foto_etiqueta` / `alt_etiqueta`, campos que el validador de contenido no conoce.
- Datos de pegatina en una planta sin `etiqueta_vivero`: un precio inventado convierte la
  signature de la página en decoración falsa.
- Citas rotas. Es el único test que sale a la red, y a propósito: la restricción de cero
  terceros es para la **página**, no para el QA. Los 403 de POWO no se cuentan como rotos
  —bloquea clientes automáticos y la URL carga bien en un navegador— sino que se listan
  aparte como `MANUAL`.

Todo en verde, o no se cierra la tarea. Código de salida 1 = hay incidencias.

Qué mira `tests/peso-assets.py` que no mire ningún otro:

- Lee la cabecera de cada JPEG/PNG/WebP/AVIF a mano y compara las dimensiones **reales del
  fichero** con los `width`/`height` del HTML. Si no cuadran, la foto sale deformada o hay
  salto de layout, y eso no se ve en una captura estática.
- Comprueba que existe en disco cada ruta referenciada desde `index.html`, desde `css/*.css`
  y desde el campo `foto` de `content/plantas.json`.
- Presupuestos: 300 KB por imagen, 2,5 MB en total, 90 KB por fuente woff2, 60 KB de CSS y
  60 KB de JS.

---

## 2. Comprobaciones de navegador

Los cinco ficheros `.js` de `tests/` son autocontenidos: cada uno se pega entero en la consola
y devuelve un objeto con el informe. No dependen entre sí ni de ninguna librería, y por eso
valen igual pegados a mano que lanzados por `runner.py`.

### 2a. Con `tests/runner.py` — la vía por defecto

```bash
python3 tests/runner.py                                   # los 5 tests, 1280 px
python3 tests/runner.py --ancho 768 --alto 1000
python3 tests/runner.py --test contraste --test foco
python3 tests/runner.py --reduce                          # con prefers-reduced-motion
python3 tests/runner.py --abrir 1                         # abre la ficha nº1 antes de medir
python3 tests/runner.py --captura docs/qa/1280-inicio.png --completa
python3 tests/runner.py --json /tmp/informe.json          # el informe crudo, para hurgar
```

Levanta un servidor propio que sirve el repo pero inyecta los `tests/*.js` en la página raíz,
la abre en Chrome headless **con su propio perfil** y recoge el informe por POST. Devuelve 1 si
algo falla, así que sirve tal cual como puerta de salida.

Tres cosas que conviene saber:

- **No usa el Chrome del MCP de Playwright.** Ese servidor usa un perfil único: si otro
  teammate lo tiene abierto, `browser_navigate` responde `Browser is already in use` y QA se
  queda bloqueado. Este runner no depende de nadie y se puede lanzar en paralelo.
- **Mide el DOM ya pintado por `js/`.** En este proyecto es la única forma útil de auditar:
  `index.html` no contiene ninguna ficha, solo un `<template>`; las siete las construye
  `js/ficha.js` desde el JSON. Un checker estático sobre el HTML no vería nada.
- **Captura la consola desde antes que `js/app.js`.** El vigilante se inyecta como script
  clásico y los `type="module"` se aplazan, así que llega a tiempo de cazar los errores de
  arranque de la propia aplicación, los recursos que no cargan y las promesas sin capturar.

`--dump-dom` de Chrome **no** funciona en esta página (el evento `load` no llega a dispararse),
de ahí el POST. Está anotado en el código para que nadie lo intente otra vez.

### 2b. Desde DevTools (rápido, para mirar algo concreto)

Abrir la consola en `http://localhost:8000/`, pegar el contenido del fichero y leer el objeto
que devuelve. Cada uno imprime además un `console.table` con lo que falla.

| Fichero | Qué responde |
| --- | --- |
| `tests/contraste.js` | ¿algún texto por debajo de AA sobre su fondo **real**? |
| `tests/estructura.js` | ¿landmarks, encabezados, `alt`, labels, `aria-live` en su sitio? |
| `tests/foco.js` | ¿el orden de Tab es el visual? ¿se ve el anillo de foco? |
| `tests/movimiento.js` | ¿qué se mueve, y se para con `reduce`? |
| `tests/terceros.js` | ¿ha salido alguna petición fuera del origen? |
| `tests/cobertura-datos.js` | ¿todo lo que escribió `botanist` llega a la pantalla? |
| `tests/expediente.js` | ¿cuánto mide de alto la ficha abierta, y cuánto ancho se queda vacío? |
| `tests/franja-hoy.js` | ¿la franja `HOY` afirma solo lo que el JSON sostiene? |
| `tests/diagramas.js` | ¿el eje log es logarítmico, y con `reduce` se pinta el estado final? |
| `tests/autoprueba.js` | **no audita: contamina.** Inyecta defectos para probar que los dos de arriba ven |

`cobertura-datos.js` hay que lanzarlo con **`--abrir-todas`**, o marcará como ausente todo
lo que vive dentro de un `<details>` cerrado:

```bash
python3 tests/runner.py --abrir-todas --alto 3000 --test cobertura-datos
```

Solo reporta como error el **cable suelto**: un campo con contenido en las siete plantas
que no se ve en ninguna. Ese patrón no tiene explicación de diseño y es la firma del fallo
que lo motivó (`botanist` renombró `estado` a `estados`, `js/datos.js` siguió leyendo el
singular, y la portada llegó a afirmar «Las 7 están bien» con el helecho en `critica`, sin
un solo error en consola y con los cuatro scripts en verde). Lo demás va como aviso: que un
campo falte en una planta se explica casi siempre porque el render lo reescribe.

### 2c. Desde Playwright MCP (lo que produce la evidencia del informe)

Los ficheros no se pueden pasar por ruta: hay que meter el **cuerpo** dentro de una función.
El patrón para `browser_evaluate` es siempre este:

```js
() => {
  /* ← aquí se pega el contenido íntegro del fichero de tests */
}
```

Como cada fichero es una IIFE que **devuelve** su informe, hay que anteponerle `return`:

```js
() => { return (function(){ /* … contenido del fichero … */ })(); }
```

En la práctica es más cómodo pegar el fichero tal cual y llamar después al global que deja
registrado (`window.qaContraste`, `qaEstructura`, `qaFoco`, `qaMovimiento`, `qaTerceros`).

Secuencia completa de una pasada de QA:

```
browser_navigate            http://localhost:8000/
browser_console_messages    → tiene que estar vacío (0.2 del checklist)
browser_evaluate            contraste.js
browser_evaluate            estructura.js
browser_evaluate            terceros.js
browser_network_requests    → contrastar con lo que dijo terceros.js
```

### 2d. Recorrido de teclado (no se automatiza del todo, y es el que más encuentra)

`qaFoco.recorrer()` es un cribado: usa `.focus()` programático, que **no siempre dispara
`:focus-visible`**. La evidencia que vale es el Tab de verdad:

```
browser_evaluate    tests/foco.js                     → qaFoco.orden(): orden DOM vs orden visual
browser_press_key   Tab
browser_evaluate    () => window.qaFoco.actual()      → anillo, contraste del anillo, ¿en viewport?
browser_take_screenshot                               → prueba de que el foco se ve
… repetir Tab hasta cerrar el ciclo …
browser_press_key   Shift+Tab                         → la vuelta también
browser_press_key   Enter / Space                     → sobre cada tipo de control
browser_press_key   Escape                            → y comprobar que el foco vuelve al disparador
```

Para el retorno de foco tras Escape:

```js
() => ({ activo: document.activeElement.outerHTML.slice(0, 120) })
```

### 2e. Movimiento reducido

`prefers-reduced-motion` no se puede forzar desde JS: hay que emularlo en el navegador y
**recargar**. Con Playwright MCP:

```js
// browser_run_code_unsafe
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload();
```

y después `browser_evaluate` con `tests/movimiento.js`. El informe trae el campo `modo`, que
dice en cuál de los dos estados se midió — hay que ejecutarlo en **los dos**:

- movimiento normal → detecta bucles infinitos y parpadeos >3 Hz;
- `reduce` → detecta lo que se sigue moviendo cuando no debería.

Alternativas sin Playwright: DevTools `Cmd+Shift+P` → *Emulate CSS prefers-reduced-motion:
reduce*; o macOS → Ajustes → Accesibilidad → Pantalla → Reducir movimiento, y recargar.

Ojo con dos cosas que la media query **no** toca y el fichero comprueba aparte: el SMIL dentro
de SVG (`<animate>`, `<animateTransform>`) y las animaciones de `element.animate()`. Las dos
hay que pararlas desde JS consultando `matchMedia`.

---

## 2f. Los tres instrumentos de la pasada 3

```bash
# la única ALTA abierta: alto de la ficha y ancho sin usar, en la misma medición
python3 tests/runner.py --abrir 0 --alto 6000 --test expediente

# honestidad de la franja HOY: cruza content/plantas.json contra el DOM
python3 tests/runner.py --abrir 0 --alto 6000 --test franja-hoy

# los cinco diagramas, en los DOS modos
python3 tests/runner.py --abrir 0 --alto 6000 --test diagramas
python3 tests/runner.py --abrir 0 --alto 6000 --test diagramas --reduce
```

`--alto 6000` no es capricho: con un viewport corto, `content-visibility` y el lazy render dejan
media ficha sin layout y `getBoundingClientRect()` devuelve ceros. Es la misma trampa que hizo
que medir con `innerText` omitiera texto en la pasada 1.

**`expediente.js` mide la tinta, no las cajas.** Un `<p>` de ancho completo cuya línea de texto
llena la mitad devuelve la caja entera, y el hueco se vuelve invisible para el instrumento. Por
eso usa `Range.getClientRects()` sobre los nodos de texto y barre la región en líneas
horizontales de 4 px. `columnas_de_tinta` es el número que dice si el expediente a dos columnas
está construido de verdad: un `grid` declarado en CSS y sin repartir da 1.

**`franja-hoy.js` prefiere atributos y degrada cuando no los tiene.** Con `data-tarea`,
`data-planta` y `data-tarea-estado` en el DOM mide y firma; sin ellos baja el hallazgo a
`indicio` o se abstiene, salvo el «hoy toca regar», que se juzga solo. Los tres casos que mide
están en el punto 13 del checklist; el afilado es `helecho`/`abonado`, la condicionada cuyo mes
sí cuadra.

**`diagramas.js` hace la regresión del eje.** Contar rótulos no basta: comprueba que la posición
en píxeles sea lineal en `log(valor)` y contrasta el R² contra el ajuste lineal. Lee los valores
de `data-tick`, y si no están los parsea del rótulo (`1 h`, `1 día`, `1 año`); si tampoco puede,
se abstiene en vez de firmar.

## 2g. La pasada contra la web publicada, sin Playwright

Servir desde subdirectorio (`/MyPlants/`) es lo único que no se puede reproducir en local, y
hasta ahora era la única parte de la pasada que dependía del MCP de Playwright — que usa un
perfil de Chrome único y bloquea al resto del equipo mientras esté abierto. Ya no:

```bash
python3 tests/runner.py --url https://ccanado.github.io/MyPlants/ \
    --abrir 0 --alto 6000 --test expediente --test franja-hoy --test diagramas --test terceros
```

`--url` convierte el runner en **espejo**: reenvía todo el tráfico al sitio publicado, no solo la
portada. Así el navegador ve un único origen, las rutas relativas del documento siguen
resolviendo sin tocarlo y el `fetch` del JSON no se topa con CORS. La alternativa —inyectar un
`<base href>`— modificaría el documento que se está auditando, que es justo lo que no se puede
hacer en una auditoría.

Dos detalles que hubo que resolver y conviene no volver a descubrir:

- El HTML publicado enlaza con rutas absolutas que **ya llevan el subdirectorio**
  (`/MyPlants/css/app.css`). Servidas desde la raíz del espejo llegan con el prefijo puesto, y
  hay que quitarlo o se pide `/MyPlants/MyPlants/css/app.css`. Es el fallo clásico de
  subdirectorio, visto desde el otro lado.
- **El sello cambia de naturaleza.** Contra una URL remota el commit local no dice nada: Pages
  sirve lo que hay en `main` *en el remoto*, que puede ir por detrás. Así que el sello pregunta
  al remoto por su HEAD (`git ls-remote`), guarda el **sha256 del `index.html` servido** —la
  única prueba de qué se midió— y avisa en rojo si el remoto y el local no son el mismo código:

```
PUBLICADO · https://ccanado.github.io/MyPlants/
commit 58b2191 @origin/main · index sha256 f6d839a85a7e · 12177 bytes
⚠  el remoto sirve 58b2191 y en local estás en c88c36a: NO es el mismo código
```

Ese aviso es la versión remota de la regla 0. Un informe que dice «medido en producción» sin
decir *qué* había en producción no es atribuible a nada.

### Y la autoprueba, que se lee al revés

```bash
python3 tests/runner.py --abrir 0 --alto 6000 \
    --test autoprueba --test franja-hoy --test diagramas
```

`autoprueba` va **primero** (el runner ejecuta en el orden en que se piden) e inyecta cuatro
defectos conocidos. Después:

- **✗ en `franja-hoy` y ✗ en `diagramas` = BIEN.** Los instrumentos ven.
- **✓ en cualquiera de los dos = MAL.** Hay un falso negativo.

En la pasada del 11/08 salieron los cuatro, y el discriminante del eje fue inequívoco:
**R² 0,563 contra log frente a 0,9994 contra lineal.**

Esta pasada **no vale como pasada de QA**: la página queda contaminada a propósito. Se ejecuta
aparte, se lee, y la medición de verdad se hace en limpio.

Existe por el error simétrico del falso positivo. Un test que nunca se ha visto fallar no está
verificado: si su primera ejecución sale en verde, no se puede distinguir «no hay defectos» de
«mi test no sabe verlos», y el falso negativo no deja rastro en ninguna parte.

---

## 3. Screenshots del informe

Cuatro anchos obligatorios. Se guardan en `docs/qa/` y se referencian desde el informe.

```
browser_resize 320  800   → browser_take_screenshot  docs/qa/320-inicio.png
browser_resize 768  1000  → browser_take_screenshot  docs/qa/768-inicio.png
browser_resize 1280 900   → browser_take_screenshot  docs/qa/1280-inicio.png
browser_resize 1920 1080  → browser_take_screenshot  docs/qa/1920-inicio.png
```

Nombre: `<ancho>-<qué-se-ve>.png` — `320-ficha-abierta.png`, `1280-buscador-sin-resultados.png`,
`1280-foco-en-filtro.png`.

En cada ancho, además de la captura, comprobar que no hay scroll horizontal:

```js
() => {
  const e = document.scrollingElement;
  return { scrollWidth: e.scrollWidth, innerWidth: innerWidth, desborda: e.scrollWidth > innerWidth + 1 };
}
```

Y si desborda, encontrar al culpable:

```js
() => [...document.querySelectorAll('*')]
  .filter(el => el.getBoundingClientRect().right > innerWidth + 1)
  .slice(0, 10)
  .map(el => el.tagName.toLowerCase() + '.' + (el.className || '') + ' → ' + Math.round(el.getBoundingClientRect().right));
```

**Zoom al 200 %:** redimensionar a la mitad del ancho objetivo equivale al zoom al 200 % en
cuanto a layout — 640×540 se comporta como 1280 al 200 %. Captura de página completa y buscar
solapes y texto cortado.

---

## 4. Lo que no comprueba ningún script

Y que por eso va siempre en el informe escrito a mano:

- **Si el `alt` es útil.** Un checker sabe si existe; no sabe si dice algo. "Begonia Elatior
  con los bordes de las hojas secos" sirve; "planta" no.
- **Si la información se pierde en escala de grises.** El script marca las manchas de color
  sin texto; hay que mirar la captura en gris y leer la ficha entera.
- **Los 10 segundos.** Cronómetro de verdad: abrir en frío y averiguar el riego de una planta
  concreta. Es el punto 10.1 y es bloqueante.
- **Si parece hecha por una IA.** Puntos 11.x. Ningún script tiene opinión sobre eso.

---

## 5. Orden recomendado de una pasada completa

1. `python3 -m http.server 8000 &`
2. Las cuatro comprobaciones de terminal (§1). Si algo está rojo, se reporta ya a su dueño:
   no tiene sentido medir contraste sobre un CSS que no valida.
3. `browser_navigate` + `browser_console_messages`.
4. `estructura.js` → `contraste.js` → `terceros.js`.
5. Recorrido de teclado completo con capturas del foco (§2c).
6. `movimiento.js` en normal y en `reduce` (§2d).
7. Los cuatro anchos + el 200 % (§3).
8. Los tres instrumentos de la pasada 3 (§2f): `expediente`, `franja-hoy`, `diagramas` ×2 modos.
9. La lectura crítica: §10 y §11 del checklist.
10. `docs/qa/informe-N.md`, ordenado por gravedad y con cada fallo atribuido a su dueño.
11. `SendMessage` a cada dueño con lo suyo, y resumen al lead.

### Regla 0, la que se salta cuando hay prisa

**No se mide con el árbol sucio.** Antes de cualquier pasada que vaya a acabar en un informe:

```bash
git status --short        # tiene que estar vacío
```

La cabecera del runner lo dice en cada ejecución (`commit abc1234 (árbol limpio)` o
`+ N fichero(s) sin commitear`) y aborta la atribución si algún fichero se mueve **durante** la
medición. Los dos avisos existen porque los dos fallos ocurrieron:

- El 11/08 la misma pasada dio 10 fallos y luego 0, y se perdió un ciclo entero discutiendo si
  el test parpadeaba. No parpadeaba: `botanist` estaba editando el JSON. **El blanco se movía.**
- Preparando la pasada 3, una medición de la ficha del helecho dio 3.710 px con `js/ficha.js`
  modificado y sin commitear. El número era real y no significaba nada: no se podía atribuir a
  ningún estado del código, así que no entró en el informe.

Un número sin su estado no es una medición, es una anécdota. Y un resultado de QA solo vale si
se puede atribuir a un commit concreto, porque medir mientras alguien edita produce conclusiones
sobre el instrumento en lugar de sobre el objeto.
