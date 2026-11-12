"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { escenarios } from "@/lib/escenarios";
import { escenariosACsv, mxn, OBJETIVO_RAZON, proyectar, SEGMENTOS, sensibilidad, validarEscenario, type Escenario, type SegmentoId } from "@/lib/precios/modelo";

function descargar(nombre: string, tipo: string, contenido: string) {
  try {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = document.createElement("a");
    a.href = url; a.download = nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { /* el navegador no deja descargar */ }
}

export default function Simulador() {
  const [segmento, setSegmento] = useState<SegmentoId>("A");
  const [alcanzados, setAlcanzados] = useState("200");
  const [conversion, setConversion] = useState("5");
  const [precio, setPrecio] = useState("3000");
  const [entrega, setEntrega] = useState("");
  const [actual, setActual] = useState("");
  const [fijo, setFijo] = useState("0");
  const [nombre, setNombre] = useState("");
  const [errs, setErrs] = useState<string[]>([]);
  const [guardados, setGuardados] = useState<Escenario[]>([]);
  const [donde, setDonde] = useState<"nube" | "local">("local");
  const [soloAqui, setSoloAqui] = useState(0);
  const [aviso, setAviso] = useState("");

  const recargar = useCallback(async () => {
    const r = await escenarios.listar();
    setGuardados(r.items); setDonde(r.donde); setSoloAqui(r.soloAqui);
  }, []);
  useEffect(() => {
    (async () => { const r = await escenarios.listar(); setGuardados(r.items); setDonde(r.donde); setSoloAqui(r.soloAqui); })();
  }, []);

  function elegirSegmento(s: SegmentoId) {
    setSegmento(s);
    const p = SEGMENTOS.find((x) => x.id === s)?.precioPrueba;
    if (p) setPrecio(String(p));
  }

  const crudo = { nombre: nombre || "escenario sin guardar", segmento, alcanzados, conversionPct: conversion, precioAnual: precio, costoEntregaAnual: entrega, costoActualAnual: actual, costoFijoMensual: fijo };
  const v = useMemo(() => validarEscenario(crudo), [segmento, alcanzados, conversion, precio, entrega, actual, fijo, nombre]); // eslint-disable-line react-hooks/exhaustive-deps
  const salida = v.ok ? proyectar(v.valor) : null;
  const sens = v.ok ? sensibilidad(v.valor) : [];

  async function guardar() {
    const r = validarEscenario({ ...crudo, nombre });
    if (!r.ok) { setErrs(r.errores); return; }
    setErrs([]);
    const donde2 = await escenarios.guardar(r.valor);
    setAviso(donde2 === "nube" ? "Escenario guardado en la nube." : "Escenario guardado solo en este navegador (la nube no respondió).");
    setNombre("");
    await recargar();
  }
  function cargar(e: Escenario) {
    setSegmento(e.segmento); setAlcanzados(String(e.alcanzados)); setConversion(String(e.conversionPct)); setPrecio(String(e.precioAnual));
    setEntrega(e.costoEntregaAnual == null ? "" : String(e.costoEntregaAnual)); setActual(e.costoActualAnual == null ? "" : String(e.costoActualAnual)); setFijo(String(e.costoFijoMensual));
    setAviso(`Cargado: ${e.nombre}`);
  }
  async function quitar(e: Escenario) {
    await escenarios.borrar?.(e.id);
    setAviso(`Borrado: ${e.nombre}`);
    await recargar();
  }

  return (
    <div id="simulador">
      <h2>Simulador de ingresos</h2>
      <p className="chico" style={{ maxWidth: "70ch" }}>Esta calculadora es para probar supuestos de negocio (de quien construye o evalúa Croquis Vivo), no es una cotización para tu inmueble: tu precio es el del plan de arriba. No hay datos reales aquí: todo lo que sale depende de lo que escribas. Los campos de costo que dejes vacíos dicen <em>por medir</em>, no cero.</p>
      <div className="panel">
        <div className="fila">
          <div><label htmlFor="sim-seg">Segmento</label>
            <select id="sim-seg" value={segmento} onChange={(e) => elegirSegmento(e.target.value as SegmentoId)}>
              {SEGMENTOS.map((s) => <option key={s.id} value={s.id}>{s.id}: {s.nombre}</option>)}
            </select></div>
          <div><label htmlFor="sim-alc">Inmuebles alcanzados</label><input id="sim-alc" inputMode="numeric" value={alcanzados} onChange={(e) => setAlcanzados(e.target.value)} maxLength={9} /></div>
          <div><label htmlFor="sim-con">Conversión a pago (%)</label><input id="sim-con" inputMode="decimal" value={conversion} onChange={(e) => setConversion(e.target.value)} maxLength={6} /></div>
          <div><label htmlFor="sim-pre">Precio anual por inmueble (MXN)</label><input id="sim-pre" inputMode="numeric" value={precio} onChange={(e) => setPrecio(e.target.value)} maxLength={9} /></div>
        </div>
        <div className="fila">
          <div><label htmlFor="sim-ent">Costo de entrega por inmueble al año <span className="chico">(vacío = sin medir)</span></label><input id="sim-ent" inputMode="numeric" value={entrega} onChange={(e) => setEntrega(e.target.value)} maxLength={9} placeholder="sin medir" /></div>
          <div><label htmlFor="sim-act">Lo que gasta hoy el inmueble al año, contando dinero, horas de su gente y multas posibles <span className="chico">(vacío = sin dato)</span></label><input id="sim-act" inputMode="numeric" value={actual} onChange={(e) => setActual(e.target.value)} maxLength={10} placeholder="sin dato" /></div>
          <div><label htmlFor="sim-fij">Costo fijo mensual (MXN)</label><input id="sim-fij" inputMode="numeric" value={fijo} onChange={(e) => setFijo(e.target.value)} maxLength={9} /></div>
        </div>
        {!v.ok && <div className="error" role="alert" id="sim-errores"><ul style={{ margin: 0 }}>{v.errores.filter((x) => !x.startsWith("Nombre")).map((x) => <li key={x}>{x}</li>)}</ul></div>}
      </div>

      {salida && (
        <div className="panel salida" aria-live="polite" id="sim-resultado">
          <div className="antes-despues">
            <div className="dato"><div className="v num">{salida.pagantes.toLocaleString("es-MX")}</div><div className="e">pagantes (alcanzados × conversión)</div></div>
            <div className="dato"><div className="v num">{mxn(salida.ingresoAnual)}</div><div className="e">ingreso anual</div></div>
            <div className="dato"><div className="v num">{mxn(salida.ingresoMensual)}</div><div className="e">ingreso mensual, promedio</div></div>
            <div className="dato"><div className="v num">{salida.margenAnual == null ? "por medir" : mxn(salida.margenAnual)}</div><div className="e">margen anual{salida.margenAnual == null ? ": falta el costo de entrega" : ""}</div></div>
          </div>
          <p style={{ marginBottom: 4 }}><strong>Punto de equilibrio</strong> (cuántos inmuebles tienen que pagar para cubrir los costos fijos): {salida.equilibrioPagantes == null ? "por medir (falta el costo de entrega, o cada pagante cuesta más de lo que paga)." : `${salida.equilibrioPagantes.toLocaleString("es-MX")} pagantes.`}</p>
          <p style={{ marginBottom: 4 }}><strong>10:1 con tus datos</strong> (lo que gasta hoy el inmueble entre el precio, objetivo: 10 o más):  {salida.razon == null ? `por medir. Para que se cumpla, el inmueble tendría que gastar hoy al menos ${mxn(salida.costoActualNecesario)} al año (${OBJETIVO_RAZON} veces el precio).` : `${salida.razon.toLocaleString("es-MX")} a 1 (${salida.cumpleRazon ? "cumple" : "no cumple"} el objetivo de ${OBJETIVO_RAZON} a 1). Es la razón de TUS números, no una medida.`}</p>
          <p className="chico">El ingreso mensual es un promedio: si la mayoría paga cerca del simulacro de septiembre, el flujo real no es parejo.</p>
        </div>
      )}

      {salida && (
        <details open style={{ margin: "14px 0" }}>
          <summary>Supuestos visibles y qué pasa si cambia la conversión</summary>
          <div className="tabla-scroll panel">
            <table>
              <thead><tr><th>Conversión</th><th>Pagantes</th><th>Ingreso anual</th><th>Ingreso mensual</th></tr></thead>
              <tbody>{sens.map((s) => <tr key={s.conversionPct}><td>{s.conversionPct}%</td><td className="num">{s.pagantes.toLocaleString("es-MX")}</td><td className="num">{mxn(s.ingresoAnual)}</td><td className="num">{mxn(s.ingresoMensual)}</td></tr>)}</tbody>
            </table>
            <ul className="chico" style={{ marginBottom: 0 }}>
              <li>Pagantes = alcanzados × conversión, redondeado.</li>
              <li>Ingreso anual = pagantes × precio anual. Mensual = anual ÷ 12.</li>
              <li>Margen = ingreso − pagantes × costo de entrega − 12 × costo fijo mensual. Solo se calcula si escribes el costo de entrega.</li>
              <li>10:1 = lo que gasta hoy el inmueble ÷ el precio. Solo se calcula si escribes ese gasto.</li>
              <li>Los precios iniciales (MXN 3,000 y 9,000) son valores de prueba inventados.</li>
            </ul>
          </div>
        </details>
      )}

      <div className="panel">
        <h3>Guardar este escenario</h3>
        <div className="fila">
          <div><label htmlFor="sim-nom">Nombre del escenario (máx. 60)</label><input id="sim-nom" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} placeholder="Ej. escuelas, conversión baja" /></div>
        </div>
        {errs.length > 0 && <div className="error" role="alert" id="sim-guardar-errores"><ul style={{ margin: 0 }}>{errs.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        <div className="acciones"><button type="button" className="btn" onClick={guardar}>Guardar escenario</button></div>
        {aviso && <p role="status" className="chico" id="sim-aviso">{aviso}</p>}
        <p className="chico">{donde === "nube" ? "Los escenarios se guardan en la nube (solo tú los ves) y en este navegador." : "La nube no respondió: los escenarios se guardan solo en este navegador."}{soloAqui > 0 ? ` ${soloAqui} escenario(s) todavía solo están aquí.` : ""} No escribas nombres de personas.</p>
      </div>

      <div className="panel" id="sim-guardados">
        <h3>Escenarios guardados ({guardados.length})</h3>
        {guardados.length === 0 ? <p className="chico">Aún no hay escenarios.</p> : (
          <div className="tabla-scroll">
            <table>
              <thead><tr><th>Nombre</th><th>Seg.</th><th>Alcanzados</th><th>Conv.</th><th>Precio</th><th>Ingreso anual</th><th></th></tr></thead>
              <tbody>{guardados.map((g) => { const s = proyectar(g); return (
                <tr key={g.id}><td>{g.nombre}</td><td>{g.segmento}</td><td className="num">{g.alcanzados.toLocaleString("es-MX")}</td><td className="num">{g.conversionPct}%</td><td className="num">{mxn(g.precioAnual)}</td><td className="num">{mxn(s.ingresoAnual)}</td>
                  <td><div className="acciones" style={{ margin: 0 }}><button type="button" className="btn sec chico" onClick={() => cargar(g)} aria-label={`Cargar ${g.nombre}`}>Cargar</button><button type="button" className="btn peligro chico" onClick={() => quitar(g)} aria-label={`Borrar ${g.nombre}`}>Borrar</button></div></td></tr>
              ); })}</tbody>
            </table>
          </div>
        )}
        <div className="acciones">
          <button type="button" className="btn sec chico" disabled={!guardados.length} onClick={() => descargar("escenarios_croquisvivo.csv", "text/csv;charset=utf-8", escenariosACsv(guardados))}>Exportar CSV</button>
          <button type="button" className="btn sec chico" disabled={!guardados.length} onClick={() => descargar("escenarios_croquisvivo.json", "application/json", JSON.stringify(guardados, null, 2))}>Exportar JSON</button>
        </div>
      </div>
    </div>
  );
}
