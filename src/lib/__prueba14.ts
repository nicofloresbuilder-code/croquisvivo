/** Pruebas de la lógica de precios y de las conversaciones. Correr: npx tsx src/lib/__prueba14.ts */
import { escenariosACsv, parseNumero, proyectar, sensibilidad, validarEscenario, SEGMENTOS, type Escenario } from "./precios/modelo";
import { conversacionesACsv, resumen, validarConversacion } from "./precios/conversacion";

let ok = 0, mal = 0;
function t(nombre: string, cond: boolean, extra?: unknown) { if (cond) ok++; else { mal++; console.log("MAL ", nombre, extra ?? ""); } }

// parseo
t("parseNumero 3,000", parseNumero("3,000") === 3000);
t("parseNumero con $ y espacios", parseNumero(" $ 12 500 ") === 12500);
t("parseNumero vacío es null", parseNumero("") === null);
t("parseNumero con letras es NaN", Number.isNaN(parseNumero("tres mil") as number));
t("parseNumero negativo es NaN", Number.isNaN(parseNumero("-5") as number));

// proyección con cuentas hechas a mano
const base = { alcanzados: 200, conversionPct: 5, precioAnual: 3000, costoEntregaAnual: null, costoActualAnual: null, costoFijoMensual: 0 };
const a = proyectar(base);
t("pagantes 200×5% = 10", a.pagantes === 10, a);
t("ingreso anual 10×3000 = 30000", a.ingresoAnual === 30000);
t("ingreso mensual 2500", a.ingresoMensual === 2500);
t("sin costo de entrega, el margen es null", a.margenAnual === null);
t("sin costo actual, la razón es null (por medir)", a.razon === null && a.cumpleRazon === null);
t("costo actual necesario = precio × 10", a.costoActualNecesario === 30000);
const b = proyectar({ ...base, costoEntregaAnual: 1000, costoFijoMensual: 1000 });
t("margen = 30000 − 10×1000 − 12000 = 8000", b.margenAnual === 8000, b);
t("equilibrio = ceil(12000 / 2000) = 6", b.equilibrioPagantes === 6, b);
t("fijo 0 da equilibrio 0", proyectar({ ...base, costoEntregaAnual: 500 }).equilibrioPagantes === 0);
t("contribución ≤ 0 no tiene equilibrio", proyectar({ ...base, costoEntregaAnual: 3000, costoFijoMensual: 100 }).equilibrioPagantes === null);
t("razón 45000/3000 = 15 cumple", (() => { const r = proyectar({ ...base, costoActualAnual: 45000 }); return r.razon === 15 && r.cumpleRazon === true; })());
t("razón 20000/3000 = 6.67 no cumple", (() => { const r = proyectar({ ...base, costoActualAnual: 20000 }); return r.razon === 6.67 && r.cumpleRazon === false; })());
t("razón con precio 0 es null", proyectar({ ...base, precioAnual: 0, costoActualAnual: 1000 }).razon === null);
t("0 alcanzados da 0 pagantes", proyectar({ ...base, alcanzados: 0 }).ingresoAnual === 0);
t("redondeo: 7 × 10% = 0.7 → 1 pagante", proyectar({ ...base, alcanzados: 7, conversionPct: 10 }).pagantes === 1);

// validación
const raw = { nombre: "Escuelas, conversión baja", segmento: "A", alcanzados: "200", conversionPct: "5", precioAnual: "3,000", costoEntregaAnual: "", costoActualAnual: "", costoFijoMensual: "0" };
const v = validarEscenario(raw, 1000);
t("escenario válido", v.ok, v);
t("opcionales vacíos quedan null", v.ok && v.valor.costoEntregaAnual === null && v.valor.costoActualAnual === null);
t("precio con coma se lee", v.ok && v.valor.precioAnual === 3000);
const mala = (o: object) => validarEscenario({ ...raw, ...o } as never);
t("nombre vacío rechazado", !mala({ nombre: "   " }).ok);
t("nombre con correo rechazado", !mala({ nombre: "a nico@correo.com" }).ok);
t("nombre muy largo rechazado", !mala({ nombre: "x".repeat(61) }).ok);
t("segmento C rechazado", !mala({ segmento: "C" }).ok);
t("conversión 101 rechazada", !mala({ conversionPct: "101" }).ok);
t("conversión negativa rechazada", !mala({ conversionPct: "-1" }).ok);
t("inmuebles con decimales rechazados", !mala({ alcanzados: "10.5" }).ok);
t("inmuebles 1,000,001 rechazados", !mala({ alcanzados: "1000001" }).ok);
t("precio con letras rechazado", !mala({ precioAnual: "tres mil" }).ok);
t("costo de entrega negativo rechazado", !mala({ costoEntregaAnual: "-5" }).ok);
t("varios errores se juntan", (() => { const r = mala({ nombre: "", conversionPct: "999", precioAnual: "x" }); return !r.ok && r.errores.length === 3; })());
t("los segmentos traen precio de prueba", SEGMENTOS[0].precioPrueba === 3000 && SEGMENTOS[1].precioPrueba === 9000);
const sens = sensibilidad(v.ok ? v.valor : (null as unknown as Escenario));
t("sensibilidad al 1% da 2 pagantes y al 20% da 40", sens[0].pagantes === 2 && sens[4].pagantes === 40, sens);
t("CSV protege fórmulas en el nombre", (() => { const r = validarEscenario({ ...raw, nombre: "=1+1" } as never); return r.ok && escenariosACsv([r.valor]).includes(`"'=1+1"`); })());
t("CSV dice por medir", v.ok && escenariosACsv([v.valor]).includes("por medir"));

// conversaciones
const c0 = { rol: "director_escuela", segmento: "A", desconocido: true, tareaHoy: "Cuenta alumnos con cronómetro y firma una hoja", quienFirma: "Dirección", costoActual: "sin dato", precioPreguntado: 3000, resultado: "interes_dicho", cita: "Se ve bien, lo platico con la dueña", siguientePaso: "Llamar el lunes" };
const cv = (o: object) => validarConversacion({ ...c0, ...o } as never, 5);
t("conversación válida", cv({}).ok);
t("rol inválido rechazado", !cv({ rol: "mago" }).ok);
t("resultado inválido rechazado", !cv({ resultado: "tal vez" }).ok);
t("precio 0 rechazado", !cv({ precioPreguntado: 0 }).ok);
t("precio con comas se lee", (() => { const r = cv({ precioPreguntado: "9,000" }); return r.ok && r.valor.precioPreguntado === 9000; })());
t("cita con teléfono rechazada", !cv({ cita: "llámame al 55 1234 5678" }).ok);
t("cita vacía rechazada", !cv({ cita: "" }).ok);
t("compromiso sin prueba rechazado", !cv({ resultado: "compromiso_firmado", siguientePaso: "ok" }).ok);
t("compromiso con prueba aceptado", cv({ resultado: "compromiso_firmado", siguientePaso: "Carta de intención firmada el viernes" }).ok);
t("desconocido debe ser sí o no", !cv({ desconocido: "sí" }).ok);
const mk = (o: object) => { const r = cv(o); if (!r.ok) throw new Error(r.errores.join(";")); return r.valor; };
const lista = [mk({ resultado: "rechazo" }), mk({ resultado: "interes_dicho" }), mk({ resultado: "interes_dicho", desconocido: false }), mk({ resultado: "pidio_propuesta" }), mk({ resultado: "compromiso_firmado", siguientePaso: "Carta firmada el viernes" })];
const r = resumen(lista);
t("resumen cuenta cada resultado aparte", r.rechazo === 1 && r.interes_dicho === 2 && r.pidio_propuesta === 1 && r.compromiso_firmado === 1 && r.pago_hecho === 0, r);
t("interés dicho NO cuenta como demanda", r.demandaComprobada === 1, r);
t("sin conversaciones no hay demanda", resumen([]).demandaComprobada === 0);
t("resumen cuenta desconocidos y sin costo", r.desconocidos === 4 && r.sinCostoActual === 5, r);
t("CSV de conversaciones protege fórmulas", conversacionesACsv([mk({ cita: "=SUMA(1)" })]).includes(`"'=SUMA(1)"`));

console.log(`${ok} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
