/**
 * El store mínimo. Un objeto y una función que lo actualiza y avisa.
 *
 * El flujo va en una dirección: cambia el estado → se re-renderiza lo afectado.
 * Nunca «corregir» el DOM a mano después. Con esta página no hace falta más.
 */

export function crearEstado(inicial, alCambiar) {
  let estado = inicial;
  return {
    get valor() {
      return estado;
    },
    actualizar(cambios) {
      estado = { ...estado, ...cambios };
      alCambiar(estado);
    },
    /** Notifica sin cambiar nada: útil para el primer render. */
    refrescar() {
      alCambiar(estado);
    },
  };
}

/** Cinco líneas de setTimeout en lugar de una dependencia de 3 kB. */
export function debounce(fn, ms = 140) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
