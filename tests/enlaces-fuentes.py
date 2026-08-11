#!/usr/bin/env python3
"""tests/enlaces-fuentes.py — MyPlants / qa-visual

Comprueba que cada URL citada en `content/plantas.json` resuelve de verdad.

El motivo, en una frase del lead que resume bien por qué esto importa más de lo que
parece: *una cita rota hace que la ficha parezca verificada sin estarlo, y eso es peor
que no citar*. La página promete "los datos botánicos están verificados y citados"; si
el enlace a ASPCA da 404, la promesa es falsa y nadie se entera, porque el enlace se
pinta igual de bonito.

Es el único test del proyecto que sale a la red. Se ejecuta a mano y a propósito:
`check-estatico.py` prohíbe peticiones a terceros **desde la página**, no desde el QA.
La web servida no pide nada a nadie; esto es una herramienta de escritorio.

Uso:
    python3 tests/enlaces-fuentes.py                 # solo cabecera, en paralelo
    python3 tests/enlaces-fuentes.py --lento         # 1 petición cada 2 s, más educado
    python3 tests/enlaces-fuentes.py --timeout 20

Código 1 si alguna URL no resuelve. Los avisos (redirección, dominio no citable) no
tumban la ejecución, pero conviene leerlos.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse

# Los dominios que el proyecto acepta como fuente citable (CLAUDE.md y el skill).
DOMINIOS_CITABLES = {
    "powo.science.kew.org": "POWO/Kew — nomenclatura",
    "www.rhs.org.uk": "RHS — cultivo",
    "rhs.org.uk": "RHS — cultivo",
    "www.gbif.org": "GBIF — distribución",
    "gbif.org": "GBIF — distribución",
    "www.aspca.org": "ASPCA — toxicidad en mascotas",
    "aspca.org": "ASPCA — toxicidad en mascotas",
}

AGENTE = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " \
         "(KHTML, like Gecko) Chrome/125.0 Safari/537.36"


def recolectar(plantas: list[dict]) -> dict[str, list[str]]:
    """URL → lista de «planta/campo» que la citan."""
    urls: dict[str, list[str]] = {}

    def anota(url, donde):
        if isinstance(url, str) and url.startswith("http"):
            urls.setdefault(url.strip(), []).append(donde)

    def hurga(valor, planta_id, ruta):
        if isinstance(valor, dict):
            for k, v in valor.items():
                if k in ("url", "enlace", "href") and isinstance(v, str):
                    anota(v, f"{planta_id}/{ruta}")
                else:
                    hurga(v, planta_id, f"{ruta}.{k}" if ruta else k)
        elif isinstance(valor, list):
            for i, v in enumerate(valor):
                hurga(v, planta_id, f"{ruta}[{i}]")
        elif isinstance(valor, str) and valor.startswith("http"):
            anota(valor, f"{planta_id}/{ruta}")

    for p in plantas:
        hurga(p, p.get("id") or p.get("nombre_comun"), "")
    return urls


def comprobar(url: str, timeout: int) -> tuple[str, int | str, str]:
    """Devuelve (url, codigo, nota). HEAD primero; si el servidor no lo admite, GET."""
    for metodo in ("HEAD", "GET"):
        req = urllib.request.Request(url, method=metodo, headers={
            "User-Agent": AGENTE,
            "Accept": "text/html,application/xhtml+xml",
        })
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                final = r.geturl()
                nota = ""
                if final.rstrip("/") != url.rstrip("/"):
                    nota = f"redirige a {final}"
                return url, r.status, nota
        except urllib.error.HTTPError as e:
            if e.code in (403, 405, 501) and metodo == "HEAD":
                continue  # hay servidores que rechazan HEAD: reintentar con GET
            return url, e.code, e.reason or ""
        except urllib.error.URLError as e:
            return url, "sin red", str(e.reason)[:60]
        except Exception as e:  # timeout, TLS, etc.
            return url, "error", f"{type(e).__name__}: {str(e)[:60]}"
    return url, "error", "ni HEAD ni GET"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raiz", default=".")
    ap.add_argument("--timeout", type=int, default=15)
    ap.add_argument("--lento", action="store_true", help="secuencial, 2 s entre peticiones")
    args = ap.parse_args()
    raiz = Path(args.raiz).resolve()

    jpath = raiz / "content" / "plantas.json"
    if not jpath.is_file():
        print("aviso: content/plantas.json no existe todavía — nada que comprobar")
        return 0

    datos = json.loads(jpath.read_text(encoding="utf-8"))
    plantas = datos if isinstance(datos, list) else datos.get("plantas", [])
    urls = recolectar(plantas)

    if not urls:
        print("aviso: no hay ninguna URL citada en el JSON")
        return 0

    print(f"       {len(urls)} URL(s) distintas citadas por {len(plantas)} plantas\n")

    if args.lento:
        resultados = []
        for u in urls:
            resultados.append(comprobar(u, args.timeout))
            time.sleep(2)
    else:
        with ThreadPoolExecutor(max_workers=6) as ex:
            resultados = list(ex.map(lambda u: comprobar(u, args.timeout), urls))

    errores: list[str] = []
    avisos: list[str] = []
    no_verificables: list[str] = []
    ok = 0

    # POWO/Kew responde 403 a clientes automáticos aunque la página exista y cargue
    # perfectamente en un navegador (comprobado con Playwright: la URL del poto
    # devuelve «Epipremnum aureum … | Plants of the World Online»). Tratar ese 403
    # como cita rota mandaría a botanist a perseguir cuatro fantasmas, así que se
    # separa: no es «rota», es «no la puedo verificar yo».
    BLOQUEO_BOT = {401, 403, 429, 503}

    for url, codigo, nota in sorted(resultados, key=lambda r: str(r[1])):
        quien = ", ".join(urls[url][:3]) + (" …" if len(urls[url]) > 3 else "")
        host = urlparse(url).netloc

        if codigo == 200:
            ok += 1
            if nota:
                avisos.append(f"{url}\n           {nota}\n           citada por: {quien}")
        elif codigo in BLOQUEO_BOT:
            no_verificables.append(
                f"[{codigo}] {url}\n           el servidor bloquea clientes automáticos; "
                f"ábrela en el navegador para confirmarla\n           citada por: {quien}"
            )
        else:
            errores.append(
                f"[{codigo}] {url}\n           {nota}\n           citada por: {quien}"
            )

        if host not in DOMINIOS_CITABLES:
            avisos.append(
                f"{host} no está en la lista de fuentes citables del proyecto "
                f"(POWO/Kew, RHS, GBIF, ASPCA) — citada por: {quien}"
            )

    for a in avisos:
        print(f"AVISO  {a}")
    if avisos:
        print()
    for n in no_verificables:
        print(f"MANUAL {n}")
    if no_verificables:
        print()
    for e in errores:
        print(f"ERROR  {e}")

    print()
    print(f"       {ok}/{len(urls)} resuelven con 200 · {len(no_verificables)} a comprobar a mano")
    if errores:
        print(f"✗ {len(errores)} cita(s) rota(s). Una ficha con una cita rota parece "
              f"verificada sin estarlo.")
        return 1
    print("✓ todas las fuentes citadas resuelven.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
