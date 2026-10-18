import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Notificacion } from "../../types";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";
import { Icono } from "../ui/Icono";

/** Evento que emiten las vistas cuando cambia el estado de lectura de las notificaciones. */
export const EVENTO_NOTIFICACIONES = "notificaciones-actualizadas";

/** Cantidad de notificaciones sin leer; se refresca al navegar y al marcar una como leída. */
function useSinLeer(): number {
  const [sinLeer, setSinLeer] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    let vigente = true;
    const cargar = () =>
      api
        .get<Notificacion[]>("/notificaciones")
        .then((n) => vigente && setSinLeer(n.filter((x) => !x.leida).length))
        .catch(() => undefined); // el contador es accesorio: un fallo no debe molestar
    void cargar();
    window.addEventListener(EVENTO_NOTIFICACIONES, cargar);
    return () => {
      vigente = false;
      window.removeEventListener(EVENTO_NOTIFICACIONES, cargar);
    };
  }, [pathname]);

  return sinLeer;
}

export function AppLayout() {
  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const sinLeer = useSinLeer();

  useEffect(() => {
    const actualizar = () => setEnLinea(navigator.onLine);
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <a href="#contenido-app" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-4 focus:py-2">
        Saltar al contenido
      </a>
      <SideNav sinLeer={sinLeer} />

      <div className="lg:pl-64">
        {!enLinea && (
          <div role="status" className="flex items-center justify-center gap-2 border-b border-accent-light bg-accent-light px-4 py-2 text-center text-sm text-accent-dark">
            <Icono nombre="wifiOff" />
            Sin conexión. Revisa tu internet: los cambios no se guardarán hasta que vuelvas a conectarte.
          </div>
        )}
        <main id="contenido-app" className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <BottomNav sinLeer={sinLeer} />
    </div>
  );
}
