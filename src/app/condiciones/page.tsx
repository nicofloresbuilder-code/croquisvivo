export const metadata = { title: "Condiciones · Croquis Vivo" };

const FILAS: [string, string, string, string][] = [
  ["1", "Documentar a una persona real afectada antes de afirmar demanda", "El sitio no afirma demanda. La necesidad se presenta como hipótesis y la persona real figura como faltante.", "Pendiente: falta la primera conversación con una persona real de Protección Civil."],
  ["2", "Separar lo observado, lo inferido, lo faltante y lo no verificado", "Cada dato lleva una de cuatro etiquetas (observado, simulado, faltante, no verificado) en la tabla de evidencia de la herramienta.", "Pruebas automáticas: sin captura real no aparece ningún dato como observado."],
  ["3", "Comparar la tarea completa con la alternativa existente, sin inventar un 10×", "Tabla frente a la hoja de asistencia en Producto, que dice también lo que la hoja hace mejor. El 10:1 aparece como \"por medir\" en Por qué existe.", "Revisión de texto: ninguna página afirma una mejora numérica."],
  ["4", "Identificar responsables, acción factible y dependencias externas", "Cada brecha se vuelve una acción que exige responsable y fecha. Dependencia externa declarada: la validación de Protección Civil y un simulacro real posterior.", "Pruebas automáticas: una acción no se aplica sin responsable ni fecha válida."],
  ["5", "Conservar las decisiones humanas, con reglas de parada y escalamiento", "El modelo sugiere y compara; una persona asigna, aplica y confirma. Si el tiempo de un simulacro real cae fuera de la banda, la herramienta dice que el modelo no está calibrado y que no se usen sus brechas como medidas.", "Pruebas automáticas de la calibración y de los estados de las acciones."],
  ["6", "Cláusula sombra: nunca etiquetar como éxito verificado un resultado simulado, previsto, reportado o intermedio", "Todo resultado del modelo lleva la etiqueta \"simulado\". Una acción solo pasa a \"confirmada\" con un simulacro real capturado por una persona. Ninguna conclusión dice \"seguro\" ni \"verificado\".", "Pruebas automáticas sobre el texto de las conclusiones y sobre los estados."],
];

const RIESGOS: [string, string, string][] = [
  ["Hana", "Un modelo ligero sin entradas validadas puede confundirse con mediciones reales.", "Sello \"simulado, no es certificación\" en cada pantalla, margen de error visible y panel de calibración con un simulacro real."],
  ["Isabella", "El modelado especializado puede costar más de lo que vale el informe.", "No se afirma ahorro. El costo y el tiempo aparecen como \"por medir\" hasta contar con una persona real."],
  ["Inés", "Una escuela u hospital podría tomar la simulación como prueba de que los ocupantes vulnerables están a salvo.", "Las conclusiones dentro del margen dicen que eso no prueba que el desalojo sea seguro. No hay puntaje de seguridad."],
  ["Ana María", "Las acciones sin responsable producirían otro informe que nadie usa.", "Una acción sin responsable y fecha no puede aplicarse y se muestra como pendiente."],
];

export default function Condiciones() {
  return (
    <div className="marco" style={{ paddingTop: 40, paddingBottom: 20 }}>
      <p className="etiqueta">Blueprint del equipo · semana 12</p>
      <h1>Las seis condiciones</h1>
      <p style={{ maxWidth: "70ch" }}>La condición que me tocó defender es la <strong>3</strong>. Las otras cinco también aplican a este producto. Esta tabla dice dónde se cumple cada una y cómo se comprobó, incluido lo que sigue pendiente.</p>
      <div className="panel tabla-scroll">
        <table>
          <thead><tr><th>#</th><th>Condición</th><th>Dónde se cumple</th><th>Cómo se comprobó</th></tr></thead>
          <tbody>{FILAS.map((f) => <tr key={f[0]}><td className="num"><strong>{f[0]}</strong></td><td>{f[1]}</td><td>{f[2]}</td><td>{f[3]}</td></tr>)}</tbody>
        </table>
      </div>

      <section className="bloque">
        <h2>Lo que señalaron mis compañeros</h2>
        <div className="panel tabla-scroll">
          <table>
            <thead><tr><th>Quién</th><th>Riesgo señalado</th><th>Qué hace el producto</th></tr></thead>
            <tbody>{RIESGOS.map((r) => <tr key={r[0]}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="bloque">
        <h2>Concesión y prueba de falla</h2>
        <div className="rejilla">
          <div className="panel"><h3>Lo que cedo</h3><p>Cualquier afirmación de certificación de seguridad y cualquier medición real que el modelo no pueda respaldar.</p></div>
          <div className="panel"><h3>Cómo fallaría</h3><p>Si el modelo no resulta lo bastante confiable ni siquiera como ayuda limitada para investigar. Para eso existe el panel de calibración: compara un simulacro real con la banda del modelo, y si cae fuera, el producto lo dice.</p></div>
        </div>
      </section>
    </div>
  );
}
