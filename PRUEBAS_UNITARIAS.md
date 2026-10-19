# Pruebas unitarias — Plataforma del Solicitante (`ollas-comunes-pwa`)

> Fecha del reporte: 18 de octubre de 2026 · Estado: **28/28 pruebas web APROBADAS** y **6/6 pruebas de la API APROBADAS**.
> Alcance: pruebas unitarias/de componente del frontend (React 19 + Vite 8 + TypeScript) y pruebas unitarias de los endpoints PHP.

## 1. Resumen ejecutivo

| Suite | Ubicación | Comando | Resultado |
| --- | --- | --- | --- |
| Frontend (14 módulos · 28 casos) | `ollas-comunes-pwa/src/__tests__/` | `npm run test:run` | ✅ 14 archivos / 28 pruebas aprobadas |
| API PHP (3 archivos · 6 casos) | `endpoints/tests/` | `php tests/correr.php` | ✅ 6 aprobadas / 0 fallidas |

Las pruebas corren **obligatoriamente antes del build y del despliegue** en GitHub Actions (ver §6): si una prueba falla, el pipeline se detiene y no se publica nada.

## 2. Arquitectura de pruebas

**Stack:** Vitest 5 (runner) · React Testing Library 16 + `user-event` (comportamiento de usuario) · jsdom 29 (DOM) · `@testing-library/jest-dom` 7 (matchers) · `fake-indexeddb` 6 (IndexedDB en memoria) · `@vitest/coverage-v8` (cobertura).

**Estructura de archivos:**

```
ollas-comunes-pwa/
├── vite.config.ts                  # bloque `test`: jsdom, setupFiles, env fijo, coverage
├── src/
│   ├── setupTests.ts               # matchers jest-dom + polyfill scrollIntoView
│   └── __tests__/
│       ├── ayudas.ts               # utilidades compartidas (fetch mockeado, sesión, respuestas)
│       ├── autenticacion.test.tsx  # M1  · Autenticación y sesión
│       ├── registro-reniec.test.tsx# M2  · Registro con RENIEC
│       ├── olla.test.tsx           # M3  · Postulación de la olla (wizard)
│       ├── integrantes.test.tsx    # M4  · Integrantes
│       ├── envio-solicitud.test.tsx# M5  · Envío de la solicitud
│       ├── seguimiento.test.tsx    # M6  · Seguimiento
│       ├── asignacion.test.tsx     # M7  · Resultado y asignación
│       ├── historial.test.tsx      # M8  · Historial y renovación
│       ├── notificaciones.test.tsx # M9  · Notificaciones
│       ├── perfil.test.tsx         # M10 · Perfil
│       ├── rutas-protegidas.test.tsx # M11 · Rutas protegidas
│       ├── operativo-offline.test.ts # M12 · Cola offline (IndexedDB)
│       ├── api-endpoints.test.ts   # M13 · Cliente HTTP / contrato de endpoints
│       └── formatos.test.ts        # M14 · Utilidades de presentación
└── .github/workflows/
    ├── azure-static-web-apps.yml   # CI/CD de despliegue (pruebas antes del build)
    └── ci.yml                      # CI de integración (lint → pruebas → build)
```

**Convenciones:**

- Un archivo de prueba por módulo funcional y **2 casos por módulo**: «Prueba 1» (camino de éxito) y «Prueba 2» (validación, error o estado límite).
- El nombre del `describe` incluye el número de módulo (`M1 · …`) para localizar rápido la prueba que falla.
- **Nunca se toca la red real**: `ayudas.ts` instala un `fetch` simulado (`instalarFetch`) y el `test.env` de `vite.config.ts` fija `VITE_API_BASE_URL=http://api.local/api` (no depende del `.env` local ni del CI).
- El router se reemplaza por `MemoryRouter`; la sesión se siembra en `localStorage` con `sembrarSesion()`; IndexedDB se prueba con `fake-indexeddb`.
- `setupTests.ts` registra los matchers de jest-dom (`import '@testing-library/jest-dom/vitest'`) y anula `scrollIntoView` (jsdom no lo implementa; lo usa el Stepper del wizard).

**Scripts (`package.json`):**

| Script | Efecto |
| --- | --- |
| `npm run test` | Vitest en modo vigilancia (desarrollo local) |
| `npm run test:run` | Una pasada completa (lo que ejecuta el CI) |
| `npm run test:coverage` | Una pasada + reporte de cobertura (`text` y `html`) |

## 3. Matriz de pruebas por módulo

| Módulo | Archivo bajo prueba | Prueba 1 (éxito) | Prueba 2 (validación / error / límite) | Archivo de prueba | Veredicto |
| --- | --- | --- | --- | --- | --- |
| M1 · Autenticación y sesión | `src/components/auth/ModalLogin.tsx` + `src/context/AuthContext.tsx` | El ingreso con «Recordarme» persiste la sesión en `localStorage` | Credenciales inválidas (401) muestran el mensaje de la API y no guardan sesión | `autenticacion.test.tsx` | Válido / Aprobado |
| M2 · Registro con RENIEC | `src/components/auth/ModalRegistro.tsx` | Con DNI vigente en RENIEC se crea la cuenta enviando solo `dni`, `email` y `password` (los nombres vienen de RENIEC) | Un DNI no vigente muestra el motivo y bloquea la creación de la cuenta | `registro-reniec.test.tsx` | Válido / Aprobado |
| M3 · Postulación de la olla (wizard) | `src/pages/app/RegistroOllaPage.tsx` (+ `src/lib/formOlla.ts`) | El wizard registra la olla, limpia el borrador y navega a Integrantes | Con nombre corto o fecha futura no avanza de paso y no llama a la API | `olla.test.tsx` | Válido / Aprobado |
| M4 · Integrantes | `src/pages/app/IntegrantesPage.tsx` | Agrega un DNI válido, muestra el estado SISFOH y enmascara el DNI (`****1236`) | Un DNI de menos de 8 dígitos se rechaza sin consultar la API | `integrantes.test.tsx` | Válido / Aprobado |
| M5 · Envío de la solicitud | `src/pages/app/ConfirmacionSolicitudPage.tsx` | Con la declaración jurada aceptada se envía (`{ declaracion_jurada: true }`) y aparece el expediente `OC-{año}-{6 dígitos}` | Sin la declaración aceptada no se llama a la API | `envio-solicitud.test.tsx` | Válido / Aprobado |
| M6 · Seguimiento | `src/pages/app/SeguimientoSolicitudPage.tsx` | Muestra estado, expediente y línea de tiempo de la solicitud en evaluación | La caída de red muestra error con reintento y el reintento recupera los datos | `seguimiento.test.tsx` | Válido / Aprobado |
| M7 · Resultado y asignación | `src/pages/app/AsignacionPage.tsx` | La solicitud APTA muestra integrantes aprobados, kcal y kg de insumos | Sin postulaciones se muestra el estado vacío sin consultar el resultado | `asignacion.test.tsx` | Válido / Aprobado |
| M8 · Historial y renovación | `src/pages/app/HistorialPage.tsx` | Lista las postulaciones con expediente, tipo y estado | Confirmar la nueva postulación llama a `POST /solicitudes/renovar` y navega | `historial.test.tsx` | Válido / Aprobado |
| M9 · Notificaciones | `src/pages/app/NotificacionesPage.tsx` | Marcar como leída es optimista, llama al endpoint y avisa al menú | Si el `PUT` falla, la notificación vuelve a «sin leer» y se muestra el error | `notificaciones.test.tsx` | Válido / Aprobado |
| M10 · Perfil | `src/pages/app/PerfilPage.tsx` | Actualiza el correo con `PUT /usuarios/me` y confirma el guardado | Si el cambio de contraseña falla se muestra el mensaje de la API | `perfil.test.tsx` | Válido / Aprobado |
| M11 · Rutas protegidas | `src/components/layout/ProtectedRoute.tsx` | Sin sesión redirige a la landing con el modal de login (`?auth=login`) | Con sesión renderiza el contenido privado sin redirigir | `rutas-protegidas.test.tsx` | Válido / Aprobado |
| M12 · Operativo / Offline | `src/lib/colaSincronizacion.ts` (IndexedDB) | La operación encolada se envía y la cola queda vacía | Backoff `2^intentos×1000`, estado `ERROR` tras `MAX_INTENTOS=5` y reintento manual | `operativo-offline.test.ts` | Válido / Aprobado |
| M13 · Cliente HTTP y endpoints | `src/lib/api.ts` | Cada uno de los **20 endpoints** del contrato se llama con su método, ruta, cuerpo y `Bearer` token | 401 avisa de la sesión caída (evento `sesion-expirada`), 422 detalla por campo, 204 sin cuerpo y caída de red → `ApiError` 0 | `api-endpoints.test.ts` | Válido / Aprobado |
| M14 · Utilidades de presentación | `src/lib/formatos.ts` + `src/lib/parentescos.ts` | Enmascara el DNI, deriva el expediente y traduce parentescos | Las fechas no corren un día por zona horaria | `formatos.test.ts` | Válido / Aprobado |

## 4. Pruebas unitarias de los endpoints (PU de la API)

La cobertura de endpoints se hizo en **dos capas**:

**a) Capa frontend — contrato del cliente (`M13`):** con `fetch` mockeado se verifica cada llamada real de `lib/api.ts` (20 rutas): método, sufijo de URL, `Content-Type`, `Authorization: Bearer …` y cuerpo JSON; además, el manejo de errores 401 / 422 / 204 / caída de red.

**b) Capa API PHP — `endpoints/tests/` (sin Composer ni PHPUnit):** runner propio `correr.php` (devuelve código de salida 1 si algo falla, apto para CI).

| Archivo | Bajo prueba | Prueba 1 (éxito) | Prueba 2 (error / validación) | Veredicto |
| --- | --- | --- | --- | --- |
| `endpoints/tests/EnrutadorTest.php` | `src/Nucleo/Enrutador.php` | Despacha la ruta con parámetros (`/api/reniec/verificar/{dni}`) y ejecuta el middleware antes de la acción | 404 si la ruta no existe y 405 si el método no coincide | Válido / Aprobado |
| `endpoints/tests/PeticionTest.php` | `src/Nucleo/Peticion.php` | Lee cabeceras sin importar mayúsculas y extrae el token `Bearer` | Interpreta el cuerpo JSON y rechaza JSON inválido con HTTP 400 | Válido / Aprobado |
| `endpoints/tests/RutasTest.php` | `src/rutas.php` | Las **23 rutas** del contrato están registradas con su método y cantidad exacta | Seguridad: las rutas privadas exigen sesión (middleware del dirigente), no existen rutas literales con métodos indebidos y un `{id}` no numérico responde 404 (`Validador::idDeRuta`) | Válido / Aprobado |

El contrato verificado coincide con `endpoints/README.md` y con el cliente del frontend: 20 rutas usadas por `lib/api.ts` + 3 rutas de salud (`/`, `/api`, `/api/health`).

## 5. Cómo ejecutar las pruebas localmente

**Frontend** (requiere Node + `npm install` la primera vez):

```powershell
cd ollas-comunes-pwa
npm run test          # modo vigilancia durante el desarrollo
npm run test:run      # una pasada (igual que el CI)
npm run test:coverage # una pasada + reporte de cobertura en texto y HTML
```

**API PHP** (requiere PHP ≥ 8.0; en Windows con XAMPP `php` no está en el PATH):

```powershell
cd endpoints
C:\xampp\php\php.exe tests\correr.php   # Windows / XAMPP
php tests\correr.php                    # Linux, macOS o Windows con PHP en PATH
```

## 6. Integración continua (GitHub Actions)

| Workflow | Momento | Paso de pruebas | Efecto |
| --- | --- | --- | --- |
| `.github/workflows/azure-static-web-apps.yml` (despliegue) | Tras «Instalar dependencias» y **antes** de «Compilar web» / «Build And Deploy» | `npm run test:run` («Pruebas unitarias») | Si falla una prueba, el job se detiene: **no hay build ni despliegue** |
| `.github/workflows/ci.yml` (integración) | Tras «Lint» y **antes** de «Compilar (tipos + build)» | `npm run test:run` («Pruebas unitarias») | Frena la rama/PR ante cualquier prueba roja |

No se necesita `.env` en el CI: `vite.config.ts` fija `VITE_API_BASE_URL` dentro del bloque `test.env` y todas las llamadas de red van mockeadas.

## 7. Resultados de la última corrida

- `npm run test:run` → **Test Files 14 passed (14)** · **Tests 28 passed (28)** · 3.16 s.
- `npm run test:coverage` → global **59.32 %** statements · **58.07 %** ramas · **51.7 %** funciones · **62.46 %** líneas.
  - Núcleo crítico: `api.ts` 96.77 % · `schemas.ts` 100 % · `formOlla.ts` 100 % · `colaSincronizacion.ts` 95.83 % · `AuthContext.tsx` 82.97 % · páginas de `/app` 72–91 %.
- API: `php tests/correr.php` → **6 aprobadas, 0 fallidas**.

## 8. Decisiones, desviaciones y límites

- **`setupTests.ts` con `@testing-library/jest-dom/vitest`** en lugar del import plano: es el subpath que registra los matchers en el `expect` de Vitest y añade sus tipos (el import plano solo trae los de Jest).
- **Polyfill de `scrollIntoView`** en `setupTests.ts`: jsdom no lo implementa y el Stepper del wizard lo usa.
- **`test.env` en `vite.config.ts`**: valor fijo de `VITE_API_BASE_URL` para que las pruebas no dependan del `.env` local ni del CI.
- **Dependencias extra** además de las mínimas: `fake-indexeddb` (IndexedDB real en memoria para M12) y `@vitest/coverage-v8` (reporte de cobertura).
- **Los tests se compilan en `tsc -b`**: `npm run build` valida también los tipos de las pruebas (cualquier error de tipos en un test rompe el build; se mantiene a propósito).
- **Cobertura por diseño, no exhaustiva**: 2 casos por módulo no buscan cubrir todos los caminos; páginas fuera del alcance funcional (`LandingPage`, `pages/operativo/`, `App.tsx`) aparecen con 0 % y los componentes de UI compartidos con cobertura parcial. Ampliar la suite es el siguiente paso natural.
- **`endpoints/scripts/deploy-api.ps1`** excluye la carpeta `tests/` del paquete de despliegue (las pruebas no viajan a producción).
- `npm audit` reporta 8 vulnerabilidades preexistentes en dependencias; no se abordaron por estar fuera del alcance de esta tarea.

---

**Cómo agregar una prueba nueva:** crear `src/__tests__/<modulo>.test.tsx`, usar los helpers de `ayudas.ts` (`instalarFetch`, `respuesta`, `sesionDe`/`sembrarSesion`) y mantener el patrón «Prueba 1 (éxito) / Prueba 2 (validación, error o límite)» para que la matriz de §3 siga siendo válida. En la API, añadir `<Nombre>Test.php` en `endpoints/tests/`: el runner lo descubre automáticamente (`*Test.php`).
