import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Icono } from "../ui/Icono";

const ENLACES = [
  { href: "#que-es", etiqueta: "El programa" },
  { href: "#proceso", etiqueta: "Proceso" },
  { href: "#requisitos", etiqueta: "Requisitos" },
  { href: "#transparencia", etiqueta: "Transparencia" },
  { href: "#faq", etiqueta: "Preguntas" },
];

export function HeaderPublico() {
  const { usuario } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-primary-dark" onClick={cerrarMenu}>
          <img src="/favicon.svg" alt="" width={32} height={32} className="h-8 w-8" />
          Ollas Comunes
        </Link>

        <nav aria-label="Secciones" className="hidden gap-1 lg:flex">
          {ENLACES.map((e) => (
            <a key={e.href} href={e.href} className="toque flex items-center rounded px-3 text-sm font-medium text-muted hover:bg-bg hover:text-ink">
              {e.etiqueta}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {usuario ? (
            <Link to="/app/seguimiento" className="btn-primary h-11 px-4 text-sm">Ir a mi panel</Link>
          ) : (
            <>
              <Link to="/?auth=login" className="btn-secondary hidden h-11 px-4 text-sm sm:inline-flex">Iniciar sesión</Link>
              <Link to="/?auth=registro" className="btn-primary hidden h-11 px-4 text-sm sm:inline-flex">Registrarse</Link>
            </>
          )}
          <button
            type="button"
            className="toque flex items-center justify-center rounded text-ink hover:bg-bg lg:hidden"
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            onClick={() => setMenuAbierto((v) => !v)}
          >
            <Icono nombre={menuAbierto ? "cerrar" : "menu"} titulo={menuAbierto ? "Cerrar menú" : "Abrir menú"} />
          </button>
        </div>
      </div>

      {menuAbierto && (
        <nav id="menu-movil" aria-label="Menú móvil" className="absolute inset-x-0 top-full border-b border-border bg-surface px-4 pb-4 shadow-sm lg:hidden">
          <ul className="flex flex-col">
            {ENLACES.map((e) => (
              <li key={e.href}>
                <a href={e.href} onClick={cerrarMenu} className="toque flex items-center border-b border-border py-3 text-base text-ink">
                  {e.etiqueta}
                </a>
              </li>
            ))}
          </ul>
          {!usuario && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/?auth=login" onClick={cerrarMenu} className="btn-secondary">Iniciar sesión</Link>
              <Link to="/?auth=registro" onClick={cerrarMenu} className="btn-primary">Registrarse</Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
