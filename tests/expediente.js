/* tests/expediente.js — MyPlants / qa-visual
 *
 * Mide la geometría de las fichas desplegadas: cuánto del ancho se usa y cuánto miden
 * de alto. Las dos cosas en la misma pasada porque son el mismo problema visto por dos
 * lados — el diagnóstico se lee en una columna estrecha y a su derecha hay medio
 * kilómetro de nada, así que ocupar esa mitad **es** partir la altura.
 *
 * ── POR QUÉ ESTA VERSIÓN NO SE PARECE A LA PRIMERA ──────────────────────────────
 *
 * La primera versión medía contra «el objetivo de 2.400 px de `ux-lead`». **Ese
 * objetivo no existía.** `git grep` y `git log -S` sobre todo el historial lo sitúan
 * solo en `docs/qa/informe-2.md`, o sea en un informe mío que lo atribuía a `ux-lead`;
 * no está en `docs/brief.md`, ni en `docs/decisiones.md`, ni en ningún commit. El único
 * `2400` anterior en el repo es un límite de dimensiones de imagen en mi propio
 * `peso-assets.py`, que no tiene nada que ver.
 *
 * Lo escribí yo, se lo atribuí a otro, y sostuve un ALTA contra él durante dos pasadas.
 * Una cita se volvió fuente. Y el coste no lo pagué yo: lo pagó `builder`, que se pasó
 * la sesión rediseñando el expediente a dos columnas para acertar un número inventado.
 * Es la formulación del informe 2 aplicada a su autora — el coste de un falso positivo
 * en un equipo de agentes no es el de quien lo emite, es el del teammate al que manda a
 * arreglar lo que no está roto.
 *
 * Y había un segundo error de método, este puramente de instrumento: **se medía una
 * sola ficha.** `--abrir 0` abre la primera, y como la rejilla va ordenada por urgencia
 * la primera es siempre el helecho. `ux-lead` midió las siete y el helecho resultó ser
 * de las más cortas: begonia 4.727 px, ficus sano 4.109, helecho crítico 3.718. Muestreo
 * de uno sobre una población que varía, y encima el peor caso quedaba fuera. Esta
 * versión mide **las siete** y reporta el peor caso además del detalle.
 *
 * ── LOS DOS OBJETIVOS QUE SÍ ESTÁN DERIVADOS ────────────────────────────────────
 *
 * De `docs/brief.md` § "Los objetivos que sustituyen al de 2.400 px":
 *
 *   1. **Ocupación.** Ninguna ficha con más del **20 %** de sus bandas de 100 px donde
 *      el contenido pare antes del **62 %** del ancho disponible.
 *   2. **Altura en pantallas y por severidad**, a 1280×900: **≤ 3 pantallas (2.700 px)**
 *      en `critica` y `atencion`, **≤ 2 pantallas (1.800 px)** en `sana`.
 *
 * El segundo tiene dos tramos a propósito, y esa es la parte que mi número único hacía
 * imposible: un solo umbral para las siete obliga a que una planta sin problema y una
 * que se muere quepan en lo mismo, y la única forma de lograrlo es recortarle contenido
 * a la que lo necesita o inventárselo a la que no. La severidad manda en cuánto hay que
 * contar, así que tiene que estar en el objetivo.
 *
 * ── MÉTODO — por qué escanea tinta y no cajas ───────────────────────────────────
 *
 * `getBoundingClientRect()` de los elementos no sirve: un `<p>` de ancho completo cuya
 * línea de texto llena la mitad devuelve la caja entera y el hueco se vuelve invisible
 * para el instrumento. Aquí se mide la **tinta** — los rectángulos reales de los nodos
 * de texto vía `Range.getClientRects()`, más las cajas de `img`/`svg`— y se barre la
 * región en líneas horizontales de 4 px que luego se agrupan en las bandas de 100 px
 * del objetivo de `ux-lead`.
 *
 * SE ABSTIENE cuando no puede saber: sin fichas desplegadas devuelve `no_medible` con
 * el motivo en vez de inventar un cero.
 *
 * Uso:
 *   python3 tests/runner.py --abrir-fichas --alto 40000 --test expediente
 *   python3 tests/runner.py --abrir 0      --alto 6000  --test expediente   (una sola)
 */

(() => {
  'use strict';

  const BANDA = 100;            // alto de banda del objetivo de ocupación
  const CORTE_ANCHO = 0.62;     // el contenido debe pasar del 62% del ancho
  const MAX_BANDAS_CORTAS = 0.20;
  const PANTALLA = 900;         // el viewport en el que se derivó el objetivo
  const MAX_PANTALLAS = { critica: 3, atencion: 3, sana: 2 };
  const PASO = 4;

  const noMedible = (motivo, extra) => {
    const informe = Object.assign({
      ok: true, no_medible: true, motivo,
      resumen: 'no medible: ' + motivo,
    }, extra || {});
    console.log('· expediente — no medible:', motivo);
    window.qaExpediente = () => informe;
    return informe;
  };

  /* ── severidad por planta, desde el JSON ────────────────────────────────── */

  /* Hace falta para elegir el umbral de altura, y se toma el **peor** de todos los
     estados, no el vigente: una planta con histórico sigue contando como crítica
     mientras alguna observación lo diga. Es el mismo criterio que `severidadesDe()`
     en `js/datos.js`, y se replica aquí a propósito para no depender de que el
     render lo haya hecho bien — si el render se equivoca, quiero que se note. */
  const ORDEN_SEV = ['sana', 'atencion', 'critica'];
  const severidadPorPlanta = {};
  try {
    const x = new XMLHttpRequest();
    x.open('GET', './content/plantas.json', false);
    x.send(null);
    for (const p of (JSON.parse(x.responseText).plantas || [])) {
      let peor = 'sana';
      for (const e of (p.estados || [])) {
        const s = String(e && e.severidad || '').toLowerCase();
        if (ORDEN_SEV.indexOf(s) > ORDEN_SEV.indexOf(peor)) peor = s;
      }
      severidadPorPlanta[p.id] = peor;
    }
  } catch (e) { /* sin JSON se usa el umbral más permisivo y se anota */ }

  /* ── localizar las fichas desplegadas ───────────────────────────────────── */

  /* Las siete fichas son `<details name="planta">`, o sea el **acordeón exclusivo
     nativo**: el navegador cierra una cuando se abre otra, y no hay forma de tener
     dos abiertas a la vez. Es una buena decisión de `builder` —cero JS— pero obliga a
     medir de una en una, y de ahí sale el error de método de las pasadas 1 y 2:
     `--abrir 0` abre la primera, la rejilla va ordenada por urgencia, así que la
     primera es siempre el helecho. Se midió siete veces la misma planta creyendo
     medir "la ficha desplegada", y el peor caso quedó fuera todas las veces.

     Aquí se abre cada una, se mide, y se deja como estaba. `d.open = true` seguido de
     `getBoundingClientRect()` fuerza el layout de forma síncrona: el contenido ya está
     en el DOM —`<details>` solo lo oculta—, así que la geometría es la definitiva. Lo
     único que no ha corrido son las animaciones, y ninguna de ellas anima la altura. */
  const todas = [...document.querySelectorAll('details')]
    .filter((d) => d.closest('article'))
    .filter((d) => !d.parentElement.closest('details'));

  if (!todas.length) {
    return noMedible('no encuentro ningún <details> de ficha dentro de un <article>');
  }

  const estadoPrevio = todas.map((d) => d.open);

  const oculto = (el) => {
    const c = getComputedStyle(el);
    return c.display === 'none' || c.visibility === 'hidden' || parseFloat(c.opacity) === 0;
  };
  const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

  /* ── medir una ficha ────────────────────────────────────────────────────── */

  function medir(ficha) {
    const article = ficha.closest('article');
    const id = (article && article.id) || '';
    const nombre = ((article && article.querySelector('h3, h2')) || {}).textContent || id;
    const alto = ficha.getBoundingClientRect().height;

    const cuerpo = ficha.querySelector('.despegada') ||
      [...ficha.children].filter((c) => c.tagName !== 'SUMMARY')
        .sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0] || ficha;
    const region = cuerpo.getBoundingClientRect();
    const cs = getComputedStyle(cuerpo);
    const izq = region.left + (parseFloat(cs.paddingLeft) || 0);
    const der = region.right - (parseFloat(cs.paddingRight) || 0);
    const ancho = der - izq;
    if (ancho < 50 || region.height < 50) return null;

    // Tinta
    const tinta = [];
    const paseador = document.createTreeWalker(cuerpo, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        if (!p || oculto(p)) return NodeFilter.FILTER_REJECT;
        if (p.closest('.oculto-visual, [hidden], title, script, style')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n;
    while ((n = paseador.nextNode())) {
      const r = document.createRange();
      r.selectNodeContents(n);
      for (const rect of r.getClientRects()) if (rect.width > 0 && rect.height > 0) tinta.push(rect);
    }
    for (const el of cuerpo.querySelectorAll('img, svg, canvas, video')) {
      if (oculto(el) || (el.tagName.toLowerCase() !== 'svg' && el.closest('svg'))) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 2 && r.height > 2) tinta.push(r);
    }
    if (!tinta.length) return null;

    // Barrido de 4 px → hasta dónde llega la tinta en cada línea
    const lineas = [];
    const centrosX = [];
    for (let y = region.top; y < region.bottom; y += PASO) {
      let maxDer = -Infinity;
      for (const r of tinta) {
        if (r.top <= y && r.bottom >= y) {
          if (r.right > maxDer) maxDer = r.right;
          centrosX.push((Math.max(r.left, izq) + Math.min(r.right, der)) / 2);
        }
      }
      lineas.push(maxDer === -Infinity ? null : (maxDer - izq) / ancho);
    }

    /* Bandas de 100 px, que es la unidad del objetivo. Una banda cuenta como corta
       si su contenido —el punto más a la derecha de toda la banda— no pasa del 62 %
       del ancho. Se toma el máximo de la banda, no la media, porque una sola línea
       que llegue al final ya demuestra que el ancho se está usando ahí. */
    const porBanda = Math.max(1, Math.round(BANDA / PASO));
    const bandas = [];
    for (let i = 0; i < lineas.length; i += porBanda) {
      const trozo = lineas.slice(i, i + porBanda).filter((v) => v !== null);
      if (!trozo.length) continue;
      bandas.push(Math.max(...trozo));
    }
    const cortas = bandas.filter((v) => v < CORTE_ANCHO);
    const pctCortas = bandas.length ? cortas.length / bandas.length : 0;

    // Columnas de tinta de verdad: un grid declarado y sin repartir da 1.
    const CUBOS = 24;
    const histo = new Array(CUBOS).fill(0);
    for (const x of centrosX) {
      const i = Math.min(CUBOS - 1, Math.max(0, Math.floor(((x - izq) / ancho) * CUBOS)));
      histo[i] += 1;
    }
    const umbral = Math.max(...histo) * 0.15;
    let columnas = 0, dentro = false;
    histo.forEach((v) => {
      if (v > umbral && !dentro) { dentro = true; columnas += 1; }
      else if (v <= umbral) { dentro = false; }
    });

    const conTinta = lineas.filter((v) => v !== null);
    const severidad = severidadPorPlanta[id] || 'sana';
    const pantallas = alto / PANTALLA;
    const topePantallas = MAX_PANTALLAS[severidad] != null ? MAX_PANTALLAS[severidad] : 3;

    return {
      planta: id || String(nombre).trim().slice(0, 40),
      severidad,
      alto_px: Math.round(alto),
      pantallas: Number(pantallas.toFixed(2)),
      tope_pantallas: topePantallas,
      tope_px: topePantallas * PANTALLA,
      cumple_altura: pantallas <= topePantallas,
      ancho_region_px: Math.round(ancho),
      bandas: bandas.length,
      bandas_cortas: cortas.length,
      bandas_cortas_pct: Math.round(pctCortas * 100),
      cumple_ocupacion: pctCortas <= MAX_BANDAS_CORTAS,
      ocupacion_media_pct: Math.round(media(conTinta) * 100),
      columnas_de_tinta: columnas,
    };
  }

  /* Abrir → medir → siguiente, en el mismo paso. Separarlo en dos bucles no funciona:
     con el acordeón exclusivo, al abrir la segunda se cierra la primera, así que una
     lista de "fichas abiertas" recogida de antemano solo tiene abierta la última. */
  const medidas = [];
  const saltadas = [];
  for (const d of todas) {
    d.open = true;
    const alto = d.getBoundingClientRect().height;   // fuerza layout síncrono
    if (alto <= 400) {
      saltadas.push({
        planta: ((d.closest('article') || {}).id) || '?',
        alto_px: Math.round(alto),
        por_que: 'desplegada mide 400 px o menos: no parece haber llegado a pintar',
      });
      continue;
    }
    const m = medir(d);
    if (m) medidas.push(m); else saltadas.push({
      planta: ((d.closest('article') || {}).id) || '?', por_que: 'sin tinta medible',
    });
  }
  // Se deja el DOM como estaba: un test no puede dejar la página tocada para el
  // siguiente test de la misma pasada (`diagramas` corre después y mira lo desplegado).
  todas.forEach((d, i) => { d.open = estadoPrevio[i]; });

  if (!medidas.length) {
    return noMedible('ninguna ficha dio tinta medible', { saltadas });
  }

  /* ── veredicto ──────────────────────────────────────────────────────────── */

  const fallos = [];
  for (const m of medidas) {
    if (!m.cumple_ocupacion) {
      fallos.push({
        objetivo: 'ocupación (≤20% de bandas de 100px por debajo del 62% del ancho)',
        planta: m.planta,
        medido: m.bandas_cortas_pct + '% (' + m.bandas_cortas + ' de ' + m.bandas + ' bandas)',
        ocupacion_media: m.ocupacion_media_pct + '% del ancho',
        columnas_de_tinta: m.columnas_de_tinta,
        dueño: 'builder',
      });
    }
    if (!m.cumple_altura) {
      fallos.push({
        objetivo: 'altura por severidad (≤' + m.tope_pantallas + ' pantallas en ' + m.severidad + ')',
        planta: m.planta,
        medido: m.alto_px + ' px = ' + m.pantallas + ' pantallas',
        tope: m.tope_px + ' px',
        dueño: 'builder',
      });
    }
  }

  const peorAlto = medidas.slice().sort((a, b) => b.alto_px - a.alto_px)[0];
  const peorOcup = medidas.slice().sort((a, b) => b.bandas_cortas_pct - a.bandas_cortas_pct)[0];

  const informe = {
    ok: fallos.length === 0,
    resumen:
      `${medidas.length} ficha(s) · peor altura ${peorAlto.planta} ${peorAlto.alto_px} px ` +
      `(${peorAlto.pantallas} pantallas, tope ${peorAlto.tope_pantallas}) · ` +
      `peor ocupación ${peorOcup.planta} ${peorOcup.bandas_cortas_pct}% de bandas cortas ` +
      `(tope 20%) · ${fallos.length} fallo(s)`,
    objetivos: {
      ocupacion: '≤20% de bandas de 100px con el contenido parando antes del 62% del ancho',
      altura: '≤3 pantallas (2.700px) en critica/atencion · ≤2 (1.800px) en sana, a 1280×900',
      procedencia: 'docs/brief.md § "Los objetivos que sustituyen al de 2.400 px" (ux-lead, 4f1b350)',
      nota: 'el "objetivo de 2.400 px" de los informes 1 y 2 no existía: lo inventó qa-visual ' +
            'y se lo atribuyó a ux-lead. Retirado.',
    },
    fichas_medidas: medidas.length,
    fichas_en_el_dom: todas.length,
    saltadas,
    acordeon_exclusivo: todas.some((d) => d.hasAttribute('name')),
    peor_altura: peorAlto.planta,
    peor_ocupacion: peorOcup.planta,
    detalle: medidas.sort((a, b) => b.alto_px - a.alto_px),
    fallos,
  };

  console.log(informe.ok ? '✓ expediente' : '✗ expediente', informe.resumen);
  if (console.table) console.table(informe.detalle);
  if (fallos.length && console.table) console.table(fallos);
  window.qaExpediente = () => informe;
  return informe;
})();
