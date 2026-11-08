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
