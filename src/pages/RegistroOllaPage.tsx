import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, mensajeDeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CamposOlla } from "../components/olla/CamposOlla";
import { FORM_OLLA_VACIO, validarFormOlla, type FormOlla } from "../lib/formOlla";

/** Vista 2 — Registro de la olla común (postulación). */
export default function RegistroOllaPage() {
  const { usuario, refrescarUsuario } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormOlla>(FORM_OLLA_VACIO);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [registrada, setRegistrada] = useState(false);

  // La cuenta admite una sola olla: si ya existe, se edita desde el perfil
  if (usuario?.olla_id && !registrada) return <Navigate to="/seguimiento" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validacion = validarFormOlla(form);
    if ("error" in validacion) {
      setError(validacion.error);
      return;
    }

    setEnviando(true);
    try {
      await api.post("/ollas-comunes", validacion.datos);
      setRegistrada(true);
      await refrescarUsuario(); // trae el olla_id recién asignado
      navigate("/integrantes");
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos registrar tu olla común. Intenta de nuevo en unos minutos."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Registra tu olla común</h1>
      <p className="mt-1 text-muted">
        Con estos datos se crea tu postulación ante el programa. Luego registrarás a los integrantes.
      </p>

      <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-4">
        <CamposOlla
          form={form}
          onChange={setForm}
          nombreDirigenta={`${usuario?.nombres ?? ""} ${usuario?.apellidos ?? ""}`.trim()}
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" className="btn-primary mt-2 justify-center" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar y continuar"}
        </button>
      </form>
    </div>
  );
}
