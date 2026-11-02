import Link from "next/link";

export default function Inicio() {
  return (
    <>
      <section className="heroe">
        <div className="marco">
          <p className="etiqueta">Simulacros de evacuación · México</p>
          <h1>Tu simulacro dijo que todos salieron. <em>¿Lo comprobamos?</em></h1>
          <p className="grande">
            Croquis Vivo compara lo que dice el registro de un simulacro contra una simulación de tu croquis. Marca solo las brechas que superan el error normal del modelo (el rango donde cae el 80 % de las simulaciones) y le pone nombre y fecha a cada corrección.
          </p>
          <div className="acciones">
            <Link href="/herramienta" className="btn">Abrir la herramienta</Link>
            <Link href="/product" className="btn sec">Cómo funciona</Link>
          </div>
          <p className="chico" style={{ marginTop: 18 }}>Ayuda para investigar, no certificación. Prototipo con croquis y personas de ejemplo inventados.</p>
        </div>
      </section>

      <section className="bloque">
        <div className="marco">
          <h2>Tres pasos</h2>
          <div className="rejilla">
            <div className="panel"><div className="paso-num">1</div><h3>Escribe lo que declaró el registro</h3><p>Cuántas personas salieron, en cuánto tiempo y si la alarma se oyó en todas las áreas. Es lo que hoy dice tu hoja de asistencia.</p></div>
            <div className="panel"><div className="paso-num">2</div><h3>Compáralo con 24 simulaciones</h3><p>El modelo corre tu croquis varias veces. Si lo declarado cae fuera del rango normal, es una brecha. Si cae dentro, lo dice, sin presumir que todo está bien.</p></div>
            <div className="panel"><div className="paso-num">3</div><h3>Asigna y vuelve a medir</h3><p>Cada brecha se convierte en una acción con responsable y fecha. Después del siguiente simulacro real, se confirma o no. El modelo nunca confirma nada por sí solo.</p></div>
          </div>
        </div>
      </section>

      <section className="bloque">
        <div className="marco">
          <div className="rejilla">
            <div className="panel alarma">
              <h3>Lo que Croquis Vivo no hace</h3>
              <p>No certifica un inmueble. No avisa ni alerta a nadie durante un sismo. No califica a las personas evacuadas. No dice que un edificio es seguro.</p>
            </div>
            <div className="panel salida">
              <h3>Cada dato dice de dónde viene</h3>
              <p><span className="clase observado">observado</span> <span className="clase simulado">simulado</span> <span className="clase faltante">faltante</span> <span className="clase no_verificado">no verificado</span></p>
              <p>Si nadie lo midió, aparece como faltante. Si el modelo lo calculó, aparece como simulado, siempre.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
