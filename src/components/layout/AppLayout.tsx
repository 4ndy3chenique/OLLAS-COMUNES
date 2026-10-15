import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavBar } from "./NavBar";

export function AppLayout() {
  const [enLinea, setEnLinea] = useState(navigator.onLine);

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
      <NavBar />

      {!enLinea && (
        <div className="border-b border-accent-light bg-accent-light px-4 py-2 text-center text-sm text-accent">
          Sin conexión. Revisa tu internet: los cambios no se guardarán hasta que vuelvas a conectarte.
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:pb-10">
        <Outlet />
      </main>
    </div>
  );
}
