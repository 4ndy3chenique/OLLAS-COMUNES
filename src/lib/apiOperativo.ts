/**
 * Servicio de la Plataforma Operativa. HOY NO EXISTEN ESTOS ENDPOINTS en la API (solo hay dominio de la
 * dirigenta), así que todo es un MOCK LOCAL etiquetado como DEMO: no se hace ninguna petición de red.
 * Contrato propuesto para la fase backend: Anexo A de la especificación
 * (GET /operativo/padron/{solicitudId}, POST /operativo/escaneos, POST /operativo/sincronizacion).
 *
 * Cuando existan, basta reemplazar el cuerpo de estas funciones por llamadas a `api` (lib/api.ts).
 */
import type { OperacionPendiente } from "./colaSincronizacion";

/** Mientras sea true la UI muestra "MODO DEMO" en todas las pantallas operativas. */
export const MODO_DEMO = true;

export interface IntegrantePadron {
  dni: string;
  nombres: string;
  apellidos: string;
  porciones: number;
  verificado_en: string;
}

const PADRON_DEMO: IntegrantePadron[] = [
  { dni: "45678912", nombres: "María Elena", apellidos: "Quispe Torres", porciones: 3, verificado_en: "2026-10-01T10:00:00" },
  { dni: "11223344", nombres: "Pedro", apellidos: "Quispe Ramos", porciones: 3, verificado_en: "2026-10-01T10:00:00" },
  { dni: "22334455", nombres: "Ana Lucía", apellidos: "Quispe Ramos", porciones: 3, verificado_en: "2026-10-01T10:00:00" },
];

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function obtenerPadron(): Promise<IntegrantePadron[]> {
  await espera(300);
  return PADRON_DEMO;
}

/**
 * Envía una operación de la cola. El mock falla sin conexión (como fallaría fetch) y simula latencia;
 * el real será idempotente por `uuid`, así que reenviar tras reconectar no duplica el escaneo.
 */
export async function enviarOperacion(_op: OperacionPendiente): Promise<void> {
  void _op;
  if (!navigator.onLine) throw new Error("Sin conexión");
  await espera(400);
}
