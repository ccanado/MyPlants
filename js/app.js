/**
 * Punto de entrada. Orquesta y nada más: carga los datos, monta los controles,
 * conecta los eventos. La lógica vive en los módulos.
 */

import { cargarPlantas, ordenarPorUrgencia } from "./datos.js";
import { fijarHoy, fijarMeta, grupoSeveridad, renderLista } from "./ficha.js";
import { crearEstado, debounce } from "./estado.js";
import { facetas, filtrar, filtrosVacios, hayFiltros, humanizar } from "./filtros.js";
import { conCifras, diaDeHoy, fechaLarga, tareasDeHoyPorPlanta, ventanasDeTemporada } from "./tareas.js";
import { montarCronologia } from "./cronologia.js";

const el = {
  grupoMirada: document.getElementById("grupo-mirada"),
  grupoBien: document.getElementById("grupo-bien"),
  rejillaMirada: document.getElementById("rejilla-mirada"),
  rejillaBien: document.getElementById("rejilla-bien"),
  contenido: document.getElementById("plantas"),
  facetas: document.getElementById("facetas"),
  busqueda: document.getElementById("busqueda"),
  resultado: document.getElementById("resultado"),
  aviso: document.getElementById("aviso"),
  limpiar: document.getElementById("limpiar"),
  formFiltros: document.querySelector(".filtros__form"),
  formBusqueda: document.querySelector(".buscador"),
  parte: document.getElementById("parte"),
  parteFecha: document.getElementById("parte-fecha"),
  parteVeredicto: document.getElementById("parte-veredicto"),
  parteResumen: document.getElementById("parte-resumen"),
  parteTareas: document.getElementById("parte-tareas"),
  parteChips: document.getElementById("parte-chips"),
  cabeceraMeta: document.getElementById("cabecera-meta"),
  pieCuenta: document.getElementById("pie-cuenta"),
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
  let meta;
  try {
    const datos = await cargarPlantas();
    meta = datos.meta;
    fijarMeta(meta);
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

  montarCabecera(plantas, meta);
  montarParteDelDia(plantas);
  /* La cronología es un censo de TODAS, así que se monta con la lista completa
     y no se refiltra: un censo que se recorta con el buscador deja de ser un
     censo, y el dato que da —tres órdenes de magnitud, de dos décadas a un día—
     solo existe estando todas. Desde el 13/08/2026 son diez y ya no todas son
     del mismo salón, así que el eje mide el tiempo en casa y no la habitación. */
  if (!montarCronologia(el.cronologia, plantas, HOY)) el.cronologia?.remove();
  montarFacetas(plantas);
  montarPie(plantas);
  conectarEventos(estado);
  estado.refrescar();
}

/* ── render ─────────────────────────────────────────────────────────────────── */

/**
 * LAS DOS BANDAS: lo que pide mirada primero, lo que está bien después.
 *
 * La separación es el trabajo de la página, y de paso resuelve el problema que
 * llevaba meses en el backlog sin solución: **el día bueno**. Cuando ninguna
 * planta necesite nada, la banda de arriba no aparece pidiendo perdón —
 * desaparece—, y la página dice `ESTÁN BIEN · 10 DE 10` sin inventar urgencia. Ese
 * estado es el que el proyecto existe para producir, y ahora sale por
 * construcción en vez de por un caso especial diseñado a mano.
 *
 * El orden por urgencia se conserva DENTRO de cada banda: el DOM sigue estando
 * ordenado como se lee, así que el orden de foco no se despega del visual.
 */
function pintar(plantas, s) {
  const visibles = filtrar(plantas, s);
  const mirada = visibles.filter((p) => grupoSeveridad(p.estado?.severidad) !== "sana");
  const bien = visibles.filter((p) => grupoSeveridad(p.estado?.severidad) === "sana");

  banda(el.grupoMirada, el.rejillaMirada, mirada, plantas.length, 0);
  // El índice del escalonado sigue contando desde donde lo dejó la banda de
  // arriba: si se reiniciara, las dos bandas entrarían a la vez y el gesto se
  // leería como dos animaciones distintas en vez de una lectura de arriba abajo.
  banda(el.grupoBien, el.rejillaBien, bien, plantas.length, mirada.length);

  el.resultado.textContent = resumenResultados(visibles.length, plantas.length, s);
  el.limpiar.hidden = !hayFiltros(s);
  el.contenido.dataset.vacio = visibles.length === 0 ? "si" : "no";
}

function banda(seccion, lista, plantas, total, desde) {
  if (!seccion || !lista) return;
  if (plantas.length === 0) {
    seccion.hidden = true;
    lista.replaceChildren();
    return;
  }
  seccion.hidden = false;
  renderLista(plantas, lista, desde);
  const cuenta = seccion.querySelector(".grupo__cuenta");
  if (cuenta) cuenta.textContent = `${plantas.length} de ${total}`;
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

/* ── cabecera y pie ─────────────────────────────────────────────────────────── */

/**
 * La bajada de la cabecera dice de cuándo son los diagnósticos, y una web que
 * afirma un estado tiene que decir de qué momento habla.
 *
 * La fecha se calcula de las PLANTAS y no de `meta.fecha_diagnostico`, y el cambio
 * es del 13 de agosto de 2026, cuando entró la segunda tanda de fotos. Hasta ese
 * día las siete fichas eran del mismo día y una fecha única era cierta; con tres
 * plantas fotografiadas el 13 y las siete anteriores sin volver a fotografiar,
 * «visto el 13 de agosto» habría sido falso para siete de las diez. Así que se
 * imprime el RANGO cuando hay más de una fecha, y una sola cuando coinciden.
 *
 * Cada planta aporta la fecha de su diagnóstico vigente, que `js/datos.js` resuelve
 * por `fecha_foto` más alta y no por índice.
 */
function montarCabecera(plantas, meta) {
  if (!el.cabeceraMeta) return;
  const trozos = [`Móstoles · ${plantas.length} macetas`];
  const visto = rangoDeDiagnosticos(plantas) ?? fechaLargaISO(meta?.fecha_diagnostico);
  if (visto) trozos.push(visto);
  el.cabeceraMeta.textContent = trozos.join(" · ");
}

/** «visto el 11 de agosto de 2026» o «visto entre el 11 y el 13 de agosto de 2026». */
function rangoDeDiagnosticos(plantas) {
  const fechas = [...new Set(plantas.map((p) => p.estado?.fecha_foto).filter(Boolean))].sort();
  if (fechas.length === 0) return null;
  const primera = fechaLargaISO(fechas[0]);
  if (!primera) return null;
  if (fechas.length === 1) return `visto el ${primera}`;
  const ultima = fechaLargaISO(fechas[fechas.length - 1]);
  if (!ultima) return `visto el ${primera}`;
  /* «entre el 11 y el 13 de agosto de 2026»: si el mes y el año coinciden, se dicen
     una vez. Repetirlos sería correcto y se leería peor. */
  const soloDia = /^(\d+) de (.+)$/.exec(primera);
  const mismoResto = soloDia && ultima.endsWith(soloDia[2]);
  return mismoResto
    ? `visto entre el ${soloDia[1]} y el ${ultima}`
    : `visto entre el ${primera} y el ${ultima}`;
}

function montarPie(plantas) {
  if (!el.pieCuenta) return;
  const citas = plantas.reduce((n, p) => n + (p.fuentes?.length ?? 0), 0);
  el.pieCuenta.textContent =
    `${plantas.length} plantas, ninguna inventada · ${citas} fuentes citadas`;
}

/** «2026-08-11» → «11 de agosto de 2026», con el formateador del navegador. */
function fechaLargaISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ""));
  if (!m) return null;
  try {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      .toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return null;   // navegador sin datos de locale: mejor sin fecha que con una fea
  }
}

/* ── parte del día ──────────────────────────────────────────────────────────── */

/**
 * La franja `HOY`: qué hay que hacer hoy, con la fecha real del navegador.
 *
 * Los dos ejes conviven porque son independientes y hay que leerlos como tales:
 * la `critica` es el helecho y la `vencida` es la begonia, plantas distintas. Uno
 * dice cómo están; el otro, qué toca.
 */
function montarParteDelDia(plantas) {
  const tocadas = plantas.filter((p) => p.estado && grupoSeveridad(p.estado.severidad) !== "sana");
  const porPlanta = tareasDeHoyPorPlanta(plantas, HOY);
  const ventanas = ventanasDeTemporada(plantas, HOY);
  const cuantas = porPlanta.reduce((n, g) => n + g.tareas.length, 0);

  el.parte.hidden = false;

  const fecha = fechaLarga(HOY.fecha);
  if (fecha) el.parteFecha.textContent = fecha;
  else el.parteFecha.remove();

  /* EL VEREDICTO: la tesis del día, y la forma es fija aunque el contenido
     cambie. El día bueno dice «LAS 7 ESTÁN BIEN» con el mismo tamaño: no se
     encoge y no estrena color. Nada de rachas, porcentajes ni felicitaciones. */
  el.parteVeredicto.replaceChildren(
    tocadas.length === 0
      ? conCifras(`Las ${plantas.length} están bien`)
      : conCifras(`${tocadas.length} de ${plantas.length} ${plural(tocadas.length, "pide", "piden")} mirada`)
  );

  /* Y debajo, en cuerpo pequeño, cuántas cosas hay que hacer. Cero tareas NO es
     «no hay nada que hacer»: es que hoy no hay nada que se pueda afirmar desde el
     calendario. El riego y las condicionadas siguen ahí, en sus fichas, y decir
     lo contrario sería el error que esta franja existe para no cometer. */
  el.parteResumen.textContent = cuantas > 0
    ? `${cuantas} ${plural(cuantas, "cosa", "cosas")} que hacer hoy`
    : "Nada con fecha para hoy";

  montarTareasDeLaFranja(porPlanta, ventanas);

  /* Las entradas: una por planta tocada, con su severidad EN PALABRA y el
     titular de su diagnóstico. Son enlaces y no botones porque lo que hacen es
     navegar: así funcionan con el JS a medio cargar, con el botón central del
     ratón y copiando la dirección. */
  const frag = document.createDocumentFragment();
  for (const p of tocadas) {
    const nodo = TPL_CHIP.content.cloneNode(true);
    const g = grupoSeveridad(p.estado.severidad);
    const enlace = nodo.querySelector(".chip__enlace");
    enlace.href = `#${p.id}`;
    enlace.dataset.planta = p.id;
    const marca = nodo.querySelector(".marca");
    marca.dataset.severidad = g;
    marca.querySelector(".marca__texto").textContent = humanizar(p.estado.severidad);
    nodo.querySelector(".chip__nombre").textContent = p.nombre_comun;
    const que = nodo.querySelector(".chip__que");
    if (p.estado.titulo_estado) que.textContent = p.estado.titulo_estado;
    else que.remove();
    frag.append(nodo);
  }
  el.parteChips.replaceChildren(frag);
}

/**
 * Una línea por PLANTA, con todo lo que le toca hoy, y sin truncar.
 *
 * Sin tope y sin «y 8 más, cada una en su ficha»: esa línea obligaba a abrir
 * todas las fichas para saber qué escondía, que es justo el trabajo que la
 * página existe para ahorrar. El techo lo pone el dominio —siete plantas, siete
 * renglones como máximo—, no un número elegido por nosotros.
 */
function montarTareasDeLaFranja(porPlanta, ventanas) {
  const frag = document.createDocumentFragment();

  for (const { planta, tareas } of porPlanta) {
    const nodo = TPL_TAREA.content.cloneNode(true);
    const li = nodo.querySelector(".tarea-hoy");
    // El tono de la línea es el de su tarea más urgente, que viene primera.
    li.dataset.tono = tareas[0].tono;

    /* El rótulo es el de la más urgente y va uno por línea, no uno por tarea:
       tres «HOY» en el mismo renglón no informan tres veces. Sin rótulo se queda
       VACÍO y no `hidden`: es un hijo de `subgrid` y `hidden` lo saca de la
       rejilla, con lo que la fila pierde su primera celda y todo se corre una
       columna. Vacío ocupa su sitio y el CSS le quita el marco. */
    const rotulo = nodo.querySelector(".tarea-hoy__rotulo");
    if (tareas[0].rotulo) rotulo.textContent = tareas[0].rotulo;

    /* El enlace es un <a> con href al id de la ficha, no un botón con JS: lo que
       navega es un enlace. */
    const enlace = nodo.querySelector(".tarea-hoy__planta");
    enlace.href = `#${planta.id}`;
    nodo.querySelector(".tarea-hoy__nombre").textContent = planta.nombre_comun;

    const cosas = nodo.querySelector(".tarea-hoy__cosas");
    for (const t of tareas) {
      const item = document.createElement("li");
      item.className = "tarea-hoy__cosa";
      /* Los `data-*` no son lógica ni estilo: son la forma de que el test pueda
         AFIRMAR en vez de abstenerse, y lo que queda sin verificar sin ellos es
         justo la guarda del abonado del helecho — la única capaz de matar una
         planta. */
      if (t.tarea.id) item.dataset.tarea = t.tarea.id;
      item.dataset.planta = planta.id;
      if (t.estado) item.dataset.tareaEstado = t.estado;

      const titulo = document.createElement("span");
      titulo.className = "tarea-hoy__titulo";
      titulo.textContent = t.tarea.titulo;
      item.append(titulo);

      /* El «cuándo» solo se pinta si dice algo que el rótulo de la línea no
         dice — «hace 57 días» sí, «Hoy» detrás de un rótulo `HOY` no. */
      if (t.cuando) {
        const cuando = document.createElement("span");
        cuando.className = "tarea-hoy__cuando";
        // Las cifras en su propia voz: el «57» de «hace 57 días» es un dato.
        cuando.append(conCifras(t.cuando));
        item.append(cuando);
      }
      cosas.append(item);
    }

    frag.append(nodo);
  }

  /* LA VENTANA DE TEMPORADA, una sola línea al pie y agrupada POR TAREA.
     Los cinco «Abonar» eran el 50 % de la lista para algo que se puede hacer
     cualquier día de agosto, y cinco líneas idénticas diluían lo urgente. Aquí lo
     compartido es la faena y el mes, no la planta: se saca el abono una vez y se
     pasa por las cinco. */
  for (const v of ventanas) {
    const li = document.createElement("li");
    li.className = "tarea-hoy tarea-hoy--temporada";
    li.dataset.tono = "plazo";
    li.dataset.tareaEstado = "temporada";

    const rotulo = document.createElement("span");
    rotulo.className = "tarea-hoy__rotulo";
    rotulo.textContent = "Este mes";
    li.append(rotulo);

    const titulo = document.createElement("span");
    titulo.className = "tarea-hoy__faena";
    titulo.textContent = v.titulo;
    li.append(titulo);

    /* Las plantas se nombran, no se cuentan: «5 plantas» obligaría a abrir cinco
       fichas para saber cuáles, que es el problema que acabamos de quitar. */
    const cuales = document.createElement("ul");
    cuales.className = "tarea-hoy__cosas";
    for (const p of v.plantas) {
      const item = document.createElement("li");
      item.className = "tarea-hoy__cosa";
      item.dataset.planta = p.id;
      item.dataset.tareaEstado = "temporada";
      const enlace = document.createElement("a");
      enlace.className = "tarea-hoy__planta";
      enlace.href = `#${p.id}`;
      enlace.textContent = p.nombre_comun;
      item.append(enlace);
      cuales.append(item);
    }
    li.append(cuales);
    frag.append(li);
  }

  el.parteTareas.replaceChildren(frag);
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

  /* Las entradas del parte, las tareas de la franja y los marcadores de la
     cronología llevan todos a una ficha. Son enlaces de verdad, así que sin JS ya
     funcionan: esto solo añade abrirla desplegada, que es lo que quieres si has
     pulsado una tarea. Se respetan los modificadores del teclado y el botón del
     medio — si alguien pide abrir en otra pestaña, no se le secuestra. */
  for (const zona of [el.parteChips, el.parteTareas]) {
    zona.addEventListener("click", (ev) => {
      if (ev.defaultPrevented || ev.button !== 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const enlace = ev.target.closest("a[href^='#']");
      if (!enlace) return;
      ev.preventDefault();
      irAFicha(decodeURIComponent(enlace.hash.slice(1)), estado);
    });
  }

  el.cronologia?.addEventListener("click", (ev) => {
    const boton = ev.target.closest(".cronologia__marca");
    if (boton) irAFicha(boton.dataset.planta, estado);
  });

  /* Al abrir una ficha la rejilla colapsa a una columna, así que la ficha que
     acabas de tocar cambia de sitio bajo el cursor. Esto no reimplementa nada
     nativo: corrige un desplazamiento que provoca nuestro propio cambio de
     layout, que es otra cosa. */
  el.contenido.addEventListener("toggle", (ev) => {
    const detalle = ev.target;
    if (!detalle.matches?.(".despegue") || !detalle.open) return;
    detalle.querySelector(".planta__cara")?.scrollIntoView({
      block: "start",
      behavior: prefiereMenosMovimiento() ? "auto" : "smooth",
    });
  }, true);  // en captura: `toggle` no burbujea

  // Un enlace a #poto desde fuera (o un recargado con hash) abre esa ficha.
  addEventListener("hashchange", () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) irAFicha(id, estado);
  });
}

/**
 * Llevar a una ficha concreta. Si estaba filtrada fuera, primero se quitan los
 * filtros: es peor que el enlace no haga nada visible que perder el filtro.
 */
function irAFicha(id, estado) {
  if (!buscarFicha(id)) {
    el.formFiltros.reset();
    el.busqueda.value = "";
    estado.actualizar({ busqueda: "", filtros: filtrosVacios() });
  }

  const ficha = buscarFicha(id);
  if (!ficha) return;

  const despegue = ficha.querySelector(".despegue");
  if (despegue) despegue.open = true;

  ficha.scrollIntoView({ block: "start", behavior: prefiereMenosMovimiento() ? "auto" : "smooth" });

  // El foco va a la cara, que es lo interactivo: así Tab sigue desde ahí y no
  // desde el principio de la página.
  const cara = ficha.querySelector(".planta__cara");
  if (cara) cara.focus({ preventScroll: true });
}

/** La ficha puede estar en cualquiera de las dos bandas. */
function buscarFicha(id) {
  if (!id) return null;
  return el.contenido.querySelector(`.planta#${CSS.escape(id)}`);
}

const prefiereMenosMovimiento = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Copia con Sets nuevos: el estado no se muta, se sustituye. */
function clonarFiltros(filtros) {
  return Object.fromEntries(
    Object.entries(filtros).map(([k, v]) => [k, new Set(v)])
  );
}
