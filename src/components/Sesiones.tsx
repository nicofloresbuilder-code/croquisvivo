"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { eventosDeSesion, fijarSesionActiva, registrar, sesionActiva, type SesionActiva } from "@/lib/eventos";
import { guardarSesion, listarSesiones } from "@/lib/sesiones";
import {
  aCsv, comparacionConHoja, fmtMmSs, MAX_ATASCOS, MAX_CITA, META_DESCONOCIDOS, META_SESIONES, nuevoId, pagaHoyResumen,
  parseMmSs, rankingDolores, reglaDeLaSemana, ROLES, validarSesion, volverian, type Sesion,
} from "@/lib/sesion/validar";

type Si = "" | "si" | "no";
const ROL_TXT = Object.fromEntries(ROLES) as Record<string, string>;

function descargar(nombre: string, tipo: string, contenido: string) {
  try {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = document.createElement("a");
    a.href = url; a.download = nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { /* el navegador no deja descargar */ }
}

export default function Sesiones() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [donde, setDonde] = useState<"nube" | "local">("local");
  const [cargando, setCargando] = useState(true);
  const [activa, setActiva] = useState<SesionActiva | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const [ahora, setAhora] = useState(0);

  const recargar = useCallback(async () => {
    const r = await listarSesiones();
    setSesiones(r.sesiones);
    setDonde(r.donde);
  }, []);

  useEffect(() => {
    (async () => {
      setActiva(sesionActiva());
      setAhora(Date.now());
      await recargar();
      setCargando(false);
    })();
  }, [recargar]);

  useEffect(() => {
    if (!activa || cerrando) return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activa, cerrando]);

  function iniciar() {
    const s = { id: nuevoId(), inicio: Date.now() };
    fijarSesionActiva(s);
    setActiva(s);
    setCerrando(false);
    registrar("sesion_iniciada");
  }
  function terminar() {
    registrar("sesion_terminada");
    setCerrando(true);
  }

  const regla = reglaDeLaSemana(sesiones);
  const ranking = useMemo(() => rankingDolores(sesiones), [sesiones]);
  const hoja = comparacionConHoja(sesiones);
  const paga = pagaHoyResumen(sesiones);
  const vuelven = volverian(sesiones);

  return (
    <div className="marco" style={{ paddingTop: 32, paddingBottom: 20 }}>
      <p className="etiqueta">Semana 13 · usuarios reales</p>
      <h1 style={{ margin: "0 0 6px", fontSize: "2.4rem" }}>Libreta del observador</h1>
      <p style={{ maxWidth: "68ch" }}>Aquí anoto cómo le va a una persona real con la herramienta: cuánto tarda, dónde se atora (con su cita exacta), qué paga hoy y quién firma ese gasto. <strong>No anotes nombres, correos ni teléfonos:</strong> describe a la persona solo por su rol.</p>
      <p className="chico" role="status">{cargando ? "Cargando…" : donde === "nube" ? "Guardado en la nube y también en este navegador." : "Guardado en este navegador. Exporta el archivo cuando termines para no perderlo."}</p>

      <div className="panel salida">
        <p className="etiqueta">Regla de la semana</p>
        <p style={{ margin: "4px 0" }}>
          <strong>{regla.total} de {META_SESIONES}</strong> sesiones · <strong>{regla.desconocidos} de {META_DESCONOCIDOS}</strong> con personas desconocidas.{" "}
          {regla.cumple ? <span className="clase observado">cumple</span> : <span className="clase faltante">falta{regla.faltan ? `: ${regla.faltan} sesión(es)` : ""}{regla.faltanDesconocidos ? `, ${regla.faltanDesconocidos} desconocida(s)` : ""}</span>}
        </p>
        <p className="chico" style={{ margin: 0 }}>Amigos y familia solos no cumplen. Si todas dijeron que les gustó, probablemente probé con personas amables y no con usuarios.</p>
      </div>

      {!activa && !cerrando && (
        <div className="panel">
          <h2>Iniciar una sesión</h2>
          <p>Al iniciar, la herramienta guarda en este navegador qué hace la persona y a qué hora. Después le pides que abra la herramienta con su propio caso.</p>
          <div className="acciones">
            <button type="button" className="btn" onClick={iniciar}>Iniciar sesión</button>
          </div>
        </div>
      )}

      {activa && !cerrando && (
        <div className="panel salida">
          <p className="etiqueta">Sesión en curso</p>
          <p className="temporizador" aria-live="off">{fmtMmSs(Math.max(0, Math.round((ahora - activa.inicio) / 1000)))}</p>
          <p className="chico">Pídele que abra la herramienta y haga la tarea sin ayuda. Anota con sus palabras donde se atore.</p>
          <div className="acciones">
            <Link href="/herramienta" className="btn sec">Abrir la herramienta</Link>
            <button type="button" className="btn" onClick={terminar}>Terminar sesión</button>
          </div>
        </div>
      )}

      {activa && cerrando && (
        <FormularioSesion
          key={activa.id}
          activa={activa}
          alGuardar={async (s) => {
            await guardarSesion(s);
            fijarSesionActiva(null);
            setActiva(null); setCerrando(false);
            await recargar();
          }}
          alDescartar={() => { fijarSesionActiva(null); setActiva(null); setCerrando(false); }}
        />
      )}

      <div className="panel">
        <h2>Los 3 peores problemas</h2>
        {ranking.length === 0 ? <p>Todavía no hay problemas anotados.</p> : (
          <div className="tabla-scroll">
            <table className="tabla-ses">
              <thead><tr><th>#</th><th>Problema (como lo anoté)</th><th>Sesiones</th><th>Gravedad prom.</th></tr></thead>
              <tbody>{ranking.map((r, i) => <tr key={r.problema}><td className="ranking-n">{i + 1}</td><td>{r.problema}</td><td>{r.sesiones} de {sesiones.length}</td><td>{r.gravedad} / 5</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <p className="chico">Orden = sesiones × gravedad que anoté yo. Es mi lectura de lo observado, no una medida de qué tan bien funciona la herramienta.</p>
      </div>

      <div className="panel">
        <h2>Lo que pide el caso de dinero</h2>
        <ul>
          <li><strong>Qué paga hoy:</strong> {paga.conDato} sesión(es) con dato y {paga.sinDato} “sin dato”.</li>
          <li><strong>Tiempo contra su hoja de hoy:</strong> {hoja.texto}</li>
          <li><strong>Volverían:</strong> {vuelven.dijeron} dijeron que sí; {vuelven.conPrueba} con prueba y {vuelven.sinPrueba} sin prueba. Sin prueba cuenta solo como “dijo que sí”.</li>
        </ul>
        <p className="chico">El 10:1 aparece como “por medir” hasta que haya al menos 3 sesiones con ambos tiempos. Una mejora que nadie midió no se afirma.</p>
      </div>

      <div className="panel">
        <h2>Sesiones guardadas ({sesiones.length})</h2>
        {sesiones.length === 0 ? <p>Aún no hay sesiones.</p> : (
          <div className="tabla-scroll">
            <table className="tabla-ses">
              <thead><tr><th>Fecha</th><th>Rol</th><th>Desconocida</th><th>Tiempo</th><th>Sola</th><th>Errores</th><th>Paga hoy</th><th>Volvería</th></tr></thead>
              <tbody>{sesiones.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.creada).toLocaleDateString("es-MX")}</td><td>{ROL_TXT[s.rol]}</td><td>{s.desconocido ? "Sí" : "No"}</td>
                  <td>{fmtMmSs(s.segundos)}</td><td>{s.completoSolo ? "Sí" : "No"}</td><td>{s.errores}</td><td>{s.pagaHoy}</td><td>{s.volveria ? (s.pruebaVolver ? "Sí, con prueba" : "Sí, sin prueba") : "No"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <div className="acciones">
          <button type="button" className="btn sec chico" disabled={!sesiones.length} onClick={() => descargar("sesiones_croquisvivo.csv", "text/csv;charset=utf-8", aCsv(sesiones))}>Exportar CSV</button>
          <button type="button" className="btn sec chico" disabled={!sesiones.length} onClick={() => descargar("sesiones_croquisvivo.json", "application/json", JSON.stringify(sesiones, null, 2))}>Exportar JSON</button>
        </div>
        <p className="chico">Las sesiones no se pueden borrar desde aquí, a propósito: las que salen mal también cuentan.</p>
      </div>
    </div>
  );
}

function FormularioSesion({ activa, alGuardar, alDescartar }: { activa: SesionActiva; alGuardar: (s: Sesion) => Promise<void>; alDescartar: () => void }) {
  const evs = useMemo(() => eventosDeSesion(activa.id), [activa.id]);
  const [duracion] = useState(() => Math.max(0, Math.round((Date.now() - activa.inicio) / 1000)));
  const citas = evs.filter((e) => e.tipo === "atasco").map((e) => String(e.detalle.cita ?? ""));
  const nErrores = evs.filter((e) => e.tipo === "error_validacion").length;

  const [rol, setRol] = useState("");
  const [desconocido, setDesconocido] = useState<Si>("");
  const [modalidad, setModalidad] = useState<"" | "presencial" | "remota">("");
  const [solo, setSolo] = useState<Si>("");
  const [tiempo, setTiempo] = useState(fmtMmSs(duracion));
  const [errores, setErrores] = useState(String(nErrores));
  const [atascos, setAtascos] = useState(citas.join("\n"));
  const [problema, setProblema] = useState("");
  const [gravedad, setGravedad] = useState("3");
  const [paga, setPaga] = useState("");
  const [firma, setFirma] = useState("");
  const [hoja, setHoja] = useState("");
  const [volveria, setVolveria] = useState<Si>("");
  const [prueba, setPrueba] = useState("");
  const [errs, setErrs] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = parseMmSs(tiempo);
    const h = parseMmSs(hoja);
    const pre: string[] = [];
    if (t === "mal" || t === null) pre.push("Tiempo total: escríbelo como mm:ss, por ejemplo 2:30.");
    if (h === "mal") pre.push("Tiempo con su hoja: escríbelo como mm:ss o déjalo vacío.");
    const r = validarSesion({
      id: activa.id, creada: activa.inicio, rol, desconocido: desconocido === "" ? undefined : desconocido === "si",
      modalidad: modalidad || undefined, completoSolo: solo === "" ? undefined : solo === "si",
      segundos: typeof t === "number" ? t : 0, errores, gravedad,
      atascos: atascos.split("\n"), problemaPrincipal: problema, pagaHoy: paga, quienFirma: firma,
      segundosHoja: typeof h === "number" ? h : null, volveria: volveria === "" ? undefined : volveria === "si", pruebaVolver: prueba,
    });
    const todos = [...pre, ...(r.ok ? [] : r.errores)];
    if (todos.length || !r.ok) { setErrs(todos); return; }
    setErrs([]); setGuardando(true);
    await alGuardar(r.valor);
  }

  return (
    <form className="panel salida" onSubmit={enviar} noValidate aria-labelledby="titulo-form">
      <h2 id="titulo-form">Cerrar la sesión: lo que observé</h2>
      <p className="chico">La herramienta guardó {evs.length} evento(s) de esta sesión{citas.length ? ` y ${citas.length} atasco(s) que la persona anotó` : ""}. Puedes corregir todo.</p>
      <div className="fila">
        <div><label htmlFor="s-rol">Rol de la persona</label><select id="s-rol" value={rol} onChange={(e) => setRol(e.target.value)}><option value="">Elige…</option>{ROLES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label htmlFor="s-des">¿Me conocía antes?</label><select id="s-des" value={desconocido} onChange={(e) => setDesconocido(e.target.value as Si)}><option value="">Elige…</option><option value="si">No, es desconocida para mí</option><option value="no">Sí, la conocía</option></select></div>
        <div><label htmlFor="s-mod">Modalidad</label><select id="s-mod" value={modalidad} onChange={(e) => setModalidad(e.target.value as "" | "presencial" | "remota")}><option value="">Elige…</option><option value="presencial">Presencial</option><option value="remota">Remota (pantalla compartida)</option></select></div>
      </div>
      <div className="fila">
        <div><label htmlFor="s-sola">¿Completó la tarea sin ayuda?</label><select id="s-sola" value={solo} onChange={(e) => setSolo(e.target.value as Si)}><option value="">Elige…</option><option value="si">Sí</option><option value="no">No</option></select></div>
        <div><label htmlFor="s-t">Tiempo total (mm:ss)</label><input id="s-t" value={tiempo} onChange={(e) => setTiempo(e.target.value)} maxLength={6} /></div>
        <div><label htmlFor="s-e">Errores que cometió</label><input id="s-e" inputMode="numeric" value={errores} onChange={(e) => setErrores(e.target.value)} maxLength={3} /></div>
      </div>
      <label htmlFor="s-a">Dónde se atoró, con su cita exacta (una por línea, máximo {MAX_ATASCOS})</label>
      <textarea id="s-a" value={atascos} onChange={(e) => setAtascos(e.target.value)} placeholder={'"No entiendo qué es una corrida"'} />
      <div className="fila">
        <div><label htmlFor="s-p">El peor problema, con mis palabras (máx. 200)</label><input id="s-p" value={problema} onChange={(e) => setProblema(e.target.value)} maxLength={200} /></div>
        <div><label htmlFor="s-g">Gravedad (1 leve, 5 la hizo rendirse)</label><select id="s-g" value={gravedad} onChange={(e) => setGravedad(e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
      </div>
      <div className="fila">
        <div><label htmlFor="s-paga">¿Qué paga hoy por esto? (o “sin dato”)</label><input id="s-paga" value={paga} onChange={(e) => setPaga(e.target.value)} maxLength={200} placeholder="sin dato" /></div>
        <div><label htmlFor="s-firma">¿Quién firma ese gasto? (o “sin dato”)</label><input id="s-firma" value={firma} onChange={(e) => setFirma(e.target.value)} maxLength={120} placeholder="sin dato" /></div>
        <div><label htmlFor="s-hoja">Tiempo con su hoja de hoy (mm:ss, opcional)</label><input id="s-hoja" value={hoja} onChange={(e) => setHoja(e.target.value)} maxLength={6} /></div>
      </div>
      <div className="fila">
        <div><label htmlFor="s-vol">¿Volvería a usarla?</label><select id="s-vol" value={volveria} onChange={(e) => setVolveria(e.target.value as Si)}><option value="">Elige…</option><option value="si">Sí</option><option value="no">No</option></select></div>
        <div><label htmlFor="s-pr">Prueba de que volvería (mensaje, visita repetida, registro)</label><input id="s-pr" value={prueba} onChange={(e) => setPrueba(e.target.value)} maxLength={MAX_CITA} placeholder="Sin prueba cuenta solo como “dijo que sí”" /></div>
      </div>
      {errs.length > 0 && <div className="error" role="alert"><p style={{ margin: "0 0 4px" }}>Revisa esto antes de guardar:</p><ul style={{ margin: 0 }}>{errs.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      <div className="acciones">
        <button type="submit" className="btn" disabled={guardando}>{guardando ? "Guardando…" : "Guardar sesión"}</button>
        <button type="button" className="btn sec" onClick={alDescartar} disabled={guardando}>Descartar</button>
      </div>
      <p className="chico">Descartar borra solo el cronómetro de esta sesión; no se pierden las sesiones ya guardadas.</p>
    </form>
  );
}
