/**
 * Las siete siluetas de hoja.
 *
 * No son decoración: al quitar las fotos de la rejilla, las fichas se
 * distinguían solo por el texto del nombre. La forma de la hoja es la clave de
 * identificación botánica, así que aquí es información — y en la margarita es
 * literalmente la prueba de que la etiqueta miente.
 *
 * Un solo trazo, silueta cerrada, sin relleno, `currentColor`. **Ninguna se
 * anima**: son el ancla para escanear la rejilla y algo que se mueve no ancla
 * nada. Es el único elemento del sistema sin versión reducida porque no hay
 * versión.
 *
 * Los rasgos de cada una los fijó `botanist`; están comentados uno a uno porque
 * dibujar «una hoja bonita» en vez del rasgo diagnóstico sería el equivalente
 * gráfico de rellenar un campo a ojo.
 */

const NS = "http://www.w3.org/2000/svg";

function e(nombre, attrs = {}) {
  const nodo = document.createElementNS(NS, nombre);
  for (const [k, v] of Object.entries(attrs)) if (v != null) nodo.setAttribute(k, String(v));
  return nodo;
}

/* Cada silueta es un contorno cerrado en una caja de 48×48, más los trazos
   interiores mínimos que hacen falta para leer el rasgo. */
const SILUETAS = {
  // Base ASIMÉTRICA —el rasgo del género, exagerado a propósito— y margen
  // crenado-serrado: dientes redondeados con puntita. Lámina orbicular-cordada.
  "begonia-elatior": {
    contorno: "M25 44C14 41 6 33 5 24 4 16 9 9 17 7c5-1 8 1 11 4 4-4 9-6 14-4 6 2 6 8 3 13-3 6-8 11-12 16-3 3-5 6-8 8Z",
    detalle: ["M25 44C24 34 24 22 22 12", "M22 12c-3 2-7 3-11 3", "M22 12c4 1 8 0 11-2"],
    lectura: "hoja de begonia, base marcadamente asimétrica y borde de dientes redondeados",
  },
  // Serrado profundo, punta acuminada, y un trozo de tallo con el PAR de hojas
  // opuestas y cruzadas: dice «labiada» de un golpe.
  "coleo-grande": {
    contorno: "M24 4c4 5 9 8 11 13 2 5 1 11-3 15-3 3-6 5-8 9-2-4-5-6-8-9-4-4-5-10-3-15 2-5 7-8 11-13Z",
    detalle: ["M24 41V4", "M13 20l5-2", "M35 20l-5-2", "M14 28l5-3", "M34 28l-5-3", "M10 45h28", "M16 45c0-4 3-6 8-6s8 2 8 6"],
    lectura: "hoja de coleo, borde muy serrado y punta afilada, en par opuesto sobre el tallo",
  },
  // Diminuta y oval, margen festoneado y RED DE NERVIOS HUNDIDOS que la hace
  // rugosa. Se dibuja a la misma escala que las demás para que se vea pequeña.
  "ficus-sunny": {
    contorno: "M24 17c5 0 9 3 9 8s-4 8-9 8-9-3-9-8 4-8 9-8Z",
    detalle: ["M24 17v16", "M17 21c3 1 5 2 7 4", "M31 21c-3 1-5 2-7 4", "M17 29c3-1 5-2 7-4", "M31 29c-3-1-5-2-7-4"],
    lectura: "hoja de ficus pumila, muy pequeña, oval y de nervios hundidos",
  },
  // 3-5 lóbulos GRUESOS e irregulares, profundamente hendidos, base en cuña.
  // Dibujada fina parecería Argyranthemum; estrecha y dentada, Leucanthemum.
  // Aquí el dibujo ES la prueba de la identificación, no su ilustración.
  margarita: {
    contorno: "M24 44c-1-6-1-9-3-11-4 1-8 1-10-2-2-3 0-6 3-7-3-2-5-5-3-8 2-3 6-3 9-1 0-4 1-8 4-9 3 1 4 5 4 9 3-2 7-2 9 1 2 3 0 6-3 8 3 1 5 4 3 7-2 3-6 3-10 2-2 2-2 5-3 11Z",
    detalle: ["M24 33V13"],
    lectura: "hoja de crisantemo, con lóbulos gruesos y profundamente hendidos",
  },
  // Acorazonada y entera, JUVENIL. La adulta es pinnatisecta; la nuestra no.
  poto: {
    contorno: "M24 44C13 38 6 29 6 20 6 12 12 6 19 6c2 0 4 1 5 3 1-2 3-3 5-3 7 0 13 6 13 14 0 9-7 18-18 24Z",
    detalle: ["M24 44V9", "M24 20c-4-3-8-5-12-6", "M24 20c4-3 8-5 12-6", "M24 31c-4-3-7-6-10-8", "M24 31c4-3 7-6 10-8"],
    lectura: "hoja de poto, acorazonada y de borde entero",
  },
};

/* El helecho va aparte: el contorno de fronde SÍ se sostiene —que es un helecho
   está confirmado—, y lo que no se sostiene es el género. Por eso la trama de
   «sin dato» va DENTRO del contorno: marca exactamente dónde está la
   incertidumbre real. Dibujarle un Adiantum bonito sería afirmar una especie
   con un lápiz, que es la misma mentira que rellenar un campo a ojo. */
const FRONDE = {
  contorno: "M24 45V9",
  pinnas: [
    [10.5, 9], [13, 13], [15, 17], [16.5, 21], [17.5, 25], [18.5, 29], [19.5, 33], [21, 37],
  ],
};

/** Los dos coleos comparten silueta: los distingue el tamaño, no la forma. */
const ALIAS = { "coleo-pequeno": "coleo-grande" };

/**
 * El rasgo en palabras, que es el que hace que la silueta sea información.
 *
 * Vive aquí y no en `content/plantas.json` a propósito: es la lectura del
 * dibujo, o sea qué hay que mirar en él, y el dibujo es de este fichero. El dato
 * botánico que lo respalda —la especie, la familia, el margen de la hoja— sí
 * está en el JSON con su fuente.
 */
export function lecturaDe(id) {
  if (id === "helecho") {
    return "Fronde de helecho, con la trama de «sin dato» dentro del contorno: " +
      "que es un helecho está confirmado; el género, no. Sin una fronde adulta " +
      "desarrollada no hay evidencia para llegar a especie.";
  }
  return (SILUETAS[ALIAS[id] ?? id]?.lectura) ?? null;
}

export function siluetaDe(id, { grande = false } = {}) {
  if (id === "helecho") return frondeSinIdentificar(grande);

  const spec = SILUETAS[ALIAS[id] ?? id];
  if (!spec) return null;

  const svg = lienzo(grande, "silueta--hoja");
  // El nombre de la planta está justo al lado: repetir la forma sería ruido.
  svg.setAttribute("aria-hidden", "true");
  svg.append(e("path", { class: "silueta__contorno", d: spec.contorno }));
  for (const d of spec.detalle) svg.append(e("path", { class: "silueta__nervio", d }));
  return svg;
}

function frondeSinIdentificar(grande) {
  const svg = lienzo(grande, "silueta--fronde");
  // Esta sí es informativa: dice que la especie no se sabe, y eso no está
  // escrito en ningún otro sitio de la cara de la etiqueta.
  const idTitulo = "silueta-helecho-titulo";
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-labelledby", idTitulo);
  const titulo = e("title", { id: idTitulo });
  titulo.textContent = "Fronde de helecho sin identificar";
  svg.append(titulo);

  svg.append(hachuradoFronde());

  // La trama va dentro del contorno, que es donde está la duda de verdad.
  svg.append(e("path", { class: "silueta__trama", d: contornoFronde(), fill: "url(#trama-fronde)" }));
  svg.append(e("path", { class: "silueta__contorno", d: contornoFronde() }));
  svg.append(e("path", { class: "silueta__raquis", d: FRONDE.contorno }));
  for (const [x, y] of FRONDE.pinnas) {
    svg.append(e("path", { class: "silueta__pinna", d: `M24 ${y + 4}L${x} ${y}` }));
    svg.append(e("path", { class: "silueta__pinna", d: `M24 ${y + 4}L${48 - x} ${y}` }));
  }
  return svg;
}

const contornoFronde = () => "M24 45C22 36 20 26 17 18 15 12 19 7 24 5c5 2 9 7 7 13-3 8-5 18-7 27Z";

function hachuradoFronde() {
  const defs = e("defs");
  const patron = e("pattern", { id: "trama-fronde", width: 5, height: 5, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
  patron.append(e("line", { class: "silueta__trama-linea", x1: 0, y1: 0, x2: 0, y2: 5 }));
  defs.append(patron);
  return defs;
}

function lienzo(grande, clase) {
  return e("svg", {
    viewBox: "0 0 48 48",
    class: `silueta ${clase}${grande ? " silueta--grande" : ""}`,
    focusable: "false",
  });
}
