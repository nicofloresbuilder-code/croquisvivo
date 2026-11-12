import Link from "next/link";
import Simulador from "@/components/Simulador";

export const metadata = { title: "Precios · Croquis Vivo", description: "Precios de prueba de Croquis Vivo: dos segmentos, tres planes y un simulador de ingresos. Nadie ha pagado todavía." };

const Estado = ({ t }: { t: "existe" | "por construir" }) => <span className={t === "existe" ? "clase observado" : "clase faltante"}>{t}</span>;

export default function Precios() {
  return (
    <div className="marco" style={{ paddingTop: 40, paddingBottom: 20 }}>
      <p className="etiqueta">Precios</p>
      <h1>El número, a prueba</h1>
      <div className="panel aviso" role="note" id="aviso-hipotesis">
        <p style={{ margin: 0 }}><span className="sello">Precio de prueba · hipótesis no validada</span> <strong>Nadie ha pagado todavía.</strong> Hoy no hay cobro: todo lo que ves en la herramienta es gratis. Los precios son puntos de partida inventados para probarlos con personas reales y cambiarlos con lo que digan.</p>
      </div>

      <section className="bloque" aria-labelledby="planes">
        <h2 id="planes">Tres planes, dos segmentos</h2>
        <div className="rejilla">
          <article className="panel" id="plan-libre">
            <p className="etiqueta">Para todos</p>
            <h3>Libre</h3>
            <p className="paso-num" style={{ fontSize: "2.2rem" }}>$0</p>
            <ul>
              <li>Simulación con rango y las 24 corridas <Estado t="existe" /></li>
              <li>Todos los hallazgos de riesgo, siempre visibles <Estado t="existe" /></li>
              <li>Comparación entre lo declarado y lo medido <Estado t="existe" /></li>
              <li>Acciones con persona y fecha <Estado t="existe" /></li>
            </ul>
          </article>
          <article className="panel salida" id="plan-inmueble">
            <p className="etiqueta">Segmento A · escuelas privadas y edificios pequeños</p>
            <h3>Inmueble</h3>
            <p className="paso-num" style={{ fontSize: "2.2rem" }}>$3,000 <span className="chico">MXN por inmueble al año</span></p>
            <p className="chico" style={{ marginTop: -8 }}>precio de prueba · hipótesis</p>
            <ul>
              <li>Todo lo del plan Libre</li>
              <li>Historial de simulacros por inmueble <Estado t="por construir" /></li>
              <li>Exportar el informe con el sello SIMULADO <Estado t="por construir" /></li>
            </ul>
            <p className="chico">Quien firma: dirección o dueño del inmueble.</p>
          </article>
          <article className="panel" id="plan-institucion">
            <p className="etiqueta">Segmento B · hospitales, empresas y sitios con varios inmuebles</p>
            <h3>Institución</h3>
            <p className="paso-num" style={{ fontSize: "2.2rem" }}>$9,000 <span className="chico">MXN por inmueble al año</span></p>
            <p className="chico" style={{ marginTop: -8 }}>precio de prueba · hipótesis</p>
            <ul>
              <li>Todo lo del plan Inmueble</li>
              <li>Varios inmuebles en una misma cuenta <Estado t="por construir" /></li>
              <li>Comparar un simulacro con el anterior <Estado t="por construir" /></li>
            </ul>
            <p className="chico">Quien firma: administración.</p>
          </article>
        </div>
      </section>

      <section className="bloque" aria-labelledby="linea">
        <h2 id="linea">La línea entre gratis y de pago</h2>
        <div className="rejilla">
          <div className="panel salida"><h3>Siempre gratis: ver</h3><p>Los hallazgos de seguridad y el rango de la simulación nunca están detrás de un pago. Quien no paga ve exactamente lo mismo que quien paga.</p></div>
          <div className="panel"><h3>De pago: guardar y exportar</h3><p>El historial entre simulacros y el informe exportable. Lo que se vende es memoria y orden, no una respuesta.</p></div>
          <div className="panel alarma"><h3>Nunca se vende</h3><p>Un veredicto de seguridad, una insignia de aprobado, un orden escondido de los hallazgos o un resultado más favorable. Pagar no cambia lo que dice la simulación, y todo sigue marcado como <em>simulado</em>. No es una certificación.</p></div>
        </div>
      </section>

      <section className="bloque" aria-labelledby="porque">
        <h2 id="porque">De dónde salen estos números, sin adornos</h2>
        <ul style={{ maxWidth: "75ch" }}>
          <li><strong>Referencia mundial:</strong> NaviGate Prepared (EE. UU.) aparece en <a href="https://www.capterra.com/p/157888/NaviGate-Prepared/">Capterra</a> desde US$1,000 al año por usuario para registros de simulacros y planos escolares. Cobra por usuario y en un mercado que no es el mío. Raptor, otra opción, <a href="https://www.g2.com/products/raptor-emergency-management/pricing">no publica precio en G2</a>.</li>
          <li><strong>Lo que sé de México:</strong> la <a href="https://www.excelsior.com.mx/comunidad/50-mil-inmuebles-sin-programa-de-proteccion-civil-instrumento-ayuda-a-reducir-riesgos">nota de Excélsior (2023)</a> dice que más de 50 mil inmuebles de la CDMX deben tener Programa Interno de Protección Civil y había 17 mil. No encontré un precio público en pesos de lo que cobra hoy un tercero acreditado, y no lo invento.</li>
          <li><strong>Los $3,000 y $9,000 son inventados</strong> como punto de partida. Se probarán con personas reales y se registrará cada respuesta, también las negativas, en la <Link href="/sesiones#conversaciones">libreta de conversaciones</Link>.</li>
          <li><strong>El 10:1</strong> no está medido. Con estos precios, el inmueble tendría que gastar hoy al menos $30,000 (A) o $90,000 (B) al año para que se cumpla. Eso es lo que hay que averiguar. Lee el <Link href="/about#memo">memo</Link>.</li>
        </ul>
      </section>

      <section className="bloque" style={{ borderBottom: "none" }}>
        <Simulador />
      </section>
    </div>
  );
}
