import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, mensajeDeError } from "../../lib/api";
import { esFormatoDniValido } from "../../lib/dniValidation";
import { enmascararDni, fechaDeDia } from "../../lib/formatos";
import { PARENTESCOS, etiquetaParentesco } from "../../lib/parentescos";
import { useSolicitudActual } from "../../hooks/useSolicitudActual";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { CargandoVista, ErrorConReintento } from "../../components/ui/Estados";
import { Icono } from "../../components/ui/Icono";
import type { Integrante, Solicitud } from "../../types";

/** Vista 3 — Integrantes de la olla: cada DNI se valida en RENIEC y se consulta en SISFOH. */
export default function IntegrantesPage() {
  const navigate = useNavigate();
  const { solicitud, cargando, error, recargar } = useSolicitudActual();
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [errorLista, setErrorLista] = useState<string | null>(null);

  const cargarIntegrantes = useCallback(async (solicitudId: number) => {
    try {
      setIntegrantes(await api.get<Integrante[]>(`/solicitudes/${solicitudId}/integrantes`));
      setErrorLista(null);
    } catch (err) {
      setErrorLista(mensajeDeError(err, "No pudimos cargar los integrantes."));
    }
  }, []);

  useEffect(() => {
    if (solicitud) void cargarIntegrantes(solicitud.id);
  }, [solicitud, cargarIntegrantes]);

  async function eliminar(integrante: Integrante) {
    if (!solicitud) return;
    try {
      await api.delete(`/solicitudes/${solicitud.id}/integrantes/${integrante.id}`);
      await recargar();
    } catch (err) {
      setErrorLista(mensajeDeError(err, "No pudimos quitar al integrante."));
    }
  }

  if (cargando) return <CargandoVista />;
  if (error) return <ErrorConReintento mensaje={error} onReintentar={() => void recargar()} />;
  if (!solicitud) {
    return (
      <EmptyState
        pagina
        titulo="Aún no tienes una postulación"
        descripcion="Registra primero tu olla común para poder agregar a sus integrantes."
        accion={{ etiqueta: "Registrar olla común", onClick: () => navigate("/app/olla") }}
      />
    );
  }

  const registrados = integrantes.length;
  const ultimaObservacion = solicitud.decisiones.find((d) => d.decision === "OBSERVAR");

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-ink">Integrantes de la olla</h1>
          <p className="mt-1 text-muted">{solicitud.olla_nombre} · Solicitud N.° {solicitud.id}</p>
        </div>
        {solicitud.editable && registrados > 0 && (
          <button className="btn-primary shrink-0" onClick={() => navigate("/app/envio")}>
            Continuar al envío
          </button>
        )}
      </div>

      <ContadorIntegrantes registrados={registrados} declarados={solicitud.num_personas_declaradas} />

      {solicitud.estado === "OBSERVADA" && ultimaObservacion && (
        <div className="card mt-4 border-accent-light bg-accent-light">
          <p className="flex items-center gap-2 font-medium text-accent-dark"><Icono nombre="alerta" /> Tu solicitud fue observada</p>
          {ultimaObservacion.observaciones && <p className="mt-1 text-sm text-accent-dark">{ultimaObservacion.observaciones}</p>}
          <p className="mt-1 text-sm text-accent-dark">Corrige la lista y vuelve a enviarla.</p>
        </div>
      )}

      {!solicitud.editable && (
        <div className="card mt-4 bg-info-light">
          <p className="flex items-start gap-2 text-sm text-info">
            <Icono nombre="info" className="mt-0.5 h-4 w-4" />
            <span>
              Tu solicitud ya fue enviada y no puede modificarse mientras esté en evaluación o resuelta.{" "}
              <Link to="/app/seguimiento" className="font-medium underline">Ver el estado</Link>
            </span>
          </p>
        </div>
      )}

      {solicitud.editable && <FormularioIntegrante solicitud={solicitud} onAgregado={recargar} />}

      {errorLista && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-danger">
          <Icono nombre="alerta" className="mt-0.5 h-4 w-4" /> {errorLista}
        </p>
      )}

      <div className="mt-6">
        {registrados === 0 ? (
          <EmptyState
            titulo="Todavía no registraste integrantes"
            descripcion="Agrega el DNI de cada persona que participa en tu olla común. Validaremos cada DNI con RENIEC."
          />
        ) : (
          <>
            {/* Escritorio: tabla */}
            <div className="card hidden overflow-x-auto p-0 md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Integrantes registrados en la solicitud</caption>
                <thead className="border-b border-border bg-bg text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">DNI</th>
                    <th scope="col" className="px-4 py-3 font-medium">Nombres y apellidos</th>
                    <th scope="col" className="px-4 py-3 font-medium">Parentesco</th>
                    <th scope="col" className="px-4 py-3 font-medium">SISFOH</th>
                    {solicitud.editable && <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Acciones</span></th>}
                  </tr>
                </thead>
                <tbody>
                  {integrantes.map((i) => (
                    <tr key={i.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-muted">{enmascararDni(i.dni)}</td>
                      <td className="px-4 py-3 font-medium text-ink">{i.nombres} {i.apellidos}</td>
                      <td className="px-4 py-3 text-ink">{etiquetaParentesco(i.parentesco_con_dirigente)}</td>
                      <td className="px-4 py-3"><BadgeSisfoh registrado={i.registrado_sisfoh} /></td>
                      {solicitud.editable && (
                        <td className="px-4 py-3 text-right">
                          <button className="toque text-sm font-medium text-danger hover:underline" onClick={() => eliminar(i)}>
                            Quitar<span className="sr-only"> a {i.nombres}</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil: tarjetas */}
            <ul className="flex flex-col gap-3 md:hidden">
              {integrantes.map((i) => (
                <li key={i.id} className="card flex flex-col gap-2">
                  <p className="font-medium text-ink">{i.nombres} {i.apellidos}</p>
                  <p className="text-sm text-muted">
                    DNI {enmascararDni(i.dni)} · {etiquetaParentesco(i.parentesco_con_dirigente)} · Nació el {fechaDeDia(i.fecha_nacimiento)}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <BadgeSisfoh registrado={i.registrado_sisfoh} />
                    {solicitud.editable && (
                      <button className="toque text-sm font-medium text-danger hover:underline" onClick={() => eliminar(i)}>
                        Quitar<span className="sr-only"> a {i.nombres}</span>
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

/** A la dirigenta solo se le muestra "Registrado / No registrado": la clasificación es para el evaluador. */
function BadgeSisfoh({ registrado }: { registrado: boolean }) {
  return (
    <StatusBadge
      estado={registrado ? "Registrado en SISFOH" : "No registrado en SISFOH"}
      tono={registrado ? "exito" : "alerta"}
    />
  );
}

function ContadorIntegrantes({ registrados, declarados }: { registrados: number; declarados: number }) {
  const porcentaje = Math.min(100, Math.round((registrados / declarados) * 100));
  const coincide = registrados === declarados;
  return (
    <div className="card mt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted">Integrantes registrados vs. personas declaradas</p>
        <p className="text-lg font-semibold text-ink">
          {registrados} / {declarados}
        </p>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={registrados}
        aria-valuemin={0}
        aria-valuemax={declarados}
        aria-label="Integrantes registrados"
      >
        <div className={`h-full rounded-full ${coincide ? "bg-primary" : "bg-accent"}`} style={{ width: `${porcentaje}%` }} />
      </div>
      {registrados > declarados && (
        <p className="mt-2 flex items-center gap-2 text-sm text-accent-dark">
          <Icono nombre="alerta" className="h-4 w-4" /> Registraste más integrantes de los que declaraste.
        </p>
      )}
    </div>
  );
}

function FormularioIntegrante({ solicitud, onAgregado }: { solicitud: Solicitud; onAgregado: () => Promise<void> }) {
  const [dni, setDni] = useState("");
  const [parentesco, setParentesco] = useState(PARENTESCOS[0].valor);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(null);

    // Formato inválido: se rechaza sin consultar RENIEC
    if (!esFormatoDniValido(dni)) {
      setError("El DNI debe tener exactamente 8 dígitos numéricos.");
      return;
    }

    setEnviando(true);
    try {
      const { integrante } = await api.post<{ integrante: Integrante }>(`/solicitudes/${solicitud.id}/integrantes`, {
        dni,
        parentesco_con_dirigente: parentesco,
      });
      setExito(
        `${integrante.nombres} ${integrante.apellidos} fue agregado · ` +
          (integrante.registrado_sisfoh ? "Registrado en SISFOH" : "No registrado en SISFOH")
      );
      setDni("");
      await onAgregado();
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos agregar al integrante. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card mt-4 flex flex-col gap-4">
      <h2 className="font-medium text-ink">Agregar integrante</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor="i-dni">DNI del integrante</label>
          <input
            id="i-dni"
            className="input-field"
            inputMode="numeric"
            maxLength={8}
            placeholder="8 dígitos"
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!error}
            aria-describedby={error ? "i-error" : undefined}
          />
        </div>
        <div>
          <label className="label-field" htmlFor="i-parentesco">Parentesco con la dirigenta</label>
          <select id="i-parentesco" className="input-field" value={parentesco} onChange={(e) => setParentesco(e.target.value)}>
            {PARENTESCOS.map((p) => (
              <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
            ))}
          </select>
        </div>
      </div>

      <div aria-live="polite">
        {error && (
          <p id="i-error" role="alert" className="flex items-start gap-2 text-sm text-danger">
            <Icono nombre="equis" className="mt-0.5 h-4 w-4" /> {error}
          </p>
        )}
        {exito && (
          <p className="flex items-start gap-2 text-sm text-success">
            <Icono nombre="check" className="mt-0.5 h-4 w-4" /> {exito}
          </p>
        )}
      </div>

      <button type="submit" className="btn-primary self-start" disabled={enviando}>
        {enviando ? "Verificando en RENIEC…" : "Validar y agregar"}
      </button>
    </form>
  );
}
