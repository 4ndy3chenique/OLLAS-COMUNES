import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type {
  Usuario,
  SesionAutenticada,
  LoginInput,
  RegistroDirigenteInput,
} from "../types";

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  login: (input: LoginInput, recordarme?: boolean) => Promise<void>;
  registrar: (input: RegistroDirigenteInput) => Promise<void>;
  /** Vuelve a leer la cuenta desde el backend (p. ej. tras registrar la olla). */
  refrescarUsuario: () => Promise<void>;
  actualizarUsuario: (usuario: Usuario) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const KEY_USUARIO = "sesion_usuario";
const KEY_ACCESS = "access_token";
const KEY_REFRESH = "refresh_token";

function almacenes(recordar: boolean): [Storage, Storage] {
  return recordar ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
}

/** "Recordarme" → localStorage; si no, sessionStorage. El otro almacén se limpia para no dejar sesiones duplicadas. */
function guardarSesion(sesion: SesionAutenticada, recordar: boolean) {
  const [destino, otro] = almacenes(recordar);
  for (const k of [KEY_USUARIO, KEY_ACCESS, KEY_REFRESH]) otro.removeItem(k);
  destino.setItem(KEY_USUARIO, JSON.stringify(sesion.usuario));
  destino.setItem(KEY_ACCESS, sesion.access_token);
  destino.setItem(KEY_REFRESH, sesion.refresh_token);
}

function limpiarSesion() {
  for (const almacen of [localStorage, sessionStorage]) {
    for (const k of [KEY_USUARIO, KEY_ACCESS, KEY_REFRESH]) almacen.removeItem(k);
  }
}

function leerUsuarioGuardado(): Usuario | null {
  const guardado = localStorage.getItem(KEY_USUARIO) ?? sessionStorage.getItem(KEY_USUARIO);
  if (!guardado) return null;
  try {
    return JSON.parse(guardado) as Usuario;
  } catch {
    limpiarSesion();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(leerUsuarioGuardado);
  const cargando = false;

  const actualizarUsuario = useCallback((u: Usuario) => {
    const almacen = localStorage.getItem(KEY_ACCESS) ? localStorage : sessionStorage;
    almacen.setItem(KEY_USUARIO, JSON.stringify(u));
    setUsuario(u);
  }, []);

  const logout = useCallback(() => {
    limpiarSesion();
    setUsuario(null);
  }, []);

  // El cliente HTTP emite este evento cuando el backend responde 401
  useEffect(() => {
    window.addEventListener("sesion-expirada", logout);
    return () => window.removeEventListener("sesion-expirada", logout);
  }, [logout]);

  async function login(input: LoginInput, recordarme = true) {
    const sesion = await api.post<SesionAutenticada>("/auth/login", input);
    guardarSesion(sesion, recordarme);
    setUsuario(sesion.usuario);
  }

  async function registrar(input: RegistroDirigenteInput) {
    const sesion = await api.post<SesionAutenticada>("/auth/registro-dirigente", input);
    guardarSesion(sesion, true);
    setUsuario(sesion.usuario);
  }

  const refrescarUsuario = useCallback(async () => {
    actualizarUsuario(await api.get<Usuario>("/usuarios/me"));
  }, [actualizarUsuario]);

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, login, registrar, refrescarUsuario, actualizarUsuario, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
