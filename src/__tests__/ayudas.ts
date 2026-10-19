/**
 * Utilidades compartidas por las pruebas unitarias.
 * Todas las llamadas a la API van mockeadas: nunca se toca la red real
 * (ni la API de Azure ni la local; ver `test.env` en vite.config.ts).
 */
import { vi } from "vitest";
import type { SesionAutenticada, Usuario } from "../types";

type ImplementacionFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/** Respuesta simulada mínima: solo lo que usa `lib/api.ts` (ok, status, json). */
export function respuesta(cuerpo: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => cuerpo,
  } as unknown as Response;
}

/** Usuario dirigente de referencia (mismo perfil que devuelve GET /usuarios/me). */
export const USUARIO_BASE: Usuario = {
  id: 1,
  dni: "45678912",
  nombres: "María Elena",
  apellidos: "Quispe Torres",
  email: "dirigenta@ejemplo.com",
  rol_id: 1,
  rol_nombre: "SOLICITANTE_DIRIGENTE",
  olla_id: null,
  estado: "ACTIVO",
  created_at: "2026-10-01T10:00:00",
};

export function sesionDe(usuario: Usuario = USUARIO_BASE, token = "token-de-prueba"): SesionAutenticada {
  return { usuario, access_token: token, refresh_token: token, expira_en: "2026-10-02T10:00:00" };
}

/** Deja una sesión autenticada en localStorage, igual que AuthContext con "Recordarme". */
export function sembrarSesion(usuario: Usuario = USUARIO_BASE, token = "token-de-prueba"): void {
  localStorage.setItem("sesion_usuario", JSON.stringify(usuario));
  localStorage.setItem("access_token", token);
  localStorage.setItem("refresh_token", token);
}

/** Instala un fetch mockeado como global (se revierte con `vi.unstubAllGlobals()`). */
export function instalarFetch(implementacion?: ImplementacionFetch) {
  const mock = vi.fn<ImplementacionFetch>(implementacion ?? (async () => respuesta({})));
  vi.stubGlobal("fetch", mock);
  return mock;
}

export type FetchMock = ReturnType<typeof instalarFetch>;

/** Llamadas a fetch cuyo URL termina en `sufijo`. */
export function llamadasA(mock: FetchMock, sufijo: string) {
  return mock.mock.calls.filter(([input]) => String(input).endsWith(sufijo));
}
