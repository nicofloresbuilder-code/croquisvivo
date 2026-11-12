"use client";
import { crearTabla } from "./tabla";
import { validarConversacion, type Conversacion } from "./precios/conversacion";

interface Fila { id: string; creada: string; rol: string; segmento: string; desconocido: boolean; tarea_hoy: string; quien_firma: string; costo_actual: string; precio_preguntado: number; resultado: string; cita: string; siguiente_paso: string }

/** Sin borrado a propósito: los rechazos también se conservan (condición 2 del Blueprint). */
export const conversaciones = crearTabla<Conversacion, Fila>({
  tabla: "conversaciones_precio", clave: "croquisvivo.conversaciones.v1",
  aFila: (c) => ({ id: c.id, creada: new Date(c.creada).toISOString(), rol: c.rol, segmento: c.segmento, desconocido: c.desconocido, tarea_hoy: c.tareaHoy, quien_firma: c.quienFirma, costo_actual: c.costoActual, precio_preguntado: c.precioPreguntado, resultado: c.resultado, cita: c.cita, siguiente_paso: c.siguientePaso }),
  deFila: (f) => ({ id: f.id, creada: new Date(f.creada).getTime(), rol: f.rol, segmento: f.segmento as "A" | "B", desconocido: f.desconocido, tareaHoy: f.tarea_hoy, quienFirma: f.quien_firma, costoActual: f.costo_actual, precioPreguntado: Number(f.precio_preguntado), resultado: f.resultado as Conversacion["resultado"], cita: f.cita, siguientePaso: f.siguiente_paso }),
  esValido: (x): x is Conversacion => validarConversacion(x as Record<string, unknown>).ok,
}, { borrable: false });
