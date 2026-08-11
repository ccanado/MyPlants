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

import { FOTO, FOTO_ETIQUETA, slug } from "./datos.js";
import { humanizar, normalizar } from "./filtros.js";
import { iconoDe, iconoDificultad } from "./iconos.js";
import { siluetaDe } from "./siluetas.js";
import { diaDeHoy, tareasDePlanta } from "./tareas.js";
import {
  diagramaLuz,
  diagramaRiego,
  diagramaTemperatura,
} from "./svg.js";

const tpl = (id) => document.getElementById(id);
const TPL_FICHA = tpl("tpl-ficha");
const TPL_CAMPO = tpl("tpl-campo-diagrama");
const TPL_DATO = tpl("tpl-dato");
const TPL_TAREA = tpl("tpl-tarea-ficha");

/**
 * El «hoy» con el que se calculan los plazos de la ficha. Lo fija `app.js` con
 * el mismo valor que usa la franja: dos partes de la misma pantalla no pueden
 * discrepar sobre qué día es. Si nadie lo fija, se calcula aquí — así el módulo
 * sigue funcionando solo, pero el camino normal es el compartido.
 */
let HOY = diaDeHoy();
export function fijarHoy(hoy) { if (hoy) HOY = hoy; }

const SIN_DATO = "Sin dato";

/** Campos que van en la cara de la etiqueta, con la regadera en la mano. */
const EN_LA_CARA = ["riego", "luz", "temperatura"];
/** Campos con diagrama al despegar. Mismo orden que arriba, no es casualidad. */
const CON_DIAGRAMA = [
  ["riego", (p) => diagramaRiego(p.medidas.riego)],
  ["luz", (p) => diagramaLuz(p.medidas.luz)],
  ["temperatura", (p) => diagramaTemperatura(p.medidas.temperatura)],
];

/**
 * EL RESUMEN DUPLICADO, y cuál de los dos sobra.
 *
 * El brief lo dice exacto: *«el resumen existe para la rejilla cerrada, donde es
 * lo único que hay. Hoy se pinta dos veces la misma frase en la misma pantalla»*.
 * Y las dos veces son estas, que es lo que hay que ver para no equivocarse de
 * bulto:
 *
 *   1. `.resumen__valor` — en la CARA de la pegatina, a --texto-m. Es el resumen
 *      de la rejilla cerrada, y la cara sigue ahí cuando la ficha se abre.
 *   2. `.campo__resumen` — dentro del expediente, a --texto-s, encima de su
 *      diagrama y su «Más detalle».
 *
 * Es **la misma cadena** (`cuidado.resumen`) pintada dos veces, una debajo de la
 * otra, en la misma pantalla. El duplicado NO es «resumen contra diagrama»: si lo
 * fuera, suprimirlo sí perdería contenido, porque el dial de riego no dice «saca
 * la maceta del cachepot» ni la escala de luz dice «sepárala del cristal».
 *
 * Así que el que sobra es el 2, y solo en los tres campos que están en la cara:
 * el 1 se queda intacto, más grande y más arriba, con la frase entera. No se
 * pierde ni una palabra — solo deja de estar dos veces.
 */
const RESUMEN_YA_ESTA_EN_LA_CARA = new Set(EN_LA_CARA);
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
  /* Qué fuentes se han pintado ya junto a su campo, para que el bloque de abajo
     recoja EXACTAMENTE el resto y ninguna se quede fuera de la pantalla. Se crea
     por render, no por planta: la rejilla se repinta al filtrar. */
  const citadas = new Set();
  camposConDiagrama(q, planta, citadas);
  bloqueCalendario(q, planta);
  bloqueMasDatos(q, planta, citadas);
  bloqueCarlos(q, planta);
  // El índice va al final: cuenta lo que los demás han dejado en el DOM, así que
  // no puede adelantarse a ellos. Cuenta nodos pintados, no campos del JSON —
  // un recuento que no cuadre con lo que hay debajo es peor que no ponerlo.
  indiceDelExpediente(q, planta);

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
    /* El tratamiento ya no vive dentro de `.estado` —está en la columna de
       acción—, así que quitar la sección ya no se lo lleva por delante. Sin
       estado no hay pasos, y un bloque «Qué hacer» vacío en la columna que
       existe para decir qué hacer es lo peor que puede quedarse ahí. */
    q(".estado__tratamiento")?.remove();
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
  bloqueCausas(seccion, estado.causas, g);
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

  /* EL DIAGRAMA DE RECUPERACIÓN SE BORRA, y no es una poda por altura: afirmaba
     algo falso. `ux-lead` retiró su propia especificación al medirlo.
     Los seis círculos iban en cx 10/30/50/70/90/110 —espaciado regular— para
     pasos cuyos horizontes son *inmediato, inmediato, esta semana, 3 semanas, 2-3
     meses* y *cuando haya una fronde adulta*. O sea que el eje codificaba el
     índice 1…6 y no el tiempo, y encima iba rotulado `hoy` … `01/09/2026`, con lo
     que **afirmaba que el paso 6 cae el 1 de septiembre cuando esa fecha es el
     `revisar_fecha` y no corresponde a ningún paso**.
     Y no se arregla: dos pasos en el instante 0 no tienen posición en un eje
     logarítmico, y uno sin fecha no la tiene en ninguno. La lista numerada que va
     justo debajo ya rotula cada paso con su horizonte en palabras (`INMEDIATO`,
     `3 SEMANAS`, `2-3 MESES`), que es MÁS preciso que un eje.
     Por la regla eliminatoria de `svg.js` —si se puede borrar sin perder
     información, es decoración— aquí el que se borra es el dibujo, porque todas
     sus palabras están en el texto y el texto además no miente. */
  q(".estado__diagrama")?.remove();
}

/* ── el calendario de la planta ──────────────────────────────────────────────── */

/**
 * Las tareas de esta planta, todas, cada una dicha con las palabras que su tipo
 * permite. En la franja solo entran las que se pueden afirmar hoy; aquí entran
 * las cinco clases, porque la ficha es donde se hacen y donde caben los matices:
 *
 *   - El riego lleva su **comprobación**, no una fecha, y dice `sin registrar`
 *     en el hueco donde iría la última vez. La ausencia se dice como ausencia,
 *     igual que un campo botánico sin verificar: la página no cambia de estándar
 *     de honestidad porque el dato sea de uso en vez de botánico.
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
    /* Los mismos `data-*` que en la franja: `qa-visual` mide las dos superficies,
       porque una tarea condicionada mal pintada es igual de dañina en la ficha. */
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
       aquí no haya una cuenta atrás. Se dice, y se dice en su gris. */
    if (t.sinRegistro && !t.tarea.ultimo) trozos.push("última vez: sin registrar");
    if (trozos.filter(Boolean).length > 0) {
      cuando.textContent = trozos.filter(Boolean).join(" · ");
      if (t.sinRegistro && !t.tarea.ultimo) cuando.classList.add("tarea__cuando--sin-dato");
    } else {
      cuando.remove();
    }

    const nota = nodo.querySelector(".tarea__nota");
    if (t.nota) {
      nota.hidden = false;
      /* El rótulo distingue las dos cosas que pueden ocupar esta línea, y no son
         lo mismo: una condición es un requisito que hay que cumplir antes, y una
         comprobación es algo que hay que mirar. Sin rótulo, «comprobar que los 2
         cm de arriba están secos» se leería como una condición de calendario. */
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
 * Dos decisiones que lo gobiernan y no son de maquetación:
 *
 *  1. **No está para esconder, está para entrar.** Nada se pliega detrás de él:
 *     las cuatro secciones que enumera siguen enteras y abiertas en la otra
 *     columna. Con dos columnas y un índice, esconder además sería cobrar dos
 *     veces por la misma decisión.
 *  2. **El recuento se cuenta del DOM, no del JSON.** «Lo que se ve · 13» es una
 *     afirmación sobre lo que hay debajo, y si se contara del JSON bastaría con
 *     que un `filter()` del render descartara un elemento para que el número
 *     mintiera. Se cuenta lo pintado, así que no puede desalinearse.
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
     citas realmente pintadas en TODA la ficha (`enToda`) y se entra por «Más
     datos», que es donde está la mayoría y donde vive el grupo de las que no
     cuelgan de ningún campo. El número es el que se puede contar en pantalla. */
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
     liste las regiones oiría «navegación» siete veces. El rótulo visible dice
     «En el expediente» en las siete, así que el nombre accesible tiene que
     llevar además de qué planta es. Lo cazó `tests/runner.py`, no una lectura. */
  indice.setAttribute("aria-label", `En el expediente de ${planta.nombre_comun}`);
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
/**
 * EL RÓTULO DEL `patron` VARÍA POR `tipo`, y no es cosmético.
 *
 * `PATRÓN PARA RECONOCERLA` era correcto cuando el campo solo vivía en `causa`.
 * Con `tipo` puesto hay `patron` en afirmaciones, y ahí ese rótulo no significa
 * nada: lo que dice el texto es **qué desmentiría** la afirmación, no cómo
 * reconocerla. Un rótulo por clase, no un rótulo por bloque.
 */
const ROTULO_PATRON = new Map([
  ["causa", "Patrón para reconocerla"],
  ["riesgo", "Señal de que está pasando"],
  ["afirmacion", "Qué lo desmentiría"],
]);

/**
 * Qué se pliega, por clase. El contrato es de `ux-lead` y la lógica es la misma
 * regla de siempre: **no se pliegan ni las afirmaciones ni los límites de lo que
 * sabemos; el razonamiento sí puede.** Una `mejora` es una propuesta, no una
 * afirmación sobre un problema, así que puede ir plegada sin romper nada.
 */
const SE_PLIEGA_ENTERA = new Set(["mejora"]);

/**
 * El rótulo del bloque, y por qué no puede ser fijo.
 *
 * `CAUSAS PROBABLES` sobre una planta sana le pide la causa de un problema que no
 * tiene — y el hueco se rellenaba, porque `botanist` responde bien: el poto sano
 * cargaba 5 «causas» y 1.955 caracteres, el mismo peso que el helecho que se
 * muere. Pero «mejoras opcionales» tampoco servía: en esas cuatro plantas los
 * ítems no son todos del mismo tipo — el poto trae tres afirmaciones, **un riesgo**
 * (podredumbre de raíz en maceta sin drenaje visible) y una mejora, y filar un
 * riesgo bajo «opcionales» es peor que filarlo bajo «causas probables».
 *
 * Así que el rótulo del bloque deja de adivinar y solo dice de qué va el bloque;
 * la clase la dice cada ítem. Es el criterio general que salió cuatro veces hoy:
 * **no dejes que el contenedor adivine de qué clase es su contenido; deja que la
 * clase escrita en el dato decida la forma.**
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

    const linea = document.createElement("p");
    linea.className = "causa__resumen";
    linea.textContent = causa.resumen ?? causa.detalle;

    if (causa.detalle && causa.resumen && SE_PLIEGA_ENTERA.has(causa.tipo)) {
      /* Una `mejora` se pliega ENTERA, afirmación incluida: es una propuesta, y
         una propuesta no es ni un hallazgo ni un límite de lo que sabemos. El
         rótulo lleva su propio resumen, así que plegada sigue diciendo de qué es. */
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
      const rotulo = document.createElement("span");
      rotulo.className = "causa__patron-rotulo";
      /* Sin entrada en el mapa no se inventa un rótulo: se pinta el patrón sin
         él. `aclaracion` y `mejora` hoy no traen `patron`, y si un día lo traen
         `ux-lead` decide cómo se llama — no lo decide un `??` de este fichero. */
      const nombre = ROTULO_PATRON.get(causa.tipo ?? "causa");
      if (nombre) {
        rotulo.textContent = nombre;
        patron.append(rotulo);
      }
      const texto = document.createElement("span");
      texto.textContent = causa.patron;
      patron.append(texto);
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

  /* La banda de la foto: fecha primero, porque es lo que fija de QUÉ momento
     habla el diagnóstico. `estados[].fecha_foto` existe en las siete. */
  const fecha = q(".foto__fecha");
  const cuando = planta.estado?.fecha_foto;
  if (cuando) fecha.textContent = `Foto del ${fechaLegible(cuando)}`;
  else fecha.remove();

  /* La limitación de ESTA foto, cuando el contenido la trae.
     `limitacion_foto` es un campo que le he pedido a `botanist` y que hoy no
     existe todavía: el texto del helecho —«la foto está tomada de noche y con
     poca luz: el color real de la fronde nueva y el detalle del envés no se
     pueden juzgar en ella»— vive hoy enterrado como una observación entre trece.
     Y NO se saca de ahí olfateando la prosa: buscar «foto» en las señales sería
     un heurístico sobre texto, que es justo lo que este proyecto no hace.
     Mientras el campo no exista, la banda muestra solo la fecha. Y **no se
     escribe «sin limitaciones conocidas»**: eso afirmaría algo que nadie ha
     comprobado. */
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

  // Si la banda se ha quedado sin nada, se va: una caja vacía no es una banda.
  if (!q(".foto__pie").hasChildNodes()) q(".foto__pie").remove();
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

  const resumen = nodo.querySelector(".campo__resumen");
  if (cuidado.resumen && RESUMEN_YA_ESTA_EN_LA_CARA.has(cuidado.clave)) {
    /* Ya está impreso en la cara de la pegatina, más grande y unos centímetros
       más arriba en la misma pantalla. Aquí solo sería la segunda vez. */
    resumen.remove();
  } else if (cuidado.resumen) {
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
        // El aviso viene del JSON y se pinta entero. Si no cabe, se agranda la
        // caja: recortar una frase de seguridad es peor que no ponerla.
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

  /* TODAS las fuentes que no se han pintado ya junto a su campo.
   *
   * Esto era un filtro por `!f.respalda` y ahí había un agujero grande y callado:
   * en el JSON real **las 34 fuentes del helecho traen `campo`**, así que ninguna
   * era «suelta», el bloque no se creaba nunca, y de las 34 solo llegaban a la
   * pantalla las 10 que `fuenteDe()` engancha a un campo renderizado. Las otras
   * 24 —`nombre_cientifico`, `familia`, `estado`, `historia`, `fecha_llegada`,
   * `etiqueta_vivero`, `riego.ultimo`, `temperatura.minima_letal_c`… y la SEGUNDA
   * fuente de `riego` y de `plagas_comunes`, que `.find()` descarta— no se veían
   * en ningún sitio. Unas 170 citas en las siete fichas.
   *
   * Y es el peor sitio donde podía pasar: `CLAUDE.md` dice que los datos se
   * verifican y se citan, y el brief dice que las fuentes son contenido y no
   * letra pequeña. Una cita que no llega a la pantalla no respalda nada.
   *
   * Lo cazó el recuento del índice: «Fuentes · 10» contra 34 en el JSON. Es el
   * argumento de `ux-lead` a favor del recuento, cumpliéndose el primer día —
   * un número que se puede contrastar es un número que delata. */
  const resto = planta.fuentes.filter((f) => !citadas.has(f));
  if (resto.length > 0) {
    const div = document.createElement("div");
    div.className = "dato dato--fuentes";
    const dt = document.createElement("dt");
    dt.className = "dato__clave";
    dt.textContent = resto.length === 1 ? "Fuente" : "Fuentes";
    const dd = document.createElement("dd");
    dd.className = "dato__valor";

    /* Y AQUÍ HAY UN CHOQUE ENTRE DOS REGLAS DEL PROYECTO, así que conviene decir
       cuál gana y con qué argumento.
       Sacar estas 24 citas del limbo cuesta ~600 px por ficha, o sea que se come
       casi todo lo que ganaron las dos columnas. Pero el brief da la regla que lo
       resuelve, y es suya, no mía:
         «Plegar por longitud es razonable; plegar los límites de lo que sabemos,
          no.»
       Una lista de 24 citas es un problema de LONGITUD, no un límite de lo que
       sabemos: lo que no se puede esconder es «esto no lo podemos afirmar», y eso
       vive en `LO QUE LA FOTO NO DICE`, que sigue entero y abierto.
       Además el rótulo lleva el número, así que plegado se sabe cuántas hay antes
       de abrirlo — que es la condición que el brief le pone a un índice para no
       engañar, y vale igual aquí. Antes de esto no estaban plegadas: no estaban. */
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
      /* El campo que respalda va delante de la cita: sin él, veinticuatro
         «RHS ↗» seguidos son una lista de logos. Con él, cada línea dice qué
         afirmación sostiene, que es para lo que existe una fuente. */
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
 * se vuelve a pintar cada vez que se filtra o se busca, y una bandera pegada a
 * la fuente sobreviviría al re-render y dejaría el bloque de resto vacío a la
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

/** Una observación propia o una frase de Carlos no es un enlace: sin flecha,
 *  sin subrayado, y con la fecha de consulta al lado. */
function sinEnlace(titulo, consultado) {
  const span = document.createElement("span");
  span.className = "fuente fuente--sin-url";
  span.textContent = consultado ? `${titulo} · ${fechaLegible(consultado)}` : titulo;
  return span;
}

/* `dominio()` se retiró: las fuentes se citan por nombre corto («RHS ↗»),
   así que ya no hace falta extraer el host de la URL. */

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
