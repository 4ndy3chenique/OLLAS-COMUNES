import { useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeDeError } from "../lib/api";
import { useSolicitudActual } from "../hooks/useSolicitudActual";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusBadge, tonoDeEstado } from "../components/ui/StatusBadge";
import type { EnvioSolicitudRespuesta } from "../types";

/** Vista 4 — Resumen y envío: la solicitud pasa a EN_EVALUACION y queda como expediente. */
export default function ConfirmacionSolicitudPage() {
  const { solicitud, setSolicitud, cargando, error } = useSolicitudActual();
  const [aceptaDeclaracion, setAceptaDeclaracion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<EnvioSolicitudRespuesta | null>(null);

  async function confirmarEnvio() {
    if (!solicitud) return;
    if (!aceptaDeclaracion) {
      setErrorEnvio("Debes aceptar la declaración jurada para continuar.");
      return;
    }
    setErrorEnvio(null);
    setEnviando(true);
    try {
      const respuesta = await api.post<EnvioSolicitudRespuesta>(`/solicitudes/${solicitud.id}/enviar`);
      setConfirmacion(respuesta);
      setSolicitud(respuesta.solicitud);
    } catch (err) {
      setErrorEnvio(mensajeDeError(err, "No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos."));
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <p className="text-muted">Cargando expediente…</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!solicitud) {
    return (
      <EmptyState
        titulo="Aún no tienes una postulación"
        descripcion="Registra tu olla común y a sus integrantes para poder enviar tu solicitud."
      />
    );
  }

  if (confirmacion) {
    return (
      <div className="card border-primary bg-primary-light">
        <p className="text-lg font-semibold text-primary-dark">¡Solicitud enviada!</p>
        <p className="mt-1 text-sm text-primary-dark">
          Tu solicitud N.° {solicitud.id} quedó registrada como expediente y ahora está en evaluación. Te avisaremos
          en Notificaciones cuando haya novedades.
        </p>
        {confirmacion.advertencia && (
          <p className="mt-3 rounded border border-accent-light bg-accent-light px-3 py-2 text-sm text-accent">
            {confirmacion.advertencia}
          </p>
        )}
        <Link to="/seguimiento" className="btn-primary mt-4 inline-flex">Ver el estado de mi solicitud</Link>
      </div>
    );
  }

  const total = solicitud.total_integrantes;
  const declarados = solicitud.num_personas_declaradas;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Revisa y envía tu solicitud</h1>
      <p className="mt-1 text-muted">
        Verifica que la información esté completa. Una vez enviada pasará a evaluación y no podrás editarla, salvo
        que el programa la observe.
      </p>

      <div className="card mt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium text-ink">{solicitud.olla_nombre}</h2>
            <p className="text-sm text-muted">
              {solicitud.direccion}, {solicitud.distrito}
            </p>
          </div>
          <StatusBadge estado={solicitud.estado} tono={tonoDeEstado(solicitud.estado)} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
          <Dato titulo="Dirigenta" valor={`${solicitud.dirigente_nombres} ${solicitud.dirigente_apellidos}`} />
          <Dato
            titulo="Fecha de creación"
            valor={new Date(`${solicitud.fecha_fundacion}T00:00:00`).toLocaleDateString("es-PE")}
          />
          <Dato titulo="Personas declaradas" valor={declarados} grande />
          <Dato titulo="Integrantes registrados" valor={total} grande />
        </dl>

        {total > 0 && total !== declarados && (
          <p className="mt-4 rounded border border-accent-light bg-accent-light px-3 py-2 text-sm text-accent">
            Registraste {total} integrante(s) pero declaraste {declarados} persona(s). Puedes enviar igual, pero el
            evaluador podría observar la diferencia.
          </p>
        )}
      </div>

      {!solicitud.editable ? (
        <div className="card mt-4 bg-info-light">
          <p className="text-sm text-info">
            Esta solicitud ya fue enviada.{" "}
            <Link to="/seguimiento" className="font-medium underline">Ver el estado</Link>
          </p>
        </div>
      ) : total === 0 ? (
        <div className="card mt-4 border-danger-light bg-danger-light">
          <p className="text-sm text-danger">
            Necesitas al menos un integrante válido para enviar.{" "}
            <Link to="/integrantes" className="font-medium underline">Agregar integrantes</Link>
          </p>
        </div>
      ) : (
        <>
          <div className="card mt-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary"
                checked={aceptaDeclaracion}
                onChange={(e) => setAceptaDeclaracion(e.target.checked)}
              />
              <span className="text-sm text-ink">
                Declaro bajo juramento que la información registrada es verdadera y autorizo el tratamiento de estos
                datos personales conforme a la Ley N.° 29733 de Protección de Datos Personales, exclusivamente para
                fines de evaluación y asignación del programa.
              </span>
            </label>
          </div>

          {errorEnvio && <p className="mt-3 text-sm text-danger">{errorEnvio}</p>}

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={confirmarEnvio} disabled={enviando}>
              {enviando ? "Enviando…" : solicitud.estado === "OBSERVADA" ? "Reenviar solicitud" : "Confirmar y enviar solicitud"}
            </button>
            <Link to="/integrantes" className="btn-secondary">Revisar integrantes</Link>
          </div>
        </>
      )}
    </div>
  );
}

function Dato({ titulo, valor, grande }: { titulo: string; valor: string | number; grande?: boolean }) {
  return (
    <div>
      <dt className="text-sm text-muted">{titulo}</dt>
      <dd className={grande ? "text-2xl font-semibold text-ink" : "font-medium text-ink"}>{valor}</dd>
    </div>
  );
}
