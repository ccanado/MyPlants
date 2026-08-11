/**
 * Los diagramas explicativos del brief. SVG en línea, sin librerías.
 *
 * Tres reglas que los gobiernan, y son eliminatorias:
 *
 *  1. Si el SVG se puede borrar sin perder información, es decoración y se borra.
 *     Por eso ninguno se dibuja si no hay dato: en su lugar va el estado «sin dato»,
 *     que dice la verdad, en vez de un eje bonito fingiendo precisión.
 *  2. El dato va SIEMPRE también en texto, al lado. El dibujo es la segunda vista.
 *     Como el texto contiguo ya lo dice todo, los SVG van `aria-hidden`: repetirlo
 *     en el lector de pantalla sería ruido, no accesibilidad.
 *  3. Nada arranca solo y nada va en bucle. La animación la dispara abrir la ficha,
 *     y `prefers-reduced-motion` cambia de versión en CSS, no aquí.
 *
 * Ningún color se escribe aquí: las piezas llevan clase y `css/app.css` las pinta
 * con `var(--…)`. Un `fill="#…"` en este fichero se saltaría la disciplina de tokens
 * por la puerta de atrás, porque el comprobador solo mira los CSS.
 */

const NS = "http://www.w3.org/2000/svg";

/** Crea un elemento SVG con atributos. Los valores numéricos se redondean para
 *  no acabar con "12.000000000002" en el DOM. */
function e(nombre, attrs = {}, hijos = []) {
  const nodo = document.createElementNS(NS, nombre);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    nodo.setAttribute(k, typeof v === "number" ? redondear(v) : String(v));
  }
  for (const h of hijos) nodo.append(h);
  return nodo;
}

const redondear = (n) => Math.round(n * 100) / 100;
const limitar = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * Cuerpo del texto dentro de un SVG, en unidades del viewBox.
 *
 * Ojo, que esto parece saltarse la escala tipográfica y no se la salta: dentro de
 * un `viewBox` el `font-size` no es una medida tipográfica, es una **coordenada**
 * — se escala con el dibujo igual que la `x`, la `y` o el radio de un círculo.
 * Poner ahí `var(--texto-3xs)` daría 11 unidades sobre un lienzo de 120 de ancho,
 * o sea una letra que ocupa un noveno del diagrama. Por eso va como atributo del
 * SVG, junto al resto de la geometría, y no como `font-size` en `app.css`.
 * El color de estos textos sí sale de los tokens, en `app.css`.
 */
const CUERPO = { micro: 5.5, dato: 7, rotulo: 6 };

/** Texto dentro del SVG. Va aparte porque siempre usa textContent. */
function txt(x, y, contenido, clase, extra = {}) {
  const t = e("text", { x, y, class: clase, "font-size": CUERPO.dato, ...extra });
  t.textContent = contenido;
  return t;
}

function lienzo(viewBox, clase) {
  return e("svg", {
    viewBox,
    class: `diagrama ${clase}`,
    // El texto de al lado ya lleva el dato: para el lector de pantalla esto es ruido.
    "aria-hidden": "true",
    focusable: "false",
    preserveAspectRatio: "xMidYMid meet",
  });
}

/** Lo que se pinta cuando el dato no existe. No es un hueco: es una afirmación. */
function sinDato(mensaje) {
  const p = document.createElement("p");
  p.className = "diagrama-sin-dato";
  p.textContent = mensaje;
  return p;
}

/* ══ 1 · El dedo en la tierra ═══════════════════════════════════════════════
   Corte vertical del tiesto: a qué profundidad tiene que estar seco el sustrato
   antes de volver a regar. Necesita profundidad en cm; los ml son opcionales. */

export function diagramaRiego(riego) {
  const cm = numero(riego?.profundidad_cm);
  if (cm == null) return sinDato("Sin dato de profundidad de riego.");

  const PROF_TIESTO = 14; // cm de referencia del corte, no es un dato de la planta
  const svg = lienzo("0 0 120 110", "diagrama--riego");

  const bocaY = 18, fondoY = 98, bocaX1 = 16, bocaX2 = 104, fondoX1 = 30, fondoX2 = 90;

  // Tiesto: trapecio de plástico inyectado, como el de la foto.
  svg.append(e("path", {
    class: "riego__tiesto",
    d: `M${bocaX1} ${bocaY} L${bocaX2} ${bocaY} L${fondoX2} ${fondoY} L${fondoX1} ${fondoY} Z`,
  }));
  // El anillo moldeado del borde.
  svg.append(e("rect", { class: "riego__anillo", x: bocaX1 - 2, y: bocaY - 6, width: bocaX2 - bocaX1 + 4, height: 6, rx: 1 }));

  // Sustrato.
  svg.append(e("path", {
    class: "riego__sustrato",
    d: `M${bocaX1 + 2} ${bocaY + 2} L${bocaX2 - 2} ${bocaY + 2} L${fondoX2 - 2} ${fondoY - 2} L${fondoX1 + 2} ${fondoY - 2} Z`,
  }));

  // Frente húmedo: empieza a la profundidad seca y baja hasta el fondo.
  const fraccion = limitar(cm / PROF_TIESTO, 0, 1);
  const yFrente = bocaY + (fondoY - bocaY) * fraccion;
  const anchoEn = (y) => {
    const t = (y - bocaY) / (fondoY - bocaY);
    return [bocaX1 + (fondoX1 - bocaX1) * t, bocaX2 + (fondoX2 - bocaX2) * t];
  };
  const [fx1, fx2] = anchoEn(yFrente);
  svg.append(e("path", {
    class: "riego__humedo",
    d: `M${fx1 + 2} ${yFrente} L${fx2 - 2} ${yFrente} L${fondoX2 - 2} ${fondoY - 2} L${fondoX1 + 2} ${fondoY - 2} Z`,
  }));

  // La línea de «hasta aquí seco» y su cota.
  svg.append(e("line", { class: "riego__cota", x1: fx1 - 8, y1: yFrente, x2: fx2 + 4, y2: yFrente }));
  svg.append(txt(fx2 + 6, yFrente - 2, `${formatear(cm)} cm`, "riego__cota-texto"));

  // El dedo: la unidad de medida real de cualquiera que riega.
  svg.append(e("rect", { class: "riego__dedo", x: 56, y: bocaY - 14, width: 9, height: 14 + (yFrente - bocaY), rx: 4.5 }));

  // La gota que cae. Solo se anima al abrir la ficha; con reduce ni aparece.
  svg.append(e("circle", { class: "riego__gota", cx: 60, cy: 6, r: 3.5 }));

  if (riego?.ml != null) svg.append(txt(60, 108, `${formatear(riego.ml)} ml`, "riego__ml", { "text-anchor": "middle" }));

  return svg;
}

/* ══ 2 · La ventana ═════════════════════════════════════════════════════════
   Planta cenital de la habitación: por dónde entra la luz y a qué distancia
   está la planta de verdad. No la luz teórica de la especie: la de esta casa. */

const ORIENTACIONES = new Map([
  ["norte", { sigla: "N", angulo: 0 }],
  ["sur", { sigla: "S", angulo: 180 }],
  ["este", { sigla: "E", angulo: 90 }],
  ["oeste", { sigla: "O", angulo: 270 }],
  ["noreste", { sigla: "NE", angulo: 45 }],
  ["noroeste", { sigla: "NO", angulo: 315 }],
  ["sureste", { sigla: "SE", angulo: 135 }],
  ["suroeste", { sigla: "SO", angulo: 225 }],
]);

export function diagramaLuz(luz) {
  const orientacion = luz?.orientacion ? String(luz.orientacion).toLowerCase().trim() : null;
  const distancia = numero(luz?.distancia_m);
  if (orientacion == null && distancia == null) {
    return sinDato("Sin dato de ventana ni distancia.");
  }

  const svg = lienzo("0 0 120 100", "diagrama--luz");
  const sala = { x: 12, y: 14, w: 96, h: 74 };
  const MAX_M = 4; // la habitación del diagrama son 4 m de fondo

  svg.append(e("rect", { class: "luz__sala", x: sala.x, y: sala.y, width: sala.w, height: sala.h, rx: 2 }));

  // La ventana, en el muro que toque.
  const info = orientacion ? ORIENTACIONES.get(orientacion) : null;
  const ventana = { x: sala.x + sala.w * 0.28, y: sala.y, w: sala.w * 0.44, h: 3 };
  svg.append(e("rect", { class: "luz__ventana", x: ventana.x, y: ventana.y - 1.5, width: ventana.w, height: ventana.h, rx: 1 }));
  svg.append(txt(sala.x + sala.w / 2, sala.y - 5, info ? `Ventana ${info.sigla}` : "Ventana", "luz__rotulo", { "text-anchor": "middle", "font-size": CUERPO.rotulo }));

  // Cono de luz: se abre desde la ventana y se apaga con la distancia.
  svg.append(e("path", {
    class: "luz__cono",
    d: `M${ventana.x} ${sala.y} L${sala.x + 4} ${sala.y + sala.h - 4} L${sala.x + sala.w - 4} ${sala.y + sala.h - 4} L${ventana.x + ventana.w} ${sala.y} Z`,
  }));

  // Dónde está la planta, de verdad.
  if (distancia != null) {
    const t = limitar(distancia / MAX_M, 0, 1);
    const py = sala.y + 6 + (sala.h - 14) * t;
    const px = sala.x + sala.w / 2;
    svg.append(e("line", { class: "luz__cota", x1: px, y1: sala.y, x2: px, y2: py }));
    svg.append(e("circle", { class: "luz__planta", cx: px, cy: py, r: 5 }));
    svg.append(txt(px + 9, py + 3, `${formatear(distancia)} m`, "luz__cota-texto"));
  }

  return svg;
}

/* ══ 3 · Rango térmico ══════════════════════════════════════════════════════
   Eje de 0 a 40 °C: lo que tolera, lo que le gusta, dónde se muere, y las dos
   temperaturas reales de casa. Sin las bandas no hay diagrama que valga. */

export function diagramaTemperatura(t) {
  const tol = [numero(t?.min_tolerado), numero(t?.max_tolerado)];
  const opt = [numero(t?.min_optimo), numero(t?.max_optimo)];
  if (tol[0] == null && opt[0] == null) return sinDato("Sin rango de temperatura verificado.");

  const MIN = 0, MAX = 40;
  const svg = lienzo("0 0 120 54", "diagrama--temp");
  const eje = { x: 10, y: 26, w: 100 };
  const px = (grados) => eje.x + (limitar(grados, MIN, MAX) - MIN) / (MAX - MIN) * eje.w;

  svg.append(e("rect", { class: "temp__eje", x: eje.x, y: eje.y, width: eje.w, height: 6, rx: 3 }));

  if (tol[0] != null && tol[1] != null) {
    svg.append(e("rect", { class: "temp__tolerado", x: px(tol[0]), y: eje.y, width: px(tol[1]) - px(tol[0]), height: 6, rx: 3 }));
  }
  if (opt[0] != null && opt[1] != null) {
    svg.append(e("rect", { class: "temp__optimo", x: px(opt[0]), y: eje.y + 1, width: px(opt[1]) - px(opt[0]), height: 4, rx: 2 }));
  }

  const letal = numero(t?.letal_min);
  if (letal != null) {
    svg.append(e("line", { class: "temp__letal", x1: px(letal), y1: eje.y - 5, x2: px(letal), y2: eje.y + 11 }));
    svg.append(txt(px(letal), eje.y - 8, "letal", "temp__letal-texto", { "text-anchor": "middle", "font-size": CUERPO.micro }));
  }

  // Las dos temperaturas de esta casa: el dato que convierte el eje en útil.
  for (const [clave, etiqueta] of [["casa_invierno", "inv"], ["casa_verano", "ver"]]) {
    const v = numero(t?.[clave]);
    if (v == null) continue;
    const x = px(v);
    svg.append(e("path", { class: "temp__casa", d: `M${x} ${eje.y + 7} l3.5 6 h-7 Z` }));
    svg.append(txt(x, eje.y + 21, `${etiqueta} ${formatear(v)}°`, "temp__casa-texto", { "text-anchor": "middle", "font-size": CUERPO.micro }));
  }

  svg.append(txt(eje.x - 1, eje.y, `${MIN}°`, "temp__escala", { "text-anchor": "end", dy: 5, "font-size": CUERPO.micro }));
  svg.append(txt(eje.x + eje.w + 2, eje.y, `${MAX}°`, "temp__escala", { dy: 5, "font-size": CUERPO.micro }));

  return svg;
}

/* ══ 4 · Curso de recuperación ══════════════════════════════════════════════
   El diagrama que más importa: solo en las plantas tocadas. Es una segunda vista
   del <ol> de tratamiento que tiene justo debajo, así que es legible entero sin
   una sola animación — que es exactamente lo que pide el brief. */

export function diagramaRecuperacion(pasos, revisarEn) {
  if (!Array.isArray(pasos) || pasos.length === 0) return null;

  const n = pasos.length;
  const svg = lienzo(`0 0 120 ${34 + (revisarEn ? 8 : 0)}`, "diagrama--recuperacion");
  const y = 16, x0 = 10, x1 = 110;

  svg.append(e("line", { class: "recup__rail", x1: x0, y1: y, x2: x1, y2: y }));
  // Se traza de izquierda a derecha con stroke-dashoffset; el CSS decide cuándo.
  svg.append(e("line", { class: "recup__trazo", x1: x0, y1: y, x2: x1, y2: y, pathLength: 100 }));

  pasos.forEach((_, i) => {
    const x = n === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * (i / (n - 1));
    const g = e("g", { class: "recup__hito", style: `--i:${i}` });
    g.append(e("circle", { class: "recup__punto", cx: x, cy: y, r: 4 }));
    g.append(txt(x, y + 1, String(i + 1), "recup__numero", { "text-anchor": "middle", dy: 2, "font-size": CUERPO.micro }));
    svg.append(g);
  });

  svg.append(txt(x0, 8, "hoy", "recup__extremo", { "font-size": CUERPO.micro }));
  if (revisarEn) svg.append(txt(x1, 8, String(revisarEn), "recup__extremo", { "text-anchor": "end", "font-size": CUERPO.micro }));

  return svg;
}

/* ── utilidades ─────────────────────────────────────────────────────────────── */

function numero(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** 1.5 → «1,5». Coma decimal, que esto se lee en español. */
function formatear(n) {
  return String(redondear(n)).replace(".", ",");
}
