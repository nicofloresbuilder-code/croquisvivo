import type { Metadata, Viewport } from "next";
import { Cabecera, Pie } from "@/components/Cabecera";
import "./globals.css";

export const metadata: Metadata = {
  title: "Croquis Vivo · compara lo que dice tu simulacro con lo que mide el modelo",
  description: "Compara el registro de un simulacro de evacuación contra una simulación de tu croquis, marca solo las brechas mayores que el error normal y asigna cada corrección a una persona. Ayuda para investigar, no certificación.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#07100b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>
        <a href="#contenido" className="oculto-lector">Saltar al contenido</a>
        <Cabecera />
        <main id="contenido">{children}</main>
        <Pie />
      </body>
    </html>
  );
}
