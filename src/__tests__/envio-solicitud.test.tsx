/**
 * Módulo 5 — Envío de la solicitud (ConfirmacionSolicitudPage).
 * Prueba 1 (validación): sin aceptar la declaración jurada no se envía nada a la API.
 * Prueba 2 (éxito): con la declaración aceptada, el POST /solicitudes/:id/enviar pasa la
 *   solicitud a evaluación y se muestra el código de expediente.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ConfirmacionSolicitudPage from "../pages/app/ConfirmacionSolicitudPage";
import { instalarFetch, respuesta, llamadasA } from "./ayudas";
import type { Solicitud } from "../types";

const SOLICITUD: Solicitud = {
  id: 9,
  olla_nombre: "Olla Unidas Venceremos",
  num_personas_declaradas: 3,
  fecha_fundacion: "2020-05-10",
  dirigente_dni: "45678912",
  dirigente_nombres: "María Elena",
  dirigente_apellidos: "Quispe Torres",
  direccion: "Av. Los Álamos 123",
  distrito: "San Juan de Lurigancho",
  fecha_solicitud: "2026-03-10T10:00:00",
  estado: "PENDIENTE",
  total_integrantes: 3,
  editable: true,
  decisiones: [],
};

function montarPagina() {
  render(
    <MemoryRouter>
      <ConfirmacionSolicitudPage />
    </MemoryRouter>
  );
}

describe("M5 · Envío de la solicitud (ConfirmacionSolicitudPage)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Prueba 1 (validación): sin la declaración jurada aceptada no se llama a la API", async () => {
    const fetchMock = instalarFetch(async (input) => {
      if (String(input).endsWith("/solicitudes/actual")) return respuesta(SOLICITUD);
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });
    montarPagina();
    const user = userEvent.setup();

    await screen.findByText("Revisa y envía tu solicitud");
    await user.click(screen.getByRole("button", { name: "Confirmar y enviar solicitud" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Debes aceptar la declaración jurada para continuar.");
    expect(llamadasA(fetchMock, "/enviar")).toHaveLength(0);
  });

  it("Prueba 2 (éxito): con la declaración aceptada se envía y aparece el código de expediente", async () => {
    const fetchMock = instalarFetch(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/solicitudes/actual")) return respuesta(SOLICITUD);
      if (url.endsWith("/solicitudes/9/enviar") && init?.method === "POST") {
        return respuesta({
          solicitud: { ...SOLICITUD, estado: "EN_EVALUACION", editable: false },
          advertencia: null,
        });
      }
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });
    montarPagina();
    const user = userEvent.setup();

    await screen.findByText("Revisa y envía tu solicitud");
    await user.click(screen.getByRole("checkbox", { name: /Declaro bajo juramento/ }));
    await user.click(screen.getByRole("button", { name: "Confirmar y enviar solicitud" }));

    expect(await screen.findByText("¡Solicitud enviada!")).toBeInTheDocument();
    expect(screen.getByText("OC-2026-000009")).toBeInTheDocument();

    // La declaración jurada viaja como { declaracion_jurada: true } (se firma con HMAC en la bitácora)
    const [url, init] = llamadasA(fetchMock, "/solicitudes/9/enviar")[0];
    expect(String(url)).toContain("/solicitudes/9/enviar");
    expect(JSON.parse(String(init?.body))).toEqual({ declaracion_jurada: true });
  });
});
