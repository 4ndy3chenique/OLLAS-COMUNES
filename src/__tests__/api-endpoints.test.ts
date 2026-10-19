/**
 * Módulo 13 — Cliente HTTP y contrato de endpoints (lib/api.ts).
 * Prueba 1 (éxito): cada endpoint de la API PHP (endpoints/src/rutas.php) se invoca con el
 *   método, la ruta y el cuerpo JSON que espera el contrato, llevando el Bearer token.
 * Prueba 2 (errores): 401 despacha "sesion-expirada", 422 agrega el detalle por campo, 204 no
 *   devuelve cuerpo y una caída de red se traduce en ApiError con estado 0.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError, mensajeDeError } from "../lib/api";
import { instalarFetch, respuesta } from "./ayudas";

type Ruta = { metodo: "GET" | "POST" | "PUT" | "DELETE"; path: string; cuerpo?: unknown };

/** Contrato completo del frontend con la API (todas las llamadas salen de lib/api.ts). */
const RUTAS: Ruta[] = [
  { metodo: "GET", path: "/reniec/verificar/45678912" },
  { metodo: "POST", path: "/auth/registro-dirigente", cuerpo: { dni: "45678912", email: "a@ejemplo.com", password: "Clave12345" } },
  { metodo: "POST", path: "/auth/login", cuerpo: { identificador: "45678912", password: "Clave12345" } },
  { metodo: "GET", path: "/usuarios/me" },
  { metodo: "PUT", path: "/usuarios/me", cuerpo: { email: "a@ejemplo.com" } },
  { metodo: "PUT", path: "/usuarios/me/contrasena", cuerpo: { actual: "vieja", nueva: "nueva1234" } },
  { metodo: "POST", path: "/ollas-comunes", cuerpo: { nombre: "Olla" } },
  { metodo: "GET", path: "/ollas-comunes/mia" },
  { metodo: "PUT", path: "/ollas-comunes/mia", cuerpo: { nombre: "Olla" } },
  { metodo: "GET", path: "/solicitudes/actual" },
  { metodo: "GET", path: "/solicitudes/7" },
  { metodo: "GET", path: "/solicitudes/7/integrantes" },
  { metodo: "POST", path: "/solicitudes/7/integrantes", cuerpo: { dni: "11223344", parentesco_con_dirigente: "HIJO" } },
  { metodo: "DELETE", path: "/solicitudes/7/integrantes/3" },
  { metodo: "POST", path: "/solicitudes/7/enviar", cuerpo: { declaracion_jurada: true } },
  { metodo: "GET", path: "/solicitudes/7/resultado" },
  { metodo: "GET", path: "/solicitudes/historial" },
  { metodo: "POST", path: "/solicitudes/renovar" },
  { metodo: "GET", path: "/notificaciones" },
  { metodo: "PUT", path: "/notificaciones/1/leer" },
];

describe("M13 · Cliente HTTP y contrato de endpoints (lib/api.ts)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("access_token", "token-api");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Prueba 1 (éxito): cada endpoint se llama con su método, ruta, cuerpo y Bearer token", async () => {
    const fetchMock = instalarFetch(async () => respuesta({}));

    for (const ruta of RUTAS) {
      fetchMock.mockClear();
      const etiqueta = `${ruta.metodo} ${ruta.path}`;

      if (ruta.metodo === "GET") await api.get(ruta.path);
      else if (ruta.metodo === "POST") await api.post(ruta.path, ruta.cuerpo);
      else if (ruta.metodo === "PUT") await api.put(ruta.path, ruta.cuerpo);
      else await api.delete(ruta.path);

      expect(fetchMock, etiqueta).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url).endsWith(ruta.path), etiqueta).toBe(true);
      expect(init?.method, etiqueta).toBe(ruta.metodo);
      const cabeceras = (init?.headers ?? {}) as Record<string, string>;
      expect(cabeceras["Content-Type"], etiqueta).toBe("application/json");
      expect(cabeceras["Authorization"], etiqueta).toBe("Bearer token-api");

      if (ruta.cuerpo !== undefined) {
        expect(JSON.parse(String(init?.body)), etiqueta).toEqual(ruta.cuerpo);
      } else {
        expect(init?.body, etiqueta).toBeUndefined();
      }
    }
  });

  it("Prueba 2 (errores): 401 avisa de la sesión caída, 422 detalla por campo, 204 sin cuerpo y red → ApiError 0", async () => {
    // a) 401 con token guardado → evento global para que AuthContext cierre la sesión
    const oyente = vi.fn();
    window.addEventListener("sesion-expirada", oyente);
    let fetchMock = instalarFetch(async () => respuesta({ mensaje: "Tu sesión expiró." }, 401));

    const err401 = await api.get("/usuarios/me").catch((e: unknown) => e);
    expect(err401).toBeInstanceOf(ApiError);
    expect((err401 as ApiError).status).toBe(401);
    expect((err401 as ApiError).message).toBe("Tu sesión expiró.");
    expect(oyente).toHaveBeenCalledTimes(1);

    // 401 sin token: no hay sesión que cerrar, no se dispara el evento
    localStorage.removeItem("access_token");
    await api.get("/usuarios/me").catch(() => undefined);
    expect(oyente).toHaveBeenCalledTimes(1);

    // b) 422: el mensaje general se completa con el detalle por campo
    fetchMock = instalarFetch(async () =>
      respuesta({ mensaje: "Datos inválidos.", errores: { dni: "Debe tener 8 dígitos.", email: "Correo inválido." } }, 422)
    );
    const err422 = await api.post("/auth/registro-dirigente", {}).catch((e: unknown) => e);
    expect((err422 as ApiError).message).toBe("Datos inválidos. Debe tener 8 dígitos. Correo inválido.");

    // c) 204: sin cuerpo
    fetchMock = instalarFetch(async () => respuesta(undefined, 204));
    await expect(api.delete("/solicitudes/7/integrantes/3")).resolves.toBeUndefined();

    // d) Caída de red: ApiError con estado 0 y mensaje genérico; mensajeDeError respeta el valor por defecto
    fetchMock = instalarFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    const errRed = await api.get("/notificaciones").catch((e: unknown) => e);
    expect(errRed).toBeInstanceOf(ApiError);
    expect((errRed as ApiError).status).toBe(0);
    expect((errRed as ApiError).message).toMatch(/No pudimos conectar con el servidor/);
    expect(mensajeDeError(new Error("otro"), "Mensaje por defecto")).toBe("Mensaje por defecto");

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/notificaciones"), expect.anything());
    window.removeEventListener("sesion-expirada", oyente);
  });
});
