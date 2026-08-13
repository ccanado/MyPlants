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
    # IPNI (International Plant Names Index) — autoría y publicación original del nombre.
    #
    # Lo levantó este script como «no está en la lista» y era un aviso correcto: el
    # dominio no estaba. Lo que faltaba era la decisión, no la justificación, y la ha
    # cerrado `botanist` con comprobación en vez de de memoria: IPNI es el índice
    # nomenclatural de la misma casa que POWO —Kew, con Harvard y el ANH— y es de donde
    # POWO toma la autoría y la referencia de publicación de cada nombre. El reparto es
    # que POWO decide qué nombre es el aceptado e IPNI aporta autoría y publicación, y
    # por eso las dos citas van juntas en cada ficha.
    #
    # Y está ahí precisamente por lo que este script clasifica como MANUAL: POWO
    # devuelve 403 a clientes automáticos, así que IPNI es la comprobación **auditable**
    # del mismo dato. Verificados los cinco registros citados: 200 los cinco, y nombre y
    # familia coinciden con las fichas.
    "www.ipni.org": "IPNI/Kew — autoría y publicación del nombre",
    "ipni.org": "IPNI/Kew — autoría y publicación del nombre",
    # api.gbif.org — el MISMO GBIF, por la puerta que sí abre.
    #
    # www.gbif.org devuelve 403 a clientes automáticos, igual que POWO, así que una
    # cita a la ficha web sería otra que hay que comprobar a mano. La API pública
    # devuelve el registro entero en JSON —nombre aceptado, autoría, familia, orden,
    # estado taxonómico— y se abre sin credenciales. No es una fuente nueva: es la
    # misma, citada por la URL que de verdad se ha abierto. Añadido el 13/08/2026 al
    # necesitar la familia del helecho nuevo, que es donde IPNI y GBIF discrepan.
    "api.gbif.org": "GBIF — registro taxonómico (API pública, la que sí abre)",
    # Pet Poison Helpline — toxicidad veterinaria DONDE ASPCA NO LLEGA.
    #
    # Esto sí es una fuente nueva y conviene que se vea. ASPCA es la referencia del
    # proyecto para toxicidad en mascotas y no tiene entrada para Codiaeum variegatum:
    # comprobado el 13/08/2026 en su listado por letra C y en el imprimible para
    # perros. Dejar el croton en `sin_datos` habría sido peor que citar un centro de
    # toxicología veterinaria que sí lo cubre, teniendo además a RHS afirmando que
    # todas las partes de la planta son venenosas. Se usa como suplente, no como
    # sustituto: donde ASPCA tenga entrada, manda ASPCA.
    "www.petpoisonhelpline.com": "Pet Poison Helpline — toxicidad veterinaria (suplente de ASPCA)",
    "petpoisonhelpline.com": "Pet Poison Helpline — toxicidad veterinaria (suplente de ASPCA)",
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
            # `Accept` incluye JSON y un comodín, y no es un detalle.
            #
            # Con «text/html,application/xhtml+xml» a secas, este comprobador daba
            # ERROR 406 «Not Acceptable» en https://api.gbif.org/v1/species/3071476 —
            # una cita perfectamente viva—, porque esa URL sirve JSON y el script le
            # estaba diciendo que solo aceptaba HTML. O sea que el servidor respondía
            # correctamente y el instrumento lo apuntaba como cita rota.
            #
            # Es el patrón de siempre de este proyecto: el fallo estaba en quien mide.
            # Y hacía daño del peor tipo, porque el veredicto de este script es «una
            # ficha con una cita rota parece verificada sin estarlo» — con lo cual una
            # cita buena parecía mala y la única salida habría sido quitar la fuente.
            # Lo que se comprueba aquí es si una URL resuelve, no de qué tipo es lo
            # que devuelve.
            "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        })
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                final = r.geturl()
                nota = ""
                if final.rstrip("/") != url.rstrip("/"):
                    nota = f"redirige a {final}"
                return url, r.status, nota
        except urllib.error.HTTPError as e:
            if e.code in (403, 405, 406, 501) and metodo == "HEAD":
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
