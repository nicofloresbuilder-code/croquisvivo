"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { registrar } from "@/lib/eventos";

/** Registra una vista de página (solo la ruta, sin nada personal). */
export function Pista() {
  const ruta = usePathname();
  useEffect(() => { registrar("pagina_vista", { ruta }); }, [ruta]);
  return null;
}
