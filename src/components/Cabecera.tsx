import Link from "next/link";
import { Logo } from "./Marca";

export function Cabecera() {
  return (
    <header className="barra">
      <div className="marco">
        <Link href="/" className="marca" aria-label="Croquis Vivo, inicio">
          <Logo />
          <b>Croquis Vivo</b>
        </Link>
        <nav className="enlaces" aria-label="Principal">
          <Link href="/product">Producto</Link>
          <Link href="/about">Por qué existe</Link>
          <Link href="/condiciones">Condiciones</Link>
          <Link href="/herramienta" className="cta">Abrir la herramienta</Link>
        </nav>
      </div>
    </header>
  );
}

export function Pie() {
  return (
    <footer className="pie">
      <div className="marco">
        <p>
          Croquis Vivo es un prototipo de proyecto de clase. <strong>No es una certificación</strong> ni sustituye la validación de Protección Civil. Todo lo que sale de la simulación está marcado como <em>simulado</em>; ningún resultado simulado se presenta como verificado en la realidad. Los croquis y las personas de la demostración son inventados.
        </p>
        <p>
          <Link href="/condiciones">Cómo cuida el producto sus propias reglas</Link> · Los datos de los casos se guardan sin datos personales.
        </p>
      </div>
    </footer>
  );
}
