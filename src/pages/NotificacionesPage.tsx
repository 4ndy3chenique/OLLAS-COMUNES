import { useEffect, useState } from "react";
import { api, mensajeDeError } from "../lib/api";
import { EmptyState } from "../components/ui/EmptyState";
import type { Notificacion, TipoNotificacion } from "../types";

const PRESENTACION: Record<TipoNotificacion, { icono: string; titulo: string }> = {
  APROBACION: { icono: "✅", titulo: "Solicitud aprobada" },
  OBSERVACION: { icono: "⚠️", titulo: "Solicitud observada" },
  RECHAZO: { icono: "❌", titulo: "Solicitud no aprobada" },
  VENCIMIENTO: { icono: "⏰", titulo: "Vencimiento" },
  INFO: { icono: "ℹ️", titulo: "Aviso" },
};

/** Vista 8 — Notificaciones; la dirigenta solo puede marcarlas como leídas. */
export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Notificacion[]>("/notificaciones")
      .then(setNotificaciones)
      .catch((err) => setError(mensajeDeError(err, "No pudimos cargar tus notificaciones.")))
      .finally(() => setCargando(false));
  }, []);

  async function marcarLeida(id: number) {
    try {
      await api.put(`/notificaciones/${id}/leer`);
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos marcar la notificación como leída."));
    }
  }

  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Notificaciones</h1>
      <p className="mt-1 text-muted">
        Avisos sobre tus solicitudes{sinLeer > 0 ? ` · ${sinLeer} sin leer` : ""}.
      </p>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6">
        {cargando ? (
          <p className="text-muted">Cargando notificaciones…</p>
        ) : notificaciones.length === 0 ? (
          <EmptyState
            titulo="No tienes notificaciones"
            descripcion="Aquí verás avisos de envío, observaciones, aprobación, rechazo y vencimientos."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {notificaciones.map((n) => (
              <li
                key={n.id}
                className={`card flex items-start gap-3 ${!n.leida ? "border-l-4 border-l-primary" : ""}`}
              >
                <span className="text-xl leading-none" aria-hidden>{PRESENTACION[n.tipo].icono}</span>
                <div className="flex-1">
                  <p className={`text-sm ${!n.leida ? "font-semibold text-ink" : "text-ink"}`}>
                    {PRESENTACION[n.tipo].titulo} · Solicitud N.° {n.solicitud_id}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{n.mensaje}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(n.created_at).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                {!n.leida && (
                  <button
                    className="shrink-0 text-sm font-medium text-primary hover:underline"
                    onClick={() => marcarLeida(n.id)}
                  >
                    Marcar como leída
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
