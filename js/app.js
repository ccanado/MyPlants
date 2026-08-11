/**
 * Punto de entrada. Orquesta y nada más: carga los datos, monta los controles,
 * conecta los eventos. La lógica vive en los módulos.
 */

import { cargarPlantas, ordenarPorUrgencia } from "./datos.js";
import { fijarHoy, fijarMeta, grupoSeveridad, renderLista } from "./ficha.js";
import { crearEstado, debounce } from "./estado.js";
import { facetas, filtrar, filtrosVacios, hayFiltros, humanizar } from "./filtros.js";
import { diaDeHoy, fechaLarga, tareasDeHoy } from "./tareas.js";
import { montarCronologia } from "./cronologia.js";

const el = {
  rejilla: document.getElementById("rejilla"),
  facetas: document.getElementById("facetas"),
  busqueda: document.getElementById("busqueda"),
  resultado: document.getElementById("resultado"),
  aviso: document.getElementById("aviso"),
  limpiar: document.getElementById("limpiar"),
  formFiltros: document.querySelector(".filtros__form"),
  formBusqueda: document.querySelector(".buscador"),
  parte: document.getElementById("parte"),
  parteFecha: document.getElementById("parte-fecha"),
  parteResumen: document.getElementById("parte-resumen"),
  parteTareas: document.getElementById("parte-tareas"),
  parteResto: document.getElementById("parte-resto"),
  parteChips: document.getElementById("parte-chips"),
  cronologia: document.querySelector(".cronologia"),
};

const TPL_FACETA = document.getElementById("tpl-faceta");
const TPL_OPCION = document.getElementById("tpl-opcion");
const TPL_CHIP = document.getElementById("tpl-chip");
const TPL_TAREA = document.getElementById("tpl-tarea-franja");

/**
 * Hoy se calcula UNA VEZ, al arrancar, y se pasa a todo lo demás.
 *
 * No es una micro-optimización: es que nada de esta página cuenta hacia atrás en
 * vivo. Si cada componente llamase a `new Date()` por su cuenta, dos partes de
 * la misma pantalla podrían discrepar al cruzar la medianoche, y encima el
 * cálculo dejaría de ser reproducible para quien lo mida.
 */
const HOY = diaDeHoy();

arrancar();

async function arrancar() {
  let plantas;
  try {
    const datos = await cargarPlantas();
    fijarMeta(datos.meta);
    fijarHoy(HOY);
    plantas = ordenarPorUrgencia(datos.plantas);
  } catch (err) {
    // El fallo se ve en la página, no solo en la consola.
    mostrarAviso(
      "No se han podido cargar las plantas. Si abriste el fichero con doble clic, " +
      "sirve la carpeta con «python3 -m http.server 8000» y entra por http://localhost:8000."
    );
    console.error(err);
    return;
  }

  if (plantas.length === 0) {
    mostrarAviso("Todavía no hay plantas en content/plantas.json.");
    return;
  }

  const estado = crearEstado(
    { busqueda: "", filtros: filtrosVacios() },
    (s) => pintar(plantas, s)
  );

  montarParteDelDia(plantas);
  /* La cronología es un censo de las SIETE, así que se monta con la lista
     completa y no se refiltra: un censo que se recorta con el buscador deja de
     ser un censo, y el dato que da —tres órdenes de magnitud en el mismo salón—
     solo existe estando las siete. */
  if (!montarCronologia(el.cronologia, plantas, HOY)) el.cronologia?.remove();
  montarFacetas(plantas);
  conectarEventos(estado);
  estado.refrescar();
}

/* ── render ─────────────────────────────────────────────────────────────────── */

function pintar(plantas, s) {
  const visibles = filtrar(plantas, s);
  renderLista(visibles, el.rejilla);

  el.resultado.textContent = resumenResultados(visibles.length, plantas.length, s);
  el.limpiar.hidden = !hayFiltros(s);
  el.rejilla.dataset.vacio = visibles.length === 0 ? "si" : "no";
}

function resumenResultados(n, total, s) {
  if (n === 0) return "Ninguna planta coincide. Prueba a quitar algún filtro.";
  if (!hayFiltros(s)) return `${total} ${plural(total, "planta", "plantas")} en casa.`;
  return `${n} de ${total} ${plural(total, "planta", "plantas")}.`;
}

const plural = (n, uno, varios) => (n === 1 ? uno : varios);

function mostrarAviso(texto) {
  el.aviso.textContent = texto;
  el.aviso.hidden = false;
}

/* ── parte del día ──────────────────────────────────────────────────────────── */

/** Cuántas tareas se enseñan en la franja. Dos, y no es un número redondo: es
 *  que la franja no crece. Con siete tareas dice el número y las dos primeras. */
const TAREAS_EN_LA_FRANJA = 2;

/**
 * La franja `HOY`: qué hay que hacer hoy, con la fecha real del navegador.
 *
 * Sube de categoría la franja que antes contaba severidades estáticas. Los dos
 * ejes conviven porque son independientes y hay que leerlos como tales: la
 * `critica` es el helecho y la `vencida` es la begonia, plantas distintas. Uno
 * dice cómo están; el otro, qué toca.
 */
function montarParteDelDia(plantas) {
  const tocadas = plantas.filter((p) => p.estado && grupoSeveridad(p.estado.severidad) !== "sana");
  const tareas = tareasDeHoy(plantas, HOY);

  el.parte.hidden = false;

  const fecha = fechaLarga(HOY.fecha);
  if (fecha) el.parteFecha.textContent = fecha;
  else el.parteFecha.remove();

  /* Las dos cuentas en la misma línea, y la de tareas primero: es la que
     contesta a «qué hago», que es para lo que se abre la página. */
  const partes = [];
  if (tareas.length > 0) {
    partes.push(`${tareas.length} ${plural(tareas.length, "tarea", "tareas")}`);
  } else {
    /* Cero tareas NO es «no hay nada que hacer»: es que hoy no hay nada que se
       pueda afirmar desde el calendario. El riego y las condicionadas siguen
       ahí, en sus fichas, y decir lo contrario sería el error que esta franja
       existe para no cometer. */
    partes.push("Nada con fecha para hoy");
  }
  partes.push(
    tocadas.length === 0
      ? `las ${plantas.length} están bien`
      : `${tocadas.length} de ${plantas.length} ${plural(tocadas.length, "pide", "piden")} mirada`
  );
  el.parteResumen.textContent = `${partes.join(" · ")}.`;

  montarTareasDeLaFranja(tareas);

  const frag = document.createDocumentFragment();
  for (const p of tocadas) {
    const nodo = TPL_CHIP.content.cloneNode(true);
    const boton = nodo.querySelector(".chip__boton");
    const g = grupoSeveridad(p.estado.severidad);
    boton.dataset.planta = p.id;
    boton.dataset.severidad = g;
    nodo.querySelector(".chip__marca").dataset.marca = g;
    nodo.querySelector(".chip__nombre").textContent = p.nombre_comun;
    frag.append(nodo);
  }
  el.parteChips.replaceChildren(frag);
}

function montarTareasDeLaFranja(tareas) {
  const frag = document.createDocumentFragment();

  for (const t of tareas.slice(0, TAREAS_EN_LA_FRANJA)) {
    const nodo = TPL_TAREA.content.cloneNode(true);
    const li = nodo.querySelector(".tarea-hoy");
    li.dataset.tono = t.tono;

    const rotulo = nodo.querySelector(".tarea-hoy__rotulo");
    if (t.rotulo) {
      rotulo.hidden = false;
      rotulo.textContent = t.rotulo;
    } else {
      rotulo.remove();
    }

    /* El enlace es un <a> con href al id de la ficha, no un botón con JS: lo que
       navega es un enlace. Y así funciona con el JS a medio cargar, con el botón
       central del ratón y copiando la dirección. */
    const enlace = nodo.querySelector(".tarea-hoy__planta");
    enlace.href = `#${t.planta.id}`;
    nodo.querySelector(".tarea-hoy__nombre").textContent = t.planta.nombre_comun;

    nodo.querySelector(".tarea-hoy__titulo").textContent = t.tarea.titulo;
    // El «cuándo» ya viene redactado y ya viene honesto de tareas.js.
    nodo.querySelector(".tarea-hoy__cuando").textContent = t.cuando ?? "";

    frag.append(nodo);
  }
  el.parteTareas.replaceChildren(frag);

  const resto = tareas.length - TAREAS_EN_LA_FRANJA;
  if (resto > 0) {
    el.parteResto.hidden = false;
    // «cada una en su ficha», porque la ficha es donde se hacen.
    el.parteResto.textContent =
      `y ${resto} ${plural(resto, "más", "más")}, ${plural(resto, "en su ficha", "cada una en su ficha")}.`;
  } else {
    el.parteResto.hidden = true;
    el.parteResto.textContent = "";
  }
}

/* ── facetas ────────────────────────────────────────────────────────────────── */

/** Las facetas y sus valores salen de los datos, no de una lista escrita a mano. */
function montarFacetas(plantas) {
  const frag = document.createDocumentFragment();

  for (const dim of facetas(plantas)) {
    const nodo = TPL_FACETA.content.cloneNode(true);
    nodo.querySelector(".faceta").dataset.dimension = dim.id;
    nodo.querySelector(".faceta__legend").textContent = dim.legend;

    const opciones = nodo.querySelector(".faceta__opciones");
    for (const { valor, cuenta } of dim.opciones) {
      opciones.append(opcionDe(dim, valor, cuenta));
    }
    frag.append(nodo);
  }

  el.facetas.replaceChildren(frag);
}

function opcionDe(dim, valor, cuenta) {
  const nodo = TPL_OPCION.content.cloneNode(true);
  const id = `f-${dim.id}-${slugOpcion(valor)}`;

  const input = nodo.querySelector(".opcion__input");
  input.id = id;
  input.name = dim.id;
  input.value = valor;
  input.dataset.dimension = dim.id;

  nodo.querySelector(".opcion__label").setAttribute("for", id);
  nodo.querySelector(".opcion__texto").textContent = humanizar(valor);
  // El recuento es aria-hidden: la región live ya anuncia el total al filtrar.
  nodo.querySelector(".opcion__cuenta").textContent = String(cuenta);
  nodo.querySelector(".opcion").dataset.valor = valor;
  return nodo;
}

const slugOpcion = (v) =>
  String(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ── eventos ────────────────────────────────────────────────────────────────── */

function conectarEventos(estado) {
  // Son <form>, así que Enter intentaría enviarlos y recargar la página.
  for (const form of [el.formBusqueda, el.formFiltros]) {
    form.addEventListener("submit", (ev) => ev.preventDefault());
  }

  const buscar = debounce((valor) => estado.actualizar({ busqueda: valor }));
  el.busqueda.addEventListener("input", (ev) => buscar(ev.target.value));

  // Escape vacía la búsqueda sin sacar el foco del campo.
  el.busqueda.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape" || el.busqueda.value === "") return;
    ev.preventDefault();
    el.busqueda.value = "";
    estado.actualizar({ busqueda: "" });
  });

  // Delegación: un listener para todas las casillas, sobreviva el re-render o no.
  el.facetas.addEventListener("change", (ev) => {
    const input = ev.target.closest(".opcion__input");
    if (!input) return;
    const filtros = clonarFiltros(estado.valor.filtros);
    const activos = filtros[input.dataset.dimension];
    if (input.checked) activos.add(input.value);
    else activos.delete(input.value);
    estado.actualizar({ filtros });
  });

  el.limpiar.addEventListener("click", () => {
    el.formFiltros.reset();
    el.busqueda.value = "";
    estado.actualizar({ busqueda: "", filtros: filtrosVacios() });
    el.busqueda.focus();
  });

  // Los chips del parte del día llevan a la ficha y la abren ya despegada.
  el.parteChips.addEventListener("click", (ev) => {
    const boton = ev.target.closest(".chip__boton");
    if (boton) irAFicha(boton.dataset.planta, estado);
  });

  /* Las tareas de la franja son <a href="#id">, así que sin JS ya llevan a la
     ficha correcta: esto solo añade abrirla despegada, que es lo que quieres si
     has pulsado una tarea. Se respetan los modificadores del teclado y el botón
     del medio — si alguien pide abrir en otra pestaña, no se le secuestra. */
  // Los siete marcadores de la cronología llevan a su ficha, igual que los chips.
  el.cronologia?.addEventListener("click", (ev) => {
    const boton = ev.target.closest(".cronologia__marca");
    if (boton) irAFicha(boton.dataset.planta, estado);
  });

  el.parteTareas.addEventListener("click", (ev) => {
    if (ev.defaultPrevented || ev.button !== 0) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    const enlace = ev.target.closest(".tarea-hoy__planta");
    if (!enlace) return;
    ev.preventDefault();
    irAFicha(decodeURIComponent(enlace.hash.slice(1)), estado);
  });

  /* Al abrir una ficha la rejilla colapsa a una columna, así que la ficha que
     acabas de tocar cambia de sitio bajo el cursor. Esto no reimplementa nada
     nativo: corrige un desplazamiento que provoca nuestro propio cambio de
     layout, que es otra cosa. */
  el.rejilla.addEventListener("toggle", (ev) => {
    const detalle = ev.target;
    if (!detalle.matches?.(".despegue") || !detalle.open) return;
    detalle.querySelector(".despegue__tirador")?.scrollIntoView({
      block: "start",
      behavior: prefiereMenosMovimiento() ? "auto" : "smooth",
    });
  }, true);  // en captura: `toggle` no burbujea
}

/**
 * Llevar a una ficha concreta. Si estaba filtrada fuera, primero se quitan los
 * filtros: es peor que el botón no haga nada visible que perder el filtro.
 */
function irAFicha(id, estado) {
  if (!el.rejilla.querySelector(`#${CSS.escape(id)}`)) {
    el.formFiltros.reset();
    el.busqueda.value = "";
    estado.actualizar({ busqueda: "", filtros: filtrosVacios() });
  }

  const ficha = el.rejilla.querySelector(`#${CSS.escape(id)}`);
  if (!ficha) return;

  const despegue = ficha.querySelector(".despegue");
  if (despegue) despegue.open = true;

  ficha.scrollIntoView({ block: "start", behavior: prefiereMenosMovimiento() ? "auto" : "smooth" });

  // El foco va al tirador, que es lo interactivo: así Tab sigue desde ahí y no
  // desde el principio de la página.
  const tirador = ficha.querySelector(".despegue__tirador");
  if (tirador) tirador.focus({ preventScroll: true });
}

const prefiereMenosMovimiento = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Copia con Sets nuevos: el estado no se muta, se sustituye. */
function clonarFiltros(filtros) {
  return Object.fromEntries(
    Object.entries(filtros).map(([k, v]) => [k, new Set(v)])
  );
}
