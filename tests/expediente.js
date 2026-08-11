/* tests/expediente.js — MyPlants / qa-visual
 *
 * Mide la geometría de la ficha desplegada, que es la única incidencia ALTA que
 * queda abierta desde el informe 1. Responde a dos preguntas que hasta el informe 2
 * se contestaban por separado y resultaron ser la misma:
 *
 *   1. ¿Cuánto mide de alto la ficha abierta?   (objetivo de ux-lead: 2.400 px)
 *   2. ¿Cuánto del ancho se queda sin usar?     (informe 2: el 50 %, 2.208 px de alto)
 *
 * El hallazgo del informe 2 fue que no son dos problemas: el diagnóstico se lee en
 * una columna de 557 px y a su derecha hay 600 px de nada durante 2.208 px de alto.
 * Ocupar esa mitad **es** partir la altura. Por eso este test mide las dos cosas en
 * la misma pasada y con el mismo instrumento: si una mejora y la otra no, el arreglo
 * no era el arreglo.
 *
 * MÉTODO — por qué escanea líneas y no cajas de elementos
 *
 * Medir `getBoundingClientRect()` de los elementos no sirve para esto: un `<p>` de
 * ancho completo cuya línea de texto solo llena la mitad devuelve la caja entera y
 * el hueco se vuelve invisible para el instrumento. Aquí se mide la **tinta**: los
 * rectángulos reales de los nodos de texto vía `Range.getClientRects()`, más las
 * cajas de `img`/`svg`/`canvas`. Después se barre la región en líneas horizontales
 * y en cada una se pregunta hasta dónde llega la tinta.
 *
 * Eso da tres números que se pueden defender:
 *   · `hueco_derecho_medio_pct`  — cuánto ancho sobra, de media, por línea
 *   · `superficie_vacia_pct`     — el área sin tinta a la derecha, sobre el total
 *   · `columnas`                 — cuántas columnas de tinta hay de verdad
 *
 * `columnas` es el que dice si el expediente a dos columnas está construido: si el
 * resultado es 1 columna, no lo está, por mucho que el CSS declare un `grid`.
 *
 * SE ABSTIENE cuando no puede saber. Si no encuentra ninguna ficha abierta no
 * inventa un cero: devuelve `no_medible` con el motivo. Un informe de QA con un
 * número inventado cuesta más que un informe sin número.
 *
 * Uso:
 *   python3 tests/runner.py --abrir 0 --alto 3000 --test expediente
 *   python3 tests/runner.py --abrir-todas --alto 5000 --test expediente
 */

(() => {
  'use strict';

  const OBJETIVO_ALTO = 2400;   // el que ux-lead se puso a sí mismo (docs/brief.md)
  const PASO = 4;               // px entre líneas de barrido
  const HUECO_SOSPECHOSO = 0.25; // >25% de ancho sin tinta = línea "media vacía"

  const noMedible = (motivo, extra) => {
    const informe = Object.assign({
      ok: true,              // abstenerse no es fallar: es no opinar
      no_medible: true,
      motivo,
      resumen: 'no medible: ' + motivo,
    }, extra || {});
    console.log('· expediente — no medible:', motivo);
    window.qaExpediente = () => informe;
    return informe;
  };

  /* ── 1. localizar la ficha abierta ──────────────────────────────────────── */

  // Se busca por estructura, no por clase: si builder renombra `.despegue`, el test
  // tiene que seguir funcionando en vez de reportar un falso "no hay ficha".
  const abiertos = [...document.querySelectorAll('details[open]')]
    .filter((d) => d.closest('article'))
    .filter((d) => d.getBoundingClientRect().height > 400);

  if (!abiertos.length) {
    return noMedible(
      'ninguna ficha desplegada. Lánzalo con --abrir 0 (o --abrir-todas)',
      { abiertos_encontrados: document.querySelectorAll('details[open]').length }
    );
  }

  // La más alta: si `--abrir-todas` ha abierto también los "Más detalle" internos,
  // el que interesa es el contenedor de la ficha, no un desplegable de un campo.
  abiertos.sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height);
  const ficha = abiertos[0];
  const article = ficha.closest('article');
  const planta = (article && (article.id ||
    (article.querySelector('h3, h2') || {}).textContent || '')).toString().trim().slice(0, 60);

  const rFicha = ficha.getBoundingClientRect();

  /* La región cuya ocupación se juzga es el cuerpo desplegado, no la ficha entera:
     la cabecera de la etiqueta (nombre, binomio, precio) tiene su propio diseño y
     su hueco a la derecha es intencionado. Si no se distingue el cuerpo, se mide la
     ficha completa y se dice en el informe. */
  const cuerpo = ficha.querySelector('.despegada') ||
                 [...ficha.children].filter((c) => c.tagName !== 'SUMMARY')
                   .sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0] ||
                 ficha;
  const region = cuerpo.getBoundingClientRect();
  const cs = getComputedStyle(cuerpo);
  const padIzq = parseFloat(cs.paddingLeft) || 0;
  const padDer = parseFloat(cs.paddingRight) || 0;
  const izq = region.left + padIzq;
  const der = region.right - padDer;
  const ancho = der - izq;

  if (ancho < 50 || region.height < 50) {
    return noMedible('la región desplegada mide ' + Math.round(ancho) + '×' +
                     Math.round(region.height) + ' px: no hay nada que medir todavía');
  }

  /* ── 2. recoger la tinta ────────────────────────────────────────────────── */

  const tinta = [];
  const oculto = (el) => {
    const c = getComputedStyle(el);
    return c.display === 'none' || c.visibility === 'hidden' || parseFloat(c.opacity) === 0;
  };

  // Nodos de texto: sus rectángulos reales, línea a línea. Es la diferencia entre
  // medir dónde está el texto y medir dónde podría estar.
  const paseador = document.createTreeWalker(cuerpo, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const p = n.parentElement;
      if (!p || oculto(p)) return NodeFilter.FILTER_REJECT;
      // El texto sólo para lector de pantalla no es tinta: no ocupa sitio visual.
      if (p.closest('.oculto-visual, [hidden], [aria-hidden="true"] title, title, script, style')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n;
  let nodosTexto = 0;
  while ((n = paseador.nextNode())) {
    const r = document.createRange();
    r.selectNodeContents(n);
    for (const rect of r.getClientRects()) {
      if (rect.width > 0 && rect.height > 0) tinta.push(rect);
    }
    nodosTexto += 1;
  }

  // Gráficos: sí valen por su caja, porque un SVG pinta en todo su lienzo.
  let graficos = 0;
  for (const el of cuerpo.querySelectorAll('img, svg, canvas, video')) {
    if (oculto(el)) continue;
    if (el.closest('svg') !== el && el.tagName.toLowerCase() !== 'svg' && el.closest('svg')) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) { tinta.push(r); graficos += 1; }
  }

  if (!tinta.length) {
    return noMedible('no se encontró tinta (ni texto ni gráficos) dentro de la región desplegada');
  }

  /* ── 3. barrer en líneas horizontales ───────────────────────────────────── */

  const y0 = region.top;
  const y1 = region.bottom;
  const lineas = [];
  const centrosX = [];

  for (let y = y0; y < y1; y += PASO) {
    let maxDer = -Infinity;
    let minIzq = Infinity;
    let conTinta = false;
    for (const r of tinta) {
      if (r.top <= y && r.bottom >= y) {
        conTinta = true;
        if (r.right > maxDer) maxDer = r.right;
        if (r.left < minIzq) minIzq = r.left;
        centrosX.push((Math.max(r.left, izq) + Math.min(r.right, der)) / 2);
      }
    }
    if (!conTinta) { lineas.push({ y, vacia: true }); continue; }
    const hueco = Math.max(0, der - maxDer);
    lineas.push({
      y,
      vacia: false,
      tintaHasta: maxDer,
      tintaDesde: minIzq,
      hueco,
      huecoPct: hueco / ancho,
    });
  }

  const conTinta = lineas.filter((l) => !l.vacia);
  if (!conTinta.length) {
    return noMedible('el barrido no cruzó ninguna línea con tinta');
  }

  const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const huecoMedioPct = media(conTinta.map((l) => l.huecoPct));
  const huecoMedioPx = media(conTinta.map((l) => l.hueco));
  const lineasMediaVacia = conTinta.filter((l) => l.huecoPct > HUECO_SOSPECHOSO);

  // Área sin tinta a la derecha, en px². Es el número que hizo entender el problema
  // en el informe 2 (1,3 millones de px² de rojo vacío).
  const superficieVacia = conTinta.reduce((a, l) => a + l.hueco * PASO, 0);
  const superficieRegion = ancho * region.height;

  /* ── 4. ¿cuántas columnas de tinta hay de verdad? ───────────────────────── */

  /* Un `grid` de dos columnas declarado en CSS puede estar pintando una sola si el
     contenido no se ha repartido. Se cuenta agrupando los centros horizontales de
     la tinta en cubos y buscando picos separados: si hay dos zonas densas con un
     valle entre ellas, hay dos columnas de verdad. */
  const CUBOS = 24;
  const histo = new Array(CUBOS).fill(0);
  for (const x of centrosX) {
    const i = Math.min(CUBOS - 1, Math.max(0, Math.floor(((x - izq) / ancho) * CUBOS)));
    histo[i] += 1;
  }
  const pico = Math.max(...histo);
  const umbral = pico * 0.15;
  let columnas = 0;
  let dentro = false;
  const zonas = [];
  histo.forEach((v, i) => {
    if (v > umbral && !dentro) { dentro = true; columnas += 1; zonas.push([i, i]); }
    else if (v > umbral && dentro) { zonas[zonas.length - 1][1] = i; }
    else if (v <= umbral) { dentro = false; }
  });

  /* ── 5. ancho de la prosa y caracteres por línea ────────────────────────── */

  /* El informe 2 dejó dicho que la columna estrecha NO es el fallo: 74 caracteres
     por línea es medida de lectura correcta. Se sigue midiendo para que, si el
     arreglo de la altura ensancha la prosa a 120 caracteres, se vea que se cerró
     una incidencia abriendo otra. */
  const parrafos = [...cuerpo.querySelectorAll('p, li, dd')]
    .filter((p) => !oculto(p) && (p.textContent || '').trim().length > 80);
  const anchosProsa = [];
  let cplMax = 0;
  for (const p of parrafos.slice(0, 120)) {
    const r = document.createRange();
    r.selectNodeContents(p);
    const rects = [...r.getClientRects()].filter((x) => x.width > 20);
    if (!rects.length) continue;
    const w = Math.max(...rects.map((x) => x.width));
    anchosProsa.push(w);
    const texto = (p.textContent || '').trim();
    const lineas_ = Math.max(1, rects.length);
    cplMax = Math.max(cplMax, Math.round(texto.length / lineas_));
  }

  // Continuidad con los informes 1 y 2, que contaron "párrafos/viñetas largos".
  const largos = [...cuerpo.querySelectorAll('p, li')]
    .filter((p) => !oculto(p) && (p.textContent || '').trim().length >= 200).length;

  /* ── 6. veredicto ───────────────────────────────────────────────────────── */

  const alto = Math.round(rFicha.height);
  const fallos = [];

  if (alto > OBJETIVO_ALTO) {
    fallos.push({
      que: 'la ficha desplegada supera el objetivo de alto',
      medido: alto + ' px',
      objetivo: OBJETIVO_ALTO + ' px',
      exceso_pct: Math.round(((alto - OBJETIVO_ALTO) / OBJETIVO_ALTO) * 100) + '%',
      dueño: 'builder',
    });
  }
  if (huecoMedioPct > HUECO_SOSPECHOSO) {
    fallos.push({
      que: 'la mitad derecha de la región desplegada está sin usar',
      hueco_medio: Math.round(huecoMedioPct * 100) + '% (' + Math.round(huecoMedioPx) + ' px)',
      lineas_media_vacia: lineasMediaVacia.length + ' de ' + conTinta.length,
      superficie_vacia: Math.round(superficieVacia).toLocaleString('es') + ' px²',
      dueño: 'builder',
    });
  }

  const informe = {
    ok: fallos.length === 0,
    resumen:
      `${planta || 'ficha'} · alto ${alto} px (objetivo ${OBJETIVO_ALTO}, ` +
      `${alto > OBJETIVO_ALTO ? '+' : ''}${Math.round(((alto - OBJETIVO_ALTO) / OBJETIVO_ALTO) * 100)}%) · ` +
      `hueco derecho medio ${Math.round(huecoMedioPct * 100)}% · ${columnas} columna(s) de tinta`,
    planta,
    alto_ficha_px: alto,
    objetivo_px: OBJETIVO_ALTO,
    exceso_pct: Math.round(((alto - OBJETIVO_ALTO) / OBJETIVO_ALTO) * 100),
    region: {
      ancho_px: Math.round(ancho),
      alto_px: Math.round(region.height),
      selector: cuerpo === ficha ? '(la ficha entera: no se distinguió el cuerpo)'
                                 : '.' + String(cuerpo.className).split(' ')[0],
    },
    hueco_derecho_medio_px: Math.round(huecoMedioPx),
    hueco_derecho_medio_pct: Math.round(huecoMedioPct * 100),
    lineas_barridas: lineas.length,
    lineas_con_tinta: conTinta.length,
    lineas_media_vacia: lineasMediaVacia.length,
    superficie_vacia_px2: Math.round(superficieVacia),
    superficie_vacia_pct: Math.round((superficieVacia / superficieRegion) * 100),
    columnas_de_tinta: columnas,
    zonas_de_tinta_pct: zonas.map(([a, b]) => Math.round((a / CUBOS) * 100) + '–' +
                                              Math.round(((b + 1) / CUBOS) * 100) + '%'),
    ancho_prosa_max_px: anchosProsa.length ? Math.round(Math.max(...anchosProsa)) : null,
    ancho_prosa_medio_px: anchosProsa.length ? Math.round(media(anchosProsa)) : null,
    caracteres_por_linea_max: cplMax || null,
    parrafos_largos_200: largos,
    nodos_texto: nodosTexto,
    graficos,
    fallos,
  };

  console.log(informe.ok ? '✓ expediente' : '✗ expediente', informe.resumen);
  if (fallos.length && console.table) console.table(fallos);
  window.qaExpediente = () => informe;
  return informe;
})();
