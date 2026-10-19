/**
 * Módulo 11 — Rutas protegidas (ProtectedRoute).
 * Prueba 1 (éxito de seguridad): sin sesión, /app/* redirige a /?auth=login.
 * Prueba 2: con sesión guardada, el contenido privado se renderiza.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { sembrarSesion } from "./ayudas";

/** Landing de prueba: muestra el query string para verificar el destino del redirect. */
function LandingConDestino() {
  const { search } = useLocation();
  return <p>Landing pública{search}</p>;
}

function montarApp() {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/app/seguimiento"]}>
        <Routes>
          <Route path="/" element={<LandingConDestino />} />
          <Route
            path="/app/seguimiento"
            element={
              <ProtectedRoute>
                <p>Contenido privado de la dirigenta</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("M11 · Rutas protegidas (ProtectedRoute)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("Prueba 1 (sin sesión): redirige a la landing con el modal de login (?auth=login)", async () => {
    montarApp();

    expect(await screen.findByText("Landing pública?auth=login")).toBeInTheDocument();
    expect(screen.queryByText("Contenido privado de la dirigenta")).not.toBeInTheDocument();
  });

  it("Prueba 2 (con sesión): renderiza el contenido privado sin redirigir", async () => {
    sembrarSesion();
    montarApp();

    expect(await screen.findByText("Contenido privado de la dirigenta")).toBeInTheDocument();
    expect(screen.queryByText(/Landing pública/)).not.toBeInTheDocument();
  });
});
