import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, mensajeDeError } from "../lib/api";
import { esFormatoDniValido } from "../lib/dniValidation";
import { PARENTESCOS, etiquetaParentesco } from "../lib/parentescos";
import { useSolicitudActual } from "../hooks/useSolicitudActual";
import { StatusBadge } from "../components/ui/StatusBadge";
import { EmptyState } from "../components/ui/EmptyState";
import type { Integrante, Solicitud } from "../types";

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

  if (cargando) return <p className="text-muted">Cargando integrantes…</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!solicitud) {
    return (
      <EmptyState
        titulo="Aún no tienes una postulación"
        descripcion="Registra primero tu olla común para poder agregar a sus integrantes."
        accion={{ etiqueta: "Registrar olla común", onClick: () => navigate("/registro-olla") }}
      />
    );
  }

  const registrados = integrantes.length;
  const declarados = solicitud.num_personas_declaradas;
  const ultimaObservacion = solicitud.decisiones.find((d) => d.decision === "OBSERVAR");

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-ink">Integrantes de la olla</h1>
          <p className="mt-1 text-muted">{solicitud.olla_nombre} · Solicitud N.° {solicitud.id}</p>
        </div>
        {solicitud.editable && registrados > 0 && (
          <button className="btn-primary shrink-0" onClick={() => navigate("/envio")}>
            Continuar al envío
          </button>
        )}
      </div>

      <ContadorIntegrantes registrados={registrados} declarados={declarados} />

      {solicitud.estado === "OBSERVADA" && ultimaObservacion && (
        <div className="card mt-4 border-accent-light bg-accent-light">
          <p className="font-medium text-accent">Tu solicitud fue observada</p>
          {ultimaObservacion.observaciones && (
            <p className="mt-1 text-sm text-accent">{ultimaObservacion.observaciones}</p>
          )}
          <p className="mt-1 text-sm text-accent">Corrige la lista y vuelve a enviarla.</p>
        </div>
      )}

      {!solicitud.editable && (
        <div className="card mt-4 bg-info-light">
          <p className="text-sm text-info">
            Tu solicitud ya fue enviada y no puede modificarse mientras esté en evaluación o resuelta.{" "}
            <Link to="/seguimiento" className="font-medium underline">Ver el estado</Link>
          </p>
        </div>
      )}

      {solicitud.editable && <FormularioIntegrante solicitud={solicitud} onAgregado={recargar} />}

      {errorLista && <p className="mt-4 text-sm text-danger">{errorLista}</p>}

      <div className="mt-6">
        {registrados === 0 ? (
          <EmptyState
            titulo="Todavía no registraste integrantes"
            descripcion="Agrega el DNI de cada persona que participa en tu olla común. Validaremos cada DNI con RENIEC."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {integrantes.map((i) => (
              <li key={i.id} className="card flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium text-ink">
                    {i.nombres} {i.apellidos}
                  </p>
                  <p className="text-sm text-muted">
                    DNI {i.dni} · {etiquetaParentesco(i.parentesco_con_dirigente)} · Nació el{" "}
                    {new Date(`${i.fecha_nacimiento}T00:00:00`).toLocaleDateString("es-PE")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge
                    estado={i.registrado_sisfoh ? "Registrado en SISFOH" : "No registrado en SISFOH"}
                    tono={i.registrado_sisfoh ? "exito" : "alerta"}
                  />
                  {solicitud.editable && (
                    <button
                      className="text-sm font-medium text-danger hover:underline"
                      onClick={() => eliminar(i)}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
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
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${coincide ? "bg-primary" : "bg-accent"}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      {registrados > declarados && (
        <p className="mt-2 text-sm text-accent">Registraste más integrantes de los que declaraste.</p>
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
    <form onSubmit={onSubmit} className="card mt-4 flex flex-col gap-4">
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
            onChange={(e) => setDni(e.target.value.trim())}
            required
          />
        </div>
        <div>
          <label className="label-field" htmlFor="i-parentesco">Parentesco con la dirigenta</label>
          <select
            id="i-parentesco"
            className="input-field"
            value={parentesco}
            onChange={(e) => setParentesco(e.target.value)}
          >
            {PARENTESCOS.map((p) => (
              <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {exito && <p className="text-sm text-primary">{exito}</p>}

      <button type="submit" className="btn-primary self-start" disabled={enviando}>
        {enviando ? "Verificando en RENIEC…" : "Agregar integrante"}
      </button>
    </form>
  );
}
