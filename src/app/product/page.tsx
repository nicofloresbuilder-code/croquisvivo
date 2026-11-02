import Link from "next/link";

export const metadata = { title: "Producto · Croquis Vivo" };

export default function Producto() {
  return (
    <div className="marco" style={{ paddingTop: 40, paddingBottom: 20 }}>
      <p className="etiqueta">Producto</p>
      <h1>Una afirmación, una medida y una brecha</h1>
      <p style={{ maxWidth: "65ch" }}>El producto hace una sola cosa: compara lo que dice el registro de un simulacro contra lo que mide una simulación del mismo croquis, y muestra cuánto se separan, con su margen de error.</p>

      <section className="bloque">
        <h2>Cómo funciona</h2>
        <ol className="pasos">
          <li><strong>Entrada.</strong> Eliges un croquis de ejemplo y escribes lo que declaró el registro: personas presentes, personas que salieron, tiempo total y si la alarma se oyó en todas las áreas.</li>
          <li><strong>Lógica.</strong> El modelo corre el croquis 24 veces con distinta aleatoriedad. Del rango que sale se obtiene el <em>error normal</em>. La acústica usa el criterio de que la alarma supere el ruido de fondo por 15 dB, con una incertidumbre declarada de ±3 dB.</li>
          <li><strong>Salida.</strong> Para cada afirmación: brecha, dentro del margen, indeterminada o sin dato. Nunca &ldquo;seguro&rdquo; ni &ldquo;verificado&rdquo;.</li>
          <li><strong>Guardado.</strong> El caso queda guardado con sus acciones. Cada brecha tiene una persona con nombre y una fecha. Una acción solo se confirma si capturas un simulacro real posterior.</li>
        </ol>
      </section>

      <section className="bloque">
        <h2>Frente a la hoja de asistencia</h2>
        <p>La alternativa actual es la hoja de asistencia con un cronómetro. Esta tabla compara la tarea completa y dice también lo que la hoja hace mejor.</p>
        <div className="panel tabla-scroll">
          <table>
            <thead><tr><th>Pregunta</th><th>Hoja de asistencia</th><th>Croquis Vivo</th></tr></thead>
            <tbody>
              <tr><td>¿Cuántos salieron?</td><td>Sí, conteo real en el patio</td><td>Rango simulado para comparar con el conteo</td></tr>
              <tr><td>¿Quién no oyó la alarma?</td><td>No lo registra</td><td>Personas bajo el margen de 15 dB (simulado)</td></tr>
              <tr><td>¿Qué estorbo alarga la ruta?</td><td>No lo registra</td><td>Metros extra por estorbo (simulado)</td></tr>
              <tr><td>¿Quién corrige y para cuándo?</td><td>No lo registra</td><td>Acción con responsable y fecha</td></tr>
              <tr><td>¿Pasó en la realidad?</td><td><strong>Sí: es la realidad</strong></td><td><strong>No: solo es una simulación</strong></td></tr>
              <tr><td>Tiempo y costo de hacerlo</td><td>Por medir</td><td>Por medir</td></tr>
            </tbody>
          </table>
        </div>
        <p className="chico">No afirmamos que Croquis Vivo sea &ldquo;10 veces mejor&rdquo;. Nadie ha medido esa cifra. Cómo se mediría está en <Link href="/about">Por qué existe</Link>.</p>
      </section>

      <section className="bloque">
        <h2>Lo que no es</h2>
        <div className="rejilla">
          <div className="panel alarma"><h3>No es certificación</h3><p>No sustituye la validación de Protección Civil ni dice que un edificio es seguro.</p></div>
          <div className="panel alarma"><h3>No es alertamiento</h3><p>No avisa a nadie ni dice qué hacer durante un sismo.</p></div>
          <div className="panel alarma"><h3>No mide personas</h3><p>No califica ni guarda nombres reales de quienes evacúan.</p></div>
        </div>
        <div className="acciones"><Link href="/herramienta" className="btn">Probarlo con un croquis de ejemplo</Link></div>
      </section>
    </div>
  );
}
