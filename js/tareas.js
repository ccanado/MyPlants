/**
 * El calendario: qué toca hoy, y sobre todo qué NO se puede afirmar que toque.
 *
 * Este módulo existe porque el cálculo de fechas es la parte de la web donde es
 * más fácil mentir sin darse cuenta. La regla que lo gobierna es la misma que
 * rige el contenido, y no se cruza tampoco en la interacción:
 *
 *   > La franja no dice nunca «hoy le toca» si nadie ha marcado nunca ese riego.
 *
 * Un contador que se cree más listo de lo que es miente peor que no tener
 * contador, porque un dato ausente se detecta y un dato inventado no.
 *
 * Cinco tipos de tarea (`meta.escalas.tareas` del JSON los define, y el conjunto
 * es cerrado). Pintarlos todos igual sería mentir en cuatro de los cinco:
 *
 *   vencida       tenía fecha de referencia y ya pasó → `desde`. La única con peso.
 *   fecha         fecha concreta → `fecha`. «Faltan N días», «hoy».
 *   temporada     meses del año → `meses`. «Toca este mes».
 *   condicionada  no depende del calendario → `condicion`. NUNCA entra en «hoy».
 *   ritmo         cada tantos días → el riego. NUNCA lleva fecha. Ver abajo.
 *
 * Nada de esto se recalcula en vivo: se computa una vez al cargar. La diferencia
 * entre «faltan 11 días» y «faltan 11 días» un minuto después es ninguna, y un
 * número que se mueve solo en pantalla es justo lo que `prefers-reduced-motion`
 * existe para apagar.
 */

/* ── fechas, sin librería y sin sorpresas de zona horaria ───────────────────── */

/**
 * Un día como número de días desde la época, en horario LOCAL.
 *
 * `Date.parse("2026-08-11")` interpreta la cadena como UTC, así que restar dos
 * fechas así y dividir por 86.400.000 da un día de más o de menos según la zona
 * y según si hay cambio de hora en medio. Se normaliza a mediodía UTC del día
 * civil correspondiente: así la resta es exacta y no la mueve ningún DST.
 */
function diaCivil(y, m, d) {
  return Math.floor(Date.UTC(y, m - 1, d, 12) / 86400000);
}

/** «2026-08-11» → número de día civil, o null si no es una fecha ISO válida. */
export function diaDeISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? "").trim());
  if (!m) return null;
  const [y, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mes < 1 || mes > 12 || d < 1 || d > 31) return null;
  return diaCivil(y, mes, d);
}

/**
 * El hoy del navegador. Se pasa como argumento a todo lo demás en vez de
 * llamarse desde dentro: así el cálculo es una función pura y se puede razonar
 * (y comprobar) sin depender del reloj de la máquina.
 */
export function diaDeHoy(ahora = new Date()) {
  return {
    dia: diaCivil(ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate()),
    mes: ahora.getMonth() + 1,
    fecha: ahora,
  };
}

/** Fecha larga en español, del propio navegador. Cero peticiones, cero librería. */
export function fechaLarga(fecha) {
  try {
    return fecha.toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long",
    });
  } catch {
    return null;   // navegador sin datos de locale: mejor sin fecha que con una fea
  }
}

/** «2026-08-15» → «15 de agosto». Para plazos, donde el año sobra casi siempre. */
export function fechaCortaLegible(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ""));
  if (!m) return null;
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
    "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${Number(m[3])} de ${MESES[Number(m[2]) - 1]}`;
}

const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
  "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** [3,4,5] → «de marzo a mayo». [4,5,6,7,8] con hueco → enumera. */
export function mesesLegibles(meses) {
  if (!Array.isArray(meses) || meses.length === 0) return null;
  const orden = [...new Set(meses.map(Number).filter((m) => m >= 1 && m <= 12))].sort((a, b) => a - b);
  if (orden.length === 0) return null;
  if (orden.length === 1) return `en ${MESES_LARGOS[orden[0] - 1]}`;
  const seguido = orden.every((m, i) => i === 0 || m === orden[i - 1] + 1);
  if (seguido) return `de ${MESES_LARGOS[orden[0] - 1]} a ${MESES_LARGOS[orden.at(-1) - 1]}`;
  return `en ${orden.map((m) => MESES_LARGOS[m - 1]).join(", ")}`;
}

/* ── la estación, y por qué no son solo dos ─────────────────────────────────── */

/**
 * Qué columna de riego manda hoy.
 *
 * Y aquí hay un hueco que el JSON declara y que sería fácil tapar a ojo.
 * `meta.escalas` dice literalmente:
 *
 *   riego.dias_verano   → «días orientativos entre riegos EN JULIO-AGOSTO»
 *   riego.dias_invierno → «días orientativos entre riegos EN INVIERNO CON
 *                          CALEFACCIÓN ENCENDIDA»
 *
 * O sea que las dos cifras **no cubren el año**: mayo, junio, septiembre y
 * octubre no son ninguna de las dos. Decir «cada 3 días» en mayo porque mayo
 * está más cerca del verano sería extrapolar un dato medido para julio-agosto, y
 * este proyecto no rellena a ojo ni cuando el error parece pequeño.
 *
 * Así que hay tres respuestas, y la tercera es un intervalo honesto:
 *   verano      julio y agosto      → manda `dias_verano`
 *   invierno    diciembre a febrero → manda `dias_invierno`
 *   intermedio  el resto            → está entre las dos, y se dice así
 */
export function estacionDeRiego(mes) {
  if (mes === 7 || mes === 8) return "verano";
  if (mes === 12 || mes === 1 || mes === 2) return "invierno";
  return "intermedio";
}

/* ── clasificación de una tarea contra el día de hoy ────────────────────────── */

/**
 * Peso de orden. `vencida` primero siempre; después manda la `prioridad` que
 * pone `botanist`, que es criterio de contenido y no de interfaz.
 */
const PESO_TIPO = { vencida: 0, fecha: 1, temporada: 2, condicionada: 3, ritmo: 4 };

/**
 * Clasifica una tarea contra hoy. Devuelve siempre un objeto con:
 *
 *   enHoy    ¿entra en la lista de «hoy»? (la franja solo muestra estas)
 *   rotulo   distintivo corto, o null si no lleva ninguno
 *   cuando   la frase que dice CUÁNDO, ya redactada y ya honesta
 *   nota     la condición o la razón de que no se pueda contar, si la hay
 *   tono     "tarde" | "hoy" | "plazo" | "comprobacion" — para el CSS
 */
export function clasificar(tarea, hoy) {
  const tipo = tarea.tipo;

  if (tipo === "vencida") {
    const dia = diaDeISO(tarea.desde);
    const dias = dia == null ? null : hoy.dia - dia;
    return {
      enHoy: true,
      estado: "vencida",
      /* «VA TARDE», nunca «incumplido» ni «pendiente desde». `vencida` significa
         «tiene fecha de referencia y ya pasó», no «alguien lo ha hecho mal» — y
         la fecha de referencia es criterio de `botanist`, no norma de RHS, así
         que la interfaz no puede sonar a multa. Acusar al lector de una tarea
         que nadie le había dicho es la forma más rápida de que cierre la web. */
      rotulo: "Va tarde",
      cuando: dias != null && dias > 0
        ? `Debería haberse hecho hace ${dias} días`
        : "Tenía fecha de referencia y ya pasó",
      nota: tarea.condicion,
      tono: "tarde",
      dias,
    };
  }

  if (tipo === "fecha") {
    const dia = diaDeISO(tarea.fecha);
    if (dia == null) {
      return { enHoy: false, estado: "proxima", rotulo: null, cuando: null, nota: null, tono: "comprobacion" };
    }
    const faltan = dia - hoy.dia;
    /* `cuando: null` y no «Hoy»: el rótulo ya dice «HOY» y repetirlo dos veces en
       la misma línea —una en el distintivo y otra detrás del título— es ruido.
       La regla general de este objeto: el `cuando` solo dice lo que el rótulo no
       puede decir. */
    if (faltan === 0) return { enHoy: true, estado: "hoy", rotulo: "Hoy", cuando: null, nota: tarea.condicion, tono: "hoy", dias: 0 };
    if (faltan < 0) {
      /* Una `fecha` que ya pasó NO se reetiqueta como vencida: `vencida` es una
         clasificación de `botanist` y hoy solo hay una en las diez. Se dice el
         hecho —la fecha era otro día— sin subir el tono ni acusar a nadie. */
      return {
        enHoy: true,
        estado: "hoy",
        rotulo: null,
        cuando: `Estaba prevista para el ${fechaCortaLegible(tarea.fecha)}`,
        nota: tarea.condicion,
        tono: "plazo",
        dias: faltan,
      };
    }
    return {
      enHoy: false,
      estado: "proxima",
      rotulo: null,
      cuando: faltan === 1
        ? `Mañana, ${fechaCortaLegible(tarea.fecha)}`
        : `Faltan ${faltan} días: el ${fechaCortaLegible(tarea.fecha)}`,
      nota: tarea.condicion,
      tono: "plazo",
      dias: faltan,
    };
  }

  if (tipo === "temporada") {
    const meses = Array.isArray(tarea.meses) ? tarea.meses.map(Number) : [];
    const enMes = meses.includes(hoy.mes);
    const ventana = mesesLegibles(meses);

    /* LA CONDICIÓN GANA AL MES, y esto es lo que más hay que respetar de aquí.
       Dos tareas del helecho tienen el mes a favor y una condición en contra
       («solo cuando tenga 3 o 4 frondes sanas»). Abonar una planta sin hoja le
       quema las raíces: una tarea condicionada mostrada porque el calendario
       cuadra no sería inexacta, sería CONSEJO DAÑINO. Así que si hay condición,
       no entra en «hoy» y no se dice «toca este mes» — se dice qué comprobar. */
    if (enMes && tarea.condicion) {
      return {
        enHoy: false,
        estado: "condicionada",
        rotulo: null,
        cuando: `Su temporada es ahora (${ventana}), pero antes hay que comprobar una cosa`,
        nota: tarea.condicion,
        tono: "comprobacion",
      };
    }
    if (enMes) {
      // El rótulo dice «ESTE MES»; el `cuando` añade la ventana entera, que es
      // lo que el rótulo no cabe decir y lo que sitúa el mes en su temporada.
      return { enHoy: true, rotulo: "Este mes", cuando: ventana ? `Su temporada es ${ventana}` : null, nota: null, tono: "hoy" };
    }
    return {
      enHoy: false,
      estado: "temporada",
      rotulo: null,
      cuando: ventana ? `Su temporada es ${ventana}` : null,
      nota: tarea.condicion,
      tono: "plazo",
    };
  }

  if (tipo === "condicionada") {
    /* Nunca entra en «hoy», ni aunque el calendario cuadre: su disparador no es
       el calendario. Aparece en su ficha, en forma de comprobación. */
    return {
      enHoy: false,
      estado: "condicionada",
      rotulo: null,
      cuando: "No depende del calendario",
      nota: tarea.condicion,
      tono: "comprobacion",
    };
  }

  if (tipo === "ritmo") {
    /* EL RIEGO, Y ESTO ES LO QUE NO SE NEGOCIA.
       Un intervalo sin día de partida no produce un vencimiento, y decir «hoy
       toca regar» desde «cada 4 días» es inventarse el origen de la cuenta.

       Y hay un caso más fino que hay que resolver a mano, porque el JSON invita
       a lo contrario: hay plantas con `calculable: true` y
       `ancla_tipo: "llegada_a_casa"` —hoy el helecho nuevo y el croton, que
       llegaron el 13/08/2026 sin regar—, o sea que la aritmética SÍ saldría. No
       se usa. Para el riego el disparador correcto nunca es el calendario, es el
       sustrato, así que un ancla exacta produciría un vencimiento
       aritméticamente impecable y agronómicamente falso — regar por calendario
       en una casa con aire acondicionado y sol de mañana es cómo se ahoga una
       planta. El ancla se usa donde el calendario SÍ manda (abonado, trasplante,
       revisión); en riego, no.

       Lo que ocupa la casilla de la cuenta atrás es la comprobación, que es
       cierta todos los días. Una web que dice «comprueba» enseña a cuidar
       plantas; una que dice «riega hoy» solo da órdenes, y a los cuatro días se
       equivoca. */
    /* Y AQUÍ ESTABA UN DEFECTO REAL, que avisó `botanist` dos veces.
       El comentario de arriba decía «`riego.ultimo` es null en las siete» y dejó
       de serlo en cuanto Carlos empezó a decir cuándo regaba. Devolver
       `sinRegistro: true` para todo `ritmo` hacía que la ficha rotulara «sin
       registrar» en plantas donde el dato SÍ consta — o sea el error simétrico
       del que este módulo existe para evitar: en vez de inventarse un dato,
       negaba uno que había. Ahora `sinRegistro` sale del dato y no del tipo, que
       es lo que ha permitido que el reparto cambie tres veces sin tocar código:
       a 13/08/2026 son OCHO de diez las que tienen `riego.ultimo`, y las dos que
       no son las que llegaron ese día sin regar. */
    const ultimo = diaDeISO(tarea.ultimo);
    const desdeElUltimo = ultimo == null ? null : hoy.dia - ultimo;

    return {
      enHoy: false,
      estado: "ritmo",
      rotulo: null,
      cuando: [ritmoLegible(tarea, hoy.mes), regadaHace(desdeElUltimo)]
        .filter(Boolean).join(" · ") || null,
      nota: tarea.disparador ?? null,
      tono: "comprobacion",
      // Solo cuando de verdad no hay registro. Es un hecho del JSON, no del tipo.
      sinRegistro: ultimo == null,
    };
  }

  // Tipo desconocido: no se inventa nada y no entra en «hoy». El conjunto es
  // cerrado, así que llegar aquí significa que el JSON ha crecido.
  return { enHoy: false, estado: null, rotulo: null, cuando: null, nota: tarea.condicion ?? null, tono: "comprobacion" };
}

/**
 * «se regó hace 3 días». Es una OBSERVACIÓN, no una predicción, y por eso sí se
 * puede decir: cuenta hacia atrás desde un hecho registrado en vez de hacia
 * delante hacia un vencimiento que el sustrato puede desmentir. La diferencia
 * entre esto y «hoy toca regar» es la diferencia entre lo que pasó y lo que
 * alguien supone que va a pasar.
 */
function regadaHace(dias) {
  if (dias == null || dias < 0) return null;
  if (dias === 0) return "se regó hoy";
  if (dias === 1) return "se regó ayer";
  return `se regó hace ${dias} días`;
}

/** «Cada 3 días en julio y agosto, cada 6 en invierno», y sin fecha ninguna. */
function ritmoLegible(tarea, mes) {
  const v = numero(tarea.dias_verano);
  const i = numero(tarea.dias_invierno);
  if (v == null && i == null) return null;

  const estacion = estacionDeRiego(mes);
  if (estacion === "verano" && v != null) return `Ahora, cada ${v} días orientativos`;
  if (estacion === "invierno" && i != null) return `Ahora, cada ${i} días orientativos`;
  /* En los meses intermedios no manda ninguna de las dos cifras, y el intervalo
     es la respuesta honesta: las dos están medidas para julio-agosto y para el
     invierno con calefacción, no para mayo. */
  if (v != null && i != null) return `Entre ${v} y ${i} días según la época`;
  return `Cada ${v ?? i} días orientativos`;
}

const numero = (x) => (x == null || x === "" || !Number.isFinite(Number(x)) ? null : Number(x));

/**
 * Pinta una frase nuestra repartiendo los NÚMEROS en su propia voz.
 *
 * En este proyecto las cifras se escriben en `--fuente-dato` —ml, °C, cm, €, EAN,
 * fechas—: es la voz mecánica de báscula de vivero que hace que esto parezca un
 * cuaderno de campo y no una landing. Y estaba sin aplicar justo en el renglón
 * que más se lee: el `57` de «hace 57 días» iba vestido de prosa, siendo la única
 * cifra de la franja. Lo levantó `ux-lead` sobre una crítica de `qa-visual`.
 *
 * Se hace aquí y de forma general en vez de con un caso especial para el 57,
 * porque la regla tipográfica es del proyecto y no de esa frase: cualquier cifra
 * que salga de este módulo la hereda. Y se construye con `createElement` y
 * `textContent`, nunca con `innerHTML` — las cadenas las generamos nosotros, pero
 * la disciplina no depende de quién sea el autor del texto.
 */
export function conCifras(frase) {
  const frag = document.createDocumentFragment();
  if (!frase) return frag;
  // Grupos de dígitos, con su coma o punto decimal si lo llevan.
  for (const trozo of String(frase).split(/(\d+(?:[.,]\d+)?)/)) {
    if (trozo === "") continue;
    if (/^\d/.test(trozo)) {
      const cifra = document.createElement("span");
      cifra.className = "cifra";
      cifra.textContent = trozo;
      frag.append(cifra);
    } else {
      frag.append(document.createTextNode(trozo));
    }
  }
  return frag;
}

/* ── la lista de hoy, para la franja ────────────────────────────────────────── */

/**
 * Las tareas de hoy de todas las plantas, ya ordenadas.
 *
 * Solo entran las que se pueden afirmar: `vencida`, `fecha` cumplida, y
 * `temporada` en su mes SIN condición. Ni `condicionada` ni `ritmo` entran
 * nunca — no porque sean menos importantes, sino porque de ellas no se puede
 * decir «hoy», y decirlo sería el único error de verdad grave que puede cometer
 * esta franja.
 */
export function tareasDeHoy(plantas, hoy) {
  const lista = [];
  for (const planta of plantas) {
    for (const tarea of planta.tareas ?? []) {
      const c = clasificar(tarea, hoy);
      if (c.enHoy) lista.push({ planta, tarea, ...c });
    }
  }
  return lista.sort(
    (a, b) =>
      (PESO_TIPO[a.tarea.tipo] ?? 9) - (PESO_TIPO[b.tarea.tipo] ?? 9) ||
      (a.tarea.prioridad ?? 9) - (b.tarea.prioridad ?? 9) ||
      a.planta.nombre_comun.localeCompare(b.planta.nombre_comun, "es")
  );
}

/**
 * Las tareas de hoy AGRUPADAS POR PLANTA: una entrada por planta, no por tarea.
 *
 * Y esto no es una preferencia de formato, es la corrección de un error de
 * diseño. La franja tenía un tope de dos tareas y una línea de «y 8 más, cada
 * una en su ficha». Carlos: *«el "y 8 más, cada una en su ficha" es complejo
 * porque te obliga a entrar en todas las fichas»*. El tope protegía «hay muchas
 * tareas y la portada explota» y el caso real es «hay diez tareas cortas y
 * quiero verlas de un tirón»: diez líneas de una frase no son un muro, diez
 * fichas que abrir sí — y la página existe justo para ahorrar ese trabajo.
 *
 * No hace falta tope porque **el techo ya está en el dominio**: hay siete
 * plantas, así que agrupando por planta la lista no pasa de siete renglones ni
 * el día que todas necesiten algo. Hoy son diez tareas en seis líneas.
 */
export function tareasDeHoyPorPlanta(plantas, hoy) {
  const porPlanta = new Map();
  for (const t of tareasDeHoy(plantas, hoy)) {
    /* `temporada` NO entra como línea propia, y el motivo es que el eje del
       agrupamiento lo decide el tipo de tarea:
       - En una tarea DEL DÍA lo compartido es la planta: vas a ella y haces lo
         que pida. Se agrupa por planta.
       - En una VENTANA DE TEMPORADA lo compartido es la tarea y el mes: lo que se
         hace de verdad es sacar el abono una vez y pasar por las cinco. Se agrupa
         por tarea, en una sola línea al pie.
       Hoy son cinco «Abonar» idénticos, el 50 % de la lista, para algo que se
       puede hacer cualquier día de agosto. Cinco líneas iguales diluían lo
       urgente. Y la spec ya lo prohibía sin que nadie lo viera: la franja muestra
       «solo lo de hoy», y una ventana abierta semanas no es hoy. */
    if (t.tarea.tipo === "temporada") continue;
    if (!porPlanta.has(t.planta.id)) porPlanta.set(t.planta.id, { planta: t.planta, tareas: [] });
    porPlanta.get(t.planta.id).tareas.push(t);
  }
  /* `tareasDeHoy` ya viene ordenada, así que la primera tarea de cada planta es
     su más urgente y sirve para ordenar las líneas entre sí. */
  return [...porPlanta.values()].sort(
    (a, b) =>
      (PESO_TIPO[a.tareas[0].tarea.tipo] ?? 9) - (PESO_TIPO[b.tareas[0].tarea.tipo] ?? 9) ||
      (a.tareas[0].tarea.prioridad ?? 9) - (b.tareas[0].tarea.prioridad ?? 9) ||
      a.planta.nombre_comun.localeCompare(b.planta.nombre_comun, "es")
  );
}

/**
 * Las ventanas de temporada abiertas este mes, agrupadas POR TAREA y no por
 * planta: «Este mes: abonar — coleo grande, coleo pequeño, ficus, poto, begonia».
 * Una línea al pie de la franja, sin plegar y con las plantas nombradas.
 *
 * Se agrupan por `titulo` y no por `id` porque el rótulo es lo que se lee: dos
 * tareas con el mismo título son la misma faena aunque `botanist` les ponga ids
 * distintos.
 */
export function ventanasDeTemporada(plantas, hoy) {
  const porTarea = new Map();
  for (const planta of plantas) {
    for (const tarea of planta.tareas ?? []) {
      if (tarea.tipo !== "temporada") continue;
      const c = clasificar(tarea, hoy);
      if (!c.enHoy) continue;   // fuera de mes, o con condición: la condición gana
      const clave = tarea.titulo;
      if (!porTarea.has(clave)) porTarea.set(clave, { titulo: tarea.titulo, cuando: c.cuando, plantas: [] });
      porTarea.get(clave).plantas.push(planta);
    }
  }
  return [...porTarea.values()].sort((a, b) => b.plantas.length - a.plantas.length);
}

/** Las tareas de UNA planta, todas, clasificadas y en orden de urgencia. */
export function tareasDePlanta(planta, hoy) {
  return (planta.tareas ?? [])
    .map((tarea) => ({ tarea, ...clasificar(tarea, hoy) }))
    .sort(
      (a, b) =>
        (PESO_TIPO[a.tarea.tipo] ?? 9) - (PESO_TIPO[b.tarea.tipo] ?? 9) ||
        (a.tarea.prioridad ?? 9) - (b.tarea.prioridad ?? 9)
    );
}
