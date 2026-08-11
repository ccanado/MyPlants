# Inventario — las siete plantas, y el hueco que solo puedes rellenar tú

**Este fichero lo rellena Carlos.** Hasta el 12 de agosto de 2026 era una plantilla en blanco con
columnas para nombre, especie y sitio, y ya no sirve para eso: el inventario se recogió hablando,
las siete especies están verificadas con 15–19 fuentes cada una y todo eso vive en
`content/plantas.json`, que es la única fuente de verdad del contenido.

Así que este fichero pasa a ser **lo que de verdad falta**, que es lo único de este proyecto que no
puede hacer un agente: **la voz de la casa.**

## Por qué importa, y por qué no se ve el hueco

Cada ficha tiene un panel de cuaderno —papel claro, itálica, tinta azul, el nombre de quien
habla— para lo que **no tiene fuente y no la necesita**: de dónde vino la planta, qué se ha
aprendido fallando, qué le pasó el invierno pasado. Es la capa que distingue esto de un catálogo
botánico.

Ese panel **solo se renderiza si hay contenido**, decisión deliberada para no decorar una ausencia
siete veces. La consecuencia es que hoy no se ve un hueco: **se ve una web sin voz**, que es peor,
porque no delata lo que falta.

Y no las escribe un agente. Una frase inventada en ese panel envenenaría justo la capa que existe
para ser la única no verificada — el lector ya no sabría qué parte de la web es de una fuente y
cuál es de la casa.

## Cómo rellenarlo

Una o dos frases por planta, en tu voz, sin formato. No hace falta que sean bonitas ni completas:
*«esta la rescató Noah de una que se secó entera»* vale más que un párrafo. Si de alguna no tienes
nada que decir, se deja vacía — un hueco de verdad es información y un relleno no.

Cuando estén, van a `content/plantas.json` en el campo `notas` de cada planta, con esta forma:

```json
"notas": [
  { "autor": "Noah", "texto": "…" }
]
```

El `autor` es lo que se pinta como rótulo del panel: quien riega es Noah, así que el panel dirá
`NOAH` y no un nombre fijo. Puede haber más de una nota y más de una voz.

## Las siete

| Planta | Especie | Desde | Cómo va | Nota de la casa |
| --- | --- | --- | --- | --- |
| **Helecho** | sin identificar | 29 may 2026 | crítica | |
| **Begonia Elatior** | *Begonia × hiemalis* | 29 may 2026 | atención | |
| **Coleo grande** | *Coleus scutellarioides* | 10 ago 2026 | atención | |
| **Coleo pequeño** | *Coleus scutellarioides* | 10 ago 2026 | sana | |
| **Ficus Sunny** | *Ficus pumila* | 10 ago 2026 | sana | |
| **Margarita** | *Chrysanthemum × morifolium* | 10 ago 2026 | sana | |
| **Poto** | *Epipremnum aureum* | hace más de 20 años | sana | |

Las cuatro primeras columnas salen de `content/plantas.json` y están para que sepas de cuál hablas;
la quinta es la tuya. Si alguna vez cambia el inventario —una planta nueva, una que se va—, la
verdad sigue estando en el JSON y esta tabla se regenera de ahí.

## Preguntas sueltas que quedaron abiertas

- **¿Hay radiador cerca de alguna?** `botanist` lo preguntó y no llegó respuesta. Mientras no la
  haya, el diagrama térmico rotula la banda 21–24 °C como **del salón** y no de cada planta, que es
  lo honesto: hoy es una constante de la casa replicada siete veces. El día que se sepa, deja de
  serlo para las afectadas sin cambiar el esquema.
- **¿Fotos nuevas?** El esquema ya es histórico: añadir un estado nuevo con su foto y su fecha no
  rompe nada, y la ficha seguirá diciendo de qué día habla cada diagnóstico.
