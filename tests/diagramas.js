/* tests/diagramas.js — MyPlants / qa-visual
 *
 * Audita los diagramas de la ficha: los cuatro que ya existían (riego, luz,
 * temperatura, recuperación) más el quinto, la cronología de eje logarítmico. Mira
 * tres cosas que ningún otro test del repo mira.
 *
 * ── 1. Que un eje que se llama logarítmico lo sea ────────────────────────────
 *
 * `tests/estructura.js` comprueba que un SVG informativo lleve `role="img"` y
 * `<title>`, y el punto 6.6 del checklist exige equivalente en texto al lado. Ninguno
 * de los dos mira si el dibujo **dice la verdad**. Un eje log sin marcas rotuladas
 * miente sobre las proporciones: el lector ve que un tramo es el doble de largo que
 * otro y concluye "el doble", cuando puede ser mil veces. Aquí no basta con contar
 * rótulos: se hace la **regresión de la posición en píxeles contra el logaritmo del
 * valor rotulado** y se mira el R². Si el eje se declara logarítmico y las marcas no
 * caen en línea sobre log(valor), el dibujo está mintiendo con rótulos puestos, que
 * es peor que sin ellos, porque parece verificado.
 *
 * ── 2. Que con `reduce` el estado final se pinte, no se pierda ───────────────
 *
 * `tests/movimiento.js` comprueba que con `prefers-reduced-motion` no quede nada
 * moviéndose. Eso deja pasar los dos fallos opuestos de las animaciones de un solo
 * disparo, y los dos se ven igual en un test de movimiento: en verde.
 *
 *   a) `animation-duration: 0.01ms` — el atajo habitual. La animación no se ve, pero
 *      se ejecuta: el elemento salta de su estado inicial al final en un frame y eso
 *      **parpadea**, que es justo lo que reduce venía a evitar.
 *   b) `animation: none` sin pintar el estado final — el fallo peor y el silencioso.
 *      Si el keyframe iba de `opacity: 0` a `opacity: 1` y se anula la animación sin
 *      poner `opacity: 1`, el elemento se queda en su estado inicial: **invisible**.
 *      El diagrama desaparece solo para quien pidió menos movimiento, o sea que la
 *      página castiga precisamente a quien activó una opción de accesibilidad. Cero
 *      errores en consola, cero animaciones en bucle, movimiento.js en verde.
 *
 * `css/app.css` ya lo resuelve bien para los cuatro primeros (anula la animación *y*
 * fija `opacity: 1`, `transform: none`, `stroke-dashoffset: 0`). Este test existe para
 * que el quinto diagrama no se quede fuera de esa lista, que es el fallo que va a
 * ocurrir por omisión.
 *
 * ── 3. Que el dato no viva solo en el dibujo ─────────────────────────────────
 *
 * Punto 6.6: un SVG que explica un concepto necesita su equivalente en texto cerca.
 * Se busca texto real —del `<title>`, de los `<text>` internos o de un párrafo
 * hermano— y se avisa si un diagrama es la única fuente de su dato.
 *
 * Uso:
 *   python3 tests/runner.py --abrir 0 --alto 3000 --test diagramas
 *   python3 tests/runner.py --abrir 0 --alto 3000 --test diagramas --reduce
 *
 * Hay que ejecutarlo en LOS DOS modos: el informe trae el campo `modo` para que no se
 * confunda una pasada con otra.
 */

(() => {
  'use strict';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modo = reduce ? 'reduce' : 'normal';
  const fallos = [];
  const abstenciones = [];
  const avisos = [];

  const seg = (v) => (v || '0s').split(',')
    .map((s) => (s.trim().endsWith('ms') ? parseFloat(s) / 1000 : parseFloat(s) || 0));
  const norm = (s) => String(s == null ? '' : s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const texto = (el) => (el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '');

  /* ── 1. inventario de diagramas ─────────────────────────────────────────── */

  /* Un diagrama es un SVG con contenido propio, no un icono. Se distinguen por
     tamaño y por número de nodos: un icono de campo tiene dos trazos y 20 px; un
     diagrama tiene ejes, rótulos y decenas de nodos. Así el test no depende de la
     lista de clases, que builder puede cambiar. */
  /* Ámbito: si hay una ficha desplegada, se mide DENTRO de ella. Sin esto el test
     recoge los diagramas de las siete fichas (28 en la primera pasada, 7×4) y el
     recuento deja de significar nada: la pregunta del informe es «los cinco
     diagramas de una ficha», no «todos los SVG de la página». */
  const fichaAbierta = [...document.querySelectorAll('details[open]')]
    .filter((d) => d.closest('article') && d.getBoundingClientRect().height > 400)
    .sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0];
  const raiz = fichaAbierta || document;
  const ambito = fichaAbierta
    ? 'la ficha desplegada (' + ((fichaAbierta.closest('article') || {}).id || '?') + ')'
    : 'todo el documento (ninguna ficha desplegada)';

  const svgs = [...raiz.querySelectorAll('svg')].filter((s) => {
    if (s.closest('svg') !== s) return false;             // no anidados
    const r = s.getBoundingClientRect();
    if (r.width < 60 || r.height < 40) return false;      // iconos fuera
    const cs = getComputedStyle(s);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    return s.querySelectorAll('*').length >= 6;
  });

  if (!svgs.length) {
    const informe = {
      ok: true, no_medible: true, modo,
      motivo: 'no hay ningún SVG grande en el DOM. ¿Se lanzó con --abrir 0?',
      resumen: 'no medible: sin diagramas en pantalla',
    };
    console.log('· diagramas — no medible:', informe.motivo);
    window.qaDiagramas = () => informe;
    return informe;
  }

  const familia = (s) => {
    const clases = norm(s.getAttribute('class') || '') + ' ' +
                   norm([...s.querySelectorAll('[class]')].slice(0, 8)
                     .map((x) => x.getAttribute('class')).join(' '));
    /* El orden importa y costó una lectura equivocada: `temp__escala` contiene
       «escala», así que preguntar por /escala/ antes que por /temp/ clasificaba el
       diagrama térmico como si fuera el de luz, y la primera pasada informó de 14
       diagramas de luz para 7 plantas. Lo específico va primero. */
    if (/reloj/.test(clases)) return 'riego';
    if (/temp/.test(clases)) return 'temperatura';
    if (/recup/.test(clases)) return 'recuperación';
    if (/escala/.test(clases)) return 'luz';
    if (/crono|linea-?tiempo|timeline|edad/.test(clases)) return 'cronología';
    return norm(texto(s.querySelector('title'))).slice(0, 40) || '(sin identificar)';
  };

  const inventario = [];

  for (const s of svgs) {
    const f = familia(s);
    const titulo = texto(s.querySelector('title'));
    const rotulos = [...s.querySelectorAll('text')].map(texto).filter(Boolean);

    // Equivalente en texto: el propio title cuenta, los <text> internos cuentan, y
    // un párrafo hermano cuenta. Si no hay ninguno, el dato vive solo en el dibujo.
    const hermanoConTexto = (() => {
      const cont = s.parentElement;
      if (!cont) return '';
      const t = texto(cont).replace(texto(s), '').trim();
      return t.length > 25 ? t.slice(0, 90) : '';
    })();

    const equivalente = rotulos.length >= 2 || !!hermanoConTexto || titulo.length > 20;
    if (!equivalente) {
      fallos.push({
        caso: 'diagrama sin equivalente en texto (6.6)',
        diagrama: f,
        que: 'el dato solo existe en el dibujo: sin rótulos internos, sin título largo y sin texto al lado',
        gravedad: 'alta', dueño: 'builder',
      });
    }

    const decorativo = s.getAttribute('aria-hidden') === 'true';
    if (!decorativo && (!s.getAttribute('role') || !titulo)) {
      fallos.push({
        caso: 'SVG informativo sin role/title (6.5)',
        diagrama: f,
        role: s.getAttribute('role'), title: titulo || '(vacío)',
        gravedad: 'alta', dueño: 'builder',
      });
    }

    inventario.push({
      diagrama: f,
      ancho: Math.round(s.getBoundingClientRect().width),
      alto: Math.round(s.getBoundingClientRect().height),
      nodos: s.querySelectorAll('*').length,
      role: s.getAttribute('role') || (decorativo ? 'aria-hidden' : '(ninguno)'),
      title: titulo.slice(0, 70) || null,
      rotulos: rotulos.length,
      texto_al_lado: hermanoConTexto ? 'sí' : 'no',
    });
  }

  /* ── 2. el eje logarítmico de la cronología ─────────────────────────────── */

  const crono = svgs.find((s) => familia(s) === 'cronología');
  let ejeLog = null;

  if (!crono) {
    abstenciones.push({
      que: 'no puedo auditar el eje logarítmico de la cronología',
      por_que: 'no encuentro el diagrama de cronología en el DOM. Si builder ya lo ha hecho, ' +
               'puede que no lo reconozca: busco «crono», «timeline», «linea-tiempo» o «edad» en las clases',
    });
  } else {
    /* Los valores. La vía fiable es `data-tick="<valor>"` en cada <text>; si no está,
       se intenta parsear la unidad del rótulo, y si tampoco se puede, se abstiene. */
    const UNIDADES = [
      [/(\d+(?:[.,]\d+)?)\s*(?:s|seg|segundos?)\b/i, 1],
      [/(\d+(?:[.,]\d+)?)\s*(?:min|minutos?)\b/i, 60],
      [/(\d+(?:[.,]\d+)?)\s*(?:h|horas?)\b/i, 3600],
      [/(\d+(?:[.,]\d+)?)\s*(?:d|dias?|días?)\b/i, 86400],
      [/(\d+(?:[.,]\d+)?)\s*(?:sem|semanas?)\b/i, 604800],
      [/(\d+(?:[.,]\d+)?)\s*(?:mes(?:es)?)\b/i, 2629800],
      [/(\d+(?:[.,]\d+)?)\s*(?:a|años?|anos?)\b/i, 31557600],
      [/(\d+(?:[.,]\d+)?)\s*(?:dec|décadas?|decadas?)\b/i, 315576000],
    ];
    const aSegundos = (t) => {
      for (const [re, k] of UNIDADES) {
        const m = t.match(re);
        if (m) return parseFloat(m[1].replace(',', '.')) * k;
      }
      // «una década», «un año»: sin cifra explícita.
      if (/d[eé]cada/i.test(t)) return 315576000;
      if (/\ba[ñn]o\b/i.test(t)) return 31557600;
      if (/\bmes\b/i.test(t)) return 2629800;
      if (/\bsemana\b/i.test(t)) return 604800;
      if (/\bd[ií]a\b/i.test(t)) return 86400;
      if (/\bhora\b/i.test(t)) return 3600;
      return null;
    };

    const rotulos = [...crono.querySelectorAll('text')];
    const marcas = [];
    let fuente = null;

    for (const t of rotulos) {
      const attr = t.getAttribute('data-tick');
      const valor = attr != null && attr !== '' && isFinite(Number(attr))
        ? Number(attr)
        : aSegundos(texto(t));
      if (valor == null || !(valor > 0)) continue;
      if (attr != null) fuente = fuente === 'texto' ? 'mixto' : 'data-tick';
      else fuente = fuente === 'data-tick' ? 'mixto' : 'texto';
      const r = t.getBoundingClientRect();
      marcas.push({ rotulo: texto(t), valor, x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 });
    }

    // ¿Hay marcas gráficas (líneas/rects finos) además de los rótulos?
    const marcasGraficas = [...crono.querySelectorAll('line, rect, path')].filter((el) => {
      const r = el.getBoundingClientRect();
      return (r.width <= 3 && r.height >= 4) || (r.height <= 3 && r.width >= 4);
    }).length;

    if (marcas.length === 0) {
      fallos.push({
        caso: 'eje logarítmico sin marcas rotuladas',
        que: 'la cronología no tiene ni un rótulo del que pueda leer un valor',
        rotulos_en_el_svg: rotulos.length,
        marcas_graficas: marcasGraficas,
        por_que_importa: 'un eje log sin rótulos hace leer las distancias como proporciones lineales, ' +
                         'y en un log un tramo del doble de largo puede ser mil veces el valor',
        gravedad: 'alta', dueño: 'builder',
      });
      ejeLog = { medible: false, motivo: 'sin rótulos con valor legible', rotulos: rotulos.map(texto) };
    } else if (marcas.length < 3) {
      abstenciones.push({
        que: 'no puedo comprobar si el eje es de verdad logarítmico',
        por_que: `solo ${marcas.length} marca(s) con valor; hacen falta 3 para regresar posición contra log(valor)`,
        marcas: marcas.map((m) => m.rotulo),
      });
      ejeLog = { medible: false, motivo: 'menos de 3 marcas con valor', marcas };
    } else {
      // ¿Eje horizontal o vertical? El que más varíe.
      const varianza = (xs) => {
        const m = xs.reduce((a, b) => a + b, 0) / xs.length;
        return xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length;
      };
      const horizontal = varianza(marcas.map((m) => m.x)) >= varianza(marcas.map((m) => m.y));
      const pos = marcas.map((m) => (horizontal ? m.x : m.y));
      const log = marcas.map((m) => Math.log10(m.valor));

      // Regresión lineal de pos contra log(valor) y R².
      const n = marcas.length;
      const mx = log.reduce((a, b) => a + b, 0) / n;
      const my = pos.reduce((a, b) => a + b, 0) / n;
      let sxy = 0, sxx = 0, syy = 0;
      for (let i = 0; i < n; i++) {
        sxy += (log[i] - mx) * (pos[i] - my);
        sxx += (log[i] - mx) ** 2;
        syy += (pos[i] - my) ** 2;
      }
      const r2 = sxx > 0 && syy > 0 ? (sxy * sxy) / (sxx * syy) : 0;
      const pendiente = sxx > 0 ? sxy / sxx : 0;

      // Contraste: ¿encaja mejor una escala lineal? Si sí, no es un eje log.
      let sxyL = 0, sxxL = 0;
      const lin = marcas.map((m) => m.valor);
      const mL = lin.reduce((a, b) => a + b, 0) / n;
      for (let i = 0; i < n; i++) { sxyL += (lin[i] - mL) * (pos[i] - my); sxxL += (lin[i] - mL) ** 2; }
      const r2lineal = sxxL > 0 && syy > 0 ? (sxyL * sxyL) / (sxxL * syy) : 0;

      ejeLog = {
        medible: true,
        eje: horizontal ? 'horizontal' : 'vertical',
        fuente_del_valor: fuente,
        marcas: marcas.map((m) => ({ rotulo: m.rotulo, valor_s: m.valor, px: Math.round(horizontal ? m.x : m.y) })),
        marcas_graficas: marcasGraficas,
        r2_contra_log: Number(r2.toFixed(4)),
        r2_contra_lineal: Number(r2lineal.toFixed(4)),
        px_por_decada: Math.round(Math.abs(pendiente)),
        decadas_cubiertas: Number((Math.max(...log) - Math.min(...log)).toFixed(2)),
      };

      if (r2 < 0.97) {
        fallos.push({
          caso: 'el eje se rotula como logarítmico pero no lo es',
          que: 'las marcas no caen en línea sobre log(valor)',
          r2_contra_log: ejeLog.r2_contra_log,
          r2_contra_lineal: ejeLog.r2_contra_lineal,
          marcas: ejeLog.marcas,
          por_que_importa: 'con rótulos puestos el dibujo parece verificado, así que un eje mal ' +
                           'escalado engaña más que uno sin rotular',
          gravedad: 'alta', dueño: 'builder',
        });
      }
      if (marcasGraficas === 0) {
        avisos.push({
          caso: 'rótulos sin marca gráfica',
          que: 'los valores están rotulados pero no veo la marquita del eje a la que se refieren',
          dueño: 'builder',
        });
      }
      if (fuente === 'texto') {
        avisos.push({
          caso: 'valores deducidos del texto',
          que: 'he parseado los valores del rótulo por falta de data-tick. Si builder cambia la ' +
               'redacción («1 sem» → «una semanita») dejaré de poder medirlo',
          dueño: 'builder',
        });
      }
    }
  }

  /* ── 3. animación: parpadeo de 1 ms y estado final sin pintar ───────────── */

  const animables = [];
  for (const s of svgs) {
    animables.push(s, ...s.querySelectorAll('*'));
  }
  // Los contenedores desplegados también animan (el propio despegue).
  for (const d of document.querySelectorAll('details[open] > *')) animables.push(d);

  const conAnimacion = [];
  for (const el of animables) {
    if (el.nodeType !== 1) continue;
    const cs = getComputedStyle(el);
    const nombre = cs.animationName;
    const dur = Math.max(...seg(cs.animationDuration));
    const iter = cs.animationIterationCount;
    const tieneAnim = nombre && nombre !== 'none';
    // Estado que delataría un keyframe iniciado y no terminado.
    const opacidad = parseFloat(cs.opacity);
    const dash = parseFloat(cs.strokeDashoffset) || 0;
    const trans = cs.transform;

    if (!tieneAnim && !reduce) continue;

    if (tieneAnim) {
      conAnimacion.push({
        el: el.tagName.toLowerCase() + '.' + String(el.getAttribute('class') || '').split(' ')[0],
        animacion: nombre, duracion_s: dur, iteraciones: iter,
      });
    }

    if (!reduce) continue;

    /* (a) parpadeo: la animación sigue viva y dura un frame o menos. */
    if (tieneAnim && dur > 0 && dur < 0.05 && iter !== 'infinite') {
      fallos.push({
        caso: 'con reduce parpadea en vez de pintarse',
        que: 'la animación de un disparo sigue activa con duración de un frame: salta del estado ' +
             'inicial al final de golpe, que es el parpadeo que reduce venía a evitar',
        elemento: el.tagName.toLowerCase() + '.' + String(el.getAttribute('class') || '').split(' ')[0],
        animacion: nombre, duracion_ms: Math.round(dur * 1000),
        arreglo: 'animation: none + fijar el estado final (opacity/transform/stroke-dashoffset)',
        gravedad: 'media', dueño: 'builder',
      });
    }

    /* (b) el fallo silencioso: animación anulada y estado final NO pintado. */
    const invisible = opacidad === 0;
    const trazoSinPintar = dash !== 0 && el.getAttribute('stroke-dasharray');
    if (!tieneAnim && (invisible || trazoSinPintar)) {
      const r = el.getBoundingClientRect();
      if (r.width > 1 || r.height > 1) {
        fallos.push({
          caso: 'con reduce el diagrama no se pinta',
          que: 'la animación está anulada pero el estado final no se ha fijado, así que el elemento ' +
               'se queda como empezó: invisible',
          elemento: el.tagName.toLowerCase() + '.' + String(el.getAttribute('class') || '').split(' ')[0],
          opacidad: opacidad, stroke_dashoffset: dash,
          por_que_importa: 'el diagrama desaparece solo para quien activó «reducir movimiento»: la ' +
                           'página castiga a quien usa una opción de accesibilidad, y sin un error en consola',
          arreglo: 'añadirlo al bloque @media (prefers-reduced-motion: reduce) con opacity:1 / stroke-dashoffset:0',
          gravedad: 'alta', dueño: 'builder',
        });
      }
    }
    void trans;
  }

  /* SMIL: la media query no lo toca nunca. */
  const smil = [...document.querySelectorAll('animate, animateTransform, animateMotion, set')];
  if (reduce && smil.length) {
    fallos.push({
      caso: 'SMIL con reduce',
      que: `${smil.length} animación(es) SMIL dentro de SVG; prefers-reduced-motion no las afecta`,
      arreglo: 'pararlas desde JS consultando matchMedia, o no usarlas',
      gravedad: 'alta', dueño: 'builder',
    });
  }

  /* ── 4. informe ─────────────────────────────────────────────────────────── */

  const informe = {
    ok: fallos.length === 0,
    modo,
    resumen:
      `[${modo}] ${svgs.length} diagrama(s) en ${ambito} · ${conAnimacion.length} con animación · ` +
      `${fallos.length} fallo(s) · ${abstenciones.length} abstención(es)` +
      (ejeLog && ejeLog.medible ? ` · eje log R²=${ejeLog.r2_contra_log}` : ' · eje log: no medible'),
    ambito,
    diagramas_encontrados: svgs.length,
    inventario,
    eje_logaritmico: ejeLog,
    con_animacion: conAnimacion.slice(0, 40),
    smil: smil.length,
    fallos,
    avisos,
    abstenciones,
  };

  console.log(informe.ok ? '✓ diagramas' : '✗ diagramas', informe.resumen);
  if (console.table) {
    console.table(inventario);
    if (fallos.length) console.table(fallos);
  }
  if (abstenciones.length) console.log('· diagramas — no medible:', abstenciones);
  window.qaDiagramas = () => informe;
  return informe;
})();
