/**
 * Los nueve iconos de campo. SVG en línea, caja de 24 unidades, un solo trazo,
 * `currentColor`, sin relleno y sin detalle interior — a 20 px el detalle es
 * ruido, no información.
 *
 * Regla que los gobierna: **el icono acompaña a la versalita, nunca la
 * sustituye.** Un icono solo obligaría a aprender un vocabulario antes de poder
 * usar la web, y esta se abre con prisa una vez cada quince días. Por eso todos
 * van `aria-hidden="true"`: la palabra de al lado ya es el nombre accesible.
 */

const NS = "http://www.w3.org/2000/svg";

/** Los trazos, en una caja de 24×24. Cada uno es una lista de <path>/<circle>. */
const TRAZOS = {
  // regadera con gota
  riego: ["M4 11h9v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z", "M13 13l6-4v8l-6-3", "M7 11V9a2 2 0 0 1 4 0v2", "M17 3c1.2 1.6 2 2.7 2 3.6A2 2 0 0 1 15 6.6C15 5.7 15.8 4.6 17 3z"],
  // medio sol con rayos cortos
  luz: ["M6 17a6 6 0 0 1 12 0", "M3 17h2", "M19 17h2", "M12 4v2", "M5.6 7.6l1.4 1.4", "M18.4 7.6L17 9"],
  // termómetro de bulbo
  temperatura: ["M14 14.5V5a2 2 0 0 0-4 0v9.5a4 4 0 1 0 4 0z", "M12 9v6"],
  // gota sola
  humedad: ["M12 3c3.5 4.4 6 7.3 6 10a6 6 0 0 1-12 0c0-2.7 2.5-5.6 6-10z"],
  // tres bandas, la de arriba granulada
  sustrato: ["M3 8h18", "M3 14h18", "M3 20h18", "M6 5h.01", "M10 4h.01", "M14 5h.01", "M18 4h.01"],
  // cuchara de medida
  abonado: ["M9 21v-8", "M5 13h8v-2a4 4 0 0 0-8 0z", "M15 4h5v5a3 3 0 0 1-5 2z"],
  // maceta con flecha ascendente
  trasplante: ["M5 12h10l-1 8H6z", "M19 10V3", "M16 6l3-3 3 3"],
  // insecto de seis patas, muy esquemático
  plagas: ["M12 7a4 4 0 0 1 4 4v3a4 4 0 0 1-8 0v-3a4 4 0 0 1 4-4z", "M8 10L4 8", "M8 13H4", "M8 16l-4 2", "M16 10l4-2", "M16 13h4", "M16 16l4 2", "M10 6L9 3", "M14 6l1-3"],
  // guante: cómo se hace la tarea, no una alarma
  manipulacion: ["M7 11V6a1.5 1.5 0 0 1 3 0v5", "M10 11V4a1.5 1.5 0 0 1 3 0v7", "M13 11V5a1.5 1.5 0 0 1 3 0v6", "M16 11V8a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-2a5 5 0 0 1-4-2l-4-5a1.6 1.6 0 0 1 2.4-2L7 14"],
  // triángulo de aviso
  toxicidad: ["M12 4l9 16H3z", "M12 10v4", "M12 17h.01"],
};

/** `dificultad` es el único que codifica un VALOR, así que se dibuja aparte:
 *  uno, dos o tres círculos rellenos. La palabra va obligatoriamente al lado —
 *  tres puntos no dicen cuál es cuál. */
const NIVEL_DIFICULTAD = new Map([
  ["facil", 1], ["media", 2], ["exigente", 3], ["dificil", 3],
]);

function crear(nombre, attrs) {
  const el = document.createElementNS(NS, nombre);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function lienzoIcono(clase) {
  return crear("svg", {
    viewBox: "0 0 24 24",
    class: `icono ${clase}`,
    // La versalita de al lado ya nombra el campo: repetirlo sería ruido.
    "aria-hidden": "true",
    focusable: "false",
  });
}

/** Devuelve el icono de un campo, o null si ese campo no tiene. */
export function iconoDe(campo) {
  const trazos = TRAZOS[campo];
  if (!trazos) return null;
  const svg = lienzoIcono(`icono--${campo}`);
  for (const d of trazos) svg.append(crear("path", { d }));
  return svg;
}

/** El de dificultad necesita el valor: uno, dos o tres puntos. */
export function iconoDificultad(valor) {
  const n = NIVEL_DIFICULTAD.get(normalizarClave(valor)) ?? 0;
  if (n === 0) return null;
  const svg = lienzoIcono("icono--dificultad");
  for (let i = 0; i < 3; i += 1) {
    svg.append(crear("circle", {
      cx: 5 + i * 7, cy: 12, r: 2.6,
      class: i < n ? "icono__punto icono__punto--lleno" : "icono__punto",
    }));
  }
  return svg;
}

const normalizarClave = (v) =>
  String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
