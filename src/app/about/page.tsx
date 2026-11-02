import Link from "next/link";

export const metadata = { title: "Por qué existe · Croquis Vivo" };

export default function Acerca() {
  return (
    <div className="marco" style={{ paddingTop: 40, paddingBottom: 20 }}>
      <p className="etiqueta">Por qué existe</p>
      <h1>La necesidad, quién paga y el caso del 10:1</h1>

      <section className="bloque">
        <h2>La necesidad</h2>
        <p style={{ maxWidth: "70ch" }}>En México, hospitales, escuelas y empresas deben tener un Programa Interno de Protección Civil y hacer simulacros. El registro típico dice cuántas personas salieron y en cuánto tiempo. No dice quién nunca oyó la alarma, qué estorbo alargó la ruta ni dónde se hizo fila. Si hay un incidente real, una lista de firmas no prueba nada.</p>
        <p className="chico">Esta es la hipótesis de partida, construida con la investigación del curso. Todavía no la ha confirmado una persona real de Protección Civil (ver abajo).</p>
      </section>

      <section className="bloque">
        <h2>Quién paga</h2>
        <div className="panel aviso">
          <p><strong>Hipótesis, sin dato:</strong> quien dirige el inmueble (directora de una escuela o administrador de un hospital), porque es quien contrata hoy la capacitación y firma el registro. Cuánto pagaría hoy y cuánto pagaría por esto es una pregunta pendiente para la primera entrevista. No hay una cifra inventada aquí.</p>
        </div>
      </section>

      <section className="bloque">
        <h2>El caso del 10:1</h2>
        <p style={{ maxWidth: "70ch" }}><strong>Todavía no existe un 10:1 medido, y no lo afirmamos.</strong> Lo que sí se puede decir con lo que se construyó es una diferencia de tipo, no de tamaño: la hoja de asistencia no registra quién no oyó la alarma, y esta herramienta sí lo estima, con su margen de error.</p>
        <p>Así se medirá la comparación de la tarea completa, con la misma persona y el mismo simulacro:</p>
        <ol className="pasos">
          <li>Cuántos minutos le toma hoy producir el registro del simulacro y cuánto cuesta (capacitación incluida).</li>
          <li>Cuántos minutos le toma lo mismo con Croquis Vivo, desde abrir el croquis hasta tener las brechas y las acciones asignadas.</li>
          <li>Cuántas de las brechas encontradas confirma después un simulacro real. Esa es la prueba que le importa a la persona.</li>
        </ol>
        <p className="chico">Hasta que esas tres medidas existan, la comparación dice &ldquo;por medir&rdquo;.</p>
      </section>

      <section className="bloque">
        <h2>Qué está comprobado y qué no</h2>
        <div className="panel tabla-scroll">
          <table>
            <thead><tr><th>Cosa</th><th>Estado</th></tr></thead>
            <tbody>
              <tr><td>El motor da el mismo resultado con la misma semilla y se prueba de forma automática</td><td><span className="clase observado">comprobado</span></td></tr>
              <tr><td>Una persona real de Protección Civil sintió este problema este mes</td><td><span className="clase faltante">faltante</span></td></tr>
              <tr><td>El modelo coincide con un simulacro real del mismo inmueble</td><td><span className="clase faltante">faltante</span></td></tr>
              <tr><td>Las personas de prueba (directora de primaria y coordinador de hospital)</td><td><span className="clase simulado">sintéticas</span></td></tr>
              <tr><td>Cuánto pagaría alguien por esto</td><td><span className="clase faltante">sin dato</span></td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="bloque">
        <h2>De dónde sale</h2>
        <p style={{ maxWidth: "70ch" }}>Croquis Vivo viene de la semana 6 del curso y se reconstruyó en la semana 12 con un método propio: llegar con una postura, tratar los números del brief como afirmaciones de quien los vende y compararlos contra una medida independiente. En el producto, ese paso se vuelve la comparación entre lo declarado y lo simulado.</p>
        <div className="acciones"><Link href="/herramienta" className="btn">Abrir la herramienta</Link><Link href="/condiciones" className="btn sec">Ver las condiciones</Link></div>
      </section>
    </div>
  );
}
