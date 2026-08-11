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

  /* Umbral de lo que se considera «movimiento perceptible» con `reduce` activo.
     Está a 50 ms y `--dur-corta` de este proyecto son 120, así que la opacidad que
     `ux-lead` conserva a propósito en el despegue cae del lado suspendido. **Eso es
     un choque de especificaciones, no un bug**, y por eso las animaciones que vienen
     de CSS bajan a `media` con la nota de que se citen en `docs/decisiones.md`: quien
     decide si 120 ms de opacidad sola son aceptables es el dueño de la dirección
     visual, no su medidor. Si se acuerda subirlo a 120, se cambia aquí y en el
     checklist, con la procedencia escrita — que es la lección del 2.400. */
  const UMBRAL_REDUCE_MS = 50;
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
  /* Propiedades cuyo cambio DESPLAZA algo en pantalla. Las demás —opacidad, color,
     relleno— cambian el aspecto sin mover nada, y `reduce` protege del movimiento. */
  const MUEVE = /transform|translate|rotate|scale|perspective|top|left|right|bottom|margin|width|height|inset|offset|clip|stroke-dashoffset/;

  /* Lee del CSSOM qué propiedades toca un `@keyframes` de verdad, para no juzgar una
     animación por su duración sin saber qué anima. Devuelve null si no se puede leer
     (hoja de otro origen), y entonces quien llama trata la duda como movimiento: en
     accesibilidad la duda se resuelve del lado seguro, no del cómodo. */
  function propiedadesDelKeyframe(nombre) {
    const props = new Set();
    let encontrado = false;
    for (const hoja of document.styleSheets) {
      let reglas;
      try { reglas = hoja.cssRules; } catch (e) { continue; }
      const recorre = (lista) => {
        for (const r of lista) {
          if (r.type === CSSRule.KEYFRAMES_RULE || r.name !== undefined && r.cssRules && r.name === nombre) {
            if (r.name !== nombre) { if (r.cssRules) recorre(r.cssRules); continue; }
            encontrado = true;
            for (const marco of r.cssRules) {
              const st = marco.style;
              for (let i = 0; i < st.length; i++) props.add(st[i]);
            }
          } else if (r.cssRules) {
            recorre(r.cssRules);
          }
        }
      };
      recorre(reglas);
    }
    return encontrado ? [...props] : null;
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
          /* La rama de transiciones de abajo ya exime `opacity`/`color` («el
             movimiento debe anularse, opacity/color sí puede quedarse») y esta rama
             no lo hacía: suspendía cualquier `@keyframes` de más de 50 ms aunque no
             moviera nada. Dos reglas distintas para el mismo criterio dentro del
             mismo fichero, y la incoherencia produjo un `alta` contra la opacidad
             que `ux-lead` conserva a propósito en el despegue.

             Ahora se leen las propiedades que el keyframe toca de verdad. Si solo
             son de las que no desplazan, no se suspende: se anota como aceptado. Un
             fundido de opacidad no dispara vestibular, que es lo que `reduce`
             protege. */
          if (reduce && dur > UMBRAL_REDUCE_MS / 1000) {
            const props = propiedadesDelKeyframe(n);
            const desplaza = props === null || props.some((x) => MUEVE.test(x));
            if (desplaza) {
              fallos.push({
                gravedad: 'alta', punto: 'reduced-motion',
                detalle: `con reduce activo, ${nombre} anima ${n} durante ${dur}s ` +
                         `(máx. tolerable ${UMBRAL_REDUCE_MS / 1000}s) · toca: ` +
                         (props ? props.join(', ') : 'no he podido leer el @keyframes'),
              });
            } else {
              inventario.push({
                tipo: 'animation (aceptada con reduce)', donde: nombre, nombre: n,
                duracion: dur, iteraciones: it,
                nota: `solo toca ${props.join(', ')}: no desplaza, así que conservarla con ` +
                      `reduce es legítimo`,
              });
            }
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
        if (reduce && dur > UMBRAL_REDUCE_MS / 1000 && mueve) {
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
  /* ── de dónde viene cada animación viva ───────────────────────────────────
     `document.getAnimations()` NO devuelve solo las de `element.animate()`:
     devuelve también las `CSSAnimation` y las `CSSTransition`. La versión anterior
     de este bloque llamaba «WAAPI» a todo lo que no tuviera `animationName` —o sea
     a cualquier transición de CSS— y después, con `reduce` activo, culpaba
     **siempre** a `element.animate()` con el texto «ignora la media query, hay que
     consultarla desde JS».

     Eso produjo un falso positivo que llegó hasta un teammate: reporté dos
     bloqueantes en el informe 3 contra `builder`, y él contestó que en `js/` **no
     hay una sola llamada a `.animate()`**. Comprobado: cero en los seis módulos
     publicados. Lo que corría era la animación CSS `aparecer`, que `ux-lead`
     conserva a propósito bajo `reduce` porque es una opacidad y no un
     desplazamiento, más una `CSSTransition`.

     Es mi propio patrón en su forma más cara: **una herramienta que opina sobre la
     CAUSA cuando solo puede ver el EFECTO.** El efecto era real —había animación
     viva con `reduce`— y la causa que nombré no existía, así que el arreglo que
     pedía era imposible de hacer. Ahora el origen se lee del constructor, que es
     el dato que el navegador sí da, y el mensaje no propone un arreglo que no
     corresponda a lo que se ha medido. */
  if (document.getAnimations) {
    const origenDe = (a) => {
      const c = (a && a.constructor && a.constructor.name) || '';
      if (c === 'CSSAnimation') return 'animación CSS (@keyframes)';
      if (c === 'CSSTransition') return 'transición CSS';
      if (c === 'Animation') return 'element.animate() — Web Animations API';
      return 'origen no identificable (' + (c || 'sin constructor') + ')';
    };
    wapi = document.getAnimations()
      .filter((a) => a.playState === 'running')
      .map((a) => ({
        nombre: (a.animationName || a.transitionProperty || 'sin nombre'),
        origen: origenDe(a),
        donde: a.effect && a.effect.target ? selector(a.effect.target) : '?',
        iteraciones: a.effect && a.effect.getTiming ? a.effect.getTiming().iterations : '?',
        duracion: a.effect && a.effect.getTiming ? a.effect.getTiming().duration : '?',
      }));
    for (const a of wapi) {
      if (a.iteraciones === Infinity || a.iteraciones === 'Infinity') {
        fallos.push({
          gravedad: 'alta', punto: 'bucle infinito',
          detalle: `animación infinita en ${a.donde} · origen: ${a.origen}`,
        });
      }
      if (!reduce) continue;

      const esJS = a.origen.startsWith('element.animate()');
      if (esJS) {
        // Este sí es el caso que la media query no puede tocar.
        fallos.push({
          gravedad: 'bloqueante', punto: 'reduced-motion',
          detalle: `con reduce sigue corriendo ${a.nombre} en ${a.donde} creada con ` +
                   `element.animate(): la media query de CSS no la alcanza, hay que ` +
                   `consultar matchMedia desde JS antes de lanzarla`,
        });
      } else if (a.duracion !== '?' && Number(a.duracion) > UMBRAL_REDUCE_MS &&
                 (() => {
                   /* Misma exención que la rama de declaraciones: si solo cambia
                      opacidad o color, no desplaza y no hay nada que suspender. Sin
                      esto, la misma animación salía dos veces —una por declaración y
                      otra por instancia viva— y un informe que cuenta dos veces el
                      mismo hecho infla la gravedad sin añadir información. */
                   const props = a.nombre ? propiedadesDelKeyframe(a.nombre) : null;
                   return props === null || props.some((x) => MUEVE.test(x));
                 })()) {
        /* Viene de CSS, así que el bloque `@media (prefers-reduced-motion)` SÍ la
           alcanza: si sigue viva es porque alguien decidió conservarla. Eso puede
           ser correcto —una opacidad orienta sin desplazar— así que no es un
           bloqueante, es una decisión que hay que poder citar. */
        fallos.push({
          gravedad: 'media', punto: 'reduced-motion',
          detalle: `con reduce sigue viva ${a.nombre} en ${a.donde} (${a.duracion} ms, ` +
                   `umbral ${UMBRAL_REDUCE_MS} ms) · origen: ${a.origen}. Viene de CSS, así que ` +
                   `el bloque de reduce la alcanza y conservarla es una decisión: si es ` +
                   `deliberada, cítese en docs/decisiones.md y esto pasa a criterio aceptado`,
        });
      }
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
