import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Icono } from "../ui/Icono";
import { DESTINOS } from "./navegacion";

/** Barra lateral fija (escritorio, lg+). */
export function SideNav({ sinLeer }: { sinLeer: number }) {
  const { usuario, logout } = useAuth();

  return (
    <aside className="hidden border-r border-border bg-surface lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
      <Link to="/" className="flex h-16 items-center gap-2 border-b border-border px-5 text-lg font-semibold text-primary-dark">
        <img src="/favicon.svg" alt="" width={32} height={32} className="h-8 w-8" />
        Ollas Comunes
      </Link>

      <nav aria-label="Principal" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {DESTINOS.map((d) => (
          <NavLink
            key={d.to}
            to={d.to}
            className={({ isActive }) =>
              `toque flex items-center gap-3 rounded px-3 text-sm font-medium transition-colors ${
                isActive ? "bg-primary-light text-primary-dark" : "text-muted hover:bg-bg hover:text-ink"
              }`
            }
          >
            <Icono nombre={d.icono} />
            <span className="flex-1">{d.etiqueta}</span>
            {d.conContador && sinLeer > 0 && (
              <span className="rounded-full bg-danger px-2 text-xs font-semibold leading-5 text-white">
                <span className="sr-only">{sinLeer} sin leer</span>
                <span aria-hidden>{sinLeer}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <p className="truncate text-sm font-medium text-ink">
          {usuario?.nombres} {usuario?.apellidos}
        </p>
        <p className="truncate text-xs text-muted">{usuario?.email}</p>
        <button onClick={logout} className="toque mt-2 flex items-center gap-2 text-sm font-medium text-danger hover:underline">
          <Icono nombre="salir" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
