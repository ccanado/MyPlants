#!/usr/bin/env python3
"""Comprueba las restricciones de "estático y sin terceros" de MyPlants.

Qué verifica:

1. Cero requests a terceros. Distingue lo que carga un subrecurso (src, @import,
   url(), link rel=stylesheet/preload/icon, fetch/import en JS) de un simple
   <a href="https://…">, que es un enlace y no una petición — las fuentes citadas
   de las fichas son enlaces legítimos y no deben dar error.
2. Toda <img> con width, height y loading explícitos: evita saltos de layout.
3. Los <script> van como type="module" y sin bundler por medio.
4. Señales de build step colado por la puerta de atrás (package.json, node_modules,
   imports desnudos tipo `import x from "libreria"`).

Uso:
    python3 .claude/skills/vanilla-web-craft/scripts/check-estatico.py [--raiz .]

Código 1 si hay errores.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

EXTERNO = re.compile(r"""(?:https?:)?//[\w.-]+""", re.I)
LOCAL_OK = re.compile(r"^(?:\./|\.\./|/|#|data:|mailto:|tel:)")

CARGADORES_HTML = re.compile(
    r"""<(?:script|img|source|iframe|video|audio|embed|track)\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']""",
    re.I,
)
LINK_HTML = re.compile(r"""<link\b[^>]*>""", re.I)
IMG_TAG = re.compile(r"<img\b[^>]*>", re.I)
SCRIPT_TAG = re.compile(r"<script\b[^>]*>", re.I)
ATTR = lambda nombre: re.compile(rf"""\b{nombre}\s*=\s*["']?([^"'\s>]*)""", re.I)

CSS_IMPORT = re.compile(r"""@import\s+(?:url\()?["']?([^"')]+)""", re.I)
CSS_URL = re.compile(r"""url\(\s*["']?([^"')]+)""", re.I)
JS_IMPORT = re.compile(r"""(?:^|\s)(?:import|export)\b[^;\n]*?from\s+["']([^"']+)["']""", re.M)
JS_IMPORT_BARE = re.compile(r"""(?:^|\s)import\s+["']([^"']+)["']""", re.M)
JS_FETCH = re.compile(r"""fetch\(\s*["'`]([^"'`]+)""")


def strip_css_comments(text: str) -> str:
    return re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.S)


def strip_html_comments(text: str) -> str:
    return re.sub(r"<!--.*?-->", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.S)


def linea_de(texto: str, pos: int) -> int:
    return texto.count("\n", 0, pos) + 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raiz", default=".")
    args = ap.parse_args()
    raiz = Path(args.raiz).resolve()

    errores: list[str] = []
    avisos: list[str] = []

    # --- señales de build step -----------------------------------------------------------
    for señal in ("package.json", "node_modules", "vite.config.js", "webpack.config.js",
                  "tsconfig.json", "package-lock.json"):
        if (raiz / señal).exists():
            errores.append(f"{señal} existe: el proyecto no debe tener build step ni dependencias")

    # --- HTML ---------------------------------------------------------------------------
    html_path = raiz / "index.html"
    if not html_path.is_file():
        avisos.append("index.html todavía no existe — builder aún no ha empezado")
    else:
        crudo = html_path.read_text(encoding="utf-8")
        html = strip_html_comments(crudo)

        for m in CARGADORES_HTML.finditer(html):
            url = m.group(1).strip()
            if EXTERNO.match(url):
                errores.append(f"index.html:{linea_de(html, m.start())}: carga externa → {url}")

        for m in LINK_HTML.finditer(html):
            tag = m.group(0)
            rel = (ATTR("rel").search(tag) or [None, ""])[1] if ATTR("rel").search(tag) else ""
            href_m = ATTR("href").search(tag)
            if href_m and EXTERNO.match(href_m.group(1).strip()):
                errores.append(
                    f"index.html:{linea_de(html, m.start())}: <link rel=\"{rel}\"> externo → "
                    f"{href_m.group(1)}"
                )

        for m in IMG_TAG.finditer(html):
            tag, n = m.group(0), linea_de(html, m.start())
            for attr in ("width", "height", "loading"):
                if not ATTR(attr).search(tag):
                    errores.append(f"index.html:{n}: <img> sin {attr} → {tag[:90]}")
            if not ATTR("alt").search(tag):
                errores.append(
                    f"index.html:{n}: <img> sin alt (usa alt=\"\" si es decorativa) → {tag[:90]}"
                )

        for m in SCRIPT_TAG.finditer(html):
            tag, n = m.group(0), linea_de(html, m.start())
            if ATTR("src").search(tag):
                tipo_m = ATTR("type").search(tag)
                if not tipo_m or tipo_m.group(1) != "module":
                    errores.append(f"index.html:{n}: <script src> sin type=\"module\" → {tag[:90]}")

        if not re.search(r"<html[^>]*\blang\s*=", html, re.I):
            errores.append("index.html: falta lang en <html> (los lectores de pantalla lo necesitan)")
        h1 = len(re.findall(r"<h1\b", html, re.I))
        if h1 != 1:
            errores.append(f"index.html: hay {h1} <h1>, debe haber exactamente 1")

    # --- CSS ---------------------------------------------------------------------------
    for ruta in sorted((raiz / "css").glob("*.css")) if (raiz / "css").is_dir() else []:
        rel = ruta.relative_to(raiz)
        css = strip_css_comments(ruta.read_text(encoding="utf-8"))
        for regex, etiqueta in ((CSS_IMPORT, "@import"), (CSS_URL, "url()")):
            for m in regex.finditer(css):
                url = m.group(1).strip()
                if EXTERNO.match(url):
                    errores.append(f"{rel}:{linea_de(css, m.start())}: {etiqueta} externo → {url}")

    # --- JS ----------------------------------------------------------------------------
    for ruta in sorted((raiz / "js").rglob("*.js")) if (raiz / "js").is_dir() else []:
        rel = ruta.relative_to(raiz)
        js = ruta.read_text(encoding="utf-8")
        for regex in (JS_IMPORT, JS_IMPORT_BARE):
            for m in regex.finditer(js):
                spec = m.group(1).strip()
                n = linea_de(js, m.start())
                if EXTERNO.match(spec):
                    errores.append(f"{rel}:{n}: import externo → {spec}")
                elif not LOCAL_OK.match(spec):
                    errores.append(
                        f"{rel}:{n}: import desnudo '{spec}' — sin bundler hay que usar "
                        f"una ruta relativa ('./{spec}.js')"
                    )
        for m in JS_FETCH.finditer(js):
            url = m.group(1).strip()
            if EXTERNO.match(url):
                errores.append(f"{rel}:{linea_de(js, m.start())}: fetch externo → {url}")

    # --- fuentes self-hosted -----------------------------------------------------------
    fonts = raiz / "assets" / "fonts"
    if fonts.is_dir():
        no_woff2 = [p.name for p in fonts.iterdir() if p.is_file() and p.suffix.lower() not in {".woff2"}]
        if no_woff2:
            avisos.append(f"assets/fonts/ tiene formatos innecesarios (solo woff2): {', '.join(no_woff2)}")

    for a in avisos:
        print(f"AVISO  {a}")
    for e in errores:
        print(f"ERROR  {e}")

    print()
    if errores:
        print(f"✗ {len(errores)} incidencia(s).")
        return 1
    print("✓ estático, sin terceros, imágenes dimensionadas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
