import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSolicitudActual } from "../../hooks/useSolicitudActual";
import { Timeline, type Hito } from "../../components/ui/Timeline";
import { EmptyState } from "../../components/ui/EmptyState";
import { CargandoVista, ErrorConReintento } from "../../components/ui/Estados";
import { Icono } from "../../components/ui/Icono";
import { StatusBadge, tonoDeEstado } from "../../components/ui/StatusBadge";
import { codigoExpediente, fechaHora, fechaLarga } from "../../lib/formatos";
import type { Decision, Solicitud } from "../../types";

const ETIQUETA_DECISION: Record<Decision["decision"], string> = {
  APROBAR: "Aprobada",
  OBSERVAR: "Observada",
  RECHAZAR: "Rechazada",
};

/**
 * Hitos del seguimiento, derivados de estado y decisiones[] (no hay fechas propias de cada etapa en la API):
 * Recibida → En evaluación → Decisión → Asignación.
 */
function construirHitos(s: Solicitud): Hito[] {
  const decision = s.decisiones[0];
  const enviada = s.estado !== "PENDIENTE";
  const resuelta = s.estado === "APTA" || s.estado === "NO_APTA" || s.estado === "OBSERVADA";
  return [
    {
      clave: "recibida",
      etiqueta: "Solicitud registrada",
      estado: enviada ? "done" : "actual",
      fecha: fechaLarga(s.fecha_solicitud),
      detalle: enviada ? undefined : "Aún no la enviaste a evaluación.",
    },
    {
      clave: "evaluacion",
      etiqueta: "En evaluación",
      estado: !enviada ? "pendiente" : s.estado === "EN_EVALUACION" ? "actual" : "done",
    },
    {
      clave: "decision",
      etiqueta: decision ? `Decisión: ${ETIQUETA_DECISION[decision.decision]}` : "Decisión del programa",
      estado: !resuelta ? "pendiente" : s.estado === "NO_APTA" ? "fallo" : s.estado === "OBSERVADA" ? "actual" : "done",
      fecha: decision ? fechaHora(decision.fecha_decision) : undefined,
      detalle: decision?.observaciones ?? undefined,
    },
    {
      clave: "asignacion",
      etiqueta: "Asignación de insumos",
      estado: s.estado === "APTA" ? "done" : "pendiente",
      detalle: s.estado === "NO_APTA" ? "No aplica para esta postulación." : undefined,
    },
  ];
}

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

  if (cargando) return <CargandoVista />;
  if (error) return <ErrorConReintento mensaje={error} onReintentar={() => void recargar()} />;
  if (!solicitud) {
    return (
      <EmptyState
        pagina
        titulo="Aún no tienes una postulación"
        descripcion="Registra tu olla común para iniciar tu postulación al programa."
      />
    );
  }

  const estado = solicitud.estado;
  const ultimaDecision = solicitud.decisiones[0];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Estado de tu solicitud</h1>
          <p className="mt-1 text-muted">
            {solicitud.olla_nombre} · Expediente {codigoExpediente(solicitud.id, solicitud.fecha_solicitud)}
          </p>
        </div>
        <StatusBadge estado={estado} tono={tonoDeEstado(estado)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div className="card">
          <h2 className="mb-4 font-medium text-ink">Avance</h2>
          <Timeline hitos={construirHitos(solicitud)} />
        </div>

        <div className="flex flex-col gap-4">
          {estado === "PENDIENTE" && (
            <div className="card">
              <p className="font-medium text-ink">Tu solicitud aún no ha sido enviada</p>
              <p className="mt-1 text-sm text-muted">
                Tienes {solicitud.total_integrantes} de {solicitud.num_personas_declaradas} integrante(s) registrados.
                Completa la lista y envíala para que pase a evaluación.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link to="/app/integrantes" className="btn-secondary">Registrar integrantes</Link>
                {solicitud.total_integrantes > 0 && <Link to="/app/envio" className="btn-primary">Enviar solicitud</Link>}
              </div>
            </div>
          )}

          {estado === "EN_EVALUACION" && (
            <div className="card bg-info-light">
              <p className="flex items-start gap-2 text-sm text-info">
                <Icono nombre="arena" className="mt-0.5 h-4 w-4" />
                Tu expediente está siendo evaluado por el programa. Te avisaremos en Notificaciones cuando haya un resultado.
              </p>
            </div>
          )}

          {estado === "OBSERVADA" && (
            <div className="card border-accent-light bg-accent-light">
              <p className="flex items-center gap-2 font-medium text-accent-dark"><Icono nombre="alerta" /> Tu solicitud tiene observaciones</p>
              {ultimaDecision?.observaciones && <p className="mt-1 text-sm text-accent-dark">{ultimaDecision.observaciones}</p>}
              <p className="mt-1 text-sm text-accent-dark">Corrige la lista de integrantes y vuelve a enviarla.</p>
              <Link to="/app/integrantes" className="btn-secondary mt-3 inline-flex">Revisar integrantes</Link>
            </div>
          )}

          {estado === "APTA" && (
            <div className="card border-primary bg-primary-light">
              <p className="flex items-center gap-2 font-medium text-primary-dark"><Icono nombre="check" /> ¡Tu olla común fue reconocida como apta!</p>
              <p className="mt-1 text-sm text-primary-dark">Ya puedes ver los integrantes aprobados, las calorías y los insumos asignados.</p>
              <Link to="/app/resultado" className="btn-primary mt-3 inline-flex">Ver asignación</Link>
            </div>
          )}

          {estado === "NO_APTA" && (
            <div className="card border-danger-light bg-danger-light">
              <p className="flex items-center gap-2 font-medium text-danger"><Icono nombre="equis" /> Tu solicitud no fue aprobada en este ciclo</p>
              {ultimaDecision?.observaciones && <p className="mt-1 text-sm text-danger">{ultimaDecision.observaciones}</p>}
              <p className="mt-1 text-sm text-danger">Puedes volver a postular desde tu historial.</p>
              <Link to="/app/historial" className="btn-secondary mt-3 inline-flex">Ver historial</Link>
            </div>
          )}

          <Link to="/app/historial" className="toque inline-flex items-center text-sm font-medium text-primary underline">
            Ver historial de postulaciones
          </Link>
        </div>
      </div>
    </div>
  );
}
