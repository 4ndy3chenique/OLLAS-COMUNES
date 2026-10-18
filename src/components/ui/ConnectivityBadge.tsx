import { Icono, type NombreIcono } from "./Icono";

interface Props {
  enLinea: boolean;
  sincronizando: boolean;
  pendientes: number;
  conError: number;
}

/** Badge flotante de conectividad: texto + icono + color (nunca solo color). */
export function ConnectivityBadge({ enLinea, sincronizando, pendientes, conError }: Props) {
  let icono: NombreIcono = "wifi";
  let texto = "En línea";
  let color = "bg-success-light text-success border-success";

  if (conError > 0) {
    icono = "alerta";
    texto = `${conError} con error`;
    color = "bg-danger-light text-danger border-danger";
  } else if (!enLinea) {
    icono = "wifiOff";
    texto = pendientes > 0 ? `Modo offline · ${pendientes} pendiente${pendientes === 1 ? "" : "s"}` : "Modo offline";
    color = "bg-accent-light text-accent-dark border-accent";
  } else if (sincronizando) {
    icono = "reloj";
    texto = "Sincronizando…";
    color = "bg-info-light text-info border-info";
  } else if (pendientes > 0) {
    icono = "bandeja";
    texto = `${pendientes} pendiente${pendientes === 1 ? "" : "s"}`;
    color = "bg-info-light text-info border-info";
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm lg:bottom-6 ${color}`}
    >
      <Icono nombre={icono} className="h-4 w-4" />
      {texto}
    </div>
  );
}
