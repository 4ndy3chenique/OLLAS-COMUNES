/**
 * Módulo 10 — Perfil (PerfilPage): datos de la cuenta y cambio de contraseña.
 * Prueba 1 (éxito): el correo se actualiza con PUT /usuarios/me (único campo editable) y se confirma.
 * Prueba 2 (error): si el cambio de contraseña falla, se muestra el mensaje de la API.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import PerfilPage from "../pages/app/PerfilPage";
import { instalarFetch, respuesta, sembrarSesion, USUARIO_BASE, llamadasA } from "./ayudas";
import type { OllaComun } from "../types";

const OLLA: OllaComun = {
  id: 3,
  nombre: "Olla Unidas Venceremos",
  direccion: "Av. Los Álamos 123",
  distrito: "San Juan de Lurigancho",
  num_personas_declaradas: 25,
  fecha_fundacion: "2020-05-10",
  dirigente_usuario_id: 1,
  solicitud_id_estado: 9,
  estado_aprobacion: "APTA",
  fecha_aprobacion: "2026-03-12T10:00:00",
  created_at: "2026-03-10T10:00:00",
  dirigente_nombres: "María Elena",
  dirigente_apellidos: "Quispe Torres",
};

function montarPagina() {
  render(
    <AuthProvider>
      <MemoryRouter>
        <PerfilPage />
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("M10 · Perfil (PerfilPage)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sembrarSesion({ ...USUARIO_BASE, olla_id: 3 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Prueba 1 (éxito): actualiza el correo con PUT /usuarios/me y confirma el guardado", async () => {
    const fetchMock = instalarFetch(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/ollas-comunes/mia")) return respuesta(OLLA);
      if (url.endsWith("/usuarios/me") && init?.method === "PUT") {
        const { email } = JSON.parse(String(init.body)) as { email: string };
        return respuesta({ ...USUARIO_BASE, email, olla_id: 3 });
      }
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });
    montarPagina();
    const user = userEvent.setup();

    const campoEmail = await screen.findByLabelText("Correo electrónico");
    await user.clear(campoEmail);
    await user.type(campoEmail, "nuevo.correo@ejemplo.com");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Tus datos se guardaron correctamente.")).toBeInTheDocument();

    const [url, init] = llamadasA(fetchMock, "/usuarios/me").find(([, i]) => i?.method === "PUT")!;
    expect(String(url)).toContain("/usuarios/me");
    expect(JSON.parse(String(init?.body))).toEqual({ email: "nuevo.correo@ejemplo.com" });

    // El usuario actualizado queda persistido (AuthContext.actualizarUsuario)
    expect(JSON.parse(localStorage.getItem("sesion_usuario") ?? "{}").email).toBe("nuevo.correo@ejemplo.com");
  });

  it("Prueba 2 (error): si el cambio de contraseña falla se muestra el mensaje de la API", async () => {
    const fetchMock = instalarFetch(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/ollas-comunes/mia")) return respuesta(OLLA);
      if (url.endsWith("/usuarios/me/contrasena") && init?.method === "PUT") {
        return respuesta({ mensaje: "La contraseña actual no es correcta." }, 400);
      }
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });
    montarPagina();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Contraseña actual"), "clave-vieja-1");
    await user.type(screen.getByLabelText(/Nueva contraseña/), "NuevaClave123");
    await user.click(screen.getByRole("button", { name: "Actualizar contraseña" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La contraseña actual no es correcta.");

    const [, init] = llamadasA(fetchMock, "/usuarios/me/contrasena")[0];
    expect(JSON.parse(String(init?.body))).toEqual({ actual: "clave-vieja-1", nueva: "NuevaClave123" });
  });
});
