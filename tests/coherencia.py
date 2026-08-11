#!/usr/bin/env python3
"""tests/coherencia.py — MyPlants / qa-visual

Cierra el hueco por el que se nos han colado ya tres fallos mudos en esta sesión:
un cambio correcto por un lado deja ciego a otro **sin que nada dé error**. Ni los
checkers del skill ni el validador de contenido cruzan las fronteras entre ficheros,
porque cada uno mira su lado.

Comprueba tres fronteras de fichero (la cuarta, JSON↔render, es de ejecución y vive
en `tests/cobertura-datos.js`, que es la que caza el fallo del tipo «botanist renombra
`estado` a `estados` y las siete fichas se quedan sin diagnóstico sin dar un error»).

1. `url()` local ↔ disco. Todo `url()` de CSS y todo `src`/`href` local del HTML
   tiene que resolver a un fichero que exista. `check-estatico.py` busca URLs
   **externas**, así que una ruta relativa rota le parece perfecta. Se descartan
   comentarios ANTES de buscar: contar sobre texto crudo es lo que nos hizo
   reportar seis 404 de fuentes que estaban comentadas a propósito.

2. Fotos de etiqueta. `foto_etiqueta` y `alt_etiqueta` son campos nuevos que el
   validador de contenido no conoce: existen los ficheros, las dimensiones son las
   suyas (675×900 o 500×667, distintas de las fotos de planta) y el `alt` describe
   la etiqueta y no la planta.

3. Datos de pegatina inventados. Una planta sin `etiqueta_vivero` no puede tener
   precio, EAN ni nº fitosanitario en el JSON. Un dato inventado ahí convierte la
   signature de la página en decoración falsa.

Uso:
    python3 tests/coherencia.py [--raiz .]

Código 1 si hay errores.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


def strip_css_comments(texto: str) -> str:
    return re.sub(r"/\*.*?\*/", " ", texto, flags=re.S)


def strip_html_comments(texto: str) -> str:
    return re.sub(r"<!--.*?-->", " ", texto, flags=re.S)


CSS_URL = re.compile(r"""url\(\s*['"]?([^'")]+)""", re.I)
HTML_REF = re.compile(
    r"""<(?:img|script|source|link|video|audio|iframe|embed|object)\b[^>]*?"""
    r"""\b(?:src|href|data)\s*=\s*["']([^"']+)["']""",
    re.I,
)
LOCAL_SALTAR = re.compile(r"^(?:data:|blob:|https?:|//|#|mailto:|tel:)")




def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raiz", default=".")
    args = ap.parse_args()
    raiz = Path(args.raiz).resolve()

    errores: list[str] = []
    avisos: list[str] = []
    info: list[str] = []

    # ─── 1. JSON: carga y campos presentes ───────────────────────────────────────
    # NOTA: aquí había un cruce estático "qué campos lee js/ frente a los que trae el
    # JSON". Lo he retirado: la regex casaba con CUALQUIER variable llamada `p` o
    # `planta` (incluido `plagas.map(p => p.nombre)` y los nodos del DOM), y producía
    # 25 errores de los que ninguno era real. La comprobación buena de esa frontera es
    # de EJECUCIÓN y está en tests/cobertura-datos.js: comprueba qué contenido del JSON
    # llega de verdad a la página. Un checker ruidoso es peor que no tenerlo.
    jpath = raiz / "content" / "plantas.json"
    plantas: list[dict] = []
    if not jpath.is_file():
        avisos.append("content/plantas.json no existe todavía")
    else:
        try:
            datos = json.loads(jpath.read_text(encoding="utf-8"))
            plantas = datos if isinstance(datos, list) else datos.get("plantas", [])
        except json.JSONDecodeError as e:
            errores.append(f"content/plantas.json no es JSON válido: {e}")

    # ─── 2. url() local ↔ disco ──────────────────────────────────────────────────
    def revisar_refs(ruta: Path, texto: str, regex: re.Pattern, etiqueta: str) -> None:
        for m in regex.finditer(texto):
            url = m.group(1).split("?")[0].split("#")[0].strip()
            if not url or LOCAL_SALTAR.match(url):
                continue
            base = raiz if url.startswith("/") else ruta.parent
            destino = (base / url.lstrip("/")).resolve()
            if not destino.is_file():
                n = texto.count("\n", 0, m.start()) + 1
                errores.append(
                    f"{ruta.relative_to(raiz)}:{n}: {etiqueta} apunta a «{url}» y ese "
                    f"fichero NO EXISTE — no lo mira check-estatico.py, que solo busca URLs externas"
                )

    for css in sorted((raiz / "css").glob("*.css")) if (raiz / "css").is_dir() else []:
        revisar_refs(css, strip_css_comments(css.read_text(encoding="utf-8")), CSS_URL, "url()")

    html_path = raiz / "index.html"
    if html_path.is_file():
        html = strip_html_comments(html_path.read_text(encoding="utf-8"))
        revisar_refs(html_path, html, HTML_REF, "referencia local")
        revisar_refs(html_path, html, CSS_URL, "url() en estilo en línea")

    # ─── 3. fotos de etiqueta ────────────────────────────────────────────────────
    sys.path.insert(0, str(raiz / "tests"))
    dimensiones = None
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("_pa", raiz / "tests" / "peso-assets.py")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        dimensiones = mod.dimensiones
    except Exception:
        avisos.append("no pude reutilizar dimensiones() de peso-assets.py; salto el chequeo de tamaños")

    con_etiqueta = 0
    for p in plantas:
        pid = p.get("id") or p.get("nombre_comun")
        foto_et = p.get("foto_etiqueta")
        alt_et = p.get("alt_etiqueta")

        if foto_et:
            con_etiqueta += 1
            ruta = (raiz / "assets" / "img" / foto_et).resolve() if "/" not in str(foto_et) \
                else (raiz / str(foto_et).lstrip("./")).resolve()
            if not ruta.is_file():
                errores.append(f"«{pid}»: foto_etiqueta → {foto_et} NO EXISTE en disco")
            elif dimensiones:
                d = dimensiones(ruta)
                if d and abs(d[0] / d[1] - 0.75) > 0.02:
                    errores.append(
                        f"«{pid}»: {foto_et} es {d[0]}×{d[1]}, proporción {d[0]/d[1]:.2f} — "
                        f"se esperaba 3:4 (0,75) como las demás"
                    )
            if not alt_et:
                errores.append(f"«{pid}»: tiene foto_etiqueta pero NO alt_etiqueta")
            else:
                a = alt_et.lower()
                if not any(t in a for t in ("etiqueta", "pegatina", "maceta", "tiesto", "código", "codigo")):
                    avisos.append(
                        f"«{pid}»: alt_etiqueta no menciona la etiqueta ni la maceta — "
                        f"¿describe la planta en vez de la prueba documental? → «{alt_et[:70]}»"
                    )
        elif alt_et:
            errores.append(f"«{pid}»: tiene alt_etiqueta pero no foto_etiqueta")

    # ─── 4. datos de pegatina inventados ─────────────────────────────────────────
    CAMPOS_PEGATINA = ("precio_eur", "ean", "codigo_vivero", "num_fitosanitario",
                       "pasaporte", "maceta_texto", "maceta_cm", "nombre_etiqueta")
    for p in plantas:
        pid = p.get("id") or p.get("nombre_comun")
        et = p.get("etiqueta_vivero")
        if et:
            continue  # tiene pegatina: sus datos son legítimos
        inventados = [c for c in CAMPOS_PEGATINA if p.get(c) not in (None, "", [])]
        if inventados:
            errores.append(
                f"«{pid}» NO tiene etiqueta_vivero pero trae {', '.join(inventados)} — "
                f"un dato de pegatina inventado convierte la signature en decoración falsa"
            )
        if isinstance(et, dict):
            pass

    if plantas:
        info.append(f"etiquetas de vivero: {con_etiqueta} con foto_etiqueta, {len(plantas) - con_etiqueta} sin pegatina")

    # ─── salida ──────────────────────────────────────────────────────────────────
    for i in info:
        print(f"       {i}")
    if info:
        print()
    for a in avisos:
        print(f"AVISO  {a}")
    for e in errores:
        print(f"ERROR  {e}")

    print()
    if errores:
        print(f"✗ {len(errores)} incidencia(s) de coherencia entre ficheros.")
        return 1
    print("✓ JSON↔JS coherente, rutas locales resueltas, etiquetas sin datos inventados.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
