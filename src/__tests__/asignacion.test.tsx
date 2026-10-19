/**
 * Módulo 7 — Resultado y asignación (AsignacionPage).
 * Prueba 1 (éxito): una solicitud APTA muestra integrantes aprobados, porciones, kcal e insumos.
 * Prueba 2 (estado límite): sin postulaciones se muestra el estado vacío sin llamar a más endpoints.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AsignacionPage from "../pages/app/AsignacionPage";
import { instalarFetch, respuesta } from "./ayudas";

const HISTORIAL_APTA = [
  {
    id: 5,
    olla_nombre: "Olla Unidas Venceremos",
    num_personas_declaradas: 12,
    fecha_solicitud: "2026-03-10T10:00:00",
    estado: "APTA",
    total_integrantes: 12,
    fecha_ultima_decision: "2026-03-12T10:00:00",
    observaciones: null,
    es_renovacion: false,
  },
];

const RESULTADO_APTA = {
  solicitud: { id: 5, olla_nombre: "Olla Unidas Venceremos", estado: "APTA" },
  evaluacion: {
    id: 3,
    resultado_reniec: "VALIDO",
    integrantes_validados: 12,
    fecha_evaluacion: "2026-03-11T09:00:00",
  },
  asignacion: {
    id: 2,
    num_integrantes_aprobados: 12,
    kcal_total_asignado: 24000,
    kg_insumos_asignado: 45.5,
    porciones_diarias: 36,
    fecha_asignacion: "2026-03-12T10:00:00",
  },
  olla: {
    id: 1,
    nombre: "Olla Unidas Venceremos",
    direccion: "Av. Los Álamos 123",
    distrito: "San Juan de Lurigancho",
    num_personas_declaradas: 12,
    fecha_fundacion: "2020-05-10",
    dirigente_usuario_id: 1,
    solicitud_id_estado: 5,
    estado_aprobacion: "APTA",
    fecha_aprobacion: "2026-03-12T10:00:00",
    created_at: "2026-03-10T10:00:00",
    dirigente_nombres: "María Elena",
    dirigente_apellidos: "Quispe Torres",
  },
};

function montarPagina() {
  render(
    <MemoryRouter>
      <AsignacionPage />
    </MemoryRouter>
  );
}

describe("M7 · Resultado y asignación (AsignacionPage)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Prueba 1 (éxito): la solicitud APTA muestra integrantes aprobados, kcal y kg de insumos", async () => {
    instalarFetch(async (input) => {
      const url = String(input);
      if (url.endsWith("/solicitudes/historial")) return respuesta(HISTORIAL_APTA);
      if (url.endsWith("/solicitudes/5/resultado")) return respuesta(RESULTADO_APTA);
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });
    montarPagina();

    expect(await screen.findByText(/Olla reconocida y apta/)).toBeInTheDocument();
    expect(screen.getByText(/OC-2026-000005/)).toBeInTheDocument();

    expect(screen.getByText("Integrantes aprobados")).toBeInTheDocument();
    expect(screen.getByText("Porciones diarias")).toBeInTheDocument();
    expect(screen.getByText("Kcal asignadas por día")).toBeInTheDocument();
    expect(screen.getByText(/24[.,\u00a0\u202f]?000/)).toBeInTheDocument();
    expect(screen.getByText(/45[.,]50 kg/)).toBeInTheDocument();
    expect(screen.getByText("36")).toBeInTheDocument();
  });

  it("Prueba 2 (estado límite): sin postulaciones se muestra el estado vacío sin consultar resultado", async () => {
    const fetchMock = instalarFetch(async () => respuesta([]));
    montarPagina();

    expect(await screen.findByText("Todavía no hay una asignación disponible")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1); // solo GET /solicitudes/historial
  });
});
