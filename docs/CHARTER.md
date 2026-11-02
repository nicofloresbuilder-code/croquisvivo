# CHARTER: Croquis Vivo

*Versión 0.1 · semana 12 · escrito ANTES de reconstruir. Este documento es el árbitro de cada discusión de alcance de las próximas semanas, incluidas las mías.*

## VISION (a 3 años)

Croquis Vivo es la forma en que una escuela o un hospital de México comprueba si lo que dice su registro de simulacro es compatible con lo que realmente pasaría en su edificio. El coordinador sube el croquis, escribe lo que declaró su último simulacro ("todos salieron en 3 minutos, la alarma se oyó en todas las áreas"), y el producto lo compara con una simulación repetida muchas veces. Marca solo las brechas mayores que el error normal, asigna cada una a una persona con fecha, y se vuelve a correr después de la corrección. En tres años, cada simulacro real alimenta la calibración del modelo, y un inmueble puede enseñar a su aseguradora o a la autoridad no una lista de firmas, sino un historial de brechas encontradas, asignadas y confirmadas en simulacros reales. Nunca será una certificación: es una ayuda para investigar, y la autoridad de Protección Civil sigue decidiendo.

## USERS

- **Usuario 1: el coordinador o coordinadora de Protección Civil de un inmueble** (hospital privado mediano o primaria pública en CDMX). Es la persona con nombre que firma el registro del simulacro y responde si algo sale mal. No es técnico, usa WhatsApp y Excel.
- **Usuario 2: quien dirige el inmueble** (director o administrador). Recibe el informe, decide qué corrección se aprueba y quién la hace.
- **Quien NO es usuario:** el personal y los alumnos evacuados (no capturan nada, no se les mide ni califica); la autoridad (no se integra en esta etapa).

## PRINCIPLES (lo que el producto nunca rompe)

1. **Cada número dice de dónde viene.** Todo dato está marcado como *observado* (lo capturó una persona), *simulado* (lo calculó el modelo), *faltante* (nadie lo midió) o *no verificado* (alguien lo declaró y no hay respaldo).
2. **Nada simulado se presenta como éxito real.** Una corrección solo pasa a "confirmada" cuando un simulacro real posterior la respalda.
3. **Una brecha solo se marca si supera el error normal.** Si no, el producto dice "dentro del margen", no "todo bien".
4. **Cada corrección tiene una persona con nombre y una fecha.** Si no hay responsable, el informe lo muestra como pendiente, no como resuelto.
5. **La decisión es humana.** El producto compara y sugiere; nunca aprueba, certifica ni ordena.

## NON-GOALS (lo que nunca hará)

- No certifica un inmueble ni sustituye la validación de Protección Civil.
- No dice qué hacer durante un sismo ni avisa o alerta a nadie (no es una app de alertamiento).
- No califica ni mide a las personas evacuadas, ni guarda sus nombres reales.
- No inventa ahorros ni porcentajes de mejora: no afirma un "10×" que nadie midió.
- No simula multitudes en espacios abiertos, incendios, humo ni estructuras.
- No vende un "puntaje de seguridad" ni un ranking de escuelas.

## NORTH STAR

**Número de brechas entre lo declarado y lo simulado que un coordinador convirtió en una acción con responsable y que quedó confirmada en un simulacro real posterior.** (Arranca en 0; cuenta solo las confirmadas por una persona, nunca por el modelo.)

## CORE CONCEPTS (el vocabulario del producto)

- **Croquis:** el plano del inmueble sobre una retícula de 1 m (muros, puertas, salidas, altavoces, estorbos, personas).
- **Afirmación:** lo que dice el registro del simulacro real (por ejemplo, "evacuaron 32 de 32 en 3:00"). Siempre se marca *no verificada* hasta que haya respaldo.
- **Medida:** lo que sale del modelo al correr el croquis. Siempre se marca *simulada*, con su rango.
- **Margen (error normal):** el rango en que el modelo cambia solo por azar (24 corridas con distinta aleatoriedad) más la incertidumbre acústica declarada.
- **Brecha:** la distancia entre una afirmación y la medida cuando cae fuera del margen.
- **Acción:** la corrección propuesta para cerrar una brecha, con responsable y fecha. Tiene estados: propuesta, asignada, aplicada al modelo, confirmada en simulacro real.
- **Caso:** un croquis más sus afirmaciones, medidas, brechas y acciones, guardado con su historial.

Si una función no usa estos sustantivos, no pertenece al producto.
