/* tests/movimiento.js — MyPlants / qa-visual
 *
 * Comprueba el punto "Movimiento" de references/a11y.md. Se ejecuta DOS veces:
 *
 *   A) con movimiento normal  -> inventario de lo que se mueve, y detección de bucles
 *      infinitos y de parpadeos por encima de 3 Hz.
 *   B) con prefers-reduced-motion: reduce -> no debe quedar animación en bucle ni
 *      transición de transform/opacity con duración perceptible.
 *
 * Cómo forzar reduce (ver docs/qa/como-ejecutar.md):
 *   - Playwright MCP: browser_run_code_unsafe con
 *       await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload();
 *   - Chrome DevTools: Cmd+Shift+P → "Emulate CSS prefers-reduced-motion: reduce".
 *   - macOS: Ajustes → Accesibilidad → Pantalla → Reducir movimiento, y recargar.
 *
 * Y comprueba también lo que la media query NO cubre nunca: SMIL dentro de SVG
 * (<animate>, <animateTransform>), scroll-behavior: smooth y los .animate() de la
 * Web Animations API, que ignoran el CSS por completo.
 */

(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fallos = [];
  const inventario = [];

  function selector(el) {
    if (!el || el.nodeType !== 1) return '?';
    let p = el.tagName.toLowerCase();
    if (el.id) return `${p}#${el.id}`;
    const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (cls.length) p += '.' + cls.join('.');
    return p;
  }
  const segundos = (v) => (v || '0s').split(',').map((s) => (s.trim().endsWith('ms') ? parseFloat(s) / 1000 : parseFloat(s) || 0));
  const visible = (el) => {
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  };

  // --- 1. CSS: animaciones y transiciones declaradas ------------------------------------
  const objetivos = [...document.querySelectorAll('body, body *')];
  for (const el of objetivos) {
    for (const pseudo of [null, '::before', '::after']) {
      let cs;
      try { cs = getComputedStyle(el, pseudo); } catch (e) { continue; }
      if (!cs) continue;
      const nombre = el === document.body || pseudo ? selector(el) + (pseudo || '') : selector(el);

      // animaciones
      if (cs.animationName && cs.animationName !== 'none') {
        const nombres = cs.animationName.split(',').map((s) => s.trim());
        const durs = segundos(cs.animationDuration);
        const iters = (cs.animationIterationCount || '1').split(',').map((s) => s.trim());
        nombres.forEach((n, i) => {
          const dur = durs[i % durs.length] || 0;
          const it = iters[i % iters.length];
          if (dur <= 0.001) return;
          const infinita = it === 'infinite';
          inventario.push({ tipo: 'animation', donde: nombre, nombre: n, duracion: dur, iteraciones: it });
          if (infinita && !reduce) {
            fallos.push({ gravedad: 'alta', punto: 'bucle infinito', detalle: `@keyframes ${n} en ${nombre} corre infinite por defecto — debe dispararse al interactuar o tener play/pausa` });
          }
          if (infinita && reduce) {
            fallos.push({ gravedad: 'bloqueante', punto: 'reduced-motion', detalle: `con reduce activo sigue corriendo @keyframes ${n} infinite en ${nombre}` });
          }
          if (reduce && dur > 0.05) {
            fallos.push({ gravedad: 'alta', punto: 'reduced-motion', detalle: `con reduce activo, ${nombre} anima ${n} durante ${dur}s (máx. tolerable 0.05s)` });
          }
          if (!reduce && dur > 0 && dur < 0.34 && infinita) {
            fallos.push({ gravedad: 'bloqueante', punto: 'parpadeo', detalle: `${n} en ${nombre} cicla cada ${dur}s (>3 Hz) — riesgo fotosensible` });
          }
        });
      }

      // transiciones
      const props = (cs.transitionProperty || 'none').split(',').map((s) => s.trim());
      const durs = segundos(cs.transitionDuration);
      props.forEach((p, i) => {
        const dur = durs[i % durs.length] || 0;
        if (p === 'none' || dur <= 0.001) return;
        inventario.push({ tipo: 'transition', donde: nombre, nombre: p, duracion: dur, iteraciones: '—' });
        const mueve = /transform|translate|rotate|scale|all|top|left|right|bottom|margin|width|height|inset/.test(p);
        if (reduce && dur > 0.05 && mueve) {
          fallos.push({ gravedad: 'alta', punto: 'reduced-motion', detalle: `con reduce activo, ${nombre} transiciona "${p}" en ${dur}s — el movimiento debe anularse (opacity/color sí puede quedarse)` });
        }
      });
    }
  }

  // --- 2. SMIL dentro de SVG: la media query no lo toca ---------------------------------
  const smil = [...document.querySelectorAll('animate, animateTransform, animateMotion, set')];
  for (const a of smil) {
    const rep = a.getAttribute('repeatCount');
    const detalle = `<${a.tagName}> en ${selector(a.parentElement)} repeatCount="${rep}" dur="${a.getAttribute('dur')}"`;
    inventario.push({ tipo: 'SMIL', donde: selector(a.parentElement), nombre: a.tagName, duracion: a.getAttribute('dur'), iteraciones: rep });
    if (rep === 'indefinite') fallos.push({ gravedad: 'alta', punto: 'bucle infinito', detalle });
    if (reduce) fallos.push({ gravedad: 'bloqueante', punto: 'reduced-motion', detalle: `SMIL no responde a prefers-reduced-motion: hay que pararlo desde JS. ${detalle}` });
  }

  // --- 3. Web Animations API: tampoco la toca la media query ---------------------------
  let wapi = [];
  if (document.getAnimations) {
    wapi = document.getAnimations()
      .filter((a) => a.playState === 'running')
      .map((a) => ({
        nombre: (a.animationName || (a.effect && a.effect.getTiming && 'WAAPI') || 'anim'),
        donde: a.effect && a.effect.target ? selector(a.effect.target) : '?',
        iteraciones: a.effect && a.effect.getTiming ? a.effect.getTiming().iterations : '?',
        duracion: a.effect && a.effect.getTiming ? a.effect.getTiming().duration : '?',
      }));
    for (const a of wapi) {
      if (a.iteraciones === Infinity || a.iteraciones === 'Infinity') {
        fallos.push({ gravedad: 'alta', punto: 'bucle infinito', detalle: `animación JS infinita en ${a.donde}` });
      }
      if (reduce) fallos.push({ gravedad: 'bloqueante', punto: 'reduced-motion', detalle: `con reduce activo sigue corriendo una animación en ${a.donde} — element.animate() ignora la media query, hay que consultarla desde JS` });
    }
  }

  // --- 4. scroll suave ------------------------------------------------------------------
  for (const el of [document.documentElement, document.body]) {
    if (getComputedStyle(el).scrollBehavior === 'smooth') {
      inventario.push({ tipo: 'scroll', donde: selector(el), nombre: 'scroll-behavior: smooth', duracion: '—', iteraciones: '—' });
      if (reduce) fallos.push({ gravedad: 'media', punto: 'reduced-motion', detalle: `scroll-behavior: smooth sigue activo en ${selector(el)} con reduce` });
    }
  }

  // --- 5. ¿existe siquiera el bloque de reduced motion? --------------------------------
  let hayBloqueReduce = false;
  for (const hoja of document.styleSheets) {
    let rs;
    try { rs = hoja.cssRules; } catch (e) { continue; }
    const busca = (lista) => {
      for (const r of lista) {
        if (r.media && /prefers-reduced-motion/.test(r.conditionText || r.media.mediaText || '')) hayBloqueReduce = true;
        if (r.cssRules) busca(r.cssRules);
      }
    };
    busca(rs);
  }
  const hayMovimiento = inventario.some((i) => i.tipo === 'animation' || i.tipo === 'transition');
  if (hayMovimiento && !hayBloqueReduce) {
    fallos.push({ gravedad: 'bloqueante', punto: 'reduced-motion', detalle: 'hay animaciones/transiciones y NINGUNA @media (prefers-reduced-motion: reduce) en todo el CSS' });
  }

  const informe = {
    modo: reduce ? 'prefers-reduced-motion: REDUCE' : 'movimiento normal',
    ok: fallos.length === 0,
    resumen: `${inventario.length} efecto(s) de movimiento · ${fallos.length} fallo(s) · bloque @media reduce: ${hayBloqueReduce ? 'sí' : 'NO'}`,
    hayBloqueReduce,
    fallos,
    inventario: inventario.slice(0, 60),
    animacionesJS: wapi,
  };
  if (console.table) {
    console.log(informe.ok ? '✓ movimiento' : '✗ movimiento', `[${informe.modo}]`, informe.resumen);
    if (fallos.length) console.table(fallos);
    if (inventario.length) console.table(inventario.slice(0, 30));
  }
  window.qaMovimiento = () => informe;
  return informe;
})();
