#!/usr/bin/env python3
"""tests/runner.py — MyPlants / qa-visual

Ejecuta los ficheros de `tests/*.js` contra la página real y devuelve sus informes,
sin Playwright y sin instalar nada. Existe por dos motivos:

1. El servidor MCP de Playwright usa un perfil de Chrome único, así que si otro
   teammate lo tiene abierto, QA se queda bloqueado. Esto no depende de él.
2. Un `--dump-dom` de Chrome headless da el DOM ya renderizado por el JS de la
   página, que es exactamente lo que hay que auditar en esta web: las fichas no
   existen en `index.html`, las pinta `js/ficha.js` desde el JSON.

Cómo funciona: levanta un servidor propio que sirve el repo tal cual **salvo** la
página raíz, en la que inyecta los ficheros de `tests/` más un recolector que deja
el informe en un `<script type="application/json" id="qa-resultado">`. Después
lanza Chrome headless con `--dump-dom` y extrae ese JSON. Mismo origen, rutas
relativas intactas, cero ficheros escritos en el repo.

Uso:
    python3 tests/runner.py                          # todos los tests, 1280px
    python3 tests/runner.py --ancho 320
    python3 tests/runner.py --test contraste --test foco
    python3 tests/runner.py --reduce                 # con prefers-reduced-motion: reduce
    python3 tests/runner.py --captura docs/qa/1280-inicio.png
    python3 tests/runner.py --json informe.json

Devuelve 1 si algún test reporta ok:false.
"""

from __future__ import annotations

import argparse
import http.server
import json
import re
import shutil
import socketserver
import subprocess
import sys
import subprocess as _sp
import tempfile
import threading
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TESTS = RAIZ / "tests"

CHROME_CANDIDATOS = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    shutil.which("google-chrome") or "",
    shutil.which("chromium") or "",
]

ORDEN = ["estructura", "contraste", "foco", "movimiento", "terceros"]


def estado_del_arbol(raiz: Path) -> dict:
    """Sella la medición con el estado exacto que se midió.

    Sin esto, un resultado no se puede atribuir a nada: durante esta sesión el lead
    midió dos veces el mismo "commit" y le salió 10 fallos y luego 0, porque builder
    estaba editando ficheros entre pasada y pasada. No era un test inestable: era un
    blanco en movimiento. Un número sin su estado no es una medición, es una anécdota.
    """
    def git(*args):
        try:
            return _sp.run(["git", *args], cwd=raiz, capture_output=True, text=True,
                           timeout=5).stdout.strip()
        except Exception:
            return ""

    vigilados = []
    for patron in ("index.html", "css/*.css", "js/*.js", "content/*.json"):
        vigilados.extend(sorted(raiz.glob(patron)))

    mtimes = {}
    ultimo = 0.0
    for f in vigilados:
        try:
            m = f.stat().st_mtime
        except OSError:
            continue
        mtimes[str(f.relative_to(raiz))] = round(m, 1)
        ultimo = max(ultimo, m)

    sucio = git("status", "--porcelain")
    return {
        "commit": git("rev-parse", "--short", "HEAD") or "(sin git)",
        "arbol_sucio": bool(sucio),
        "ficheros_modificados": len([l for l in sucio.splitlines() if l.strip()]),
        "ficheros_medidos": len(mtimes),
        "mtime_mas_reciente": round(ultimo, 1),
        "mtimes": mtimes,
    }


def alto_png(ruta: Path) -> int | None:
    """Lee el alto de un PNG de su cabecera IHDR, sin dependencias.

    Hace falta para poder comprobar que `--completa` ha hecho algo. Los 8 primeros
    bytes son la firma, luego un chunk IHDR con ancho y alto en big-endian.
    """
    try:
        datos = ruta.read_bytes()[:33]
    except OSError:
        return None
    if len(datos) < 33 or datos[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return int.from_bytes(datos[20:24], "big")


def chrome() -> str:
    for c in CHROME_CANDIDATOS:
        if c and Path(c).exists():
            return c
    sys.exit("No encuentro Chrome ni Chromium. Instala uno o usa Playwright MCP.")


# El recolector: ejecuta cada test, recoge su informe y lo deja en el DOM para
# que --dump-dom se lo lleve. Espera a que el JS de la página haya pintado.
RECOLECTOR = """
(async () => {
  const salida = { tests: {}, errores: [] };
  const espera = (ms) => new Promise(r => setTimeout(r, ms));

  // Si hay que abrir una ficha antes de medir (para auditar el estado desplegado)
  if (window.__QA_ABRIR__ || window.__QA_ABRIR_TODAS__) {
    for (let i = 0; i < 60 && !document.querySelector('details'); i++) await espera(100);
    if (window.__QA_ABRIR_TODAS__) {
      // TODOS los <details>, no solo el de despegue: los "Más detalle" de cada campo
      // también esconden contenido, y para medir cobertura hay que verlo entero.
      document.querySelectorAll('details').forEach((d) => { d.open = true; });
      await espera(300);
      document.querySelectorAll('details').forEach((d) => { d.open = true; });
      await espera(900);
    } else {
      const d = document.querySelectorAll('details.despegue')[window.__QA_ABRIR_N__ || 0];
      if (d) { d.open = true; await espera(700); }
    }
  }

  // esperar a que la página termine de pintar sus fichas desde el JSON
  for (let i = 0; i < 60; i++) {
    if (document.querySelectorAll('article').length > 0) break;
    if (document.getElementById('aviso') &&
        !document.getElementById('aviso').hidden) break;
    await espera(100);
  }
  await espera(400);

  for (const [nombre, fn] of Object.entries(window.__QA__ || {})) {
    try { salida.tests[nombre] = fn(); }
    catch (e) { salida.errores.push(nombre + ': ' + (e && e.message)); }
  }

  salida.consola = window.__QA_CONSOLA__ || [];
  salida.meta = {
    url: location.href,
    ancho: innerWidth, alto: innerHeight,
    dpr: devicePixelRatio,
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    articles: document.querySelectorAll('article').length,
    scrollWidth: document.scrollingElement.scrollWidth,
    desbordaHorizontal: document.scrollingElement.scrollWidth > innerWidth + 1,
    desbordan: [...document.querySelectorAll('body *')]
      .filter(el => el.getBoundingClientRect().right > innerWidth + 1)
      .slice(0, 10)
      .map(el => el.tagName.toLowerCase() + '.' +
           String(el.className || '').split(' ')[0] + ' →' +
           Math.round(el.getBoundingClientRect().right)),
  };

  // Se devuelve por POST al propio servidor en vez de dejarlo en el DOM:
  // --dump-dom se queda colgado en esta página (el evento load no llega a
  // dispararse con las doce fotos), y además así el resultado llega aunque
  // Chrome tarde en cerrar.
  try {
    await fetch('/__qa__', { method: 'POST', body: JSON.stringify(salida) });
  } catch (e) {
    const s = document.createElement('script');
    s.type = 'application/json';
    s.id = 'qa-resultado';
    s.textContent = JSON.stringify(salida);
    document.body.appendChild(s);
  }
})();
"""


def envolver(nombre: str, cuerpo: str) -> str:
    """Cada fichero de tests es una IIFE cuyo valor ES el informe, pero como está
    escrita como sentencia (`(() => {…})();`) no se puede recuperar metiéndola en
    una función: haría falta un `return` que el fichero no tiene, porque también
    se pega tal cual en la consola de DevTools.

    Se usa `eval`, que devuelve el valor de la última expresión evaluada. Así el
    fichero no necesita cambiar y sigue sirviendo para las dos cosas. Y sobre todo
    se ejecuta **cuando se le llama**, no al inyectarlo: si corriera al cargar,
    auditaría el DOM antes de que `js/ficha.js` haya pintado las fichas.
    """
    fuente = json.dumps(cuerpo)
    return (
        f"window.__QA__ = window.__QA__ || {{}};\n"
        f"window.__QA__[{json.dumps(nombre)}] = function () {{ return eval({fuente}); }};\n"
    )


# Se inyecta ANTES que todo lo demás. Los <script type="module"> se aplazan hasta
# después de parsear el documento, así que un script clásico puesto al final del
# body se ejecuta antes que js/app.js y llega a tiempo de cazar sus errores.
VIGILANTE = """
window.__QA_CONSOLA__ = [];
(function () {
  const registra = (nivel) => {
    const orig = console[nivel].bind(console);
    console[nivel] = function (...a) {
      try {
        window.__QA_CONSOLA__.push({
          nivel,
          texto: a.map(x => {
            if (x instanceof Error) return x.message;
            if (typeof x === 'object') { try { return JSON.stringify(x); } catch (e) { return String(x); } }
            return String(x);
          }).join(' ').slice(0, 300),
        });
      } catch (e) {}
      return orig(...a);
    };
  };
  ['error', 'warn'].forEach(registra);
  addEventListener('error', (e) => {
    const t = e.target;
    if (t && t !== window && (t.src || t.href)) {
      window.__QA_CONSOLA__.push({ nivel: 'recurso', texto: 'no carga: ' + (t.src || t.href) });
    } else {
      window.__QA_CONSOLA__.push({ nivel: 'excepcion', texto: (e.message || '') + ' @' + (e.filename || '') + ':' + e.lineno });
    }
  }, true);
  addEventListener('unhandledrejection', (e) => {
    window.__QA_CONSOLA__.push({ nivel: 'promesa', texto: String((e.reason && e.reason.message) || e.reason).slice(0, 300) });
  });
})();
"""


def construir_inyeccion(tests: list[str]) -> str:
    trozos = [f"<script>\n{VIGILANTE}\n</script>"]
    for nombre in tests:
        ruta = TESTS / f"{nombre}.js"
        if not ruta.is_file():
            sys.exit(f"No existe {ruta}")
        trozos.append(f"<script>\n{envolver(nombre, ruta.read_text(encoding='utf-8'))}\n</script>")
    trozos.append(f"<script>\n{RECOLECTOR}\n</script>")
    return "\n".join(trozos)


def sello_remoto(base: str) -> dict:
    """Identifica el estado que sirve una URL remota.

    Con `--url` el commit local no dice nada: GitHub Pages sirve lo que hay en
    `main` **en el remoto**, que puede ir por detrás de lo que tengo delante. Se
    pregunta al remoto por su HEAD y se guarda además la huella del `index.html`
    servido, que es lo único que prueba qué se midió de verdad.
    """
    import hashlib
    import urllib.request

    def git(*args):
        try:
            return _sp.run(["git", *args], cwd=RAIZ, capture_output=True, text=True,
                           timeout=15).stdout.strip()
        except Exception:
            return ""

    remoto = git("ls-remote", "origin", "refs/heads/main").split("\t")[0][:7]
    huella, largo = "", 0
    try:
        with urllib.request.urlopen(base, timeout=20) as r:
            cuerpo = r.read()
        huella = hashlib.sha256(cuerpo).hexdigest()[:12]
        largo = len(cuerpo)
    except Exception as e:
        huella = f"(no se pudo leer: {e})"

    return {
        "medido_contra": base,
        "commit": (remoto or "(remoto no accesible)") + " @origin/main",
        "commit_local": git("rev-parse", "--short", "HEAD"),
        "arbol_sucio": False,      # lo local es irrelevante: no es lo que se mide
        "ficheros_modificados": 0,
        "ficheros_medidos": 0,
        "mtime_mas_reciente": 0,
        "mtimes": {},
        "sha256_index_servido": huella,
        "bytes_index_servido": largo,
    }


def servidor(inyeccion: str, puerto: int, buzon: dict, base: str | None = None):
    """Sirve el repo local, o —con `base`— hace de espejo de una URL remota.

    El espejo existe para poder auditar la web publicada con estas mismas
    herramientas. GitHub Pages sirve desde subdirectorio (`/MyPlants/`) y eso es lo
    único que no se puede comprobar en local, así que era la única parte de la pasada
    que dependía del MCP de Playwright, que es un recurso exclusivo y bloquea a otros
    teammates.

    Se reenvía **todo** el tráfico, no solo la página: así el navegador ve un único
    origen, las rutas relativas siguen resolviendo sin tocar el HTML y el `fetch` del
    JSON no se topa con CORS. La alternativa —inyectar un `<base href>`— cambia el
    documento que se está auditando, que es justo lo que no se puede hacer.
    """
    import urllib.error
    import urllib.request

    prefijo = ""
    if base:
        from urllib.parse import urlsplit
        prefijo = urlsplit(base).path.rstrip("/")   # p.ej. "/MyPlants"

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(RAIZ), **k)

        def log_message(self, *a):
            pass

        def _remoto(self, ruta: str):
            """Trae un recurso del sitio publicado y lo entrega como si fuera propio."""
            rel = ruta.lstrip("/")
            # El HTML publicado enlaza con rutas absolutas que ya llevan el
            # subdirectorio (`/MyPlants/css/app.css`). Servidas desde la raíz del
            # espejo llegarían aquí con el prefijo puesto y habría que quitarlo, o
            # se pediría `/MyPlants/MyPlants/css/app.css`.
            if prefijo and ruta.startswith(prefijo + "/"):
                rel = ruta[len(prefijo) + 1:]
            destino = base.rstrip("/") + "/" + rel
            try:
                pet = urllib.request.Request(destino, headers={"User-Agent": "MyPlants-QA"})
                with urllib.request.urlopen(pet, timeout=25) as r:
                    datos, tipo = r.read(), r.headers.get("Content-Type", "application/octet-stream")
                    codigo = r.status
            except urllib.error.HTTPError as e:
                datos, tipo, codigo = e.read() or b"", "text/plain", e.code
            except Exception as e:
                datos, tipo, codigo = str(e).encode(), "text/plain", 502
            return datos, tipo, codigo

        def do_POST(self):
            if self.path != "/__qa__":
                self.send_error(404)
                return
            n = int(self.headers.get("Content-Length", 0))
            buzon["informe"] = json.loads(self.rfile.read(n).decode("utf-8"))
            buzon["listo"].set()
            self.send_response(204)
            self.end_headers()

        def do_GET(self):
            ruta = self.path.split("?")[0]
            es_portada = ruta in ("/", "/index.html", prefijo + "/", prefijo + "/index.html")

            if es_portada:
                if base:
                    crudo, _, codigo = self._remoto("/index.html" if ruta.endswith("index.html") else "/")
                    if codigo >= 400:
                        self.send_error(codigo, f"el sitio publicado devolvió {codigo}")
                        return
                    html = crudo.decode("utf-8", "replace")
                else:
                    html = (RAIZ / "index.html").read_text(encoding="utf-8")
                html = html.replace("</body>", inyeccion + "\n</body>")
                datos = html.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(datos)))
                self.end_headers()
                self.wfile.write(datos)
                return

            if base:
                datos, tipo, codigo = self._remoto(ruta)
                self.send_response(codigo)
                self.send_header("Content-Type", tipo)
                self.send_header("Content-Length", str(len(datos)))
                self.end_headers()
                self.wfile.write(datos)
                return

            super().do_GET()

    class Server(socketserver.ThreadingTCPServer):
        allow_reuse_address = True
        daemon_threads = True

    srv = Server(("127.0.0.1", puerto), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--test", action="append", default=None, help="repetible; por defecto todos")
    ap.add_argument("--ancho", type=int, default=1280)
    ap.add_argument("--alto", type=int, default=900)
    ap.add_argument("--dpr", type=float, default=1.0, help="2.0 + mitad de ancho ≈ zoom al 200%%")
    ap.add_argument("--reduce", action="store_true", help="fuerza prefers-reduced-motion: reduce")
    ap.add_argument("--oscuro", action="store_true", help="fuerza prefers-color-scheme: dark")
    ap.add_argument("--captura", default=None, help="ruta png; también hace screenshot")
    ap.add_argument("--completa", action="store_true", help="captura de página completa")
    ap.add_argument("--json", default=None, help="vuelca el informe crudo a un fichero")
    ap.add_argument("--puerto", type=int, default=8011)
    ap.add_argument("--abrir", type=int, default=None, help="abre la ficha N (0-based) antes de medir")
    ap.add_argument("--abrir-todas", action="store_true", help="abre TODOS los <details> antes de medir")
    # No hay --abrir-fichas: las siete fichas son <details name="planta">, o sea el
    # acordeón exclusivo nativo, y el navegador NO permite dos abiertas a la vez.
    # Abrirlas en bucle deja una sola y mide 1 de 7 creyendo medir 7. Quien necesite
    # las siete las abre y las mide de una en una: lo hace `tests/expediente.js`.
    ap.add_argument("--url", default=None,
                    help="audita una URL publicada en vez del repo local, haciendo de espejo. "
                         "Ej.: --url https://ccanado.github.io/MyPlants/")
    ap.add_argument("--raiz", default=None,
                    help="mide otro directorio en vez de este repo. Es lo que hace posible el "
                         "flujo de worktree: `git worktree add /tmp/qa HEAD` y medir ahí un "
                         "commit sin tocar el árbol de trabajo de nadie.")
    ap.add_argument("--sucio", action="store_true",
                    help="permite medir con el árbol sucio. Estampa en cada línea que el "
                         "número NO es atribuible a ningún commit. Elección declarada, no descuido.")
    ap.add_argument("--verboso", action="store_true")
    args = ap.parse_args()

    tests = args.test or ORDEN

    # `--raiz` reapunta el módulo entero: el servidor sirve de ahí, el sello lee ESE
    # git y los tests se siguen inyectando desde `tests/` de este repo, que es lo que
    # se quiere — auditar otro estado del producto con el instrumental de ahora.
    global RAIZ
    if args.raiz:
        RAIZ = Path(args.raiz).resolve()
        if not (RAIZ / "index.html").is_file():
            sys.exit(f"--raiz {RAIZ} no contiene index.html")

    buzon = {"informe": None, "listo": threading.Event()}
    sello_antes = sello_remoto(args.url) if args.url else estado_del_arbol(RAIZ)
    # ── El sello se NIEGA, no avisa ──────────────────────────────────────────
    #
    # Antes esta información salía como `commit X + N fichero(s) sin commitear` y la
    # pasada continuaba. `ux-lead` diagnosticó por qué eso no basta, y tiene razón:
    # **la línea estaba escrita para quien ya sospecha.** Nombraba primero lo que
    # tranquiliza —el hash— y dejaba la advertencia detrás de un `+`, así que quien
    # mide esperando una buena noticia lee el commit y sigue.
    #
    # No es teórico: el lead reportó «ocupación 9 %, el problema del ancho está
    # resuelto» a tres personas, con `+ 10 fichero(s) sin commitear` en pantalla y sin
    # procesarlo. El expediente que medía no estaba en ningún commit. Y `ux-lead`
    # confesó haber pasado de largo por la misma línea esa misma mañana.
    #
    # Así que ahora el árbol sucio **al empezar** se trata igual que el cambio en
    # vuelo, que ya se negaba: sin número. Con dos condiciones para que la negativa no
    # se vuelva inútil — que sea accionable (dice qué fichero y cómo desbloquearse) y
    # que exista una salida declarada y ruidosa (`--sucio`), porque si negarse cuesta
    # averiguar cómo seguir, alguien le pondrá un flag para saltárselo en silencio.
    if sello_antes.get("arbol_sucio") and not args.sucio:
        print(f"\n{'═' * 78}")
        print("  ⚠  NO HAY NÚMERO: el árbol está sucio antes de empezar a medir")
        print(f"{'═' * 78}")
        print(f"\n  commit {sello_antes['commit']} + {sello_antes['ficheros_modificados']} fichero(s) sin commitear.")
        print("  Un resultado que no se puede atribuir a un commit no es una medición.\n")
        estado = _sp.run(["git", "status", "--porcelain", "--",
                          "index.html", "css", "js", "content"],
                         cwd=RAIZ, capture_output=True, text=True).stdout.strip()
        for linea in estado.splitlines()[:12]:
            print(f"     {linea}")
        print("\n  Tres formas de desbloquearse, de mejor a peor:\n")
        print("    1. Commitea y repite. Es lo que quieres el 90 % de las veces.")
        print("    2. Mide un commit sin tocar el árbol de nadie:")
        print("         git worktree add /tmp/qa HEAD")
        print("         python3 tests/runner.py --raiz /tmp/qa   (o sirve /tmp/qa)")
        print("    3. Mide la web publicada, que es un estado commiteado por definición:")
        print("         python3 tests/runner.py --url https://ccanado.github.io/MyPlants/")
        print("\n    Y si de verdad quieres medir el árbol de trabajo mientras desarrollas,")
        print("    que es legítimo:  --sucio")
        print("    Estampa en cada línea que el número no es atribuible. Es una elección")
        print("    declarada, no un descuido.\n")
        return 3

    inyeccion = construir_inyeccion(tests)
    if args.abrir_todas:
        inyeccion = "<script>window.__QA_ABRIR_TODAS__=true;</script>" + inyeccion
    elif args.abrir is not None:
        inyeccion = (f"<script>window.__QA_ABRIR__=true;window.__QA_ABRIR_N__={args.abrir};</script>"
                     + inyeccion)
    srv = servidor(inyeccion, args.puerto, buzon, args.url)
    url = f"http://127.0.0.1:{args.puerto}/"

    perfil = tempfile.mkdtemp(prefix="qa-chrome-")
    forzar = []
    if args.reduce:
        forzar.append("prefers-reduced-motion")
    if args.oscuro:
        forzar.append("prefers-color-scheme")

    base = [
        chrome(),
        "--headless=new",
        f"--user-data-dir={perfil}",
        "--no-first-run", "--no-default-browser-check", "--disable-extensions",
        "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=" + str(args.dpr),
        f"--window-size={args.ancho},{args.alto}",
        "--virtual-time-budget=8000",
    ]
    if args.reduce:
        base.append("--force-prefers-reduced-motion")
    if args.oscuro:
        base.append("--force-dark-mode")

    cmd = list(base)
    if args.captura:
        cap = Path(args.captura)
        cap.parent.mkdir(parents=True, exist_ok=True)
        cmd.append(f"--screenshot={cap}")
        if args.completa:
            # `--full-page-screenshot` NO funciona junto a `--screenshot` en este
            # Chrome: la captura sale siempre con el alto de la ventana. Se pasa
            # igualmente por si una versión futura lo respeta, y se VERIFICA después
            # comparando el alto del PNG con --alto. Ver la comprobación al final.
            cmd.append("--full-page-screenshot")
    else:
        cmd.append("--screenshot=" + str(Path(perfil) / "descartar.png"))

    proc = subprocess.Popen(cmd + [url], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    try:
        recibido = buzon["listo"].wait(timeout=60)
        try:
            proc.wait(timeout=20)
        except subprocess.TimeoutExpired:
            proc.kill()
        if args.verboso:
            print((proc.stderr.read() or b"").decode()[:2000], file=sys.stderr)
    finally:
        if proc.poll() is None:
            proc.kill()
        srv.shutdown()
        if args.captura:
            # ── `--completa` tiene que fallar en voz alta ────────────────────────
            #
            # Chrome ignora `--full-page-screenshot` cuando va junto a `--screenshot`,
            # así que la captura salía SIEMPRE con el alto de la ventana. Eso no
            # produce un dato falso: produce **un dato ausente disfrazado de
            # completo**, que es peor de detectar porque no hay nada raro que mirar.
            #
            # Costó dos veces lo mismo: el lead capturó la ficha del helecho con este
            # flag, vio los primeros 900 px de una ficha de 4.000 y sacó conclusiones
            # como si la hubiera visto entera; y a `ux-lead` se le encargó revisar el
            # expediente con `--completa` para no depender del MCP, y de haberse
            # fiado habría firmado el 22 % de una ficha.
            #
            # Es el propio principio de esta suite —decir "no medible" en vez de
            # inventar un veredicto— aplicado a una captura. Si el PNG mide exactamente
            # lo que mide la ventana, `--completa` no ha hecho nada y hay que decirlo.
            alto_real = alto_png(Path(args.captura))
            if args.completa and alto_real is not None and alto_real <= args.alto:
                print(f"\n  ⚠  --completa NO HA FUNCIONADO: el PNG mide {alto_real} px de alto,")
                print(f"     que es el alto de la ventana ({args.alto}). Chrome ignora")
                print("     --full-page-screenshot junto a --screenshot.")
                print("\n     NO uses esta captura como prueba de haber visto la página entera.")
                print(f"     Alternativa que sí funciona: --alto N con N mayor que el alto real")
                print("     de lo que quieras ver (p. ej. --alto 6000 para una ficha desplegada),")
                print("     porque con la ventana alta no hay nada fuera de captura.")
                fallo_captura = True
            else:
                fallo_captura = False
            print(f"captura → {args.captura}"
                  + (f" ({alto_real} px de alto)" if alto_real else ""))
        shutil.rmtree(perfil, ignore_errors=True)

    if args.captura and locals().get("fallo_captura"):
        # Se propaga como incidencia: una captura que no prueba lo que dice no puede
        # dejar la puerta de salida en verde.
        print("\n✗ la captura pedida con --completa no es completa (ver arriba)")

    if not recibido or buzon["informe"] is None:
        print("No se pudo recoger el informe. ¿La página cargó?", file=sys.stderr)
        return 2

    informe = buzon["informe"]
    informe["estado_medido"] = sello_antes
    if args.url:
        # Contra una URL publicada no hay mtimes que vigilar: lo que se mide está en
        # otra máquina. La huella del index servido es la única prueba del estado.
        informe["codigo_movido_durante_la_medida"] = []
    else:
        sello_despues = estado_del_arbol(RAIZ)
        movido = [f for f, m in sello_despues["mtimes"].items()
                  if sello_antes["mtimes"].get(f) != m]
        informe["codigo_movido_durante_la_medida"] = movido
    if args.json:
        Path(args.json).write_text(json.dumps(informe, ensure_ascii=False, indent=2), encoding="utf-8")

    meta = informe["meta"]
    sello = informe["estado_medido"]
    print(f"\n{'═' * 78}")
    print(f"  {meta['ancho']}×{meta['alto']} · dpr {meta['dpr']} · "
          f"reduce: {'sí' if meta['reduce'] else 'no'} · {meta['articles']} ficha(s)")
    if sello.get("medido_contra"):
        print(f"  PUBLICADO · {sello['medido_contra']}")
        print(f"  commit {sello['commit']} · index sha256 {sello['sha256_index_servido']}"
              f" · {sello['bytes_index_servido']} bytes")
        if sello.get("commit_local") and sello["commit"].split(" ")[0] != sello["commit_local"]:
            print(f"  ⚠  el remoto sirve {sello['commit'].split(' ')[0]} y en local estás en "
                  f"{sello['commit_local']}: NO es el mismo código")
    elif sello["arbol_sucio"]:
        print(f"  NO ATRIBUIBLE · árbol sucio ({sello['ficheros_modificados']} fichero(s)) "
              f"sobre {sello['commit']} · medido con --sucio")
        print("  NO ATRIBUIBLE · estos números no valen para un informe")
    else:
        print(f"  commit {sello['commit']} (árbol limpio) · "
              f"{sello['ficheros_medidos']} ficheros medidos")
    print(f"{'═' * 78}")
    if informe["codigo_movido_durante_la_medida"]:
        print("\n⚠  EL CÓDIGO CAMBIÓ MIENTRAS SE MEDÍA — este resultado no es atribuible:")
        for f in informe["codigo_movido_durante_la_medida"]:
            print(f"     {f}")
        print("   Repite la pasada con el árbol quieto.")

    if meta["desbordaHorizontal"]:
        print(f"\n✗ DESBORDE HORIZONTAL: scrollWidth {meta['scrollWidth']} > ancho {meta['ancho']}")
        for d in meta["desbordan"]:
            print(f"    {d}")

    fallo = meta["desbordaHorizontal"]
    for nombre in tests:
        r = informe["tests"].get(nombre)
        if r is None:
            print(f"\n[{nombre}] no devolvió informe")
            fallo = True
            continue
        ok = r.get("ok", True)
        fallo = fallo or not ok
        print(f"\n{'✓' if ok else '✗'} [{nombre}] {r.get('resumen', '')}")
        for clave in ("fallos", "texto_fallos", "controles_fallos", "problemas"):
            for f in (r.get(clave) or [])[:14]:
                print(f"    · {json.dumps(f, ensure_ascii=False)[:190]}")

    consola = informe.get("consola", [])
    if consola:
        print(f"\n✗ CONSOLA: {len(consola)} mensaje(s)")
        for c in consola[:15]:
            print(f"    [{c['nivel']}] {c['texto']}")
        fallo = True
    else:
        print("\n✓ consola limpia: 0 errores, 0 warnings, 0 recursos caídos")

    for e in informe.get("errores", []):
        print(f"\n!! error ejecutando {e}")
        fallo = True

    if sello.get("arbol_sucio") and args.sucio:
        print("\n  ⚠  NO ATRIBUIBLE: medido con --sucio sobre un árbol con "
              f"{sello['ficheros_modificados']} fichero(s) sin commitear.")
        print("     No uses estos números en un informe: no describen ningún commit.")

    if args.captura and locals().get("fallo_captura"):
        fallo = True

    print()
    return 1 if fallo else 0


if __name__ == "__main__":
    sys.exit(main())
