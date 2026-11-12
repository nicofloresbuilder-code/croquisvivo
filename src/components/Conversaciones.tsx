"use client";
import { useEffect, useMemo, useState } from "react";
import { conversaciones } from "@/lib/conversaciones";
import { conversacionesACsv, RESULTADOS, resumen, validarConversacion, type Conversacion } from "@/lib/precios/conversacion";
import { ROLES } from "@/lib/sesion/validar";
import { mxn, SEGMENTOS } from "@/lib/precios/modelo";

const ROL_TXT = Object.fromEntries(ROLES) as Record<string, string>;
const RES_TXT = Object.fromEntries(RESULTADOS) as Record<string, string>;

function descargar(nombre: string, tipo: string, contenido: string) {
  try {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = document.createElement("a");
    a.href = url; a.download = nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { /* el navegador no deja descargar */ }
}

export default function Conversaciones() {
  const [lista, setLista] = useState<Conversacion[]>([]);
  const [donde, setDonde] = useState<"nube" | "local">("local");
  const [soloAqui, setSoloAqui] = useState(0);
  const [rol, setRol] = useState("");
  const [segmento, setSegmento] = useState("");
  const [desconocido, setDesconocido] = useState("");
  const [tarea, setTarea] = useState("");
  const [firma, setFirma] = useState("");
  const [costo, setCosto] = useState("");
  const [precio, setPrecio] = useState("");
  const [resultado, setResultado] = useState("");
  const [cita, setCita] = useState("");
  const [paso, setPaso] = useState("");
  const [errs, setErrs] = useState<string[]>([]);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    (async () => { const r = await conversaciones.listar(); setLista(r.items); setDonde(r.donde); setSoloAqui(r.soloAqui); })();
  }, []);
  const res = useMemo(() => resumen(lista), [lista]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const r = validarConversacion({ rol, segmento: segmento || undefined, desconocido: desconocido === "" ? undefined : desconocido === "si", tareaHoy: tarea, quienFirma: firma, costoActual: costo, precioPreguntado: precio, resultado, cita, siguientePaso: paso });
    if (!r.ok) { setErrs(r.errores); return; }
    setErrs([]);
    const d = await conversaciones.guardar(r.valor);
    setAviso(d === "nube" ? "Conversación guardada en la nube." : "Conversación guardada solo en este navegador (la nube no respondió).");
    setRol(""); setSegmento(""); setDesconocido(""); setTarea(""); setFirma(""); setCosto(""); setPrecio(""); setResultado(""); setCita(""); setPaso("");
    const l = await conversaciones.listar(); setLista(l.items); setDonde(l.donde); setSoloAqui(l.soloAqui);
  }

  return (
    <section className="bloque" id="conversaciones" aria-labelledby="t-conv">
      <p className="etiqueta">Semana 14 · precios</p>
      <h2 id="t-conv">Conversaciones de precio</h2>
      <p style={{ maxWidth: "70ch" }}>Una conversación real con alguien que podría pagar. Primero se reconstruye cómo lo hace hoy y quién firma el gasto; después se dice un precio y se anota lo que pasó, tal cual. <strong>Solo un compromiso firmado o un pago cuenta como demanda.</strong> Un &ldquo;me interesa&rdquo; se guarda, pero no se suma.</p>

      <div className="panel salida" id="conv-resumen">
        <div className="antes-despues">
          <div className="dato"><div className="v num">{res.total}</div><div className="e">conversaciones ({res.desconocidos} con desconocidos)</div></div>
          <div className="dato"><div className="v num">{res.rechazo}</div><div className="e">dijeron que no</div></div>
          <div className="dato"><div className="v num">{res.interes_dicho + res.pidio_propuesta}</div><div className="e">interés dicho o propuesta pedida (no es demanda)</div></div>
          <div className={`dato ${res.demandaComprobada > 0 ? "mejora" : ""}`}><div className="v num">{res.demandaComprobada}</div><div className="e">demanda comprobada: compromisos firmados y pagos</div></div>
        </div>
        {res.total === 0 && <p className="chico" style={{ marginBottom: 0 }}>Todavía no hay ninguna conversación. Hasta que haya, el precio sigue siendo una hipótesis.</p>}
      </div>

      <form className="panel" onSubmit={guardar} noValidate aria-labelledby="t-conv-form">
        <h3 id="t-conv-form">Anotar una conversación</h3>
        <div className="fila">
          <div><label htmlFor="c-rol">Rol de la persona</label><select id="c-rol" value={rol} onChange={(e) => setRol(e.target.value)}><option value="">Elige…</option>{ROLES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label htmlFor="c-seg">Segmento</label><select id="c-seg" value={segmento} onChange={(e) => setSegmento(e.target.value)}><option value="">Elige…</option>{SEGMENTOS.map((s) => <option key={s.id} value={s.id}>{s.id}: {s.nombre}</option>)}</select></div>
          <div><label htmlFor="c-des">¿Me conocía antes?</label><select id="c-des" value={desconocido} onChange={(e) => setDesconocido(e.target.value)}><option value="">Elige…</option><option value="si">No, es desconocida para mí</option><option value="no">Sí, la conocía</option></select></div>
        </div>
        <label htmlFor="c-tarea">1. Cómo lo hace hoy (máx. 300)</label>
        <textarea id="c-tarea" value={tarea} onChange={(e) => setTarea(e.target.value)} maxLength={300} placeholder="Ej. cuenta alumnos con cronómetro y firma una hoja" />
        <div className="fila">
          <div><label htmlFor="c-firma">2. Quién firma el gasto (o “sin dato”)</label><input id="c-firma" value={firma} onChange={(e) => setFirma(e.target.value)} maxLength={120} /></div>
          <div><label htmlFor="c-costo">3. Qué paga hoy (o “sin dato”)</label><input id="c-costo" value={costo} onChange={(e) => setCosto(e.target.value)} maxLength={200} /></div>
          <div><label htmlFor="c-precio">4. Precio que le dije (MXN al año)</label><input id="c-precio" inputMode="numeric" value={precio} onChange={(e) => setPrecio(e.target.value)} maxLength={9} /></div>
        </div>
        <div className="fila">
          <div><label htmlFor="c-res">5. Qué pasó</label><select id="c-res" value={resultado} onChange={(e) => setResultado(e.target.value)}><option value="">Elige…</option>{RESULTADOS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        </div>
        <label htmlFor="c-cita">Lo que dijo, tal cual (máx. 300)</label>
        <textarea id="c-cita" value={cita} onChange={(e) => setCita(e.target.value)} maxLength={300} />
        <label htmlFor="c-paso">Siguiente paso, o la prueba si firmó o pagó (máx. 200)</label>
        <input id="c-paso" value={paso} onChange={(e) => setPaso(e.target.value)} maxLength={200} />
        {errs.length > 0 && <div className="error" role="alert" id="conv-errores"><p style={{ margin: "0 0 4px" }}>Revisa esto antes de guardar:</p><ul style={{ margin: 0 }}>{errs.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        <div className="acciones"><button type="submit" className="btn">Guardar conversación</button></div>
        {aviso && <p className="chico" role="status" id="conv-aviso">{aviso}</p>}
        <p className="chico">Sin nombres, correos, teléfonos ni enlaces: describe a la persona por su rol. {donde === "local" ? "La nube no respondió: se guarda solo en este navegador." : ""}{soloAqui > 0 ? ` ${soloAqui} conversación(es) todavía solo están aquí.` : ""}</p>
      </form>

      <div className="panel" id="conv-lista">
        <h3>Conversaciones guardadas ({lista.length})</h3>
        {lista.length === 0 ? <p className="chico">Aún no hay ninguna.</p> : (
          <div className="tabla-scroll">
            <table className="tabla-ses">
              <thead><tr><th>Fecha</th><th>Rol</th><th>Seg.</th><th>Precio dicho</th><th>Qué pasó</th><th>Qué paga hoy</th><th>Lo que dijo</th></tr></thead>
              <tbody>{lista.map((c) => (
                <tr key={c.id}><td>{new Date(c.creada).toLocaleDateString("es-MX")}</td><td>{ROL_TXT[c.rol]}</td><td>{c.segmento}</td><td className="num">{mxn(c.precioPreguntado)}</td><td>{RES_TXT[c.resultado]}</td><td>{c.costoActual}</td><td>{c.cita}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <div className="acciones">
          <button type="button" className="btn sec chico" disabled={!lista.length} onClick={() => descargar("conversaciones_croquisvivo.csv", "text/csv;charset=utf-8", conversacionesACsv(lista))}>Exportar CSV</button>
          <button type="button" className="btn sec chico" disabled={!lista.length} onClick={() => descargar("conversaciones_croquisvivo.json", "application/json", JSON.stringify(lista, null, 2))}>Exportar JSON</button>
        </div>
        <p className="chico">Las conversaciones no se pueden borrar desde aquí, a propósito: los rechazos también cuentan.</p>
      </div>
    </section>
  );
}
