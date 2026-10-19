/**
 * Módulo 1 — Autenticación y sesión (AuthContext + ModalLogin).
 * Prueba 1 (éxito): el ingreso con "Recordarme" guarda la sesión en localStorage y avisa el éxito.
 * Prueba 2 (error): credenciales inválidas (401) muestran el mensaje de la API y no guardan sesión.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../context/AuthContext";
import { ModalLogin } from "../components/auth/ModalLogin";
import { instalarFetch, respuesta, sesionDe, llamadasA } from "./ayudas";

function montarModalLogin() {
  const onExito = vi.fn();
  render(
    <AuthProvider>
      <ModalLogin
        identificadorInicial=""
        onIdentificador={vi.fn()}
        onIrARegistro={vi.fn()}
        onExito={onExito}
      />
    </AuthProvider>
  );
  return onExito;
}

describe("M1 · Autenticación y sesión (ModalLogin + AuthContext)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Prueba 1 (éxito): el ingreso con 'Recordarme' persiste la sesión en localStorage", async () => {
    const fetchMock = instalarFetch(async () => respuesta(sesionDe()));
    const onExito = montarModalLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("DNI o correo electrónico"), "45678912");
    await user.type(screen.getByLabelText("Contraseña"), "ClaveSegura123");
    await user.click(screen.getByRole("checkbox", { name: /Recordarme en este dispositivo/ }));
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() => expect(onExito).toHaveBeenCalledTimes(1));

    // La API recibe las credenciales por POST /auth/login
    const [url, init] = llamadasA(fetchMock, "/auth/login")[0];
    expect(String(url)).toContain("/auth/login");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ identificador: "45678912", password: "ClaveSegura123" });

    // Con "Recordarme" la sesión vive en localStorage y no queda copia en sessionStorage
    expect(localStorage.getItem("access_token")).toBe("token-de-prueba");
    expect(JSON.parse(localStorage.getItem("sesion_usuario") ?? "{}").dni).toBe("45678912");
    expect(sessionStorage.getItem("access_token")).toBeNull();
  });

  it("Prueba 2 (error 401): credenciales inválidas muestran el mensaje de la API y no guardan sesión", async () => {
    instalarFetch(async () => respuesta({ mensaje: "Credenciales inválidas." }, 401));
    const onExito = montarModalLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("DNI o correo electrónico"), "00000000");
    await user.type(screen.getByLabelText("Contraseña"), "incorrecta");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales inválidas.");
    expect(onExito).not.toHaveBeenCalled();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("sesion_usuario")).toBeNull();
    expect(sessionStorage.getItem("access_token")).toBeNull();
  });
});
