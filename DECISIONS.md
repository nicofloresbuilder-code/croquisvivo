# Decisiones

1. Docs antes del código (commit 9cfe75a): charter, personas, packet.
2. Motor portado a repo nuevo con 36 pruebas; conjunto de 24 corridas con banda p10–p90 y ±3 dB acústicos.
3. Nombre: se queda Croquis Vivo (decidido con evidencia del torneo de la semana 12).
4. Sitio con identidad "Salida" (verde salida sobre casi negro), distinta de los proyectos anteriores.
5. Datos: Supabase con RLS pensado; mientras no esté conectado, la herramienta guarda en el navegador y lo dice en pantalla.
6. Deploy 1 (Vercel, commit adc224b): sitio y herramienta en https://croquisvivo.vercel.app, verificado en vivo.
7. Bug de mi prueba mecánica: la regla de "verificado" marcaba dos frases que lo niegan (cláusula sombra). Se corrigió la prueba, no el producto. Resultado: 44 de 44.
8. Pendiente real: proyecto Supabase (límite del plan gratis), dominio propio comprado por el usuario, persona real y costo real para las compuertas del veredicto.

## Semana 13 (usuarios reales)

9. **Packet antes del código** (commit fcee119): `docs/PACKET.md` con problema, usuario, éxito, mockup, dos diagramas, benchmark, alcance y plan de pruebas. El de la semana 12 quedó en `docs/PACKET_W12.md`.
10. **Base de datos nueva** (proyecto Supabase `croquisvivo`, no se tocó `aforo`): tablas `casos`, `eventos` y `sesiones`, todas con RLS por usuario anónimo. `sesiones` **no tiene política de borrado a propósito**: las sesiones que salen mal también se conservan (condición 6 del Blueprint). Avisos de seguridad de Supabase: ninguno.
11. **Analítica propia, sin terceros:** registro de eventos anónimo (tipo, ruta, números), sin nombres de casos ni textos de otras personas. Máximo 500 eventos en el navegador.
12. **Botón "Se me atoró aquí":** guarda la cita exacta, la ruta y la hora. Rechaza correos, teléfonos y enlaces para no guardar datos personales.
13. **Libreta del observador (/sesiones):** rol (nunca nombre), si la persona era desconocida, tiempo, errores, citas, qué paga hoy, quién firma el gasto, tiempo con su hoja de hoy y si volvería con prueba. El "10:1" aparece como "por medir" hasta tener al menos 3 sesiones con ambos tiempos; si la herramienta es más lenta que la hoja, lo dice.
14. **Variables en Vercel:** solo las dos públicas (`NEXT_PUBLIC_SUPABASE_URL` y la llave anónima). No hay secretos en el repo.
15. **Error real encontrado y corregido** (commit 98122d8): si la nube fallaba al guardar una sesión, esa sesión quedaba solo en el navegador pero la página decía "guardado en la nube", y nunca se reintentaba subirla. Se corrigió con `fusionar()`: reintenta subir lo pendiente y avisa cuántas sesiones están solo en el navegador. Se encontró revisando los modos de falla de la nube (no lo detectó una prueba que fallara) y quedó con 4 pruebas nuevas.
16. **Prueba mecánica:** 37 comprobaciones del recorrido de la libreta (todas bien tras corregir 3 fallos de mi propia prueba, que comparaba texto sin considerar las mayúsculas del CSS), 48 pruebas de la lógica de la libreta, 36 del motor y 44 del recorrido de la semana 12.
17. **Personas sintéticas, ronda 3:** se aclaró que /sesiones es para el observador y se renombró "Errores" a "Errores de captura". Los hallazgos abiertos del modelo ahora se ven abiertos.
18. **Pendientes que son míos:** dominio propio como URL de registro, 5 sesiones con personas reales (mínimo 3 desconocidas), el arreglo del peor problema salido de sus palabras, la prueba de que alguien vuelve, y el video.

## Semana 14 (precios)

19. **Packet antes del código** (commit 4120423): `docs/PACKET.md` de precios (mockup HTML hecho antes del código, no generado por IA; dos diagramas Mermaid; benchmark NaviGate Prepared; condiciones del Blueprint). El de la semana 13 quedó en `docs/PACKET_W13.md`.
20. **Precios de prueba, inventados:** $3,000 MXN por inmueble al año (segmento A: escuelas privadas y edificios pequeños) y $9,000 (segmento B: hospitales, empresas, varios inmuebles). Todo precio en pantalla dice "hipótesis no validada" y "nadie ha pagado". No hay cobro real. Las funciones de pago dicen "por construir".
21. **La línea entre gratis y de pago:** los hallazgos de seguridad y el rango de la simulación nunca se cobran; se cobra por guardar historial y exportar. No hay insignia de aprobado ni orden escondido (cláusula sombra, condición 4 del Blueprint).
22. **El 10:1 solo sale con datos que la persona escribe** y dice "con tus datos, no una medida". Sin costo actual dice "por medir" y muestra el umbral ($30,000 o $90,000 al año). Sin costo de entrega, el margen también dice "por medir" (no cero).
23. **Registro de conversaciones de precio** (condiciones 1 y 2): cinco resultados separados; solo compromiso firmado y pago cuentan como demanda; el interés dicho se guarda pero no se suma. Sin borrado a propósito. Rechaza correos, teléfonos y enlaces.
24. **Base de datos:** migración 003 con `escenarios` (se pueden borrar: portabilidad y borrado, condición 5) y `conversaciones_precio` (sin borrado), ambas con RLS por usuario. Los avisos del asesor de Supabase son del tipo "políticas que permiten usuarios anónimos": es a propósito, porque el producto usa inicio de sesión anónimo y cada política filtra por `auth.uid()`; el aviso de contraseñas filtradas no aplica (no hay contraseñas). Las pruebas directas de RLS con SQL siguen sin confirmarse.
25. **Error real encontrado al probar entradas y corregido** (commit bf59efd): "2,5" (2.5 % en español) se leía como 25 % porque se quitaban todas las comas; el simulador mostraba 10 veces más pagantes sin avisar. Ahora la coma solo vale como separador de miles ("3,000"); "2,5" da error con instrucción de usar punto. Se encontró probando entradas a mano, no por una prueba que fallara; después se agregaron 9 pruebas.
26. **Prueba mecánica:** 62 pruebas de la lógica de precios y conversaciones, 48 de la libreta, 36 del motor y recorrido de 53 comprobaciones de /pricing, /about y /sesiones (más el de la semana 13). Dos "fallos" intermedios fueron de mi prueba (mayúsculas del CSS).
27. **Persona sintética (capa 1, simulada por mí):** se probó /pricing y el simulador con una persona inventada que decide el gasto. Se arregló lo peor: la calculadora parecía una cotización para su inmueble, y "10:1" y "equilibrio" no se explicaban. No son usuarios reales.
28. **Pendientes que son míos:** una conversación real de precio, el costo real que paga hoy un inmueble, la ratificación del precio con el equipo y el video.
