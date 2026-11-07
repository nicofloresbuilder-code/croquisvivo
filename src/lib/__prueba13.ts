/** Pruebas de la libreta de sesiones. Correr: npx tsx src/lib/__prueba13.ts */
import { aCsv, comparacionConHoja, datoPersonal, fmtMmSs, pagaHoyResumen, parseMmSs, rankingDolores, reglaDeLaSemana, validarSesion, volverian, type Sesion } from "./sesion/validar";

let ok = 0, mal = 0;
function t(nombre: string, cond: boolean, extra?: unknown) {
  if (cond) ok++; else { mal++; console.log("MAL ", nombre, extra ?? ""); }
}
const base = { rol: "administrador_hospital", desconocido: true, modalidad: "remota", completoSolo: true, segundos: 150, errores: 1, atascos: ["No entiendo qué es una corrida"], problemaPrincipal: "No entiende qué es una corrida", gravedad: 4, pagaHoy: "sin dato", quienFirma: "Dirección administrativa", segundosHoja: null, volveria: false, pruebaVolver: "" };
const v = (o: object) => validarSesion({ ...base, ...o });
const mk = (o: Partial<Sesion>): Sesion => { const r = v(o as object); if (!r.ok) throw new Error(r.errores.join("; ")); return r.valor; };

// validación
t("una sesión válida pasa", v({}).ok);
t("rol fuera de la lista falla", !v({ rol: "presidente" }).ok);
t("sin saber si era desconocida falla", !v({ desconocido: undefined }).ok);
t("tiempo negativo falla", !v({ segundos: -1 }).ok);
t("tiempo de 3 horas falla", !v({ segundos: 7201 }).ok);
t("errores no entero falla", !v({ errores: 1.5 }).ok);
t("gravedad 0 falla", !v({ gravedad: 0 }).ok);
t("gravedad 6 falla", !v({ gravedad: 6 }).ok);
t("cita de 301 caracteres falla", !v({ atascos: ["a".repeat(301)] }).ok);
t("cita de 300 caracteres pasa", v({ atascos: ["a".repeat(300)] }).ok);
t("más de 10 atascos falla", !v({ atascos: Array.from({ length: 11 }, (_, i) => `x${i}`) }).ok);
t("atascos sin problema principal falla", !v({ problemaPrincipal: "" }).ok);
t("paga hoy vacío falla", !v({ pagaHoy: "   " }).ok);
t("sin dato es válido", v({ pagaHoy: "sin dato" }).ok);
t("quién firma vacío falla", !v({ quienFirma: "" }).ok);
t("tiempo con su hoja 0 falla", !v({ segundosHoja: 0 }).ok);
t("tiempo con su hoja vacío pasa", v({ segundosHoja: "" }).ok);

// datos personales
t("detecta correo", datoPersonal("escríbele a ana@correo.com") !== null);
t("detecta teléfono", datoPersonal("su cel es 55 1234 5678") !== null);
t("detecta enlace", datoPersonal("mira https://linkedin.com/in/x") !== null);
t("un texto normal pasa", datoPersonal("Dice que paga unos miles al año") === null);
t("correo en atasco se rechaza", !v({ atascos: ["mándame a x@y.com"] }).ok);
t("teléfono en quién firma se rechaza", !v({ quienFirma: "5512345678" }).ok);
t("limpia espacios y saltos", (() => { const r = v({ pagaHoy: "  mucho \n\n  dinero  " }); return r.ok && r.valor.pagaHoy === "mucho dinero"; })());

// tiempos
t("parse 2:30", parseMmSs("2:30") === 150);
t("parse 90", parseMmSs("90") === 90);
t("parse vacío", parseMmSs("") === null);
t("parse malo", parseMmSs("abc") === "mal" && parseMmSs("1:99") === "mal");
t("formato", fmtMmSs(150) === "2:30" && fmtMmSs(59) === "0:59");

// regla de la semana
const cinco = [mk({}), mk({}), mk({}), mk({ desconocido: false }), mk({ desconocido: false })];
t("5 sesiones con 3 desconocidas cumple", reglaDeLaSemana(cinco).cumple);
t("5 sesiones con 2 desconocidas no cumple", !reglaDeLaSemana([mk({}), mk({}), mk({ desconocido: false }), mk({ desconocido: false }), mk({ desconocido: false })]).cumple);
t("4 sesiones no cumple", !reglaDeLaSemana(cinco.slice(0, 4)).cumple && reglaDeLaSemana(cinco.slice(0, 4)).faltan === 1);

// ranking
const rk = rankingDolores([
  mk({ problemaPrincipal: "No entiende corrida", gravedad: 4 }),
  mk({ problemaPrincipal: "no entiende  CORRIDA!", gravedad: 2 }),
  mk({ problemaPrincipal: "No sabe cargar su croquis", gravedad: 5 }),
  mk({ problemaPrincipal: "Fecha límite", gravedad: 1 }),
  mk({ problemaPrincipal: "Letra chica", gravedad: 1 }),
]);
t("ranking agrupa problemas parecidos", rk[0].sesiones === 2 && rk[0].problema.toLowerCase().includes("corrida"), rk);
t("ranking ordena por puntos", rk[0].puntos >= rk[1].puntos && rk[1].puntos >= rk[2].puntos);
t("ranking da máximo 3", rk.length === 3);
t("ranking vacío si no hay problemas", rankingDolores([mk({ atascos: [], problemaPrincipal: "" })]).length === 0);

// comparación con la hoja
t("con 2 sesiones dice por medir", !comparacionConHoja([mk({ segundosHoja: 300 }), mk({ segundosHoja: 200 })]).medido);
const cmp = comparacionConHoja([mk({ segundos: 100, segundosHoja: 300 }), mk({ segundos: 100, segundosHoja: 200 }), mk({ segundos: 100, segundosHoja: 100 })]);
t("con 3 sesiones calcula mediana", cmp.medido && cmp.razon === 2, cmp);
t("si la herramienta es más lenta, lo dice", (() => { const c = comparacionConHoja([mk({ segundos: 300, segundosHoja: 100 }), mk({ segundos: 300, segundosHoja: 100 }), mk({ segundos: 300, segundosHoja: 100 })]); return c.medido && /tardó más/.test(c.texto); })());
t("el texto nunca dice 10x ni diez veces", !/10\s?[x×]|diez veces/i.test(cmp.texto));

// paga hoy y volverían
t("resumen de paga hoy", (() => { const r = pagaHoyResumen([mk({ pagaHoy: "sin dato" }), mk({ pagaHoy: "unos 8 mil al año a un tercero" })]); return r.conDato === 1 && r.sinDato === 1; })());
t("volverían sin prueba no cuenta como prueba", (() => { const r = volverian([mk({ volveria: true, pruebaVolver: "" }), mk({ volveria: true, pruebaVolver: "me escribió al otro día" })]); return r.dijeron === 2 && r.conPrueba === 1 && r.sinPrueba === 1; })());

// csv
const csv = aCsv([mk({ pagaHoy: "=HYPERLINK(\"x\")", problemaPrincipal: "dice \"hola\"" })]);
t("csv protege fórmulas", csv.includes("\"'=HYPERLINK"), csv);
t("csv escapa comillas", csv.includes('"dice ""hola"""'), csv);

console.log(`${ok} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
