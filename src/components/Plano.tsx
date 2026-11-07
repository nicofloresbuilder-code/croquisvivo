"use client";
import { registrar } from "@/lib/eventos";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DOOR, EXIT, FURN, NOISE, OBST, SNR_MIN, SPK, STAIR, WALL, WIN, fmt, rectsOf } from "@/lib/motor/nucleo";
import type { RunResult, Site } from "@/lib/motor/nucleo";

const PX = 16;
const C = { suelo: "#0a110d", zona: "#0f1914", pared: "#4a5f52", ventana: "#3b8cb0", puerta: "#ffc61a", salida: "#19d67d", mueble: "#1d2a23", muebleLinea: "#33463b", estorbo: "#ff8a1a", sinOir: "rgba(255,85,69,.16)", ok: "#19d67d", lento: "#ffc61a", espera: "#8fa398", rojo: "#ff5545" };

export function Plano({ site, run }: { site: Site; run: RunResult }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [i, setI] = useState(0);
  const [jugando, setJugando] = useState(false);
  const n = run.frames.length;

  const formas = useMemo(() => ({ furn: rectsOf(site, FURN), obst: rectsOf(site, OBST), stair: rectsOf(site, STAIR), exit: rectsOf(site, EXIT) }), [site]);

  const dibujar = useCallback(() => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = site.cols * PX, H = site.rows * PX;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.scale(PX, PX);
    const u = 1 / PX;
    ctx.fillStyle = C.suelo; ctx.fillRect(0, 0, site.cols, site.rows);
    ctx.fillStyle = C.zona;
    for (const z of site.zones) ctx.fillRect(z.x, z.y, z.w, z.h);
    // zonas donde la alarma no supera el ruido de fondo por 15 dB (simulado)
    ctx.fillStyle = C.sinOir;
    for (let q = 0; q < site.cols * site.rows; q++) {
      const t = site.g[q];
      if (t === WALL || t === WIN || t === FURN) continue;
      if (run.ac.alarm[q] - run.ac.amb[q] < SNR_MIN) ctx.fillRect(q % site.cols, (q / site.cols) | 0, 1, 1);
    }
    for (const r of formas.furn) { ctx.fillStyle = C.mueble; ctx.fillRect(r[0] + 0.1, r[1] + 0.1, r[2] - 0.2, r[3] - 0.2); ctx.strokeStyle = C.muebleLinea; ctx.lineWidth = u; ctx.strokeRect(r[0] + 0.1, r[1] + 0.1, r[2] - 0.2, r[3] - 0.2); }
    for (let q = 0; q < site.cols * site.rows; q++) {
      const t = site.g[q], x = q % site.cols, y = (q / site.cols) | 0;
      if (t === WALL) { ctx.fillStyle = C.pared; ctx.fillRect(x, y, 1, 1); }
      else if (t === WIN) { ctx.fillStyle = C.pared; ctx.fillRect(x, y, 1, 1); ctx.fillStyle = C.ventana; ctx.fillRect(x + 0.15, y + 0.15, 0.7, 0.7); }
      else if (t === DOOR) { ctx.fillStyle = C.puerta; ctx.fillRect(x + 0.1, y + 0.1, 0.8, 0.8); ctx.globalAlpha = 0.35; ctx.fillRect(x, y, 1, 1); ctx.globalAlpha = 1; }
    }
    for (const r of formas.stair) { ctx.strokeStyle = C.salida; ctx.lineWidth = 2 * u; ctx.strokeRect(r[0] + 0.1, r[1] + 0.1, r[2] - 0.2, r[3] - 0.2); for (let k = 0.5; k < Math.max(r[2], r[3]); k += 0.5) { ctx.beginPath(); if (r[2] >= r[3]) { ctx.moveTo(r[0] + k, r[1] + 0.1); ctx.lineTo(r[0] + k, r[1] + r[3] - 0.1); } else { ctx.moveTo(r[0] + 0.1, r[1] + k); ctx.lineTo(r[0] + r[2] - 0.1, r[1] + k); } ctx.lineWidth = u; ctx.stroke(); } }
    for (const r of formas.exit) { ctx.fillStyle = C.salida; ctx.fillRect(r[0], r[1], r[2], r[3]); }
    for (const r of formas.obst) {
      ctx.fillStyle = C.estorbo; ctx.globalAlpha = 0.85; ctx.fillRect(r[0] + 0.1, r[1] + 0.1, r[2] - 0.2, r[3] - 0.2); ctx.globalAlpha = 1;
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.4 * u; ctx.save(); ctx.beginPath(); ctx.rect(r[0] + 0.1, r[1] + 0.1, r[2] - 0.2, r[3] - 0.2); ctx.clip();
      for (let d = -r[3]; d < r[2]; d += 0.7) { ctx.beginPath(); ctx.moveTo(r[0] + d, r[1]); ctx.lineTo(r[0] + d + r[3], r[1] + r[3]); ctx.stroke(); }
      ctx.restore();
    }
    for (let q = 0; q < site.cols * site.rows; q++) {
      const t = site.g[q], x = q % site.cols, y = (q / site.cols) | 0;
      if (t === SPK) { ctx.fillStyle = C.ok; ctx.beginPath(); ctx.arc(x + 0.5, y + 0.5, 0.32, 0, 6.284); ctx.fill(); ctx.strokeStyle = C.ok; ctx.lineWidth = u; ctx.beginPath(); ctx.arc(x + 0.5, y + 0.5, 0.6, -0.8, 0.8); ctx.stroke(); }
      if (t === NOISE) { ctx.fillStyle = C.rojo; ctx.beginPath(); ctx.arc(x + 0.5, y + 0.5, 0.34, 0, 6.284); ctx.fill(); ctx.strokeStyle = C.rojo; ctx.lineWidth = u; ctx.beginPath(); ctx.arc(x + 0.5, y + 0.5, 0.7, 0, 6.284); ctx.stroke(); }
    }
    ctx.fillStyle = "#8fa398"; ctx.font = `600 ${0.62}px system-ui, sans-serif`; ctx.textBaseline = "top";
    for (const z of site.zones) if (ctx.measureText(z.name).width <= z.w - 0.4) ctx.fillText(z.name, z.x + 0.3, z.y + 0.2);
    const f = run.frames[Math.min(i, n - 1)];
    for (let k = 0; k < f.x.length; k++) {
      const st = f.s[k];
      if (st === 2) continue;
      const a = run.agents[k];
      const sinOir = !a.heard && st === 0;
      ctx.fillStyle = sinOir ? C.rojo : st === 0 ? C.espera : st === 3 ? C.lento : C.ok;
      ctx.beginPath(); ctx.arc(f.x[k], f.y[k], 0.34, 0, 6.284); ctx.fill();
      ctx.strokeStyle = "#0a110d"; ctx.lineWidth = 1.4 * u; ctx.stroke();
      if (sinOir) { ctx.strokeStyle = C.rojo; ctx.lineWidth = 1.6 * u; ctx.beginPath(); ctx.arc(f.x[k], f.y[k], 0.75, 0, 6.284); ctx.stroke(); }
    }
    void W; void H;
  }, [site, run, formas, i, n]);

  useEffect(() => { dibujar(); }, [dibujar]);
  useEffect(() => {
    if (!jugando) return;
    const id = setInterval(() => setI((p) => { if (p >= n - 1) { setJugando(false); return p; } return Math.min(n - 1, p + 3); }), 60);
    return () => clearInterval(id);
  }, [jugando, n]);

  const f = run.frames[Math.min(i, n - 1)];
  return (
    <div>
      <canvas ref={cv} className="lienzo" width={site.cols * PX} height={site.rows * PX} role="img" aria-label={`Plano de ${site.name} con la simulación del desalojo. Tiempo ${fmt(f.t)}, ${f.out} de ${run.agents.length} personas afuera.`} />
      <div className="acciones" style={{ alignItems: "center" }}>
        <button type="button" className="btn chico" onClick={() => { if (i >= n - 1) setI(0); if (!jugando) registrar("plano_reproducido"); setJugando((j) => !j); }}>{jugando ? "Pausa" : i >= n - 1 ? "Repetir" : "Reproducir"}</button>
        <input type="range" min={0} max={n - 1} value={Math.min(i, n - 1)} onChange={(e) => { setJugando(false); setI(Number(e.target.value)); }} aria-label="Tiempo del simulacro simulado" style={{ flex: 1, minWidth: 140, minHeight: 0, padding: 0 }} />
        <span className="num chico" style={{ minWidth: 150 }}>{fmt(f.t)} · {f.out}/{run.agents.length} afuera</span>
      </div>
      <div className="leyenda">
        <span><i style={{ background: C.ok }} />en movimiento</span>
        <span><i style={{ background: C.lento }} />frenada por aglomeración</span>
        <span><i style={{ background: C.espera }} />esperando</span>
        <span><i style={{ background: C.rojo }} />sin oír la alarma (simulado)</span>
        <span><i style={{ background: "rgba(255,85,69,.5)", borderRadius: 2 }} />área sin margen de 15 dB</span>
      </div>
    </div>
  );
}
