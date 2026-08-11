#!/usr/bin/env python3
"""Valida content/plantas.json contra las reglas de contenido de MyPlants.

La regla que este script existe para hacer cumplir: un dato sin verificar va como
null CON una nota que explique por qué. Sin comprobación automática, "null anotado"
degenera en "null olvidado", y entonces nadie sabe si un hueco es una tarea
pendiente o un descuido.

Comprueba:
  - campos obligatorios presentes y con la forma correcta
  - todo campo en null tiene entrada en `fuentes` con nota explicativa
  - todo campo con dato tiene al menos una fuente que lo respalde
  - toxicidad_mascotas: o null anotado, o con URL real (es info de seguridad)
  - ids únicos y en kebab-case
  - las fotos referenciadas existen en assets/img/
  - las URLs tienen forma de URL y las fechas formato YYYY-MM-DD

Uso:
    python3 .claude/skills/plant-expert/scripts/validar-plantas.py [--raiz .]

Código 1 si hay errores (bloquean la entrega), 0 si solo hay avisos.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

CAMPOS_TEXTO = ["id", "nombre_comun", "familia", "foto"]
CAMPOS_ANULABLES_TEXTO = ["nombre_cientifico", "historia", "notas_carlos"]
CAMPOS_RESUMEN_DETALLE = ["riego", "luz", "humedad", "sustrato", "abonado", "trasplante"]
DIFICULTADES = {"fácil", "media", "exigente"}
SEVERIDADES = {"sana", "atencion", "critica"}

RE_ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
RE_URL = re.compile(r"^https?://[^\s]+$")
RE_FECHA = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# Campos cuyo contenido debe estar respaldado por una fuente citable.
CAMPOS_VERIFICABLES = set(
    CAMPOS_RESUMEN_DETALLE
) | {"nombre_cientifico", "familia", "temperatura", "plagas_comunes", "toxicidad_mascotas"}

# Campos personales: los da Carlos, no llevan fuente institucional.
CAMPOS_PERSONALES = {"historia", "notas_carlos"}


class Informe:
    def __init__(self) -> None:
        self.errores: list[str] = []
        self.avisos: list[str] = []

    def error(self, msg: str) -> None:
        self.errores.append(msg)

    def aviso(self, msg: str) -> None:
        self.avisos.append(msg)


def campos_con_fuente(fuentes: list) -> dict[str, list[dict]]:
    por_campo: dict[str, list[dict]] = {}
    for f in fuentes:
        if isinstance(f, dict) and isinstance(f.get("campo"), str):
            por_campo.setdefault(f["campo"], []).append(f)
    return por_campo


def validar_fuentes(fuentes, etq: str, inf: Informe) -> dict[str, list[dict]]:
    if not isinstance(fuentes, list) or not fuentes:
        inf.error(f"{etq}: `fuentes` debe ser una lista no vacía")
        return {}

    for i, f in enumerate(fuentes):
        fetq = f"{etq}.fuentes[{i}]"
        if not isinstance(f, dict):
            inf.error(f"{fetq}: cada fuente debe ser un objeto")
            continue
        if not isinstance(f.get("campo"), str) or not f["campo"]:
            inf.error(f"{fetq}: falta `campo` (a qué dato respalda esta fuente)")
        url = f.get("url")
        if url is not None:
            if not isinstance(url, str) or not RE_URL.match(url):
                inf.error(f"{fetq}: `url` no parece una URL → {url!r}")
            if not f.get("fuente"):
                inf.error(f"{fetq}: hay URL pero falta el nombre de la `fuente`")
        else:
            if not f.get("nota"):
                inf.error(
                    f"{fetq}: sin `url` hace falta `nota` explicando qué falta y "
                    f"qué lo resolvería (campo: {f.get('campo')!r})"
                )
        consultado = f.get("consultado")
        if consultado is None or not RE_FECHA.match(str(consultado)):
            inf.aviso(f"{fetq}: `consultado` debería ser YYYY-MM-DD → {consultado!r}")

    return campos_con_fuente(fuentes)


def validar_resumen_detalle(valor, etq: str, inf: Informe) -> None:
    if valor is None:
        return
    if not isinstance(valor, dict):
        inf.error(f"{etq}: debe ser objeto con `resumen` y `detalle`, o null")
        return
    for clave in ("resumen", "detalle"):
        if not isinstance(valor.get(clave), str) or not valor[clave].strip():
            inf.error(f"{etq}.{clave}: falta o está vacío")
    resumen = valor.get("resumen")
    if isinstance(resumen, str) and len(resumen) > 120:
        inf.aviso(
            f"{etq}.resumen: {len(resumen)} caracteres — el resumen se lee de un vistazo, "
            f"apunta a menos de 120"
        )


def validar_planta(p, idx: int, inf: Informe, img_dir: Path, ids_vistos: set[str]) -> None:
    etq = f"plantas[{idx}]"
    if not isinstance(p, dict):
        inf.error(f"{etq}: debe ser un objeto")
        return
    etq = f"planta '{p.get('id', f'#{idx}')}'"

    for campo in CAMPOS_TEXTO:
        if not isinstance(p.get(campo), str) or not p[campo].strip():
            inf.error(f"{etq}: `{campo}` es obligatorio y no puede estar vacío")

    pid = p.get("id")
    if isinstance(pid, str):
        if not RE_ID.match(pid):
            inf.error(f"{etq}: `id` debe ser kebab-case → {pid!r}")
        if pid in ids_vistos:
            inf.error(f"{etq}: `id` duplicado")
        ids_vistos.add(pid)

    foto = p.get("foto")
    if isinstance(foto, str) and foto:
        if not (img_dir / foto).is_file():
            inf.error(f"{etq}: la foto '{foto}' no existe en assets/img/")

    if not isinstance(p.get("alt"), str) or not p.get("alt", "").strip():
        inf.error(f"{etq}: falta `alt` — el texto alternativo es contenido, no maquetación")

    for campo in CAMPOS_ANULABLES_TEXTO:
        if campo not in p:
            inf.error(f"{etq}: falta el campo `{campo}` (usa null si no se sabe)")
        elif p[campo] is not None and not isinstance(p[campo], str):
            inf.error(f"{etq}.{campo}: debe ser texto o null")

    for campo in CAMPOS_RESUMEN_DETALLE:
        if campo not in p:
            inf.error(f"{etq}: falta el campo `{campo}`")
        else:
            validar_resumen_detalle(p[campo], f"{etq}.{campo}", inf)

    temp = p.get("temperatura")
    if temp is not None:
        if not isinstance(temp, dict):
            inf.error(f"{etq}.temperatura: debe ser objeto con min_c, max_c y detalle, o null")
        else:
            for clave in ("min_c", "max_c"):
                v = temp.get(clave)
                if v is not None and not isinstance(v, (int, float)):
                    inf.error(f"{etq}.temperatura.{clave}: debe ser número o null")
            if (
                isinstance(temp.get("min_c"), (int, float))
                and isinstance(temp.get("max_c"), (int, float))
                and temp["min_c"] >= temp["max_c"]
            ):
                inf.error(f"{etq}.temperatura: min_c debe ser menor que max_c")
            if not temp.get("detalle"):
                inf.error(f"{etq}.temperatura.detalle: falta")
    elif "temperatura" not in p:
        inf.error(f"{etq}: falta el campo `temperatura`")

    plagas = p.get("plagas_comunes")
    if plagas is not None:
        if not isinstance(plagas, list):
            inf.error(f"{etq}.plagas_comunes: debe ser lista o null")
        else:
            for j, pl in enumerate(plagas):
                if not isinstance(pl, dict):
                    inf.error(f"{etq}.plagas_comunes[{j}]: debe ser objeto")
                    continue
                for clave in ("plaga", "senal", "respuesta"):
                    if not pl.get(clave):
                        inf.error(f"{etq}.plagas_comunes[{j}].{clave}: falta")

    tox = p.get("toxicidad_mascotas")
    if "toxicidad_mascotas" not in p:
        inf.error(f"{etq}: falta `toxicidad_mascotas` (null si no se ha podido verificar)")
    elif tox is not None:
        if not isinstance(tox, dict):
            inf.error(f"{etq}.toxicidad_mascotas: debe ser objeto con gatos, perros y detalle, o null")
        else:
            for clave in ("gatos", "perros", "detalle"):
                if not tox.get(clave):
                    inf.error(f"{etq}.toxicidad_mascotas.{clave}: falta")

    dif = p.get("dificultad")
    if dif not in DIFICULTADES:
        inf.error(f"{etq}.dificultad: debe ser una de {sorted(DIFICULTADES)} → {dif!r}")

    estado = p.get("estado")
    if estado is not None:
        if not isinstance(estado, dict):
            inf.error(f"{etq}.estado: debe ser objeto o null")
        else:
            sev = estado.get("severidad")
            if sev not in SEVERIDADES:
                inf.error(f"{etq}.estado.severidad: debe ser una de {sorted(SEVERIDADES)} → {sev!r}")
            fecha = estado.get("fecha_foto")
            if not (isinstance(fecha, str) and RE_FECHA.match(fecha)):
                inf.error(
                    f"{etq}.estado.fecha_foto: obligatoria y en YYYY-MM-DD — el diagnóstico "
                    f"describe un momento, no el presente"
                )
            for clave in ("senales", "causas_probables", "tratamiento"):
                v = estado.get(clave)
                if not isinstance(v, list) or not v:
                    inf.error(f"{etq}.estado.{clave}: debe ser una lista no vacía")
            if sev in {"atencion", "critica"} and not estado.get("revisar_en"):
                inf.error(
                    f"{etq}.estado.revisar_en: falta — un tratamiento sin plazo de revisión "
                    f"no se puede seguir"
                )

    # --- la regla del hueco anotado ---
    por_campo = validar_fuentes(p.get("fuentes"), etq, inf)

    for campo in CAMPOS_VERIFICABLES | CAMPOS_PERSONALES:
        if campo not in p:
            continue
        valor = p[campo]
        entradas = por_campo.get(campo, [])

        if valor is None:
            if not any(e.get("nota") for e in entradas):
                inf.error(
                    f"{etq}: `{campo}` es null sin nota en `fuentes` — cada hueco necesita "
                    f"una entrada con url:null y una nota que diga por qué falta"
                )
            continue

        if campo in CAMPOS_PERSONALES:
            continue

        if not entradas:
            inf.error(f"{etq}: `{campo}` tiene dato pero ninguna fuente lo respalda")
        elif campo == "toxicidad_mascotas" and not any(
            isinstance(e.get("url"), str) and RE_URL.match(e["url"]) for e in entradas
        ):
            inf.error(
                f"{etq}: `toxicidad_mascotas` tiene dato pero ninguna fuente con URL real. "
                f"Es información de seguridad: o cita verificable, o null anotado"
            )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raiz", default=".")
    args = ap.parse_args()
    raiz = Path(args.raiz).resolve()

    ruta = raiz / "content" / "plantas.json"
    if not ruta.is_file():
        print(f"ERROR  no existe {ruta.relative_to(raiz)}")
        return 1

    try:
        datos = json.loads(ruta.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"ERROR  JSON inválido en content/plantas.json: línea {e.lineno}, {e.msg}")
        return 1

    inf = Informe()
    plantas = datos.get("plantas") if isinstance(datos, dict) else None
    if not isinstance(plantas, list) or not plantas:
        print("ERROR  la raíz debe ser un objeto con la clave `plantas` (lista no vacía)")
        return 1

    img_dir = raiz / "assets" / "img"
    if not img_dir.is_dir():
        inf.aviso("assets/img/ no existe todavía: no se pueden comprobar las fotos")
        img_dir = Path("/dev/null/inexistente")

    ids: set[str] = set()
    for i, p in enumerate(plantas):
        validar_planta(p, i, inf, img_dir, ids)

    for a in inf.avisos:
        print(f"AVISO  {a}")
    for e in inf.errores:
        print(f"ERROR  {e}")

    print()
    print(f"{len(plantas)} planta(s) revisadas.")
    if inf.errores:
        print(f"✗ {len(inf.errores)} error(es) — no entregar así.")
        return 1
    print("✓ contenido válido: campos completos, huecos anotados, toxicidad con fuente.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
