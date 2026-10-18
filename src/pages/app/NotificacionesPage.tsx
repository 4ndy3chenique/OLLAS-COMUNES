import { useCallback, useEffect, useState } from "react";
import { api, mensajeDeError } from "../../lib/api";
import { fechaHora } from "../../lib/formatos";
import { EVENTO_NOTIFICACIONES } from "../../components/layout/AppLayout";
import { EmptyState } from "../../components/ui/EmptyState";
import { CargandoVista, ErrorConReintento } from "../../components/ui/Estados";
import { Icono, type NombreIcono } from "../../components/ui/Icono";
import type { Notificacion, TipoNotificacion } from "../../types";

const PRESENTACION: Record<TipoNotificacion, { icono: NombreIcono; titulo: string; color: string }> = {
  APROBACION: { icono: "check", titulo: "Solicitud aprobada", color: "bg-success-light text-success" },
  OBSERVACION: { icono: "alerta", titulo: "Solicitud observada", color: "bg-accent-light text-accent-dark" },
  RECHAZO: { icono: "equis", titulo: "Solicitud no aprobada", color: "bg-danger-light text-danger" },
  VENCIMIENTO: { icono: "reloj", titulo: "Vencimiento", color: "bg-accent-light text-accent-dark" },
  INFO: { icono: "info", titulo: "Aviso", color: "bg-info-light text-info" },
};

/** Vista 8 — Notificaciones; la dirigenta solo puede marcarlas como leídas. */
export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorLeer, setErrorLeer] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setNotificaciones(await api.get<Notificacion[]>("/notificaciones"));
      setErrorCarga(null);
    } catch (err) {
      setErrorCarga(mensajeDeError(err, "No pudimos cargar tus notificaciones."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Actualización optimista: se marca al instante y se revierte si la API falla. */
  async function marcarLeida(id: number) {
    setErrorLeer(null);
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    try {
      await api.put(`/notificaciones/${id}/leer`);
      window.dispatchEvent(new Event(EVENTO_NOTIFICACIONES)); // refresca el contador del menú
    } catch (err) {
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: false } : n)));
      setErrorLeer(mensajeDeError(err, "No pudimos marcar la notificación como leída."));
    }
  }

  if (cargando) return <CargandoVista />;
  if (errorCarga) return <ErrorConReintento mensaje={errorCarga} onReintentar={() => void cargar()} />;

  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Notificaciones</h1>
      <p className="mt-1 text-muted">Avisos sobre tus solicitudes{sinLeer > 0 ? ` · ${sinLeer} sin leer` : ""}.</p>

      {errorLeer && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-danger">
          <Icono nombre="alerta" className="mt-0.5 h-4 w-4" /> {errorLeer}
        </p>
      )}

      <div className="mt-6">
        {notificaciones.length === 0 ? (
          <EmptyState
            titulo="No tienes notificaciones"
            descripcion="Aquí verás avisos de envío, observaciones, aprobación, rechazo y vencimientos."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {notificaciones.map((n) => {
              const p = PRESENTACION[n.tipo];
              return (
                <li key={n.id} className={`card flex items-start gap-3 ${!n.leida ? "border-l-4 border-l-primary" : ""}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${p.color}`}>
                    <Icono nombre={p.icono} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!n.leida ? "font-semibold text-ink" : "text-ink"}`}>
                      {!n.leida && <span className="mr-2 rounded-sm bg-primary px-1.5 py-0.5 text-xs font-medium text-white">Nueva</span>}
                      {p.titulo} · Solicitud N.° {n.solicitud_id}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{n.mensaje}</p>
                    <p className="mt-1 text-xs text-muted">{fechaHora(n.created_at)}</p>
                  </div>
                  {!n.leida && (
                    <button className="toque shrink-0 text-sm font-medium text-primary hover:underline" onClick={() => void marcarLeida(n.id)}>
                      Marcar como leída
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
