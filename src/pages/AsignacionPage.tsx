import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeDeError } from "../lib/api";
import { EmptyState } from "../components/ui/EmptyState";
import type { ResultadoSolicitud, SolicitudHistorial } from "../types";

const numero = (n: number, decimales = 0) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

/**
 * Vista 6 — Resultado y asignación. Se muestra la solicitud APTA más reciente
 * (una renovación en curso no oculta la asignación vigente); si no hay ninguna,
 * la solicitud más reciente.
 */
export default function AsignacionPage() {
  const [resultado, setResultado] = useState<ResultadoSolicitud | null>(null);
  const [sinSolicitudes, setSinSolicitudes] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const historial = await api.get<SolicitudHistorial[]>("/solicitudes/historial");
        const objetivo = historial.find((s) => s.estado === "APTA") ?? historial[0];
        if (!objetivo) {
          setSinSolicitudes(true);
          return;
        }
        setResultado(await api.get<ResultadoSolicitud>(`/solicitudes/${objetivo.id}/resultado`));
      } catch (err) {
        setError(mensajeDeError(err, "No pudimos cargar tu resultado."));
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  if (cargando) return <p className="text-muted">Cargando…</p>;
  if (error) return <p className="text-danger">{error}</p>;

  if (sinSolicitudes || !resultado || resultado.solicitud.estado !== "APTA") {
    const estado = resultado?.solicitud.estado;
    return (
      <EmptyState
        titulo={estado === "NO_APTA" ? "Tu solicitud no fue aprobada" : "Todavía no hay una asignación disponible"}
        descripcion={
          estado === "NO_APTA"
            ? "No hay asignación para esta postulación. Puedes volver a postular desde tu historial."
            : "Los integrantes aprobados, las calorías y los insumos se muestran cuando tu olla común es declarada apta."
        }
      />
    );
  }

  const { olla, asignacion, evaluacion, solicitud } = resultado;

  return (
    <div>
      <div className="card border-primary bg-primary-light">
        <p className="text-sm font-medium text-primary-dark">Olla reconocida y apta · Solicitud N.° {solicitud.id}</p>
        <h1 className="mt-1 text-xl font-semibold text-primary-dark">{olla?.nombre ?? solicitud.olla_nombre}</h1>
        {olla?.fecha_aprobacion && (
          <p className="mt-1 text-sm text-primary-dark">
            Aprobada el {new Date(olla.fecha_aprobacion).toLocaleDateString("es-PE", { dateStyle: "long" })}
          </p>
        )}
      </div>

      {!asignacion ? (
        <p className="mt-6 text-muted">Tu asignación de insumos se está calculando. Vuelve a revisar más tarde.</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Indicador titulo="Integrantes aprobados" valor={numero(asignacion.num_integrantes_aprobados)} />
            <Indicador titulo="Porciones diarias" valor={numero(asignacion.porciones_diarias)} />
            <Indicador titulo="Kcal asignadas por día" valor={numero(asignacion.kcal_total_asignado)} />
            <Indicador titulo="Insumos asignados" valor={`${numero(asignacion.kg_insumos_asignado, 2)} kg`} />
          </div>
          <p className="mt-3 text-sm text-muted">
            Asignación calculada el{" "}
            {new Date(asignacion.fecha_asignacion).toLocaleDateString("es-PE", { dateStyle: "long" })}
            {evaluacion?.integrantes_validados != null &&
              ` · ${evaluacion.integrantes_validados} integrante(s) validados en la evaluación`}
            .
          </p>
        </>
      )}

      <Link to="/seguimiento" className="btn-secondary mt-6 inline-flex">Ver estado de la solicitud</Link>
    </div>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="card">
      <p className="text-sm text-muted">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{valor}</p>
    </div>
  );
}
