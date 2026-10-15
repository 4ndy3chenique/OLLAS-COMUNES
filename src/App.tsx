import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegistroOllaPage from "./pages/RegistroOllaPage";
import IntegrantesPage from "./pages/IntegrantesPage";
import ConfirmacionSolicitudPage from "./pages/ConfirmacionSolicitudPage";
import SeguimientoSolicitudPage from "./pages/SeguimientoSolicitudPage";
import AsignacionPage from "./pages/AsignacionPage";
import HistorialPage from "./pages/HistorialPage";
import NotificacionesPage from "./pages/NotificacionesPage";
import PerfilPage from "./pages/PerfilPage";

/**
 * Guardián que valida si el dirigente tiene registrada una olla.
 * Si no la tiene, lo redirige a /registro-olla (salvo que esté en el perfil).
 */
function VerificadorOlla({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (usuario && !usuario.olla_id && location.pathname !== "/registro-olla" && location.pathname !== "/perfil") {
    return <Navigate to="/registro-olla" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <VerificadorOlla>
                  <AppLayout />
                </VerificadorOlla>
              </ProtectedRoute>
            }
          >
            <Route path="/registro-olla" element={<RegistroOllaPage />} />
            <Route path="/integrantes" element={<IntegrantesPage />} />
            <Route path="/envio" element={<ConfirmacionSolicitudPage />} />
            <Route path="/seguimiento" element={<SeguimientoSolicitudPage />} />
            <Route path="/resultado" element={<AsignacionPage />} />
            <Route path="/historial" element={<HistorialPage />} />
            <Route path="/notificaciones" element={<NotificacionesPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/seguimiento" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
