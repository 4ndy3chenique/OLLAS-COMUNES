/**
 * Módulo 8 — Historial y renovación (HistorialPage).
 * Prueba 1 (éxito): lista las postulaciones con su expediente, tipo y estado.
 * Prueba 2 (éxito/límite): con la última solicitud resuelta se puede renovar; el POST
 *   /solicitudes/renovar navega a Integrantes para registrar la nueva postulación.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import HistorialPage from "../pages/app/HistorialPage";
import { instalarFetch, respuesta, llamadasA } from "./ayudas";

const HISTORIAL = [
  {
    id: 124,
    olla_nombre: "Olla Unidas Venceremos",
    num_personas_declaradas: 12,
    fecha_solicitud: "2026-09-01T10:00:00",
    estado: "EN_EVALUACION",
    total_integrantes: 12,
    fecha_ultima_decision: null,
    observaciones: null,
    es_renovacion: true,
  },
  {
    id: 123,
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

function montarPagina() {
  render(
    <MemoryRouter initialEntries={["/app/historial"]}>
      <Routes>
        <Route path="/app/historial" element={<HistorialPage />} />
        <Route path="/app/integrantes" element={<p>Página de integrantes</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("M8 · Historial y renovación (HistorialPage)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Prueba 1 (éxito): lista las postulaciones con expediente, tipo y estado", async () => {
    instalarFetch(async (input) => {
      if (String(input).endsWith("/solicitudes/historial")) return respuesta(HISTORIAL);
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });
    montarPagina();

    // La tabla de escritorio (también hay tarjetas para móvil: se acota a la tabla)
    const tabla = await screen.findByRole("table");
    expect(within(tabla).getByText("OC-2026-000123")).toBeInTheDocument();
    expect(within(tabla).getByText("OC-2026-000124")).toBeInTheDocument();
    expect(within(tabla).getByText("Postulación inicial")).toBeInTheDocument();
    expect(within(tabla).getByText("Renovación")).toBeInTheDocument();
    expect(within(tabla).getByText("Apta")).toBeInTheDocument();
    expect(within(tabla).getByText("En evaluación")).toBeInTheDocument();
    expect(within(tabla).getAllByText("12 de 12")).toHaveLength(2);
  });

  it("Prueba 2 (renovación): confirmar la nueva postulación llama a POST /solicitudes/renovar y navega", async () => {
    const fetchMock = instalarFetch(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/solicitudes/historial")) return respuesta([HISTORIAL[1]]);
      if (url.endsWith("/solicitudes/renovar") && init?.method === "POST") return respuesta({}, 204);
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });
    montarPagina();
    const user = userEvent.setup();

    // Con la última solicitud APTA aparece la acción de renovar y su confirmación
    await user.click(await screen.findByRole("button", { name: "Nueva postulación (renovar)" }));
    expect(await screen.findByText("¿Iniciar una nueva postulación?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sí, renovar" }));

    expect(await screen.findByText("Página de integrantes")).toBeInTheDocument();
    expect(llamadasA(fetchMock, "/solicitudes/renovar")).toHaveLength(1);
  });
});
