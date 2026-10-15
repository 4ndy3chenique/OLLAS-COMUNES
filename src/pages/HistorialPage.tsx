import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, mensajeDeError } from "../lib/api";
import { StatusBadge, tonoDeEstado } from "../components/ui/StatusBadge";
import { EmptyState } from "../components/ui/EmptyState";
import type { SolicitudHistorial } from "../types";

/** Vista 7 — Historial de solicitudes y renovaciones (solicitudes filtradas por DNI del dirigente). */
export default function HistorialPage() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<SolicitudHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renovando, setRenovando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setSolicitudes(await api.get<SolicitudHistorial[]>("/solicitudes/historial"));
      setError(null);
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos cargar tu historial."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function renovar() {
    setRenovando(true);
    setError(null);
    try {
      await api.post("/solicitudes/renovar");
      navigate("/integrantes");
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos iniciar la nueva postulación."));
      setRenovando(false);
    }
  }

  const ultima = solicitudes[0];
  const puedeRenovar = ultima && (ultima.estado === "APTA" || ultima.estado === "NO_APTA");

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-ink">Historial de postulaciones</h1>
          <p className="mt-1 text-muted">Tus solicitudes anteriores, renovaciones y sus resultados.</p>
        </div>
        {puedeRenovar && (
          <button className="btn-primary shrink-0" onClick={renovar} disabled={renovando}>
            {renovando ? "Creando…" : "Nueva postulación (renovar)"}
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6">
        {cargando ? (
          <p className="text-muted">Cargando historial…</p>
        ) : solicitudes.length === 0 ? (
          <EmptyState
            titulo="Aún no tienes postulaciones"
            descripcion="Cuando registres tu olla común, tu postulación aparecerá aquí."
          />
        ) : (
          <ol className="flex flex-col gap-4 border-l-2 border-border pl-5">
            {solicitudes.map((s) => (
              <li key={s.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary" />
                <div className="card">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-ink">
                      Solicitud N.° {s.id} · {s.es_renovacion ? "Renovación" : "Postulación inicial"}
                    </p>
                    <StatusBadge estado={s.estado} tono={tonoDeEstado(s.estado)} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {s.olla_nombre} · Solicitada el{" "}
                    {new Date(s.fecha_solicitud).toLocaleDateString("es-PE", { dateStyle: "long" })} ·{" "}
                    {s.total_integrantes} de {s.num_personas_declaradas} integrante(s)
                  </p>
                  {s.fecha_ultima_decision && (
                    <p className="mt-1 text-sm text-muted">
                      Última decisión el{" "}
                      {new Date(s.fecha_ultima_decision).toLocaleDateString("es-PE", { dateStyle: "long" })}
                    </p>
                  )}
                  {s.observaciones && <p className="mt-2 text-sm text-ink">{s.observaciones}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
