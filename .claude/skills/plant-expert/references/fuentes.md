# Fuentes botánicas — quién manda sobre qué

La regla que evita el 90% de los errores de cita: **cada fuente es autoridad sobre una cosa
concreta**. Citar RHS para nomenclatura o POWO para riego es citar mal, aunque la URL funcione.

## Índice

1. POWO — nombres aceptados
2. GBIF — distribución y registros
3. RHS — cultivo
4. ASPCA — toxicidad en mascotas
5. Fuentes de plagas
6. Fuentes de cultivares e híbridos de vivero
7. Cómo construir la cita
8. Cuando dos fuentes se contradicen
9. Fuentes que no se usan

---

## 1. POWO — Plants of the World Online (Kew)

`https://powo.science.kew.org/`

**Autoridad sobre:** nombre aceptado, sinónimos, familia, género, distribución nativa,
estado taxonómico. Es el primer sitio al que ir con un nombre y el último que decide.

Cómo usarlo: busca el binomio. La ficha te dice si el nombre es *accepted* o *synonym*; si es
sinónimo, POWO apunta al aceptado. Ese aceptado es el que va en `nombre_cientifico`, con el
nombre de vivero en `nombre_comun`.

Ojo con los híbridos de jardinería y los grupos de cultivar: POWO cubre táxones silvestres y
muchos híbridos, pero **no** cataloga cultivares comerciales. Un `Coleus scutellarioides
'Wizard'` tendrá la especie en POWO y el cultivar no. Eso no es un fallo tuyo: es el límite de
la fuente, y se anota.

## 2. GBIF

`https://www.gbif.org/`

**Autoridad sobre:** registros de presencia, distribución observada, y su propia taxonomía de
respaldo (*backbone*). Útil para decir de dónde es originaria una planta con datos y no con
tópicos.

No lo uses para cultivo: GBIF no dice cómo se riega nada.

## 3. RHS — Royal Horticultural Society

`https://www.rhs.org.uk/plants/`

**Autoridad sobre:** cultivo. Luz, riego, sustrato, poda, abonado, época de trasplante,
rusticidad en su escala **H1a–H7**, y problemas frecuentes.

Traducción obligatoria de contexto: RHS escribe para clima británico. Para Móstoles hay que
ajustar dos cosas sistemáticamente:

- **Verano.** Madrid es mucho más seco y caluroso: la frecuencia de riego sube y la humedad
  ambiente baja bastante de lo que RHS supone.
- **Invierno.** Aquí el problema no es el frío de la casa, es la calefacción: aire muy seco
  cerca de radiadores. Muchas de las señales que RHS atribuye a corrientes frías, en un piso
  de Madrid vienen del aire seco.

La escala de rusticidad H1a/H1b/H1c significa "solo interior / interior o exterior en verano":
tradúcela a lenguaje de piso en vez de copiar el código.

## 4. ASPCA — toxicidad en mascotas

`https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants`

**Autoridad sobre:** toxicidad para gatos, perros y caballos, con el principio activo y los
síntomas descritos. Es la referencia estándar y es la que se cita en `toxicidad_mascotas`.

Cómo citarlo bien:

- Busca por nombre científico, no por nombre comercial.
- La lista está organizada como *tóxica* / *no tóxica*, y da especie por especie. Si la
  especie exacta no aparece pero sí el género, dilo así: "ASPCA lista el género X como
  tóxico; no hay entrada para esta especie concreta".
- **Si no aparece, la conclusión es "no figura en ASPCA", no "es inocua".** Ausencia de dato
  no es ausencia de riesgo, y este campo es información de seguridad.

Complemento útil cuando ASPCA no cubre algo: Pet Poison Helpline. Cítala como lo que es,
fuente secundaria.

## 5. Plagas y enfermedades

- **RHS**, sección de *pests and diseases*: buena para identificar y para umbral de acción.
- **Extensiones universitarias** (por ejemplo las de universidades estadounidenses con
  programas de horticultura): fichas técnicas con fotos de síntomas y ciclo de la plaga.
  Fiables y citables.
- Nunca foros ni blogs como fuente de un dato que va al JSON. Sirven para orientarte sobre
  qué buscar; la cita tiene que acabar en una fuente institucional.

## 6. Cultivares e híbridos de vivero

Cuando la planta es un producto comercial (`Begonia` grupo Elatior, series de coleo tipo
Wizard o Kong, `Ficus pumila 'Sunny'`), el nombre exacto del cultivar suele ser inverificable
desde una foto y no está en POWO. Estrategia:

1. Da el nombre aceptado de la **especie o del híbrido** en `nombre_cientifico`.
2. Pon el nombre comercial de la etiqueta en `nombre_comun`, que es la verdad de lo que Carlos
   compró.
3. Anota en `fuentes` que el cultivar no se ha podido determinar y qué haría falta para ello.

Esto es más honesto y más útil que un cultivar inventado que suene bien.

## 7. Cómo construir la cita

```json
{ "campo": "riego", "fuente": "RHS", "url": "https://www.rhs.org.uk/…", "consultado": "2026-08-11" }
```

- `campo`: el campo exacto del JSON que respalda. Una fuente por campo; si una URL respalda
  tres campos, tres entradas. Es repetitivo y hace que la ficha se pueda auditar campo a campo.
- `fuente`: el nombre corto de la institución (`POWO`, `RHS`, `GBIF`, `ASPCA`), o
  `"observación de foto"` para lo que hayas visto tú.
- `url`: la que **abriste**. No la reconstruyas de memoria: si devuelve 404, la ficha parece
  verificada sin estarlo, que es el peor resultado posible.
- `consultado`: fecha del lookup, formato `YYYY-MM-DD`. Las fichas de cultivo cambian.

## 8. Cuando dos fuentes se contradicen

Pasa a menudo con rangos de temperatura y frecuencias de riego. Orden de resolución:

1. Si es nomenclatura, gana POWO. No hay debate.
2. Si es cultivo, gana la fuente institucional más específica para esa planta.
3. Si siguen en desacuerdo, **cita las dos y di el rango**: "RHS da 15–24 °C; otra fuente
   institucional da 13–21 °C". Un rango honesto con dos citas es mejor contenido que un
   número falsamente preciso.
4. Si la contradicción viene de que hablan de táxones distintos, es que hay un problema de
   identificación: vuelve al paso 1 del flujo.

## 9. Fuentes que no se usan

Wikipedia (útil para orientarte, no para citar), blogs de jardinería, tiendas online, apps de
identificación por foto, y contenido generado por IA. El criterio no es esnobismo: es que la
cita tiene que aguantar que alguien la abra y compruebe que dice lo que dijiste.
