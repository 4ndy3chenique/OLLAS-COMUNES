import { useEffect, useState, type FormEvent } from "react";
import { api, mensajeDeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CamposOlla } from "../components/olla/CamposOlla";
import { formOllaDesdeOlla, validarFormOlla, type FormOlla } from "../lib/formOlla";
import type { OllaComun, Usuario } from "../types";

/** Vista 9 — Perfil de la olla (ollas_comunes) y de la cuenta del dirigente (usuarios). */
export default function PerfilPage() {
  const { usuario, logout } = useAuth();
  const [olla, setOlla] = useState<OllaComun | null>(null);
  const [errorOlla, setErrorOlla] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario?.olla_id) return;
    api
      .get<OllaComun>("/ollas-comunes/mia")
      .then(setOlla)
      .catch((err) => setErrorOlla(mensajeDeError(err, "No pudimos cargar los datos de tu olla.")));
  }, [usuario?.olla_id]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mi perfil</h1>
        <p className="mt-1 text-muted">Actualiza los datos de tu organización y de tu cuenta.</p>
      </div>

      {errorOlla && <p className="text-sm text-danger">{errorOlla}</p>}
      {olla && <SeccionDatosOlla key={olla.id} olla={olla} onGuardado={setOlla} />}

      <SeccionDatosPersonales />

      <SeccionCambiarContrasena />

      <button onClick={logout} className="btn-secondary self-start text-danger">
        Cerrar sesión
      </button>
    </div>
  );
}

function SeccionDatosOlla({ olla, onGuardado }: { olla: OllaComun; onGuardado: (o: OllaComun) => void }) {
  const [form, setForm] = useState<FormOlla>(() => formOllaDesdeOlla(olla));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardado(false);
    const validacion = validarFormOlla(form);
    if ("error" in validacion) {
      setError(validacion.error);
      return;
    }
    setEnviando(true);
    try {
      onGuardado(await api.put<OllaComun>("/ollas-comunes/mia", validacion.datos));
      setGuardado(true);
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos guardar los datos de la olla."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card flex flex-col gap-4">
      <div>
        <h2 className="font-medium text-ink">Datos de la olla común</h2>
        <p className="mt-1 text-sm text-muted">
          Los cambios actualizan el perfil de tu olla. La solicitud ya enviada conserva los datos con los que postulaste.
        </p>
      </div>
      <CamposOlla
        form={form}
        onChange={setForm}
        nombreDirigenta={`${olla.dirigente_nombres} ${olla.dirigente_apellidos}`}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      {guardado && <p className="text-sm text-primary">Los datos de la olla se guardaron correctamente.</p>}
      <button type="submit" className="btn-primary self-start" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar datos de la olla"}
      </button>
    </form>
  );
}

function SeccionDatosPersonales() {
  const { usuario, actualizarUsuario } = useAuth();
  const [nombres, setNombres] = useState(usuario?.nombres ?? "");
  const [apellidos, setApellidos] = useState(usuario?.apellidos ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setGuardado(false);
    try {
      actualizarUsuario(await api.put<Usuario>("/usuarios/me", { nombres, apellidos, email }));
      setGuardado(true);
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos guardar tus datos."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card flex flex-col gap-4">
      <h2 className="font-medium text-ink">Datos de la dirigenta</h2>
      <div>
        <label className="label-field" htmlFor="p-dni">DNI</label>
        <input id="p-dni" className="input-field bg-bg text-muted" value={usuario?.dni ?? ""} disabled />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor="p-nombres">Nombres</label>
          <input id="p-nombres" className="input-field" value={nombres} onChange={(e) => setNombres(e.target.value)} required />
        </div>
        <div>
          <label className="label-field" htmlFor="p-apellidos">Apellidos</label>
          <input id="p-apellidos" className="input-field" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="label-field" htmlFor="p-email">Correo electrónico</label>
        <input id="p-email" type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {guardado && <p className="text-sm text-primary">Tus datos se guardaron correctamente.</p>}
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

  async function onSubmit(e: FormEvent) {
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
    <form onSubmit={onSubmit} className="card flex flex-col gap-4">
      <h2 className="font-medium text-ink">Cambiar contraseña</h2>
      <div>
        <label className="label-field" htmlFor="c-actual">Contraseña actual</label>
        <input id="c-actual" type="password" className="input-field" value={actual} onChange={(e) => setActual(e.target.value)} required />
      </div>
      <div>
        <label className="label-field" htmlFor="c-nueva">Nueva contraseña (mínimo 8 caracteres)</label>
        <input id="c-nueva" type="password" className="input-field" value={nueva} onChange={(e) => setNueva(e.target.value)} required minLength={8} />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {exito && <p className="text-sm text-primary">Tu contraseña se actualizó correctamente.</p>}
      <button type="submit" className="btn-secondary self-start" disabled={enviando}>
        {enviando ? "Actualizando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
