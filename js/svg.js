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

/* ══ 2 · Lo que quiere y lo que tiene ═══════════════════════════════════════
   La escala de luz de 1 a 5 con DOS marcas y el hueco entre ellas. Deja de
   decir «vive en el escalón 3» y dice «le falta un escalón», que es lo
   accionable. Sale de los propios textos: el coleo grande «quiere más luz de la
   que tiene», el poto «está más oscura de lo ideal».

   Devuelve un fragmento —SVG + su equivalente en texto— porque el SVG va
   `aria-hidden` y la frase tiene que existir de verdad en el DOM. */

const PASOS_LUZ = 5;
const NOMBRE_NIVEL = new Map([
  [1, "sombra"], [2, "semisombra"], [3, "luz indirecta"],
  [4, "mucha luz"], [5, "sol directo"],
]);

let secuenciaPatron = 0;

export function diagramaLuz(luz) {
  const actual = numero(luz?.nivel_actual) ?? numero(luz?.nivel);
  const ideal = numero(luz?.nivel_ideal);
  if (actual == null && ideal == null) return sinDato("Sin dato de luz.");

  const frag = document.createDocumentFragment();
  const svg = lienzo("0 0 120 46", "diagrama--luz");
  // Un id por instancia: siete patrones llamados igual es HTML inválido y todas
  // las referencias acabarían apuntando al primero.
  const idPatron = `hachurado-${(secuenciaPatron += 1)}`;
  svg.append(hachurado(idPatron));

  const x0 = 10, ancho = 100, y = 18, alto = 12, hueco = 2;
  const paso = ancho / PASOS_LUZ;
  const centro = (n) => x0 + paso * (n - 0.5);

  // Los cinco escalones. Sin los dos números, los que no se saben van
  // hachurados: no se rellena la escala a ojo.
  for (let n = 1; n <= PASOS_LUZ; n += 1) {
    const conocido = ideal != null ? true : n === actual;
    const dentro = ideal != null && actual != null && n > Math.min(actual, ideal) && n <= Math.max(actual, ideal);
    const clases = ["escala__paso"];
    if (dentro) clases.push("escala__paso--hueco", actual > ideal ? "escala__paso--sobra" : "escala__paso--falta");
    if (!conocido) clases.push("escala__paso--incierto");
    svg.append(e("rect", {
      class: clases.join(" "),
      x: x0 + paso * (n - 1) + hueco / 2,
      y, width: paso - hueco, height: alto, rx: 1,
      fill: conocido ? null : `url(#${idPatron})`,
    }));
  }

  // Las dos marcas. Cada una lleva su palabra debajo: sin leer color se sabe
  // cuál es cuál.
  const marca = (n, clase, etiqueta, arriba) => {
    if (n == null) return;
    const x = centro(n);
    svg.append(e("path", {
      class: `escala__marca ${clase}`,
      d: arriba ? `M${x} ${y - 2} l4 -6 h-8 Z` : `M${x} ${y + alto + 2} l4 6 h-8 Z`,
    }));
    svg.append(txt(x, arriba ? y - 10 : y + alto + 15, etiqueta, "escala__rotulo",
      { "text-anchor": "middle", "font-size": CUERPO.micro }));
  };
  marca(ideal, "escala__marca--quiere", "quiere", true);
  marca(actual, "escala__marca--tiene", "recibe", false);

  frag.append(svg);

  // El equivalente en texto: el SVG es la segunda vista, no la única.
  const p = document.createElement("p");
  p.className = "diagrama__equivalente";
  if (ideal != null && actual != null) {
    const diferencia = actual - ideal;
    const escalones = Math.abs(diferencia);
    const cuantos = escalones === 1 ? "un escalón" : `${escalones} escalones`;
    /* El signo importa y no es un detalle de redacción: recibir de más es
       riesgo de quemadura y recibir de menos es déficit. Decir «le falta luz»
       a una planta que se está quemando manda hacer justo lo contrario. */
    p.textContent =
      diferencia === 0
        ? `Quiere nivel ${ideal} de 5 y recibe ${actual}: está en su sitio.`
        : diferencia > 0
          ? `Quiere nivel ${ideal} de 5 y recibe ${actual}: le sobra${escalones === 1 ? "" : "n"} ${cuantos} de luz.`
          : `Quiere nivel ${ideal} de 5 y recibe ${actual}: le falta${escalones === 1 ? "" : "n"} ${cuantos} de luz.`;
  } else {
    p.textContent = `Está en el nivel ${actual} de 5 (${NOMBRE_NIVEL.get(Math.round(actual)) ?? "sin clasificar"}). Sin dato de cuál sería el ideal.`;
  }
  frag.append(p);
  return frag;
}

/** Patrón de diagonales para «no hay dato». El CSS le da el color con tokens. */
function hachurado(id) {
  const patron = e("pattern", { id, width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
  patron.append(e("rect", { class: "hachurado__fondo", width: 6, height: 6 }));
  patron.append(e("line", { class: "hachurado__linea", x1: 0, y1: 0, x2: 0, y2: 6 }));
  const defs = e("defs");
  defs.append(patron);
  return defs;
}

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

  /* EL INVIERNO ES UNA BANDA, NO UN PUNTO. Carlos dio la calefacción como 21–24 °C
     y `botanist` dejó `casa_invierno_c` en `null` a propósito para que nadie
     dibujara un «22,5°» que nadie ha medido. Se pinta como banda, igual que el
     rango tolerado y el óptimo — la misma gramática para el mismo tipo de dato. */
  const invMin = numero(t?.casa_invierno_min);
  const invMax = numero(t?.casa_invierno_max);
  if (invMin != null && invMax != null) {
    svg.append(e("rect", {
      class: "temp__casa-banda",
      x: px(invMin), y: eje.y - 4, width: px(invMax) - px(invMin), height: 4, rx: 1,
    }));
    svg.append(txt((px(invMin) + px(invMax)) / 2, eje.y - 6,
      `inv ${formatear(invMin)}–${formatear(invMax)}°`, "temp__casa-texto",
      { "text-anchor": "middle", "font-size": CUERPO.micro }));
  }

  // El tope de verano sí es un punto: es el objetivo del aire acondicionado.
  for (const [clave, etiqueta] of [["casa_invierno", "inv"], ["casa_verano", "ver"]]) {
    const v = numero(t?.[clave]);
    if (v == null) continue;
    const x = px(v);
    svg.append(e("path", { class: "temp__casa", d: `M${x} ${eje.y + 7} l3.5 6 h-7 Z` }));
    svg.append(txt(x, eje.y + 21, `${etiqueta} ${formatear(v)}°`, "temp__casa-texto", { "text-anchor": "middle", "font-size": CUERPO.micro }));
  }

  svg.append(txt(eje.x - 1, eje.y, `${MIN}°`, "temp__escala", { "text-anchor": "end", dy: 5, "font-size": CUERPO.micro }));
  svg.append(txt(eje.x + eje.w + 2, eje.y, `${MAX}°`, "temp__escala", { dy: 5, "font-size": CUERPO.micro }));

  /* EQUIVALENTE EN TEXTO — y no es un pie decorativo, es una condición de
     accesibilidad que puso `botanist` y que yo había incumplido.
     Al suprimir el `resumen` duplicado de temperatura, este SVG se quedó como
     ÚNICO portador del rango… y va `aria-hidden="true"`. O sea que el dato
     desaparecía del DOM accesible: el único punto de la ficha donde eso pasaba.
     Con esta frase el SVG vuelve a ser la segunda vista de un texto, que es la
     regla 2 de este fichero, y encima dice más que el resumen que sustituye —
     porque añade el óptimo y dónde cae esta casa dentro de la banda. */
  const frag = document.createDocumentFragment();
  frag.append(svg);
  const p = document.createElement("p");
  p.className = "diagrama__equivalente";
  p.textContent = frasePisoTermico(tol, opt, invMin, invMax, numero(t?.casa_verano), t?.habitacion);
  frag.append(p);
  return frag;
}

/**
 * El rango térmico dicho en palabras. Va por partes y solo afirma las que existen:
 * `minima_letal_c` es `null` en las siete y el máximo tolerado falta en el
 * helecho, así que la frase se compone de lo que hay y calla lo que no.
 *
 * La banda de casa se rotula como **de la habitación** y no de la planta: los tres
 * campos valen lo mismo en todas las del salón porque son una constante de la
 * habitación, y atribuírsela a la planta sería afirmar que se ha medido junto a su
 * maceta.
 *
 * Y la habitación viene del dato, no escrita a mano. Hasta el 13/08/2026 esta frase
 * decía «el salón» como literal, y era cierto porque las siete estaban en el salón.
 * Con el segundo poto en la cocina dejó de serlo: aquella planta trae los tres
 * campos de casa en null —nadie ha medido la cocina—, así que hoy la frase se calla
 * sola; pero el día que alguien mida esa habitación, el literal habría rotulado
 * como del salón una temperatura de la cocina. Se arregla antes de que pase.
 */
function frasePisoTermico(tol, opt, invMin, invMax, verano, habitacion) {
  const partes = [];
  if (tol[0] != null && tol[1] != null) partes.push(`Aguanta de ${formatear(tol[0])} a ${formatear(tol[1])} °C`);
  else if (tol[0] != null) partes.push(`Aguanta desde ${formatear(tol[0])} °C (sin máximo publicado)`);
  else if (tol[1] != null) partes.push(`Aguanta hasta ${formatear(tol[1])} °C`);

  if (opt[0] != null && opt[1] != null) partes.push(`le gusta entre ${formatear(opt[0])} y ${formatear(opt[1])}`);

  const casa = [];
  if (invMin != null && invMax != null) casa.push(`${formatear(invMin)}–${formatear(invMax)} °C en invierno`);
  if (verano != null) casa.push(`${formatear(verano)} °C de tope en verano`);
  if (casa.length > 0) partes.push(`${habitacion ? `el ${habitacion}` : "la habitación"} está a ${casa.join(" y ")}`);

  return partes.length > 0 ? `${partes.join(", ")}.` : "Sin rango de temperatura verificado.";
}

/* ══ 4 · Curso de recuperación — BORRADO, y conviene saber por qué ═════════
   Aquí vivía `diagramaRecuperacion()`. Se retiró porque **afirmaba algo falso**:
   sus círculos iban a espaciado regular para pasos cuyos horizontes son
   *inmediato, inmediato, esta semana, 3 semanas, 2-3 meses* y *cuando haya una
   fronde adulta*, o sea que el eje codificaba el índice 1…6 y no el tiempo — y
   encima iba rotulado `hoy` … `01/09/2026`, con lo que decía que el paso 6 cae el
   1 de septiembre cuando esa fecha es el `revisar_fecha` y no corresponde a
   ningún paso.

   Y no se arregla: dos pasos en el instante 0 no tienen posición en un eje
   logarítmico, y uno sin fecha no la tiene en ninguno. La lista numerada que va
   debajo ya rotula cada paso con su horizonte en palabras, que es MÁS preciso
   que un eje.

   El dibujo se borró en su día y la función se quedó exportada sin que la
   llamara nadie: código muerto de un gráfico retirado por mentir. Se va con la
   piel oscura del 12 de agosto de 2026.
   ═══════════════════════════════════════════════════════════════════════════ */

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
