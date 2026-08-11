# Cómo ejecutar el QA de MyPlants

Todo lo de aquí funciona sin instalar nada: Python 3 de sistema y un navegador. Los ficheros
de `tests/` no son un framework — son cinco comprobaciones que se lanzan a mano, tres en el
navegador y dos en el terminal. Es a propósito: el proyecto no tiene build step y el QA
tampoco debería tenerlo.

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
```

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

Los cuatro ficheros `.js` de `tests/` son autocontenidos: cada uno se pega entero y devuelve
un objeto con el informe. No dependen entre sí ni de ninguna librería.

### 2a. Desde DevTools (rápido, para mirar algo concreto)

Abrir la consola en `http://localhost:8000/`, pegar el contenido del fichero y leer el objeto
que devuelve. Cada uno imprime además un `console.table` con lo que falla.

| Fichero | Qué responde |
| --- | --- |
| `tests/contraste.js` | ¿algún texto por debajo de AA sobre su fondo **real**? |
| `tests/estructura.js` | ¿landmarks, encabezados, `alt`, labels, `aria-live` en su sitio? |
| `tests/foco.js` | ¿el orden de Tab es el visual? ¿se ve el anillo de foco? |
| `tests/movimiento.js` | ¿qué se mueve, y se para con `reduce`? |
| `tests/terceros.js` | ¿ha salido alguna petición fuera del origen? |

### 2b. Desde Playwright MCP (lo que produce la evidencia del informe)

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

### 2c. Recorrido de teclado (no se automatiza del todo, y es el que más encuentra)

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

### 2d. Movimiento reducido

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
8. La lectura crítica: §10 y §11 del checklist.
9. `docs/qa/informe-N.md`, ordenado por gravedad y con cada fallo atribuido a su dueño.
10. `SendMessage` a cada dueño con lo suyo, y resumen al lead.
