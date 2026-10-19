/**
 * Módulo 9 — Notificaciones (NotificacionesPage).
 * Prueba 1 (éxito): marcar como leída actualiza la interfaz al instante, llama a
 *   PUT /notificaciones/:id/leer y avisa al contador del menú (evento global).
 * Prueba 2 (error): si la API falla, la actualización optimista se revierte y se muestra el error.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotificacionesPage from "../pages/app/NotificacionesPage";
import { EVENTO_NOTIFICACIONES } from "../components/layout/AppLayout";
import { instalarFetch, respuesta, llamadasA } from "./ayudas";

const NOTIFICACIONES = [
  {
    id: 1,
    solicitud_id: 5,
    tipo: "OBSERVACION",
    mensaje: "Sube nuevamente el acta de la olla.",
    leida: false,
    created_at: "2026-10-05T14:30:00",
  },
  {
    id: 2,
    solicitud_id: 5,
    tipo: "APROBACION",
    mensaje: "Tu solicitud fue aprobada.",
    leida: true,
    created_at: "2026-10-04T09:00:00",
  },
];

describe("M9 · Notificaciones (NotificacionesPage)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("Prueba 1 (éxito): marcar como leída es optimista, llama al endpoint y avisa al menú", async () => {
    const oyente = vi.fn();
    window.addEventListener(EVENTO_NOTIFICACIONES, oyente);

    const fetchMock = instalarFetch(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/notificaciones") && (init?.method ?? "GET") === "GET") return respuesta(NOTIFICACIONES);
      if (url.endsWith("/notificaciones/1/leer") && init?.method === "PUT") return respuesta(undefined, 204);
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });

    render(<NotificacionesPage />);
    const user = userEvent.setup();

    // Estado inicial: 1 sin leer, con su botón y la marca "Nueva"
    expect(await screen.findByText(/sin leer/)).toBeInTheDocument();
    expect(screen.getByText("Nueva")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Marcar como leída" }));

    // Actualización optimista: la marca "Nueva" y el botón desaparecen sin esperar la respuesta
    await waitFor(() => expect(screen.queryByText("Nueva")).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Marcar como leída" })).not.toBeInTheDocument();
    expect(screen.queryByText(/sin leer/)).not.toBeInTheDocument();

    // Se llamó al endpoint y se emitió el evento que refresca el contador del menú
    expect(llamadasA(fetchMock, "/notificaciones/1/leer")).toHaveLength(1);
    expect(llamadasA(fetchMock, "/notificaciones/1/leer")[0][1]?.method).toBe("PUT");
    await waitFor(() => expect(oyente).toHaveBeenCalledTimes(1));

    window.removeEventListener(EVENTO_NOTIFICACIONES, oyente);
  });

  it("Prueba 2 (error): si el PUT falla, la notificación vuelve a 'sin leer' y se muestra el error", async () => {
    instalarFetch(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/notificaciones") && (init?.method ?? "GET") === "GET") return respuesta(NOTIFICACIONES);
      if (url.endsWith("/notificaciones/1/leer")) return respuesta({ mensaje: "No pudimos procesar la solicitud." }, 500);
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });

    render(<NotificacionesPage />);
    const user = userEvent.setup();

    await screen.findByText(/sin leer/);
    await user.click(screen.getByRole("button", { name: "Marcar como leída" }));

    // Se revierte el cambio optimista y el error de la API queda visible
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos procesar la solicitud.");
    expect(screen.getByText("Nueva")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar como leída" })).toBeInTheDocument();
  });
});
