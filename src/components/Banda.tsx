import type { Brecha } from "@/lib/motor/conjunto";

const ETIQUETA: Record<Brecha["estado"], string> = { brecha: "Brecha", dentro_margen: "Dentro del margen", indeterminado: "Indeterminado", sin_dato: "Sin dato" };

export function Estado({ e }: { e: Brecha["estado"] }) {
  return <span className={`estado ${e}`}>{ETIQUETA[e]}</span>;
}

export function Banda({ b }: { b: Brecha }) {
  if (!b.banda) return null;
  const { min, max, afirmado, unidad } = b.banda;
  const lo = Math.min(0, min, afirmado), hi = Math.max(unidad === "%" ? 100 : max * 1.15, afirmado * 1.08, max);
  const pos = (v: number) => `${Math.max(0, Math.min(100, ((v - lo) / (hi - lo || 1)) * 100))}%`;
  const etiqueta = (v: number) => (unidad === "%" ? `${Math.round(v)}%` : `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, "0")}`);
  return (
    <div>
      <div className="banda" role="img" aria-label={`Rango del modelo de ${etiqueta(min)} a ${etiqueta(max)}; el registro dice ${etiqueta(afirmado)}`}>
        <div className="rango" style={{ left: pos(min), width: `calc(${pos(max)} - ${pos(min)})`, minWidth: 4 }} />
        <div className="marca-af" style={{ left: `calc(${pos(afirmado)} - 2px)` }} />
      </div>
      <div className="banda-leyenda"><span>{etiqueta(lo)}</span><span>verde: rango del modelo · amarillo: lo que dice el registro</span><span>{etiqueta(hi)}</span></div>
    </div>
  );
}
