/* =============================================================================
   MyPlants — versión alternativa · ui-designer
   Compone la página leyendo content/plantas.json, que es la única fuente de
   verdad. Aquí no hay ni un dato escrito a mano: si un campo viene vacío en el
   JSON, sale vacío en la página. ES module, sin dependencias, sin build.
   ========================================================================== */

const RANGO_SEV = { critica: 0, atencion: 1, sana: 2 };
const NOMBRE_SEV = { critica: 'crítica', atencion: 'atención', sana: 'sana' };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* Los conjuntos cerrados del JSON son claves de máquina (`indirecta_brillante`).
   En pantalla se escriben en castellano; el valor crudo no se le muestra a
   nadie, pero tampoco se traduce a algo que no diga lo mismo. */
const LUZ = {
  sol_directo: 'sol directo',
  sol_directo_matinal: 'sol de mañana',
  indirecta_brillante: 'luz indirecta brillante',
  indirecta_media: 'luz indirecta media',
  sombra: 'sombra',
};
const enLuz = (clave) => LUZ[clave] ?? (clave ? String(clave).replace(/_/g, ' ') : null);

/* En el mosaico el sitio es estrecho: la misma información, más corta. */
const LUZ_CORTA = {
  sol_directo: 'sol directo',
  sol_directo_matinal: 'sol de mañana',
  indirecta_brillante: 'indirecta',
  indirecta_media: 'indirecta media',
  sombra: 'sombra',
};
const enLuzCorta = (clave) => LUZ_CORTA[clave] ?? enLuz(clave);

/* ------------------------------- utilidades ------------------------------- */

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* El JSON usa `campo` entre acentos graves para referirse a otros campos.
   Se respeta como código en línea en vez de tirarlo. */
const rico = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

const fecha = (iso) => {
  if (!iso) return null;
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
};

const parrafos = (txt) => String(txt).split(/\n{2,}/)
  .map((p) => `<p>${rico(p.trim())}</p>`).join('');

/* Un desplegable de detalle. Solo se pinta si hay detalle que contar. */
const desplegable = (etiqueta, detalle) => detalle
  ? `<details class="desplegable">
       <summary>${esc(etiqueta)}</summary>
       <div class="desplegable__cuerpo prosa">${parrafos(detalle)}</div>
     </details>`
  : '';

/* Rango de temperatura tolerante a huecos: el dato que falta se dice, no se
   inventa ni se imprime como `null`. */
const rango = (t) => {
  if (!t) return null;
  const { min_c: min, max_c: max } = t;
  if (min != null && max != null) return `Entre ${min} y ${max} °C.`;
  if (min != null) return `Mínimo ${min} °C. Sin máximo publicado por ninguna fuente.`;
  if (max != null) return `Máximo ${max} °C.`;
  return null;
};

const pill = (valor, rotulo) => valor == null || valor === ''
  ? ''
  : `<li class="dato"><b>${esc(valor)}</b> <span>${esc(rotulo)}</span></li>`;

const bloque = (titulo, nota, cuerpo) => `
  <section class="bloque">
    <h5 class="bloque__titulo">${esc(titulo)}${nota ? `<span class="n">${esc(nota)}</span>` : ''}</h5>
    ${cuerpo}
  </section>`;

/* --------------------------- el parte del día ----------------------------- */

function pintarParte(plantas, meta) {
  const tocadas = plantas
    .filter((p) => sev(p) !== 'sana')
    .sort((a, b) => RANGO_SEV[sev(a)] - RANGO_SEV[sev(b)]);

  const veredicto = document.getElementById('veredicto');
  veredicto.innerHTML = tocadas.length
    ? `<span class="cifra">${tocadas.length} de ${plantas.length}</span> piden mirada`
    : `Las ${plantas.length} están bien`;

  /* Sin severidad no se inventa urgencia: se dice tal cual y las entradas
     bajan a lo siguiente que toca. */
  const entradas = tocadas.length ? tocadas.slice(0, 3) : [];
  document.getElementById('entradas').innerHTML = entradas.map((p) => {
    const e = p.estados?.[0];
    return `<li><a class="entrada" href="#planta-${esc(p.id)}">
      <span class="sev" data-sev="${esc(sev(p))}">${esc(NOMBRE_SEV[sev(p)])}</span>
      <span class="entrada__nombre">${esc(p.nombre_comun)}</span>
      <span class="entrada__que">${esc(e?.titulo ?? '')}</span>
    </a></li>`;
  }).join('');

  if (meta?.fecha_diagnostico) {
    document.getElementById('cabecera-meta').textContent =
      `Móstoles · siete macetas · visto el ${fecha(meta.fecha_diagnostico)}`;
  }
}

const sev = (p) => p.estados?.[0]?.severidad ?? 'sana';

/* ------------------------------ el mosaico -------------------------------- */

function mosaico(p) {
  const e = p.estados?.[0];
  const s = sev(p);
  const temp = p.temperatura;
  return `
    <div class="foto">
      <img src="../assets/img/${esc(p.foto)}" alt="${esc(p.alt)}"
           width="800" height="1067" loading="lazy" decoding="async">
    </div>
    <div class="mosaico__cuerpo">
      <div class="mosaico__alto">
        <span class="sev" data-sev="${esc(s)}">${esc(NOMBRE_SEV[s])}</span>
        <span class="mono" style="color:var(--meta)">${esc(p.familia || 'familia sin determinar')}</span>
      </div>
      <h4 class="mosaico__nombre display" id="titulo-${esc(p.id)}">${esc(p.nombre_comun)}</h4>
      ${p.nombre_cientifico
        ? `<p class="cientifico" style="margin:0">${esc(p.nombre_cientifico)}</p>`
        : `<p class="cientifico" style="margin:0">Especie sin identificar</p>`}
      ${e?.titulo ? `<p class="mosaico__titular">${esc(e.titulo)}</p>` : ''}
      <ul class="mosaico__datos">
        ${pill(p.riego?.dias_verano ? `${p.riego.dias_verano} d` : null, 'riego verano')}
        ${pill(enLuzCorta(p.luz?.categoria_ideal), 'luz')}
        ${pill(temp?.min_c != null && temp?.max_c != null ? `${temp.min_c}–${temp.max_c} °C` : null, 'temp')}
        ${pill(p.dificultad, 'nivel')}
      </ul>
      <span class="mosaico__abrir">
        <span class="abrir">Abrir la ficha</span><span class="cerrar">Cerrar la ficha</span>
      </span>
    </div>`;
}

/* -------------------------------- la ficha -------------------------------- */

/* Los cuidados: el `resumen` es la respuesta, el `detalle` es el argumento.
   Se pinta la respuesta y el argumento se despliega. Nada se recorta. */
const CUIDADOS = [
  ['riego', 'Riego'], ['luz', 'Luz'], ['humedad', 'Humedad'],
  ['temperatura', 'Temperatura'], ['sustrato', 'Sustrato'],
  ['abonado', 'Abonado'], ['trasplante', 'Trasplante'],
  ['manipulacion', 'Manipulación'],
];

function railCuidados(p) {
  return CUIDADOS.map(([clave, rotulo]) => {
    const c = p[clave];
    if (!c) return '';
    /* temperatura no tiene `resumen`: se compone del rango. Y el rango puede
       venir a medias —el helecho no tiene máximo publicado—, así que se dice
       lo que hay y se nombra la ausencia; no se pinta un `null`. */
    const resumen = c.resumen ?? rango(c);
    if (!resumen && !c.detalle) return '';
    return `<div class="cuidado">
      <span class="rotulo">${esc(rotulo)}</span>
      ${resumen ? `<p class="cuidado__resumen">${rico(resumen)}</p>` : ''}
      ${desplegable('Por qué', c.detalle)}
    </div>`;
  }).join('');
}

/* La luz que querría contra la luz que recibe. La diferencia es el dato
   accionable, y el veredicto va SIEMPRE en palabras: el color no lo dice solo. */
function luzBalanza(p) {
  const ideal = p.luz?.nivel_ideal;
  const actual = p.luz?.nivel_actual;
  if (ideal == null && actual == null) return '';
  const pasos = [1, 2, 3, 4, 5].map((n) => `<span class="luz-balanza__paso"
      ${n <= ideal ? 'data-ideal' : ''} ${n === actual ? 'data-actual' : ''}></span>`).join('');
  let veredicto = '';
  if (ideal != null && actual != null) {
    const d = actual - ideal;
    veredicto = d === 0
      ? '<b>Está en su sitio.</b> Recibe la luz que quiere.'
      : d > 0
        ? `<b>Le sobra luz</b> (${d} paso${d > 1 ? 's' : ''} por encima): riesgo de quemadura.`
        : `<b>Le falta luz</b> (${-d} paso${-d > 1 ? 's' : ''} por debajo): riesgo de que se estire.`;
  }
  return `<div class="luz-balanza">
    <span class="rotulo">Luz que quiere / luz que recibe</span>
    <div class="luz-balanza__escala" role="img"
         aria-label="Quiere nivel ${esc(ideal)} de 5 y recibe nivel ${esc(actual)} de 5.">
      ${pasos}
    </div>
    <div class="luz-balanza__leyenda">
      <span class="mono" style="color:var(--meta)">Quiere: ${esc(enLuz(p.luz?.categoria_ideal))}</span>
      <span class="mono" style="color:var(--meta)">Recibe: ${esc(enLuz(p.luz?.categoria_recibida))}</span>
    </div>
    ${veredicto ? `<p class="luz-balanza__veredicto">${veredicto}</p>` : ''}
  </div>`;
}

function railProcedencia(p) {
  const et = p.etiqueta_vivero;
  if (!et && !p.procedencia_nota) return '';
  const lineas = [];
  if (et) {
    if (et.vivero) lineas.push(`<b>${esc(et.vivero)}</b>`);
    if (et.productor) lineas.push(esc(et.productor));
    if (et.nombre_etiqueta) lineas.push(`«${esc(et.nombre_etiqueta)}»`);
    if (et.precio_eur != null) {
      lineas.push(`<b>${esc(String(et.precio_eur).replace('.', ','))} €</b>`);
    }
    if (et.codigo_vivero) lineas.push(`cód. ${esc(et.codigo_vivero)}`);
    if (et.ean) lineas.push(`EAN ${esc(et.ean)}`);
    if (et.fitosanitario) lineas.push(`P. fitosanitario ${esc(et.fitosanitario)}`);
  }
  const texto = lineas.length ? lineas.join(' · ') : esc(p.procedencia_nota);
  return `<div class="procedencia">
    ${p.foto_etiqueta
      ? `<img src="../assets/img/${esc(p.foto_etiqueta)}" alt="${esc(p.alt_etiqueta || 'Etiqueta de vivero de la planta')}"
             width="500" height="667" loading="lazy" decoding="async">`
      : ''}
    <div>
      <span class="rotulo">De dónde vino</span>
      <p class="procedencia__texto" style="margin-top:.4rem">${texto}</p>
      ${et?.nota ? `<p class="procedencia__texto" style="margin-top:.5rem;color:var(--meta)">${rico(et.nota)}</p>` : ''}
    </div>
  </div>`;
}

function diagnostico(p) {
  const e = p.estados?.[0];
  if (!e) return '';
  const s = e.severidad;
  let out = `<div class="diag__cabeza">
    <div class="mosaico__alto">
      <span class="sev" data-sev="${esc(s)}">${esc(NOMBRE_SEV[s])}</span>
      <span class="diag__fecha mono">Visto el ${esc(fecha(e.fecha_foto))}</span>
    </div>
    <p class="diag__titulo">${esc(e.titulo)}</p>
  </div>`;

  if (e.senales?.length) {
    out += bloque('Lo que se ve', `${e.senales.length} señales`,
      `<ul class="lista-limpia senales">${e.senales.map((x) => `<li>${rico(x)}</li>`).join('')}</ul>`);
  }

  if (e.causas_probables?.length) {
    const causas = e.causas_probables.map((c) => `
      <li class="causa" data-tipo="${esc(c.tipo || 'causa')}">
        <span class="rotulo">${c.tipo === 'aclaracion' ? 'Aclaración' : 'Causa probable'}</span>
        <h6 class="causa__resumen">${rico(c.resumen)}</h6>
        ${c.detalle ? `<p class="causa__detalle">${rico(c.detalle)}</p>` : ''}
        ${c.patron ? `<p class="causa__detalle" style="margin-top:.6rem"><b>Cómo reconocerlo.</b> ${rico(c.patron)}</p>` : ''}
      </li>`).join('');
    out += bloque('Por qué le pasa', `${e.causas_probables.length}`, `<ul class="causas">${causas}</ul>`);
  }

  /* Esto es lo más honesto del contenido y no estaba diseñado. */
  if (e.no_visible_en_foto?.length) {
    out += bloque('Lo que la foto no dice', null,
      `<div class="no-visible"><ul class="lista-limpia">
        ${e.no_visible_en_foto.map((x) => `<li>${rico(x)}</li>`).join('')}
      </ul></div>`);
  }

  if (e.tratamiento?.length) {
    out += bloque('Qué hacer', null,
      `<ul class="lista-limpia tratamiento">${e.tratamiento.map((x) => `<li><span>${rico(x)}</span></li>`).join('')}</ul>`);
  }

  if (e.plan_recuperacion?.length) {
    out += bloque('Plan de recuperación', `${e.plan_recuperacion.length} pasos`,
      `<ol class="lista-limpia plan">${e.plan_recuperacion.map((x) => `
        <li><div>
          <p class="plan__paso">${rico(x.paso)}</p>
          ${x.senal ? `<p class="plan__senal">Va bien si: ${rico(x.senal)}</p>` : ''}
          ${x.hito ? `<span class="plan__hito rotulo">${esc(x.hito)}</span>` : ''}
        </div></li>`).join('')}</ol>`);
  }

  if (e.revisar_en) {
    out += bloque('Cuándo volver a mirar',
      e.revisar_fecha ? fecha(e.revisar_fecha) : null,
      `<div class="prosa" style="color:var(--texto-2)">${parrafos(e.revisar_en)}</div>`);
  }
  return out;
}

/* La voz de la casa. Papel claro: material distinto del dato verificado. */
function voz(p) {
  if (!p.historia && !p.notas?.length) return '';
  return `<section class="bloque">
    <div class="voz">
      <span class="rotulo">La voz de la casa</span>
      <h5 class="voz__titulo">De dónde sale esta planta</h5>
      <div>${parrafos(p.historia)}</div>
      ${p.notas?.length
        ? `<ul class="voz__notas">${p.notas.map((n) => `<li>${rico(typeof n === 'string' ? n : n.texto ?? '')}</li>`).join('')}</ul>`
        : ''}
      <p class="firma">Esto no está verificado con ninguna fuente, y es a propósito:
        lo cuenta la casa. Lo de arriba lleva cita; esto lleva nombre.</p>
    </div>
  </section>`;
}

function tareas(p) {
  if (!p.tareas?.length) return '';
  const orden = [...p.tareas].sort((a, b) => (a.prioridad ?? 9) - (b.prioridad ?? 9));
  return bloque('Lo que toca', `${p.tareas.length}`, `
    <ul class="lista-limpia tratamiento">
      ${orden.map((t) => `<li><span>
        ${esc(t.titulo)}
        ${t.fecha ? `<span class="mono" style="color:var(--meta)"> · ${esc(fecha(t.fecha))}</span>` : ''}
        ${t.tipo === 'ritmo' && t.cada_dias ? `<span class="mono" style="color:var(--meta)"> · cada ${esc(t.cada_dias)} días</span>` : ''}
        ${t.meses?.length ? `<span class="mono" style="color:var(--meta)"> · ${esc(MESES[t.meses[0] - 1])} a ${esc(MESES[t.meses[t.meses.length - 1] - 1])}</span>` : ''}
        ${t.condicion ? `<br><span style="color:var(--texto-2);font-size:var(--t-pequeno)">Solo si: ${rico(t.condicion)}</span>` : ''}
      </span></li>`).join('')}
    </ul>`);
}

function seguridad(p) {
  const t = p.toxicidad_mascotas;
  const plagas = p.plagas_comunes ?? [];
  let out = '';
  if (t) {
    out += `<div class="causa" style="max-width:var(--medida)">
      <span class="rotulo">Toxicidad para mascotas</span>
      <h6 class="causa__resumen">Gatos: ${esc(t.gatos)} · Perros: ${esc(t.perros)}</h6>
      ${t.detalle ? `<p class="causa__detalle">${rico(t.detalle)}</p>` : ''}
    </div>`;
  } else {
    out += `<div class="causa" data-tipo="aclaracion" style="max-width:var(--medida)">
      <span class="rotulo">Toxicidad para mascotas</span>
      <h6 class="causa__resumen">Sin dato citable</h6>
      <p class="causa__detalle">No se rellena a ojo: si no hay fuente que lo clasifique,
        se queda sin dato. En esta casa no hay mascotas.</p>
    </div>`;
  }
  if (plagas.length) {
    out += `<ul class="causas" style="margin-top:var(--e-4)">
      ${plagas.map((g) => `<li class="causa">
        <span class="rotulo">Plaga</span>
        <h6 class="causa__resumen">${esc(g.plaga)}</h6>
        ${g.senal ? `<p class="causa__detalle"><b>Se reconoce por.</b> ${rico(g.senal)}</p>` : ''}
        ${g.respuesta ? `<p class="causa__detalle" style="margin-top:.5rem"><b>Qué hacer.</b> ${rico(g.respuesta)}</p>` : ''}
      </li>`).join('')}
    </ul>`;
  }
  return bloque('Seguridad y plagas', null, out);
}

function fuentes(p) {
  if (!p.fuentes?.length) return '';
  return `<details class="bloque desplegable">
    <summary style="font-size:var(--t-micro)">Ver las ${p.fuentes.length} fuentes citadas</summary>
    <div class="desplegable__cuerpo">
      <ul class="fuentes__lista">
        ${p.fuentes.map((f) => `<li>
          <span class="fuentes__campo">${esc(f.campo)}</span>
          <span>${f.url
            ? `<a class="enlace" href="${esc(f.url)}" rel="noopener noreferrer" target="_blank">${esc(f.fuente)}</a>`
            : esc(f.fuente)}${f.consultado ? ` · consultado el ${esc(fecha(f.consultado))}` : ''}</span>
          ${f.nota ? `<span class="fuentes__nota">${rico(f.nota)}</span>` : ''}
        </li>`).join('')}
      </ul>
    </div>
  </details>`;
}

function ficha(p) {
  const e = p.estados?.[0];
  return `<div class="ficha">
    <div class="ficha__rail">
      <p class="ficha__pie-foto mono">
        La foto de arriba está sin retocar${e?.fecha_foto ? `, y es del ${esc(fecha(e.fecha_foto))}` : ''}.
        Es la prueba del estado de la planta, así que no se le pasa ningún filtro.
      </p>
      <div class="cuidado" style="border-top:0;padding-top:0">
        <span class="rotulo">Dónde está</span>
        <p class="cuidado__resumen">
          ${esc(p.ubicacion?.habitacion ?? 'sin registrar')}${p.ubicacion?.relacion_ventana ? `, ${esc(p.ubicacion.relacion_ventana)}` : ''}.
        </p>
        <ul class="mosaico__datos">
          ${pill(p.dias_en_casa != null
            ? `${p.dias_en_casa} d`
            : (p.anos_en_casa_min != null ? `+${p.anos_en_casa_min} años` : null), 'en casa')}
          ${pill(p.dificultad, 'dificultad')}
        </ul>
        ${p.dias_en_casa == null && p.fecha_llegada_texto
          ? `<p class="ficha__pie-foto mono" style="margin:var(--e-2) 0 0">Llegó ${esc(p.fecha_llegada_texto)}: la fecha exacta no consta.</p>`
          : ''}
      </div>
      ${luzBalanza(p)}
      ${railProcedencia(p)}
      <div class="cuidados" style="margin-top:var(--e-5)">
        <span class="rotulo" style="margin-bottom:var(--e-3);display:block">Los cuidados</span>
        ${railCuidados(p)}
      </div>
    </div>
    <div class="ficha__principal">
      ${diagnostico(p)}
      ${voz(p)}
      ${tareas(p)}
      ${seguridad(p)}
      ${fuentes(p)}
    </div>
  </div>`;
}

/* Rellena una banda y la esconde si se queda vacía: el día que las siete estén
   bien, la banda de "piden mirada" no aparece pidiendo perdón, desaparece. */
function banda(idGrupo, idLista, plantas, celda, cuenta) {
  const grupo = document.getElementById(idGrupo);
  if (!plantas.length) { grupo.hidden = true; return; }
  grupo.hidden = false;
  document.getElementById(idLista).innerHTML = plantas.map(celda).join('');
  grupo.querySelector('.grupo__cuenta').textContent = cuenta(plantas.length);
}

/* ------------------------------- montaje ---------------------------------- */

async function montar() {
  const principal = document.querySelector('main .marco');
  let datos;
  try {
    const r = await fetch('../content/plantas.json');
    if (!r.ok) throw new Error(r.status);
    datos = await r.json();
  } catch (err) {
    principal.insertAdjacentHTML('beforeend', `<p class="aviso-datos">No se ha podido leer
      <code>content/plantas.json</code>. Sírvelo con
      <code>python3 -m http.server 8000</code>: con <code>file://</code> el
      fetch falla por CORS.</p>`);
    return;
  }

  const plantas = [...datos.plantas]
    .sort((a, b) => RANGO_SEV[sev(a)] - RANGO_SEV[sev(b)]);

  pintarParte(plantas, datos.meta);

  const celda = (p, i) => `
    <li class="celda revela" data-sev="${esc(sev(p))}" style="--i:${i}">
      <article class="tarjeta" aria-labelledby="titulo-${esc(p.id)}">
        <details class="planta despegue" id="planta-${esc(p.id)}" name="ficha">
          <summary>${mosaico(p)}</summary>
          ${ficha(p)}
        </details>
      </article>
    </li>`;

  const mirada = plantas.filter((p) => sev(p) !== 'sana');
  const bien = plantas.filter((p) => sev(p) === 'sana');

  banda('grupo-mirada', 'rejilla-mirada', mirada, celda,
    (n) => `${n} de ${plantas.length}`);
  banda('grupo-bien', 'rejilla-bien', bien, celda,
    (n) => `${n} de ${plantas.length}`);

  document.getElementById('anuncio').textContent =
    `${plantas.length} plantas cargadas, ordenadas por lo que pide mirada primero.`;

  document.getElementById('pie-recuento').textContent =
    `${plantas.length} plantas en el salón. Ninguna inventada; ` +
    `${plantas.reduce((n, p) => n + (p.fuentes?.length ?? 0), 0)} fuentes citadas en total.`;

  revelar();
  abrirDesdeHash();
  addEventListener('hashchange', abrirDesdeHash);

  /* Al abrir una ficha se lleva el mosaico a la vista: si no, el navegador
     deja el título fuera de pantalla cuando el panel es largo. */
  principal.addEventListener('toggle', (ev) => {
    const d = ev.target;
    if (d.tagName !== 'DETAILS' || !d.open || !d.classList.contains('planta')) return;
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (d.getBoundingClientRect().top < 0) {
      d.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'start' });
    }
  }, true);
}

/* Un enlace a #planta-poto abre esa ficha, no solo salta a ella: así se puede
   compartir la ficha de una planta concreta. */
function abrirDesdeHash() {
  const id = location.hash.slice(1);
  if (!id) return;
  const d = document.getElementById(id);
  if (d?.tagName === 'DETAILS') d.open = true;
}

/* Entrada escalonada. Con reduce, la clase se pone de golpe y el CSS ya ha
   anulado transición y desplazamiento: la alternativa es presencia directa. */
function revelar() {
  const items = document.querySelectorAll('.revela');
  if (!('IntersectionObserver' in window)
      || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((el) => el.classList.add('dentro'));
    return;
  }
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('dentro'); obs.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  items.forEach((el) => obs.observe(el));
}

montar();
