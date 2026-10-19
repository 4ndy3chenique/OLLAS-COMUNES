/**
 * Módulo 4 — Integrantes de la olla: empadronamiento con DNI (IntegrantesPage).
 * Prueba 1 (éxito): un DNI válido se agrega (POST /solicitudes/:id/integrantes), se muestra el
 *   resultado SISFOH y el DNI aparece enmascarado en la lista.
 * Prueba 2 (validación): un DNI mal formado se rechaza en el cliente sin llamar a la API.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import IntegrantesPage from "../pages/app/IntegrantesPage";
import { instalarFetch, respuesta, sembrarSesion, USUARIO_BASE, llamadasA } from "./ayudas";
import type { Integrante, Solicitud } from "../types";

const SOLICITUD: Solicitud = {
  id: 7,
  olla_nombre: "Olla Unidas Venceremos",
  num_personas_declaradas: 3,
  fecha_fundacion: "2020-05-10",
  dirigente_dni: "45678912",
  dirigente_nombres: "María Elena",
  dirigente_apellidos: "Quispe Torres",
  direccion: "Av. Los Álamos 123",
  distrito: "San Juan de Lurigancho",
  fecha_solicitud: "2026-10-01T10:00:00",
  estado: "PENDIENTE",
  total_integrantes: 0,
  editable: true,
  decisiones: [],
};

function montarPagina() {
  render(
    <AuthProvider>
      <MemoryRouter>
        <IntegrantesPage />
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("M4 · Integrantes (IntegrantesPage · empadronamiento con DNI)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sembrarSesion({ ...USUARIO_BASE, olla_id: 3 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Prueba 1 (éxito): agrega un DNI válido, muestra el estado SISFOH y enmascara el DNI", async () => {
    // Mock con estado: la lista crece cuando el POST de integrantes tiene éxito
    let integrantes: Integrante[] = [];
    const fetchMock = instalarFetch(async (input, init) => {
      const url = String(input);
      const metodo = init?.method ?? "GET";
      if (url.endsWith("/solicitudes/actual")) {
        return respuesta({ ...SOLICITUD, total_integrantes: integrantes.length });
      }
      if (url.endsWith("/solicitudes/7/integrantes") && metodo === "GET") {
        return respuesta(integrantes);
      }
      if (url.endsWith("/solicitudes/7/integrantes") && metodo === "POST") {
        const cuerpo = JSON.parse(String(init?.body)) as { dni: string; parentesco_con_dirigente: string };
        const nuevo: Integrante = {
          id: 99,
          solicitud_id: 7,
          dni: cuerpo.dni,
          nombres: "Pedro",
          apellidos: "Quispe Ramos",
          fecha_nacimiento: "1995-02-20",
          parentesco_con_dirigente: cuerpo.parentesco_con_dirigente,
          registrado_sisfoh: false,
        };
        integrantes = [...integrantes, nuevo];
        return respuesta({ integrante: nuevo }, 201);
      }
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });

    montarPagina();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("DNI del integrante"), "11223344");
    await user.click(screen.getByRole("button", { name: "Validar y agregar" }));

    // Confirmación con el resultado SISFOH (solo registrado / no registrado)
    expect(await screen.findByText(/Pedro Quispe Ramos fue agregado · No registrado en SISFOH/)).toBeInTheDocument();

    // El POST lleva DNI y parentesco; el DNI se muestra enmascarado (Ley N.° 29733)
    const [, init] = llamadasA(fetchMock, "/solicitudes/7/integrantes").find(([, i]) => i?.method === "POST")!;
    expect(JSON.parse(String(init?.body))).toEqual({ dni: "11223344", parentesco_con_dirigente: "TITULAR" });
    expect((await screen.findAllByText("****3344")).length).toBeGreaterThan(0);
    expect(screen.queryByText("11223344")).not.toBeInTheDocument();
  });

  it("Prueba 2 (validación): un DNI de menos de 8 dígitos se rechaza sin consultar la API", async () => {
    const fetchMock = instalarFetch(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/solicitudes/actual")) return respuesta(SOLICITUD);
      if (url.endsWith("/solicitudes/7/integrantes") && (init?.method ?? "GET") === "GET") return respuesta([]);
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });

    montarPagina();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("DNI del integrante"), "123");
    await user.click(screen.getByRole("button", { name: "Validar y agregar" }));

    expect(await screen.findByText("El DNI debe tener exactamente 8 dígitos numéricos.")).toBeInTheDocument();

    // Ningún POST de integrantes salió del navegador
    const huboPost = fetchMock.mock.calls.some(
      ([url, init]) => String(url).endsWith("/integrantes") && init?.method === "POST"
    );
    expect(huboPost).toBe(false);
  });
});
