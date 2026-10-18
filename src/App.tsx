import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { OPERATIVO_HABILITADO } from "./components/layout/navegacion";
import LandingPage from "./pages/LandingPage"; // eager: es la entrada

const RegistroOllaPage = lazy(() => import("./pages/app/RegistroOllaPage"));
const IntegrantesPage = lazy(() => import("./pages/app/IntegrantesPage"));
const ConfirmacionSolicitudPage = lazy(() => import("./pages/app/ConfirmacionSolicitudPage"));
const SeguimientoSolicitudPage = lazy(() => import("./pages/app/SeguimientoSolicitudPage"));
const AsignacionPage = lazy(() => import("./pages/app/AsignacionPage"));
const HistorialPage = lazy(() => import("./pages/app/HistorialPage"));
const NotificacionesPage = lazy(() => import("./pages/app/NotificacionesPage"));
const PerfilPage = lazy(() => import("./pages/app/PerfilPage"));
const PadronPage = lazy(() => import("./pages/operativo/PadronPage"));
const EscaneoPage = lazy(() => import("./pages/operativo/EscaneoPage"));

/**
 * Guardián que valida si el dirigente tiene registrada una olla.
 * Si no la tiene, lo redirige a /app/olla (salvo que esté en el perfil).
 */
function VerificadorOlla({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const location = useLocation();

  const exento = location.pathname === "/app/olla" || location.pathname === "/app/perfil" || location.pathname.startsWith("/operativo");
  if (usuario && !usuario.olla_id && !exento) {
    return <Navigate to="/app/olla" replace />;
  }

  return <>{children}</>;
}

function CargandoVista() {
  return <p className="text-muted" role="status">Cargando…</p>;
}

/** Rutas planas anteriores → rutas /app/*, para que los enlaces antiguos sigan funcionando. */
const REDIRECTS_LEGACY: [string, string][] = [
  ["/registro-olla", "/app/olla"],
  ["/integrantes", "/app/integrantes"],
  ["/envio", "/app/envio"],
  ["/seguimiento", "/app/seguimiento"],
  ["/resultado", "/app/resultado"],
  ["/historial", "/app/historial"],
  ["/notificaciones", "/app/notificaciones"],
  ["/perfil", "/app/perfil"],
  ["/login", "/?auth=login"],
];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <VerificadorOlla>
                  <AppLayout />
                </VerificadorOlla>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="seguimiento" replace />} />
            <Route path="olla" element={<Suspense fallback={<CargandoVista />}><RegistroOllaPage /></Suspense>} />
            <Route path="integrantes" element={<Suspense fallback={<CargandoVista />}><IntegrantesPage /></Suspense>} />
            <Route path="envio" element={<Suspense fallback={<CargandoVista />}><ConfirmacionSolicitudPage /></Suspense>} />
            <Route path="seguimiento" element={<Suspense fallback={<CargandoVista />}><SeguimientoSolicitudPage /></Suspense>} />
            <Route path="resultado" element={<Suspense fallback={<CargandoVista />}><AsignacionPage /></Suspense>} />
            <Route path="historial" element={<Suspense fallback={<CargandoVista />}><HistorialPage /></Suspense>} />
            <Route path="notificaciones" element={<Suspense fallback={<CargandoVista />}><NotificacionesPage /></Suspense>} />
            <Route path="perfil" element={<Suspense fallback={<CargandoVista />}><PerfilPage /></Suspense>} />
          </Route>

          {OPERATIVO_HABILITADO && (
            <Route
              path="/operativo"
              element={
                <ProtectedRoute>
                  <VerificadorOlla>
                    <AppLayout />
                  </VerificadorOlla>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="padron" replace />} />
              <Route path="padron" element={<Suspense fallback={<CargandoVista />}><PadronPage /></Suspense>} />
              <Route path="escaneo" element={<Suspense fallback={<CargandoVista />}><EscaneoPage /></Suspense>} />
            </Route>
          )}

          {REDIRECTS_LEGACY.map(([desde, hacia]) => (
            <Route key={desde} path={desde} element={<Navigate to={hacia} replace />} />
          ))}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
