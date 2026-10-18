import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-muted">Cargando…</p>
      </div>
    );
  }

  // Sin sesión: se abre el modal de ingreso y, tras entrar, se vuelve a la ruta que se pedía
  if (!usuario) {
    return <Navigate to="/?auth=login" replace state={{ desde: location.pathname }} />;
  }

  return <>{children}</>;
}
