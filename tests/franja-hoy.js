/* tests/franja-hoy.js — MyPlants / qa-visual
 *
 * Audita la honestidad de la franja `HOY`. No es un test de accesibilidad ni de
 * layout: es un test de **contenido de uso**, y existe porque el estándar de este
 * proyecto para el dato botánico —se verifica o se marca `null`, nunca se rellena a
 * ojo— tiene que aplicarse igual a un dato de calendario. Una web que afirma «hoy
 * toca regar» sin saber cuándo se regó no está siendo amable: está inventando.
 *
 * LOS TRES CASOS QUE MIDE, y por qué cada uno es el afilado
 *
 * 1. `riego` con `calculable: false` — `helecho`, `begonia-elatior` y `poto` tienen
 *    `ancla: null`, o sea que nadie ha marcado nunca un riego. Para esas tres, un
 *    «hoy le toca» es una afirmación sin dato debajo. El propio JSON lo argumenta en
 *    `por_que_no`, así que el contenido ya decidió bien: lo que se comprueba aquí es
 *    que el render no lo deshaga.
 *
 * 2. Vencidas — en las siete plantas hay **exactamente una** tarea `tipo: "vencida"`:
 *    el trasplante de la begonia, `desde: 2026-06-15`. Si la franja muestra dos, una
 *    se la ha inventado el render; si no muestra ninguna, se ha perdido la única
 *    cosa que de verdad va tarde.
 *
 * 3. Condicionadas — el caso que hace falta un test y no una lectura: `helecho` /
 *    `abonado` es `tipo: "temporada"` con `meses: [4,5,6,7,8]`. **Agosto entra.** El
 *    calendario cuadra perfectamente. Pero lleva `condicion: "solo cuando tenga 3 o
 *    4 frondes sanas desarrolladas; abonar una planta sin hoja quema raíces"`, y el
 *    helecho es justamente la planta que está sin hoja. Un render que filtre solo por
 *    mes sacará «Abonar el helecho» como tarea de hoy y estará dando un consejo que
 *    daña la planta. Es el único punto de esta página donde un fallo de filtrado
 *    tiene consecuencia física.
 *
 * MÉTODO, y dónde se abstiene
 *
 * Prefiere los atributos de datos (`data-tarea`, `data-planta`, `data-tarea-estado`)
 * porque son inequívocos. Cuando no están, cae al texto, y entonces **degrada el
 * hallazgo a `indicio`** en vez de firmarlo como fallo — salvo en el caso 1, donde la
 * frase «toca regar» es inequívoca por sí sola y no necesita markup para juzgarse.
 *
 * Esa degradación es deliberada. Esta sesión acumuló cinco falsos positivos y todos
 * salieron del mismo tronco: una herramienta que opina cuando no puede saber. El
 * coste de un falso positivo en un equipo de agentes no es el mío, es el del teammate
 * al que mando a arreglar lo que no está roto.
 *
 * Uso:
 *   python3 tests/runner.py --test franja-hoy
 *   python3 tests/runner.py --test franja-hoy --abrir 0
 *   // fecha fija para reproducir un resultado:
 *   window.__QA_HOY__ = '2026-08-11';
 */

(() => {
  'use strict';

  /* ── 0. el JSON, en síncrono ────────────────────────────────────────────── */

  // El runner llama a los tests de forma síncrona, así que aquí no vale `fetch`.
  // XHR síncrono está deprecado en producción y es exactamente lo correcto en un
  // test: mismo origen, un fichero pequeño, y el valor disponible al retornar.
  let datos = null;
  try {
    const x = new XMLHttpRequest();
    x.open('GET', './content/plantas.json', false);
    x.send(null);
    datos = JSON.parse(x.responseText);
  } catch (e) {
    const informe = {
      ok: true, no_medible: true,
      motivo: 'no se pudo leer content/plantas.json: ' + (e && e.message),
      resumen: 'no medible: sin JSON no hay contra qué comparar',
    };
    window.qaFranjaHoy = () => informe;
    return informe;
  }

  const plantas = (datos && datos.plantas) || [];
  const hoyISO = window.__QA_HOY__ ||
    (() => { const d = new Date(); const p = (v) => String(v).padStart(2, '0');
             return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
  const mesActual = Number(hoyISO.slice(5, 7));

  const norm = (s) => String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  /* ── 1. lo que el JSON dice que hay que hacer hoy ───────────────────────── */

  const esperado = {
    vencidas: [], hoy: [], proximas: [], pasadas: [],
    temporada_sin_condicion: [], condicionadas: [], riego_sin_ancla: [], riego_con_ancla: [],
  };

  for (const p of plantas) {
    for (const t of (p.tareas || [])) {
      const ref = { planta: p.id, nombre: p.nombre_comun, tarea: t.id, titulo: t.titulo, tipo: t.tipo };

      if (t.tipo === 'vencida') { esperado.vencidas.push(Object.assign({ desde: t.desde }, ref)); continue; }

      if (t.tipo === 'fecha') {
        if (t.fecha === hoyISO) esperado.hoy.push(Object.assign({ fecha: t.fecha }, ref));
        else if (t.fecha > hoyISO) esperado.proximas.push(Object.assign({ fecha: t.fecha }, ref));
        else esperado.pasadas.push(Object.assign({ fecha: t.fecha }, ref));
        continue;
      }

      if (t.tipo === 'condicionada') {
        esperado.condicionadas.push(Object.assign({ condicion: t.condicion, motivo: 'tipo condicionada' }, ref));
        continue;
      }

      if (t.tipo === 'temporada') {
        const enMes = Array.isArray(t.meses) && t.meses.includes(mesActual);
        if (t.condicion) {
          // El caso helecho/abonado: el mes cuadra pero la condición manda.
          esperado.condicionadas.push(Object.assign({
            condicion: t.condicion,
            motivo: enMes ? 'el mes cuadra pero tiene condición sin cumplir' : 'tiene condición, y además fuera de mes',
            calendario_cuadra: enMes,
          }, ref));
        } else if (enMes) {
          esperado.temporada_sin_condicion.push(Object.assign({ meses: t.meses }, ref));
        }
        continue;
      }

      if (t.tipo === 'ritmo') {
        const lista = t.calculable === false ? esperado.riego_sin_ancla : esperado.riego_con_ancla;
        lista.push(Object.assign({
          calculable: t.calculable === true,
          ancla: t.ancla || null,
          ancla_tipo: t.ancla_tipo || null,
          dias_verano: t.dias_verano,
        }, ref));
      }
    }
  }

  /* ── 2. lo que la página muestra ────────────────────────────────────────── */

  const franja = document.querySelector('.parte, #parte, [data-franja="hoy"]');
  const items = [...document.querySelectorAll('[data-tarea]')];
  const conAtributos = items.length > 0;

  const textoDe = (el) => (el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '');
  const visible = (el) => {
    if (!el) return false;
    if (el.closest('[hidden]')) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) return false;
    const c = getComputedStyle(el);
    return c.display !== 'none' && c.visibility !== 'hidden';
  };

  const fallos = [];
  const indicios = [];
  const abstenciones = [];

  const plantaDe = (el) => {
    const conAttr = el.closest('[data-planta]');
    if (conAttr) return conAttr.getAttribute('data-planta');
    const art = el.closest('article');
    if (art && art.id) return art.id;
    // Último recurso: buscar el nombre de alguna planta en el texto del elemento.
    const t = norm(textoDe(el));
    const encajan = plantas.filter((p) => t.includes(norm(p.nombre_comun)));
    return encajan.length === 1 ? encajan[0].id : null;
  };

  /* ── 3. CASO 1 · ningún «hoy toca regar» sin ancla ──────────────────────── */

  /* Esta comprobación no necesita atributos: la frase se juzga sola. Se buscan las
     formas que afirman que el riego es debido HOY, no las que describen un ritmo
     («cada 3 días» es correcto y no se toca). */
  const AFIRMA_RIEGO_HOY = [
    /hoy\s+(le\s+)?toca(?!\s+r?[ae]visar)/i,
    /toca\s+regar/i,
    /riego\s+(de\s+)?hoy/i,
    /regar\s+hoy/i,
    /hoy:\s*regar/i,
    /riego\s+vencid/i,
    /(te\s+)?debe\s+riego/i,
  ];

  const sinAncla = new Set(esperado.riego_sin_ancla.map((r) => r.planta));
  const candidatos = [...document.querySelectorAll('body *')].filter((el) => {
    if (el.children.length > 0) return false;      // solo hojas: evita contar 8 veces
    if (!visible(el)) return false;
    const t = textoDe(el);
    return t.length > 0 && t.length < 400 && AFIRMA_RIEGO_HOY.some((re) => re.test(t));
  });

  for (const el of candidatos) {
    const idPlanta = plantaDe(el);
    const frase = textoDe(el).slice(0, 160);
    if (!idPlanta) {
      abstenciones.push({
        que: 'una frase afirma un riego debido hoy y no consigo atribuirla a una planta',
        frase,
        por_que: 'sin data-planta ni <article id> alrededor; no firmo un fallo que no puedo atribuir',
      });
      continue;
    }
    if (sinAncla.has(idPlanta)) {
      const r = esperado.riego_sin_ancla.find((x) => x.planta === idPlanta);
      fallos.push({
        caso: 'riego afirmado sin dato',
        que: 'la página dice que hoy toca regar una planta cuyo último riego nadie ha marcado',
        planta: idPlanta,
        frase,
        json: 'riego.calculable = false · ancla = null · ancla_tipo = ' + (r && r.ancla_tipo),
        gravedad: 'alta',
        dueño: 'builder',
      });
    }
  }

  /* ── 4. CASO 2 · exactamente una vencida, y es la de la begonia ─────────── */

  const marcadasVencidas = items.filter((el) => {
    const e = norm(el.getAttribute('data-tarea-estado'));
    return e === 'vencida' || e === 'vencido';
  });
  const rotuloVaTarde = [...document.querySelectorAll('body *')]
    .filter((el) => el.children.length === 0 && visible(el) && /va\s+tarde/i.test(textoDe(el)));

  const esperadasVencidas = esperado.vencidas;

  if (conAtributos) {
    const vistas = marcadasVencidas.map((el) => ({
      planta: el.getAttribute('data-planta') || plantaDe(el),
      tarea: el.getAttribute('data-tarea'),
      texto: textoDe(el).slice(0, 100),
    }));
    const clave = (v) => v.planta + '/' + v.tarea;
    const esperadasClave = new Set(esperadasVencidas.map((v) => v.planta + '/' + v.tarea));

    for (const v of vistas) {
      if (!esperadasClave.has(clave(v))) {
        fallos.push({
          caso: 'vencida inventada',
          que: 'la franja marca como vencida una tarea que el JSON no da por vencida',
          planta: v.planta, tarea: v.tarea, texto: v.texto,
          gravedad: 'alta', dueño: 'builder',
        });
      }
    }
    for (const e of esperadasVencidas) {
      if (!vistas.some((v) => clave(v) === e.planta + '/' + e.tarea)) {
        fallos.push({
          caso: 'vencida perdida',
          que: 'la única tarea que va tarde de verdad no se muestra como vencida',
          planta: e.planta, tarea: e.tarea, desde: e.desde,
          gravedad: 'alta', dueño: 'builder',
        });
      }
    }
    // El rótulo tiene que existir, no solo el atributo: un estado que solo vive en
    // un data-attribute no lo lee nadie.
    if (vistas.length && !rotuloVaTarde.length) {
      indicios.push({
        caso: 'vencida sin rótulo visible',
        que: 'hay tareas marcadas como vencidas pero no encuentro el rótulo «VA TARDE» en pantalla',
        por_que: 'puede estar escrito de otra forma; comprobar en la captura',
        dueño: 'builder',
      });
    }
  } else {
    abstenciones.push({
      que: 'no puedo verificar el recuento de vencidas',
      por_que: 'ningún elemento con data-tarea / data-tarea-estado en el DOM. ' +
               'Con solo el texto no distingo «va tarde» de una mención en prosa',
      pedido_a: 'builder',
      rotulos_va_tarde_encontrados: rotuloVaTarde.length,
    });
    if (rotuloVaTarde.length) {
      /* Contar rótulos y compararlos con el número de tareas vencidas es una trampa:
         **la misma tarea puede aparecer en varios sitios** —el chip de la franja, la
         lista del expediente y la prosa del diagnóstico— y eso es correcto, no son
         tres invenciones. Lo que hay que contar son **plantas distintas**: si los tres
         rótulos hablan de la begonia, hay una vencida mostrada tres veces; si hablan
         de tres plantas, dos se las ha inventado el render.

         Sin esta distinción el indicio decía «3 rótulos y el JSON justifica 1», que
         suena a fallo y no lo es. Es exactamente la clase de número que manda a un
         teammate a arreglar algo que está bien. */
      const porPlanta = {};
      for (const el of rotuloVaTarde) {
        const id = plantaDe(el) || '(no atribuible)';
        porPlanta[id] = (porPlanta[id] || 0) + 1;
      }
      const plantasVistas = Object.keys(porPlanta).filter((k) => k !== '(no atribuible)');
      const esperadas = esperadasVencidas.map((v) => v.planta);
      const sobran = plantasVistas.filter((p) => !esperadas.includes(p));
      const faltan = esperadas.filter((p) => !plantasVistas.includes(p));

      if (sobran.length) {
        fallos.push({
          caso: 'vencida inventada',
          que: 'hay rótulo «VA TARDE» sobre plantas que el JSON no da por vencidas',
          plantas_de_mas: sobran,
          esperadas,
          gravedad: 'alta', dueño: 'builder',
        });
      }
      indicios.push({
        caso: 'vencidas por rótulo',
        que: `${rotuloVaTarde.length} rótulo(s) «VA TARDE» sobre ` +
             `${plantasVistas.length} planta(s) distinta(s); el JSON justifica ${esperadas.length}`,
        por_planta: porPlanta,
        coincide: sobran.length === 0 && faltan.length === 0,
        lectura: sobran.length === 0 && faltan.length === 0
          ? 'la misma tarea mostrada en varios sitios (chip, expediente, prosa), que es correcto'
          : 'revisar: las plantas no cuadran',
        no_atribuibles: porPlanta['(no atribuible)'] || 0,
      });
    }
  }

  /* ── 5. CASO 3 · ninguna condicionada presentada como tarea de hoy ──────── */

  const ESTADOS_DEBIDOS = new Set(['vencida', 'vencido', 'hoy', 'debida', 'pendiente-hoy']);

  for (const c of esperado.condicionadas) {
    // Por atributo: la vía fiable.
    if (conAtributos) {
      const encontrada = items.filter((el) =>
        norm(el.getAttribute('data-tarea')) === norm(c.tarea) &&
        norm(el.getAttribute('data-planta') || plantaDe(el) || '') === norm(c.planta));
      for (const el of encontrada) {
        const estado = norm(el.getAttribute('data-tarea-estado'));
        if (ESTADOS_DEBIDOS.has(estado)) {
          fallos.push({
            caso: 'condicionada presentada como debida',
            que: 'una tarea que depende de una condición sin cumplir se presenta como algo que hacer hoy',
            planta: c.planta, tarea: c.tarea,
            estado_en_el_dom: estado,
            condicion: c.condicion,
            calendario_cuadra: c.calendario_cuadra === true,
            por_que_importa: c.planta === 'helecho' && c.tarea === 'abonado'
              ? 'es el caso con consecuencia física: abonar un helecho sin hoja quema raíces'
              : 'el mes puede cuadrar; la condición es la que manda',
            gravedad: c.planta === 'helecho' && c.tarea === 'abonado' ? 'bloqueante' : 'alta',
            dueño: 'builder',
          });
        }
      }
      continue;
    }

    // Sin atributos: solo se puede mirar si el título aparece dentro de la franja.
    // Aparecer no es lo mismo que estar presentado como debido, así que es indicio.
    if (franja && c.titulo && norm(textoDe(franja)).includes(norm(c.titulo).slice(0, 30))) {
      indicios.push({
        caso: 'condicionada dentro de la franja',
        que: 'el título de una tarea condicionada aparece en la franja del día',
        planta: c.planta, tarea: c.tarea, condicion: c.condicion,
        calendario_cuadra: c.calendario_cuadra === true,
        por_que_es_indicio: 'puede estar listada como "cuando toque" y no como tarea de hoy; ' +
                            'sin data-tarea-estado no lo puedo distinguir',
        dueño: 'builder',
      });
    }
  }

  /* ── 6. cobertura: lo que sí toca hoy, ¿está? ───────────────────────────── */

  const debenSalir = [...esperado.vencidas, ...esperado.hoy];
  const ausentes = [];
  if (conAtributos) {
    for (const e of debenSalir) {
      const hay = items.some((el) =>
        norm(el.getAttribute('data-tarea')) === norm(e.tarea) &&
        norm(el.getAttribute('data-planta') || plantaDe(el) || '') === norm(e.planta));
      if (!hay) ausentes.push(e);
    }
    if (ausentes.length) {
      fallos.push({
        caso: 'trabajo real que no se muestra',
        que: `${ausentes.length} tarea(s) que el JSON sitúa hoy o vencidas no aparecen en ninguna parte`,
        tareas: ausentes.map((a) => a.planta + '/' + a.tarea),
        gravedad: 'media', dueño: 'builder',
      });
    }
  } else {
    abstenciones.push({
      que: 'no puedo verificar la cobertura de las tareas de hoy',
      por_que: 'hacen falta data-tarea / data-planta para cruzar sin adivinar',
      deberian_salir: debenSalir.map((a) => a.planta + '/' + a.tarea),
    });
  }

  /* ── 6b. el recuento de la franja, que cierra por aritmética lo que no
           se puede cerrar por atributo ──────────────────────────────────────── */

  /* Sin `data-tarea` no puedo señalar qué tarea concreta se presenta como debida. Pero
     si la franja **declara un total** («10 tareas»), ese número sí se puede falsar, y
     resulta que distingue exactamente el caso que importa:

         vencidas (1) + de hoy (4) + temporada sin condición (5)  = 10   ✓ correcto
         … + las 8 condicionadas                                  = 18   ✗ el defecto

     O sea que un solo entero decide si el render filtra por condición o solo por mes.
     Es el caso `helecho`/`abonado`: agosto entra en sus meses, así que un filtro por
     calendario lo colaría, y abonar un helecho sin hoja quema raíces.

     Preferible al atributo no, pero mucho preferible a abstenerse: la evidencia
     estaba en la pantalla y solo hacía falta sumar. */
  let recuento = null;
  if (franja) {
    const m = textoDe(franja).match(/(\d+)\s+tareas?\b/i);
    if (m) {
      const declarado = Number(m[1]);
      const debidas = esperado.vencidas.length + esperado.hoy.length +
                      esperado.temporada_sin_condicion.length;
      const conCondicionadas = debidas + esperado.condicionadas.length;
      recuento = {
        declarado_en_pantalla: declarado,
        esperado_sin_condicionadas: debidas,
        seria_con_condicionadas: conCondicionadas,
        cuadra: declarado === debidas,
      };
      if (declarado === conCondicionadas && conCondicionadas !== debidas) {
        fallos.push({
          caso: 'condicionada presentada como debida',
          que: 'el total de la franja coincide con incluir las tareas condicionadas: el render ' +
               'filtra por calendario y no por condición',
          declarado: declarado, sin_condicionadas: debidas,
          el_caso_afilado: 'helecho/abonado — agosto entra en meses [4,5,6,7,8] pero la condición ' +
                           'exige 3-4 frondes sanas, y el helecho está sin hoja: abonarlo quema raíces',
          gravedad: 'bloqueante', dueño: 'builder',
        });
      } else if (declarado !== debidas) {
        indicios.push({
          caso: 'el total de la franja no cuadra con ninguna de las dos cuentas',
          declarado, sin_condicionadas: debidas, con_condicionadas: conCondicionadas,
          por_que_es_indicio: 'puede contar otra cosa (p. ej. incluir próximas). No firmo un ' +
                              'fallo sin saber qué está contando',
        });
      }
    }
  }

  /* ── 7. la fecha es la del navegador, no una constante ──────────────────── */

  let fechaEnPantalla = null;
  if (franja) {
    const m = textoDe(franja).match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (m) {
      fechaEnPantalla = m[1];
      if (m[1] !== hoyISO) {
        fallos.push({
          caso: 'fecha congelada',
          que: 'la franja muestra una fecha que no es la de hoy',
          en_pantalla: m[1], hoy: hoyISO,
          gravedad: 'alta', dueño: 'builder',
        });
      }
    }
  }

  if (!franja) {
    abstenciones.push({
      que: 'no encuentro la franja del día en el DOM',
      por_que: 'buscado como .parte, #parte y [data-franja="hoy"]',
    });
  } else if (!visible(franja)) {
    indicios.push({
      caso: 'franja oculta',
      que: 'la franja existe en el DOM pero no está visible (¿hidden sin quitar?)',
      dueño: 'builder',
    });
  }

  /* ── 8. informe ─────────────────────────────────────────────────────────── */

  const informe = {
    ok: fallos.length === 0,
    resumen:
      `hoy ${hoyISO} · ${fallos.length} fallo(s), ${indicios.length} indicio(s), ` +
      (recuento ? `recuento ${recuento.declarado_en_pantalla} ${recuento.cuadra ? '✓ cuadra' : '✗ NO cuadra'} (sería ${recuento.seria_con_condicionadas} con las condicionadas) · ` : '') +
      `${abstenciones.length} abstención(es) · ` +
      (conAtributos ? `${items.length} tarea(s) con data-tarea` : 'sin data-tarea: medido a medias'),
    hoy: hoyISO,
    medido_con_atributos: conAtributos,
    franja_presente: !!franja,
    franja_visible: visible(franja),
    fecha_en_pantalla: fechaEnPantalla,
    recuento_de_la_franja: recuento,
    tareas_en_el_dom: items.length,
    /* El texto literal de la franja va en el informe. Sin `data-tarea` el test se
       abstiene en varios puntos, y una abstención sin la evidencia al lado obliga a
       quien lee el informe a volver a abrir el navegador. Con el texto delante, un
       humano cierra en diez segundos lo que el test no puede firmar. */
    franja_texto: textoDe(franja).slice(0, 1200),
    esperado_del_json: {
      vencidas: esperado.vencidas.map((t) => t.planta + '/' + t.tarea),
      hoy: esperado.hoy.map((t) => t.planta + '/' + t.tarea),
      proximas: esperado.proximas.map((t) => t.planta + '/' + t.tarea + ' @' + t.fecha),
      pasadas_de_fecha: esperado.pasadas.map((t) => t.planta + '/' + t.tarea + ' @' + t.fecha),
      temporada_sin_condicion: esperado.temporada_sin_condicion.map((t) => t.planta + '/' + t.tarea),
      condicionadas_nunca_debidas: esperado.condicionadas.map((t) =>
        t.planta + '/' + t.tarea + (t.calendario_cuadra ? ' (¡el mes cuadra!)' : '')),
      riego_sin_ancla: esperado.riego_sin_ancla.map((t) => t.planta),
      riego_con_ancla: esperado.riego_con_ancla.map((t) => t.planta + ' @' + t.ancla),
    },
    fallos,
    indicios,
    abstenciones,
  };

  console.log(informe.ok ? '✓ franja-hoy' : '✗ franja-hoy', informe.resumen);
  if (fallos.length && console.table) console.table(fallos);
  if (indicios.length && console.table) console.table(indicios);
  if (abstenciones.length) console.log('· franja-hoy — no medible:', abstenciones);
  window.qaFranjaHoy = () => informe;
  return informe;
})();
