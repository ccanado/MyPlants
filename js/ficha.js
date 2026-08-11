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

import { FOTO } from "./datos.js";
import { humanizar, normalizar } from "./filtros.js";
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

const GRUPO_TOXICIDAD = new Map([
  ["no toxica", "segura"], ["no", "segura"], ["segura", "segura"], ["atoxica", "segura"],
  ["leve", "atencion"], ["irritante", "atencion"], ["baja", "atencion"],
  ["toxica", "critica"], ["si", "critica"], ["alta", "critica"], ["grave", "critica"],
]);

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
  camposConDiagrama(q, planta);
  bloqueMasDatos(q, planta);
  bloqueCarlos(q, planta);

  return nodo;
}

/* ── la pegatina ────────────────────────────────────────────────────────────── */

function caraEtiqueta(q, planta, idTitulo) {
  const titulo = q(".etiqueta__nombre");
  titulo.id = idTitulo;
  titulo.textContent = planta.nombre_comun;

  ponerOQuitar(q(".etiqueta__binomio"), q(".etiqueta__binomio-texto"), planta.nombre_cientifico);
  ponerOQuitar(q(".etiqueta__maceta"), q(".etiqueta__maceta"), planta.vivero.maceta);
  ponerOQuitar(q(".etiqueta__precio"), q(".etiqueta__precio"), planta.vivero.precio);
  ponerOQuitar(q(".etiqueta__fito"), q(".etiqueta__fito"), planta.vivero.fitosanitario);

  // El código de barras lo dibuja el CSS con repeating-linear-gradient: cero
  // imágenes y cero peso. El EAN, si lo hay, siembra el patrón.
  const ean = q(".etiqueta__ean");
  if (planta.vivero.ean) ean.dataset.ean = planta.vivero.ean;
  else if (!planta.vivero.tiene) ean.remove();
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
  if (!planta.estado) {
    seccion.remove();
    return;
  }

  const g = grupoSeveridad(planta.estado.severidad);
  seccion.hidden = false;
  seccion.dataset.severidad = g;

  // El texto va siempre: el color no puede ser el único portador de la señal.
  q(".estado__severidad-valor").textContent = humanizar(planta.estado.severidad);
  q(".estado__marca").dataset.marca = g;
  q(".estado__cabecera").textContent = planta.estado.titulo;
  ponerOQuitar(q(".estado__diagnostico"), q(".estado__diagnostico"), planta.estado.diagnostico);

  const tratamiento = q(".estado__tratamiento");
  if (planta.estado.pasos.length === 0) {
    tratamiento.remove();
    return;
  }
  tratamiento.hidden = false;

  // El <ol> es la fuente; el diagrama es una segunda vista de esta misma lista.
  const lista = q(".estado__pasos");
  for (const paso of planta.estado.pasos) {
    const li = document.createElement("li");
    li.className = "paso";
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
    lista.append(li);
  }

  const diagrama = diagramaRecuperacion(planta.estado.pasos, planta.estado.revisar_en);
  if (diagrama) q(".estado__diagrama").append(diagrama);
  else q(".estado__diagrama").remove();
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

  nodo.querySelector(".campo__clave").textContent = cuidado.etiqueta;

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
    lista.append(datoDe(c.etiqueta, c.resumen, c.detalle, fuenteDe(planta, clave)));
  }

  const plagas = planta.plagas.length > 0 ? planta.plagas.join(" · ") : null;
  lista.append(datoDe("Plagas comunes", plagas, null, fuenteDe(planta, "plagas_comunes")));

  const tox = planta.toxicidad;
  const nodoTox = datoDe(
    "Toxicidad para mascotas",
    tox.texto ?? (tox.nivel ? humanizar(tox.nivel) : null),
    null,
    fuenteDe(planta, "toxicidad_mascotas")
  );
  // La toxicidad es información de seguridad: se marca aunque no se sepa.
  const grupoTox = tox.verificado
    ? GRUPO_TOXICIDAD.get(normalizar(tox.nivel ?? tox.texto ?? "")) ?? "atencion"
    : "desconocida";
  nodoTox.querySelector(".dato").dataset.toxicidad = grupoTox;
  lista.append(nodoTox);

  lista.append(datoDe("Dificultad", planta.dificultad ? humanizar(planta.dificultad) : null, null, null));

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

function datoDe(etiqueta, valor, detalle, fuente) {
  const nodo = TPL_DATO.content.cloneNode(true);
  nodo.querySelector(".dato__clave").textContent = etiqueta;

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
    contenedor.querySelector(".fuente__dominio").textContent = dominio(fuente.url) ?? fuente.titulo;
    enlace.title = fuente.titulo;
  } else {
    // Sin URL no es un enlace: un <a href=""> vacío es una trampa para el teclado.
    enlace.replaceWith(sinEnlace(fuente.titulo));
  }
}

function enlaceFuente(f) {
  if (!f.url) return sinEnlace(f.titulo);
  const a = document.createElement("a");
  a.className = "fuente";
  a.href = f.url;
  a.rel = "noopener noreferrer";
  a.title = f.titulo;
  const dom = document.createElement("span");
  dom.className = "fuente__dominio";
  dom.textContent = dominio(f.url) ?? f.titulo;
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

function sinEnlace(titulo) {
  const span = document.createElement("span");
  span.className = "fuente fuente--sin-url";
  span.textContent = titulo;
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
  if (!planta.historia && !planta.notas_carlos) {
    panel.remove();
    return;
  }
  panel.hidden = false;
  ponerOQuitar(q(".cuaderno__historia"), q(".cuaderno__historia"), planta.historia);
  ponerOQuitar(q(".cuaderno__notas"), q(".cuaderno__notas"), planta.notas_carlos);
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
