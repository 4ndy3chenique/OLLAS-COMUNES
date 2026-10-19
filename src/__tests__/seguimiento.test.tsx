/**
 * Módulo 6 — Seguimiento del estado (SeguimientoSolicitudPage + Timeline).
 * Prueba 1 (éxito): una solicitud EN_EVALUACION muestra su badge, la línea de tiempo y el aviso
 *   de evaluación con el código de expediente.
 * Prueba 2 (error): si la carga falla se muestra el error con "Reintentar" y el reintento
 *   recupera los datos.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SeguimientoSolicitudPage from "../pages/app/SeguimientoSolicitudPage";
import { instalarFetch, respuesta } from "./ayudas";
import type { Solicitud } from "../types";

const SOLICITUD: Solicitud = {
  id: 207,
  olla_nombre: "Olla Unidas Venceremos",
  num_personas_declaradas: 12,
  fecha_fundacion: "2020-05-10",
  dirigente_dni: "45678912",
  dirigente_nombres: "María Elena",
  dirigente_apellidos: "Quispe Torres",
  direccion: "Av. Los Álamos 123",
  distrito: "San Juan de Lurigancho",
  fecha_solicitud: "2026-10-01T10:00:00",
  estado: "EN_EVALUACION",
  total_integrantes: 12,
  editable: false,
  decisiones: [],
};

function montarPagina() {
  render(
    <MemoryRouter>
      <SeguimientoSolicitudPage />
    </MemoryRouter>
  );
}

describe("M6 · Seguimiento de la solicitud (SeguimientoSolicitudPage)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Prueba 1 (éxito): muestra estado, expediente y línea de tiempo de la solicitud en evaluación", async () => {
    instalarFetch(async () => respuesta(SOLICITUD));
    montarPagina();

    expect(await screen.findByText("Estado de tu solicitud")).toBeInTheDocument();
    expect(screen.getByText(/OC-2026-000207/)).toBeInTheDocument();

    // Badge de estado + hito "En curso" de la línea de tiempo
    expect(screen.getAllByText("En evaluación").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Completado · /)).toBeInTheDocument();
    expect(screen.getByText(/Tu expediente está siendo evaluado por el programa/)).toBeInTheDocument();
    expect(screen.getByText("Solicitud registrada")).toBeInTheDocument();
  });

  it("Prueba 2 (error): la caída de red muestra error con reintento y el reintento recupera los datos", async () => {
    let intentos = 0;
    instalarFetch(async () => {
      intentos++;
      if (intentos === 1) throw new TypeError("Failed to fetch");
      return respuesta(SOLICITUD);
    });
    montarPagina();
    const user = userEvent.setup();

    // Primer intento: error de conexión traducido por lib/api.ts
    expect(await screen.findByRole("alert")).toHaveTextContent(/No pudimos conectar con el servidor/);

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Estado de tu solicitud")).toBeInTheDocument();
    expect(screen.getByText(/OC-2026-000207/)).toBeInTheDocument();
    expect(intentos).toBe(2);
  });
});
