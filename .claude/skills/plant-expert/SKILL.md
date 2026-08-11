---
name: plant-expert
description: Cómo identificar especies de plantas de interior, verificar datos botánicos contra fuentes citables (POWO/Kew para nomenclatura, RHS para cultivo, GBIF para distribución, ASPCA para toxicidad en mascotas), diagnosticar problemas de salud a partir de fotos, y escribir fichas de cuidado adaptadas a una casa concreta. Úsala siempre que haya que identificar una planta, rellenar o revisar content/plantas.json, dar consejo de riego, luz, sustrato, abonado o plagas, decidir si algo es tóxico para gatos o perros, interpretar una etiqueta de vivero, o valorar por qué una planta está fea, amarilla, seca o con manchas. También cuando dudes si un dato botánico se puede afirmar o hay que marcarlo como no verificado.
---

# Plant expert

## Por qué la fiabilidad es el producto

Una ficha de cuidado no es contenido decorativo: alguien la va a leer con la regadera en la
mano, o con un gato que acaba de mordisquear una hoja. Un dato de riego inventado mata una
planta despacio; un dato de toxicidad inventado es peor. La web solo vale si Carlos puede
confiar en ella más que en el primer resultado de Google, y eso solo pasa si cada afirmación
sale de una fuente que se puede abrir y comprobar.

De ahí la regla que gobierna todo lo demás: **si no lo puedes verificar, va como `null` con
una nota que explique por qué.** Un hueco honesto es información útil. Un dato plausible
inventado envenena la ficha entera, porque el lector ya no sabe qué partes creer.

## Nunca inventes estas cosas

- **Datos personales.** `historia`, `notas_carlos`, dónde está la planta, de dónde vino,
  qué tal le va. Eso se pregunta. Si Carlos no lo ha dicho, es `null` — no "un regalo de
  alguien especial" ni ninguna otra prosa de relleno.
- **La lista de plantas.** Solo existen las plantas que Carlos tiene. Nunca añadas una
  especie porque la rejilla quede simétrica o porque "una web de plantas debería tener una
  monstera".
- **El nombre científico cuando la foto no da para tanto.** Muchos géneros no se identifican
  a nivel de especie ni de cultivar desde una foto de móvil. Llega hasta donde llegue la
  evidencia y dilo: género seguro y especie sin confirmar es un resultado legítimo.
- **La toxicidad.** O tiene fuente, o es `null`. Nunca "probablemente no pasa nada".

## Flujo de identificación

Trabaja de la evidencia más fuerte a la más débil, y anota **de dónde** salió cada paso:

1. **Etiqueta de vivero, si hay foto de ella.** Es la mejor evidencia disponible, pero es
   evidencia comercial, no taxonómica: los viveros usan nombres de venta. "COLEO",
   "FICUS SUNNY" o "MARGARITA" te dan el punto de partida, no el binomio.
2. **Pasaporte fitosanitario** (esas etiquetas con `PLANT PASSPORT` y un código tipo
   `ES-xxxxx`): confirma origen y a menudo el grupo de cultivar. Útil para fechar la compra.
3. **Rasgos de la foto.** Forma y margen de la hoja, filotaxis, pubescencia, tipo de tallo,
   inflorescencia, hábito. Escribe qué rasgos usaste; obliga a mirar de verdad y deja el
   razonamiento auditable.
4. **Del nombre comercial al nombre aceptado**, en POWO. Aquí es donde se resuelven los
   sinónimos y las recolocaciones de género, que en plantas de interior son constantes.
5. **Familia** desde POWO, no de memoria.

Cuando la etiqueta y los rasgos no coincidan, gana la observación y se anota la discrepancia.
Los viveros etiquetan mal con frecuencia.

Detalle de cada base de datos, qué autoridad tiene sobre qué, y cómo buscar en ellas:
`references/fuentes.md`. Errores de identificación típicos en plantas de interior y
recolocaciones de género recientes: `references/trampas.md`.

## Verificación: buscar de verdad, no citar de memoria

Puedes saber muchas cosas de plantas, y aun así no puedes citarlas. La cita existe para que
otra persona compruebe, así que **haz el lookup** (WebSearch/WebFetch) y guarda la URL que
abriste. Una URL escrita de memoria que devuelve 404 es peor que ninguna cita: parece
verificada y no lo está.

Reparto de autoridad, porque cada fuente es buena en una cosa:

| Dato | Fuente | Por qué esa |
| --- | --- | --- |
| Nombre aceptado, sinónimos, familia | **POWO** (Kew) | Es la autoridad nomenclatural de referencia |
| Distribución nativa, registros | **GBIF**, POWO | Datos primarios agregados |
| Riego, luz, sustrato, poda, rusticidad | **RHS** | Guía de cultivo revisada, con escala de rusticidad H1a–H7 |
| Toxicidad para gatos y perros | **ASPCA** (lista de plantas tóxicas/no tóxicas) | Es la referencia estándar en toxicología veterinaria de plantas |
| Plagas y enfermedades | RHS, extensiones universitarias | Diagnóstico con foto y umbral de acción |

`CLAUDE.md` menciona POWO/RHS/GBIF; ASPCA se añade porque ninguna de las tres cubre
toxicidad en mascotas. Si no aparece en ASPCA, dilo así — "no figura en la lista de ASPCA" —
en lugar de deducir que es inocua: ausencia de dato no es ausencia de riesgo.

Una precaución sobre rusticidad y calendario: las guías británicas (RHS) asumen clima
británico. Para Madrid, el verano es mucho más seco y caluroso y el invierno tiene
calefacción agresiva. Traduce el consejo en vez de copiarlo, y di que lo has traducido.

## Diagnóstico desde foto

Diagnosticar por foto tiene límites reales y conviene decirlos. Estructura el diagnóstico así,
porque separa lo que se ve de lo que se deduce:

1. **Señales observables.** Solo lo que está en la imagen: "bordes de las hojas secos y
   marrones", "tallos alargados con entrenudos largos y hojas pequeñas", "hojas inferiores
   amarillas". Sin interpretar todavía.
2. **Causas compatibles, ordenadas por probabilidad**, dado el contexto de la casa. La misma
   hoja amarilla significa exceso de riego, falta de luz o falta de nitrógeno según el resto
   del cuadro y según dónde vive la planta.
3. **Qué hacer, en orden y con plazos.** Accionable esta semana: "quita las flores pasadas",
   "riega por abajo cuando los 2 cm superiores estén secos", "ponla a 50 cm del ventanal".
   Un consejo sin plazo ni cantidad no se puede seguir.
4. **Qué mirar para saber si funcionó, y cuándo.** "En 3 semanas los brotes nuevos deberían
   salir con entrenudos más cortos." Esto convierte la ficha en algo comprobable.
5. **Qué no se puede saber desde la foto.** Raíces, olor del sustrato, plagas del envés,
   humedad real del cepellón. Dilo y di qué foto o comprobación lo resolvería.

Distingue tres severidades y sé sobrio: `sana`, `atencion`, `critica`. Dramatizar una planta
que solo tiene dos hojas feas hace que el aviso de la que sí está grave no destaque.

Y no confundas el estado de la foto con el estado de hoy. La foto tiene fecha; el diagnóstico
describe ese momento. Dilo explícitamente en la ficha.

## Adaptar el consejo a esta casa

Una ficha genérica de riego no vale para nada: "riega cuando esté seco" ya lo sabe todo el
mundo. El valor está en cruzar la especie con las condiciones reales, que para este proyecto
son: **Móstoles (Madrid)**, clima continental seco, ventanal grande orientado a **noreste**
(luz suave de mañana, sin sol directo duro), calefacción en invierno, y **sin mascotas**.

Consecuencias concretas que deben aparecer en las fichas cuando apliquen:

- NE da luz buena pero moderada: las especies que piden pleno sol (crisantemo, coleo para
  mantener color) van a estirarse o perder intensidad de color. Dilo en vez de recomendar
  "mucha luz indirecta" y quedarte tan ancho.
- El aire seco de la calefacción explica bordes crujientes en begonia y helecho mucho mejor
  que el riego. Diferenciar ambas causas es justo lo que hace útil la ficha.
- Sin mascotas, la toxicidad se documenta igual pero como dato informativo, no como alarma.
  Sigue citándola: la casa puede cambiar, y las visitas traen perros.

## Estructura de `content/plantas.json`

Fichero que posee `botanist`. Un objeto raíz con `plantas`. Cada campo de datos duros va como
objeto con `resumen` (lo que se lee de un vistazo con la regadera en la mano) y `detalle` (la
explicación). Esa separación es la que permite a `builder` hacer una ficha consultable en dos
segundos y ampliable si te interesa.

```json
{
  "plantas": [
    {
      "id": "begonia-elatior",
      "nombre_comun": "Begonia Elatior",
      "nombre_cientifico": "Begonia × hiemalis",
      "familia": "Begoniaceae",
      "foto": "begonia.jpg",
      "alt": "Begonia Elatior en maceta blanca, con una flor roja y varias hojas de borde seco",
      "historia": null,
      "riego":       { "resumen": "…", "detalle": "…" },
      "luz":         { "resumen": "…", "detalle": "…" },
      "humedad":     { "resumen": "…", "detalle": "…" },
      "temperatura": { "min_c": 15, "max_c": 24, "detalle": "…" },
      "sustrato":    { "resumen": "…", "detalle": "…" },
      "abonado":     { "resumen": "…", "detalle": "…" },
      "trasplante":  { "resumen": "…", "detalle": "…" },
      "plagas_comunes": [
        { "plaga": "Oídio", "senal": "polvo blanco en el haz", "respuesta": "…" }
      ],
      "toxicidad_mascotas": { "gatos": "tóxica", "perros": "tóxica", "detalle": "…" },
      "dificultad": "media",
      "notas": [ { "autor": "Noah", "texto": "…" } ],
      "estados": [
        {
          "fecha_foto": "2026-08-11",
          "foto": "begonia-elatior.jpg",
          "severidad": "atencion",
          "senales": ["…"],
          "causas_probables": ["…"],
          "tratamiento": ["…"],
          "revisar_en": "3 semanas: …",
          "no_visible_en_foto": ["…"]
        }
      ],
      "fuentes": [
        { "campo": "nombre_cientifico", "fuente": "POWO", "url": "https://…", "consultado": "2026-08-11" },
        { "campo": "historia", "fuente": null, "url": null, "consultado": "2026-08-11",
          "nota": "Carlos no ha contado de dónde vino; pendiente de preguntar" }
      ]
    }
  ]
}
```

`dificultad` es una de `"fácil"`, `"media"`, `"exigente"`. `estados`, `notas` y `alt` extienden
la lista de campos de `CLAUDE.md`: `estados` porque la ficha tiene que decir cómo está la planta
y cómo tratarla, y `alt` porque el texto alternativo es contenido y no maquetación.

### `estados` es una lista, y eso no es un detalle

Un diagnóstico describe **el día de la foto**, no el presente. Con un solo objeto, un
diagnóstico nuevo sustituye al anterior y se pierde justo lo que hace verificable el trabajo:
el estado siguiente **confirma o refuta** las causas que el anterior daba por probables. Si
dijiste que los bordes secos eran quemadura de sol y tres semanas después, apartada del cristal,
las hojas nuevas salen enteras, la causa deja de ser hipótesis. Eso es lo que promete
`revisar_en` y sin histórico no tiene dónde aterrizar.

Dos consecuencias prácticas:

- **Cada entrada lleva `fecha_foto` y `foto`.** El diagnóstico se hizo sobre una imagen
  concreta y esa trazabilidad es la mitad de su valor.
- **Quien consume la lista ordena por `fecha_foto`; nunca coge `estados[0]` a ciegas.** Fiarse
  del índice significa que el día que alguien inserte un estado antiguo al final, la ficha
  muestre un diagnóstico caducado sin que nada falle.

`notas` también es lista, y por un motivo parecido: en una casa hay varias voces —quien la
compró, quien la cuida, quien la regaló— y cada nota dice de quién es. Un campo único obliga
a elegir un dueño de la voz personal, y eso es una decisión de contenido disfrazada de esquema.

### La regla del hueco anotado

Cada campo en `null` necesita su entrada en `fuentes` con `url: null` y una `nota` que diga
por qué falta y qué lo resolvería. Así el hueco es una tarea, no un olvido:

```json
{ "campo": "nombre_cientifico", "fuente": null, "url": null, "consultado": "2026-08-11",
  "nota": "Podada a ras; sin fronde desarrollada no se puede llegar a especie. Rehacer con foto del brote nuevo." }
```

Las observaciones propias sobre la foto también se citan, con `fuente: "observación de foto"`
y `url: null`. Es una fuente débil pero honesta, y deja claro qué es medición y qué es mirada.

Valida antes de entregar:

```bash
python3 .claude/skills/plant-expert/scripts/validar-plantas.py
```

Comprueba campos obligatorios, forma de cada uno, que los `null` estén anotados, que
`toxicidad_mascotas` tenga URL real cuando no es `null`, que los `id` no se repitan, que las
fotos referenciadas existan en `assets/img/`, y que las URLs tengan pinta de serlo.

## Cómo escribir el texto

Español de España, segunda persona, concreto. La diferencia entre una ficha útil y una de
relleno está casi siempre en los números y en los plazos:

- Mal: "Riega de forma moderada, sin encharcar." → No dice nada que el lector no supiera.
- Bien: "Riega cuando los 2 cm de arriba estén secos, unos 200 ml por la maceta de 12 cm.
  En verano en Madrid puede ser cada 3 días; con la calefacción puesta, cada 5."

Evita el registro de blog de jardinería ("¡A tu planta le encantará!"). Carlos quiere el dato,
no ánimo. Y cuando el dato tenga incertidumbre, la incertidumbre es parte del dato: "según
RHS entre 15 y 24 °C; no he encontrado cifra específica para el grupo Elatior".

## Ficheros de referencia

- `references/fuentes.md` — qué autoridad tiene cada base de datos, cómo buscar en ella, cómo
  construir la cita, y qué hacer cuando dos fuentes se contradicen.
- `references/trampas.md` — errores de identificación frecuentes en plantas de interior,
  nombres de vivero engañosos, recolocaciones de género, y el catálogo de señales visuales
  para diagnóstico (qué significa cada tipo de amarilleo, manchas, bordes secos).
