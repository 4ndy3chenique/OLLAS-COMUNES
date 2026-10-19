/**
 * Módulo 2 — Registro de la dirigenta con validación RENIEC (ModalRegistro).
 * Prueba 1 (éxito): al completar 8 dígitos se valida solo en RENIEC; con DNI vigente la cuenta
 *   se crea enviando únicamente dni/email/password (nombres y apellidos vienen de RENIEC).
 * Prueba 2 (error): un DNI que no existe en RENIEC muestra el motivo, no se re-consulta el mismo
 *   DNI y el botón "Crear cuenta" queda bloqueado.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../context/AuthContext";
import { ModalRegistro } from "../components/auth/ModalRegistro";
import { instalarFetch, respuesta, sesionDe, llamadasA } from "./ayudas";

const RENIEC_VIGENTE = {
  dni: "45678912",
  valido: true,
  resultado: "VALIDO",
  motivo: null,
  nombres: "María Elena",
  apellidos: "Quispe Torres",
  estado_documento: "VIGENTE",
};

const RENIEC_NO_ENCONTRADO = {
  dni: "00000000",
  valido: false,
  resultado: "NO_ENCONTRADO",
  motivo: "El DNI no figura en el padrón de RENIEC.",
  nombres: null,
  apellidos: null,
  estado_documento: null,
};

function montarModalRegistro() {
  const onExito = vi.fn();
  render(
    <AuthProvider>
      <ModalRegistro dniInicial="" onDni={vi.fn()} onIrALogin={vi.fn()} onExito={onExito} />
    </AuthProvider>
  );
  return onExito;
}

describe("M2 · Registro de la dirigenta con RENIEC (ModalRegistro)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Prueba 1 (éxito): con DNI vigente en RENIEC se crea la cuenta enviando solo dni, email y password", async () => {
    const fetchMock = instalarFetch(async (input) => {
      const url = String(input);
      if (url.includes("/reniec/verificar/")) return respuesta(RENIEC_VIGENTE);
      if (url.endsWith("/auth/registro-dirigente")) return respuesta(sesionDe(), 201);
      return respuesta({ mensaje: "Ruta no simulada" }, 404);
    });
    const onExito = montarModalRegistro();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("DNI (8 dígitos)"), "45678912");

    // Verificación automática al llegar a 8 dígitos
    expect(await screen.findByText(/DNI vigente verificado en RENIEC/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nombres")).toHaveValue("María Elena");
    expect(screen.getByLabelText("Apellidos")).toHaveValue("Quispe Torres");

    await user.type(screen.getByLabelText("Correo electrónico"), "nueva.dirigenta@ejemplo.com");
    await user.type(screen.getByLabelText("Contraseña (mínimo 8 caracteres)"), "ClaveSegura123");
    await user.click(screen.getByRole("checkbox", { name: /Autorizo el tratamiento de mis datos personales/ }));
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(onExito).toHaveBeenCalledTimes(1));

    // Nombres y apellidos NO se envían: el backend los toma de RENIEC
    const [, init] = llamadasA(fetchMock, "/auth/registro-dirigente")[0];
    expect(JSON.parse(String(init?.body))).toEqual({
      dni: "45678912",
      email: "nueva.dirigenta@ejemplo.com",
      password: "ClaveSegura123",
    });
  });

  it("Prueba 2 (error): un DNI no vigente muestra el motivo y bloquea la creación de la cuenta", async () => {
    const fetchMock = instalarFetch(async () => respuesta(RENIEC_NO_ENCONTRADO));
    montarModalRegistro();
    const user = userEvent.setup();

    // Con 7 dígitos todavía no se consulta a RENIEC
    await user.type(screen.getByLabelText("DNI (8 dígitos)"), "0000000");
    expect(llamadasA(fetchMock, "/reniec/verificar/")).toHaveLength(0);

    // Al completar el octavo dígito se consulta una sola vez y se muestra el motivo
    await user.type(screen.getByLabelText("DNI (8 dígitos)"), "0");
    expect(await screen.findByText("El DNI no figura en el padrón de RENIEC.")).toBeInTheDocument();
    expect(llamadasA(fetchMock, "/reniec/verificar/00000000")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeDisabled();
    expect(screen.queryByText(/DNI vigente verificado en RENIEC/)).not.toBeInTheDocument();
  });
});
