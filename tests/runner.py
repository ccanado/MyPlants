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


def construir_inyeccion(tests: list[str]) -> str:
    trozos = []
    for nombre in tests:
        ruta = TESTS / f"{nombre}.js"
        if not ruta.is_file():
            sys.exit(f"No existe {ruta}")
        trozos.append(f"<script>\n{envolver(nombre, ruta.read_text(encoding='utf-8'))}\n</script>")
    trozos.append(f"<script>\n{RECOLECTOR}\n</script>")
    return "\n".join(trozos)


def servidor(inyeccion: str, puerto: int, buzon: dict):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(RAIZ), **k)

        def log_message(self, *a):
            pass

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
            if ruta in ("/", "/index.html"):
                html = (RAIZ / "index.html").read_text(encoding="utf-8")
                html = html.replace("</body>", inyeccion + "\n</body>")
                datos = html.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
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
    ap.add_argument("--verboso", action="store_true")
    args = ap.parse_args()

    tests = args.test or ORDEN
    buzon = {"informe": None, "listo": threading.Event()}
    srv = servidor(construir_inyeccion(tests), args.puerto, buzon)
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
            print(f"captura → {args.captura}")
        shutil.rmtree(perfil, ignore_errors=True)

    if not recibido or buzon["informe"] is None:
        print("No se pudo recoger el informe. ¿La página cargó?", file=sys.stderr)
        return 2

    informe = buzon["informe"]
    if args.json:
        Path(args.json).write_text(json.dumps(informe, ensure_ascii=False, indent=2), encoding="utf-8")

    meta = informe["meta"]
    print(f"\n{'═' * 78}")
    print(f"  {meta['ancho']}×{meta['alto']} · dpr {meta['dpr']} · "
          f"reduce: {'sí' if meta['reduce'] else 'no'} · {meta['articles']} ficha(s)")
    print(f"{'═' * 78}")

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

    for e in informe.get("errores", []):
        print(f"\n!! error ejecutando {e}")
        fallo = True

    print()
    return 1 if fallo else 0


if __name__ == "__main__":
    sys.exit(main())
