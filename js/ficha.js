/**
 * Render de una planta: datos entran, nodo sale.
 *
 * El markup vive en los <template> de index.html. Aquí solo se clona y se rellena
 * con textContent — nunca innerHTML, ni siquiera con datos propios.
 *
 * La tarjeta se abre con <details> nativo: ni una línea de JS en abrir y cerrar,
 * así que el foco, Enter/Espacio y el comportamiento de teclado son los del
 * navegador y no una imitación.
 *
 * Las tres capas del contenido se marcan en el DOM para que el CSS las distinga:
 * el dato verificado, el estado de la planta y la voz de la casa no son lo mismo
 * y no pueden parecerlo.
 *
 * ── Qué cambió con la piel oscura del 12 de agosto de 2026 ──────────────────
 * La cara de la tarjeta era la pegatina térmica del vivero y ahora es la FOTO de
 * la planta más sus datos. La pegatina no se ha perdido: se reconstruye dentro
 * del expediente, en el bloque `LA PRUEBA`, junto a la fotografía de la etiqueta
 * real — que es donde la etiqueta está de verdad, pegada al tiesto. Lo mismo con
 * la silueta de hoja, que baja al bloque de identificación porque ya no es el
 * único modo de distinguir una ficha de otra.
 */

import { FOTO, FOTO_ETIQUETA, RUTA_REJILLA, slug } from "./datos.js";
import { humanizar, normalizar } from "./filtros.js";
import { iconoDe, iconoDificultad } from "./iconos.js";
import { lecturaDe, siluetaDe } from "./siluetas.js";
import { conCifras, diaDeHoy, tareasDePlanta } from "./tareas.js";
import { diagramaLuz, diagramaRiego, diagramaTemperatura } from "./svg.js";

const tpl = (id) => document.getElementById(id);
const TPL_FICHA = tpl("tpl-ficha");
const TPL_CAMPO = tpl("tpl-campo-diagrama");
const TPL_DATO = tpl("tpl-dato");
const TPL_TAREA = tpl("tpl-tarea-ficha");
const TPL_PASTILLA = tpl("tpl-pastilla");

/**
 * El «hoy» con el que se calculan los plazos de la ficha. Lo fija `app.js` con
 * el mismo valor que usa la franja: dos partes de la misma pantalla no pueden
 * discrepar sobre qué día es. Si nadie lo fija, se calcula aquí — así el módulo
 * sigue funcionando solo, pero el camino normal es el compartido.
 */
let HOY = diaDeHoy();
export function fijarHoy(hoy) { if (hoy) HOY = hoy; }

const SIN_DATO = "Sin dato";

/** Campos con diagrama en la columna de acción. El orden es el de las preguntas
 *  que se hace alguien con una regadera en la mano, no el alfabético. */
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

/** La palabra que acompaña siempre al color. Ninguna información va solo por
 *  color: el punto es redundancia del texto, no al revés. */
const PALABRA_SEVERIDAD = new Map([
  ["critica", "Crítica"],
  ["atencion", "Atención"],
  ["sana", "Sana"],
]);

/**
 * Toxicidad: tres estados y ninguno verde. No hay ni una planta con «no tóxica»
 * confirmada, así que un icono verde mentiría en cinco fichas. Y «sin datos en
 * ASPCA» no es «segura»: es que nadie lo ha mirado.
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

export function fichaDe(planta, indice = 0) {
  const nodo = TPL_FICHA.content.cloneNode(true);
  const q = (sel) => nodo.querySelector(sel);

  const idTitulo = `n-${planta.id}`;
  const idAbrir = `abrir-${planta.id}`;
  const grupo = grupoSeveridad(planta.estado?.severidad);

  const celda = nodo.querySelector(".rejilla__celda");
  // El escalonado de entrada va sobre la TARJETA y no sobre la carga de la
  // imagen: con `loading=lazy` el gesto se rompería distinto en cada visita.
  celda.style.setProperty("--i", String(indice));
  celda.dataset.severidad = grupo;

  const articulo = q(".planta");
  articulo.id = planta.id;
  articulo.setAttribute("aria-labelledby", idTitulo);
  articulo.dataset.planta = planta.id;
  articulo.dataset.severidad = grupo;
  articulo.dataset.etiquetaVivero = planta.vivero.tiene ? "si" : "no";

  caraDeLaTarjeta(q, planta, grupo, idTitulo, idAbrir);
  bloqueEstado(q, planta);
  bloqueFoto(q, planta);
  bloqueProcedencia(q, planta);
  bloqueIdentificacion(q, planta);
  /* Qué fuentes se han pintado ya junto a su campo, para que el bloque de abajo
     recoja EXACTAMENTE el resto y ninguna se quede fuera de la pantalla. Se crea
     por render, no por planta: la rejilla se repinta al filtrar. */
  const citadas = new Set();
  camposConDiagrama(q, planta, citadas);
  bloqueCalendario(q, planta);
  bloqueMasDatos(q, planta, citadas);
  bloqueCasa(q, planta);
  // El índice va al final: cuenta lo que los demás han dejado en el DOM, así que
  // no puede adelantarse a ellos. Cuenta nodos pintados, no campos del JSON —
  // un recuento que no cuadre con lo que hay debajo es peor que no ponerlo.
  indiceDelExpediente(q, planta);

  return nodo;
}

/* ── la cara de la tarjeta ──────────────────────────────────────────────────── */

/** El vivero sale de `meta`, no de una constante: la begonia no es de Projardín
 *  y la pegatina tiene que decir la verdad de cada planta. */
let META = {};
export function fijarMeta(meta) { META = meta ?? {}; }

function caraDeLaTarjeta(q, planta, grupo, idTitulo, idAbrir) {
  /* EL NOMBRE ACCESIBLE DEL SUMMARY SE FIJA A MANO, y no es un capricho.
     Toda la cara es el `<summary>` —la tarjeta entera es la diana—, así que el
     nombre calculado del contenido serían cuarenta palabras: severidad, familia,
     nombre, binomio, titular del diagnóstico y cinco pastillas de datos, por
     cada una de las siete. Con `aria-labelledby` el botón se llama «Poto ·
     abrir la ficha» y el resto sigue siendo contenido, legible en modo lectura. */
  const cara = q(".planta__cara");
  cara.setAttribute("aria-labelledby", `${idTitulo} ${idAbrir}`);

  // La foto de la rejilla: el MISMO encuadre que la de la ficha, más pequeño.
  // Sin ningún filtro. Si no hay foto, la tarjeta se queda sin ventana en vez de
  // enseñar un hueco gris con aspecto de error.
  const foto = q(".planta__foto");
  if (planta.foto_rejilla) {
    const img = q(".planta__img");
    img.src = planta.foto_rejilla;
    img.alt = planta.foto_alt || "";
  } else {
    foto.remove();
  }

  marcaDeSeveridad(q(".planta__cara .marca"), grupo);

  const familia = q(".planta__familia");
  if (planta.familia) familia.textContent = planta.familia;
  else familia.remove();

  const titulo = q(".planta__nombre");
  titulo.id = idTitulo;
  /* El nombre grande existe para encontrar la planta de un vistazo, y el estado
     de identificación no ayuda a encontrarla: baja al renglón del binomio, que
     es el que existe para decir qué es. */
  titulo.textContent = planta.nombre_comun.replace(/\s*\((sin identificar|sin determinar)\)\s*$/i, "");

  const binomio = q(".planta__binomio");
  if (planta.nombre_cientifico) {
    q(".planta__binomio-texto").textContent = planta.nombre_cientifico;
  } else {
    binomio.dataset.sinIdentificar = "si";
    q(".planta__binomio-texto").textContent = "Especie sin identificar";
  }

  /* El titular del diagnóstico en la cara: es lo que convierte la rejilla en un
     parte y no en un catálogo. En las sanas también lo hay —qué vigilar—, y por
     eso no se esconde en las cuatro que están bien. */
  const titular = q(".planta__titular");
  if (planta.estado?.titulo_estado) titular.textContent = planta.estado.titulo_estado;
  else titular.remove();

  pastillasDeCara(q, planta);

  q(".planta__abrir-texto").textContent = "Abrir la ficha";
  q(".planta__abrir-texto").id = idAbrir;
}

/** La marca de severidad: punto de color + PALABRA. Nunca una sin la otra. */
function marcaDeSeveridad(nodo, grupo) {
  if (!nodo) return;
  nodo.dataset.severidad = grupo;
  nodo.querySelector(".marca__texto").textContent = PALABRA_SEVERIDAD.get(grupo) ?? humanizar(grupo);
}

/**
 * Las pastillas de la cara: las cifras con las que se llega con la regadera.
 *
 * Van en monoespaciada porque son cifras, que es la voz mecánica del proyecto —
 * la de báscula de vivero—, y llevan su rótulo al lado: «4 d» sin «riego verano»
 * no es un dato, es un número suelto.
 *
 * Ojo con lo que NO está aquí: la frase entera del riego («…y saca la maceta del
 * cachepot») vive en el expediente, a un clic. La pastilla da el intervalo y el
 * volumen, que es lo que se pregunta de pie delante de la planta.
 */
function pastillasDeCara(q, planta) {
  const lista = q(".planta__datos");
  const r = planta.medidas.riego;
  const t = planta.medidas.temperatura;

  const filas = [
    [r.dias_verano != null ? `${r.dias_verano} d` : null, "riego verano"],
    [r.ml != null ? `${r.ml} ml` : null, "por riego"],
    [planta.nivel_luz ? humanizar(planta.nivel_luz).toLowerCase() : null, "luz"],
    [rangoCorto(t), "temp"],
    [planta.dificultad ? humanizar(planta.dificultad).toLowerCase() : null, "nivel"],
  ];

  let puestas = 0;
  for (const [valor, clave] of filas) {
    if (valor == null || valor === "") continue;
    const nodo = TPL_PASTILLA.content.cloneNode(true);
    nodo.querySelector(".pastilla__valor").textContent = valor;
    nodo.querySelector(".pastilla__clave").textContent = clave;
    lista.append(nodo);
    puestas += 1;
  }
  if (puestas === 0) lista.remove();
}

/** «10–28 °C», «≥ 10 °C» si no hay máximo publicado. El hueco se dice con la
 *  misma gramática que el eje térmico: abierto por el lado que no se sabe. */
function rangoCorto(t) {
  if (!t) return null;
  const min = t.min_tolerado, max = t.max_tolerado;
  if (min != null && max != null) return `${min}–${max} °C`;
  if (min != null) return `≥ ${min} °C`;
  if (max != null) return `≤ ${max} °C`;
  return null;
}

/* ── capa 1 · estado ────────────────────────────────────────────────────────── */

function bloqueEstado(q, planta) {
  const seccion = q(".estado");
  const estado = planta.estado;
  if (!estado) {
    seccion.remove();
    q(".estado__tratamiento")?.remove();
    return;
  }

  const g = grupoSeveridad(estado.severidad);
  seccion.hidden = false;
  seccion.dataset.severidad = g;

  /* Las cuatro sanas también tienen estado poblado: preventivo, plazo y qué
     mirar. «Qué le pasa» sobre una planta sana sería un titular equivocado. */
  q(".estado__titulo").textContent = g === "sana" ? "Qué vigilar" : "Qué le pasa";

  marcaDeSeveridad(q(".estado__severidad"), g);

  const fecha = q(".estado__fecha");
  if (estado.fecha_foto) fecha.textContent = `Visto el ${fechaLegible(estado.fecha_foto)}`;
  else fecha.remove();

  const cabecera = q(".estado__cabecera");
  if (estado.titulo_estado) cabecera.textContent = estado.titulo_estado;
  else cabecera.remove();

  listaEn(seccion, ".estado__bloque--senales", estado.senales);
  bloqueCausas(seccion, estado.causas, g);
  listaEn(seccion, ".estado__bloque--limites", estado.no_visible);

  const tratamiento = q(".estado__tratamiento");
  if (estado.pasos.length === 0) {
    tratamiento.remove();
    return;
  }
  tratamiento.hidden = false;

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
}

/* ── el calendario de la planta ──────────────────────────────────────────────── */

/**
 * Las tareas de esta planta, todas, cada una dicha con las palabras que su tipo
 * permite. En la franja solo entran las que se pueden afirmar hoy; aquí entran
 * las cinco clases, porque la ficha es donde se hacen y donde caben los matices:
 *
 *   - El riego lleva su **comprobación**, no una fecha, y dice `sin registrar`
 *     en el hueco donde iría la última vez. La ausencia se dice como ausencia.
 *   - Las condicionadas llevan la **condición delante**, en forma de
 *     comprobación, y nunca «toca este mes».
 */
function bloqueCalendario(q, planta) {
  const seccion = q(".calendario");
  if (!seccion) return;
  const tareas = tareasDePlanta(planta, HOY);
  if (tareas.length === 0) {
    seccion.remove();
    return;
  }
  seccion.hidden = false;
  const lista = seccion.querySelector(".calendario__lista");

  for (const t of tareas) {
    const nodo = TPL_TAREA.content.cloneNode(true);
    const li = nodo.querySelector(".tarea");
    li.dataset.tono = t.tono;
    if (t.tarea.tipo) li.dataset.tipo = t.tarea.tipo;
    /* Los `data-*` no son lógica ni estilo: son la forma de que el test pueda
       AFIRMAR en vez de abstenerse, y lo que queda sin verificar sin ellos es
       justo la guarda del abonado del helecho — la única capaz de matar una
       planta. */
    if (t.tarea.id) li.dataset.tarea = t.tarea.id;
    li.dataset.planta = planta.id;
    if (t.estado) li.dataset.tareaEstado = t.estado;

    const rotulo = nodo.querySelector(".tarea__rotulo");
    if (t.rotulo) {
      rotulo.hidden = false;
      rotulo.textContent = t.rotulo;
    } else {
      rotulo.remove();
    }

    nodo.querySelector(".tarea__titulo").textContent = t.tarea.titulo;

    const cuando = nodo.querySelector(".tarea__cuando");
    const trozos = [t.cuando];
    /* «Última vez: sin registrar». No es un hueco que tapar: es el dato que
       impide convertir el ritmo en un vencimiento, y por tanto la razón de que
       aquí no haya una cuenta atrás. */
    if (t.sinRegistro && !t.tarea.ultimo) trozos.push("última vez: sin registrar");
    if (trozos.filter(Boolean).length > 0) {
      cuando.append(conCifras(trozos.filter(Boolean).join(" · ")));
      if (t.sinRegistro && !t.tarea.ultimo) cuando.classList.add("tarea__cuando--sin-dato");
    } else {
      cuando.remove();
    }

    const nota = nodo.querySelector(".tarea__nota");
    if (t.nota) {
      nota.hidden = false;
      /* El rótulo distingue las dos cosas que pueden ocupar esta línea, y no son
         lo mismo: una condición es un requisito que hay que cumplir antes, y una
         comprobación es algo que hay que mirar. */
      nodo.querySelector(".tarea__nota-rotulo").textContent =
        t.tarea.tipo === "ritmo" ? "Comprobar" : "Solo si";
      nodo.querySelector(".tarea__nota-texto").textContent = t.nota;
    } else {
      nota.remove();
    }

    lista.append(nodo);
  }
}

/* ── el índice del expediente ───────────────────────────────────────────────── */

/**
 * El índice con recuento de la columna de acción.
 *
 *  1. **No está para esconder, está para entrar.** Nada se pliega detrás de él.
 *  2. **El recuento se cuenta del DOM, no del JSON.** «Lo que se ve · 13» es una
 *     afirmación sobre lo que hay debajo; contándolo del JSON bastaría con que un
 *     `filter()` del render descartara un elemento para que el número mintiera.
 *
 * Y si una sección no existe en esta planta, no sale del índice con un 0: sale
 * fuera. Un índice de siete líneas con cuatro ceros no informa, decora.
 */
const SECCIONES_INDICE = [
  { rotulo: "Lo que se ve", bloque: ".estado__bloque--senales", item: ".estado__item" },
  { rotulo: "Causas probables", bloque: ".estado__bloque--causas", item: ".estado__item" },
  { rotulo: "Lo que la foto no dice", bloque: ".estado__bloque--limites", item: ".estado__item" },
  /* Las fuentes van repartidas por campo a propósito —son contenido, no letra
     pequeña—, así que no hay un bloque «Fuentes» al que apuntar. Se cuentan las
     citas realmente pintadas en TODA la ficha y se entra por «Más datos». */
  { rotulo: "Fuentes", bloque: ".mas-datos", item: ".fuente", enToda: true },
];

function indiceDelExpediente(q, planta) {
  const indice = q(".indice");
  if (!indice) return;
  const lista = indice.querySelector(".indice__lista");
  const raiz = q(".expediente");
  if (!lista || !raiz) return;

  let puestas = 0;

  for (const seccion of SECCIONES_INDICE) {
    const bloque = raiz.querySelector(seccion.bloque);
    if (!bloque) continue;

    const donde = seccion.enToda ? raiz : bloque;
    const cuenta = donde.querySelectorAll(seccion.item).length;
    if (cuenta === 0) continue;

    // El ancla se pone aquí y no en la plantilla: hay siete fichas en la página
    // y un id repetido hace que los siete enlaces salten a la primera.
    const id = `${planta.id}-${slug(seccion.rotulo)}`;
    bloque.id = id;

    const li = document.createElement("li");
    li.className = "indice__item";

    const a = document.createElement("a");
    a.className = "indice__enlace";
    a.href = `#${id}`;

    const texto = document.createElement("span");
    texto.className = "indice__texto";
    texto.textContent = seccion.rotulo;

    /* El número va en su propio elemento y NO es aria-hidden: «13» es la mitad
       del mensaje —dice que el diagnóstico está trabajado antes de leerlo— y
       ocultárselo a un lector de pantalla sería quitarle justo el dato. */
    const num = document.createElement("span");
    num.className = "indice__cuenta";
    num.textContent = String(cuenta);

    a.append(texto, num);
    li.append(a);
    lista.append(li);
    puestas += 1;
  }

  if (puestas === 0) {
    indice.remove();
    return;
  }
  indice.hidden = false;

  /* Siete índices en la misma página son siete <nav>, y un <nav> sin nombre
     entre varios no se distingue de sus hermanos: un lector de pantalla que
     liste las regiones oiría «navegación» siete veces. */
  indice.setAttribute("aria-label", `En el expediente de ${planta.nombre_comun}`);
}

/**
 * EL RÓTULO DEL `patron` VARÍA POR `tipo`, y no es cosmético.
 *
 * Con `tipo` puesto hay `patron` en afirmaciones, y ahí «patrón para
 * reconocerla» no significa nada: lo que dice el texto es **qué desmentiría** la
 * afirmación. Un rótulo por clase, no un rótulo por bloque.
 */
const ROTULO_PATRON = new Map([
  ["causa", "Patrón para reconocerla"],
  ["riesgo", "Señal de que está pasando"],
  ["afirmacion", "Qué lo desmentiría"],
]);

/**
 * Qué se pliega, por clase: **no se pliegan ni las afirmaciones ni los límites
 * de lo que sabemos; el razonamiento sí puede.** Una `mejora` es una propuesta,
 * no una afirmación sobre un problema, así que puede ir plegada.
 */
const SE_PLIEGA_ENTERA = new Set(["mejora"]);

/**
 * El rótulo del bloque no adivina de qué clase es su contenido: solo dice de qué
 * va el bloque, y la clase la dice cada ítem. `CAUSAS PROBABLES` sobre una planta
 * sana le pide la causa de un problema que no tiene.
 */
function rotuloDeCausas(grupo) {
  return grupo === "sana" ? "Lo que hay que saber" : "Causas probables";
}

function bloqueCausas(raiz, causas, grupo) {
  const bloque = raiz.querySelector(".estado__bloque--causas");
  if (!bloque) return;
  if (!causas || causas.length === 0) {
    bloque.remove();
    return;
  }
  bloque.hidden = false;
  const sub = bloque.querySelector(".estado__sub");
  if (sub) sub.textContent = rotuloDeCausas(grupo);
  const ul = bloque.querySelector(".estado__lista");

  for (const causa of causas) {
    const li = document.createElement("li");
    li.className = "estado__item causa";
    if (causa.id) li.dataset.causa = causa.id;
    // La clase va al DOM para que el CSS pueda distinguirlas sin adivinar.
    li.dataset.tipo = causa.tipo ?? "causa";

    const rotulo = document.createElement("span");
    rotulo.className = "causa__clase";
    rotulo.textContent = nombreDeClase(causa.tipo ?? "causa");
    li.append(rotulo);

    const linea = document.createElement("p");
    linea.className = "causa__resumen";
    linea.textContent = causa.resumen ?? causa.detalle;

    if (causa.detalle && causa.resumen && SE_PLIEGA_ENTERA.has(causa.tipo)) {
      const det = document.createElement("details");
      det.className = "causa__mas causa__mas--entera";
      const sum = document.createElement("summary");
      sum.className = "causa__mas-tirador";
      sum.textContent = causa.resumen;
      const p = document.createElement("p");
      p.className = "causa__detalle";
      p.textContent = causa.detalle;
      det.append(sum, p);
      li.append(det);
    } else {
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
    }

    if (causa.patron) {
      const patron = document.createElement("p");
      patron.className = "causa__patron";
      const rot = document.createElement("span");
      rot.className = "causa__patron-rotulo";
      /* Sin entrada en el mapa no se inventa un rótulo: se pinta el patrón sin
         él. `aclaracion` y `mejora` hoy no traen `patron`. */
      const nombre = ROTULO_PATRON.get(causa.tipo ?? "causa");
      if (nombre) {
        rot.textContent = nombre;
        patron.append(rot);
      }
      const texto = document.createElement("span");
      texto.textContent = causa.patron;
      patron.append(texto);
      li.append(patron);
    }

    ul.append(li);
  }
}

const NOMBRES_CLASE = new Map([
  ["causa", "Causa probable"],
  ["afirmacion", "Afirmación"],
  ["riesgo", "Riesgo"],
  ["mejora", "Mejora"],
  ["aclaracion", "Aclaración"],
]);
const nombreDeClase = (tipo) => NOMBRES_CLASE.get(tipo) ?? "Causa probable";

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

/** «2026-08-11» → «11/08/2026». Sin librerías de fechas para esto. */
function fechaLegible(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/* ── foto ───────────────────────────────────────────────────────────────────── */

function bloqueFoto(q, planta) {
  const figura = q(".foto");
  /* Un diagnóstico describe la imagen sobre la que se hizo. Hoy coinciden, pero
     en cuanto haya fotos nuevas dejarán de hacerlo, y entonces mostrar la foto
     actual junto a un diagnóstico de agosto sería enseñar dos momentos como si
     fueran uno. */
  const fuente = planta.estado?.foto_diagnostico ?? planta.foto;
  if (!fuente) {
    figura.remove();
    return;
  }
  figura.hidden = false;
  const img = q(".foto__img");
  img.src = fuente;
  img.width = FOTO.ancho;
  img.height = FOTO.alto;
  // Sin alt útil, la foto no le aporta nada a un lector de pantalla.
  img.alt = planta.foto_alt || "";

  const fecha = q(".foto__fecha");
  const cuando = planta.estado?.fecha_foto;
  if (cuando) fecha.textContent = `Foto del ${fechaLegible(cuando)}`;
  else fecha.remove();

  /* La limitación de ESTA foto, cuando el contenido la trae. NO se saca
     olfateando la prosa de las señales: buscar «foto» en el texto sería un
     heurístico, que es justo lo que este proyecto no hace. Y no se escribe «sin
     limitaciones conocidas»: eso afirmaría algo que nadie ha comprobado. */
  const limite = q(".foto__limite");
  if (planta.estado?.limitacion_foto) {
    limite.hidden = false;
    limite.textContent = planta.estado.limitacion_foto;
  } else {
    limite.remove();
  }

  const lugar = q(".foto__lugar");
  if (planta.ubicacion) lugar.textContent = planta.ubicacion;
  else lugar.remove();

  if (!q(".foto__pie").hasChildNodes()) q(".foto__pie").remove();
}

/**
 * La procedencia, y aquí vive ahora la pegatina.
 *
 * Para cinco de las siete plantas la pegatina del vivero es la fuente más fuerte
 * que existe de qué compró Carlos: POWO dice qué es una especie, no qué hay en
 * ese tiesto. Se reconstruye en HTML y CSS —el código de barras es un gradiente
 * repetido, cero imágenes— al lado de la fotografía de la etiqueta real.
 *
 * Para las otras dos, la ausencia se dice y **no se decora**: `--trama-sin-dato`
 * significa «no lo sabemos», y que el helecho y el poto no traigan pegatina es un
 * hecho conocido. Son cosas opuestas.
 */
function bloqueProcedencia(q, planta) {
  const pegatina = q(".pegatina");
  const figura = q(".prueba__figura");
  const sin = q(".prueba__sin");
  const nota = q(".prueba__nota");

  if (planta.vivero.tiene) {
    pegatina.hidden = false;

    const v = META.vivero ?? {};
    const esDelVivero = planta.vivero.emisor && planta.vivero.emisor === v.nombre;
    if (esDelVivero) {
      q(".pegatina__vivero-nombre").textContent = v.nombre;
      ponerOQuitar(q(".pegatina__vivero-dir"), v.direccion);
      ponerOQuitar(q(".pegatina__vivero-tfno"), v.telefono ? `Tfno. ${v.telefono}` : null);
    } else {
      // La begonia viene de otro productor y trae pasaporte europeo.
      q(".pegatina__vivero-nombre").textContent = planta.vivero.emisor ?? "Productor sin identificar";
      ponerOQuitar(q(".pegatina__vivero-dir"), planta.vivero.procedencia);
      q(".pegatina__vivero-tfno").remove();
    }

    ponerOQuitar(q(".pegatina__nombre"), planta.vivero.nombre_etiqueta ?? planta.nombre_comun);
    ponerOQuitar(q(".pegatina__maceta"), planta.vivero.maceta);

    /* Los dígitos impresos NO son un EAN salvo en la begonia: «2040 2174» es
       código interno del vivero, de ocho dígitos. El rótulo tiene que decir cuál
       es cuál — la palabra EAN sobre un número que no lo es convierte la
       signature en atrezo. */
    const digitos = planta.vivero.ean ?? planta.vivero.codigo;
    if (digitos) {
      q(".pegatina__digitos").textContent = `${planta.vivero.ean ? "EAN" : "Cód."} ${digitos}`;
    } else {
      q(".pegatina__digitos").remove();
      q(".pegatina__barras").remove();
    }

    ponerOQuitar(q(".pegatina__precio"), planta.vivero.precio);

    const fito = planta.vivero.fitosanitario ?? planta.vivero.pasaporte;
    if (fito) segmentar(q(".pegatina__fito"), fito);
    else q(".pegatina__fito").remove();
  } else {
    pegatina.remove();
  }

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
       eso es contenido normal. Por eso NO va en gris de «sin dato». */
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

/**
 * El rasgo de la hoja. La silueta era el ancla para escanear una rejilla sin
 * fotos; con fotos deja de hacer ese trabajo y pasa a hacer el suyo, que es
 * mejor: **la forma de la hoja es la clave de identificación botánica**. En la
 * margarita es literalmente la prueba de que la etiqueta miente, y en el helecho
 * la trama dentro del contorno dice dónde está exactamente la duda.
 */
function bloqueIdentificacion(q, planta) {
  const seccion = q(".identificacion");
  if (!seccion) return;
  const dibujo = siluetaDe(planta.id, { grande: true });
  const texto = lecturaDe(planta.id);
  if (!dibujo || !texto) {
    seccion.remove();
    return;
  }
  seccion.hidden = false;
  q(".identificacion__silueta").append(dibujo);
  q(".identificacion__texto").textContent = texto;
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

function camposConDiagrama(q, planta, citadas) {
  const contenedor = q(".campos-diagrama");
  for (const [clave, hacerDiagrama] of CON_DIAGRAMA) {
    const cuidado = planta.cuidados.get(clave);
    if (!cuidado) continue;
    contenedor.append(campoDe(cuidado, hacerDiagrama(planta), fuenteDe(planta, clave, citadas)));
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

  /* EL RESUMEN COMPLETO VUELVE AL EXPEDIENTE, y hay que decir por qué cambia.
     Antes se suprimía aquí porque la cara de la pegatina ya lo imprimía entero
     unos centímetros más arriba, en la misma pantalla: era la misma cadena dos
     veces. Con la piel nueva la cara lleva pastillas de cifras («3 d», «100 ml»)
     y no la frase, así que **este ya no es un duplicado: es el único sitio donde
     se lee «saca la maceta del cachepot»**. Suprimirlo ahora sí perdería
     contenido. */
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

function bloqueMasDatos(q, planta, citadas) {
  const lista = q(".mas-datos__lista");

  for (const clave of RESTO) {
    const c = planta.cuidados.get(clave);
    if (!c) continue;
    lista.append(datoDe(c.etiqueta, c.resumen, c.detalle, fuenteDe(planta, clave, citadas), clave));
  }

  /* Se pinta también cuando dice que los guantes sobran: inflar la precaución
     donde no aplica es la forma más rápida de que nadie se la crea donde sí. */
  if (planta.manipulacion) {
    lista.append(datoDe("Manipulación", planta.manipulacion.resumen,
      [planta.manipulacion.detalle, planta.manipulacion.epi].filter(Boolean).join("\n") || null,
      fuenteDe(planta, "manipulacion", citadas), "manipulacion"));
  }

  const plagas = planta.plagas.length > 0 ? planta.plagas.map((x) => x.nombre).join(" · ") : null;
  // La señal de cada plaga es lo que de verdad sirve para reconocerla: va al
  // detalle ampliable en vez de perderse.
  const senales = planta.plagas.filter((x) => x.senal).map((x) => `${x.nombre}: ${x.senal}`).join("\n");
  lista.append(datoDe("Plagas comunes", plagas, senales || null, fuenteDe(planta, "plagas_comunes", citadas), "plagas"));

  const tox = planta.toxicidad;
  const g = grupoToxicidad(tox);
  const sinDatos = g === "sin_datos" || g === "sin_datos_aspca";
  // Ni «sin datos» ni «sin identificar» se abrevian a una palabra: que no haya
  // dato es justo lo que hay que leer entero.
  const textoTox =
    g === "sin_identificar"
      ? "Sin identificar la especie, no se puede valorar. No significa que sea segura."
      : sinDatos
        ? [tox.texto, tox.aviso].filter(Boolean).join(" ")
        : tox.texto ?? (tox.nivel ? humanizar(tox.nivel) : null);
  const nodoTox = datoDe(
    "Toxicidad para mascotas",
    textoTox,
    tox.detalle,
    fuenteDe(planta, "toxicidad_mascotas", citadas),
    "toxicidad"
  );
  const bloqueTox = nodoTox.querySelector(".dato");
  bloqueTox.classList.add("dato--toxicidad");
  bloqueTox.dataset.toxicidad = g;

  /* El aviso del casi-homónimo va aparte y visible: ASPCA tiene ficha de otra
     especie de nombre casi idéntico, y la trampa va en las dos direcciones —
     en el coleo invita a bajar la guardia, en el ficus a subirla. */
  if (tox.aviso_homonimo) {
    const notaH = document.createElement("p");
    notaH.className = "aviso-homonimo";
    notaH.textContent = tox.aviso_homonimo;
    bloqueTox.querySelector(".dato__valor").append(notaH);
  }
  lista.append(nodoTox);

  // La palabra es obligatoria al lado de los puntos: tres puntos no dicen cuál es cuál.
  lista.append(datoDe("Dificultad", planta.dificultad ? humanizar(planta.dificultad) : null, null, null, "dificultad"));

  /* TODAS las fuentes que no se han pintado ya junto a su campo.
   *
   * Esto era un filtro por `!f.respalda` y ahí había un agujero grande y callado:
   * en el JSON real las 34 fuentes del helecho traen `campo`, así que ninguna era
   * «suelta», el bloque no se creaba nunca, y de las 34 solo llegaban a pantalla
   * las 10 enganchadas a un campo renderizado. Unas 170 citas invisibles en las
   * siete fichas, en un proyecto cuya regla central es que los datos se citan.
   *
   * Lo cazó el recuento del índice: «Fuentes · 10» contra 34 en el JSON. Un
   * número que se puede contrastar es un número que delata. */
  const resto = planta.fuentes.filter((f) => !citadas.has(f));
  if (resto.length > 0) {
    const div = document.createElement("div");
    div.className = "dato dato--fuentes";
    const dt = document.createElement("dt");
    dt.className = "dato__clave";
    dt.textContent = resto.length === 1 ? "Fuente" : "Fuentes";
    const dd = document.createElement("dd");
    dd.className = "dato__valor";

    /* Plegar por longitud es razonable; plegar los límites de lo que sabemos, no.
       Una lista de 24 citas es longitud; lo que no se puede esconder es «esto no
       lo podemos afirmar», y eso vive en LO QUE LA FOTO NO DICE, abierto. Y el
       rótulo lleva el número, así que plegado se sabe cuántas hay. */
    const det = document.createElement("details");
    det.className = "fuentes-resto";
    const sum = document.createElement("summary");
    sum.className = "fuentes-resto__tirador";
    sum.textContent = resto.length === 1
      ? "La otra fuente citada"
      : `Las otras ${resto.length} fuentes citadas`;
    const caja = document.createElement("div");
    caja.className = "fuentes-resto__lista";
    det.append(sum, caja);
    dd.append(det);

    for (const f of resto) {
      const span = document.createElement("span");
      span.className = "dato__fuente";
      /* El campo que respalda va delante de la cita: sin él, veinticuatro «RHS ↗»
         seguidos son una lista de logos. Con él, cada línea dice qué afirmación
         sostiene, que es para lo que existe una fuente. */
      if (f.respalda) {
        const campo = document.createElement("span");
        campo.className = "dato__fuente-campo";
        campo.textContent = humanizar(f.respalda);
        span.append(campo);
      }
      span.append(enlaceFuente(f));
      caja.append(span);
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

/**
 * La fuente que respalda un campo, y el registro de cuál se ha usado.
 *
 * `citadas` es un Set POR RENDER, no una marca en el objeto de datos: la rejilla
 * se vuelve a pintar cada vez que se filtra o se busca, y una bandera pegada a la
 * fuente sobreviviría al re-render y dejaría el bloque de resto vacío a la
 * segunda pasada.
 */
function fuenteDe(planta, campo, citadas) {
  const f = planta.fuentes.find((x) => x.respalda && normalizar(x.respalda) === normalizar(campo)) ?? null;
  if (f && citadas) citadas.add(f);
  return f;
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

/** Una observación propia o una frase de la casa no es un enlace: sin flecha,
 *  sin subrayado, y con la fecha de consulta al lado. */
function sinEnlace(titulo, consultado) {
  const span = document.createElement("span");
  span.className = "fuente fuente--sin-url";
  span.textContent = consultado ? `${titulo} · ${fechaLegible(consultado)}` : titulo;
  return span;
}

/* ── capa 3 · la voz de la casa ─────────────────────────────────────────────── */

function bloqueCasa(q, planta) {
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

  ponerOQuitar(q(".cuaderno__historia"), planta.historia);

  const destinoNotas = q(".cuaderno__notas");
  const sueltas = [planta.notas_carlos, ...notas.map((n) => n.texto)].filter(Boolean);
  if (sueltas.length > 0) destinoNotas.textContent = sueltas.join(" ");
  else destinoNotas.remove();
}

/* ── utilidades ─────────────────────────────────────────────────────────────── */

/** Rellena un nodo con texto, o lo quita del DOM si no hay nada que poner.
 *  Un párrafo vacío ocupa espacio y el lector de pantalla lo recorre igual. */
function ponerOQuitar(destino, valor) {
  if (!destino) return;
  if (valor) destino.textContent = valor;
  else destino.remove();
}

/* ── lista completa ─────────────────────────────────────────────────────────── */

export function renderLista(plantas, contenedor, desde = 0) {
  const frag = document.createDocumentFragment();
  plantas.forEach((p, i) => frag.append(fichaDe(p, desde + i)));
  contenedor.replaceChildren(frag); // una sola inserción, sin parpadeo
}
