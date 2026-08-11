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

/** Dimensiones de la foto de planta tras la conversión con sips. Todas las siete
 *  son 3:4 vertical, así que no hay caso especial. */
export const FOTO = { ancho: 900, alto: 1200 };

export async function cargarPlantas(url = "./content/plantas.json") {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar ${url}: ${res.status} ${res.statusText}`);

  const datos = await res.json();
  const crudas = Array.isArray(datos) ? datos : datos?.plantas;
  if (!Array.isArray(crudas)) {
    throw new Error("Formato inesperado en plantas.json: se esperaba un array de plantas");
  }
  return crudas.map(normalizarPlanta);
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
    titulo: texto(f.titulo ?? f.title ?? f.nombre) ?? url ?? "Fuente",
    url,
    respalda: texto(f.respalda ?? f.campo),
  };
}

function normalizarEstado(e) {
  if (e == null) return null;
  // Un paso puede ser una frase suelta o { accion, senal }. El brief pide la
  // señal observable por hito; si no llega, el paso sigue valiendo sin ella.
  const pasos = lista(e.que_hacer ?? e.acciones ?? e.plan)
    .map((p) =>
      typeof p === "string"
        ? { accion: p.trim(), senal: null }
        : { accion: texto(p?.accion ?? p?.paso ?? p?.texto), senal: texto(p?.senal ?? p?.señal ?? p?.signo) }
    )
    .filter((p) => p.accion);
  return {
    severidad: texto(e.severidad ?? e.nivel) ?? "atencion",
    titulo: texto(e.titulo ?? e.resumen) ?? "Necesita atención",
    diagnostico: texto(e.diagnostico ?? e.descripcion ?? e.detalle),
    revisar_en: texto(e.revisar_en ?? e.revisar),
    pasos,
  };
}

/** Datos de la etiqueta térmica del vivero. Helecho y poto no tienen etiqueta:
 *  no es un fallo, es que no existe el original. Se distingue de «falta el dato». */
function normalizarVivero(p) {
  const precio = texto(p.precio);
  const maceta = texto(p.maceta);
  const fito = texto(p.fitosanitario ?? p.p_fitosanitario);
  const ean = texto(p.ean);
  return {
    precio,
    maceta,
    fitosanitario: fito,
    ean,
    tiene: Boolean(precio || maceta || fito || ean || p.foto_etiqueta),
  };
}

/** Medidas numéricas para los diagramas. Todo opcional: sin dato, sin diagrama. */
function normalizarMedidas(p) {
  const luz = objeto(p.luz);
  const riego = objeto(p.riego);
  const temp = objeto(p.temperatura);
  return {
    riego: {
      profundidad_cm: p.riego_profundidad_cm ?? riego.profundidad_cm ?? null,
      ml: p.riego_ml ?? riego.ml ?? null,
    },
    luz: {
      orientacion: texto(p.ventana ?? p.orientacion ?? luz.orientacion ?? luz.ventana),
      distancia_m: p.distancia_ventana_m ?? luz.distancia_m ?? null,
    },
    temperatura: {
      min_tolerado: temp.min_tolerado ?? p.temp_min ?? null,
      max_tolerado: temp.max_tolerado ?? p.temp_max ?? null,
      min_optimo: temp.min_optimo ?? null,
      max_optimo: temp.max_optimo ?? null,
      letal_min: temp.letal_min ?? p.temp_letal ?? null,
      casa_invierno: temp.casa_invierno ?? p.casa_invierno ?? null,
      casa_verano: temp.casa_verano ?? p.casa_verano ?? null,
    },
  };
}

function objeto(v) {
  return v != null && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function normalizarToxicidad(t) {
  if (t == null) return { nivel: null, texto: null, verificado: false };
  if (typeof t === "string") return { nivel: null, texto: t.trim(), verificado: true };
  return {
    nivel: texto(t.nivel ?? t.severidad ?? t.toxica),
    texto: texto(t.resumen ?? t.texto ?? t.detalle),
    verificado: true,
  };
}

function normalizarPlanta(p) {
  const cuidados = new Map();
  for (const [clave, etiqueta] of CAMPOS_CUIDADO) {
    cuidados.set(clave, { clave, etiqueta, ...normalizarCampo(p[clave]) });
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
    foto_etiqueta: etiquetaFoto
      ? (etiquetaFoto.includes("/") ? etiquetaFoto : RUTA_IMG + etiquetaFoto)
      : null,
    cuidados,
    plagas: lista(p.plagas_comunes).map((x) => texto(typeof x === "object" ? x?.nombre : x)).filter(Boolean),
    toxicidad: normalizarToxicidad(p.toxicidad_mascotas),
    dificultad: texto(p.dificultad),
    nivel_luz: texto(p.luz_nivel ?? p.nivel_luz) ?? normalizarCampo(p.luz).nivel ?? null,
    historia: texto(p.historia),
    notas_carlos: texto(p.notas_carlos ?? p.notas),
    ubicacion: texto(p.ubicacion ?? p.donde ?? p.sala),
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
