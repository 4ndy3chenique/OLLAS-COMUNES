import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { mensajeDeError } from "../lib/api";
import { esFormatoDniValido, verificarConReniec } from "../lib/dniValidation";
import type { ResultadoVerificacionReniec } from "../types";

export default function LoginPage() {
  const [modo, setModo] = useState<"login" | "registro">("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-primary-dark">Ollas Comunes</h1>
          <p className="mt-1 text-muted">Plataforma del Solicitante</p>
        </div>

        <div className="card">
          <div className="mb-6 flex rounded-sm bg-bg p-1">
            <button
              className={`flex-1 rounded-sm py-2 text-sm font-medium transition-colors ${
                modo === "login" ? "bg-surface text-ink shadow-sm" : "text-muted"
              }`}
              onClick={() => setModo("login")}
            >
              Ingresar
            </button>
            <button
              className={`flex-1 rounded-sm py-2 text-sm font-medium transition-colors ${
                modo === "registro" ? "bg-surface text-ink shadow-sm" : "text-muted"
              }`}
              onClick={() => setModo("registro")}
            >
              Crear cuenta
            </button>
          </div>

          {modo === "login" ? <FormularioLogin /> : <FormularioRegistro />}
        </div>
      </div>
    </div>
  );
}

function FormularioLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login({ identificador, password });
      navigate("/seguimiento");
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos iniciar tu sesión. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label-field" htmlFor="identificador">
          DNI o correo electrónico
        </label>
        <input
          id="identificador"
          className="input-field"
          placeholder="12345678 o tucorreo@ejemplo.com"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label-field" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" className="btn-primary mt-2 justify-center" disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}

function FormularioRegistro() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reniec, setReniec] = useState<ResultadoVerificacionReniec | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const formatoInvalido = dni.length > 0 && !esFormatoDniValido(dni);

  function onCambiarDni(valor: string) {
    setDni(valor.replace(/\D/g, ""));
    setReniec(null); // cualquier cambio obliga a verificar de nuevo
  }

  async function verificarDni() {
    setError(null);
    if (!esFormatoDniValido(dni)) {
      setError("El DNI debe tener exactamente 8 dígitos.");
      return;
    }
    setVerificando(true);
    try {
      setReniec(await verificarConReniec(dni));
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos verificar tu DNI. Intenta de nuevo."));
    } finally {
      setVerificando(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!reniec?.valido) {
      setError("Primero verifica tu DNI en RENIEC.");
      return;
    }
    setEnviando(true);
    try {
      await registrar({ dni, email, password });
      navigate("/registro-olla");
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos crear tu cuenta. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label-field" htmlFor="dni">
          DNI (8 dígitos)
        </label>
        <div className="flex gap-2">
          <input
            id="dni"
            className="input-field"
            inputMode="numeric"
            maxLength={8}
            value={dni}
            onChange={(e) => onCambiarDni(e.target.value)}
            required
          />
          <button
            type="button"
            className="btn-secondary shrink-0 px-4"
            onClick={verificarDni}
            disabled={verificando || dni.length === 0}
          >
            {verificando ? "Verificando…" : "Verificar"}
          </button>
        </div>
        {formatoInvalido && <p className="mt-1 text-sm text-danger">El DNI debe tener exactamente 8 dígitos.</p>}
        {reniec && !reniec.valido && <p className="mt-1 text-sm text-danger">{reniec.motivo}</p>}
      </div>

      {reniec?.valido && (
        <div className="rounded border border-primary-light bg-primary-light px-4 py-3">
          <p className="text-sm text-primary-dark">DNI verificado en RENIEC</p>
          <p className="font-medium text-primary-dark">
            {reniec.nombres} {reniec.apellidos}
          </p>
        </div>
      )}

      <div>
        <label className="label-field" htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label-field" htmlFor="reg-password">Contraseña (mínimo 8 caracteres)</label>
        <input
          id="reg-password"
          type="password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" className="btn-primary mt-2 justify-center" disabled={enviando || !reniec?.valido}>
        {enviando ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
