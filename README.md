# Croquis Vivo

Compara lo que se afirma de un plano de evacuación (personas, tiempo, alarma) contra lo que mide un modelo simulado de 24 corridas. Todo resultado es simulado y no es certificación.

- Sitio: https://croquisvivo.xyz (respaldo: https://croquisvivo.vercel.app)
- Herramienta: /herramienta · Producto: /product · Por qué existe: /about · Condiciones: /condiciones
- Libreta del observador (semana 13) y conversaciones de precio (semana 14): /sesiones
- Precios y simulador de ingresos (semana 14): /pricing · Memo 10:1: /about#memo
- Docs: docs/CHARTER.md, docs/PERSONAS.md, docs/PACKET.md, DECISIONS.md

## Correr local
npm install && npm run dev
Pruebas del motor: npx tsx src/lib/__prueba.ts · Pruebas de la libreta: npx tsx src/lib/__prueba13.ts · Pruebas de precios: npx tsx src/lib/__prueba14.ts · Recorrido: python3 scripts/mec13.py <url> · python3 scripts/mec14.py <url>

## Datos
Sin variables, guarda en el navegador (casos, eventos y sesiones). Con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY guarda en Supabase (migración en supabase/migrations, RLS por usuario anónimo). No hay datos personales reales; no hay secretos en el repo.
