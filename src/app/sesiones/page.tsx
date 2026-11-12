import Sesiones from "@/components/Sesiones";
import Conversaciones from "@/components/Conversaciones";

export const metadata = { title: "Libreta del observador · Croquis Vivo" };

export default function Pagina() {
  return (
    <>
      <Sesiones />
      <div className="marco"><Conversaciones /></div>
    </>
  );
}
