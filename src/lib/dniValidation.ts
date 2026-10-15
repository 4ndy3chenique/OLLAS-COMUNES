/**
 * Validación de formato de DNI en cliente (feedback inmediato) y verificación
 * de identidad contra el mock RENIEC a través del backend.
 */

import { api } from "./api";
import type { ResultadoVerificacionReniec } from "../types";

/** Formato: exactamente 8 dígitos numéricos. Un DNI mal formado no se consulta. */
export function esFormatoDniValido(dni: string): boolean {
  return /^\d{8}$/.test(dni);
}

/** Consulta RENIEC (bd_estado_reniec) vía backend; la consulta queda registrada en consultas_reniec. */
export function verificarConReniec(dni: string): Promise<ResultadoVerificacionReniec> {
  return api.get<ResultadoVerificacionReniec>(`/reniec/verificar/${dni}`);
}
