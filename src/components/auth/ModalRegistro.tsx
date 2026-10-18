import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../context/AuthContext";
import { mensajeDeError } from "../../lib/api";
import { esFormatoDniValido, verificarConReniec } from "../../lib/dniValidation";
import { esquemaRegistro, type FormRegistro } from "../../lib/schemas";
import type { ResultadoVerificacionReniec } from "../../types";
import { Campo } from "../ui/Campo";
import { Icono } from "../ui/Icono";

type EstadoReniec =
  | { fase: "inactivo" }
  | { fase: "verificando" }
  | { fase: "resultado"; datos: ResultadoVerificacionReniec }
  | { fase: "error"; mensaje: string };

interface ModalRegistroProps {
  dniInicial: string;
  onDni: (valor: string) => void;
  onIrALogin: () => void;
  onExito: () => void;
}

/** Fuerza simple de contraseña (1–3) con etiqueta de texto. */
function fuerzaPassword(p: string): { nivel: number; etiqueta: string } {
  if (p.length === 0) return { nivel: 0, etiqueta: "" };
  if (p.length < 8) return { nivel: 1, etiqueta: "Débil" };
  let puntos = 1;
  if ((/[a-z]/.test(p) && /[A-Z]/.test(p)) || p.length >= 12) puntos++;
  if (/\d/.test(p) && /[A-Za-z]/.test(p)) puntos++;
  return { nivel: puntos, etiqueta: ["", "Débil", "Media", "Fuerte"][puntos] };
}

export function ModalRegistro({ dniInicial, onDni, onIrALogin, onExito }: ModalRegistroProps) {
  const { registrar } = useAuth();
  const [reniec, setReniec] = useState<EstadoReniec>({ fase: "inactivo" });
  const ultimoVerificado = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormRegistro>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: { dni: dniInicial, email: "", password: "", aceptaDatos: false },
  });

  const dni = watch("dni");
  const password = watch("password");

  async function verificar(valor: string) {
    ultimoVerificado.current = valor;
    setReniec({ fase: "verificando" });
    try {
      const datos = await verificarConReniec(valor);
      if (ultimoVerificado.current === valor) setReniec({ fase: "resultado", datos });
    } catch (err) {
      if (ultimoVerificado.current === valor) {
        setReniec({ fase: "error", mensaje: mensajeDeError(err, "No pudimos verificar tu DNI. Intenta de nuevo.") });
      }
    }
  }

  // Validación automática al completar los 8 dígitos; cualquier cambio posterior obliga a verificar de nuevo
  useEffect(() => {
    if (esFormatoDniValido(dni)) {
      if (ultimoVerificado.current !== dni) void verificar(dni);
    } else {
      ultimoVerificado.current = null;
      setReniec({ fase: "inactivo" });
    }
  }, [dni]);

  const persona = reniec.fase === "resultado" && reniec.datos.valido ? reniec.datos : null;
  const fuerza = fuerzaPassword(password);

  async function alEnviar(datos: FormRegistro) {
    if (!persona) {
      setError("dni", { message: "Primero valida tu DNI en RENIEC." });
      return;
    }
    try {
      // La API toma nombres y apellidos de RENIEC: solo se envían dni, email y password
      await registrar({ dni: datos.dni, email: datos.email.trim(), password: datos.password });
      onExito();
    } catch (err) {
      setError("root", { message: mensajeDeError(err, "No pudimos crear tu cuenta. Intenta de nuevo.") });
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} noValidate className="flex flex-col gap-4">
      {errors.root && (
        <p role="alert" className="rounded border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger">
          ✖ {errors.root.message}
        </p>
      )}

      <Campo id="reg-dni" etiqueta="DNI (8 dígitos)" error={errors.dni?.message}>
        <div className="flex gap-2">
          <input
            id="reg-dni"
            className="input-field"
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            aria-invalid={!!errors.dni}
            aria-describedby={errors.dni ? "reg-dni-error" : "reg-dni-estado"}
            {...register("dni", {
              onChange: (e) => {
                const limpio = e.target.value.replace(/\D/g, "");
                setValue("dni", limpio);
                onDni(limpio);
              },
            })}
          />
          <button
            type="button"
            className="btn-secondary shrink-0 px-4"
            disabled={!esFormatoDniValido(dni) || reniec.fase === "verificando"}
            onClick={() => void verificar(dni)}
          >
            Validar DNI
          </button>
        </div>
      </Campo>

      <div id="reg-dni-estado" aria-live="polite">
        {reniec.fase === "verificando" && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Icono nombre="reloj" /> Verificando en RENIEC…
          </p>
        )}
        {reniec.fase === "error" && (
          <p className="flex items-center gap-2 text-sm text-danger">
            <Icono nombre="wifiOff" /> {reniec.mensaje}
          </p>
        )}
        {reniec.fase === "resultado" && !reniec.datos.valido && (
          <p className="flex items-center gap-2 text-sm text-danger">
            <Icono nombre="equis" /> {reniec.datos.motivo}
          </p>
        )}
        {persona && (
          <p className="flex items-center gap-2 text-sm text-primary-dark">
            <Icono nombre="check" /> DNI vigente verificado en RENIEC
          </p>
        )}
      </div>

      {persona && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="reg-nombres">Nombres</label>
            <input id="reg-nombres" className="input-field bg-bg text-muted" value={persona.nombres ?? ""} readOnly aria-readonly />
          </div>
          <div>
            <label className="label-field" htmlFor="reg-apellidos">Apellidos</label>
            <input id="reg-apellidos" className="input-field bg-bg text-muted" value={persona.apellidos ?? ""} readOnly aria-readonly />
          </div>
        </div>
      )}

      <Campo id="reg-email" etiqueta="Correo electrónico" error={errors.email?.message}>
        <input
          id="reg-email"
          type="email"
          className="input-field"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "reg-email-error" : undefined}
          {...register("email")}
        />
      </Campo>

      <Campo
        id="reg-password"
        etiqueta="Contraseña (mínimo 8 caracteres)"
        error={errors.password?.message}
        ayuda={
          fuerza.nivel > 0 && (
            <span className="flex items-center gap-2">
              <span className="flex gap-1" aria-hidden>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={`h-1.5 w-8 rounded-full ${n <= fuerza.nivel ? "bg-primary" : "bg-border"}`} />
                ))}
              </span>
              Seguridad: {fuerza.etiqueta}
            </span>
          )
        }
      >
        <input
          id="reg-password"
          type="password"
          className="input-field"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "reg-password-error" : undefined}
          {...register("password")}
        />
      </Campo>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border"
            aria-invalid={!!errors.aceptaDatos}
            aria-describedby={errors.aceptaDatos ? "reg-acepta-error" : undefined}
            {...register("aceptaDatos")}
          />
          <span>
            Autorizo el tratamiento de mis datos personales conforme a la Ley N.° 29733 (
            <a href="/#transparencia" className="font-medium text-primary underline">ver detalle</a>).
          </span>
        </label>
        {errors.aceptaDatos && (
          <p id="reg-acepta-error" role="alert" className="mt-1 text-sm text-danger">✖ {errors.aceptaDatos.message}</p>
        )}
      </div>

      <button type="submit" className="btn-primary justify-center" disabled={isSubmitting || !persona}>
        {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <button type="button" onClick={onIrALogin} className="toque font-medium text-primary underline">
          Ingresa
        </button>
      </p>
    </form>
  );
}
