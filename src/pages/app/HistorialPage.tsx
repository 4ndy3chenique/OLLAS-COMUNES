import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, mensajeDeError } from "../../lib/api";
import { codigoExpediente, fechaLarga } from "../../lib/formatos";
import { StatusBadge, tonoDeEstado } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { CargandoVista, ErrorConReintento } from "../../components/ui/Estados";
import { Icono } from "../../components/ui/Icono";
import type { SolicitudHistorial } from "../../types";

/** Vista 7 — Historial de solicitudes y renovaciones (solicitudes filtradas por DNI del dirigente). */
export default function HistorialPage() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<SolicitudHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorRenovar, setErrorRenovar] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [renovando, setRenovando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setSolicitudes(await api.get<SolicitudHistorial[]>("/solicitudes/historial"));
      setErrorCarga(null);
    } catch (err) {
      setErrorCarga(mensajeDeError(err, "No pudimos cargar tu historial."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function renovar() {
    setRenovando(true);
    setErrorRenovar(null);
    try {
      await api.post("/solicitudes/renovar");
      navigate("/app/integrantes");
    } catch (err) {
      setErrorRenovar(mensajeDeError(err, "No pudimos iniciar la nueva postulación."));
      setRenovando(false);
    }
  }

  if (cargando) return <CargandoVista />;
  if (errorCarga) return <ErrorConReintento mensaje={errorCarga} onReintentar={() => void cargar()} />;

  const ultima = solicitudes[0];
  const puedeRenovar = ultima && (ultima.estado === "APTA" || ultima.estado === "NO_APTA");

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-ink">Historial de postulaciones</h1>
          <p className="mt-1 text-muted">Tus solicitudes anteriores, renovaciones y sus resultados.</p>
        </div>
        {puedeRenovar && !confirmando && (
          <button className="btn-primary shrink-0" onClick={() => setConfirmando(true)}>
            Nueva postulación (renovar)
          </button>
        )}
      </div>

      {confirmando && (
        <div role="alertdialog" aria-labelledby="renovar-titulo" className="card mt-4 border-info-light bg-info-light">
          <p id="renovar-titulo" className="font-medium text-info">¿Iniciar una nueva postulación?</p>
          <p className="mt-1 text-sm text-info">
            Se creará una solicitud con los datos actuales de tu olla y sin integrantes: tendrás que registrarlos de nuevo.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={renovar} disabled={renovando}>
              {renovando ? "Creando…" : "Sí, renovar"}
            </button>
            <button className="btn-secondary" onClick={() => setConfirmando(false)} disabled={renovando}>Cancelar</button>
          </div>
        </div>
      )}

      {errorRenovar && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-danger">
          <Icono nombre="alerta" className="mt-0.5 h-4 w-4" /> {errorRenovar}
        </p>
      )}

      <div className="mt-6">
        {solicitudes.length === 0 ? (
          <EmptyState
            titulo="Aún no tienes postulaciones"
            descripcion="Cuando registres tu olla común, tu postulación aparecerá aquí."
          />
        ) : (
          <>
            {/* Escritorio: tabla */}
            <div className="card hidden overflow-x-auto p-0 md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Postulaciones de tu olla común</caption>
                <thead className="border-b border-border bg-bg text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Expediente</th>
                    <th scope="col" className="px-4 py-3 font-medium">Tipo</th>
                    <th scope="col" className="px-4 py-3 font-medium">Fecha</th>
                    <th scope="col" className="px-4 py-3 font-medium">Integrantes</th>
                    <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                    <th scope="col" className="px-4 py-3 font-medium">Última decisión</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((s) => (
                    <tr key={s.id} className="border-b border-border align-top last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">{codigoExpediente(s.id, s.fecha_solicitud)}</td>
                      <td className="px-4 py-3 text-ink">{s.es_renovacion ? "Renovación" : "Postulación inicial"}</td>
                      <td className="px-4 py-3 text-ink">{fechaLarga(s.fecha_solicitud)}</td>
                      <td className="px-4 py-3 text-ink">{s.total_integrantes} de {s.num_personas_declaradas}</td>
                      <td className="px-4 py-3"><StatusBadge estado={s.estado} tono={tonoDeEstado(s.estado)} /></td>
                      <td className="px-4 py-3 text-ink">
                        {s.fecha_ultima_decision ? fechaLarga(s.fecha_ultima_decision) : "—"}
                        {s.observaciones && <p className="mt-1 text-muted">{s.observaciones}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil: tarjetas */}
            <ul className="flex flex-col gap-3 md:hidden">
              {solicitudes.map((s) => (
                <li key={s.id} className="card">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-ink">{codigoExpediente(s.id, s.fecha_solicitud)}</p>
                    <StatusBadge estado={s.estado} tono={tonoDeEstado(s.estado)} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {s.es_renovacion ? "Renovación" : "Postulación inicial"} · {s.olla_nombre}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Solicitada el {fechaLarga(s.fecha_solicitud)} · {s.total_integrantes} de {s.num_personas_declaradas} integrante(s)
                  </p>
                  {s.fecha_ultima_decision && (
                    <p className="mt-1 text-sm text-muted">Última decisión el {fechaLarga(s.fecha_ultima_decision)}</p>
                  )}
                  {s.observaciones && <p className="mt-2 text-sm text-ink">{s.observaciones}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
