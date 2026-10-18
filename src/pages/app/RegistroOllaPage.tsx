import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "react-router-dom";
import { api, mensajeDeError } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { CampoDirigenta, CampoPersonas, CamposNombreFecha, CamposUbicacion } from "../../components/olla/CamposOlla";
import { Stepper } from "../../components/ui/Stepper";
import { Icono } from "../../components/ui/Icono";
import { FORM_OLLA_VACIO, datosParaApi } from "../../lib/formOlla";
import { fechaDeDia } from "../../lib/formatos";
import { esquemaOlla, type FormOlla } from "../../lib/schemas";

const PASOS = [
  { clave: "olla", etiqueta: "Tu olla" },
  { clave: "ubicacion", etiqueta: "Ubicación" },
  { clave: "personas", etiqueta: "Personas" },
  { clave: "revision", etiqueta: "Revisión" },
];
const CAMPOS_POR_PASO: (keyof FormOlla)[][] = [["nombre", "fecha_fundacion"], ["distrito", "direccion"], ["num_personas_declaradas"], []];

const KEY_BORRADOR = "borrador_olla"; // sessionStorage: sobrevive a una recarga o a un corte de conexión, no al cierre

function leerBorrador(): { valores: FormOlla; paso: number } {
  try {
    const guardado = JSON.parse(sessionStorage.getItem(KEY_BORRADOR) ?? "null");
    if (guardado?.valores) return { valores: { ...FORM_OLLA_VACIO, ...guardado.valores }, paso: Math.min(guardado.paso ?? 0, 3) };
  } catch {
    /* borrador ilegible: se empieza de cero */
  }
  return { valores: FORM_OLLA_VACIO, paso: 0 };
}

/** Vista 2 — Registro de la olla común (postulación) en 4 pasos. */
export default function RegistroOllaPage() {
  const { usuario, refrescarUsuario } = useAuth();
  const navigate = useNavigate();
  const [inicial] = useState(leerBorrador);
  const [paso, setPaso] = useState(inicial.paso);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [registrada, setRegistrada] = useState(false);

  const metodos = useForm<FormOlla>({
    resolver: zodResolver(esquemaOlla),
    defaultValues: inicial.valores,
    mode: "onTouched",
  });
  const { handleSubmit, trigger, watch, getValues } = metodos;

  useEffect(() => {
    const suscripcion = watch((valores) => sessionStorage.setItem(KEY_BORRADOR, JSON.stringify({ valores, paso })));
    return () => suscripcion.unsubscribe();
  }, [watch, paso]);

  // La cuenta admite una sola olla: si ya existe, se edita desde el perfil
  if (usuario?.olla_id && !registrada) return <Navigate to="/app/seguimiento" replace />;

  const nombreDirigenta = `${usuario?.nombres ?? ""} ${usuario?.apellidos ?? ""}`.trim();
  const ultimo = paso === PASOS.length - 1;

  async function siguiente() {
    if (await trigger(CAMPOS_POR_PASO[paso])) setPaso((p) => p + 1);
  }

  async function registrar(valores: FormOlla) {
    setErrorApi(null);
    setEnviando(true);
    try {
      await api.post("/ollas-comunes", datosParaApi(valores));
      sessionStorage.removeItem(KEY_BORRADOR);
      setRegistrada(true);
      await refrescarUsuario(); // trae el olla_id recién asignado
      navigate("/app/integrantes");
    } catch (err) {
      setErrorApi(mensajeDeError(err, "No pudimos registrar tu olla común. Intenta de nuevo en unos minutos."));
    } finally {
      setEnviando(false);
    }
  }

  const valores = getValues();

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Registra tu olla común</h1>
      <p className="mt-1 text-muted">Con estos datos se crea tu postulación ante el programa. Luego registrarás a los integrantes.</p>

      <div className="card mt-6">
        <Stepper pasos={PASOS} pasoActualIndex={paso} />
      </div>

      <FormProvider {...metodos}>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault(); // Enter avanza de paso; solo el último paso registra
            if (ultimo) void handleSubmit(registrar)();
            else void siguiente();
          }}
          className="mt-4"
        >
          <div className="card flex flex-col gap-4">
            {paso === 0 && (
              <>
                <h2 className="font-medium text-ink">Paso 1 de 4 · Nombre y fecha</h2>
                <CamposNombreFecha />
              </>
            )}
            {paso === 1 && (
              <>
                <h2 className="font-medium text-ink">Paso 2 de 4 · Dónde funciona</h2>
                <CamposUbicacion />
              </>
            )}
            {paso === 2 && (
              <>
                <h2 className="font-medium text-ink">Paso 3 de 4 · Personas</h2>
                <CampoPersonas />
                <CampoDirigenta nombre={nombreDirigenta} />
              </>
            )}
            {paso === 3 && (
              <>
                <h2 className="font-medium text-ink">Paso 4 de 4 · Revisa tus datos</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Dato titulo="Nombre de la olla" valor={valores.nombre} />
                  <Dato titulo="Dirigenta" valor={nombreDirigenta} />
                  <Dato titulo="Fecha de creación" valor={fechaDeDia(valores.fecha_fundacion)} />
                  <Dato titulo="Personas involucradas" valor={valores.num_personas_declaradas} />
                  <Dato titulo="Distrito" valor={valores.distrito} />
                  <Dato titulo="Dirección" valor={valores.direccion} />
                </dl>
              </>
            )}

            {errorApi && (
              <p role="alert" className="flex items-start gap-2 rounded border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger">
                <Icono nombre="alerta" className="mt-0.5 h-4 w-4" /> {errorApi}
              </p>
            )}
          </div>

          {/* En móvil los botones quedan fijos sobre la barra inferior */}
          <div className="sticky bottom-16 z-20 -mx-4 mt-4 flex gap-3 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 lg:static">
            {paso > 0 && (
              <button type="button" className="btn-secondary flex-1 px-3 sm:flex-none sm:px-6" onClick={() => setPaso((p) => p - 1)} disabled={enviando}>
                Atrás
              </button>
            )}
            <button type="submit" className="btn-primary flex-1 px-3 sm:flex-none sm:px-6" disabled={enviando}>
              {ultimo ? (enviando ? "Guardando…" : "Registrar mi olla") : "Siguiente"}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{titulo}</dt>
      <dd className="font-medium text-ink">{valor}</dd>
    </div>
  );
}
