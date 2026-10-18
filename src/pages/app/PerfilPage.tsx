import { useEffect, useState, type ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, mensajeDeError } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { CamposOlla } from "../../components/olla/CamposOlla";
import { Campo } from "../../components/ui/Campo";
import { Icono } from "../../components/ui/Icono";
import { ErrorConReintento } from "../../components/ui/Estados";
import { datosParaApi, formOllaDesdeOlla } from "../../lib/formOlla";
import { esquemaOlla, type FormOlla } from "../../lib/schemas";
import type { OllaComun, Usuario } from "../../types";

/** En móvil cada sección es un acordeón; desde lg siempre está desplegada. */
function Acordeon({ id, titulo, children, abiertoInicial = false }: { id: string; titulo: string; children: ReactNode; abiertoInicial?: boolean }) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  return (
    <section className="card p-0">
      <h2>
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={`${id}-panel`}
          onClick={() => setAbierto((v) => !v)}
          className="toque flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-medium text-ink lg:pointer-events-none"
        >
          {titulo}
          <Icono nombre="abajo" className={`h-5 w-5 transition-transform lg:hidden ${abierto ? "rotate-180" : ""}`} />
        </button>
      </h2>
      <div id={`${id}-panel`} className={`${abierto ? "block" : "hidden"} px-5 pb-5 lg:block`}>
        {children}
      </div>
    </section>
  );
}

/** Vista 9 — Perfil de la olla (ollas_comunes) y de la cuenta del dirigente (usuarios). */
export default function PerfilPage() {
  const { usuario, logout } = useAuth();
  const [olla, setOlla] = useState<OllaComun | null>(null);
  const [errorOlla, setErrorOlla] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!usuario?.olla_id) return;
    api
      .get<OllaComun>("/ollas-comunes/mia")
      .then((o) => {
        setOlla(o);
        setErrorOlla(null);
      })
      .catch((err) => setErrorOlla(mensajeDeError(err, "No pudimos cargar los datos de tu olla.")));
  }, [usuario?.olla_id, intento]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mi perfil</h1>
        <p className="mt-1 text-muted">Actualiza los datos de tu organización y de tu cuenta.</p>
      </div>

      {errorOlla && <ErrorConReintento mensaje={errorOlla} onReintentar={() => setIntento((n) => n + 1)} />}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {olla && (
          <Acordeon id="olla" titulo="Datos de la olla común" abiertoInicial>
            <SeccionDatosOlla key={olla.id} olla={olla} onGuardado={setOlla} />
          </Acordeon>
        )}

        <div className="flex flex-col gap-6">
          <Acordeon id="cuenta" titulo="Datos de la dirigenta" abiertoInicial={!olla}>
            <SeccionDatosPersonales />
          </Acordeon>
          <Acordeon id="clave" titulo="Cambiar contraseña">
            <SeccionCambiarContrasena />
          </Acordeon>
        </div>
      </div>

      <button onClick={logout} className="btn-secondary self-start text-danger">
        <Icono nombre="salir" className="mr-2 h-5 w-5" /> Cerrar sesión
      </button>
    </div>
  );
}

function SeccionDatosOlla({ olla, onGuardado }: { olla: OllaComun; onGuardado: (o: OllaComun) => void }) {
  const metodos = useForm<FormOlla>({ resolver: zodResolver(esquemaOlla), defaultValues: formOllaDesdeOlla(olla), mode: "onTouched" });
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const { isSubmitting } = metodos.formState;

  async function guardar(valores: FormOlla) {
    setError(null);
    setGuardado(false);
    try {
      onGuardado(await api.put<OllaComun>("/ollas-comunes/mia", datosParaApi(valores)));
      setGuardado(true);
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos guardar los datos de la olla."));
    }
  }

  return (
    <FormProvider {...metodos}>
      <form onSubmit={metodos.handleSubmit(guardar)} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Los cambios actualizan el perfil de tu olla. La solicitud ya enviada conserva los datos con los que postulaste.
        </p>
        <CamposOlla nombreDirigenta={`${olla.dirigente_nombres} ${olla.dirigente_apellidos}`} />
        {error && <p role="alert" className="flex items-start gap-2 text-sm text-danger"><Icono nombre="equis" className="mt-0.5 h-4 w-4" /> {error}</p>}
        {guardado && <p role="status" className="flex items-start gap-2 text-sm text-success"><Icono nombre="check" className="mt-0.5 h-4 w-4" /> Los datos de la olla se guardaron correctamente.</p>}
        <button type="submit" className="btn-primary self-start" disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Guardar datos de la olla"}
        </button>
      </form>
    </FormProvider>
  );
}

function SeccionDatosPersonales() {
  const { usuario, actualizarUsuario } = useAuth();
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setGuardado(false);
    try {
      // La API solo permite cambiar el correo: nombres y apellidos vienen de RENIEC
      actualizarUsuario(await api.put<Usuario>("/usuarios/me", { email }));
      setGuardado(true);
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos guardar tus datos."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label-field" htmlFor="p-dni">DNI</label>
        <input id="p-dni" className="input-field bg-bg text-muted" value={usuario?.dni ?? ""} disabled />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor="p-nombres">Nombres</label>
          <input id="p-nombres" className="input-field bg-bg text-muted" value={usuario?.nombres ?? ""} disabled />
        </div>
        <div>
          <label className="label-field" htmlFor="p-apellidos">Apellidos</label>
          <input id="p-apellidos" className="input-field bg-bg text-muted" value={usuario?.apellidos ?? ""} disabled />
        </div>
      </div>
      <p className="-mt-2 text-sm text-muted">Tu nombre viene de RENIEC y no se puede modificar; solo puedes cambiar tu correo.</p>
      <div>
        <label className="label-field" htmlFor="p-email">Correo electrónico</label>
        <input id="p-email" type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      {error && <p role="alert" className="flex items-start gap-2 text-sm text-danger"><Icono nombre="equis" className="mt-0.5 h-4 w-4" /> {error}</p>}
      {guardado && <p role="status" className="flex items-start gap-2 text-sm text-success"><Icono nombre="check" className="mt-0.5 h-4 w-4" /> Tus datos se guardaron correctamente.</p>}
      <button type="submit" className="btn-primary self-start" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

function SeccionCambiarContrasena() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);
    setEnviando(true);
    try {
      await api.put("/usuarios/me/contrasena", { actual, nueva });
      setExito(true);
      setActual("");
      setNueva("");
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos actualizar tu contraseña."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Campo id="c-actual" etiqueta="Contraseña actual">
        <input id="c-actual" type="password" autoComplete="current-password" className="input-field" value={actual} onChange={(e) => setActual(e.target.value)} required />
      </Campo>
      <Campo id="c-nueva" etiqueta="Nueva contraseña (mínimo 8 caracteres)">
        <input id="c-nueva" type="password" autoComplete="new-password" className="input-field" value={nueva} onChange={(e) => setNueva(e.target.value)} required minLength={8} />
      </Campo>
      {error && <p role="alert" className="flex items-start gap-2 text-sm text-danger"><Icono nombre="equis" className="mt-0.5 h-4 w-4" /> {error}</p>}
      {exito && <p role="status" className="flex items-start gap-2 text-sm text-success"><Icono nombre="check" className="mt-0.5 h-4 w-4" /> Tu contraseña se actualizó correctamente.</p>}
      <button type="submit" className="btn-secondary self-start" disabled={enviando}>
        {enviando ? "Actualizando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
