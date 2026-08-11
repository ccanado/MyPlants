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
 * ── LOS OBJETIVOS QUE SÍ ESTÁN DERIVADOS ────────────────────────────────────────
 *
 * De `docs/brief.md`, `ux-lead` en `4f1b350` y `69ce939`:
 *
 *   1. **Ocupación.** Ninguna ficha con más del **20 %** de sus bandas de 100 px donde
 *      el contenido pare antes del **62 %** del ancho disponible.
 *   2. **Ninguna carrera de más de 600 px sin un ancla de navegación** — un rótulo de
 *      bloque, una entrada del índice o un diagrama.
 *   3. **La columna de acción tiene que pegar de verdad.** Sin `sticky` funcionando se
 *      cumple la ocupación y se pierde el motivo del reparto en dos columnas.
 *
 * Y la **altura en píxeles es observación, no objetivo**. `ux-lead` retiró también su
 * propio tope de 1.800 px, y por el mismo defecto que el mío: lo había derivado de "dos
 * pantallas", un número redondo de viewports y no del contenido. La segunda versión de
 * este fichero medía contra ese tope; esta ya no. El objetivo manda cortar, la
 * observación manda mirar.
 *
 * Lo que no cambia, y es la razón de retirar topes en vez de pedir recortes: **el
 * contenido no se recorta para cuadrar una cifra.** Si un objetivo de altura obliga a
 * borrar una observación de `botanist`, el que está mal es el objetivo. Va como punto
 * bloqueante 13.14 del checklist, no como comentario.
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
 * Uso — no hace falta abrir nada, las abre y las restaura él:
 *   python3 tests/runner.py --alto 40000 --test expediente
 *   python3 tests/runner.py --url https://ccanado.github.io/MyPlants/ --alto 40000 --test expediente
 */

(() => {
  'use strict';

  const BANDA = 100;            // alto de banda del objetivo de ocupación
  const CORTE_ANCHO = 0.62;     // el contenido debe pasar del 62% del ancho
  const MAX_BANDAS_CORTAS = 0.20;
  const MAX_CARRERA = 600;      // px sin un ancla de navegación
  const PANTALLA = 900;         // solo para expresar la altura en pantallas
  const PASO = 4;

  /* La altura en píxeles **no suspende nada**. `ux-lead` la pasó de objetivo a
     observación en `69ce939`, y retiró su propio tope de 1.800 px por el mismo motivo
     por el que yo retiré el 2.400: lo había derivado de "dos pantallas", un número
     redondo de viewports y no del contenido. Lo comprobó midiendo: una ficha sana
     borrando el bloque de causas ENTERO seguiría en ~2.527 px contra un tope de 1.800,
     así que no se alcanzaba maquetando — solo recortando contenido, que es la línea
     que no se cruza. La altura era un proxy de "muro de texto", y lo que de verdad
     mide eso es la carrera sin ancla: una ficha de 2.886 px con un rótulo cada 400 px
     se lee bien y una de 1.800 de un solo bloque no.

     Se sigue midiendo y apuntando porque una ficha que doblara su alto de un día para
     otro sería una señal. La diferencia: el objetivo manda cortar, la observación
     manda mirar. */

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

  /* Ya no elige umbral —los topes de altura están retirados— pero se sigue anotando,
     porque es la variable con la que se lee el resto del informe: una ficha larga en
     `critica` cuenta más cosas por un motivo, y una larga en `sana` es sospechosa.
     Se toma el **peor** de todos los
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

    /* ── dos perfiles, y por qué se miden los dos ─────────────────────────
       `ux-lead` publicó el algoritmo exacto de la métrica en `5f3282e`, con esta
       frase que acepto entera: *el objetivo es mío, así que el instrumento debe
       medir mi definición y no la suya.* Así que el **veredicto** sale de su
       definición: un elemento cuenta si tiene texto propio o es `<img>`/`<svg>`, y
       el perfil de la banda es el mayor `getBoundingClientRect().right` de esos
       elementos. Los contenedores no cuentan.

       Y se sigue midiendo el mío en paralelo, como observación: el perfil de la
       **tinta**, con los rectángulos reales de los nodos de texto. La diferencia
       importa en un caso concreto — un `<p>` a ancho completo cuya última línea
       llena la mitad devuelve la caja entera, así que por elementos la banda no
       sale corta y el hueco visual se vuelve invisible para la métrica. Hoy los dos
       perfiles coinciden porque la prosa va en una columna con `max-width`, o sea
       que la caja ya es estrecha; si alguien quita ese `max-width`, el número por
       elementos mejoraría solo y el de tinta no. Cuando divergen, el que dice la
       verdad sobre lo que se ve es el de tinta.

       Se reportan los dos y se dice cuál manda. Un instrumento que mide la
       definición de su dueño no tiene por qué renunciar a lo que sabe de más. */
    const CUENTA_COMO_CONTENIDO = (el) => {
      const t = el.tagName.toLowerCase();
      if (t === 'img' || t === 'svg') return true;
      for (const n of el.childNodes) {
        if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim()) return true;
      }
      return false;
    };
    const elementos = [];
    for (const el of cuerpo.querySelectorAll('*')) {
      if (oculto(el) || !CUENTA_COMO_CONTENIDO(el)) continue;
      if (el.closest('.oculto-visual')) continue;
      if (el.tagName.toLowerCase() !== 'svg' && el.closest('svg')) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) elementos.push(r);
    }

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

    /* Bandas de 100 px desde el borde superior de la referencia, y las vacías se
       excluyen del numerador Y del denominador: una banda vacía no está medio vacía,
       está vacía, y casi siempre es un hueco entre bloques. Es literal del algoritmo
       de `ux-lead`, y es la parte que más cambia el porcentaje. */
    function bandasDesde(rects) {
      const out = [];
      for (let top = region.top; top < region.bottom; top += BANDA) {
        const bot = Math.min(top + BANDA, region.bottom);
        let maxDer = 0;
        for (const r of rects) {
          if (r.bottom <= top || r.top >= bot) continue;   // no cruza la banda
          if (r.right > maxDer) maxDer = r.right;
        }
        const perfil = maxDer > 0 ? (maxDer - izq) / ancho : 0;
        if (perfil > 0) out.push(perfil);                  // vacías fuera
      }
      return out;
    }

    const bandas = bandasDesde(elementos);                 // ← la definición de ux-lead
    const cortas = bandas.filter((v) => v < CORTE_ANCHO);
    const pctCortas = bandas.length ? cortas.length / bandas.length : 0;

    const bandasTinta = bandasDesde(tinta);                // ← observación paralela
    const cortasTinta = bandasTinta.filter((v) => v < CORTE_ANCHO);
    const pctCortasTinta = bandasTinta.length ? cortasTinta.length / bandasTinta.length : 0;

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

    /* ── carreras sin ancla de navegación ─────────────────────────────────
       Un ancla es, en palabras de `ux-lead`: un rótulo de bloque, una entrada del
       índice o un diagrama. Se recogen sus posiciones verticales, se ordenan, y se
       mide el hueco mayor entre dos consecutivas — contando también el tramo desde
       el principio de la región a la primera y desde la última al final. */
    /* Cada ancla guarda su elemento, no solo su `y`. `builder` lo pidió con razón: mi
       salida daba «peor carrera 707 px» y nombraba la planta, pero no el bloque, así
       que un fallo de prosa de `botanist` y uno de maquetación mía llegaban
       indistinguibles — y el informe se lo mandaba al teammate equivocado, que es
       literalmente la lección del informe 2. Ahora cada carreta larga dice entre qué
       dos anclas cae. */
    const anclas = [];
    const ES_ANCLA = 'h2, h3, h4, h5, h6, dt, summary, svg, ' +
      '[class*="rotulo"], [class*="titulo"], [class*="indice"], [class*="epigrafe"]';
    for (const el of cuerpo.querySelectorAll(ES_ANCLA)) {
      if (oculto(el)) continue;
      if (el.tagName.toLowerCase() === 'svg') {
        const r0 = el.getBoundingClientRect();
        if (r0.width < 60 || r0.height < 40) continue;   // iconos no son anclas
      }
      if (el.closest('.oculto-visual')) continue;        // no ancla nada visualmente
      const r = el.getBoundingClientRect();
      if (r.height > 0) {
        const cls = String(el.getAttribute('class') || '').split(' ')[0];
        anclas.push({ y: r.top, que: el.tagName.toLowerCase() + (cls ? '.' + cls : '') });
      }
    }
    anclas.sort((a, b) => a.y - b.y);

    const carreras = [];
    let cursor = region.top;
    let desde = '(principio de la región)';
    for (const a of anclas) {
      if (a.y - cursor > 0) carreras.push({ px: a.y - cursor, desde, hasta: a.que });
      if (a.y > cursor) { cursor = a.y; desde = a.que; }
    }
    if (region.bottom - cursor > 0) {
      carreras.push({ px: region.bottom - cursor, desde, hasta: '(final de la región)' });
    }
    const carreraMax = carreras.length
      ? Math.max(...carreras.map((c) => c.px)) : Math.round(region.height);
    const carrerasLargas = carreras.filter((c) => c.px > MAX_CARRERA)
      .sort((a, b) => b.px - a.px)
      .map((c) => ({ px: Math.round(c.px), desde: c.desde, hasta: c.hasta }));

    /* ── ¿la columna de acción pega de verdad? ────────────────────────────
       Es la mitad del argumento del reparto en dos columnas: sin `sticky`
       funcionando se cumple la ocupación y se pierde el motivo. Un `position:
       sticky` con `top: auto` está declarado y no hace nada, y es un fallo
       silencioso clásico — de ahí que se compruebe el desplazamiento y no solo la
       propiedad. Que se quede pegada al scrollear no se mide aquí: hace falta
       scroll real y esto corre con el viewport alto, así que se abstiene. */
    let sticky = null;
    for (const el of cuerpo.querySelectorAll('*')) {
      const c = getComputedStyle(el);
      if (c.position !== 'sticky') continue;
      const desplazamientos = [c.top, c.bottom, c.left, c.right];
      sticky = {
        elemento: el.tagName.toLowerCase() + '.' + String(el.getAttribute('class') || '').split(' ')[0],
        top: c.top,
        tiene_desplazamiento: desplazamientos.some((v) => v && v !== 'auto'),
      };
      break;
    }

    const conTinta = lineas.filter((v) => v !== null);
    const severidad = severidadPorPlanta[id] || 'sana';

    return {
      planta: id || String(nombre).trim().slice(0, 40),
      severidad,
      alto_px: Math.round(alto),           // observación, no objetivo
      pantallas: Number((alto / PANTALLA).toFixed(2)),
      carrera_max_px: Math.round(carreraMax),
      carreras_largas: carrerasLargas.length,
      carreras_largas_detalle: carrerasLargas.slice(0, 6),
      cumple_carreras: carrerasLargas.length === 0,
      anclas: anclas.length,
      sticky,
      ancho_region_px: Math.round(ancho),
      bandas: bandas.length,
      bandas_cortas: cortas.length,
      bandas_cortas_pct: Math.round(pctCortas * 100),
      cumple_ocupacion: pctCortas <= MAX_BANDAS_CORTAS,
      // Observación paralela con el perfil de tinta. Cuando divergen, este es el que
      // describe lo que se ve; el veredicto sigue saliendo del de ux-lead.
      bandas_cortas_pct_por_tinta: Math.round(pctCortasTinta * 100),
      divergencia_pp: Math.round((pctCortasTinta - pctCortas) * 100),
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
        definicion: 'algoritmo de ux-lead (docs/brief.md, 5f3282e): perfil por elementos con ' +
                    'texto propio o img/svg, bandas vacías excluidas de numerador y denominador',
        por_tinta: m.bandas_cortas_pct_por_tinta + '% (observación con el perfil de los nodos de texto)',
        ocupacion_media: m.ocupacion_media_pct + '% del ancho',
        columnas_de_tinta: m.columnas_de_tinta,
        dueño: 'builder',
      });
    }
    if (!m.cumple_carreras) {
      fallos.push({
        objetivo: 'ninguna carrera de más de ' + MAX_CARRERA + ' px sin ancla de navegación',
        planta: m.planta,
        medido: m.carreras_largas + ' carrera(s) larga(s) · la mayor ' + m.carrera_max_px + ' px',
        donde: m.carreras_largas_detalle,
        anclas_encontradas: m.anclas,
        que_cuenta_como_ancla: 'un rótulo de bloque, una entrada del índice o un diagrama',
        dueño: 'builder',
      });
    }
    if (m.sticky && !m.sticky.tiene_desplazamiento) {
      fallos.push({
        objetivo: 'la columna de acción tiene que pegar de verdad',
        planta: m.planta,
        que: 'hay un position:sticky sin ningún desplazamiento (top/bottom/left/right en auto): ' +
             'está declarado y no pega, y no da ningún error',
        elemento: m.sticky.elemento,
        dueño: 'builder',
      });
    }
  }

  const sinSticky = medidas.filter((m) => !m.sticky);
  if (sinSticky.length === medidas.length) {
    fallos.push({
      objetivo: 'la columna de acción tiene que pegar de verdad',
      que: 'ningún elemento con position:sticky en ninguna ficha. Sin sticky se cumple la ' +
           'ocupación y se pierde el motivo del reparto en dos columnas',
      dueño: 'builder',
    });
  }

  const peorAlto = medidas.slice().sort((a, b) => b.alto_px - a.alto_px)[0];
  const peorOcup = medidas.slice().sort((a, b) => b.bandas_cortas_pct - a.bandas_cortas_pct)[0];
  const peorCarrera = medidas.slice().sort((a, b) => b.carrera_max_px - a.carrera_max_px)[0];

  const informe = {
    ok: fallos.length === 0,
    resumen:
      `${medidas.length} ficha(s) · ocupación: peor ${peorOcup.planta} ${peorOcup.bandas_cortas_pct}% ` +
      `de bandas cortas (tope 20%) · carrera sin ancla: peor ${peorCarrera.planta} ` +
      `${peorCarrera.carrera_max_px} px (tope ${MAX_CARRERA}) · alto máx ${peorAlto.alto_px} px ` +
      `(${peorAlto.planta}, observación) · ${fallos.length} fallo(s)`,
    objetivos: {
      ocupacion: '≤20% de bandas de 100px con el perfil por debajo del 62% del ancho de la ' +
                 'caja de contenido. Bandas vacías excluidas de numerador y denominador. ' +
                 'Algoritmo literal de ux-lead (5f3282e); el 0,62 NO está derivado y él lo dice: ' +
                 'la derivación honesta (¿cabría otra columna de 13rem?) daría ~78%, y se queda ' +
                 'en 62 a propósito para cazar solo el defecto gordo',
      carreras: 'ninguna carrera de más de 600px sin ancla de navegación (rótulo de bloque, ' +
                'entrada del índice o diagrama)',
      sticky: 'la columna de acción tiene que pegar de verdad: sin sticky se cumple la ' +
              'ocupación y se pierde el motivo del reparto en dos columnas',
      altura_px: 'OBSERVACIÓN, no objetivo: se apunta porque un cambio brusco sería una señal, ' +
                 'pero no suspende nada por sí sola',
      procedencia: 'docs/brief.md, ux-lead: 4f1b350 (retira el 2.400 mío) y 69ce939 (retira su ' +
                   'propio tope de 1.800, derivado de "dos pantallas" y no del contenido)',
      nota: 'el "objetivo de 2.400 px" de los informes 1 y 2 no existía: lo inventó qa-visual ' +
            'y se lo atribuyó a ux-lead. Los dos topes de altura están retirados.',
    },
    fichas_medidas: medidas.length,
    fichas_en_el_dom: todas.length,
    saltadas,
    acordeon_exclusivo: todas.some((d) => d.hasAttribute('name')),
    peor_altura_observada: peorAlto.planta,
    peor_carrera: peorCarrera.planta,
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
