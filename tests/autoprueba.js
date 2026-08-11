/* tests/autoprueba.js — MyPlants / qa-visual
 *
 * NO auditа la página: le inyecta defectos a propósito para comprobar que los tests
 * de la pasada 3 los cazan. Es el instrumento que mide los instrumentos.
 *
 * POR QUÉ EXISTE
 *
 * Esta sesión ha gastado tres ciclos en falsos positivos y uno entero discutiendo si
 * un test parpadeaba. La conclusión que quedó escrita en el informe 2 es que el coste
 * de un falso positivo en un equipo de agentes no lo paga quien lo emite, lo paga el
 * teammate al que manda a arreglar lo que no está roto.
 *
 * Pero hay un segundo error, simétrico y más silencioso: el **falso negativo**. Un
 * test en verde que en realidad no mira nada. `franja-hoy` y `diagramas` son nuevos, y
 * si su primera ejecución sale en verde no puedo distinguir «no hay defectos» de «mi
 * test no sabe verlos». Un test que nunca he visto fallar no es un test verificado,
 * es una intención. Así que aquí se le pone delante un defecto conocido y se exige
 * que lo encuentre.
 *
 * LOS CUATRO DEFECTOS QUE INYECTA
 *
 *   1. «Hoy le toca regar» dentro de la ficha del helecho, cuya `ancla` es `null`.
 *   2. `abonado` del helecho marcado como tarea de HOY: la condicionada con el mes
 *      cuadrado, o sea el consejo que quema las raíces de la única planta sin hoja.
 *   3. Una segunda vencida inventada (`poto` / `abonado`).
 *   4. Una cronología cuyos rótulos dicen «1 h / 1 día / 1 año» pero cuyas posiciones
 *      son **lineales** en el valor, no logarítmicas: el eje que miente con los
 *      rótulos puestos.
 *
 * CÓMO SE LEE EL RESULTADO — al revés que cualquier otro test de este repo
 *
 *     python3 tests/runner.py --abrir 0 --alto 6000 \
 *         --test autoprueba --test franja-hoy --test diagramas
 *
 * El orden importa: `autoprueba` tiene que ir PRIMERO, porque el runner ejecuta los
 * tests en el orden en que se piden y los defectos tienen que estar en el DOM antes
 * de que los otros dos midan. Y después hay que leerlo invertido:
 *
 *     ✗ [franja-hoy]  y  ✗ [diagramas]  →  BIEN: los instrumentos ven
 *     ✓ [franja-hoy]  o  ✓ [diagramas]  →  MAL: hay un falso negativo
 *
 * Esta pasada NO vale como pasada de QA: la página queda contaminada a propósito.
 * Se ejecuta aparte, se lee, y la medición de verdad se hace en limpio.
 */

(() => {
  'use strict';

  const inyectado = [];
  const article = document.querySelector('article');
  const franja = document.querySelector('.parte, #parte') || document.body;

  const marca = (el) => { el.setAttribute('data-autoprueba', 'defecto-inyectado'); return el; };

  /* ── defecto 1 · riego afirmado sin ancla ───────────────────────────────── */

  /* La planta se elige **leyendo el JSON**, no a mano. La primera versión inyectaba la
     frase en el helecho porque tenía `ancla: null`, y a media sesión Carlos dio las
     fechas de riego que faltaban: las siete pasaron a `calculable: true`. El defecto se
     quedó sin sujeto y la autoprueba dejó de probar nada — en verde y sin decirlo, que
     es la forma que tiene un falso negativo de esconderse. Ahora, si no hay ninguna
     planta sin ancla, lo dice en vez de callarse. */
  let sinAncla = null;
  try {
    const x = new XMLHttpRequest();
    x.open('GET', './content/plantas.json', false);
    x.send(null);
    for (const p of (JSON.parse(x.responseText).plantas || [])) {
      const r = (p.tareas || []).find((t) => t.tipo === 'ritmo');
      if (r && r.calculable === false) { sinAncla = p.id; break; }
    }
  } catch (e) { /* se reporta abajo */ }

  const contenedor = sinAncla
    ? (document.getElementById(sinAncla) ||
       [...document.querySelectorAll('article')].find((a) => a.id === sinAncla))
    : null;

  if (sinAncla && contenedor) {
    const p = marca(document.createElement('p'));
    p.textContent = 'Hoy le toca regar.';
    contenedor.appendChild(p);
    inyectado.push({
      n: 1, defecto: 'riego afirmado sin ancla',
      planta_elegida: sinAncla,
      debe_cazarlo: 'franja-hoy · caso "riego afirmado sin dato"',
    });
  } else {
    inyectado.push({
      n: 1, defecto: 'NO INYECTADO — este defecto no se puede probar hoy',
      por_que: sinAncla
        ? 'no encuentro en el DOM el contenedor de ' + sinAncla
        : 'ninguna planta tiene riego.calculable === false: las siete tienen ancla, así que ' +
          'no hay sujeto para el que «hoy le toca regar» sea una mentira',
      consecuencia: 'la comprobación de franja-hoy sigue siendo válida y saltará si alguna ' +
                    'planta vuelve a quedarse sin ancla, pero HOY no está verificada. ' +
                    'No cuenta como probada.',
    });
  }

  /* ── defecto 2 · la condicionada del helecho como tarea de hoy ──────────── */

  const li2 = marca(document.createElement('li'));
  li2.setAttribute('data-tarea', 'abonado');
  li2.setAttribute('data-planta', 'helecho');
  li2.setAttribute('data-tarea-estado', 'hoy');
  li2.textContent = 'Abonar el helecho';
  franja.appendChild(li2);
  inyectado.push({
    n: 2, defecto: 'condicionada presentada como debida',
    por_que_es_el_afilado: 'agosto SÍ entra en meses [4,5,6,7,8]; la condición es la que lo impide',
    debe_cazarlo: 'franja-hoy · caso "condicionada presentada como debida" · gravedad bloqueante',
  });

  /* ── defecto 3 · una segunda vencida inventada ──────────────────────────── */

  const li3 = marca(document.createElement('li'));
  li3.setAttribute('data-tarea', 'abonado');
  li3.setAttribute('data-planta', 'poto');
  li3.setAttribute('data-tarea-estado', 'vencida');
  li3.textContent = 'Abonar el poto · VA TARDE';
  franja.appendChild(li3);
  inyectado.push({
    n: 3, defecto: 'vencida inventada',
    debe_cazarlo: 'franja-hoy · caso "vencida inventada"',
  });

  /* Al inyectar los defectos 2 y 3 aparecen `data-tarea` en el DOM, así que
     `franja-hoy` cambia de modo: pasa de abstenerse a medir por atributos. Eso hace
     que reclame como ausentes las tareas reales de hoy, que efectivamente no están
     etiquetadas todavía. Es correcto y esperado en esta pasada contaminada; se anota
     aquí para que nadie lo lea como un hallazgo sobre la página. */
  inyectado.push({
    n: '2-3 (efecto lateral)',
    nota: 'al haber ya data-tarea en el DOM, franja-hoy deja de abstenerse y reclamará ' +
          'las tareas reales de hoy como ausentes. Es artefacto de la autoprueba, no un fallo de la página',
  });

  /* ── defecto 4 · el eje que se llama log y es lineal ────────────────────── */

  /* Los rótulos son correctos y creíbles; lo que está mal es dónde caen. Con escala
     lineal, «1 hora» y «1 día» se apelotonan al principio y «1 año» se lo come todo:
     exactamente el engaño que un log bien hecho evita, y que sin comprobar la
     regresión pasa por bueno porque los rótulos están puestos. */
  const NS = 'http://www.w3.org/2000/svg';
  const svg = marca(document.createElementNS(NS, 'svg'));
  svg.setAttribute('class', 'crono crono--autoprueba');
  svg.setAttribute('viewBox', '0 0 400 60');
  svg.setAttribute('role', 'img');
  svg.setAttribute('width', '400');
  svg.setAttribute('height', '60');
  const titulo = document.createElementNS(NS, 'title');
  titulo.textContent = 'Cronología falsa de autoprueba: rótulos logarítmicos sobre eje lineal';
  svg.appendChild(titulo);

  const AÑO = 31557600;
  const puntos = [
    ['1 h', 3600], ['1 día', 86400], ['1 semana', 604800],
    ['1 mes', 2629800], ['1 año', AÑO],
  ];
  for (const [rot, valor] of puntos) {
    const x = 10 + (valor / AÑO) * 380;   // ← LINEAL a propósito
    const linea = document.createElementNS(NS, 'line');
    linea.setAttribute('x1', x); linea.setAttribute('x2', x);
    linea.setAttribute('y1', '20'); linea.setAttribute('y2', '34');
    linea.setAttribute('stroke', 'currentColor');
    svg.appendChild(linea);
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', '50');
    t.setAttribute('font-size', '9');
    t.textContent = rot;
    svg.appendChild(t);
  }

  // Dentro de la ficha desplegada, que es el ámbito que mide `diagramas`.
  const destino = [...document.querySelectorAll('details[open]')]
    .filter((d) => d.closest('article') && d.getBoundingClientRect().height > 400)
    .sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0];
  if (destino) {
    destino.appendChild(svg);
    inyectado.push({
      n: 4, defecto: 'eje rotulado como log y escalado lineal',
      debe_cazarlo: 'diagramas · caso "el eje se rotula como logarítmico pero no lo es" · R² bajo',
    });
  } else {
    inyectado.push({
      n: 4, defecto: 'eje lineal NO inyectado',
      por_que: 'no hay ficha desplegada; lánzalo con --abrir 0',
    });
  }

  const informe = {
    ok: true,     // inyectar defectos no es un fallo de la página
    es_autoprueba: true,
    resumen: `${inyectado.filter((i) => i.defecto).length} defecto(s) inyectado(s) · ` +
             'a partir de aquí, ✗ en franja-hoy y diagramas es el resultado BUENO',
    como_se_lee: '✗ en franja-hoy y en diagramas = los instrumentos ven. ✓ = falso negativo.',
    advertencia: 'esta pasada NO vale como pasada de QA: la página está contaminada a propósito',
    inyectado,
  };

  console.log('· autoprueba — DOM contaminado a propósito:', informe.resumen);
  if (console.table) console.table(inyectado);
  window.qaAutoprueba = () => informe;
  return informe;
})();
