# JS vanilla — patrones para este proyecto

Sin framework, sin build. El objetivo no es demostrar que se puede vivir sin React, es que
este JS siga siendo legible dentro de dos años sin reinstalar nada.

## Estructura de módulos

```
js/app.js          orquesta: carga datos, monta la UI, conecta eventos
js/datos.js        fetch + validación mínima del JSON
js/ficha.js        render de una planta (datos → nodo)
js/filtros.js      búsqueda y filtrado (funciones puras)
js/estado.js       el store mínimo
```

Exports nombrados siempre. `export default` en un proyecto de módulos pequeños solo obliga a
recordar cómo se llamaba el fichero.

## Carga de datos con fallo visible

Un `fetch` que falla en silencio deja la página en blanco y nadie sabe por qué:

```js
export async function cargarPlantas(url = "./content/plantas.json") {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar ${url}: ${res.status}`);
  const datos = await res.json();
  if (!Array.isArray(datos?.plantas)) throw new Error("Formato inesperado en plantas.json");
  return datos.plantas;
}
```

Y en `app.js`, el error se convierte en algo que el usuario ve:

```js
try {
  const plantas = await cargarPlantas();
  render(plantas);
} catch (err) {
  mostrarError("No se han podido cargar las plantas.");
  console.error(err);
}
```

Recuerda: los ES modules y `fetch` no funcionan con `file://`. Siempre
`python3 -m http.server 8000`.

## Render: datos entran, nodo sale

Ten el markup en el HTML dentro de un `<template>`, y en JS solo rellena. Así la semántica se
audita leyendo el HTML, y no hay `innerHTML` con datos:

```html
<template id="tpl-ficha">
  <article class="ficha">
    <h3 class="ficha__nombre"></h3>
    <p class="ficha__cientifico"><em></em></p>
    <img class="ficha__foto" width="640" height="480" loading="lazy" alt="">
  </article>
</template>
```

```js
const tpl = document.getElementById("tpl-ficha");

export function fichaDe(planta) {
  const nodo = tpl.content.cloneNode(true);
  nodo.querySelector(".ficha__nombre").textContent = planta.nombre_comun;
  nodo.querySelector(".ficha__cientifico em").textContent = planta.nombre_cientifico ?? "";
  const img = nodo.querySelector(".ficha__foto");
  img.src = `./assets/img/${planta.foto}`;
  img.alt = planta.alt ?? "";
  return nodo;
}
```

`textContent`, no `innerHTML`. Aunque el JSON sea nuestro, `textContent` es más rápido y no
te obliga a pensar en escapado nunca.

Para pintar la lista completa, construye en un `DocumentFragment` y haz **una** inserción:

```js
export function render(plantas, contenedor) {
  const frag = document.createDocumentFragment();
  for (const p of plantas) frag.append(fichaDe(p));
  contenedor.replaceChildren(frag);   // sustituye todo de golpe, sin parpadeo
}
```

## Estado: un objeto y una función

Suficiente para esta página. Lo importante es que el flujo va en una dirección: el estado
cambia, se vuelve a renderizar lo afectado. Nunca "corregir" el DOM a mano después.

```js
export function crearEstado(inicial, alCambiar) {
  let estado = inicial;
  return {
    get valor() { return estado; },
    actualizar(cambios) {
      estado = { ...estado, ...cambios };
      alCambiar(estado);
    },
  };
}
```

```js
const estado = crearEstado({ busqueda: "", filtro: null }, (s) => {
  render(filtrar(plantas, s), contenedor);
  anunciar(`${filtrar(plantas, s).length} plantas`);
});
```

## Delegación de eventos

Un listener en el contenedor, no uno por tarjeta. Sobrevive al re-render sin reconectar nada:

```js
contenedor.addEventListener("click", (e) => {
  const boton = e.target.closest("[data-planta]");
  if (!boton) return;
  abrirFicha(boton.dataset.planta);
});
```

## Accesibilidad desde el JS

- Cuando la lista cambia por búsqueda o filtro, anúncialo en una región `aria-live="polite"`.
  Sin eso, quien use lector de pantalla no percibe que pasó algo.
- Si abres un panel o diálogo: usa `<dialog>` nativo (`showModal()` te da foco atrapado y
  Escape gratis), y devuelve el foco al elemento que lo abrió al cerrar.
- Los controles que cambian de estado llevan `aria-pressed` o `aria-expanded` actualizado
  desde el mismo sitio que cambia el estado, no desde otro handler.

```js
const region = document.getElementById("resultado-aria");
export function anunciar(texto) { region.textContent = texto; }
```

## Rendimiento sin herramientas

- `replaceChildren` en lugar de vaciar con `innerHTML = ""` y volver a insertar en bucle.
- Nada de trabajo en el `scroll`: `IntersectionObserver` para lo que dependa de la
  visibilidad, y `ResizeObserver` en vez de escuchar `resize`.
- Si algo se ejecuta por cada tecla (búsqueda), un `debounce` de 120–150 ms basta.
- Datos derivados que se recalculan mucho: cachea en un `Map`, no montes reactividad.

## Antipatrones

| Tentación | Alternativa |
| --- | --- |
| `innerHTML = plantilla` | `<template>` + `cloneNode` + `textContent` |
| Un listener por tarjeta | Delegación en el contenedor |
| Variables globales en `window` | Módulo con estado encapsulado |
| `document.write`, `eval` | Nunca |
| Clases ES por costumbre | Funciones y closures: este JS no tiene jerarquías |
| Meter una librería de 3 kB para un `debounce` | Cinco líneas de `setTimeout` |
| `setTimeout` para "esperar a que exista el DOM" | `defer`/`type="module"` ya se ejecutan tras el parseo |
