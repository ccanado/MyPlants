/**
 * Render de una planta: datos entran, nodo sale.
 *
 * El markup vive en los <template> de index.html. Aquí solo se clona y se rellena
 * con textContent — nunca innerHTML, ni siquiera con datos propios.
 *
 * La ficha es la etiqueta térmica del vivero, y se «despega» con <details> nativo:
 * ni una línea de JS en abrir y cerrar, así que el foco, Enter/Espacio y el
 * comportamiento de teclado son los del navegador y no una imitación.
 *
 * Las tres capas del contenido se marcan en el DOM para que el CSS las distinga:
 * el dato verificado, el estado de la planta y la voz de Carlos no son lo mismo
 * y el brief exige que no lo parezcan.
 */

import { FOTO, FOTO_ETIQUETA } from "./datos.js";
import { humanizar, normalizar } from "./filtros.js";
import { iconoDe, iconoDificultad } from "./iconos.js";
import { siluetaDe } from "./siluetas.js";
import {
  diagramaLuz,
  diagramaRecuperacion,
  diagramaRiego,
  diagramaTemperatura,
} from "./svg.js";

const tpl = (id) => document.getElementById(id);
const TPL_FICHA = tpl("tpl-ficha");
const TPL_CAMPO = tpl("tpl-campo-diagrama");
const TPL_DATO = tpl("tpl-dato");

const SIN_DATO = "Sin dato";

/** Campos que van en la cara de la etiqueta, con la regadera en la mano. */
const EN_LA_CARA = ["riego", "luz", "temperatura"];
/** Campos con diagrama al despegar. Mismo orden que arriba, no es casualidad. */
const CON_DIAGRAMA = [
  ["riego", (p) => diagramaRiego(p.medidas.riego)],
  ["luz", (p) => diagramaLuz(p.medidas.luz)],
  ["temperatura", (p) => diagramaTemperatura(p.medidas.temperatura)],
];
/** El resto de datos verificados, en el bloque de abajo. */
const RESTO = ["humedad", "sustrato", "abonado", "trasplante"];

/**
 * Severidad → grupo semántico. `botanist` decide el vocabulario; esto solo lo
 * agrupa para el color y la marca. Lo que no reconozca cae en "atencion", que es
 * el lado prudente: nunca pinta de sana una planta que no sabe cómo está.
 */
const GRUPO_SEVERIDAD = new Map([
  ["sana", "sana"], ["bien", "sana"], ["ok", "sana"],
  ["vigilar", "atencion"], ["regular", "atencion"], ["atencion", "atencion"],
  ["leve", "atencion"], ["media", "atencion"],
  ["grave", "critica"], ["critica", "critica"], ["mal", "critica"],
  ["alerta", "critica"], ["urgente", "critica"],
]);

/**
 * Toxicidad: tres estados y ninguno verde. No hay ni una planta con «no tóxica»
 * confirmada, así que un icono verde mentiría en cinco fichas. Y «sin datos en
 * ASPCA» no es «segura»: es que nadie lo ha mirado.
 *
 * En casa de Carlos no hay mascotas, así que esto es informativo, no urgente:
 * el rojo queda reservado a la severidad crítica. El color significa «haz algo
 * hoy» y una planta tóxica en una casa sin gato no pide nada hoy.
 */
const ORDEN_TOX = ["segura", "sin_datos_aspca", "sin_identificar", "toxica"];

function estadoToxico(valor) {
  if (valor == null) return null;
  const t = normalizar(valor);
  if (t.includes("sin datos")) return "sin_datos_aspca";
  if (/(no toxica|atoxica|segura)/.test(t)) return "segura";
  if (t.includes("toxica")) return "toxica";
  return "sin_datos_aspca";  // lado prudente: nunca se asume seguridad
}

/** El distintivo toma la peor de las dos especies. Hoy coinciden en las siete,
 *  pero el esquema permite que diverjan y entonces manda la peor. */
function grupoToxicidad(tox) {
  // `clave` es un conjunto cerrado que mantiene `botanist`: si está, manda.
  // Olfatear la cadena era un apaño de cuando no existía el campo.
  if (tox.clave) return normalizar(tox.clave).replace(/\s+/g, "_");
  if (!tox.verificado) return "sin_identificar";
  const estados = [estadoToxico(tox.gatos), estadoToxico(tox.perros)].filter(Boolean);
  if (estados.length === 0) return estadoToxico(tox.nivel ?? tox.texto) ?? "sin_identificar";
  return estados.reduce((a, b) => (ORDEN_TOX.indexOf(b) > ORDEN_TOX.indexOf(a) ? b : a));
}

export function grupoSeveridad(valor) {
  if (valor == null) return "sana";
  return GRUPO_SEVERIDAD.get(normalizar(valor)) ?? "atencion";
}

/* ══ ficha ═══════════════════════════════════════════════════════════════════ */

export function fichaDe(planta) {
  const nodo = TPL_FICHA.content.cloneNode(true);
  const q = (sel) => nodo.querySelector(sel);

  const idTitulo = `n-${planta.id}`;
  const articulo = q(".etiqueta");
  articulo.id = planta.id;
  articulo.setAttribute("aria-labelledby", idTitulo);
  articulo.dataset.planta = planta.id;
  articulo.dataset.severidad = grupoSeveridad(planta.estado?.severidad);
  articulo.dataset.etiquetaVivero = planta.vivero.tiene ? "si" : "no";

  caraEtiqueta(q, planta, idTitulo);
  resumenesDeCara(q, planta);
  tirador(q, planta);
  bloqueEstado(q, planta);
  bloqueFoto(q, planta);
  bloqueProcedencia(q, planta);
  camposConDiagrama(q, planta);
  bloqueMasDatos(q, planta);
  bloqueCarlos(q, planta);

  return nodo;
}

/* ── la pegatina ────────────────────────────────────────────────────────────── */

/** El vivero sale de `meta`, no de una constante: la begonia no es de Projardín
 *  y la pegatina tiene que decir la verdad de cada planta. */
let META = {};
export function fijarMeta(meta) { META = meta ?? {}; }

function caraEtiqueta(q, planta, idTitulo) {
  // El nombre se imprime idéntico en las siete: es lo que se busca con prisa.
  const silueta = siluetaDe(planta.id);
  if (silueta) q(".etiqueta__silueta").append(silueta);
  else q(".etiqueta__silueta").remove();

  const titulo = q(".etiqueta__nombre");
  titulo.id = idTitulo;
  /* El nombre grande existe para encontrar la planta de un vistazo, y el estado
     de identificación no ayuda a encontrarla: baja al renglón del binomio, que
     es el que existe para decir qué es. De paso la cadena más larga de la
     rejilla pasa de 25 caracteres a 7. */
  titulo.textContent = planta.nombre_comun.replace(/\s*\((sin identificar|sin determinar)\)\s*$/i, "");

  const binomio = q(".etiqueta__binomio");
  if (planta.nombre_cientifico) {
    q(".etiqueta__binomio-texto").textContent = planta.nombre_cientifico;
  } else {
    binomio.dataset.sinIdentificar = "si";
    q(".etiqueta__binomio-texto").textContent = "Especie sin identificar";
  }
  if (planta.vivero.fitosanitario) segmentar(q(".etiqueta__fito"), planta.vivero.fitosanitario);
  else if (!planta.vivero.pasaporte) q(".etiqueta__fito").remove();

  // Lo único que cambia entre las dos variantes es el bloque de procedencia,
  // que es justo el dato que falta.
  const v = META.vivero ?? {};
  const esDelVivero = planta.vivero.emisor && planta.vivero.emisor === v.nombre;

  if (!planta.vivero.tiene) {
    q(".etiqueta__vivero-nombre").textContent = "Sin etiqueta de vivero";
    q(".etiqueta__vivero-dir").textContent = "Procedencia sin registrar";
    q(".etiqueta__vivero-tfno").remove();
  } else if (esDelVivero) {
    q(".etiqueta__vivero-nombre").textContent = v.nombre;
    q(".etiqueta__vivero-dir").textContent = v.direccion ?? "";
    q(".etiqueta__vivero-tfno").textContent = v.telefono ? `Tfno. ${v.telefono}` : "";
  } else {
    // La begonia viene de otro productor y trae pasaporte europeo.
    q(".etiqueta__vivero-nombre").textContent = planta.vivero.emisor ?? "Productor sin identificar";
    q(".etiqueta__vivero-dir").textContent = planta.vivero.procedencia ?? "";
    q(".etiqueta__vivero-tfno").remove();
  }

  /* Los dígitos impresos NO son un EAN salvo en la begonia. El rótulo tiene que
     decir cuál es cuál: `CÓD.` para el código interno del vivero y `EAN` solo
     para el de trece dígitos. La palabra EAN sobre un número que no lo es
     convierte la signature en atrezo. */
  const linea = q(".etiqueta__linea-precio");

  if (!planta.vivero.tiene) {
    /* Sin etiqueta de vivero NO va trama ni raya. `--trama-sin-dato` significa
       «no lo sabemos», y que estas dos no traigan pegatina es un hecho
       conocido, no un dato desconocido: son cosas opuestas. El espacio lo
       ocupa el texto de procedencia, como contenido normal. */
    linea.remove();
  } else {
    const esEan = Boolean(planta.vivero.ean);
    const digitos = planta.vivero.ean ?? planta.vivero.codigo;

    if (digitos) {
      q(".etiqueta__digitos").textContent = `${esEan ? "EAN" : "Cód."} ${digitos}`;
    } else {
      q(".etiqueta__digitos").remove();
      q(".etiqueta__barras").remove();
    }

    // La begonia es etiqueta de productor: no lleva precio, y su celda la ocupa
    // la procedencia. No es un hueco, es otro dato.
    ponerOQuitar(q(".etiqueta__precio"), q(".etiqueta__precio"), planta.vivero.precio);
    ponerOQuitar(q(".etiqueta__calibre"), q(".etiqueta__calibre"), planta.vivero.maceta);
  }

  // El pasaporte de la begonia ocupa el renglón del fitosanitario de las otras.
  if (!planta.vivero.fitosanitario && planta.vivero.pasaporte) {
    const fito = q(".etiqueta__fito");
    if (fito) segmentar(fito, planta.vivero.pasaporte);
  }
}

/** Parte un código de trazabilidad por sus separadores y hace cada segmento
 *  indivisible: un código partido por la mitad deja de ser un código. */
function segmentar(destino, texto_) {
  destino.textContent = "";
  const trozos = String(texto_).split(/\s*·\s*/);
  trozos.forEach((t, i) => {
    const span = document.createElement("span");
    span.className = "segmento";
    span.textContent = t;
    destino.append(span);
    if (i < trozos.length - 1) destino.append(document.createTextNode(" · "));
  });
}

function resumenesDeCara(q, planta) {
  for (const clave of EN_LA_CARA) {
    const bloque = q(`.resumen[data-campo="${clave}"]`);
    const cuidado = planta.cuidados.get(clave);
    const valor = bloque.querySelector(".resumen__valor");
    if (cuidado?.resumen) {
      valor.textContent = cuidado.resumen;
    } else {
      valor.textContent = SIN_DATO;
      valor.classList.add("sin-dato");
      bloque.dataset.verificado = "no";
    }
  }
}

function tirador(q, planta) {
  // El texto del tirador nombra la planta: un lector de pantalla que salte de
  // botón en botón oiría siete veces «despegar» sin saber de cuál.
  q(".despegue__texto").textContent = `Despegar ${planta.nombre_comun}`;
}

/* ── capa 1 · estado ────────────────────────────────────────────────────────── */

function bloqueEstado(q, planta) {
  const seccion = q(".estado");
  const estado = planta.estado;
  if (!estado) {
    seccion.remove();
    return;
  }

  const g = grupoSeveridad(estado.severidad);
  seccion.hidden = false;
  seccion.dataset.severidad = g;

  /* Las cuatro sanas también tienen estado poblado: preventivo, plazo y qué
     mirar. Siguen sin distintivo, pero su contenido tiene que verse, y «Qué le
     pasa» sobre una planta sana sería un titular equivocado. */
  q(".estado__titulo").textContent = g === "sana" ? "Qué vigilar" : "Qué le pasa";
  if (estado.titulo_estado) q(".estado__severidad").before(subtitulo(estado.titulo_estado));

  // El texto va siempre: el color no puede ser el único portador de la señal.
  q(".estado__severidad-valor").textContent = humanizar(estado.severidad);
  q(".estado__marca").dataset.marca = g;

  const fecha = q(".estado__fecha");
  if (estado.fecha_foto) fecha.textContent = `Visto el ${fechaLegible(estado.fecha_foto)}`;
  else fecha.remove();

  listaEn(seccion, ".estado__bloque--senales", estado.senales);
  bloqueCausas(seccion, estado.causas);
  listaEn(seccion, ".estado__bloque--limites", estado.no_visible);

  const tratamiento = q(".estado__tratamiento");
  if (estado.pasos.length === 0) {
    tratamiento.remove();
    return;
  }
  tratamiento.hidden = false;

  // El <ol> es la fuente; el diagrama es una segunda vista de esta misma lista.
  const pasos = q(".estado__pasos");
  for (const paso of estado.pasos) {
    const li = document.createElement("li");
    li.className = "paso";

    if (paso.plazo) {
      const plazo = document.createElement("span");
      plazo.className = "paso__plazo";
      plazo.textContent = paso.plazo;
      li.append(plazo);
    }

    const accion = document.createElement("span");
    accion.className = "paso__accion";
    accion.textContent = paso.accion;
    li.append(accion);

    if (paso.senal) {
      const senal = document.createElement("span");
      senal.className = "paso__senal";
      senal.textContent = paso.senal;
      li.append(senal);
    }
    pasos.append(li);
  }

  const revisar = q(".estado__revisar");
  if (estado.revisar_en) {
    revisar.hidden = false;
    const desde = !estado.revisar_fecha && estado.revisar_dias && estado.revisar_desde
      ? `${estado.revisar_dias} días desde ${estado.revisar_desde}. `
      : "";
    q(".estado__revisar-texto").textContent = desde + estado.revisar_en;
  } else {
    revisar.remove();
  }

  /* `revisar_fecha` es fecha real en 6 de 7. La begonia lleva null a propósito:
     su plazo cuenta desde el día que se cambie de maceta, no desde hoy, así que
     se pinta como plazo relativo y nunca como fecha. */
  const rotuloPlazo = estado.revisar_fecha
    ? fechaCorta(estado.revisar_fecha)
    : estado.revisar_dias
      ? `+${estado.revisar_dias} días`
      : estado.revisar_corto;
  const diagrama = diagramaRecuperacion(estado.pasos, rotuloPlazo);
  if (diagrama) q(".estado__diagrama").append(diagrama);
  else q(".estado__diagrama").remove();
}

/**
 * Las causas probables: una línea por causa y el razonamiento plegado detrás.
 * Con siete párrafos largos volcados de golpe el bloque se vuelve un muro y el
 * brief pide leer el dato concreto sin scroll infinito.
 *
 * `patron` va aparte y con su rótulo: no es una afirmación más, es una
 * instrucción para mirar la planta, y es lo que convierte un listado de causas
 * en algo usable delante del tiesto.
 */
function bloqueCausas(raiz, causas) {
  const bloque = raiz.querySelector(".estado__bloque--causas");
  if (!bloque) return;
  if (!causas || causas.length === 0) {
    bloque.remove();
    return;
  }
  bloque.hidden = false;
  const ul = bloque.querySelector(".estado__lista");

  for (const causa of causas) {
    const li = document.createElement("li");
    li.className = "estado__item causa";
    if (causa.id) li.dataset.causa = causa.id;

    const linea = document.createElement("p");
    linea.className = "causa__resumen";
    linea.textContent = causa.resumen ?? causa.detalle;
    li.append(linea);

    if (causa.detalle && causa.resumen) {
      const det = document.createElement("details");
      det.className = "causa__mas";
      const sum = document.createElement("summary");
      sum.className = "causa__mas-tirador";
      sum.textContent = "Por qué";
      const p = document.createElement("p");
      p.className = "causa__detalle";
      p.textContent = causa.detalle;
      det.append(sum, p);
      li.append(det);
    }

    if (causa.patron) {
      const patron = document.createElement("p");
      patron.className = "causa__patron";
      const rotulo = document.createElement("span");
      rotulo.className = "causa__patron-rotulo";
      rotulo.textContent = "Para reconocerla";
      const texto = document.createElement("span");
      texto.textContent = causa.patron;
      patron.append(rotulo, texto);
      li.append(patron);
    }

    ul.append(li);
  }
}

/** Rellena un <ul> de un bloque del estado, o quita el bloque si no hay nada. */
function listaEn(raiz, selectorBloque, elementos) {
  const bloque = raiz.querySelector(selectorBloque);
  if (!bloque) return;
  if (!elementos || elementos.length === 0) {
    bloque.remove();
    return;
  }
  bloque.hidden = false;
  const ul = bloque.querySelector(".estado__lista");
  for (const item of elementos) {
    const li = document.createElement("li");
    li.className = "estado__item";
    li.textContent = item;
    ul.append(li);
  }
}

function subtitulo(texto_) {
  const p = document.createElement("p");
  p.className = "estado__cabecera";
  p.textContent = texto_;
  return p;
}

/** «2026-08-11» → «11/08/2026». Sin librerías de fechas para esto. */
function fechaLegible(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/* ── foto ───────────────────────────────────────────────────────────────────── */

function bloqueFoto(q, planta) {
  const figura = q(".foto");
  if (!planta.foto) {
    figura.remove();
    return;
  }
  figura.hidden = false;
  const img = q(".foto__img");
  img.src = planta.foto;
  img.width = FOTO.ancho;
  img.height = FOTO.alto;
  // Sin alt útil, la foto no le aporta nada a un lector de pantalla.
  img.alt = planta.foto_alt || "";

  const pie = q(".foto__pie");
  if (planta.ubicacion) pie.textContent = planta.ubicacion;
  else pie.remove();
}

/**
 * El bloque de procedencia. Para cinco de las siete, la pegatina del vivero es
 * la fuente más fuerte que existe de qué compró Carlos: POWO dice qué es una
 * especie, no qué hay en ese tiesto. Para las otras dos, la ausencia se dice.
 */
function bloqueProcedencia(q, planta) {
  const figura = q(".prueba__figura");
  const sin = q(".prueba__sin");
  const nota = q(".prueba__nota");

  if (planta.foto_etiqueta) {
    figura.hidden = false;
    const img = q(".prueba__img");
    img.src = planta.foto_etiqueta;
    img.width = FOTO_ETIQUETA.ancho;
    img.height = FOTO_ETIQUETA.alto;
    img.alt = planta.etiqueta_alt
      ?? `Etiqueta de vivero de ${planta.nombre_comun}, fotografiada en la maceta`;
    sin.remove();
  } else {
    figura.remove();
    sin.hidden = false;
    /* No llevar pegatina no es un hueco de datos: en estas dos es antigüedad, y
       eso es contenido normal. Por eso NO va en gris de «sin dato». El texto lo
       da el JSON; si no está, se dice lo único que consta. */
    sin.textContent = planta.procedencia_nota ?? "Sin etiqueta de vivero: no se conserva.";
  }

  // Pie de procedencia: quién la vendió, cuándo llegó y por cuánto.
  const partes = [
    planta.vivero.emisor,
    fechaCorta(planta.fecha_llegada),
    planta.vivero.precio,
  ].filter(Boolean);
  if (partes.length > 0) nota.textContent = partes.join(" · ");
  else nota.remove();

  // «En aclimatación» no es un estado nuevo: es una fecha calculada. Se apaga
  // sola a las tres semanas sin que nadie toque contenido ni CSS.
  const dias = diasDesde(planta.fecha_llegada);
  if (dias != null && dias < 21) {
    const p = document.createElement("p");
    p.className = "prueba__aclimatacion";
    p.textContent = "Recién llegada, en aclimatación.";
    q(".prueba").append(p);
  }
}

/** Días transcurridos desde una fecha ISO, o null si no hay fecha válida. */
function diasDesde(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
}

function fechaCorta(iso) {
  if (!iso) return null;
  const d = diasDesde(iso);
  if (d === 0) return "hoy";
  if (d === 1) return "ayer";
  return fechaLegible(iso);
}

/* ── capa 2 · los tres campos con diagrama ──────────────────────────────────── */

function camposConDiagrama(q, planta) {
  const contenedor = q(".campos-diagrama");
  for (const [clave, hacerDiagrama] of CON_DIAGRAMA) {
    const cuidado = planta.cuidados.get(clave);
    if (!cuidado) continue;
    contenedor.append(campoDe(cuidado, hacerDiagrama(planta), fuenteDe(planta, clave)));
  }
}

function campoDe(cuidado, diagrama, fuente) {
  const nodo = TPL_CAMPO.content.cloneNode(true);
  const seccion = nodo.querySelector(".campo");
  seccion.dataset.campo = cuidado.clave;

  const clave = nodo.querySelector(".campo__clave");
  const icono = iconoDe(cuidado.clave);
  clave.textContent = cuidado.etiqueta;
  // El icono acompaña a la versalita, no la sustituye.
  if (icono) clave.prepend(icono);

  const resumen = nodo.querySelector(".campo__resumen");
  if (cuidado.resumen) {
    resumen.textContent = cuidado.resumen;
  } else {
    resumen.textContent = SIN_DATO;
    resumen.classList.add("sin-dato");
    seccion.dataset.verificado = "no";
  }

  // El diagrama puede ser un <svg> o el aviso de «sin dato»: los dos son válidos.
  if (diagrama) nodo.querySelector(".campo__diagrama").append(diagrama);
  else nodo.querySelector(".campo__diagrama").remove();

  const mas = nodo.querySelector(".campo__mas");
  if (cuidado.detalle) {
    mas.hidden = false;
    nodo.querySelector(".campo__detalle").textContent = cuidado.detalle;
  } else {
    mas.remove();
  }

  pintarFuente(nodo.querySelector(".campo__fuente"), fuente);
  return nodo;
}

/* ── capa 2 · el resto ──────────────────────────────────────────────────────── */

function bloqueMasDatos(q, planta) {
  const lista = q(".mas-datos__lista");

  for (const clave of RESTO) {
    const c = planta.cuidados.get(clave);
    if (!c) continue;
    lista.append(datoDe(c.etiqueta, c.resumen, c.detalle, fuenteDe(planta, clave), clave));
  }

  /* Se pinta también cuando dice que los guantes sobran: inflar la precaución
     donde no aplica es la forma más rápida de que nadie se la crea donde sí. */
  if (planta.manipulacion) {
    lista.append(datoDe("Manipulación", planta.manipulacion.resumen,
      [planta.manipulacion.detalle, planta.manipulacion.epi].filter(Boolean).join("\n") || null,
      fuenteDe(planta, "manipulacion"), "manipulacion"));
  }

  const plagas = planta.plagas.length > 0 ? planta.plagas.map((x) => x.nombre).join(" · ") : null;
  // La señal de cada plaga es lo que de verdad sirve para reconocerla: va al
  // detalle ampliable en vez de perderse.
  const senales = planta.plagas.filter((x) => x.senal).map((x) => `${x.nombre}: ${x.senal}`).join("\n");
  lista.append(datoDe("Plagas comunes", plagas, senales || null, fuenteDe(planta, "plagas_comunes"), "plagas"));

  const tox = planta.toxicidad;
  const g = grupoToxicidad(tox);
  const sinDatos = g === "sin_datos" || g === "sin_datos_aspca";
  // Ni «sin datos» ni «sin identificar» se abrevian a una palabra: que no haya
  // dato es justo lo que hay que leer entero.
  const textoTox =
    g === "sin_identificar"
      ? "Sin identificar la especie, no se puede valorar. No significa que sea segura."
      : sinDatos
        // El aviso viene del JSON y se pinta entero. Si no cabe, se agranda la
        // caja: recortar una frase de seguridad es peor que no ponerla.
        ? [tox.texto, tox.aviso].filter(Boolean).join(" ")
        : tox.texto ?? (tox.nivel ? humanizar(tox.nivel) : null);
  const nodoTox = datoDe(
    "Toxicidad para mascotas",
    textoTox,
    tox.detalle,
    fuenteDe(planta, "toxicidad_mascotas"),
    "toxicidad"
  );
  const bloqueTox = nodoTox.querySelector(".dato");
  // El modificador lo pone el render, no la plantilla: este bloque se genera.
  bloqueTox.classList.add("dato--toxicidad");
  bloqueTox.dataset.toxicidad = grupoToxicidad(tox);

  /* El aviso del casi-homónimo va aparte y visible: ASPCA tiene ficha de otra
     especie de nombre casi idéntico, y la trampa va en las dos direcciones —
     en el coleo invita a bajar la guardia, en el ficus a subirla. */
  if (tox.aviso_homonimo) {
    const nota = document.createElement("p");
    nota.className = "aviso-homonimo";
    nota.textContent = tox.aviso_homonimo;
    bloqueTox.querySelector(".dato__valor").append(nota);
  }
  lista.append(nodoTox);

  // La palabra es obligatoria al lado de los puntos: tres puntos no dicen cuál es cuál.
  lista.append(datoDe("Dificultad", planta.dificultad ? humanizar(planta.dificultad) : null, null, null, "dificultad"));

  // Fuentes que no cuelgan de ningún campo concreto: no se tiran, se agrupan.
  const sueltas = planta.fuentes.filter((f) => !f.respalda);
  if (sueltas.length > 0) {
    const div = document.createElement("div");
    div.className = "dato dato--fuentes";
    const dt = document.createElement("dt");
    dt.className = "dato__clave";
    dt.textContent = sueltas.length === 1 ? "Fuente" : "Fuentes";
    const dd = document.createElement("dd");
    dd.className = "dato__valor";
    for (const f of sueltas) {
      const span = document.createElement("span");
      span.className = "dato__fuente";
      span.append(enlaceFuente(f));
      dd.append(span);
    }
    div.append(dt, dd);
    lista.append(div);
  }
}

function datoDe(etiqueta, valor, detalle, fuente, campoIcono) {
  const nodo = TPL_DATO.content.cloneNode(true);
  const clave = nodo.querySelector(".dato__clave");
  clave.textContent = etiqueta;
  const icono = campoIcono === "dificultad" ? iconoDificultad(valor) : iconoDe(campoIcono);
  if (icono) clave.prepend(icono);

  const texto = nodo.querySelector(".dato__texto");
  if (valor) {
    texto.textContent = valor;
  } else {
    texto.textContent = SIN_DATO;
    texto.classList.add("sin-dato");
    nodo.querySelector(".dato").dataset.verificado = "no";
  }

  const mas = nodo.querySelector(".dato__mas");
  if (detalle) {
    mas.hidden = false;
    nodo.querySelector(".dato__detalle").textContent = detalle;
  } else {
    mas.remove();
  }

  pintarFuente(nodo.querySelector(".dato__fuente"), fuente);
  return nodo;
}

/* ── fuentes: contenido, no letra pequeña ───────────────────────────────────── */

function fuenteDe(planta, campo) {
  return planta.fuentes.find((f) => f.respalda && normalizar(f.respalda) === normalizar(campo)) ?? null;
}

function pintarFuente(contenedor, fuente) {
  if (!contenedor) return;
  if (!fuente) {
    contenedor.remove();
    return;
  }
  contenedor.hidden = false;
  const enlace = contenedor.querySelector(".fuente");
  if (fuente.url) {
    enlace.href = fuente.url;
    // Nombre corto («RHS ↗»), no dominio: es como se cita una fuente.
    contenedor.querySelector(".fuente__dominio").textContent = fuente.titulo;
    enlace.title = fuente.titulo;
  } else {
    // Sin URL no es un enlace: un <a href=""> vacío es una trampa para el teclado.
    enlace.replaceWith(sinEnlace(fuente.titulo, fuente.consultado));
  }
}

function enlaceFuente(f) {
  if (!f.url) return sinEnlace(f.titulo, f.consultado);
  const a = document.createElement("a");
  a.className = "fuente";
  a.href = f.url;
  a.rel = "noopener noreferrer";
  a.title = f.titulo;
  const dom = document.createElement("span");
  dom.className = "fuente__dominio";
  dom.textContent = f.titulo;
  const flecha = document.createElement("span");
  flecha.className = "fuente__flecha";
  flecha.setAttribute("aria-hidden", "true");
  flecha.textContent = "↗";
  const oculto = document.createElement("span");
  oculto.className = "oculto-visual";
  oculto.textContent = " (se abre en el sitio de la fuente)";
  a.append(dom, flecha, oculto);
  return a;
}

/** Una observación propia o una frase de Carlos no es un enlace: sin flecha,
 *  sin subrayado, y con la fecha de consulta al lado. */
function sinEnlace(titulo, consultado) {
  const span = document.createElement("span");
  span.className = "fuente fuente--sin-url";
  span.textContent = consultado ? `${titulo} · ${fechaLegible(consultado)}` : titulo;
  return span;
}

function dominio(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/* ── capa 3 · el cuaderno de Carlos ─────────────────────────────────────────── */

function bloqueCarlos(q, planta) {
  const panel = q(".cuaderno");
  const notas = planta.notas ?? [];
  if (!planta.historia && !planta.notas_carlos && notas.length === 0) {
    panel.remove();
    return;
  }
  panel.hidden = false;

  /* El rótulo es el AUTOR, no una persona fija: quien riega es Noah. El panel
     codifica un registro —«esto no tiene fuente y no la necesita»—, no un
     nombre concreto. */
  const autores = [...new Set(notas.map((n) => n.autor).filter(Boolean))];
  q(".cuaderno__rotulo").textContent = autores.length > 0 ? autores.join(" y ") : "En casa";

  ponerOQuitar(q(".cuaderno__historia"), q(".cuaderno__historia"), planta.historia);

  const destinoNotas = q(".cuaderno__notas");
  const sueltas = [planta.notas_carlos, ...notas.map((n) => n.texto)].filter(Boolean);
  if (sueltas.length > 0) destinoNotas.textContent = sueltas.join(" ");
  else destinoNotas.remove();
}

/* ── utilidades ─────────────────────────────────────────────────────────────── */

/** Rellena un nodo con texto, o lo quita del DOM si no hay nada que poner.
 *  Un párrafo vacío ocupa espacio y el lector de pantalla lo recorre igual. */
function ponerOQuitar(contenedor, destino, valor) {
  if (valor) destino.textContent = valor;
  else contenedor.remove();
}

/* ── lista completa ─────────────────────────────────────────────────────────── */

export function renderLista(plantas, contenedor) {
  const frag = document.createDocumentFragment();
  for (const p of plantas) frag.append(fichaDe(p));
  contenedor.replaceChildren(frag); // una sola inserción, sin parpadeo
}
