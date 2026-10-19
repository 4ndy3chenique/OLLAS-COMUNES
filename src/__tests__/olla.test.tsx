/**
 * Módulo 3 — Postulación: registro de la olla común en 4 pasos (RegistroOllaPage + esquemaOlla).
 * Prueba 1 (éxito): el wizard completo registra la olla (POST /ollas-comunes con el número
 *   convertido a entero), limpia el borrador y navega a Integrantes.
 * Prueba 2 (validación): no se avanza con datos inválidos (nombre corto, fecha futura) y
 *   nunca se llama a la API.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import RegistroOllaPage from "../pages/app/RegistroOllaPage";
import { instalarFetch, respuesta, sembrarSesion, USUARIO_BASE, llamadasA } from "./ayudas";

function montarPagina() {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/app/olla"]}>
        <Routes>
          <Route path="/app/olla" element={<RegistroOllaPage />} />
          <Route path="/app/integrantes" element={<p>Página de integrantes</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

/** Fecha de mañana en hora local como YYYY-MM-DD (para el caso límite de fecha futura). */
function mananaISO() {
  return new Date(Date.now() + 86_400_000).toLocaleDateString("en-CA");
}

describe("M3 · Postulación de la olla (RegistroOllaPage · wizard de 4 pasos)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sembrarSesion();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Prueba 1 (éxito): el wizard registra la olla, limpia el borrador y navega a Integrantes", async () => {
    const fetchMock = instalarFetch(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/ollas-comunes") && init?.method === "POST") {
        return respuesta({ id: 1, nombre: "Olla Unidas Venceremos", olla_id: 1 }, 201);
      }
      if (url.endsWith("/usuarios/me")) return respuesta({ ...USUARIO_BASE, olla_id: 1 });
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });
    montarPagina();
    const user = userEvent.setup();

    // Paso 1: nombre y fecha (el campo fecha no se puede teclear: se usa change)
    await user.type(screen.getByLabelText("Nombre de la olla común"), "Olla Unidas Venceremos");
    fireEvent.change(screen.getByLabelText("Fecha de creación de la olla"), { target: { value: "2020-05-10" } });
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText(/Paso 2 de 4/);

    // Paso 2: ubicación (distrito por defecto: San Juan de Lurigancho)
    await user.type(screen.getByLabelText("Dirección del local"), "Av. Los Álamos 123, Mz. B");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText(/Paso 3 de 4/);

    // Paso 3: personas
    await user.type(screen.getByLabelText("Cantidad de personas involucradas"), "25");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText(/Paso 4 de 4/);

    // Paso 4: revisión y registro
    await user.click(screen.getByRole("button", { name: "Registrar mi olla" }));
    expect(await screen.findByText("Página de integrantes")).toBeInTheDocument();

    // El cuerpo va con el número ya convertido y el borrador se limpia
    const [, init] = llamadasA(fetchMock, "/ollas-comunes")[0];
    expect(JSON.parse(String(init?.body))).toEqual({
      nombre: "Olla Unidas Venceremos",
      num_personas_declaradas: 25,
      fecha_fundacion: "2020-05-10",
      direccion: "Av. Los Álamos 123, Mz. B",
      distrito: "San Juan de Lurigancho",
    });
    expect(sessionStorage.getItem("borrador_olla")).toBeNull();
  });

  it("Prueba 2 (validación): con nombre corto o fecha futura no avanza de paso y no llama a la API", async () => {
    const fetchMock = instalarFetch();
    montarPagina();
    const user = userEvent.setup();

    // Paso 1 vacío: se queda en "Paso 1 de 4" con el error de Zod
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("Ingresa el nombre de la olla (mínimo 3 caracteres)")).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de 4/)).toBeInTheDocument();

    // Nombre válido + fecha futura: la regla de negocio impide continuar
    await user.type(screen.getByLabelText("Nombre de la olla común"), "Olla Válida");
    fireEvent.change(screen.getByLabelText("Fecha de creación de la olla"), { target: { value: mananaISO() } });
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText("La fecha de creación no puede ser futura")).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de 4/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
