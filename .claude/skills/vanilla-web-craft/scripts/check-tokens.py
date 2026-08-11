#!/usr/bin/env python3
"""Comprueba la disciplina de design tokens de MyPlants.

Dos cosas que se rompen en silencio y cuestan caro:

1. Un color, tamaño de fuente o espaciado escrito literal fuera de css/tokens.css.
   Nadie se da cuenta hasta el rediseño, cuando resulta que hay 40 valores sueltos.
2. Un var(--nombre-mal-escrito). Una custom property inexistente NO da error: la
   declaración se descarta y el elemento se queda sin ese estilo. Es el bug de CSS
   moderno más difícil de ver a ojo.

Uso:
    python3 .claude/skills/vanilla-web-craft/scripts/check-tokens.py [--raiz .]

Salida: lista de incidencias con fichero:línea. Código 1 si hay errores.

Escape puntual: añade /* token-exempt */ en la misma línea con el motivo al lado.
Si necesitas exenciones a menudo, es que falta un token — habla con ux-lead.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

TOKENS_FILE = "tokens.css"

# --- valores literales que sí son decisiones de diseño ------------------------------------

COLOR_LITERAL = re.compile(
    r"(#[0-9a-fA-F]{3,8}\b"
    r"|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\s*\()"
)

# Colores con nombre: solo los que alguien escribiría de verdad. currentColor,
# transparent e inherit son estructurales, no decisiones de paleta.
NAMED_COLORS = {
    "red", "blue", "green", "yellow", "orange", "purple", "pink", "brown",
    "black", "white", "gray", "grey", "cyan", "magenta", "lime", "navy",
    "teal", "olive", "maroon", "silver", "gold", "beige", "ivory", "coral",
    "salmon", "khaki", "tan", "crimson", "indigo", "violet", "turquoise",
    "darkgreen", "lightgreen", "darkgray", "lightgray", "darkgrey", "lightgrey",
}
NAMED_COLOR_RE = re.compile(r"\b(" + "|".join(sorted(NAMED_COLORS)) + r")\b", re.I)

COLOR_PROPS = re.compile(
    r"^\s*(color|background(-color)?|border(-\w+)?-color|border|outline(-color)?"
    r"|fill|stroke|box-shadow|text-shadow|text-decoration-color|caret-color"
    r"|accent-color|column-rule-color)\s*:",
    re.I,
)

FONT_SIZE_PROPS = re.compile(r"^\s*(font-size|font|line-height|letter-spacing)\s*:", re.I)

SPACING_PROPS = re.compile(
    r"^\s*(margin|padding|gap|row-gap|column-gap|inset"
    r"|(margin|padding)-(top|right|bottom|left|block|inline)(-(start|end))?"
    r"|top|right|bottom|left|translate)\s*:",
    re.I,
)

# Longitudes literales. Se permiten unidades relativas al viewport/contenedor y
# porcentajes: no son decisiones de escala, son layout.
LENGTH_LITERAL = re.compile(r"(?<![\w-])(-?\d*\.?\d+)(px|rem|em|ch|ex|pt|cm|mm|in|pc)\b")

ALLOWED_LENGTHS = {"0px", "1px", "-1px", "2px"}  # bordes/hairlines estructurales

EXEMPT = re.compile(r"/\*\s*token-exempt", re.I)

VAR_USE = re.compile(r"var\(\s*(--[\w-]+)")
VAR_DEF = re.compile(r"^\s*(--[\w-]+)\s*:")

# Custom properties que el JS establece en tiempo de ejecución con
# `elemento.style.setProperty("--x", …)`. No son tokens de diseño: son coordenadas
# por elemento, y meterlas en tokens.css sería meter el dato de una planta concreta
# en el fichero que define el sistema. Están definidas, solo que no ahí.
VAR_SET_JS = re.compile(r"""setProperty\(\s*["'`](--[\w-]+)["'`]""")


def strip_comments(text: str) -> str:
    """Sustituye comentarios por espacios conservando el número de líneas."""
    out = []
    i = 0
    while i < len(text):
        if text.startswith("/*", i):
            end = text.find("*/", i + 2)
            end = len(text) if end == -1 else end + 2
            out.append("".join("\n" if c == "\n" else " " for c in text[i:end]))
            i = end
        else:
            out.append(text[i])
            i += 1
    return "".join(out)


def css_files(raiz: Path) -> list[Path]:
    return sorted(p for p in (raiz / "css").glob("*.css")) if (raiz / "css").is_dir() else []


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raiz", default=".", help="raíz del proyecto (por defecto: .)")
    args = ap.parse_args()
    raiz = Path(args.raiz).resolve()

    ficheros = css_files(raiz)
    if not ficheros:
        print(f"aviso: no hay ficheros CSS en {raiz / 'css'} — nada que comprobar")
        return 0

    tokens_path = raiz / "css" / TOKENS_FILE
    errores: list[str] = []
    avisos: list[str] = []

    # 1) tokens definidos
    definidos: set[str] = set()
    if tokens_path.is_file():
        for linea in strip_comments(tokens_path.read_text(encoding="utf-8")).splitlines():
            m = VAR_DEF.match(linea)
            if m:
                definidos.add(m.group(1))
    else:
        avisos.append(f"{TOKENS_FILE} no existe todavía en css/ — ux-lead aún no lo ha creado")

    # 2) literales fuera de tokens.css
    usados: dict[str, list[str]] = {}
    for ruta in ficheros:
        rel = ruta.relative_to(raiz)
        es_tokens = ruta.name == TOKENS_FILE
        crudo = ruta.read_text(encoding="utf-8")
        limpio = strip_comments(crudo)

        for n, (linea_cruda, linea) in enumerate(
            zip(crudo.splitlines(), limpio.splitlines()), start=1
        ):
            for var in VAR_USE.findall(linea):
                usados.setdefault(var, []).append(f"{rel}:{n}")

            if es_tokens or EXEMPT.search(linea_cruda) or not linea.strip():
                continue

            decl = linea.split("var(")[0] if "var(" in linea else linea

            if COLOR_PROPS.match(linea):
                if COLOR_LITERAL.search(decl):
                    errores.append(f"{rel}:{n}: color literal fuera de {TOKENS_FILE} → {linea.strip()}")
                elif NAMED_COLOR_RE.search(decl.split(":", 1)[-1]):
                    errores.append(f"{rel}:{n}: color con nombre fuera de {TOKENS_FILE} → {linea.strip()}")

            if FONT_SIZE_PROPS.match(linea):
                for num, unidad in LENGTH_LITERAL.findall(decl):
                    if f"{num}{unidad}" not in {"0px"}:
                        errores.append(
                            f"{rel}:{n}: tamaño tipográfico literal ({num}{unidad}) fuera de "
                            f"{TOKENS_FILE} → {linea.strip()}"
                        )
                        break

            if SPACING_PROPS.match(linea):
                for num, unidad in LENGTH_LITERAL.findall(decl):
                    valor = f"{num}{unidad}"
                    if valor not in ALLOWED_LENGTHS and float(num) != 0:
                        errores.append(
                            f"{rel}:{n}: espaciado literal ({valor}) fuera de {TOKENS_FILE} "
                            f"→ {linea.strip()}"
                        )
                        break

    # 2 bis) custom properties que el JS establece en tiempo de ejecución
    en_runtime: dict[str, str] = {}
    js_dir = raiz / "js"
    if js_dir.is_dir():
        for ruta in sorted(js_dir.rglob("*.js")):
            texto = ruta.read_text(encoding="utf-8")
            for n, linea in enumerate(texto.splitlines(), start=1):
                for var in VAR_SET_JS.findall(linea):
                    en_runtime.setdefault(var, f"{ruta.relative_to(raiz)}:{n}")

    # 3) var() sin definición, ni en tokens.css ni desde el JS
    if tokens_path.is_file():
        for var, sitios in sorted(usados.items()):
            if var in definidos or var in en_runtime:
                continue
            donde = ", ".join(sitios[:3]) + (" …" if len(sitios) > 3 else "")
            errores.append(
                f"{var} se usa pero no está definida en {TOKENS_FILE} "
                f"(falla en silencio) — en {donde}"
            )

        for var, origen in sorted(en_runtime.items()):
            if var in usados:
                avisos.append(
                    f"{var} no está en {TOKENS_FILE} y no hace falta: la establece el JS en "
                    f"tiempo de ejecución ({origen}). Es una coordenada por elemento, no un "
                    f"token de diseño — meterla en tokens.css sería meter un dato concreto "
                    f"en el fichero que define el sistema"
                )
            if var in definidos:
                errores.append(
                    f"{var} está definida en {TOKENS_FILE} Y la sobrescribe el JS en "
                    f"{origen}. Elige una de las dos: un valor que se pisa en runtime hace "
                    f"que el token mienta sobre lo que pinta"
                )

        sin_usar = sorted(definidos - set(usados))
        if sin_usar:
            avisos.append(
                f"{len(sin_usar)} token(s) definidos y sin usar: {', '.join(sin_usar[:8])}"
                + (" …" if len(sin_usar) > 8 else "")
            )

    for a in avisos:
        print(f"AVISO  {a}")
    for e in errores:
        print(f"ERROR  {e}")

    print()
    if errores:
        print(f"✗ {len(errores)} incidencia(s). Los valores van a css/tokens.css (dueño: ux-lead).")
        return 1
    print(f"✓ disciplina de tokens correcta ({len(definidos)} tokens, {len(usados)} referencias).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
