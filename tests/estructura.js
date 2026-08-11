/* tests/estructura.js — MyPlants / qa-visual
 *
 * Comprueba la estructura semántica del DOM ya renderizado — que es lo que importa,
 * porque las fichas de planta las pinta JS desde content/plantas.json y en index.html
 * solo hay un <template>. Un checker estático sobre el HTML no vería nada de esto.
 *
 * Cubre los puntos "Estructura", "Semántica de controles", "Contenido dinámico" e
 * "Imágenes y SVG" de .claude/skills/vanilla-web-craft/references/a11y.md.
 *
 * Uso: ver docs/qa/como-ejecutar.md.
 */

(() => {
  'use strict';

  const fallos = [];
  const avisos = [];
  const notas = [];
  const err = (punto, detalle) => fallos.push({ punto, detalle });
  const avi = (punto, detalle) => avisos.push({ punto, detalle });

  function selector(el) {
    if (!el || el.nodeType !== 1) return '?';
    let p = el.tagName.toLowerCase();
    if (el.id) return `${p}#${el.id}`;
    const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (cls.length) p += '.' + cls.join('.');
    return p;
  }
  const texto = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  };

  // --- 1. lang -------------------------------------------------------------------------
  const lang = document.documentElement.getAttribute('lang');
  if (!lang) err('lang', '<html> sin atributo lang: el lector de pantalla leerá español con fonética inglesa');
  else if (!/^es\b/i.test(lang)) avi('lang', `<html lang="${lang}"> — se esperaba es`);

  // --- 2. title y viewport -------------------------------------------------------------
  if (!document.title || document.title.trim().length < 3) err('title', '<title> vacío o inútil');
  const vp = document.querySelector('meta[name="viewport"]');
  if (!vp) err('viewport', 'falta <meta name="viewport">');
  else if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1\b/i.test(vp.content || ''))
    err('viewport', `el viewport bloquea el zoom: "${vp.content}"`);

  // --- 3. encabezados ------------------------------------------------------------------
  const enc = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible);
  const h1 = enc.filter((e) => e.tagName === 'H1');
  if (h1.length !== 1) err('encabezados', `hay ${h1.length} <h1> visibles, debe haber exactamente 1`);
  let previo = 0;
  const esquema = [];
  for (const e of enc) {
    const n = +e.tagName[1];
    esquema.push(`${'  '.repeat(n - 1)}h${n} ${texto(e).slice(0, 60)}`);
    if (previo && n > previo + 1) err('encabezados', `salto h${previo} → h${n} en "${texto(e).slice(0, 40)}"`);
    if (!texto(e)) err('encabezados', `${selector(e)} vacío`);
    previo = n;
  }
  notas.push({ punto: 'esquema de encabezados', detalle: esquema.join('\n') });

  // --- 4. landmarks --------------------------------------------------------------------
  const mains = document.querySelectorAll('main, [role="main"]');
  if (mains.length !== 1) err('landmarks', `hay ${mains.length} <main>, debe haber exactamente 1`);
  for (const [sel, nombre] of [['header, [role="banner"]', 'header'], ['footer, [role="contentinfo"]', 'footer']]) {
    if (!document.querySelector(sel)) avi('landmarks', `no hay ${nombre}`);
  }
  const navs = [...document.querySelectorAll('nav, [role="navigation"]')];
  if (navs.length > 1) {
    const sinNombre = navs.filter((n) => !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby'));
    if (sinNombre.length) err('landmarks', `${sinNombre.length} <nav> sin aria-label habiendo varios: no se distinguen`);
  }
  // contenido fuera de landmarks
  const huerfanos = [...document.body.children].filter(
    (el) => visible(el) && !el.matches('header,nav,main,footer,aside,script,template,dialog,[role="banner"],[role="navigation"],[role="main"],[role="contentinfo"]')
  );
  if (huerfanos.length) avi('landmarks', `contenido fuera de landmark: ${huerfanos.map(selector).join(', ')}`);

  // --- 5. skip link --------------------------------------------------------------------
  const focusables = [...document.querySelectorAll(
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex], audio[controls], video[controls]'
  )].filter((el) => !el.disabled && el.getAttribute('tabindex') !== '-1' && visible(el));
  const primero = focusables[0];
  if (!primero || !(primero.tagName === 'A' && (primero.getAttribute('href') || '').startsWith('#'))) {
    err('skip link', `el primer elemento enfocable no es un skip link (es ${primero ? selector(primero) : 'ninguno'})`);
  } else {
    const destino = document.querySelector(primero.getAttribute('href'));
    if (!destino) err('skip link', `el skip link apunta a ${primero.getAttribute('href')} y ese id no existe`);
    notas.push({ punto: 'skip link', detalle: `${texto(primero)} → ${primero.getAttribute('href')} (comprobar a ojo que se ve al recibir foco)` });
  }

  // --- 6. tabindex positivos -----------------------------------------------------------
  const positivos = [...document.querySelectorAll('[tabindex]')].filter((el) => +el.getAttribute('tabindex') > 0);
  if (positivos.length) err('teclado', `tabindex positivo en: ${positivos.map(selector).join(', ')} — rompe el orden natural`);

  // --- 7. div con onclick / roles inventados -------------------------------------------
  for (const el of document.querySelectorAll('div[onclick], span[onclick], div[role="button"], span[role="button"]')) {
    err('semántica', `${selector(el)} actúa como botón sin serlo — usa <button type="button">`);
  }
  for (const b of document.querySelectorAll('button')) {
    if (!b.getAttribute('type')) avi('semántica', `${selector(b)} sin type — dentro de un form haría submit`);
  }
  for (const a of document.querySelectorAll('a')) {
    if (!a.hasAttribute('href')) err('semántica', `<a> sin href (${texto(a).slice(0, 30)}) — no es enfocable`);
  }

  // --- 8. nombre accesible de los controles --------------------------------------------
  function nombreAccesible(el) {
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
    const lb = el.getAttribute('aria-labelledby');
    if (lb) return lb.split(/\s+/).map((id) => texto(document.getElementById(id) || document.createElement('i'))).join(' ').trim();
    if (el.labels && el.labels.length) return [...el.labels].map(texto).join(' ').trim();
    if (el.title) return el.title.trim();
    const t = texto(el);
    if (t) return t;
    const img = el.querySelector('img[alt]');
    if (img) return img.alt.trim();
    return '';
  }
  for (const el of document.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea, [role="button"]')) {
    if (!visible(el)) continue;
    if (!nombreAccesible(el)) err('nombre accesible', `${selector(el)} no tiene nombre accesible (ni texto, ni label, ni aria-label)`);
  }
  for (const el of document.querySelectorAll('input:not([type="hidden"]):not([type="button"]):not([type="submit"]), select, textarea')) {
    const tieneLabel = (el.labels && el.labels.length) || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
    if (!tieneLabel && el.placeholder) err('labels', `${selector(el)} se apoya solo en placeholder — desaparece al escribir`);
  }

  // --- 9. estados ARIA -----------------------------------------------------------------
  for (const el of document.querySelectorAll('[aria-expanded]')) {
    const v = el.getAttribute('aria-expanded');
    if (v !== 'true' && v !== 'false') err('aria', `${selector(el)} aria-expanded="${v}" inválido`);
  }
  for (const el of document.querySelectorAll('[aria-controls]')) {
    const id = el.getAttribute('aria-controls');
    if (!document.getElementById(id)) err('aria', `${selector(el)} aria-controls="${id}" apunta a un id inexistente`);
  }
  for (const el of document.querySelectorAll('[role]')) {
    const r = el.getAttribute('role');
    const redundante = { list: 'UL', listitem: 'LI', button: 'BUTTON', link: 'A', main: 'MAIN', navigation: 'NAV', article: 'ARTICLE', heading: null };
    if (r in redundante && redundante[r] === el.tagName) avi('aria', `${selector(el)} role="${r}" redundante sobre <${el.tagName.toLowerCase()}>`);
  }

  // --- 10. fichas de planta: article + heading + lista ----------------------------------
  const articles = [...document.querySelectorAll('article')];
  notas.push({ punto: 'fichas', detalle: `${articles.length} <article> en el DOM` });

  /* ── SUELO MÍNIMO: sin fichas, esto es un fallo y no un dato ────────────────
     Este test aprobaba una página **completamente en blanco.** El 11/08 `main`
     sirvió durante horas un `SyntaxError` en `js/ficha.js:730` que impedía cargar el
     módulo entero, así que no se pintaba ni una ficha — y esta comprobación devolvió
     `✓ 0 fallos · 0 img · 0 article · 2 enfocables`, con los otros cuatro
     comprobadores también en verde. **El test más importante del proyecto habría
     firmado el cierre sobre una página vacía.**

     Es el mismo tronco que los falsos positivos de esta sesión, por el extremo
     opuesto: no una herramienta que opina cuando no puede saber, sino una que
     **calla cuando sí podría saber**. Cada comprobación individual era correcta —no
     hay `<img>` sin `alt` si no hay `<img>`— y la conjunción de todas ellas era
     absurda. Un checker que aprueba el caso peor no protege de nada.

     El suelo se lee del propio JSON y no se escribe a mano: si `botanist` añade una
     planta, el suelo sube solo. La idea es de `builder`, que lo cazó comparando el
     antes y el después de su arreglo. */
  let plantasEsperadas = null;
  try {
    const x = new XMLHttpRequest();
    x.open('GET', './content/plantas.json', false);
    x.send(null);
    const d = JSON.parse(x.responseText);
    const lista = Array.isArray(d) ? d : (d.plantas || []);
    if (lista.length) plantasEsperadas = lista.length;
  } catch (e) { /* se trata abajo */ }

  if (plantasEsperadas === null) {
    avi('fichas', 'no he podido leer content/plantas.json, así que no puedo exigir un ' +
                  'suelo de fichas. Si la página estuviera vacía, este test no lo vería');
  } else if (articles.length < plantasEsperadas) {
    err('fichas',
      `SUELO MÍNIMO: hay ${articles.length} <article> y el JSON trae ${plantasEsperadas} ` +
      `planta(s). Si el número es 0, la página está ROTA y el resto de esta auditoría no ` +
      `significa nada: no hay <img> sin alt porque no hay <img>. Mira la consola primero ` +
      `— un SyntaxError en un módulo deja la página en blanco sin que falle nada más`);
  }
  for (const a of articles) {
    if (!a.querySelector('h1,h2,h3,h4,h5,h6')) err('fichas', `${selector(a)} es un <article> sin encabezado propio`);
    if (!a.getAttribute('aria-labelledby') && !a.getAttribute('aria-label')) {
      avi('fichas', `${selector(a)} sin aria-labelledby: el article no se anuncia con nombre al navegar por regiones`);
    }
  }
  // ¿la rejilla es una lista?
  if (articles.length > 1) {
    const enLista = articles.filter((a) => a.closest('li'));
    if (enLista.length !== articles.length) {
      err('listas', `${articles.length - enLista.length} ficha(s) fuera de <ul>/<li>: no se anunciará "lista de N elementos"`);
    }
  }

  // --- 11. contenido dinámico ----------------------------------------------------------
  const live = [...document.querySelectorAll('[aria-live], [role="status"], [role="alert"]')];
  if (!live.length) err('aria-live', 'no hay ninguna región aria-live: al filtrar o buscar, un lector de pantalla no sabrá que la lista cambió');
  else notas.push({ punto: 'aria-live', detalle: live.map((e) => `${selector(e)} aria-live="${e.getAttribute('aria-live') || e.getAttribute('role')}" → "${texto(e).slice(0, 60)}"`).join(' | ') });

  // --- 12. imágenes --------------------------------------------------------------------
  const imgs = [...document.querySelectorAll('img')];
  const genericos = /^(imagen|foto|image|photo|picture|planta|plant|img)[\s.]*$/i;
  imgs.forEach((img, i) => {
    const d = `${selector(img)} src="${(img.getAttribute('src') || '').split('/').pop()}"`;
    if (!img.hasAttribute('alt')) err('imágenes', `${d} sin atributo alt (usa alt="" si es decorativa)`);
    else if (img.alt && genericos.test(img.alt.trim())) err('imágenes', `${d} alt genérico: "${img.alt}"`);
    else if (img.alt && /^(imagen|foto) de /i.test(img.alt.trim())) avi('imágenes', `${d} alt empieza por "imagen de" — redundante, el lector ya dice "imagen"`);
    for (const attr of ['width', 'height', 'loading']) {
      if (!img.hasAttribute(attr)) err('imágenes', `${d} sin ${attr}`);
    }
    if (i === 0 && img.getAttribute('loading') === 'lazy') {
      avi('imágenes', `${d} es la primera imagen y va lazy — retrasa el LCP`);
    }
    if (img.naturalWidth && img.hasAttribute('width')) {
      const ratioHTML = +img.getAttribute('width') / +img.getAttribute('height');
      const ratioReal = img.naturalWidth / img.naturalHeight;
      if (Math.abs(ratioHTML - ratioReal) > 0.02) {
        err('imágenes', `${d} width/height del HTML (${img.getAttribute('width')}×${img.getAttribute('height')}) no coincide con el fichero (${img.naturalWidth}×${img.naturalHeight}) — habrá salto de layout`);
      }
    }
    if (img.complete && img.naturalWidth === 0) err('imágenes', `${d} NO CARGA (404 o ruta mal)`);
    if (img.naturalWidth > 0) {
      const r = img.getBoundingClientRect();
      if (r.width > 0 && img.naturalWidth > r.width * 3) {
        avi('imágenes', `${d} sirve ${img.naturalWidth}px para pintar ${Math.round(r.width)}px — sobra peso`);
      }
    }
  });

  // --- 13. SVG -------------------------------------------------------------------------
  for (const svg of document.querySelectorAll('svg')) {
    const oculto = svg.getAttribute('aria-hidden') === 'true';
    const rol = svg.getAttribute('role');
    const titulo = svg.querySelector('title');
    if (oculto) {
      if (svg.getAttribute('focusable') !== 'false') avi('svg', `${selector(svg)} decorativo sin focusable="false" (IE/Edge legacy lo tabula)`);
      if (titulo) avi('svg', `${selector(svg)} es aria-hidden pero tiene <title>`);
    } else {
      if (rol !== 'img') err('svg', `${selector(svg)} informativo sin role="img"`);
      if (!titulo && !svg.getAttribute('aria-label')) err('svg', `${selector(svg)} informativo sin <title> ni aria-label`);
    }
  }

  // --- 14. información transmitida solo por color --------------------------------------
  // Heurística: elementos pequeños con background propio y sin texto ni nombre accesible,
  // colocados junto a datos. Suelen ser el "punto rojo" de estado.
  const soloColor = [];
  for (const el of document.querySelectorAll('span, i, b, div, li')) {
    if (!visible(el)) continue;
    if (texto(el)) continue;
    if (el.querySelector('svg, img')) continue;
    const cs = getComputedStyle(el);
    const tieneFondo = cs.backgroundColor && !/rgba?\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor);
    const r = el.getBoundingClientRect();
    if (tieneFondo && r.width < 48 && r.height < 48 && r.width > 2) {
      if (!el.getAttribute('aria-label') && !el.getAttribute('title')) {
        soloColor.push(`${selector(el)} ${Math.round(r.width)}×${Math.round(r.height)} bg ${cs.backgroundColor}`);
      }
    }
  }
  if (soloColor.length) {
    err('solo color', `${soloColor.length} marca(s) gráfica(s) sin texto ni nombre — si codifican riego, luz, salud o toxicidad, la información se pierde sin color: ${soloColor.slice(0, 8).join(' | ')}`);
  }

  // --- 15. tablas y bloques anchos -----------------------------------------------------
  for (const t of document.querySelectorAll('table')) {
    if (!t.querySelector('th')) err('tablas', `${selector(t)} sin <th>`);
    if (!t.querySelector('caption') && !t.getAttribute('aria-label')) avi('tablas', `${selector(t)} sin caption ni aria-label`);
  }

  // --- salida --------------------------------------------------------------------------
  const informe = {
    ok: fallos.length === 0,
    resumen: `${fallos.length} fallo(s), ${avisos.length} aviso(s) · ${imgs.length} img · ${articles.length} article · ${focusables.length} enfocables`,
    fallos,
    avisos,
    notas,
  };
  if (typeof console !== 'undefined') {
    console.log(informe.ok ? '✓ estructura' : '✗ estructura', informe.resumen);
    if (fallos.length) console.table(fallos);
    if (avisos.length) console.table(avisos);
  }
  window.qaEstructura = () => informe;
  return informe;
})();
