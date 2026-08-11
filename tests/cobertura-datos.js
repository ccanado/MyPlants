/* tests/cobertura-datos.js — MyPlants / qa-visual
 *
 * Responde a una pregunta que ningún otro test del proyecto hace:
 * **¿todo lo que `botanist` escribió llega de verdad a la pantalla?**
 *
 * Existe por un fallo real. `botanist` renombró el campo `estado` (objeto) a
 * `estados` (array); `js/datos.js` siguió leyendo el singular; y las siete fichas
 * se quedaron sin diagnóstico, sin distintivo de severidad, sin filtro de estado y
 * sin orden por urgencia — con la portada afirmando «Las 7 están bien. Hoy no hay
 * nada urgente.» mientras el helecho estaba en `critica`.
 *
 * Lo que hace que sea peligroso es que NADA falla: la consola queda limpia, los
 * cuatro scripts de terminal siguen en verde y el JSON es válido. Un campo que no
 * existe se evalúa a `undefined` y el render simplemente no pinta ese trozo.
 *
 * Método: coger el JSON crudo, y para cada campo con texto comprobar si una porción
 * distintiva de ese texto aparece en el DOM. La señal fuerte es la **ausencia
 * sistemática**: un campo que falta en UNA planta puede ser una decisión de diseño;
 * un campo con contenido en las siete que no aparece en ninguna es un cable suelto.
 *
 * Uso:
 *   python3 tests/runner.py --test cobertura-datos            (rejilla cerrada)
 *   python3 tests/runner.py --test cobertura-datos --abrir 0  (con una ficha abierta)
 *
 * Ojo al leerlo: en la rejilla cerrada es NORMAL que falten los campos que solo se
 * pintan al desplegar. Por eso el informe separa "falta en todas" de "falta en
 * algunas", y por eso conviene ejecutarlo con `--abrir`.
 */

(() => {
  'use strict';

  // Campos estructurales o de presentación: no son texto que deba verse tal cual.
  const NO_SON_TEXTO_VISIBLE = new Set([
    'id', 'foto', 'foto_etiqueta', 'alt', 'alt_etiqueta', 'fuentes',
    'fecha_llegada', 'revisar_fecha', 'fecha_foto', 'orden', 'slug',
  ]);

  const norm = (s) => String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  /* Extrae fragmentos de texto "buscables" de un valor de cualquier forma:
     cadena, número, array u objeto anidado. Devuelve trozos largos, que son los
     que no pueden coincidir por casualidad. */
  function fragmentos(valor, profundidad = 0) {
    if (valor == null || profundidad > 4) return [];
    if (typeof valor === 'string') {
      const t = valor.trim();
      return t.length >= 12 ? [t] : [];
    }
    /* Los números NO se buscan. Un `dias_en_casa: 74` se pinta como "74 días" o
       "Lleva 74 días en casa" o dentro de una frase de otro campo, y "74" es
       demasiado corto para casar sin falsos positivos en los dos sentidos. Buscarlos
       marcaba como ausentes todos los campos numéricos del JSON. Se prefiere no
       opinar a opinar mal. */
    if (typeof valor === 'number') return [];
    if (Array.isArray(valor)) return valor.flatMap((v) => fragmentos(v, profundidad + 1));
    if (typeof valor === 'object') {
      return Object.entries(valor)
        .filter(([k]) => !NO_SON_TEXTO_VISIBLE.has(k))
        .flatMap(([, v]) => fragmentos(v, profundidad + 1));
    }
    return [];
  }

  // Una "huella": las primeras palabras del fragmento, suficientes para ser único.
  const huella = (t) => norm(t).split(' ').slice(0, 6).join(' ');

  function informe(json) {
    const plantas = Array.isArray(json) ? json : (json.plantas || []);
    if (!plantas.length) return { ok: false, resumen: 'el JSON no trae plantas', fallos: [] };

    /* textContent y NO innerText: Chrome omite de innerText los subárboles que ha
       saltado con content-visibility (las fichas fuera de pantalla), así que innerText
       daría "no se ve" para contenido que sí está pintado. Es el mismo artefacto que
       infla los recuentos de enfocables. */
    const textoPagina = norm(document.body.textContent || '');

    // por campo: en cuántas plantas tiene contenido y en cuántas se ve
    const porCampo = new Map();
    const detallePorPlanta = [];

    for (const p of plantas) {
      const art = document.getElementById(p.id) ||
                  [...document.querySelectorAll('article')].find(
                    (a) => norm(a.textContent).includes(huella(p.nombre_comun || '')));
      const textoArt = art ? norm(art.textContent || '') : '';
      const faltanAqui = [];

      for (const [campo, valor] of Object.entries(p)) {
        if (NO_SON_TEXTO_VISIBLE.has(campo)) continue;
        const frs = fragmentos(valor);
        if (!frs.length) continue;

        if (!porCampo.has(campo)) porCampo.set(campo, { conDatos: 0, visibles: 0, plantasSinVer: [] });
        const acc = porCampo.get(campo);
        acc.conDatos++;

        // basta con que UNO de los fragmentos del campo se vea: el render puede
        // resumir, y exigir que aparezca todo daría falsos positivos constantes
        const seVe = frs.some((f) => {
          const h = huella(f);
          return h.length >= 12 && (textoArt.includes(h) || textoPagina.includes(h));
        });

        if (seVe) acc.visibles++;
        else { acc.plantasSinVer.push(p.id); faltanAqui.push(campo); }
      }

      detallePorPlanta.push({ id: p.id, encontradaEnDOM: !!art, camposSinPintar: faltanAqui });
    }

    const fallos = [];
    const avisos = [];
    for (const [campo, a] of [...porCampo.entries()].sort()) {
      if (a.visibles === 0 && a.conDatos > 0) {
        fallos.push({
          campo,
          gravedad: a.conDatos === plantas.length ? 'CABLE SUELTO' : 'ausencia total',
          detalle: `tiene contenido en ${a.conDatos} de ${plantas.length} plantas y NO SE VE EN NINGUNA — ` +
                   `probable desajuste entre el nombre del campo en el JSON y el que lee js/`,
        });
      } else if (a.plantasSinVer.length) {
        avisos.push({
          campo,
          detalle: `no se ve en ${a.plantasSinVer.length} de ${a.conDatos}: ${a.plantasSinVer.join(', ')}`,
        });
      }
    }

    const ok = fallos.length === 0;
    const out = {
      ok,
      resumen: `${plantas.length} plantas · ${porCampo.size} campos con contenido · ` +
               `${fallos.length} campo(s) que no llegan a la página · ${avisos.length} parcial(es)`,
      fallos,
      avisos,
      detallePorPlanta,
      nota: 'En la rejilla cerrada es normal que falten los campos que solo se pintan al ' +
            'desplegar. Ejecuta también con --abrir antes de dar por bueno un "parcial".',
    };
    if (console.table) {
      console.log(ok ? '✓ cobertura de datos' : '✗ cobertura de datos', out.resumen);
      if (fallos.length) console.table(fallos);
      if (avisos.length) console.table(avisos);
    }
    return out;
  }

  // El fetch es asíncrono, pero el runner necesita un valor síncrono: se usa la
  // copia que la propia página ya cargó si está expuesta, y si no, XHR síncrono,
  // que aquí es aceptable porque es código de test contra un fichero local.
  let json = window.__PLANTAS__ || null;
  if (!json) {
    try {
      const x = new XMLHttpRequest();
      x.open('GET', './content/plantas.json', false);
      x.send(null);
      json = JSON.parse(x.responseText);
    } catch (e) {
      return { ok: false, resumen: 'no pude leer content/plantas.json: ' + e.message, fallos: [] };
    }
  }

  window.qaCobertura = () => informe(json);
  return informe(json);
})();
