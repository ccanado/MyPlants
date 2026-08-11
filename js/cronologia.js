/**
 * La cronología: cuánto lleva cada planta en casa.
 *
 * Ocupa el hueco que dejó el plano de casa, y lo ocupa mejor de lo que lo habría
 * ocupado el plano: las siete están en el mismo salón, así que un plano serían
 * siete puntos amontonados en una habitación —cero información, o sea la
 * definición de diagrama decorativo—. La cronología, en cambio, abarca **tres
 * órdenes de magnitud** en el mismo salón:
 *
 *   poto                                  hace más de 20 años   →  décadas
 *   begonia, helecho                      29 mayo 2026          →  74 días
 *   coleo ×2, ficus, margarita            11 agosto 2026        →  horas
 *
 * QUÉ EXPLICA, y por eso no es decoración: que las cuatro impecables lo están en
 * parte porque **no han tenido tiempo de que nada les salga mal**, y que el poto
 * es el único con dos décadas de prueba de que ese sitio funciona. Eso reencuadra
 * las otras fichas y no está dicho en ningún otro sitio. En texto son siete
 * frases que nadie relaciona.
 *
 * EL EJE ES LOGARÍTMICO, y las marcas van rotuladas. Las dos mitades de esa
 * frase son obligatorias:
 *
 *   - Lineal es inservible aquí: el poto ocuparía el ancho entero y las otras
 *     seis serían un borrón pegado al extremo izquierdo.
 *   - Y un eje logarítmico SIN rótulos miente sobre las proporciones, porque
 *     invita a leer las distancias como si fueran lineales. Con `hoy · 1 semana ·
 *     1 mes · 1 año · 10 años` impresos, la compresión se ve.
 *
 * No lleva ni un SVG, y no es por ahorrar: al dibujarlo con elementos reales, los
 * siete marcadores son `<button>` de verdad y los rótulos del eje son texto de
 * verdad. Así el diagrama no necesita una versión alternativa para el lector de
 * pantalla — es la misma.
 */

import { diaDeISO } from "./tareas.js";

/**
 * Las marcas del eje. Son las del brief y no se eligen por estética: son las
 * unidades en las que la gente piensa el tiempo de una planta.
 */
const MARCAS = [
  { dias: 0, rotulo: "hoy" },
  { dias: 7, rotulo: "1 semana" },
  { dias: 30, rotulo: "1 mes" },
  { dias: 365, rotulo: "1 año" },
  { dias: 3650, rotulo: "10 años" },
];

/**
 * Tope del eje: 25 años. No es el máximo de los datos, es un tope fijo, y eso es
 * deliberado — si el eje se reescalase al dato mayor, el día que Carlos meta una
 * planta más antigua se moverían los siete marcadores y la marca de «10 años»
 * cambiaría de sitio sin que nada del contenido lo justifique.
 */
const TOPE_DIAS = 365 * 25;

/** log(d+1) y no log(d): «hoy» son 0 días y el logaritmo de 0 no existe. El +1
 *  manda el origen a 0 exacto, que es justo donde tiene que estar «hoy». */
const escala = (dias) =>
  Math.log10(Math.max(0, Math.min(dias, TOPE_DIAS)) + 1) / Math.log10(TOPE_DIAS + 1);

const porcentaje = (dias) => `${(escala(dias) * 100).toFixed(2)}%`;

/* ── de los datos a una entrada del diagrama ─────────────────────────────────── */

/**
 * Cuánto lleva en casa, y con cuánta certeza. Tres casos, y los tres se dibujan
 * distinto porque significan cosas distintas:
 *
 *   exacta  hay `fecha_llegada` → posición exacta
 *   minimo  no hay fecha pero `fecha_llegada_texto` da un mínimo («hace más de 20
 *           años») → posición en ese mínimo, y se dibuja ABIERTO hacia la
 *           derecha, como el rango de temperatura sin máximo publicado. Es un
 *           suelo, no una medida, y decir «20 años» a secas sería cerrar en una
 *           cifra un dato que nadie ha cerrado.
 *   sin     ni una cosa ni la otra → zona de trama de «sin dato», con su rótulo.
 *           **No se omite la planta**: faltar en un censo de siete es
 *           información falsa.
 */
export function entradaDe(planta, hoy) {
  const dia = diaDeISO(planta.fecha_llegada);
  if (dia != null) {
    const dias = Math.max(0, hoy.dia - dia);
    return { planta, dias, certeza: "exacta", texto: legible(dias) };
  }

  const minimo = anosDelTexto(planta.fecha_llegada_texto);
  if (minimo != null) {
    return {
      planta,
      dias: minimo * 365,
      certeza: "minimo",
      texto: `más de ${minimo} años`,
    };
  }

  return { planta, dias: null, certeza: "sin", texto: "sin registrar cuándo llegó" };
}

/**
 * «hace más de 20 años» → 20.
 *
 * Es lo único de este módulo que saca un número de una frase, y conviene decir
 * por qué y qué lo hace aceptable: `fecha_llegada` es `null` en el poto **a
 * propósito** —`meta.escalas` dice que cuando la llegada solo se puede decir de
 * forma aproximada, el dato vive en `fecha_llegada_texto`—, así que la prosa es
 * la forma canónica del dato, no un descuido.
 *
 * Aun así es frágil, y el arreglo limpio es un campo numérico de `botanist`
 * (`anos_en_casa_min: 20`). Mientras no exista: si la frase no encaja, no se
 * inventa nada — se cae al caso «sin dato», que dibuja la trama y lo dice.
 */
function anosDelTexto(texto) {
  if (!texto) return null;
  const m = /(\d+)\s*a[ñn]os/i.exec(String(texto));
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** 0 → «hoy» · 1 → «ayer» · 74 → «74 días» · 400 → «1 año y 1 mes». */
function legible(dias) {
  if (dias === 0) return "llegó hoy";
  if (dias === 1) return "ayer";
  if (dias < 30) return `${dias} días`;
  if (dias < 365) {
    const meses = Math.round(dias / 30);
    return `${dias} días (${meses} ${meses === 1 ? "mes" : "meses"})`;
  }
  const anos = Math.floor(dias / 365);
  const resto = Math.round((dias % 365) / 30);
  if (resto === 0) return `${anos} ${anos === 1 ? "año" : "años"}`;
  return `${anos} ${anos === 1 ? "año" : "años"} y ${resto} ${resto === 1 ? "mes" : "meses"}`;
}

/* ── el render ──────────────────────────────────────────────────────────────── */

/**
 * Monta la cronología dentro de `seccion`. Devuelve `false` si no hay nada que
 * dibujar, y entonces quien llama la quita: un censo vacío no es un censo.
 */
export function montarCronologia(seccion, plantas, hoy) {
  if (!seccion || plantas.length === 0) return false;

  const entradas = plantas
    .map((p) => entradaDe(p, hoy))
    /* Orden: de la más antigua a la más reciente. Es el orden de la historia de
       la casa, y deja arriba al poto, que es el que da la perspectiva. Las de
       «sin dato» al final: no tienen sitio en el eje, no lo pueden tener en la
       ordenación. */
    .sort((a, b) => (b.dias ?? -1) - (a.dias ?? -1));

  const lista = seccion.querySelector(".cronologia__lista");
  const eje = seccion.querySelector(".cronologia__eje-pista");
  if (!lista || !eje) return false;

  const frag = document.createDocumentFragment();
  for (const entrada of entradas) frag.append(filaDe(entrada));
  lista.replaceChildren(frag);

  eje.replaceChildren(marcasDelEje());

  seccion.hidden = false;
  return true;
}

function filaDe({ planta, dias, certeza, texto }) {
  const li = document.createElement("li");
  li.className = "cronologia__fila";
  li.dataset.certeza = certeza;

  /* Un <button> real, no un div con onclick: lo que actúa es un botón. Y su
     nombre accesible es la frase entera —«Poto, más de 20 años en casa»—, así
     que el diagrama es legible saltando de botón en botón, sin ver el eje. */
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "cronologia__marca";
  boton.dataset.planta = planta.id;

  const nombre = document.createElement("span");
  nombre.className = "cronologia__nombre";
  nombre.textContent = planta.nombre_comun;

  /* La pista es la parte dibujada, y el punto va como PSEUDO-ELEMENTO de la
     pista, no como un <span> propio. No es un detalle de estilo:
     - el dato es el texto de al lado («74 días»), y el punto solo lo repite en
       forma de posición. Un pseudo-elemento no existe en el DOM, así que no hay
       ningún nodo que pueda confundirse con contenido;
     - y `tests/estructura.js` lo cazó con razón: siete `<span>` pequeños con
       fondo y sin texto son indistinguibles del clásico «punto de color» que
       codifica un estado. La forma de que no lo sean no es explicárselo al test,
       es que dejen de ser nodos.
     La posición es un dato calculado y va como custom property inline; el color,
     el tamaño y la forma los pone app.css con tokens. */
  const pista = document.createElement("span");
  pista.className = "cronologia__pista";
  pista.setAttribute("aria-hidden", "true");
  if (dias != null) pista.style.setProperty("--x", porcentaje(dias));

  const valor = document.createElement("span");
  valor.className = "cronologia__valor";
  valor.textContent = texto;

  /* El nombre accesible se compone a mano y con coma: sin ella, un lector lee
     «Poto74 días» de corrido. No se usa aria-label para no perder el texto
     visible, sino un texto oculto con la puntuación. */
  const puntuacion = document.createElement("span");
  puntuacion.className = "oculto-visual";
  puntuacion.textContent = ", ";

  boton.append(nombre, puntuacion, pista, valor);
  li.append(boton);
  return li;
}

function marcasDelEje() {
  const frag = document.createDocumentFragment();
  for (const marca of MARCAS) {
    const span = document.createElement("span");
    span.className = "cronologia__tic";
    span.style.setProperty("--x", porcentaje(marca.dias));
    // El rótulo es texto de verdad: es lo que impide que el eje mienta.
    span.textContent = marca.rotulo;
    frag.append(span);
  }
  return frag;
}
