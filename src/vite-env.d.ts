/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** "true" habilita las rutas /operativo/* (scaffold con datos DEMO). Por defecto, apagado. */
  readonly VITE_OPERATIVO_HABILITADO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
