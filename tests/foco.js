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

  const SEL_FOCUSABLE = [
    'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
    'summary', 'details', 'audio[controls]', 'video[controls]', 'iframe',
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

  // --- 1. orden de foco vs orden visual ------------------------------------------------
  function orden() {
    const lista = enfocables().map((el, i) => {
      const r = el.getBoundingClientRect();
      return {
        i,
        el,
        selector: selector(el),
        tabindex: el.getAttribute('tabindex'),
        x: Math.round(r.left + window.scrollX),
        y: Math.round(r.top + window.scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
        area: Math.round(r.width * r.height),
      };
    });

    // orden visual: bandas horizontales de 24px, luego x
    const visual = [...lista].sort((a, b) => {
      const banda = Math.round(a.y / 24) - Math.round(b.y / 24);
      return banda !== 0 ? banda : a.x - b.x;
    });

    const saltos = [];
    visual.forEach((v, pos) => {
      if (v.i !== pos) saltos.push({ dom: v.i, visual: pos, selector: v.selector, y: v.y, x: v.x });
    });

    const problemas = [];
    if (saltos.length) {
      problemas.push(`${saltos.length} elemento(s) con orden de Tab distinto del orden visual`);
    }
    for (const it of lista) {
      if (it.tabindex && +it.tabindex > 0) problemas.push(`tabindex="${it.tabindex}" en ${it.selector}`);
      if (it.w < 24 || it.h < 24) problemas.push(`diana pequeña (${it.w}×${it.h}px, mínimo recomendado 24×24) en ${it.selector}`);
    }

    const informe = {
      ok: problemas.length === 0,
      total: lista.length,
      secuencia: lista.map((it) => `${it.i}. ${it.selector}  @${it.x},${it.y}`),
      saltos,
      problemas,
    };
    if (console.table) { console.log(informe.ok ? '✓ orden de foco' : '✗ orden de foco', `${lista.length} enfocables`); if (saltos.length) console.table(saltos); }
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
