"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { asignar, aplicarAlModelo, confirmarReal, ETIQUETA_ESTADO, revertir } from "@/lib/motor/acciones";
import type { Accion } from "@/lib/motor/acciones";
import { borrar, guardar, iniciar, listar } from "@/lib/almacen";
import type { Modo } from "@/lib/almacen";
import { crearCaso, derivar, limpiarAfirmacion, sincronizarAcciones } from "@/lib/motor/caso";
import type { Caso, Derivado } from "@/lib/motor/caso";
import { calibrar, evidencias } from "@/lib/motor/conjunto";
import { fmt, simulate } from "@/lib/motor/nucleo";
import type { RunResult } from "@/lib/motor/nucleo";
import { PRESET_LABELS } from "@/lib/motor/sitios";
import type { SitioId } from "@/lib/motor/sitios";
import { Banda, Estado } from "./Banda";
import { Plano } from "./Plano";

function parseTiempo(s: string): number | null | "mal" {
  const v = s.trim();
  if (!v) return null;
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(v);
  if (!m) return "mal";
  return Number(m[1]) * 60 + Number(m[2]);
}
const hoy = () => new Date().toISOString().slice(0, 10);
const TEXTO_MODO: Record<Modo, string> = {
  nube: "Guardado en la nube (solo tú ves tus casos)",
  local: "Guardado en este navegador",
  memoria: "Este navegador no deja guardar: el caso se pierde al cerrar la pestaña",
};

export default function Herramienta() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [modo, setModo] = useState<Modo>("local");
  const [caso, setCaso] = useState<Caso | null>(null);
  const [der, setDer] = useState<Derivado | null>(null);
  const [run, setRun] = useState<RunResult | null>(null);
  const [calc, setCalc] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [sitio, setSitio] = useState<SitioId>("hospital");
  const [nombre, setNombre] = useState("");
  const [borrando, setBorrando] = useState<string | null>(null);
  const inicio = useRef<number>(0);
  const [segundos, setSegundos] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const m = await iniciar();
      setModo(m);
      setCasos(await listar());
      setCargando(false);
    })();
  }, []);

  const persistir = useCallback(async (c: Caso) => {
    const m = await guardar(c);
    setModo(m);
    setCasos(await listar());
  }, []);

  const actualizar = useCallback((c: Caso) => {
    const n = { ...c, actualizado: Date.now() };
    setCaso(n);
    void persistir(n);
    return n;
  }, [persistir]);

  const calcular = useCallback((c: Caso) => {
    setCalc(true);
    setTimeout(() => {
      const d = derivar(c);
      const r = simulate(d.site, 2026);
      setDer(d);
      setRun(r);
      const c2 = sincronizarAcciones(c, d.hallazgos);
      if (c2 !== c) { setCaso(c2); void persistir({ ...c2, actualizado: Date.now() }); }
      if (inicio.current && segundos === null) setSegundos(Math.round((performance.now() - inicio.current) / 1000));
      setCalc(false);
    }, 30);
  }, [persistir, segundos]);

  function abrir(c: Caso) {
    inicio.current = performance.now();
    setSegundos(null);
    setCaso(c);
    setDer(null);
    setRun(null);
    calcular(c);
  }
  function nuevo() {
    const c = crearCaso(sitio, nombre, Date.now());
    void persistir(c);
    abrir(c);
    setNombre("");
  }
  async function quitar(id: string) {
    await borrar(id);
    setBorrando(null);
    if (caso?.id === id) { setCaso(null); setDer(null); setRun(null); }
    setCasos(await listar());
  }

  return (
    <div className="marco" style={{ paddingTop: 32, paddingBottom: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 6 }}>
        <h1 style={{ margin: 0, fontSize: "2.4rem" }}>Herramienta</h1>
        <span className="sello">Simulado · no es certificación</span>
      </div>
      <p className="chico" role="status">{TEXTO_MODO[modo]}.</p>

      <Seccion n="1" titulo="Elige un croquis">
        <div className="fila">
          <div>
            <label htmlFor="sitio">Croquis de ejemplo (inventado)</label>
            <select id="sitio" value={sitio} onChange={(e) => setSitio(e.target.value as SitioId)}>
              {PRESET_LABELS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="nombre">Nombre del caso</label>
            <input id="nombre" value={nombre} maxLength={80} placeholder="Ej. Simulacro de septiembre" onChange={(e) => setNombre(e.target.value)} />
          </div>
        </div>
        <p className="chico">En esta versión solo hay dos croquis de ejemplo inventados. Cargar el plano de tu propio edificio es el siguiente paso por construir; hoy la herramienta enseña cómo se haría la comparación.</p>
        <div className="acciones"><button type="button" className="btn" onClick={nuevo} disabled={calc}>Crear caso</button></div>
        {cargando ? <p className="chico">Cargando casos guardados…</p> : casos.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p className="etiqueta">Casos guardados</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {casos.map((c) => (
                <li key={c.id} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--linea)" }}>
                  <span style={{ flex: 1, minWidth: 180 }}><strong>{c.nombre}</strong><br /><span className="chico">{PRESET_LABELS.find((p) => p[0] === c.sitio)?.[1]} · {new Date(c.actualizado).toLocaleDateString("es-MX")}</span></span>
                  <button type="button" className="btn sec chico" onClick={() => abrir(c)} disabled={calc}>{caso?.id === c.id ? "Recalcular" : "Abrir"}</button>
                  {borrando === c.id
                    ? <><button type="button" className="btn peligro chico" onClick={() => quitar(c.id)}>Sí, borrar</button><button type="button" className="btn sec chico" onClick={() => setBorrando(null)}>No</button></>
                    : <button type="button" className="btn sec chico" onClick={() => setBorrando(c.id)}>Borrar</button>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Seccion>

      {caso && (
        <>
          <Registro key={caso.id} caso={caso} ocupado={calc} alGuardar={(a) => { const n = actualizar({ ...caso, afirmacion: a }); calcular(n); }} />
          {calc && <p role="status" className="panel aviso">Calculando 24 simulaciones…</p>}
          {der && run && !calc && <Resultado caso={caso} der={der} run={run} segundos={segundos} actualizar={actualizar} recalcular={calcular} />}
        </>
      )}
    </div>
  );
}

function Seccion({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="panel" aria-label={titulo}>
      <p className="etiqueta">Paso {n}</p>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}

function Registro({ caso, ocupado, alGuardar }: { caso: Caso; ocupado: boolean; alGuardar: (a: Caso["afirmacion"]) => void }) {
  const a = caso.afirmacion;
  const [personas, setPersonas] = useState(String(a.personas));
  const [salieron, setSalieron] = useState(String(a.evacuaron));
  const [tiempo, setTiempo] = useState(a.tiempoSeg == null ? "" : fmt(a.tiempoSeg));
  const [alarma, setAlarma] = useState(a.alarmaTodas);
  const [error, setError] = useState("");
  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = parseTiempo(tiempo);
    if (t === "mal") { setError("Escribe el tiempo como minutos:segundos, por ejemplo 2:30, o déjalo vacío si el registro no lo dice."); return; }
    const v = limpiarAfirmacion({ personas: Number(personas), evacuaron: Number(salieron), tiempoSeg: t, alarmaTodas: alarma });
    if (!v.ok) { setError(v.error); return; }
    setError("");
    alGuardar(v.valor);
  }
  return (
    <Seccion n="2" titulo="Lo que dice el registro del simulacro">
      <p>Escribe lo que declaró la hoja del simulacro real. Aquí todo es <span className="clase no_verificado">no verificado</span> hasta que otra fuente lo respalde.</p>
      <form onSubmit={enviar} noValidate>
        <div className="fila">
          <div><label htmlFor="pres">Personas presentes</label><input id="pres" inputMode="numeric" value={personas} onChange={(e) => setPersonas(e.target.value)} maxLength={4} /></div>
          <div><label htmlFor="sal">Personas que salieron</label><input id="sal" inputMode="numeric" value={salieron} onChange={(e) => setSalieron(e.target.value)} maxLength={4} /></div>
          <div><label htmlFor="tie">Tiempo total (mm:ss, opcional)</label><input id="tie" value={tiempo} onChange={(e) => setTiempo(e.target.value)} placeholder="1:30" maxLength={5} /></div>
        </div>
        <label className="chk"><input type="checkbox" checked={alarma} onChange={(e) => setAlarma(e.target.checked)} />El registro dice que la alarma se oyó en todas las áreas</label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="acciones"><button type="submit" className="btn" disabled={ocupado}>Comparar con la simulación</button></div>
      </form>
    </Seccion>
  );
}

function Resultado({ caso, der, run, segundos, actualizar, recalcular }: { caso: Caso; der: Derivado; run: RunResult; segundos: number | null; actualizar: (c: Caso) => Caso; recalcular: (c: Caso) => void }) {
  const ev = evidencias(caso.afirmacion, caso.observado);
  const cal = calibrar(caso.observado, der.conjunto);
  const antes = caso.antes, ahora = der.resumen;
  return (
    <>
      <Seccion n="3" titulo="Afirmación contra medida">
        <p className="chico">Medida = {der.conjunto.n} corridas del modelo con distinta aleatoriedad. La banda verde es el error normal; solo es brecha lo que cae fuera. <span className="clase simulado">simulado</span></p>
        {der.brechas.map((b) => (
          <div className="fila-brecha" key={b.id}>
            <div>
              <h3>{b.tema}</h3>
              <p style={{ margin: "0 0 4px" }}><span className="chico">El registro dice:</span> <strong>{b.afirmado}</strong> <span className="clase no_verificado">no verificado</span></p>
              <p style={{ margin: 0 }}><span className="chico">El modelo midió:</span> <strong>{b.medido}</strong> <span className="clase simulado">simulado</span></p>
            </div>
            <div>
              <p style={{ margin: "0 0 6px" }}><Estado e={b.estado} /></p>
              <p style={{ margin: 0 }}>{b.conclusion}</p>
              <Banda b={b} />
            </div>
          </div>
        ))}
      </Seccion>

      <Seccion n="4" titulo="El plano, simulado">
        <Plano site={der.site} run={run} />
      </Seccion>

      <Acciones n="5" caso={caso} der={der} actualizar={actualizar} recalcular={recalcular} />

      {antes && (
        <Seccion n="6" titulo="Antes y después de las correcciones (en el modelo)">
          <div className="antes-despues">
            <Dato t="Brechas" a={antes.brechas} b={ahora.brechas} menosEsMejor />
            <Dato t="Personas sin oír con margen claro" a={antes.sinOirSeguro} b={ahora.sinOirSeguro} menosEsMejor />
            <Dato t="Tiempo mediano (s)" a={Math.round(antes.tUltima)} b={Math.round(ahora.tUltima)} menosEsMejor />
          </div>
          <p className="chico" style={{ marginTop: 10 }}>Es la misma semilla y la misma gente: solo cambian las correcciones. Es una comparación <span className="clase simulado">simulada</span>; no prueba nada en el edificio real.</p>
        </Seccion>
      )}

      <Seccion n={antes ? "7" : "6"} titulo="¿Qué tan confiable es este modelo?">
        <div className="tabla-scroll">
          <table>
            <thead><tr><th>Dato</th><th>Clase</th><th>Nota</th></tr></thead>
            <tbody>{ev.map((e) => <tr key={e.dato}><td>{e.dato}</td><td><span className={`clase ${e.clase}`}>{e.clase.replace("_", " ")}</span></td><td>{e.nota}</td></tr>)}</tbody>
          </table>
        </div>
        <Observado caso={caso} actualizar={actualizar} />
        <p className={cal.estado === "fuera" ? "panel alarma" : "panel aviso"} role="status" style={{ marginBottom: 0 }}>{cal.texto}</p>
      </Seccion>

      <Seccion n={antes ? "8" : "7"} titulo="Frente a la hoja de asistencia">
        <div className="tabla-scroll">
          <table>
            <thead><tr><th>Medida</th><th>Hoja de asistencia</th><th>Croquis Vivo en este caso</th></tr></thead>
            <tbody>
              <tr><td>Datos que da</td><td>Conteo y tiempo, reales</td><td>{der.brechas.length} comparaciones y {caso.acciones.length} acciones, simuladas</td></tr>
              <tr><td>Personas sin oír la alarma</td><td>No lo registra</td><td>{der.conjunto.sinOirSeguro} con margen claro, {der.conjunto.sinOirPosible} en el límite (simulado)</td></tr>
              <tr><td>Acciones con responsable</td><td>No lo registra</td><td>{caso.acciones.filter((a) => a.estado !== "propuesta").length} de {caso.acciones.length}</td></tr>
              <tr><td>Acciones confirmadas en simulacro real</td><td>No aplica</td><td>{caso.acciones.filter((a) => a.estado === "confirmada_real").length} de {caso.acciones.length}</td></tr>
              <tr><td>Tiempo desde abrir el caso hasta ver las brechas</td><td>Por medir</td><td>{segundos == null ? "…" : `${segundos} s`} (lo midió la herramienta; no incluye reunir el registro real)</td></tr>
              <tr><td>Costo</td><td>Por medir</td><td>Por medir</td></tr>
            </tbody>
          </table>
        </div>
        <p className="chico" style={{ marginTop: 10 }}>No afirmamos una mejora numérica frente a la hoja. La hoja registra lo que pasó de verdad; esta herramienta solo estima lo que el registro no ve.</p>
      </Seccion>
    </>
  );
}

function Dato({ t, a, b, menosEsMejor }: { t: string; a: number; b: number; menosEsMejor?: boolean }) {
  const mejor = menosEsMejor ? b < a : b > a, peor = menosEsMejor ? b > a : b < a;
  return (
    <div className={`dato ${mejor ? "mejora" : peor ? "empeora" : ""}`}>
      <div className="v num">{a} → {b}</div>
      <div className="e">{t}</div>
    </div>
  );
}

function Observado({ caso, actualizar }: { caso: Caso; actualizar: (c: Caso) => Caso }) {
  const [t, setT] = useState(caso.observado?.tiempoSeg != null ? fmt(caso.observado.tiempoSeg) : "");
  const [db, setDb] = useState(caso.observado?.nivelAlarmaDb != null ? String(caso.observado.nivelAlarmaDb) : "");
  const [error, setError] = useState("");
  function guardarObs(e: React.FormEvent) {
    e.preventDefault();
    const tt = parseTiempo(t);
    if (tt === "mal") { setError("Escribe el tiempo como mm:ss, por ejemplo 1:45."); return; }
    if (tt != null && (tt < 10 || tt > 3600)) { setError("El tiempo debe estar entre 10 s y 60 min."); return; }
    const d = db.trim() === "" ? null : Number(db);
    if (d != null && (!Number.isFinite(d) || d < 30 || d > 140)) { setError("El nivel de sonido debe estar entre 30 y 140 dB."); return; }
    setError("");
    actualizar({ ...caso, observado: { tiempoSeg: tt, nivelAlarmaDb: d } });
  }
  return (
    <form onSubmit={guardarObs} noValidate style={{ margin: "16px 0" }}>
      <p className="etiqueta">Calibrar con un simulacro real (opcional)</p>
      <div className="fila">
        <div><label htmlFor="obt">Tiempo medido en un simulacro real (mm:ss)</label><input id="obt" value={t} onChange={(e) => setT(e.target.value)} placeholder="1:45" maxLength={5} /></div>
        <div><label htmlFor="obd">Nivel de la alarma medido con sonómetro (dB)</label><input id="obd" inputMode="decimal" value={db} onChange={(e) => setDb(e.target.value)} maxLength={5} /></div>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="acciones"><button type="submit" className="btn sec chico">Guardar lo observado</button></div>
    </form>
  );
}

function Acciones({ n, caso, der, actualizar, recalcular }: { n: string; caso: Caso; der: Derivado; actualizar: (c: Caso) => Caso; recalcular: (c: Caso) => void }) {
  const [msg, setMsg] = useState<Record<string, string>>({});
  const err = (id: string, m: string) => setMsg((p) => ({ ...p, [id]: m }));
  const cambiar = (a: Accion, extra: Partial<Caso> = {}) => actualizar({ ...caso, ...extra, acciones: caso.acciones.map((x) => (x.id === a.id ? a : x)) });
  const pendientesHallazgo = der.hallazgos.filter((h) => !h.fix);

  function aplicar(a: Accion) {
    const r = aplicarAlModelo(a);
    if (!r.ok) { err(a.id, r.error); return; }
    err(a.id, "");
    const antes = caso.antes ?? der.resumen;
    const n = actualizar({ ...caso, antes, aplicadas: [...caso.aplicadas, a.fixId], acciones: caso.acciones.map((x) => (x.id === a.id ? r.valor : x)) });
    recalcular(n);
  }
  function deshacer(a: Accion) {
    const r = revertir(a);
    if (!r.ok) { err(a.id, r.error); return; }
    const n = actualizar({ ...caso, aplicadas: caso.aplicadas.filter((x) => x !== a.fixId), acciones: caso.acciones.map((x) => (x.id === a.id ? r.valor : x)) });
    recalcular(n);
  }
  return (
    <Seccion n={n} titulo="Acciones con responsable">
      {caso.acciones.length === 0 && <p>No hay correcciones propuestas para este croquis. Eso no prueba que no haya problemas.</p>}
      {caso.acciones.map((a) => <TarjetaAccion key={a.id} a={a} msg={msg[a.id]} onAsignar={(r, f) => { const x = asignar(a, r, f); if (x.ok) { err(a.id, ""); cambiar(x.valor); } else err(a.id, x.error); }} onAplicar={() => aplicar(a)} onRevertir={() => deshacer(a)} onConfirmar={(f, n, t) => { const x = confirmarReal(a, f, n, t); if (x.ok) { err(a.id, ""); cambiar(x.valor, t != null ? { observado: { ...caso.observado, tiempoSeg: t } } : {}); } else err(a.id, x.error); }} />)}
      {pendientesHallazgo.length > 0 && (
        <details style={{ marginTop: 14 }}>
          <summary>Otros hallazgos del modelo, sin corrección automática ({pendientesHallazgo.length})</summary>
          {pendientesHallazgo.map((h) => <p key={h.title}><strong>{h.title}.</strong> {h.detail} <span className="clase simulado">simulado</span></p>)}
        </details>
      )}
    </Seccion>
  );
}

function TarjetaAccion({ a, msg, onAsignar, onAplicar, onRevertir, onConfirmar }: { a: Accion; msg?: string; onAsignar: (r: string, f: string) => void; onAplicar: () => void; onRevertir: () => void; onConfirmar: (f: string, n: string, t: number | null) => void }) {
  const [resp, setResp] = useState(a.responsable);
  const [fecha, setFecha] = useState(a.fecha || hoy());
  const [rf, setRf] = useState(hoy());
  const [nota, setNota] = useState("");
  const [rt, setRt] = useState("");
  const colorEstado = a.estado === "confirmada_real" ? "salida" : a.estado === "propuesta" ? "aviso" : "";
  return (
    <div className={`panel ${colorEstado}`} style={{ margin: "12px 0" }}>
      <h3>{a.titulo}</h3>
      <p className="chico" style={{ margin: "0 0 8px" }}>Por qué: {a.porQue}</p>
      <p style={{ margin: "0 0 8px" }}><span className={`clase ${a.estado === "confirmada_real" ? "observado" : a.estado === "aplicada_modelo" ? "simulado" : "faltante"}`}>{ETIQUETA_ESTADO[a.estado]}</span></p>
      {(a.estado === "propuesta" || a.estado === "asignada") && (
        <div className="fila">
          <div><label htmlFor={`r${a.id}`}>Responsable</label><input id={`r${a.id}`} value={resp} onChange={(e) => setResp(e.target.value)} maxLength={60} placeholder="Nombre de la persona" /></div>
          <div><label htmlFor={`f${a.id}`}>Fecha límite</label><input id={`f${a.id}`} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
        </div>
      )}
      {a.estado !== "propuesta" && <p style={{ margin: "8px 0" }}>Responsable: <strong>{a.responsable}</strong> · fecha límite: <strong>{a.fecha}</strong></p>}
      {msg && <p className="error" role="alert">{msg}</p>}
      <div className="acciones">
        {(a.estado === "propuesta" || a.estado === "asignada") && <button type="button" className="btn sec chico" onClick={() => onAsignar(resp, fecha)}>{a.estado === "propuesta" ? "Asignar" : "Cambiar responsable"}</button>}
        {a.estado === "asignada" && <button type="button" className="btn chico" onClick={onAplicar}>Aplicar al modelo y volver a comparar</button>}
        {a.estado === "aplicada_modelo" && <button type="button" className="btn sec chico" onClick={onRevertir}>Deshacer en el modelo</button>}
      </div>
      {a.estado === "aplicada_modelo" && (
        <form onSubmit={(e) => { e.preventDefault(); const t = parseTiempo(rt); if (t === "mal") { return; } onConfirmar(rf, nota, t); }} style={{ marginTop: 14 }} noValidate>
          <p className="etiqueta">Confirmar con un simulacro real</p>
          <p className="chico">Solo una persona puede confirmar una acción, con lo que observó en un simulacro real posterior. El modelo no confirma nada.</p>
          <div className="fila">
            <div><label htmlFor={`rf${a.id}`}>Fecha del simulacro real</label><input id={`rf${a.id}`} type="date" value={rf} onChange={(e) => setRf(e.target.value)} /></div>
            <div><label htmlFor={`rt${a.id}`}>Tiempo observado (mm:ss, opcional)</label><input id={`rt${a.id}`} value={rt} onChange={(e) => setRt(e.target.value)} placeholder="1:40" maxLength={5} /></div>
          </div>
          <label htmlFor={`rn${a.id}`}>Qué se observó</label>
          <textarea id={`rn${a.id}`} value={nota} maxLength={400} onChange={(e) => setNota(e.target.value)} />
          <div className="acciones"><button type="submit" className="btn chico">Confirmar</button></div>
        </form>
      )}
      {a.estado === "confirmada_real" && a.real && <p className="chico">Confirmada el {a.real.fecha}: {a.real.nota}</p>}
    </div>
  );
}
