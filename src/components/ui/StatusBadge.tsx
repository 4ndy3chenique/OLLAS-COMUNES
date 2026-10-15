import type { EstadoSolicitud } from "../../types";

type Tono = "neutro" | "exito" | "alerta" | "peligro" | "info";

interface StatusBadgeProps {
  estado: string;
  tono: Tono;
}

const TONOS: Record<Tono, string> = {
  neutro: "bg-border/60 text-ink",
  exito: "bg-primary-light text-primary-dark",
  alerta: "bg-accent-light text-accent",
  peligro: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
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

export function StatusBadge({ estado, tono }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2.5 py-1 text-sm font-medium ${TONOS[tono]}`}
    >
      {ETIQUETAS[estado] ?? estado}
    </span>
  );
}
