"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { registrar } from "@/lib/eventos";
import { datoPersonal, limpiarTexto, MAX_CITA } from "@/lib/sesion/validar";

/** Botón fijo "Se me atoró aquí": guarda la cita exacta, la ruta y la hora. */
export function BotonAtasco() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [txt, setTxt] = useState("");
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const s = limpiarTexto(txt);
    if (s.length < 5) { setError("Cuéntanos en una frase qué intentabas y qué pasó."); return; }
    if (s.length > MAX_CITA) { setError(`Máximo ${MAX_CITA} caracteres (llevas ${s.length}).`); return; }
    const dp = datoPersonal(s);
    if (dp) { setError(dp); return; }
    registrar("atasco", { cita: s, ruta });
    setError(""); setTxt(""); setListo(true);
  }
  function cerrar() { setAbierto(false); setListo(false); setError(""); }

  return (
    <div className="atasco">
      {!abierto && <button type="button" className="btn chico" onClick={() => setAbierto(true)} aria-haspopup="dialog">Se me atoró aquí</button>}
      {abierto && (
        <form className="panel" onSubmit={enviar} noValidate aria-label="Reportar un atasco">
          {listo ? (
            <>
              <p role="status"><strong>Gracias.</strong> Quedó anotado con la hora y la pantalla donde estabas.</p>
              <div className="acciones"><button type="button" className="btn sec chico" onClick={cerrar}>Cerrar</button></div>
            </>
          ) : (
            <>
              <label htmlFor="atasco-txt">¿Qué intentabas y qué pasó? Con tus palabras.</label>
              <textarea id="atasco-txt" value={txt} maxLength={MAX_CITA} onChange={(e) => setTxt(e.target.value)} placeholder="Ej. No encontré dónde cargar mi propio plano" />
              <p className="chico">{txt.length}/{MAX_CITA}. No escribas nombres, correos ni teléfonos.</p>
              {error && <p className="error" role="alert">{error}</p>}
              <div className="acciones">
                <button type="submit" className="btn chico">Guardar</button>
                <button type="button" className="btn sec chico" onClick={cerrar}>Cancelar</button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}
