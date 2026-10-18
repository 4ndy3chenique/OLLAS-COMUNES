/**
 * Cliente HTTP centralizado para consumir la API REST del backend (PHP, carpeta endpoints/).
 * Inyecta el access_token y expone helpers get/post/put/delete tipados.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error("Falta la variable VITE_API_BASE_URL. Copia .env.example a .env y configúrala.");
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/** La sesión vive en localStorage ("Recordarme") o en sessionStorage (se pierde al cerrar el navegador). */
function getAccessToken(): string | null {
  return localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.", 0);
  }

  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      const cuerpo = await response.json();
      mensaje = cuerpo.mensaje ?? cuerpo.message ?? mensaje;
      // 422: la API detalla el problema por campo en `errores`; se muestra si aporta más que el mensaje general
      const detalles = cuerpo.errores ? Object.values<string>(cuerpo.errores) : [];
      if (detalles.length > 0 && !detalles.includes(mensaje)) mensaje = `${mensaje} ${detalles.join(" ")}`;
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    // Sesión inválida: se limpia y se vuelve al login
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event("sesion-expirada"));
    }
    throw new ApiError(mensaje, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Mensaje de error apto para mostrar al usuario. */
export function mensajeDeError(err: unknown, porDefecto: string): string {
  return err instanceof ApiError ? err.message : porDefecto;
}
