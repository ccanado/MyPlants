/* tests/contraste.js — MyPlants / qa-visual
 *
 * Mide el contraste WCAG real de la página: no los tokens sobre el papel, sino el
 * color computado de cada texto contra el fondo que de verdad tiene debajo, con las
 * transparencias compuestas. Es la comprobación que nadie hace a ojo y donde siempre
 * hay fallos: un color-mix() con hover, un texto secundario sobre superficie elevada,
 * el badge de "tóxica" sobre su propio fondo.
 *
 * Se ejecuta en el navegador. Ver docs/qa/como-ejecutar.md.
 *   - DevTools: pegar el fichero entero en la consola.
 *   - Playwright MCP: browser_evaluate con  () => { <pegar cuerpo>; return qaContraste(); }
 *
 * Umbrales WCAG 2.2 AA:
 *   texto normal            >= 4.5
 *   texto grande (>=24px, o >=18.66px con weight>=700)  >= 3.0
 *   bordes de controles y elementos gráficos informativos >= 3.0
 *
 * Limitaciones honestas (las reporta, no las esconde):
 *   - background-image / gradiente detrás del texto -> "no medible", hay que mirarlo a ojo.
 *   - opacity < 1 en un ancestro -> "no medible" con exactitud.
 *   - mix-blend-mode / backdrop-filter -> "no medible".
 */

(() => {
  'use strict';

  const UMBRAL_NORMAL = 4.5;
  const UMBRAL_GRANDE = 3.0;
  const UMBRAL_GRAFICO = 3.0;

  // --- parseo de color: canvas resuelve cualquier sintaxis (oklch, color(), lab...) ----
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 1;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true });

  const cacheColor = new Map();
  function parseColor(str) {
    if (!str) return null;
    const s = String(str).trim();
    if (s === 'transparent' || s === 'none') return [0, 0, 0, 0];
    if (cacheColor.has(s)) return cacheColor.get(s);
    let out = null;
    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';
      ctx.fillStyle = s;
      // si el navegador no supo parsearlo, fillStyle se queda en el valor anterior
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      out = [d[0], d[1], d[2], d[3] / 255];
    } catch (e) {
      out = null;
    }
    cacheColor.set(s, out);
    return out;
  }

  // --- luminancia y ratio WCAG ---------------------------------------------------------
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const luminancia = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  function ratio(a, b) {
    const l1 = luminancia(a);
    const l2 = luminancia(b);
    const hi = Math.max(l1, l2);
    const lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  // color `frente` (con alpha) compuesto sobre `fondo` (opaco)
  function componer(frente, fondo) {
    const a = frente[3];
    return [
      frente[0] * a + fondo[0] * (1 - a),
      frente[1] * a + fondo[1] * (1 - a),
      frente[2] * a + fondo[2] * (1 - a),
      1,
    ];
  }

  // --- fondo efectivo: sube por los ancestros componiendo capas -------------------------
  function fondoEfectivo(el) {
    const capas = [];
    const motivos = [];
    let nodo = el;
    while (nodo && nodo.nodeType === 1) {
      const cs = getComputedStyle(nodo);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        motivos.push(`background-image en ${selector(nodo)}`);
      }
      if (parseFloat(cs.opacity) < 1 && nodo !== el) {
        motivos.push(`opacity ${cs.opacity} en ${selector(nodo)}`);
      }
      if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') {
        motivos.push(`mix-blend-mode ${cs.mixBlendMode} en ${selector(nodo)}`);
      }
      if (cs.backdropFilter && cs.backdropFilter !== 'none') {
        motivos.push(`backdrop-filter en ${selector(nodo)}`);
      }
      const c = parseColor(cs.backgroundColor);
      if (c && c[3] > 0) {
        capas.push(c);
        if (c[3] >= 0.999) break;
      }
      nodo = nodo.parentElement;
    }
    // fondo del lienzo por debajo de todo
    const base = parseColor(getComputedStyle(document.documentElement).backgroundColor);
    let acumulado = base && base[3] >= 0.999 ? base : [255, 255, 255, 1];
    for (let i = capas.length - 1; i >= 0; i--) acumulado = componer(capas[i], acumulado);
    return { color: acumulado, motivos };
  }

  // --- utilidades ----------------------------------------------------------------------
  function selector(el) {
    if (!el || el.nodeType !== 1) return '?';
    if (el === document.body) return 'body';
    const partes = [];
    let n = el;
    let saltos = 0;
    while (n && n.nodeType === 1 && saltos < 4) {
      let p = n.tagName.toLowerCase();
      if (n.id) {
        partes.unshift(`${p}#${n.id}`);
        break;
      }
      const cls = (n.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
      if (cls.length) p += '.' + cls.join('.');
      partes.unshift(p);
      n = n.parentElement;
      saltos++;
    }
    return partes.join(' > ');
  }

  function visible(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    if (el.closest('[hidden], [aria-hidden="true"]')) return false;
    return true;
  }

  function textoPropio(el) {
    let t = '';
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    return t.replace(/\s+/g, ' ').trim();
  }

  const redondea = (n) => Math.round(n * 100) / 100;
  const hex = ([r, g, b]) =>
    '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

  // --- 1. contraste de texto -----------------------------------------------------------
  function comprobarTexto() {
    const fallos = [];
    const noMedibles = [];
    let medidos = 0;

    for (const el of document.querySelectorAll('body *')) {
      const texto = textoPropio(el);
      if (!texto || !visible(el)) continue;

      const cs = getComputedStyle(el);
      const px = parseFloat(cs.fontSize);
      const peso = parseInt(cs.fontWeight, 10) || 400;
      const grande = px >= 24 || (px >= 18.66 && peso >= 700);
      const umbral = grande ? UMBRAL_GRANDE : UMBRAL_NORMAL;

      const { color: fondo, motivos } = fondoEfectivo(el);
      const crudo = parseColor(cs.color);
      if (!crudo) continue;
      const texto_c = crudo[3] < 1 ? componer(crudo, fondo) : crudo;
      const r = ratio(texto_c, fondo);
      medidos++;

      const registro = {
        selector: selector(el),
        muestra: texto.slice(0, 60),
        color: hex(texto_c),
        fondo: hex(fondo),
        px: redondea(px),
        peso,
        grande,
        ratio: redondea(r),
        exige: umbral,
      };

      if (motivos.length) {
        noMedibles.push({ ...registro, motivos: [...new Set(motivos)] });
        continue;
      }
      if (r < umbral) fallos.push(registro);
    }

    fallos.sort((a, b) => a.ratio - b.ratio);
    return { medidos, fallos, noMedibles };
  }

  // --- 2. bordes de controles y elementos gráficos informativos ------------------------
  function comprobarControles() {
    const fallos = [];
    const sel = 'button, input, select, textarea, [role="button"], [role="tab"], [role="switch"], summary';
    for (const el of document.querySelectorAll(sel)) {
      if (!visible(el)) continue;
      const cs = getComputedStyle(el);
      const { color: fondoFuera } = fondoEfectivo(el.parentElement || document.body);

      for (const lado of ['Top', 'Right', 'Bottom', 'Left']) {
        const w = parseFloat(cs[`border${lado}Width`]);
        if (!w || cs[`border${lado}Style`] === 'none') continue;
        const c = parseColor(cs[`border${lado}Color`]);
        if (!c || c[3] === 0) continue;
        const compuesto = c[3] < 1 ? componer(c, fondoFuera) : c;
        const r = ratio(compuesto, fondoFuera);
        if (r < UMBRAL_GRAFICO) {
          fallos.push({
            selector: selector(el),
            lado: lado.toLowerCase(),
            borde: hex(compuesto),
            fondo: hex(fondoFuera),
            ratio: redondea(r),
            exige: UMBRAL_GRAFICO,
          });
        }
        break; // un lado basta para el diagnóstico
      }
    }
    return fallos;
  }

  // --- 3. estados derivados: hover / focus / disabled ----------------------------------
  // No se pueden forzar desde JS. Se listan las reglas de CSS que los definen para que
  // qa-visual las mida a mano con Playwright (hover real) o con browser_evaluate tras :focus.
  function estadosPendientes() {
    const reglas = [];
    for (const hoja of document.styleSheets) {
      let lista;
      try {
        lista = hoja.cssRules;
      } catch (e) {
        continue; // hoja de otro origen: no debería haber ninguna en este proyecto
      }
      const recorre = (rs) => {
        for (const r of rs) {
          if (r.cssRules) recorre(r.cssRules);
          const s = r.selectorText;
          if (s && /:hover|:focus|:disabled|\[aria-\w+="true"\]|\[disabled\]/.test(s)) {
            const cuerpo = r.style && r.style.cssText ? r.style.cssText : '';
            if (/color|background|border|outline|fill|stroke/.test(cuerpo)) {
              reglas.push({ selector: s, declara: cuerpo.slice(0, 120) });
            }
          }
        }
      };
      recorre(lista);
    }
    return reglas;
  }

  // --- salida --------------------------------------------------------------------------
  function qaContraste() {
    const texto = comprobarTexto();
    const controles = comprobarControles();
    const pendientes = estadosPendientes();
    const ok = texto.fallos.length === 0 && controles.length === 0;

    const informe = {
      ok,
      resumen:
        `${texto.medidos} nodos de texto medidos · ${texto.fallos.length} por debajo de AA · ` +
        `${controles.length} borde(s) de control < 3:1 · ${texto.noMedibles.length} no medible(s)`,
      texto_fallos: texto.fallos,
      texto_no_medibles: texto.noMedibles,
      controles_fallos: controles,
      estados_a_medir_a_mano: pendientes,
    };

    if (typeof console !== 'undefined' && console.table) {
      console.log(informe.ok ? '✓ contraste AA' : '✗ contraste AA', informe.resumen);
      if (texto.fallos.length) console.table(texto.fallos);
      if (controles.length) console.table(controles);
      if (texto.noMedibles.length) console.table(texto.noMedibles);
    }
    return informe;
  }

  window.qaContraste = qaContraste;
  return qaContraste();
})();
