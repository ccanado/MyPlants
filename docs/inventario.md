# Inventario — las siete plantas, y el hueco que solo puedes rellenar tú

**Este fichero lo rellena Carlos.** Hasta el 12 de agosto de 2026 era una plantilla en blanco con
columnas para nombre, especie y sitio, y ya no sirve para eso: el inventario se recogió hablando,
las especies están verificadas con 15–19 fuentes cada una y todo eso vive en
`content/plantas.json`, que es la única fuente de verdad del contenido.

Así que este fichero pasa a ser **lo que de verdad falta**, que es lo único de este proyecto que no
puede hacer un agente: **la voz de la casa.**

## Por qué importa, y por qué no se ve el hueco

Cada ficha tiene un panel de cuaderno —papel claro, itálica, tinta azul, el nombre de quien
habla— para lo que **no tiene fuente y no la necesita**: de dónde vino la planta, qué se ha
aprendido fallando, qué le pasó el invierno pasado. Es la capa que distingue esto de un catálogo
botánico.

Ese panel **solo se renderiza si hay contenido**, decisión deliberada para no decorar una ausencia
diez veces. La consecuencia es que hoy no se ve un hueco: **se ve una web sin voz**, que es peor,
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

## Las diez

| Planta | Especie | Dónde | Desde | Cómo va | Nota de la casa |
| --- | --- | --- | --- | --- | --- |
| **Helecho** | sin identificar | salón | 29 may 2026 | crítica | |
| **Begonia Elatior** | *Begonia × hiemalis* | salón | 29 may 2026 | atención | |
| **Coleo grande** | *Coleus scutellarioides* | salón | 10 ago 2026 | atención | |
| **Coleo pequeño** | *Coleus scutellarioides* | salón | 10 ago 2026 | sana | |
| **Ficus Sunny** | *Ficus pumila* | salón | 10 ago 2026 | sana | |
| **Margarita** | *Chrysanthemum × morifolium* | salón | 10 ago 2026 | sana | |
| **Poto** | *Epipremnum aureum* | salón | hace más de 20 años | sana | |
| **Poto 2** | *Epipremnum aureum* | **cocina** | hace más de 20 años | sana | |
| **Helecho 2** | *Nephrolepis exaltata* | salón, lejos de la ventana | 13 ago 2026 | sana | |
| **Croton** | *Codiaeum variegatum* | salón, lejos de la ventana | 13 ago 2026 | sana | |

Las cinco primeras columnas salen de `content/plantas.json` y están para que sepas de cuál hablas;
la última es la tuya. Si vuelve a cambiar el inventario, la verdad sigue estando en el JSON y esta
tabla se regenera de ahí.

Las tres últimas entraron el 13 de agosto de 2026 y son las que menos historia tienen escrita — pero
el poto de la cocina lleva veinte años ahí, así que probablemente sea de la que más se puede
contar.

## Preguntas sueltas que quedaron abiertas

- **¿Hay radiador cerca de alguna?** `botanist` lo preguntó y no llegó respuesta. Mientras no la
  haya, el diagrama térmico rotula la banda 21–24 °C como **del salón** y no de cada planta, que es
  lo honesto: hoy es una constante de la casa replicada siete veces. El día que se sepa, deja de
  serlo para las afectadas sin cambiar el esquema.
- **¿Fotos nuevas?** El esquema ya es histórico: añadir un estado nuevo con su foto y su fecha no
  rompe nada, y la ficha seguirá diciendo de qué día habla cada diagnóstico. El 13 de agosto de 2026
  se usó por primera vez con tres plantas nuevas y funcionó sin tocar el esquema.

### Las tres que dejó abiertas la tanda del 13 de agosto

Ninguna impide que la web funcione; las tres cierran un `null` que hoy está anotado como hueco.

- **¿En qué maceta está el poto de la cocina?** El follaje la tapa entera en la foto, así que su
  ficha no puede dar mililitros por riego ni decir si el tiesto drena. Se resuelve con una foto que
  incluya la maceta, o diciendo el diámetro.
- **¿A qué orientación da la ventana de la cocina, y qué temperatura hace ahí?** El «noreste» y los
  21-24 °C de las otras fichas son del salón y no se heredan. Mientras no se sepa, esa ficha va con
  la orientación y los tres campos de temperatura de casa en null — que es lo honesto, no un
  descuido.
- **¿A cuántos metros del ventanal van a quedar el helecho nuevo y el croton?** «En la parte alejada»
  basta para el consejo, pero el diagrama de luz necesita un número. Importa más en el croton, que es
  al que la luz se le queda corta.
