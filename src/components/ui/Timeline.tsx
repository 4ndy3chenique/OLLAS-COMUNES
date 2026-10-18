import { Icono, type NombreIcono } from "./Icono";

export interface Hito {
  clave: string;
  etiqueta: string;
  /** done = ya ocurrió; actual = en curso; pendiente = aún no; fallo = terminó sin éxito (p. ej. No apta). */
  estado: "done" | "actual" | "pendiente" | "fallo";
  detalle?: string;
  fecha?: string;
}

const ICONO: Record<Hito["estado"], NombreIcono> = { done: "check", actual: "arena", pendiente: "reloj", fallo: "equis" };
const COLOR: Record<Hito["estado"], string> = {
  done: "bg-success-light text-success",
  actual: "bg-info-light text-info",
  pendiente: "bg-border/60 text-muted",
  fallo: "bg-danger-light text-danger",
};
const TEXTO: Record<Hito["estado"], string> = { done: "Completado", actual: "En curso", pendiente: "Pendiente", fallo: "No aprobado" };

/** Línea de tiempo vertical: cada hito con icono + etiqueta + estado en texto + fecha. */
export function Timeline({ hitos }: { hitos: Hito[] }) {
  return (
    <ol className="flex flex-col">
      {hitos.map((h, i) => (
        <li key={h.clave} className="relative flex gap-4 pb-6 last:pb-0">
          {i < hitos.length - 1 && <span aria-hidden className="absolute left-[1.0625rem] top-9 h-[calc(100%-2.25rem)] w-0.5 bg-border" />}
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${COLOR[h.estado]}`}>
            <Icono nombre={ICONO[h.estado]} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <p className="font-medium text-ink">{h.etiqueta}</p>
            <p className="text-sm text-muted">{TEXTO[h.estado]}{h.fecha ? ` · ${h.fecha}` : ""}</p>
            {h.detalle && <p className="mt-1 text-sm text-ink">{h.detalle}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
