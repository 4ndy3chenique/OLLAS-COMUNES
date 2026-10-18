import type { NombreIcono } from "../ui/Icono";

export interface DestinoNav {
  to: string;
  etiqueta: string;
  icono: NombreIcono;
  /** Solo en la barra lateral: en móvil se limita a 5 destinos (Historial se alcanza desde "Mi solicitud"). */
  soloLateral?: boolean;
  conContador?: boolean;
}

/** Scaffold de la Plataforma Operativa: apagado salvo que VITE_OPERATIVO_HABILITADO=true. */
export const OPERATIVO_HABILITADO = import.meta.env.VITE_OPERATIVO_HABILITADO === "true";

const DESTINOS_SOLICITANTE: DestinoNav[] = [
  { to: "/app/seguimiento", etiqueta: "Mi solicitud", icono: "planilla" },
  { to: "/app/integrantes", etiqueta: "Integrantes", icono: "familia" },
  { to: "/app/resultado", etiqueta: "Asignación", icono: "nutricion" },
  { to: "/app/historial", etiqueta: "Historial", icono: "historial", soloLateral: true },
  { to: "/app/notificaciones", etiqueta: "Avisos", icono: "campana", conContador: true },
  { to: "/app/perfil", etiqueta: "Perfil", icono: "usuario" },
];

const DESTINOS_OPERATIVOS: DestinoNav[] = [
  { to: "/operativo/padron", etiqueta: "Padrón (demo)", icono: "familia", soloLateral: true },
  { to: "/operativo/escaneo", etiqueta: "Escaneo QR (demo)", icono: "camara", soloLateral: true },
];

export const DESTINOS: DestinoNav[] = OPERATIVO_HABILITADO ? [...DESTINOS_SOLICITANTE, ...DESTINOS_OPERATIVOS] : DESTINOS_SOLICITANTE;
