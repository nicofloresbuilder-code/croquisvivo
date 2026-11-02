/* Autoprueba del motor de Croquis Vivo. Ejecutar: npx tsx src/lib/__prueba.ts */
import { asignar, aplicarAlModelo, confirmarReal, revertir, fechaValida, limpiarTexto } from "./motor/acciones";
import type { Accion } from "./motor/acciones";
import { calibrar, compararAfirmacion, correrConjunto, evidencias, rango } from "./motor/conjunto";
import { aplicarFix, simulate } from "./motor/nucleo";
import { PRESETS } from "./motor/sitios";
import { afirmacionPorDefecto, crearCaso, derivar, limpiarAfirmacion, sincronizarAcciones } from "./motor/caso";

let ok = 0, mal = 0;
function t(nombre: string, cond: boolean, extra = "") { if (cond) ok++; else mal++; console.log((cond ? "OK   " : "MAL  ") + nombre + (extra ? "  " + extra : "")); }

// rangos
const r = rango([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
t("rango: mediana y extremos", r.mediana === 5.5 && r.min === 1 && r.max === 10 && r.p10 < r.p90);

// determinismo del motor
const h1 = PRESETS.hospital(), h2 = PRESETS.hospital();
const a = simulate(h1, 2026, { frames: false }), b = simulate(h2, 2026, { frames: false });
t("misma semilla, mismo resultado", a.tLast === b.tLast && a.evacuated === b.evacuated);
const c1 = correrConjunto(PRESETS.hospital()), c2 = correrConjunto(PRESETS.hospital());
t("conjunto determinista", JSON.stringify(c1) === JSON.stringify(c2));
t("conjunto: 24 corridas y banda ordenada", c1.n === 24 && c1.tUltima.p10 <= c1.tUltima.mediana && c1.tUltima.mediana <= c1.tUltima.p90);
console.log("   hospital:", JSON.stringify({ presentes: c1.presentes, fr: c1.fraccionSalida, t: c1.tUltima, oirSeg: c1.sinOirSeguro, oirPos: c1.sinOirPosible, oirFijo: c1.sinOirFijo }));

// comparación en el hospital (hay una máquina ruidosa en Rayos X y estorbo)
const af = afirmacionPorDefecto("hospital");
const br = compararAfirmacion(af, c1);
console.log("   brechas:", br.map((x) => `${x.id}:${x.estado}`).join(" "));
t("hospital: la afirmación 'se oyó en todas partes' produce brecha", br.find((x) => x.id === "alarma")?.estado === "brecha");
t("ninguna conclusión dice 'seguro' ni 'verificado'", br.every((x) => !/seguro\b|verificad/i.test(x.conclusion.replace(/no prueba que el desalojo sea seguro/i, ""))));

// una afirmación dentro de la banda no produce brecha de tiempo
const dentro = compararAfirmacion({ ...af, tiempoSeg: Math.round(c1.tUltima.mediana), alarmaTodas: false }, c1);
t("tiempo dentro de la banda: dentro del margen", dentro.find((x) => x.id === "tiempo")?.estado === "dentro_margen");
const fuera = compararAfirmacion({ ...af, tiempoSeg: Math.max(10, Math.round(c1.tUltima.p10) - 40) }, c1);
t("tiempo mucho más corto que la banda: brecha", fuera.find((x) => x.id === "tiempo")?.estado === "brecha");
const sinT = compararAfirmacion({ ...af, tiempoSeg: null }, c1);
t("sin tiempo en el registro: sin dato, no brecha", sinT.find((x) => x.id === "tiempo")?.estado === "sin_dato");

// con más margen acústico, una brecha puede volverse indeterminada pero nunca "verificada"
const cGrande = correrConjunto(PRESETS.hospital(), 24, 2026, 40);
t("incertidumbre enorme: alarma indeterminada o dentro, no brecha", compararAfirmacion(af, cGrande).find((x) => x.id === "alarma")?.estado !== "brecha");

// caso y correcciones
let caso = crearCaso("hospital", "Prueba", 1);
const d0 = derivar(caso);
caso = sincronizarAcciones(caso, d0.hallazgos);
t("hallazgos del hospital generan acciones propuestas", caso.acciones.length >= 1 && caso.acciones.every((x) => x.estado === "propuesta"));
console.log("   acciones:", caso.acciones.map((x) => x.fixId).join(", "));
t("sincronizar no duplica", sincronizarAcciones(caso, d0.hallazgos).acciones.length === caso.acciones.length);

// aplicar todas las correcciones reduce la brecha de alarma y las personas sin oír
const sitio2 = PRESETS.hospital();
for (const ac of caso.acciones) aplicarFix(sitio2, ac.fixId);
const c3 = correrConjunto(sitio2);
t("tras corregir: menos personas sin oír con margen claro", c3.sinOirSeguro < c1.sinOirSeguro, `(${c1.sinOirSeguro} -> ${c3.sinOirSeguro})`);
t("aplicarFix con id inexistente devuelve false", aplicarFix(PRESETS.hospital(), "altavoz:Zona que no existe") === false);

// máquina de estados de acciones
let ac0: Accion = { ...caso.acciones[0] };
t("no se aplica sin responsable", !aplicarAlModelo(ac0).ok);
t("asignar exige nombre", !asignar(ac0, " ", "2026-11-20").ok);
t("asignar exige fecha válida", !asignar(ac0, "Ana", "2026-02-31").ok && !asignar(ac0, "Ana", "mañana").ok);
const asg = asignar(ac0, "  Ana   López ", "2026-11-20");
t("asignar normaliza el nombre", asg.ok && asg.valor.responsable === "Ana López" && asg.valor.estado === "asignada");
if (asg.ok) {
  const apl = aplicarAlModelo(asg.valor);
  t("aplicar al modelo", apl.ok && apl.valor.estado === "aplicada_modelo");
  t("no se confirma sin simulacro real", !confirmarReal(asg.valor, "2026-12-01", "Se probó la alarma en rayos X", 150).ok);
  if (apl.ok) {
    t("confirmar exige nota", !confirmarReal(apl.valor, "2026-12-01", "ok", 150).ok);
    t("confirmar exige tiempo razonable", !confirmarReal(apl.valor, "2026-12-01", "Se probó la alarma en rayos X", 5).ok);
    const cf = confirmarReal(apl.valor, "2026-12-01", "Se probó la alarma en rayos X y se oyó", 150);
    t("confirmar con simulacro real", cf.ok && cf.valor.estado === "confirmada_real" && cf.valor.real?.tiempoSeg === 150);
    t("revertir una aplicada vuelve a asignada", revertir(apl.valor).ok);
    t("no se revierte una confirmada", cf.ok && !revertir(cf.valor).ok);
  }
}

// validaciones
t("fecha válida", fechaValida("2026-11-02") && !fechaValida("2026-13-01") && !fechaValida("02/11/2026"));
t("limpiarTexto quita controles y recorta", limpiarTexto("a\u0000b\n\n c ".repeat(3), 5).length <= 5 && !/[\u0000-\u001f]/.test(limpiarTexto("a\u0000b\nc", 50)));
t("afirmación inválida: más salieron que presentes", !limpiarAfirmacion({ personas: 10, evacuaron: 11, tiempoSeg: 60, alarmaTodas: true }).ok);
t("afirmación inválida: tiempo absurdo", !limpiarAfirmacion({ personas: 10, evacuaron: 10, tiempoSeg: 5, alarmaTodas: true }).ok);
t("afirmación válida", limpiarAfirmacion({ personas: 10, evacuaron: 9, tiempoSeg: null, alarmaTodas: false }).ok);

// calibración y evidencia
t("sin simulacro real: modelo no calibrado", calibrar(undefined, c1).estado === "sin_dato");
t("tiempo real dentro de banda: dentro, con aviso de un solo simulacro", calibrar({ tiempoSeg: Math.round(c1.tUltima.mediana) }, c1).texto.includes("Un solo simulacro"));
t("tiempo real fuera de banda: fuera", calibrar({ tiempoSeg: Math.round(c1.tUltima.p90) + 120 }, c1).estado === "fuera");
const ev = evidencias(af, undefined);
t("evidencia: hay faltantes, no verificados y simulados; ningún observado sin captura", ev.some((e) => e.clase === "faltante") && ev.some((e) => e.clase === "no_verificado") && ev.some((e) => e.clase === "simulado") && !ev.some((e) => e.clase === "observado"));
t("evidencia: con tiempo real capturado aparece observado", evidencias(af, { tiempoSeg: 200 }).some((e) => e.clase === "observado"));

// escuela
const ce = correrConjunto(PRESETS.escuela());
t("escuela: corre y sale gente", ce.presentes > 0 && ce.fraccionSalida.mediana > 0);
console.log(`\n${ok} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
