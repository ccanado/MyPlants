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

/* ══ 1 · El reloj de riego ══════════════════════════════════════════════════
   Cada cuántos días toca, en verano y en invierno, sobre un dial de 0 a 10.
   Se dibuja sobre `dias_verano` / `dias_invierno`, que sí existen en el JSON:
   la versión anterior pedía centímetros de profundidad que no produce nadie. */

const DIAS_MAX = 10;

export function diagramaRiego(riego) {
  const verano = numero(riego?.dias_verano);
  const invierno = numero(riego?.dias_invierno);
  if (verano == null && invierno == null) return sinDato("Sin dato de frecuencia de riego.");

  const svg = lienzo("0 0 120 80", "diagrama--riego");
  const cx = 60, cy = 62, r = 44;

  // Punto de la semicircunferencia para N días (0 a la izquierda, 10 a la derecha).
  const punto = (dias, radio) => {
    const t = limitar(dias / DIAS_MAX, 0, 1);
    const ang = Math.PI * (1 - t);
    return [cx + Math.cos(ang) * radio, cy - Math.sin(ang) * radio];
  };
  const arco = (radio) => {
    const [x1, y1] = punto(0, radio);
    const [x2, y2] = punto(DIAS_MAX, radio);
    return `M${redondear(x1)} ${redondear(y1)} A ${radio} ${radio} 0 0 1 ${redondear(x2)} ${redondear(y2)}`;
  };

  svg.append(e("path", { class: "reloj__pista", d: arco(r) }));

  // Marcas de día: la escala se lee sin depender del color.
  for (let d = 0; d <= DIAS_MAX; d += 1) {
    const [xa, ya] = punto(d, r - 4);
    const [xb, yb] = punto(d, r + (d % 5 === 0 ? 5 : 2));
    svg.append(e("line", { class: d % 5 === 0 ? "reloj__marca reloj__marca--mayor" : "reloj__marca", x1: xa, y1: ya, x2: xb, y2: yb }));
  }

  // Las dos agujas. Llevan rótulo con la palabra, no solo posición.
  const aguja = (dias, clase, etiqueta) => {
    if (dias == null) return;
    const [x, y] = punto(dias, r - 9);
    svg.append(e("line", { class: `reloj__aguja ${clase}`, x1: cx, y1: cy, x2: x, y2: y }));
    svg.append(e("circle", { class: `reloj__punta ${clase}`, cx: x, cy: y, r: 4 }));
    const [tx, ty] = punto(dias, r + 12);
    svg.append(txt(tx, ty, etiqueta, "reloj__rotulo", { "text-anchor": "middle", "font-size": CUERPO.micro }));
  };
  aguja(verano, "reloj__aguja--verano", "verano");
  aguja(invierno, "reloj__aguja--invierno", "invierno");

  svg.append(e("circle", { class: "reloj__eje", cx, cy, r: 3 }));

  // La cifra grande: el dato que se busca con prisa.
  const principal = verano ?? invierno;
  svg.append(txt(cx, cy - 12, `${formatear(principal)}`, "reloj__cifra", { "text-anchor": "middle", "font-size": 20 }));
  svg.append(txt(cx, cy - 4, principal === 1 ? "día" : "días", "reloj__unidad", { "text-anchor": "middle", "font-size": CUERPO.micro }));

  if (riego?.ml != null) {
    svg.append(txt(cx, 78, `${formatear(riego.ml)} ml`, "reloj__ml", { "text-anchor": "middle", "font-size": CUERPO.micro }));
  }
  return svg;
}

/* ══ 2 · La mañana del salón ════════════════════════════════════════════════
   Eje de un día con sus tramos de luz reales. No es una categoría de vivero:
   es lo que le entra por la ventana a esta planta en esta casa. Si solo hay
   `nivel`, los tramos se dibujan en trama de «sin dato» y el texto lo dice. */

const NOMBRE_NIVEL = new Map([
  [1, "sombra"], [2, "semisombra"], [3, "luz indirecta"],
  [4, "mucha luz"], [5, "sol directo"],
]);

export function diagramaLuz(luz) {
  const tramos = Array.isArray(luz?.tramos) ? luz.tramos : null;
  const solDirecto = texto0(luz?.sol_directo);
  const nivel = numero(luz?.nivel);
  if (!tramos && !solDirecto && nivel == null) return sinDato("Sin dato de luz.");

  const svg = lienzo("0 0 120 52", "diagrama--luz");
  const eje = { x: 10, y: 22, w: 100, h: 10 };

  svg.append(hachurado());

  // Horas de referencia del eje: de que amanece a que anochece.
  svg.append(e("rect", { class: "dia__eje", x: eje.x, y: eje.y, width: eje.w, height: eje.h, rx: 2 }));

  if (tramos) {
    // Cada tramo trae su fracción del día y su tipo de luz.
    let x = eje.x;
    for (const tramo of tramos) {
      const frac = limitar(numero(tramo?.fraccion) ?? 0, 0, 1);
      const ancho = eje.w * frac;
      svg.append(e("rect", {
        class: `dia__tramo dia__tramo--${normalizarClase(tramo?.tipo)}`,
        x, y: eje.y, width: ancho, height: eje.h, rx: 2,
      }));
      x += ancho;
    }
  } else {
    // Sin los tramos reales no se inventa el reparto del día: se hachura.
    svg.append(e("rect", { class: "dia__sin-dato", x: eje.x, y: eje.y, width: eje.w, height: eje.h, rx: 2, fill: "url(#hachurado)" }));
  }

  svg.append(txt(eje.x, eje.y - 5, "amanece", "dia__hora", { "font-size": CUERPO.micro }));
  svg.append(txt(eje.x + eje.w, eje.y - 5, "anochece", "dia__hora", { "text-anchor": "end", "font-size": CUERPO.micro }));

  const pie = tramos
    ? null
    : nivel != null
      ? `Nivel ${formatear(nivel)} de 5 · ${NOMBRE_NIVEL.get(Math.round(nivel)) ?? "sin clasificar"}`
      : solDirecto;
  if (pie) svg.append(txt(60, eje.y + eje.h + 12, pie, "dia__pie", { "text-anchor": "middle", "font-size": CUERPO.micro }));

  return svg;
}

/** Patrón de diagonales para «no hay dato». El CSS le da el color con tokens. */
function hachurado() {
  const patron = e("pattern", { id: "hachurado", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
  patron.append(e("rect", { class: "hachurado__fondo", width: 6, height: 6 }));
  patron.append(e("line", { class: "hachurado__linea", x1: 0, y1: 0, x2: 0, y2: 6 }));
  const defs = e("defs");
  defs.append(patron);
  return defs;
}

const normalizarClase = (v) =>
  String(v ?? "sin-tipo").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-");

const texto0 = (v) => (v == null || v === "" ? null : String(v));

/* ══ 3 · Rango térmico ══════════════════════════════════════════════════════
   Eje de 0 a 40 °C: lo que tolera, lo que le gusta, dónde se muere, y las dos
   temperaturas reales de casa. Sin las bandas no hay diagrama que valga. */

export function diagramaTemperatura(t) {
  const tol = [numero(t?.min_tolerado), numero(t?.max_tolerado)];
  const opt = [numero(t?.min_optimo), numero(t?.max_optimo)];
  if (tol[0] == null && tol[1] == null && opt[0] == null) {
    return sinDato("Sin rango de temperatura verificado.");
  }

  const MIN = 0, MAX = 40;
  const svg = lienzo("0 0 120 54", "diagrama--temp");
  const eje = { x: 10, y: 26, w: 100 };
  const px = (grados) => eje.x + (limitar(grados, MIN, MAX) - MIN) / (MAX - MIN) * eje.w;

  svg.append(e("rect", { class: "temp__eje", x: eje.x, y: eje.y, width: eje.w, height: 6, rx: 3 }));

  // El rango puede estar abierto por arriba: RHS da mínimo para los helechos
  // tiernos y no publica máximo. Se dibuja hasta el borde y se rotula «≥ min»,
  // que es lo que se sabe — no se cierra la banda en una cifra inventada.
  if (tol[0] != null || tol[1] != null) {
    const desde = tol[0] != null ? px(tol[0]) : px(MIN);
    const hasta = tol[1] != null ? px(tol[1]) : px(MAX);
    svg.append(e("rect", { class: "temp__tolerado", x: desde, y: eje.y, width: hasta - desde, height: 6, rx: 3 }));

    if (tol[1] == null && tol[0] != null) {
      svg.append(e("path", { class: "temp__abierto", d: `M${px(MAX) - 6} ${eje.y - 2} l6 5 l-6 5 Z` }));
      svg.append(txt(px(tol[0]), eje.y - 8, `≥ ${formatear(tol[0])}°`, "temp__casa-texto", { "text-anchor": "middle", "font-size": CUERPO.micro }));
    }
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
