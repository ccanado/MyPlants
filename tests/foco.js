/* tests/foco.js — MyPlants / qa-visual
 *
 * Dos preguntas que solo se responden con el foco real:
 *   1. ¿El orden de Tab coincide con el orden visual? (izquierda→derecha, arriba→abajo)
 *   2. ¿El anillo de foco SE VE, con contraste >=3:1 contra la superficie donde aparece?
 *
 * Define tres funciones y no ejecuta nada destructivo al cargarse:
 *
 *   qaFoco.orden()   — lista los enfocables en orden de DOM con su posición, y avisa
 *                      de los saltos respecto al orden visual. No mueve el foco.
 *   qaFoco.actual()  — radiografía del elemento que TIENE el foco ahora mismo: anillo,
 *                      contraste del anillo, si está dentro del viewport. Se llama
 *                      después de cada Tab real (Playwright: browser_press_key Tab).
 *   qaFoco.recorrer()— recorre programáticamente con .focus() y devuelve el resumen.
 *                      Ojo: .focus() no siempre dispara :focus-visible; el recorrido
 *                      que vale como evidencia es el de teclado real. Esto es un cribado.
 *
 * Uso: ver docs/qa/como-ejecutar.md.
 */

(() => {
  'use strict';

  /* Ojo: `details` NO es enfocable — lo es su `summary`. Incluir los dos duplica
     cada disclosure y, al medir el espaciado entre dianas, cada `details` aparece
     como "vecino a 0 px" de su propio `summary`. */
  const SEL_FOCUSABLE = [
    'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
    'summary', 'audio[controls]', 'video[controls]', 'iframe',
    '[contenteditable]:not([contenteditable="false"])', '[tabindex]',
  ].join(',');

  // --- color (mismo motor que contraste.js, duplicado a propósito: cada fichero
  //     de tests tiene que poder pegarse solo en la consola) ---------------------------
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 1;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true });
  function parseColor(str) {
    if (!str || str === 'none' || str === 'transparent') return [0, 0, 0, 0];
    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = str;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    } catch (e) {
      return null;
    }
  }
  const lin = (c) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const componer = (f, b) => [f[0] * f[3] + b[0] * (1 - f[3]), f[1] * f[3] + b[1] * (1 - f[3]), f[2] * f[3] + b[2] * (1 - f[3]), 1];
  const redondea = (n) => Math.round(n * 100) / 100;

  function fondoDetras(el) {
    let n = el;
    const capas = [];
    while (n && n.nodeType === 1) {
      const c = parseColor(getComputedStyle(n).backgroundColor);
      if (c && c[3] > 0) { capas.push(c); if (c[3] >= 0.999) break; }
      n = n.parentElement;
    }
    let acc = [255, 255, 255, 1];
    for (let i = capas.length - 1; i >= 0; i--) acc = componer(capas[i], acc);
    return acc;
  }

  function selector(el) {
    if (!el || el.nodeType !== 1) return '?';
    if (el === document.body) return 'body';
    let p = el.tagName.toLowerCase();
    if (el.id) return `${p}#${el.id}`;
    const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (cls.length) p += '.' + cls.join('.');
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30);
    return t ? `${p} "${t}"` : p;
  }

  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  function enfocables() {
    return [...document.querySelectorAll(SEL_FOCUSABLE)].filter((el) => {
      if (el.disabled) return false;
      if (el.getAttribute('tabindex') === '-1') return false;
      if (el.closest('[inert], [hidden], [aria-hidden="true"]')) return false;
      return visible(el);
    });
  }

  /* La diana real de un checkbox oculto es su <label>, no el input de 1×1 px que
     está clipado. Medir el input y gritar "diana pequeña" es un falso positivo:
     lo que el usuario pulsa —y lo que tiene que medir 24×24— es la etiqueta. */
  function dianaDe(el) {
    let objetivo = el;
    if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
      const lb = (el.labels && el.labels[0]) || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`));
      if (lb) {
        const r = lb.getBoundingClientRect();
        if (r.width * r.height > el.getBoundingClientRect().width * el.getBoundingClientRect().height) objetivo = lb;
      }
    }
    const r = objetivo.getBoundingClientRect();
    return { rect: r, via: objetivo === el ? null : 'label', w: Math.round(r.width), h: Math.round(r.height) };
  }

  /* Un contenedor "de lectura": dentro de él el orden visual sí es arriba→abajo,
     izquierda→derecha. Entre contenedores el orden lo marca el contenedor. */
  const CONTENEDOR = 'li, article, fieldset, form, header, footer, nav, section, main, body';

  // --- 1. orden de foco vs orden visual ------------------------------------------------
  function orden() {
    const lista = enfocables().map((el, i) => {
      const r = el.getBoundingClientRect();
      const d = dianaDe(el);
      return {
        i, el,
        selector: selector(el),
        tabindex: el.getAttribute('tabindex'),
        contenedor: el.parentElement ? el.parentElement.closest(CONTENEDOR) : null,
        x: Math.round(r.left + window.scrollX),
        y: Math.round(r.top + window.scrollY),
        w: Math.round(r.width), h: Math.round(r.height),
        dianaW: d.w, dianaH: d.h, dianaVia: d.via,
      };
    });

    /* Comparar TODA la lista contra un orden "bandas horizontales" es incorrecto en
       una rejilla de tarjetas: dentro de cada ficha el contenido baja en vertical,
       y las fichas van una al lado de otra. Ordenar por bandas entrelazaría
       elementos de fichas distintas y marcaría cientos de saltos que no existen.
       Se compara por tanto DENTRO de cada contenedor, y luego los contenedores
       entre sí. Eso es lo que de verdad nota quien tabula. */
    const grupos = new Map();
    for (const it of lista) {
      const clave = it.contenedor || document.body;
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(it);
    }

    const saltos = [];
    const noComparables = [];
    for (const [cont, items] of grupos) {
      if (items.length < 2) continue;

      /* Si dentro del contenedor los enfocables se reparten en más de una columna,
         "arriba→abajo, izquierda→derecha" ya no es el orden de lectura: puede ser
         columna a columna. Un checker no puede distinguir las dos cosas, así que
         NO se inventa un veredicto — se marca para mirarlo con Tab de verdad.
         Afirmar un fallo aquí es justo lo que llenaría el informe de ruido. */
      const columnas = [...new Set(items.map((it) => Math.round(it.x / 32)))];
      if (columnas.length > 1) {
        noComparables.push({
          contenedor: selector(cont).slice(0, 50),
          enfocables: items.length,
          columnas: columnas.length,
          nota: 'reparte los enfocables en varias columnas: comprobar el orden con Tab real',
        });
        continue;
      }

      const visual = [...items].sort((a, b) => {
        const banda = Math.round(a.y / 16) - Math.round(b.y / 16);
        return banda !== 0 ? banda : a.x - b.x;
      });
      visual.forEach((v, pos) => {
        if (items[pos].i !== v.i) {
          saltos.push({
            contenedor: selector(cont).slice(0, 40),
            enDOM: items[pos].selector, seVePrimero: v.selector,
            y: v.y, x: v.x,
          });
        }
      });
    }

    // orden de los contenedores entre sí
    const cabezas = [...grupos.entries()]
      .map(([c, items]) => ({ c, primero: items[0] }))
      .filter((g) => g.primero);
    const saltosContenedor = [];
    for (let k = 1; k < cabezas.length; k++) {
      const a = cabezas[k - 1].primero;
      const b = cabezas[k].primero;
      // b va después en el DOM: no debería empezar claramente por encima de a
      if (b.y + 8 < a.y && Math.abs(b.x - a.x) < 4) {
        saltosContenedor.push({ de: selector(cabezas[k - 1].c), a: selector(cabezas[k].c), ya: a.y, yb: b.y });
      }
    }

    const problemas = [];
    if (saltos.length) problemas.push(`${saltos.length} elemento(s) con orden de Tab distinto del orden visual dentro de su contenedor`);
    if (saltosContenedor.length) problemas.push(`${saltosContenedor.length} contenedor(es) que se tabulan antes de lo que se ven`);
    /* WCAG 2.2 · 2.5.8 Target Size (Minimum), AA: 24×24 CSS px, PERO con dos
       excepciones que hay que aplicar o el informe se llena de ruido:
         · Inline: la diana va dentro de una frase y su alto lo fija el
           line-height del texto que la rodea.
         · Espaciado: aunque la diana sea menor, cumple si no hay otra diana a
           menos de 24 px — es decir, si cabe un círculo de 24 px sin solapar
           con la diana de al lado.
       Lo que no cumple ninguna de las dos sí se reporta. */
    const dianasPequenas = [];
    for (const it of lista) {
      if (it.tabindex && +it.tabindex > 0) problemas.push(`tabindex="${it.tabindex}" en ${it.selector}`);
      if (it.dianaW >= 24 && it.dianaH >= 24) continue;

      const cs = getComputedStyle(it.el);
      if (cs.display === 'inline') continue; // excepción "inline"

      // excepción de espaciado
      const r = it.el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let vecinoCerca = null;
      for (const otro of lista) {
        if (otro === it) continue;
        // un antepasado o un descendiente no es "la diana de al lado"
        if (otro.el.contains(it.el) || it.el.contains(otro.el)) continue;
        const o = otro.el.getBoundingClientRect();
        const ox = o.left + o.width / 2;
        const oy = o.top + o.height / 2;
        const d = Math.hypot(cx - ox, cy - oy);
        if (d < 24) { vecinoCerca = { selector: otro.selector, distancia: Math.round(d) }; break; }
      }
      if (!vecinoCerca) continue; // cumple por espaciado

      dianasPequenas.push({
        selector: it.selector, w: it.dianaW, h: it.dianaH,
        via: it.dianaVia, vecino: vecinoCerca,
      });
      problemas.push(
        `diana ${it.dianaW}×${it.dianaH}px < 24×24 y con otra diana a ${vecinoCerca.distancia}px ` +
        `(WCAG 2.2 · 2.5.8 AA)` + (it.dianaVia ? ' [medida sobre su <label>]' : '') + ` en ${it.selector}`
      );
    }

    const informe = {
      ok: problemas.length === 0,
      total: lista.length,
      resumen: `${lista.length} enfocables · ${saltos.length} salto(s) de orden · ${noComparables.length} bloque(s) multicolumna a mirar con Tab · ${problemas.length} problema(s)`,
      secuencia: lista.map((it) => `${it.i}. ${it.selector}  @${it.x},${it.y}`),
      saltos, saltosContenedor, noComparables, problemas, dianasPequenas,
    };
    if (console.table) { console.log(informe.ok ? '✓ orden de foco' : '✗ orden de foco', informe.resumen); if (saltos.length) console.table(saltos); }
    return informe;
  }

  // --- 2. radiografía del foco actual --------------------------------------------------
  function actual() {
    const el = document.activeElement;
    if (!el || el === document.body) return { foco: 'body — el foco no está en ningún control', ok: false };

    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const fondo = fondoDetras(el.parentElement || document.body);

    const anillos = [];
    const outlineW = parseFloat(cs.outlineWidth) || 0;
    if (outlineW > 0 && cs.outlineStyle !== 'none') {
      const c = parseColor(cs.outlineColor === 'invert' ? 'rgb(0,0,0)' : cs.outlineColor);
      if (c && c[3] > 0) {
        anillos.push({ tipo: 'outline', grosor: outlineW, color: cs.outlineColor, contraste: redondea(ratio(componer(c, fondo), fondo)) });
      }
    }
    if (cs.boxShadow && cs.boxShadow !== 'none') {
      const m = cs.boxShadow.match(/(rgba?\([^)]+\)|#[0-9a-f]{3,8}|oklch\([^)]+\)|color\([^)]+\))/i);
      const c = m ? parseColor(m[1]) : null;
      if (c && c[3] > 0) anillos.push({ tipo: 'box-shadow', grosor: null, color: m[1], contraste: redondea(ratio(componer(c, fondo), fondo)) });
    }
    if (cs.borderTopWidth && parseFloat(cs.borderTopWidth) > 0) {
      const c = parseColor(cs.borderTopColor);
      if (c && c[3] > 0) anillos.push({ tipo: 'border', grosor: parseFloat(cs.borderTopWidth), color: cs.borderTopColor, contraste: redondea(ratio(componer(c, fondo), fondo)) });
    }

    const dentroViewport = r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
    const mejor = anillos.reduce((a, b) => (b.contraste > (a ? a.contraste : 0) ? b : a), null);

    const problemas = [];
    if (!anillos.length) problemas.push('SIN indicador de foco visible (ni outline, ni box-shadow, ni border)');
    else if (!mejor || mejor.contraste < 3) problemas.push(`indicador de foco con contraste ${mejor ? mejor.contraste : 0}:1 contra su fondo — mínimo 3:1`);
    if (outlineW === 0 && /none/.test(cs.outline) && !anillos.length) problemas.push('outline:none sin sustituto');
    if (!dentroViewport) problemas.push('el elemento enfocado queda fuera del viewport — hay que hacer scroll para verlo');

    return {
      ok: problemas.length === 0,
      selector: selector(el),
      rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
      dentroViewport,
      matchesFocusVisible: (() => { try { return el.matches(':focus-visible'); } catch (e) { return null; } })(),
      anillos,
      outline: cs.outline,
      outlineOffset: cs.outlineOffset,
      boxShadow: cs.boxShadow.slice(0, 100),
      problemas,
    };
  }

  // --- 3. cribado programático ----------------------------------------------------------
  function recorrer() {
    const previo = document.activeElement;
    const lista = enfocables();
    const resultados = [];
    for (const el of lista) {
      el.focus({ preventScroll: true });
      const a = actual();
      resultados.push({ selector: a.selector, focusVisible: a.matchesFocusVisible, anillo: a.anillos[0] ? `${a.anillos[0].tipo} ${a.anillos[0].contraste}:1` : 'NINGUNO', problemas: a.problemas.join('; ') });
    }
    if (previo && previo.focus) previo.focus({ preventScroll: true });
    const malos = resultados.filter((r) => r.problemas);
    if (console.table) { console.log(malos.length ? '✗ anillo de foco' : '✓ anillo de foco', `${lista.length} elementos`); console.table(resultados); }
    return {
      ok: malos.length === 0,
      total: lista.length,
      resultados,
      nota: '.focus() programático no siempre activa :focus-visible. La evidencia buena es Tab real.',
    };
  }

  window.qaFoco = { orden, actual, recorrer, enfocables };
  console.log('qaFoco listo: qaFoco.orden() · qaFoco.actual() · qaFoco.recorrer()');
  return orden();
})();
