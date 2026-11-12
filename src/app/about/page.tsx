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
          <p><strong>Hipótesis, sin dato:</strong> quien dirige o administra el inmueble, porque es quien contrata hoy la capacitación y firma el registro. Quien usa la herramienta (por ejemplo, un coordinador) puede no ser quien firma el gasto: ese es el vacío que más importa medir. Los precios de prueba están en <Link href="/pricing">/pricing</Link> y son inventados; lo que pagan hoy sigue sin dato.</p>
        </div>
      </section>

      <section className="bloque" id="memo" aria-labelledby="t-memo">
        <p className="etiqueta">Memo · una página</p>
        <h2 id="t-memo">El caso del 10:1</h2>
        <p style={{ maxWidth: "72ch" }}><strong>Todavía no existe un 10:1 medido, y no lo afirmo.</strong> Este memo dice qué tendría que ser verdad para que el precio se sostenga, qué parte tiene fuente y qué parte sigue faltando.</p>

        <h3>1. Qué hace hoy la persona</h3>
        <p style={{ maxWidth: "72ch" }}>La hipótesis de partida: cuenta a la gente en el patio, anota el tiempo con un cronómetro del celular, firma una hoja de asistencia y, a veces, contrata una capacitación o a un tercero acreditado. Todavía no lo confirma ninguna persona real: la libreta de <Link href="/sesiones#conversaciones">conversaciones de precio</Link> empieza por preguntarlo.</p>

        <h3>2. Qué le cuesta de verdad</h3>
        <div className="panel tabla-scroll">
          <table>
            <thead><tr><th>Costo</th><th>Qué sé</th><th>Estado</th></tr></thead>
            <tbody>
              <tr><td>Dinero</td><td>Lo que paga hoy por el programa interno y la capacitación en México. No encontré un precio público en pesos y no lo invento.</td><td><span className="clase faltante">sin dato</span></td></tr>
              <tr><td>Tiempo</td><td>Minutos de producir el registro del simulacro. La libreta de sesiones lo mide contra la hoja de cada persona, con 3 sesiones mínimo.</td><td><span className="clase faltante">por medir</span></td></tr>
              <tr><td>Riesgo</td><td>La nota de <a href="https://www.excelsior.com.mx/comunidad/50-mil-inmuebles-sin-programa-de-proteccion-civil-instrumento-ayuda-a-reducir-riesgos">Excélsior (2023)</a> dice que la falta de programa puede ser causal de clausura. Otra <a href="https://accounter.co/noticias/actualidad/titulares/protege-a-tu-negocio-de-las-clausuras">nota</a> cita multas de 50,000 a 500,000 pesos; no vi que alguna fuente diga con qué frecuencia se aplican.</td><td><span className="clase no_verificado">no verificado</span></td></tr>
            </tbody>
          </table>
        </div>

        <h3>3. Mi precio</h3>
        <p style={{ maxWidth: "72ch" }}>Precios de prueba, inventados: <strong>$3,000 MXN</strong> por inmueble al año para escuelas privadas y edificios pequeños, y <strong>$9,000 MXN</strong> para hospitales, empresas y sitios con varios inmuebles. Nadie los ha pagado. Se ven en <Link href="/pricing">/pricing</Link>, con el simulador de ingresos.</p>

        <h3>4. Cuándo se sostiene el 10:1, y cuándo no</h3>
        <p style={{ maxWidth: "72ch" }}>El 10:1 es el costo total de hoy dividido entre el precio. Con estos precios, el inmueble tendría que gastar hoy <strong>al menos $30,000 (A) o $90,000 (B) al año</strong> entre dinero, tiempo y riesgo esperado. Si lo medido sale por debajo, hay tres salidas honestas: bajar el precio, cambiar la unidad de cobro o retirar la afirmación del 10:1. No se ajustan los números para que salga.</p>
        <p className="chico" style={{ maxWidth: "72ch" }}>Una diferencia que sí existe sin medirla es de tipo, no de tamaño: la hoja de asistencia no registra quién no oyó la alarma, y esta herramienta lo estima con su margen de error. Eso no es un ahorro.</p>

        <h3>5. Cómo se medirá</h3>
        <ol className="pasos">
          <li>Pregunto cómo lo hace hoy, quién firma y qué paga, antes de decir un precio.</li>
          <li>Mido los minutos de su hoja y los de la herramienta con la misma persona y el mismo simulacro.</li>
          <li>Digo el precio y anoto el resultado exacto. Cuenta como demanda un compromiso firmado o un pago; un &ldquo;me interesa&rdquo; no cuenta.</li>
        </ol>
        <p className="chico">Hasta que esas medidas existan, la razón dice &ldquo;por medir&rdquo;.</p>
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
              <tr><td>Los precios de prueba ($3,000 y $9,000 al año)</td><td><span className="clase simulado">inventados</span></td></tr>
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
