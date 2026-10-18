import { NavLink } from "react-router-dom";
import { Icono } from "../ui/Icono";
import { DESTINOS } from "./navegacion";

/** Barra inferior móvil (pensada para el pulgar). */
export function BottomNav({ sinLeer }: { sinLeer: number }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {DESTINOS.filter((d) => !d.soloLateral).map((d) => (
        <NavLink
          key={d.to}
          to={d.to}
          className={({ isActive }) =>
            `relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
              isActive ? "text-primary-dark" : "text-muted"
            }`
          }
        >
          <Icono nombre={d.icono} className="h-6 w-6" />
          {d.etiqueta}
          {d.conContador && sinLeer > 0 && (
            <span className="absolute right-1/4 top-1.5 min-w-5 rounded-full bg-danger px-1 text-center text-xs font-semibold leading-5 text-white">
              <span className="sr-only">{sinLeer} sin leer</span>
              <span aria-hidden>{sinLeer}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
