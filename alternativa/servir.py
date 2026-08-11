#!/usr/bin/env python3
"""Sirve el repo con la versión alternativa en la raíz.

Existe por una razón concreta: `tests/runner.py` audita `http://127.0.0.1:PORT/`
y, en modo espejo (`--url`), cuelga todas las rutas relativas del prefijo de la
página. Con la alternativa en `/alternativa/`, el `fetch` de
`../content/plantas.json` se pediría como `/alternativa/content/plantas.json` y
daría 404. Sirviendo la alternativa **en la raíz**, el prefijo es vacío, las
rutas resuelven y el runner audita esta página sin tocar ni una línea de
`tests/`, que no es mío.

    python3 alternativa/servir.py 8010
    python3 tests/runner.py --url http://127.0.0.1:8010/ --ancho 1280
"""
import http.server
import os
import socketserver
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ALT = "/alternativa/"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(RAIZ), **k)

    def log_message(self, *a):
        pass

    def translate_path(self, path):
        # La raíz y los ficheros propios de la alternativa se resuelven dentro
        # de alternativa/; el resto (assets/, content/) sale del repo tal cual.
        limpio = path.split("?", 1)[0].split("#", 1)[0]
        if limpio in ("/", "/index.html"):
            limpio = ALT + "index.html"
        elif "/" not in limpio.strip("/") and limpio.strip("/"):
            candidato = RAIZ / "alternativa" / limpio.strip("/")
            if candidato.is_file():
                limpio = ALT + limpio.strip("/")
        return super().translate_path(limpio)


if __name__ == "__main__":
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8010
    os.chdir(RAIZ)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", puerto), Handler) as httpd:
        print(f"alternativa en http://127.0.0.1:{puerto}/  (Ctrl-C para parar)")
        httpd.serve_forever()
