import { useState, type KeyboardEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Modal } from "../ui/Modal";
import { Icono } from "../ui/Icono";
import { ModalLogin } from "./ModalLogin";
import { ModalRegistro } from "./ModalRegistro";

type Modo = "login" | "registro";
const TABS: { modo: Modo; etiqueta: string }[] = [
  { modo: "login", etiqueta: "Ingresar" },
  { modo: "registro", etiqueta: "Crear cuenta" },
];

/**
 * Modal de autenticación controlado por la URL (/?auth=login | /?auth=registro): se puede enlazar
 * directamente y el botón "atrás" lo cierra. Conmutar de pestaña conserva el DNI ya escrito.
 */
export function AuthModal() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [borrador, setBorrador] = useState({ identificador: "", dni: "" });

  const valor = params.get("auth");
  const modo: Modo | null = valor === "login" || valor === "registro" ? valor : null;

  function cerrar() {
    if (!params.get("auth")) return; // ya cerrado (p. ej. por el botón "atrás")
    setParams({});
  }

  function cambiarA(nuevo: Modo) {
    // El DNI escrito pasa de un formulario al otro
    if (nuevo === "registro" && /^\d{1,8}$/.test(borrador.identificador)) {
      setBorrador((b) => ({ ...b, dni: b.identificador }));
    }
    if (nuevo === "login" && borrador.dni) setBorrador((b) => ({ ...b, identificador: b.dni }));
    setParams({ auth: nuevo }, { replace: true });
  }

  function alExito(destino: string) {
    const desde = (location.state as { desde?: string } | null)?.desde;
    navigate(desde ?? destino, { replace: true });
  }

  function alTeclear(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const otro: Modo = modo === "login" ? "registro" : "login";
    cambiarA(otro);
    requestAnimationFrame(() => document.getElementById(`tab-${otro}`)?.focus());
  }

  return (
    <Modal abierto={modo !== null} tituloId="auth-titulo" onCerrar={cerrar}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="auth-titulo" className="text-xl font-semibold text-primary-dark">
            {modo === "registro" ? "Crea tu cuenta" : "Ingresa a tu cuenta"}
          </h2>
          <p className="mt-1 text-sm text-muted">Plataforma del Solicitante · Ollas Comunes</p>
        </div>
        <button
          type="button"
          onClick={cerrar}
          className="toque -mr-2 -mt-2 flex items-center justify-center rounded text-muted hover:bg-bg"
        >
          <Icono nombre="cerrar" titulo="Cerrar" />
        </button>
      </div>

      <div role="tablist" aria-label="Acceso" onKeyDown={alTeclear} className="mb-5 mt-4 flex rounded-sm bg-bg p-1">
        {TABS.map((t) => (
          <button
            key={t.modo}
            id={`tab-${t.modo}`}
            role="tab"
            type="button"
            aria-selected={modo === t.modo}
            aria-controls="auth-panel"
            tabIndex={modo === t.modo ? 0 : -1}
            onClick={() => cambiarA(t.modo)}
            className={`min-h-11 flex-1 rounded-sm text-sm font-medium transition-colors ${
              modo === t.modo ? "bg-surface text-ink shadow-sm" : "text-muted"
            }`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      <div id="auth-panel" role="tabpanel" aria-labelledby={`tab-${modo ?? "login"}`}>
        {modo === "login" && (
          <ModalLogin
            identificadorInicial={borrador.identificador}
            onIdentificador={(v) => setBorrador((b) => ({ ...b, identificador: v }))}
            onIrARegistro={() => cambiarA("registro")}
            onExito={() => alExito("/app/seguimiento")}
          />
        )}
        {modo === "registro" && (
          <ModalRegistro
            dniInicial={borrador.dni}
            onDni={(v) => setBorrador((b) => ({ ...b, dni: v }))}
            onIrALogin={() => cambiarA("login")}
            onExito={() => navigate("/app/olla", { replace: true })}
          />
        )}
      </div>
    </Modal>
  );
}
