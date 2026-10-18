import type { EstadoSolicitud } from "../../types";
import { Icono, type NombreIcono } from "./Icono";

export type Tono = "neutro" | "exito" | "alerta" | "peligro" | "info";

interface StatusBadgeProps {
  estado: string;
  tono: Tono;
  /** Por defecto el icono sale del tono; los estados de la solicitud usan el suyo. */
  icono?: NombreIcono;
}

const TONOS: Record<Tono, string> = {
  neutro: "bg-border/60 text-ink",
  exito: "bg-success-light text-success",
  alerta: "bg-accent-light text-accent-dark",
  peligro: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
};

const ICONO_POR_TONO: Record<Tono, NombreIcono> = {
  neutro: "reloj",
  exito: "check",
  alerta: "alerta",
  peligro: "equis",
  info: "arena",
};

const ETIQUETAS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_EVALUACION: "En evaluación",
  OBSERVADA: "Observada",
  APTA: "Apta",
  NO_APTA: "No apta",
};

const TONO_POR_ESTADO: Record<EstadoSolicitud, Tono> = {
  PENDIENTE: "neutro",
  EN_EVALUACION: "info",
  OBSERVADA: "alerta",
  APTA: "exito",
  NO_APTA: "peligro",
};

// eslint-disable-next-line react/only-export-components
export const tonoDeEstado = (estado: EstadoSolicitud): Tono => TONO_POR_ESTADO[estado];

/** Un estado nunca se comunica solo por color: siempre icono + texto. */
export function StatusBadge({ estado, tono, icono }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-sm font-medium ${TONOS[tono]}`}>
      <Icono nombre={icono ?? ICONO_POR_TONO[tono]} className="h-4 w-4" />
      {ETIQUETAS[estado] ?? estado}
    </span>
  );
}
