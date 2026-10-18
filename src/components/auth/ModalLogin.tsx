import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../context/AuthContext";
import { mensajeDeError } from "../../lib/api";
import { esquemaLogin, type FormLogin } from "../../lib/schemas";
import { Campo } from "../ui/Campo";

interface ModalLoginProps {
  identificadorInicial: string;
  onIdentificador: (valor: string) => void;
  onIrARegistro: () => void;
  onExito: () => void;
}

/** Formulario de ingreso: DNI o correo + contraseña. "Recordarme" decide localStorage vs sessionStorage. */
export function ModalLogin({ identificadorInicial, onIdentificador, onIrARegistro, onExito }: ModalLoginProps) {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { identificador: identificadorInicial, password: "", recordarme: false },
  });

  async function alEnviar(datos: FormLogin) {
    try {
      await login({ identificador: datos.identificador.trim(), password: datos.password }, datos.recordarme);
      onExito();
    } catch (err) {
      setError("root", { message: mensajeDeError(err, "No pudimos iniciar tu sesión. Intenta de nuevo.") });
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} noValidate className="flex flex-col gap-4">
      {errors.root && (
        <p role="alert" className="rounded border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger">
          ✖ {errors.root.message}
        </p>
      )}

      <Campo id="login-identificador" etiqueta="DNI o correo electrónico" error={errors.identificador?.message}>
        <input
          id="login-identificador"
          className="input-field"
          autoComplete="username"
          placeholder="12345678 o tucorreo@ejemplo.com"
          aria-invalid={!!errors.identificador}
          aria-describedby={errors.identificador ? "login-identificador-error" : undefined}
          {...register("identificador", { onChange: (e) => onIdentificador(e.target.value) })}
        />
      </Campo>

      <Campo id="login-password" etiqueta="Contraseña" error={errors.password?.message}>
        <input
          id="login-password"
          type="password"
          className="input-field"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          {...register("password")}
        />
      </Campo>

      <label className="toque flex cursor-pointer items-center gap-3 text-sm text-ink">
        <input type="checkbox" className="h-5 w-5 rounded border-border" {...register("recordarme")} />
        Recordarme en este dispositivo
      </label>

      <button type="submit" className="btn-primary justify-center" disabled={isSubmitting}>
        {isSubmitting ? "Ingresando…" : "Ingresar"}
      </button>

      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <button type="button" onClick={onIrARegistro} className="toque font-medium text-primary underline">
          Regístrate
        </button>
      </p>
    </form>
  );
}
