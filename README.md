# Croquis Vivo

Compara lo que se afirma de un plano de evacuación (personas, tiempo, alarma) contra lo que mide un modelo simulado de 24 corridas. Todo resultado es simulado y no es certificación.

- Sitio: https://croquisvivo.vercel.app
- Herramienta: /herramienta · Producto: /product · Por qué existe: /about · Condiciones: /condiciones
- Docs: docs/CHARTER.md, docs/PERSONAS.md, docs/PACKET.md, DECISIONS.md

## Correr local
npm install && npm run dev
Pruebas del motor: npx tsx src/lib/__prueba.ts

## Datos
Sin variables, guarda en el navegador. Con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY guarda en Supabase (migración en supabase/migrations, RLS por usuario anónimo). No hay datos personales reales; no hay secretos en el repo.
