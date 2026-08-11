/**
 * Búsqueda y filtrado. Funciones puras: datos entran, datos salen.
 *
 * Las facetas se **derivan de los datos**, no se hardcodean. Así el vocabulario
 * que use `botanist` en plantas.json (los valores de dificultad, de nivel de luz,
 * de severidad) aparece solo en el JSON y en ningún sitio más. Si cambia «facil»
 * por «fácil», la interfaz se entera sola.
 */

/** Dimensiones filtrables. `valor` extrae la clave de una planta; null = no aplica. */
export const DIMENSIONES = [
  {
    id: "estado",
    legend: "Cómo va",
    valor: (p) => p.estado?.severidad ?? "sana",
    // Las plantas tocadas primero: es el motivo por el que alguien abre esto con prisa.
    orden: ["critica", "grave", "mal", "alerta", "regular", "atencion", "vigilar", "sana"],
  },
  {
    id: "dificultad",
    legend: "Dificultad",
    valor: (p) => p.dificultad,
    orden: ["facil", "fácil", "media", "moderada", "exigente", "dificil", "difícil"],
  },
  {
    id: "luz",
    legend: "Luz que pide",
    valor: (p) => p.nivel_luz,
    orden: ["sombra", "semisombra", "luz indirecta", "luz filtrada", "mucha luz", "sol directo"],
  },
];

/** Estado inicial de los filtros: un Set vacío por dimensión. */
export function filtrosVacios() {
  return Object.fromEntries(DIMENSIONES.map((d) => [d.id, new Set()]));
}

export function hayFiltros(estado) {
  return (
    Boolean(estado.busqueda?.trim()) ||
    DIMENSIONES.some((d) => estado.filtros[d.id]?.size > 0)
  );
}

/**
 * Facetas disponibles con su recuento. Solo devuelve dimensiones que existan de
 * verdad en los datos: si `botanist` no rellena nivel de luz, ese grupo no se pinta
 * en vez de quedarse vacío.
 */
export function facetas(plantas) {
  return DIMENSIONES.map((d) => {
    const cuentas = new Map();
    for (const p of plantas) {
      const v = d.valor(p);
      if (v == null) continue;
      cuentas.set(v, (cuentas.get(v) ?? 0) + 1);
    }
    const opciones = [...cuentas.entries()]
      .map(([valor, cuenta]) => ({ valor, cuenta }))
      .sort((a, b) => posicion(d.orden, a.valor) - posicion(d.orden, b.valor));
    return { ...d, opciones };
  }).filter((d) => d.opciones.length > 1); // una sola opción no filtra nada
}

function posicion(orden, valor) {
  const i = orden.indexOf(normalizar(valor));
  return i === -1 ? orden.length : i;
}

/** Aplica búsqueda + facetas. AND entre dimensiones, OR dentro de cada una. */
export function filtrar(plantas, estado) {
  const consulta = normalizar(estado.busqueda ?? "");
  return plantas.filter((p) => {
    for (const d of DIMENSIONES) {
      const activos = estado.filtros[d.id];
      if (!activos || activos.size === 0) continue;
      const v = d.valor(p);
      if (v == null || !activos.has(v)) return false;
    }
    return consulta === "" || indice(p).includes(consulta);
  });
}

/* ── índice de búsqueda ─────────────────────────────────────────────────────── */

const CACHE = new WeakMap();

/**
 * Texto buscable de una planta, cacheado por objeto. Incluye nombre común,
 * binomio, familia, plagas y el resumen de cada cuidado: quien busca «araña»
 * espera encontrar la que tiene araña roja, no solo la que se llame así.
 */
function indice(p) {
  let cache = CACHE.get(p);
  if (cache === undefined) {
    const partes = [
      p.nombre_comun,
      p.nombre_cientifico,
      p.familia,
      p.dificultad,
      p.nivel_luz,
      p.ubicacion,
      p.estado?.titulo,
      p.estado?.diagnostico,
      ...p.plagas,
      ...[...p.cuidados.values()].map((c) => c.resumen),
    ];
    cache = normalizar(partes.filter(Boolean).join(" "));
    CACHE.set(p, cache);
  }
  return cache;
}

/** Minúsculas y sin tildes: buscar «begonia» debe encontrar «Begonia». */
export function normalizar(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Etiquetas de presentación. Los valores del JSON van sin tilde a propósito
 * (`atencion`, `critica`) para que comparar cadenas sea seguro; pero en pantalla
 * se escribe en español correcto. La clave sigue siendo la del JSON: esto solo
 * decide cómo se lee.
 */
const ETIQUETAS = new Map([
  ["critica", "Crítica"],
  ["atencion", "Atención"],
  ["sana", "Sana"],
  ["facil", "Fácil"],
  ["dificil", "Difícil"],
]);

/** «luz indirecta» → «Luz indirecta», para pintar el valor crudo del JSON. */
export function humanizar(valor) {
  const crudo = String(valor).replace(/[_-]+/g, " ").trim();
  const etiqueta = ETIQUETAS.get(normalizar(crudo));
  if (etiqueta) return etiqueta;
  return crudo.charAt(0).toUpperCase() + crudo.slice(1);
}
