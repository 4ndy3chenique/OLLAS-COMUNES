import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSolicitudActual } from "../hooks/useSolicitudActual";
import { Stepper } from "../components/ui/Stepper";
import { EmptyState } from "../components/ui/EmptyState";
import type { Decision, EstadoSolicitud } from "../types";

const PASOS: { clave: EstadoSolicitud; etiqueta: string }[] = [
  { clave: "PENDIENTE", etiqueta: "Registrada" },
  { clave: "EN_EVALUACION", etiqueta: "En evaluación" },
  { clave: "OBSERVADA", etiqueta: "Observada" },
  { clave: "APTA", etiqueta: "Apta / No apta" },
];

function indiceDelEstado(estado: EstadoSolicitud): number {
  if (estado === "NO_APTA") return PASOS.length - 1;
  const idx = PASOS.findIndex((p) => p.clave === estado);
  return idx === -1 ? 0 : idx;
}

const ETIQUETA_DECISION: Record<Decision["decision"], string> = {
  APROBAR: "Aprobada",
  OBSERVAR: "Observada",
  RECHAZAR: "Rechazada",
};

/** Vista 5 — Seguimiento del estado de la solicitud vigente (solo lectura). */
export default function SeguimientoSolicitudPage() {
  const { solicitud, cargando, error, recargar } = useSolicitudActual();

  // Refresco periódico mientras la solicitud no tenga resultado final
  const enCurso = solicitud && solicitud.estado !== "APTA" && solicitud.estado !== "NO_APTA";
  useEffect(() => {
    if (!enCurso) return;
    const intervalo = setInterval(() => void recargar(), 15000);
    return () => clearInterval(intervalo);
  }, [enCurso, recargar]);

  if (cargando) return <p className="text-muted">Cargando estado de tu solicitud…</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!solicitud) {
    return (
      <EmptyState
        titulo="Aún no tienes una postulación"
        descripcion="Registra tu olla común para iniciar tu postulación al programa."
      />
    );
  }

  const estado = solicitud.estado;
  const ultimaDecision = solicitud.decisiones[0];

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Estado de tu solicitud</h1>
      <p className="mt-1 text-muted">
        {solicitud.olla_nombre} · Solicitud N.° {solicitud.id} · Registrada el{" "}
        {new Date(solicitud.fecha_solicitud).toLocaleDateString("es-PE", { dateStyle: "long" })}
      </p>

      <div className="card mt-6">
        <Stepper pasos={PASOS} pasoActualIndex={indiceDelEstado(estado)} esNoApta={estado === "NO_APTA"} />
      </div>

      {estado === "PENDIENTE" && (
        <div className="card mt-4">
          <p className="font-medium text-ink">Tu solicitud aún no ha sido enviada</p>
          <p className="mt-1 text-sm text-muted">
            Tienes {solicitud.total_integrantes} de {solicitud.num_personas_declaradas} integrante(s) registrados.
            Completa la lista y envíala para que pase a evaluación.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/integrantes" className="btn-secondary">Registrar integrantes</Link>
            {solicitud.total_integrantes > 0 && <Link to="/envio" className="btn-primary">Enviar solicitud</Link>}
          </div>
        </div>
      )}

      {estado === "EN_EVALUACION" && (
        <p className="mt-4 text-sm text-muted">
          Tu expediente está siendo evaluado por el programa. Te avisaremos en Notificaciones cuando haya un resultado.
        </p>
      )}

      {estado === "OBSERVADA" && (
        <div className="card mt-4 border-accent-light bg-accent-light">
          <p className="font-medium text-accent">Tu solicitud tiene observaciones</p>
          {ultimaDecision?.observaciones && <p className="mt-1 text-sm text-accent">{ultimaDecision.observaciones}</p>}
          <p className="mt-1 text-sm text-accent">Corrige la lista de integrantes y vuelve a enviarla.</p>
          <Link to="/integrantes" className="btn-secondary mt-3 inline-flex">Revisar integrantes</Link>
        </div>
      )}

      {estado === "APTA" && (
        <div className="card mt-4 border-primary bg-primary-light">
          <p className="font-medium text-primary-dark">¡Tu olla común fue reconocida como apta!</p>
          <p className="mt-1 text-sm text-primary-dark">
            Ya puedes ver los integrantes aprobados, las calorías y los insumos asignados.
          </p>
          <Link to="/resultado" className="btn-primary mt-3 inline-flex">Ver asignación</Link>
        </div>
      )}

      {estado === "NO_APTA" && (
        <div className="card mt-4 border-danger-light bg-danger-light">
          <p className="font-medium text-danger">Tu solicitud no fue aprobada en este ciclo</p>
          {ultimaDecision?.observaciones && <p className="mt-1 text-sm text-danger">{ultimaDecision.observaciones}</p>}
          <p className="mt-1 text-sm text-danger">Puedes volver a postular desde tu historial.</p>
          <Link to="/historial" className="btn-secondary mt-3 inline-flex">Ver historial</Link>
        </div>
      )}

      {solicitud.decisiones.length > 0 && (
        <div className="card mt-4">
          <h2 className="font-medium text-ink">Decisiones del programa</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {solicitud.decisiones.map((d) => (
              <li key={d.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-ink">
                  {ETIQUETA_DECISION[d.decision]} ·{" "}
                  <span className="font-normal text-muted">
                    {new Date(d.fecha_decision).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </p>
                {d.observaciones && <p className="mt-1 text-sm text-ink">{d.observaciones}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
