/**
 * Carga y normalización de content/plantas.json.
 *
 * El JSON lo posee `botanist`. Este módulo es la única frontera donde se toca su
 * forma: normaliza lo que llega a una estructura estable para que el render no
 * tenga que preguntar «¿esto era un string o un objeto?» en quince sitios.
 *
 * Deliberadamente tolerante: acepta un campo de cuidado como string plano o como
 * { resumen, detalle }, y las fuentes como string o como objeto. Así el contenido
 * puede evolucionar sin que se rompa la página.
 */

/** Orden de lectura de los cuidados en la ficha. No es alfabético: es el orden en
 *  que alguien con una regadera en la mano se hace las preguntas. */
export const CAMPOS_CUIDADO = [
  ["riego", "Riego"],
  ["luz", "Luz"],
  ["humedad", "Humedad"],
  ["temperatura", "Temperatura"],
  ["sustrato", "Sustrato"],
  ["abonado", "Abonado"],
  ["trasplante", "Trasplante"],
];

const RUTA_IMG = "./assets/img/";

/**
 * `luz.nivel` llega como número (2, 3, 4). Un filtro que ofrezca «2» y «4» no
 * ayuda a nadie, así que se traduce a la palabra que usa la gente.
 * ⚠ Escala pendiente de confirmar con `botanist`: si su 1–5 no es este, se
 *   cambia aquí y en ningún otro sitio.
 */
const NIVELES_LUZ = new Map([
  [1, "sombra"],
  [2, "semisombra"],
  [3, "luz indirecta"],
  [4, "mucha luz"],
  [5, "sol directo"],
]);

function palabraNivelLuz(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (Number.isFinite(n)) return NIVELES_LUZ.get(Math.round(n)) ?? null;
  return texto(v);
}

/** Dimensiones reales de los ficheros tras la conversión con sips. Se leyeron
 *  con `sips -g pixelWidth`, no se estiman: el navegador reserva el hueco con
 *  ellas y una cifra inventada produce salto de layout.
 *  La ficha pinta la foto a ~374 px CSS, así que 800 de ancho es 2× para retina;
 *  la etiqueta se pinta a 9rem y 500 deja margen para inspeccionarla. */
export const FOTO = { ancho: 800, alto: 1067 };
export const FOTO_ETIQUETA = { ancho: 500, alto: 667 };

export async function cargarPlantas(url = "./content/plantas.json") {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar ${url}: ${res.status} ${res.statusText}`);

  const datos = await res.json();
  const crudas = Array.isArray(datos) ? datos : datos?.plantas;
  if (!Array.isArray(crudas)) {
    throw new Error("Formato inesperado en plantas.json: se esperaba un array de plantas");
  }
  // `meta` trae el vivero y su dirección: la microlínea de la pegatina sale de
  // ahí y no de una constante escrita a mano en el render.
  return { plantas: crudas.map(normalizarPlanta), meta: objeto(datos?.meta) };
}

/* ── normalizadores ─────────────────────────────────────────────────────────── */

/**
 * Un campo de cuidado puede llegar de tres formas. Las tres valen:
 *   "Cada 5 días"                              → resumen, sin detalle
 *   { resumen: "…", detalle: "…" }             → tal cual
 *   null                                       → dato no verificado, se marca
 */
function normalizarCampo(valor) {
  if (valor == null) return { resumen: null, detalle: null, verificado: false };
  if (typeof valor === "string") {
    return { resumen: valor.trim() || null, detalle: null, verificado: true };
  }
  if (typeof valor === "object") {
    const resumen = texto(valor.resumen ?? valor.texto ?? valor.valor);
    const detalle = texto(valor.detalle ?? valor.ampliado);
    return { resumen, detalle, verificado: resumen != null, nivel: texto(valor.nivel) };
  }
  return { resumen: String(valor), detalle: null, verificado: true };
}

function normalizarFuente(f) {
  if (f == null) return null;
  if (typeof f === "string") {
    // Puede venir como URL suelta o como "Título — url"
    const url = f.match(/https?:\/\/\S+/)?.[0] ?? null;
    const titulo = url ? f.replace(url, "").replace(/[\s—–-]+$/, "").trim() : f.trim();
    return { titulo: titulo || url || "Fuente", url, respalda: null };
  }
  const url = texto(f.url ?? f.enlace ?? f.href);
  return {
    titulo: texto(f.titulo ?? f.fuente ?? f.title ?? f.nombre) ?? url ?? "Fuente",
    url,
    respalda: texto(f.respalda ?? f.campo),
    nota: texto(f.nota),
    consultado: texto(f.consultado),
  };
}

function normalizarEstado(e) {
  if (e == null) return null;

  // El tratamiento llega como frases ("Hoy: …", "Esta semana: …"). Se parte por
  // el primer dos puntos para separar el CUÁNDO de la acción: así el <ol> tiene
  // un plazo legible y el diagrama de recuperación tiene sus hitos.
  // `plan_recuperacion` trae {paso, senal, hito} y solo existe en las dos
  // tocadas; `tratamiento` es la lista llana y está en las siete.
  const plan = lista(e.plan_recuperacion)
    .map((x) => ({ accion: texto(x?.paso), senal: texto(x?.senal), plazo: texto(x?.hito) }))
    .filter((x) => x.accion);

  const pasos = plan.length > 0 ? plan : lista(e.tratamiento ?? e.que_hacer ?? e.acciones ?? e.plan)
    .map((p) => {
      if (typeof p !== "string") {
        return { accion: texto(p?.accion ?? p?.paso ?? p?.texto), plazo: texto(p?.plazo), senal: texto(p?.senal ?? p?.signo) };
      }
      const corte = p.indexOf(":");
      const posiblePlazo = corte > 0 ? p.slice(0, corte).trim() : "";
      // Solo es un plazo si es corto; si no, es una frase que llevaba dos puntos.
      const esPlazo = posiblePlazo.length > 0 && posiblePlazo.length <= 24 && !posiblePlazo.includes(".");
      return {
        accion: esPlazo ? p.slice(corte + 1).trim() : p.trim(),
        plazo: esPlazo ? posiblePlazo : null,
        senal: null,
      };
    })
    .filter((p) => p.accion);

  const revisar = texto(e.revisar_en ?? e.revisar);

  return {
    severidad: texto(e.severidad ?? e.nivel) ?? "atencion",
    fecha_foto: texto(e.fecha_foto),
    senales: lista(e.senales ?? e.señales).map(texto).filter(Boolean),
    causas: lista(e.causas_probables ?? e.causas).map(texto).filter(Boolean),
    no_visible: lista(e.no_visible_en_foto).map(texto).filter(Boolean),
    revisar_en: revisar,
    // Para el rótulo del diagrama hace falta algo corto ("3 semanas"), no el
    // párrafo entero: se toma lo que va antes del primer dos puntos si cabe.
    revisar_corto: revisar ? etiquetaCorta(revisar) : null,
    pasos,
  };
}

function etiquetaCorta(texto_) {
  const corte = texto_.indexOf(":");
  const cabeza = corte > 0 ? texto_.slice(0, corte).trim() : texto_;
  return cabeza.length <= 20 ? cabeza : null;
}

/**
 * La pegatina del vivero, tal y como la transcribió `botanist` en
 * `etiqueta_vivero`. Es transcripción de una foto, no dato verificado en fuente,
 * y la ficha lo dice.
 *
 * `helecho` y `poto` traen `etiqueta_vivero: null`: no es que falte el dato, es
 * que no hay pegatina. Los dos casos se distinguen a propósito.
 */
function normalizarVivero(p) {
  const e = objeto(p.etiqueta_vivero);
  const hay = p.etiqueta_vivero != null;

  // La begonia no es de Projardín: trae pasaporte fitosanitario de Almería.
  // El rótulo sale del dato, no de una constante escrita a mano.
  const emisor = texto(e.vivero) ?? texto(e.productor);
  const procedencia = texto(e.procedencia);

  return {
    tiene: hay,
    emisor,
    procedencia,
    nombre_etiqueta: texto(e.nombre_etiqueta),
    precio: formatearEuros(e.precio_eur),
    maceta: texto(e.maceta_texto) ?? (e.maceta_cm ? `Maceta ${e.maceta_cm} cm` : null),
    /* El número impreso NO es un EAN salvo en la begonia: «2040 2174» es
       código interno del vivero, de ocho dígitos. Se guardan por separado
       porque el rótulo que los acompaña no puede mentir. */
    ean: texto(e.ean),
    codigo: texto(e.codigo_vivero),
    pasaporte: texto(e.pasaporte_fitosanitario),
    fitosanitario: texto(e.fitosanitario ?? e.pasaporte_fitosanitario),
  };
}

/** 6.95 → «6,95 €». Coma decimal y espacio fino antes del símbolo, en español. */
function formatearEuros(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return texto(v);
  return `${n.toFixed(2).replace(".", ",")} €`;
}

/** `ubicacion` es un objeto, no una cadena: aplanarlo con String() daba
 *  «[object Object]» en el pie de la foto. */
function normalizarUbicacion(u) {
  if (u == null) return null;
  if (typeof u === "string") return texto(u);
  const partes = [texto(u.habitacion), texto(u.relacion_ventana)].filter(Boolean);
  return partes.length > 0 ? partes.join(" · ") : null;
}

/** Medidas numéricas para los diagramas. Todo opcional: sin dato, sin diagrama. */
function normalizarMedidas(p) {
  const luz = objeto(p.luz);
  const riego = objeto(p.riego);
  const temp = objeto(p.temperatura);
  return {
    riego: {
      profundidad_cm: riego.profundidad_seco_cm ?? riego.profundidad_cm ?? null,
      ml: p.riego_ml ?? riego.ml ?? riego.ml_aprox ?? null,
      dias_verano: riego.dias_verano ?? null,
      dias_invierno: riego.dias_invierno ?? null,
    },
    /* El eje interesante no es «en qué escalón vive» sino la DIFERENCIA entre
       lo que la especie pide y lo que recibe donde está: si recibe de más hay
       riesgo de quemadura, si recibe de menos hay déficit. */
    luz: {
      nivel_ideal: luz.nivel_ideal ?? luz.nivel ?? p.luz_nivel ?? null,
      nivel_actual: luz.nivel_actual ?? luz.nivel_recibido_estimado ?? null,
      categoria_ideal: texto(luz.categoria_ideal),
      categoria_recibida: texto(luz.categoria_recibida),
      tramos: Array.isArray(luz.tramos) ? luz.tramos : null,
      rusticidad: null,
      orientacion: texto(luz.orientacion_ventana ?? p.ventana ?? luz.orientacion),
      distancia_m: luz.distancia_m ?? objeto(p.ubicacion).distancia_m ?? null,
    },
    temperatura: {
      min_tolerado: temp.min_tolerado ?? temp.min_c ?? p.temp_min ?? null,
      max_tolerado: temp.max_tolerado ?? temp.max_c ?? p.temp_max ?? null,
      min_optimo: temp.optimo_min_c ?? temp.min_optimo ?? null,
      max_optimo: temp.optimo_max_c ?? temp.max_optimo ?? null,
      // `minima_letal_c` es null en las siete y es deliberado: RHS publica
      // bandas de rusticidad, no el grado al que se muere una planta.
      letal_min: temp.minima_letal_c ?? temp.letal_min ?? null,
      casa_invierno: temp.casa_invierno_c ?? temp.casa_invierno ?? null,
      casa_verano: temp.casa_verano_max_c ?? temp.casa_verano ?? null,
      rusticidad: texto(temp.rusticidad_rhs),
    },
  };
}

function objeto(v) {
  return v != null && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function normalizarToxicidad(t) {
  if (t == null) return { gatos: null, perros: null, nivel: null, texto: null, detalle: null, verificado: false };
  if (typeof t === "string") return { gatos: null, perros: null, nivel: null, texto: t.trim(), detalle: null, verificado: true };

  // El formato real distingue gatos de perros, y eso no se puede aplanar a un
  // "tóxica" genérico: quien tiene gato necesita leer gato.
  const gatos = texto(t.gatos);
  const perros = texto(t.perros);
  const porEspecie = [gatos && `Gatos: ${gatos}`, perros && `Perros: ${perros}`].filter(Boolean);

  return {
    clave: texto(t.clave),
    // Literales del JSON y no de la plantilla: una frase de seguridad no puede
    // depender de que alguien la transcriba bien en el render.
    aviso: texto(t.aviso),
    aviso_homonimo: texto(t.aviso_homonimo),
    gatos,
    perros,
    nivel: texto(t.nivel ?? t.severidad ?? t.toxica) ?? gatos ?? perros,
    texto: porEspecie.length > 0 ? porEspecie.join(" · ") : texto(t.resumen ?? t.texto),
    detalle: texto(t.detalle),
    verificado: porEspecie.length > 0 || Boolean(t.resumen ?? t.texto ?? t.detalle),
  };
}

/**
 * La temperatura no viene con `resumen`: viene con min_c y max_c. En vez de
 * pintar «sin dato» teniendo las dos cifras, se compone la frase — es
 * formateo de un dato verificado, no un dato inventado.
 */
function resumenTemperatura(t) {
  const min = objeto(t).min_c, max = objeto(t).max_c;
  if (min != null && max != null) return `Entre ${min} y ${max} °C`;
  if (min != null) return `Mínimo ${min} °C`;
  if (max != null) return `Máximo ${max} °C`;
  return null;
}

function normalizarPlanta(p) {
  const cuidados = new Map();
  for (const [clave, etiqueta] of CAMPOS_CUIDADO) {
    const campo = normalizarCampo(p[clave]);
    if (clave === "temperatura" && campo.resumen == null) {
      const compuesto = resumenTemperatura(p[clave]);
      if (compuesto) { campo.resumen = compuesto; campo.verificado = true; }
    }
    cuidados.set(clave, { clave, etiqueta, ...campo });
  }

  const foto = texto(p.foto);
  const etiquetaFoto = texto(p.foto_etiqueta ?? p.etiqueta);

  return {
    id: texto(p.id) ?? slug(p.nombre_comun ?? p.nombre_cientifico ?? "planta"),
    nombre_comun: texto(p.nombre_comun) ?? "Sin nombre común",
    nombre_cientifico: texto(p.nombre_cientifico),
    familia: texto(p.familia),
    // El JSON puede traer solo el nombre de fichero o una ruta ya hecha.
    foto: foto ? (foto.includes("/") ? foto : RUTA_IMG + foto) : null,
    foto_alt: texto(p.alt ?? p.foto_alt) ?? "",
    etiqueta_alt: texto(p.etiqueta_alt ?? p.alt_etiqueta),
    foto_etiqueta: etiquetaFoto
      ? (etiquetaFoto.includes("/") ? etiquetaFoto : RUTA_IMG + etiquetaFoto)
      : null,
    cuidados,
    plagas: lista(p.plagas_comunes)
      .map((x) => (typeof x === "object" && x !== null
        ? { nombre: texto(x.plaga ?? x.nombre), senal: texto(x.senal ?? x.señal), respuesta: texto(x.respuesta) }
        : { nombre: texto(x), senal: null, respuesta: null }))
      .filter((x) => x.nombre),
    toxicidad: normalizarToxicidad(p.toxicidad_mascotas),
    dificultad: texto(p.dificultad),
    nivel_luz: palabraNivelLuz(p.luz_nivel ?? p.nivel_luz ?? objeto(p.luz).nivel),
    historia: texto(p.historia),
    notas_carlos: texto(p.notas_carlos),
    notas: lista(p.notas).map((n) => ({ autor: texto(n?.autor), texto: texto(n?.texto) })).filter((n) => n.texto),
    ubicacion: normalizarUbicacion(p.ubicacion ?? p.donde ?? p.sala),
    fecha_llegada: texto(p.fecha_llegada),
    fecha_llegada_texto: texto(p.fecha_llegada_texto),
    dias_en_casa: p.dias_en_casa ?? null,
    manipulacion: objeto(p.manipulacion).resumen ? objeto(p.manipulacion) : null,
    procedencia_nota: texto(p.procedencia_nota ?? p.origen),
    vivero: normalizarVivero(p),
    medidas: normalizarMedidas(p),
    estado: normalizarEstado(p.estado),
    fuentes: lista(p.fuentes).map(normalizarFuente).filter(Boolean),
  };
}

/**
 * Orden del DOM: las tocadas primero, y dentro de eso por gravedad. El orden es
 * información — quien abre esto con prisa tiene delante lo que pide mirada. Se
 * ordena el DOM y no con `order` de CSS, para que el teclado siga el orden visual.
 */
const PESO_SEVERIDAD = ["critica", "urgente", "grave", "mal", "alerta", "atencion", "regular", "vigilar", "leve"];

export function ordenarPorUrgencia(plantas) {
  const peso = (p) => {
    if (!p.estado) return PESO_SEVERIDAD.length;
    const i = PESO_SEVERIDAD.indexOf(slug(p.estado.severidad));
    return i === -1 ? PESO_SEVERIDAD.length - 0.5 : i;
  };
  return [...plantas].sort(
    (a, b) => peso(a) - peso(b) || a.nombre_comun.localeCompare(b.nombre_comun, "es")
  );
}

/* ── utilidades ─────────────────────────────────────────────────────────────── */

function texto(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function lista(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

export function slug(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
