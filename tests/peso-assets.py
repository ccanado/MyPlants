#!/usr/bin/env python3
"""tests/peso-assets.py — MyPlants / qa-visual

Rendimiento y coherencia de assets, sin navegador y sin dependencias. Comprueba lo
que se puede saber leyendo el disco:

1. Peso de cada imagen y peso total de la página en el peor caso (todo cargado).
2. Dimensiones intrínsecas reales (lee la cabecera de JPEG/PNG/WebP/AVIF/GIF a mano)
   y las compara con los width/height del HTML: si no cuadran, hay salto de layout
   o se está sirviendo una foto de 4000px para pintar 400.
3. Que toda ruta de imagen referenciada exista: en index.html, en css/*.css y en el
   campo `foto` de content/plantas.json. Un 404 de imagen no rompe nada visible en
   consola de CI, pero deja un hueco en la rejilla.
4. Fuentes: solo woff2, y peso razonable (una fuente sin subsetear pesa 200-400 KB).
5. Assets huérfanos: ficheros en assets/ que nadie referencia.

Uso:
    python3 tests/peso-assets.py [--raiz .]

Código 1 si hay errores.
"""

from __future__ import annotations

import argparse
import json
import re
import struct
import sys
from pathlib import Path

# --- presupuestos (una web de fichas de planta no necesita más) -------------------------
MAX_IMG_KB = 300          # por imagen
MAX_TOTAL_IMG_KB = 2500   # todas las imágenes juntas
MAX_FUENTE_KB = 90        # woff2 subseteada a latín
MAX_CSS_KB = 60
MAX_JS_KB = 60
SOBREMUESTREO = 2.5       # px reales / px pintados


# --- dimensiones intrínsecas sin dependencias -------------------------------------------
def dimensiones(ruta: Path) -> tuple[int, int] | None:
    try:
        datos = ruta.read_bytes()
    except OSError:
        return None
    if len(datos) < 24:
        return None

    # PNG
    if datos[:8] == b"\x89PNG\r\n\x1a\n":
        w, h = struct.unpack(">II", datos[16:24])
        return w, h

    # GIF
    if datos[:6] in (b"GIF87a", b"GIF89a"):
        w, h = struct.unpack("<HH", datos[6:10])
        return w, h

    # WebP
    if datos[:4] == b"RIFF" and datos[8:12] == b"WEBP":
        cabecera = datos[12:16]
        if cabecera == b"VP8X":
            w = int.from_bytes(datos[24:27], "little") + 1
            h = int.from_bytes(datos[27:30], "little") + 1
            return w, h
        if cabecera == b"VP8 ":
            w = struct.unpack("<H", datos[26:28])[0] & 0x3FFF
            h = struct.unpack("<H", datos[28:30])[0] & 0x3FFF
            return w, h
        if cabecera == b"VP8L":
            b0, b1, b2, b3 = datos[21:25]
            bits = b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)
            return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1

    # AVIF / HEIF: ispe box
    if datos[4:8] == b"ftyp":
        i = datos.find(b"ispe")
        if i > 0 and len(datos) >= i + 16:
            w, h = struct.unpack(">II", datos[i + 8 : i + 16])
            return w, h

    # JPEG: recorrer marcadores hasta SOF
    if datos[:2] == b"\xff\xd8":
        i = 2
        n = len(datos)
        while i < n - 9:
            if datos[i] != 0xFF:
                i += 1
                continue
            marcador = datos[i + 1]
            if marcador in (0xD8, 0x01) or 0xD0 <= marcador <= 0xD7:
                i += 2
                continue
            if i + 4 > n:
                break
            largo = struct.unpack(">H", datos[i + 2 : i + 4])[0]
            if marcador in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                            0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                h, w = struct.unpack(">HH", datos[i + 5 : i + 9])
                return w, h
            i += 2 + largo
    return None


IMG_TAG = re.compile(r"<img\b[^>]*>", re.I)
ATTR = lambda n: re.compile(rf"""\b{n}\s*=\s*["']([^"']*)["']""", re.I)
CSS_URL = re.compile(r"""url\(\s*['"]?([^'")]+)""", re.I)


def kb(n: int) -> float:
    return round(n / 1024, 1)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raiz", default=".")
    args = ap.parse_args()
    raiz = Path(args.raiz).resolve()

    errores: list[str] = []
    avisos: list[str] = []
    info: list[str] = []

    referenciados: set[Path] = set()

    def resolver(url: str, desde: Path) -> Path | None:
        url = url.split("?")[0].split("#")[0].strip()
        if not url or url.startswith(("data:", "http:", "https:", "//", "blob:")):
            return None
        base = raiz if url.startswith("/") else desde.parent
        return (base / url.lstrip("/")).resolve()

    # --- index.html --------------------------------------------------------------------
    html_path = raiz / "index.html"
    if not html_path.is_file():
        avisos.append("index.html todavía no existe — builder aún no ha empezado")
    else:
        html = html_path.read_text(encoding="utf-8")
        for m in IMG_TAG.finditer(html):
            tag = m.group(0)
            src_m = ATTR("src").search(tag)
            if not src_m:
                continue
            ruta = resolver(src_m.group(1), html_path)
            if ruta is None:
                continue
            referenciados.add(ruta)
            if not ruta.is_file():
                errores.append(f"index.html: <img src=\"{src_m.group(1)}\"> NO EXISTE en disco")
                continue
            w_m, h_m = ATTR("width").search(tag), ATTR("height").search(tag)
            dim = dimensiones(ruta)
            if w_m and h_m and dim:
                dw, dh = dim
                hw, hh = int(w_m.group(1)), int(h_m.group(1))
                if abs((hw / hh) - (dw / dh)) > 0.02:
                    errores.append(
                        f"{ruta.name}: width/height del HTML {hw}×{hh} no cuadra con el "
                        f"fichero {dw}×{dh} — la imagen saldrá deformada o dará salto de layout"
                    )
                if dw > hw * SOBREMUESTREO:
                    avisos.append(
                        f"{ruta.name}: {dw}px de ancho real para pintar {hw}px — "
                        f"sobra resolución, reescálala"
                    )

    # --- CSS ---------------------------------------------------------------------------
    for css in sorted((raiz / "css").glob("*.css")) if (raiz / "css").is_dir() else []:
        # sin quitar comentarios, un "url(...)" citado en prosa dentro de un /* */
        # se cuenta como referencia y da un falso positivo
        texto = re.sub(r"/\*.*?\*/", " ", css.read_text(encoding="utf-8"), flags=re.S)
        peso = css.stat().st_size
        info.append(f"{css.relative_to(raiz)}: {kb(peso)} KB")
        if peso > MAX_CSS_KB * 1024:
            avisos.append(f"{css.relative_to(raiz)} pesa {kb(peso)} KB (presupuesto {MAX_CSS_KB} KB)")
        for m in CSS_URL.finditer(texto):
            ruta = resolver(m.group(1), css)
            if ruta is None:
                continue
            referenciados.add(ruta)
            if not ruta.is_file():
                errores.append(f"{css.relative_to(raiz)}: url({m.group(1)}) NO EXISTE en disco")

    # --- JS ----------------------------------------------------------------------------
    total_js = 0
    for js in sorted((raiz / "js").rglob("*.js")) if (raiz / "js").is_dir() else []:
        total_js += js.stat().st_size
    if total_js:
        info.append(f"js/ total: {kb(total_js)} KB")
        if total_js > MAX_JS_KB * 1024:
            avisos.append(f"js/ suma {kb(total_js)} KB (presupuesto {MAX_JS_KB} KB) — sin framework eso es mucho código")

    # --- content/plantas.json ----------------------------------------------------------
    jpath = raiz / "content" / "plantas.json"
    if not jpath.is_file():
        avisos.append("content/plantas.json todavía no existe — botanist aún no ha volcado")
    else:
        try:
            datos = json.loads(jpath.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errores.append(f"content/plantas.json no es JSON válido: {e}")
            datos = None
        if datos is not None:
            plantas = datos if isinstance(datos, list) else datos.get("plantas", [])
            info.append(f"content/plantas.json: {len(plantas)} planta(s), {kb(jpath.stat().st_size)} KB")
            # js/datos.js antepone "./assets/img/" a los nombres sin barra, así que un
            # `foto` pelado como "poto.jpg" es correcto y no debe darse por roto.
            for p in plantas:
                for campo in ("foto", "foto_etiqueta", "etiqueta"):
                    foto = p.get(campo)
                    if not foto:
                        if campo == "foto":
                            avisos.append(f"planta '{p.get('id') or p.get('nombre_comun')}' sin foto")
                        continue
                    foto = str(foto)
                    ruta = (
                        resolver(foto, html_path)
                        if "/" in foto
                        else (raiz / "assets" / "img" / foto).resolve()
                    )
                    if ruta is None:
                        continue
                    referenciados.add(ruta)
                    if not ruta.is_file():
                        errores.append(
                            f"content/plantas.json: {campo} de '{p.get('id') or p.get('nombre_comun')}' "
                            f"→ {foto} NO EXISTE en disco"
                        )

    # --- imágenes en assets/ -----------------------------------------------------------
    img_dir = raiz / "assets" / "img"
    total_img = 0
    if img_dir.is_dir():
        for f in sorted(img_dir.rglob("*")):
            if not f.is_file() or f.name.startswith("."):
                continue
            peso = f.stat().st_size
            total_img += peso
            dim = dimensiones(f)
            d = f"{dim[0]}×{dim[1]}" if dim else "dimensiones ilegibles"
            info.append(f"assets/img/{f.name}: {kb(peso)} KB, {d}")
            if peso > MAX_IMG_KB * 1024:
                errores.append(f"assets/img/{f.name} pesa {kb(peso)} KB (máximo {MAX_IMG_KB} KB)")
            if f.suffix.lower() in {".bmp", ".tif", ".tiff"}:
                errores.append(f"assets/img/{f.name}: formato {f.suffix} no es para web")
            if dim and (dim[0] > 2400 or dim[1] > 2400):
                avisos.append(f"assets/img/{f.name} es {d}: demasiado grande para una ficha")
            if f.resolve() not in referenciados:
                avisos.append(f"assets/img/{f.name} no lo referencia nadie (huérfano)")
        if total_img > MAX_TOTAL_IMG_KB * 1024:
            errores.append(f"assets/img/ suma {kb(total_img)} KB (presupuesto {MAX_TOTAL_IMG_KB} KB)")
    else:
        avisos.append("assets/img/ no existe todavía")

    # --- fuentes -----------------------------------------------------------------------
    fonts = raiz / "assets" / "fonts"
    if fonts.is_dir():
        for f in sorted(fonts.iterdir()):
            if not f.is_file() or f.name.startswith("."):
                continue
            peso = f.stat().st_size
            info.append(f"assets/fonts/{f.name}: {kb(peso)} KB")
            if f.suffix.lower() != ".woff2":
                errores.append(f"assets/fonts/{f.name}: solo woff2 (el resto sobra peso sin ganar nada)")
            elif peso > MAX_FUENTE_KB * 1024:
                avisos.append(
                    f"assets/fonts/{f.name} pesa {kb(peso)} KB — subsetéala a latín+latin-ext "
                    f"(objetivo <{MAX_FUENTE_KB} KB)"
                )

    # --- salida ------------------------------------------------------------------------
    for i in info:
        print(f"       {i}")
    print()
    for a in avisos:
        print(f"AVISO  {a}")
    for e in errores:
        print(f"ERROR  {e}")

    print()
    print(f"       imágenes: {kb(total_img)} KB · js: {kb(total_js)} KB")
    if errores:
        print(f"✗ {len(errores)} incidencia(s) de assets.")
        return 1
    print("✓ assets dentro de presupuesto y todas las rutas existen.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
