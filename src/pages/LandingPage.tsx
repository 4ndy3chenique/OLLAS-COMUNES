import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HeaderPublico } from "../components/landing/HeaderPublico";
import { Hero } from "../components/landing/Hero";
import { SeccionFAQ, SeccionProceso, SeccionQueEs, SeccionRequisitos, SeccionTransparencia } from "../components/landing/Secciones";
import { FooterPublico } from "../components/landing/FooterPublico";
// El modal (React Hook Form + Zod) se descarga solo cuando alguien lo abre: la landing carga más liviana
const AuthModal = lazy(() => import("../components/auth/AuthModal").then((m) => ({ default: m.AuthModal })));

/** Entrada pública: información del programa + autenticación por modales (/?auth=login | registro). */
export default function LandingPage() {
  const [params] = useSearchParams();
  const pedido = params.get("auth") !== null;
  const [modalCargado, setModalCargado] = useState(pedido);

  // Una vez descargado se queda montado, para que el cierre devuelva el foco al botón que lo abrió
  useEffect(() => {
    if (pedido) setModalCargado(true);
  }, [pedido]);

  return (
    <div className="min-h-screen bg-bg">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-4 focus:py-2">
        Saltar al contenido
      </a>
      <HeaderPublico />
      <main id="contenido">
        <Hero />
        <SeccionQueEs />
        <SeccionProceso />
        <SeccionRequisitos />
        <SeccionTransparencia />
        <SeccionFAQ />
      </main>
      <FooterPublico />
      {modalCargado && (
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
      )}
    </div>
  );
}
