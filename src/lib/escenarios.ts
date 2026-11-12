"use client";
import { crearTabla } from "./tabla";
import { validarEscenario, type Escenario } from "./precios/modelo";

interface Fila { id: string; creada: string; nombre: string; segmento: string; alcanzados: number; conversion_pct: number; precio_anual: number; costo_entrega_anual: number | null; costo_actual_anual: number | null; costo_fijo_mensual: number }

export const escenarios = crearTabla<Escenario, Fila>({
  tabla: "escenarios", clave: "croquisvivo.escenarios.v1",
  aFila: (e) => ({ id: e.id, creada: new Date(e.creada).toISOString(), nombre: e.nombre, segmento: e.segmento, alcanzados: e.alcanzados, conversion_pct: e.conversionPct, precio_anual: e.precioAnual, costo_entrega_anual: e.costoEntregaAnual, costo_actual_anual: e.costoActualAnual, costo_fijo_mensual: e.costoFijoMensual }),
  deFila: (f) => ({ id: f.id, creada: new Date(f.creada).getTime(), nombre: f.nombre, segmento: f.segmento as "A" | "B", alcanzados: f.alcanzados, conversionPct: Number(f.conversion_pct), precioAnual: Number(f.precio_anual), costoEntregaAnual: f.costo_entrega_anual == null ? null : Number(f.costo_entrega_anual), costoActualAnual: f.costo_actual_anual == null ? null : Number(f.costo_actual_anual), costoFijoMensual: Number(f.costo_fijo_mensual) }),
  esValido: (x): x is Escenario => validarEscenario(x as Record<string, unknown>).ok,
}, { borrable: true });
