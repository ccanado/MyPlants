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

  /* Diagramas dibujados con HTML+CSS, que un buscador de `<svg>` no ve. Se identifican
     por clase y se exige que tengan estructura de eje (marcas o tics), para no contar
     cualquier contenedor con un nombre sugestivo. */
  /* Los diagramas HTML se buscan SIEMPRE en el documento, no en el ámbito. La
     cronología es de página —vive fuera de cualquier `<article>`— así que con una ficha
     abierta `raiz` es la ficha y no la veía nunca: informaba «eje log: no medible» sin
     decir que ni la había encontrado. Lo cazó `builder`, y es el mismo pecado que ya
     tenía anotado en este fichero: silencio, un instrumento que no encuentra algo y no
     dice que no lo encuentra. */
  const htmlDiagramas = [...document.querySelectorAll(
    '[class*="cronologia"], [class*="crono"], [class*="linea-tiempo"], [data-diagrama]')]
    .filter((el) => el.tagName.toLowerCase() !== 'svg')
    .filter((el) => !el.parentElement || !el.parentElement.closest('[class*="cronologia"]'))
    .filter((el) => el.querySelectorAll('[class*="tic"], [class*="marca"], [class*="pista"]').length >= 2)
    .filter((el) => {
      const c = getComputedStyle(el);
      if (c.display === 'none' || c.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 60 && r.height > 20;
    });

  const svgs = [...raiz.querySelectorAll('svg')].filter((s) => {
    if (s.closest('svg') !== s) return false;             // no anidados
    const r = s.getBoundingClientRect();
    if (r.width < 60 || r.height < 40) return false;      // iconos fuera
    const cs = getComputedStyle(s);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    return s.querySelectorAll('*').length >= 6;
  });

  const graficos = [...svgs, ...htmlDiagramas];

  if (!graficos.length) {
    const informe = {
      ok: true, no_medible: true, modo,
      motivo: 'no hay ningún diagrama (ni SVG ni HTML) en el DOM. ¿Se lanzó con --abrir 0?',
      resumen: 'no medible: sin diagramas en pantalla',
    };
    console.log('· diagramas — no medible:', informe.motivo);
    window.qaDiagramas = () => informe;
    return informe;
  }

  const esSVGDiagrama = (el) => el.tagName.toLowerCase() === 'svg';

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

  for (const s of graficos) {
    const f = familia(s);
    const titulo = texto(s.querySelector('title'));
    const rotulos = (esSVGDiagrama(s)
      ? [...s.querySelectorAll('text')]
      : [...s.querySelectorAll('[class*="tic"], [class*="nombre"], [class*="valor"]')]
      ).map(texto).filter(Boolean);

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
    /* El punto 6.5 es una regla de **SVG**: `role="img"` + `<title>` dentro. Aplicarla a
       un diagrama hecho con HTML no tiene sentido y era un falso positivo propio — la
       cronología es un `<div>` con `cronologia__tic`, así que `querySelector('title')`
       no devuelve nada y el test la acusaba de no tener título. Su accesibilidad se
       resuelve de otra forma y ya la tiene: la `<section>` va con `aria-labelledby`, y
       cada fila es texto real («Poto, más de 20 años»), no un gráfico que haya que
       describir. Cuarta corrección de este auditor y todas de la misma raíz:
       generalizarlo a más diagramas sin generalizar sus criterios. */
    if (esSVGDiagrama(s) && !decorativo && (!s.getAttribute('role') || !titulo)) {
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

  /* ── 2. ¿el eje dice la verdad? ─────────────────────────────────────────── */

  /* Generalizado a propósito, y no por elegancia. La primera versión solo auditaba el
     eje de la cronología, porque era el que el encargo mencionaba. Mientras lo escribía,
     `ux-lead` encontró **a mano** que el diagrama de recuperación tenía exactamente este
     defecto: sus círculos van en `cx` 10/30/50/70/90/110 —espaciado perfectamente
     regular— para pasos que son inmediato / inmediato / esta semana / 3 semanas /
     2-3 meses / sin fecha, y va rotulado con dos fechas. El eje codifica el **índice**
     del paso, no el tiempo, así que afirma que de "esta semana" a "3 semanas" hay lo
     mismo que de "3 semanas" a "2-3 meses". El diagrama se borró.

     Y lo que importa para mí: **ese diagrama pasó mi informe 2 en verde.** Escribí que
     "los cuatro diagramas se construyen y se ven", que era cierto y era irrelevante.
     Comprobé que existía y no que dijera la verdad. Así que el test no pregunta por un
     diagrama concreto: le pregunta a todos si su geometría sostiene sus rótulos.

     Tres ajustes y el que gane manda:
       · posición vs log(valor)  → escala logarítmica
       · posición vs valor       → escala lineal
       · posición vs índice      → NO es una escala: es un reparto regular disfrazado

     El tercero es el que engaña, y solo se puede acusar por comparación. Si los valores
     rotulados están de por sí repartidos regularmente, índice y valor coinciden, el
     ajuste lineal también sale alto y no hay mentira ninguna: por eso gana el lineal
     antes que el índice y por eso no se levanta un fallo ahí. */

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

  const aValor = (t) => {
    const s = String(t || '').trim();
    if (!s) return null;
    /* Una fecha NO es un valor de eje, y colarla como número es un falso positivo con
       forma de hallazgo. Ocurrió: en el diagrama de recuperación el rótulo
       `01/09/2026` se parseó como el valor `1` situado a 376 px, entre el `5` (365) y
       el `6` (428). Ese único punto fuera de sitio hundió el ajuste lineal de 0,99 a
       0,425 y dejó ganar al ajuste por índice, así que el test "detectó" que el eje
       codificaba el índice. La conclusión coincidía con la que `ux-lead` había
       encontrado a mano, y por eso estuvo a punto de pasar: **el resultado parecía una
       confirmación independiente y era un bug de parseo.** Un acierto por el motivo
       equivocado es un fallo que todavía no se ha manifestado. */
    if (/\d{1,4}[/\-.]\d{1,2}[/\-.]\d{2,4}/.test(s)) return null;
    for (const [re, k] of UNIDADES) {
      const m = s.match(re);
      if (m) return parseFloat(m[1].replace(',', '.')) * k;
    }
    if (/d[eé]cada/i.test(s)) return 315576000;
    if (/\ba[ñn]o\b/i.test(s)) return 31557600;
    if (/\bmes\b/i.test(s)) return 2629800;
    if (/\bsemana\b/i.test(s)) return 604800;
    if (/\bd[ií]a\b/i.test(s)) return 86400;
    if (/\bhora\b/i.test(s)) return 3600;
    // Un número suelto (grados, ml, niveles): sirve igual para juzgar la escala.
    const n = s.match(/^[^\d\-]*(-?\d+(?:[.,]\d+)?)/);
    return n ? parseFloat(n[1].replace(',', '.')) : null;
  };

  const r2 = (xs, ys) => {
    const n = xs.length;
    if (n < 3) return 0;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      sxy += (xs[i] - mx) * (ys[i] - my);
      sxx += (xs[i] - mx) ** 2;
      syy += (ys[i] - my) ** 2;
    }
    return sxx > 0 && syy > 0 ? (sxy * sxy) / (sxx * syy) : 0;
  };

  function auditarEje(s, f) {
    /* No todo diagrama es un SVG. La cronología está dibujada con HTML y CSS
       —`cronologia__pista`, `cronologia__marca`, `cronologia__tic`— y mi primera
       versión, que buscaba `<text>`, no la veía: informaba de 28 diagramas (7×4, los
       de las fichas) y de la cronología nada, ni como fallo ni como abstención.
       Silencio, que es el peor resultado posible — un instrumento que no encuentra
       algo y no dice que no lo encuentra. */
    const esSVG = s.tagName.toLowerCase() === 'svg';
    let rotulos;
    let fuenteRotulos;
    if (esSVG) {
      rotulos = [...s.querySelectorAll('text')];
      fuenteRotulos = '<text> del SVG';
    } else {
      /* **Solo las marcas del eje.** Tercera vez que este auditor se contamina por la
         misma razón, así que aquí va explícito: en la cronología conviven
         `cronologia__tic` (las marcas del eje: «1 semana», «1 mes», «1 año»…) con
         `cronologia__nombre` y `cronologia__valor` (el nombre de cada planta y su
         antigüedad). Los segundos NO están en el eje: están en la posición de su
         marcador, y varios comparten la misma x. Metiéndolos en la regresión salían
         diez «marcas» con tres pares en la misma coordenada, R² 0,18 contra log, y el
         veredicto «no se ajusta a nada» — que habría entrado en el informe como un
         defecto del diagrama cuando era un defecto de mi selector.
         Si hay clase de tic explícita, se usa **esa y nada más**. */
      const tics = [...s.querySelectorAll('[class*="tic"]')]
        .filter((el) => (el.textContent || '').trim());
      if (tics.length >= 3) {
        rotulos = tics;
        fuenteRotulos = 'elementos con clase *tic* (marcas del eje)';
      } else {
        rotulos = [...s.querySelectorAll('[class*="rotulo"], [class*="marca"], [class*="valor"]')]
          .filter((el) => (el.textContent || '').trim());
        fuenteRotulos = 'sin clase de tic: rótulos/marcas/valores, mezcla posible';
      }
    }
    const marcas = [];
    let fuente = null;
    for (const t of rotulos) {
      const attr = t.getAttribute('data-tick');
      const valor = (attr != null && attr !== '' && isFinite(Number(attr)))
        ? Number(attr) : aValor(texto(t));
      if (valor == null || !isFinite(valor)) continue;
      fuente = attr != null ? 'data-tick' : (fuente === 'data-tick' ? 'mixto' : 'texto');
      const r = t.getBoundingClientRect();
      marcas.push({ rotulo: texto(t), valor, x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 });
    }

    const marcasGraficas = [...s.querySelectorAll('line, rect, circle, path')].filter((el) => {
      const r = el.getBoundingClientRect();
      return (r.width <= 4 && r.height >= 4) || (r.height <= 4 && r.width >= 4) ||
             el.tagName.toLowerCase() === 'circle';
    }).length;

    if (marcas.length < 3) {
      return { diagrama: f, medible: false, marcas_con_valor: marcas.length,
               marcas_graficas: marcasGraficas,
               fuente_de_los_rotulos: fuenteRotulos,
        motivo: marcas.length === 0
                 ? 'ningún rótulo con valor legible: puede ser categórico (ordinal), y entonces está bien'
                 : 'solo ' + marcas.length + ' marca(s) con valor; hacen falta 3 para regresar' };
    }

    /* Rótulos que son 1, 2, 3… son **números de paso**, no valores de una escala, y
       repartirlos a espaciado regular es lo correcto. Aquí el índice y el valor son la
       misma cosa, así que ningún ajuste puede distinguirlos y no hay nada que acusar.
       Sin esta salida, el diagrama de recuperación —seis pasos numerados— caía en el
       veredicto «índice» y se levantaba un fallo sobre un dibujo que no miente.

       Lo que sí miente en ese diagrama es que las duraciones reales (inmediato / esta
       semana / 3 semanas / 2-3 meses) no son regulares, y eso **no está en ningún
       `<text>` del SVG**: no es medible desde aquí, y decir lo contrario sería inventar.
       Lo encontró `ux-lead` leyendo el contenido, que es donde estaba el dato. */
    /* La detección tiene que aguantar rótulos MEZCLADOS, y esto lo aprendí fallando
       dos veces con el mismo diagrama. La primera versión se contaminó con una fecha
       (`01/09/2026` → 1). Arreglé eso exigiendo que **todos** los valores fueran una
       tirada consecutiva… y el mismo diagrama volvió a colarse, ahora con
       `'+21 días'` (→ 1.814.400 s) entre los pasos `1…6`: un solo valor fuera de la
       tirada rompía la condición «todos», la regresión corría sobre datos sucios y
       salía otra vez «índice» con R² 0,98.

       Dos veces el mismo falso positivo por endurecer el caso concreto en vez del
       criterio. Así que ahora la regla es por **mayoría**: si la tirada ordinal
       consecutiva más larga cubre la mitad o más de las marcas, el eje es ordinal y se
       abstiene, listando los rótulos que sobran para que se puedan mirar. Un diagrama
       de pasos numerados con una anotación de duración encima sigue siendo un diagrama
       de pasos numerados. */
    const ordenados = marcas.map((m) => m.valor).slice().sort((a, b) => a - b);
    let mejorTirada = [];
    for (let i = 0; i < ordenados.length; i++) {
      const tirada = [ordenados[i]];
      for (let j = i + 1; j < ordenados.length; j++) {
        if (ordenados[j] === tirada[tirada.length - 1] + 1) tirada.push(ordenados[j]);
      }
      if (tirada.length > mejorTirada.length) mejorTirada = tirada;
    }
    const esOrdinal = mejorTirada.length >= 3 &&
      mejorTirada.length >= marcas.length / 2 &&
      mejorTirada.every((v) => Number.isInteger(v)) &&
      mejorTirada[0] >= 0 && mejorTirada[mejorTirada.length - 1] <= 40;
    if (esOrdinal) {
      const sobrantes = marcas
        .filter((m) => !mejorTirada.includes(m.valor))
        .map((m) => m.rotulo);
      return {
        diagrama: f, medible: false, marcas_con_valor: marcas.length,
        marcas_graficas: marcasGraficas,
        tirada_ordinal: mejorTirada[0] + '…' + mejorTirada[mejorTirada.length - 1],
        rotulos_fuera_de_la_tirada: sobrantes,
        motivo: 'los rótulos son ordinales consecutivos (' + mejorTirada[0] + '…' +
                mejorTirada[mejorTirada.length - 1] + ' en ' + mejorTirada.length + ' de ' +
                marcas.length + ' marcas): son números de paso, no valores de una escala, y ' +
                'espaciarlos regularmente es correcto' +
                (sobrantes.length ? '. Fuera de la tirada: ' + sobrantes.join(', ') +
                 ' — anotaciones, no marcas de eje' : '') +
                '. Si lo que representan son duraciones desiguales, el dato no está en el ' +
                'dibujo y hay que leerlo en el contenido',
      };
    }

    const varianza = (xs) => {
      const m = xs.reduce((a, b) => a + b, 0) / xs.length;
      return xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length;
    };
    const horizontal = varianza(marcas.map((m) => m.x)) >= varianza(marcas.map((m) => m.y));
    const orden = marcas.slice().sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y));
    const pos = orden.map((m) => (horizontal ? m.x : m.y));
    const val = orden.map((m) => m.valor);
    const idx = orden.map((_, i) => i);
    /* Un eje logarítmico **no puede representar el cero**: `log10(0)` es −∞. La
       cronología rotula «hoy» con `data-tick="0"`, que es un origen convencional y no
       un punto de la escala. Mi versión anterior exigía que TODOS los valores fueran
       positivos y, al no serlo, ponía `rLog = 0` — con lo que el ajuste por índice
       ganaba y el veredicto salía «índice» sobre un eje que es logarítmico de libro.
       Habría reportado como defecto el diagrama que `ux-lead` defendió y `builder`
       midió en 0,9995.

       Lo correcto es ajustar el logaritmo sobre el subconjunto con valor positivo y
       **decir cuántas marcas se excluyeron y por qué**, en vez de castigar al eje por
       tener un origen. Se exigen 3 marcas positivas para que la regresión signifique
       algo. */
    const idxPositivos = val.map((v, i) => (v > 0 ? i : -1)).filter((i) => i >= 0);
    const excluidasPorNoPositivas = orden
      .filter((m) => !(m.valor > 0))
      .map((m) => m.rotulo + ' (' + m.valor + ')');
    const rLog = idxPositivos.length >= 3
      ? r2(idxPositivos.map((i) => Math.log10(val[i])), idxPositivos.map((i) => pos[i]))
      : 0;
    const rLin = r2(val, pos);
    const rIdx = r2(idx, pos);

    let veredicto;
    if (rLog >= 0.97 && rLog >= rLin) veredicto = 'logarítmico';
    else if (rLin >= 0.97) veredicto = 'lineal';
    else if (rIdx >= 0.97) veredicto = 'índice';
    else veredicto = 'ninguno';

    // ¿Cuánto se distorsiona? El engaño solo importa si los valores no eran regulares.
    const huecos = [];
    for (let i = 1; i < val.length; i++) huecos.push(Math.abs(val[i] - val[i - 1]));
    const distorsion = huecos.length && Math.min(...huecos) > 0
      ? Math.max(...huecos) / Math.min(...huecos) : Infinity;

    return {
      diagrama: f, medible: true, eje: horizontal ? 'horizontal' : 'vertical',
      fuente_del_valor: fuente,
      fuente_de_los_rotulos: fuenteRotulos,
      marcas: orden.map((m) => ({ rotulo: m.rotulo, valor: m.valor, px: Math.round(horizontal ? m.x : m.y) })),
      marcas_graficas: marcasGraficas,
      r2_log: Number(rLog.toFixed(4)),
      marcas_en_el_ajuste_log: idxPositivos.length,
      excluidas_del_ajuste_log: excluidasPorNoPositivas,
      r2_lineal: Number(rLin.toFixed(4)),
      r2_indice: Number(rIdx.toFixed(4)),
      veredicto,
      distorsion_max_min: isFinite(distorsion) ? Number(distorsion.toFixed(1)) : null,
    };
  }

  const ejes = graficos.map((s) => auditarEje(s, familia(s)));

  for (const e of ejes) {
    if (!e.medible) {
      abstenciones.push({
        diagrama: e.diagrama,
        que: 'no puedo juzgar si su eje sostiene sus rótulos',
        por_que: e.motivo,
      });
      continue;
    }

    if (e.veredicto === 'índice') {
      fallos.push({
        caso: 'el eje codifica el índice, no el valor rotulado',
        diagrama: e.diagrama,
        que: 'las marcas están repartidas a espaciado regular mientras sus rótulos dicen valores ' +
             'muy desiguales, así que el dibujo afirma proporciones que el dato no tiene',
        r2_indice: e.r2_indice, r2_lineal: e.r2_lineal, r2_log: e.r2_log,
        distorsion_max_min: e.distorsion_max_min,
        marcas: e.marcas,
        gravedad: 'alta', dueño: 'builder',
      });
    } else if (e.veredicto === 'ninguno') {
      abstenciones.push({
        diagrama: e.diagrama,
        que: 'su eje no se ajusta ni a log, ni a lineal, ni al índice',
        r2: { log: e.r2_log, lineal: e.r2_lineal, indice: e.r2_indice },
        por_que: 'puede ser un eje de dos tramos, o marcas que no son de eje. No firmo un ' +
                 'veredicto que no puedo sostener: hay que mirarlo en la captura',
      });
    }

    // Si el diagrama se anuncia como logarítmico, tiene que serlo.
    const seDeclaraLog = /log/i.test(String(s0Clase(e.diagrama)) + ' ' + e.diagrama);
    if (seDeclaraLog && e.veredicto !== 'logarítmico') {
      fallos.push({
        caso: 'se anuncia logarítmico y no lo es',
        diagrama: e.diagrama, veredicto: e.veredicto,
        r2_log: e.r2_log, r2_lineal: e.r2_lineal, r2_indice: e.r2_indice,
        gravedad: 'alta', dueño: 'builder',
      });
    }
  }

  function s0Clase(f) {
    const s = graficos.find((x) => familia(x) === f);
    return s ? (s.getAttribute('class') || '') + ' ' + texto(s.querySelector('title')) : '';
  }

  /* La cronología, si existe, tiene que llevar marcas rotuladas: es la petición
     explícita del encargo, y un log sin rótulos miente sobre las proporciones. */
  const crono = graficos.find((s) => familia(s) === 'cronología');
  const ejeCrono = crono ? ejes.find((e) => e.diagrama === 'cronología') : null;
  if (!crono) {
    abstenciones.push({
      que: 'no puedo auditar el eje logarítmico de la cronología',
      por_que: 'no encuentro el diagrama en el DOM. `ux-lead` retiró su especificación en 4f1b350, ' +
               'así que puede que ya no exista a propósito — pero si builder lo ha construido y no ' +
               'lo reconozco, busco «crono», «timeline», «linea-tiempo» o «edad» en las clases',
    });
  } else if (ejeCrono && !ejeCrono.medible) {
    fallos.push({
      caso: 'eje logarítmico sin marcas rotuladas',
      diagrama: 'cronología',
      que: 'la cronología no tiene ni tres rótulos de los que pueda leer un valor',
      detalle: ejeCrono.motivo,
      por_que_importa: 'un eje log sin rótulos hace leer las distancias como proporciones lineales, ' +
                       'y en un log un tramo del doble de largo puede ser mil veces el valor',
      gravedad: 'alta', dueño: 'builder',
    });
  }

  const ejeLog = ejeCrono || null;

  /* ── 3. animación: parpadeo de 1 ms y estado final sin pintar ───────────── */

  const animables = [];
  for (const s of graficos) {
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
      `[${modo}] ${graficos.length} diagrama(s) (${svgs.length} svg + ${htmlDiagramas.length} html) en ${ambito} · ${conAnimacion.length} con animación · ` +
      `${fallos.length} fallo(s) · ${abstenciones.length} abstención(es)` +
      (ejeLog && ejeLog.medible ? ` · eje log R²=${ejeLog.r2_contra_log}` : ' · eje log: no medible'),
    ambito,
    diagramas_encontrados: graficos.length,
    diagramas_svg: svgs.length,
    diagramas_html: htmlDiagramas.length,
    ejes: ejes,
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
