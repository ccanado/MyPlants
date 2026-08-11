/* tests/terceros.js — MyPlants / qa-visual
 *
 * "Cero requests a terceros" es una restricción dura del proyecto, y check-estatico.py
 * solo la comprueba leyendo los ficheros. Esto la comprueba en ejecución: lo que el
 * navegador ha pedido de verdad, incluidas las peticiones que crea el JS en runtime,
 * las que arrastra un @import encadenado y las fuentes que tira un @font-face.
 *
 * Complementa (no sustituye) la lista de red de Playwright:
 *   browser_network_requests devuelve TODO lo pedido, incluidos fallos y redirecciones.
 *   Esto lee performance.getEntriesByType('resource'), que además da tamaño y tiempo,
 *   y funciona pegado en la consola sin Playwright.
 *
 * Uso: ver docs/qa/como-ejecutar.md. Ejecutar DESPUÉS de interactuar con la página
 * (buscar, filtrar, abrir una ficha), no solo al cargar.
 */

(() => {
  'use strict';

  const origen = location.origin;
  const recursos = performance.getEntriesByType('resource');

  const externos = [];
  const inventario = [];
  let bytes = 0;

  for (const r of recursos) {
    let url;
    try { url = new URL(r.name, location.href); } catch (e) { continue; }
    if (url.protocol === 'data:' || url.protocol === 'blob:') continue;

    const peso = r.transferSize || r.encodedBodySize || 0;
    bytes += peso;
    const fila = {
      tipo: r.initiatorType,
      recurso: url.pathname.split('/').slice(-2).join('/'),
      kb: Math.round(peso / 102.4) / 10,
      ms: Math.round(r.duration),
      cache: r.transferSize === 0 && r.decodedBodySize > 0 ? 'sí' : 'no',
    };
    inventario.push(fila);
    if (url.origin !== origen) externos.push({ ...fila, url: r.name, initiator: r.initiatorType });
  }

  // --- referencias externas presentes en el DOM aunque aún no se hayan pedido ----------
  const enDOM = [];
  const atributos = [['img', 'src'], ['script', 'src'], ['link', 'href'], ['iframe', 'src'],
                    ['source', 'src'], ['source', 'srcset'], ['img', 'srcset'], ['video', 'poster'],
                    ['use', 'href'], ['object', 'data'], ['embed', 'src']];
  for (const [tag, attr] of atributos) {
    for (const el of document.querySelectorAll(`${tag}[${attr}]`)) {
      const v = el.getAttribute(attr) || '';
      for (const trozo of v.split(',')) {
        const u = trozo.trim().split(/\s+/)[0];
        if (!u || /^(data:|blob:|#|mailto:|tel:)/.test(u)) continue;
        let abs;
        try { abs = new URL(u, location.href); } catch (e) { continue; }
        if (abs.origin !== origen) enDOM.push({ tag, attr, valor: u, rel: el.getAttribute('rel') || '' });
      }
    }
  }
  // <a href> externo NO es una petición: son las fuentes citadas de las fichas, legítimas.
  const enlacesExternos = [...document.querySelectorAll('a[href^="http"]')]
    .filter((a) => { try { return new URL(a.href).origin !== origen; } catch (e) { return false; } })
    .map((a) => ({ texto: (a.textContent || '').trim().slice(0, 40), href: a.href, rel: a.rel, target: a.target }));
  const enlacesSinRel = enlacesExternos.filter((a) => a.target === '_blank' && !/noopener/.test(a.rel));

  // --- fuentes cargadas -----------------------------------------------------------------
  const fuentes = [];
  if (document.fonts) {
    document.fonts.forEach((f) => fuentes.push({ familia: f.family, peso: f.weight, estilo: f.style, estado: f.status, display: f.display }));
  }

  // --- otros vectores de terceros -------------------------------------------------------
  const sospechas = [];
  if (navigator.sendBeacon && performance.getEntriesByType('resource').some((r) => r.initiatorType === 'beacon')) {
    sospechas.push('hay un beacon: analítica');
  }
  if (document.querySelector('link[rel="preconnect"], link[rel="dns-prefetch"]')) {
    sospechas.push('hay preconnect/dns-prefetch — solo tienen sentido apuntando a un tercero');
  }
  if (window.google || window.gtag || window.dataLayer || window.ga || window._paq) {
    sospechas.push('globales de analítica en window');
  }

  const informe = {
    ok: externos.length === 0 && enDOM.length === 0 && sospechas.length === 0,
    resumen: `${recursos.length} recurso(s), ${Math.round(bytes / 1024)} KB transferidos · ${externos.length} externo(s) · ${enlacesExternos.length} enlace(s) <a> externo(s) (legítimos: fuentes citadas)`,
    peticiones_externas: externos,
    referencias_externas_en_dom: enDOM,
    sospechas,
    fuentes_cargadas: fuentes,
    enlaces_externos: enlacesExternos,
    enlaces_target_blank_sin_noopener: enlacesSinRel,
    peso_total_kb: Math.round(bytes / 1024),
    inventario: inventario.sort((a, b) => b.kb - a.kb).slice(0, 40),
  };
  if (console.table) {
    console.log(informe.ok ? '✓ cero terceros' : '✗ terceros detectados', informe.resumen);
    if (externos.length) console.table(externos);
    if (enDOM.length) console.table(enDOM);
    console.table(informe.inventario.slice(0, 15));
  }
  window.qaTerceros = () => informe;
  return informe;
})();
