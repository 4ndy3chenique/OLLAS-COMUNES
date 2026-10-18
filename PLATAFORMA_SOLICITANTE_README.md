# Plataforma del Solicitante — Ollas Comunes

PWA (React 19 + TypeScript + Vite 8 + Tailwind CSS 3.4) para la **dirigenta/dirigente de la olla común**
(rol `SOLICITANTE_DIRIGENTE`). Consume la API PHP de `endpoints/` (desplegada en Azure), que trabaja sobre las
4 bases MySQL con una conexión independiente por esquema. Reglas de negocio: `CLAUDE.md` §6–§7.

## Cómo levantarlo (local contra la API de Azure)

```bash
cd ollas-comunes-pwa
npm install
cp .env.example .env     # VITE_API_BASE_URL (obligatoria; ya apunta a Azure en tu .env local)
npm run dev              # http://localhost:5173  (CORS de la API permite :5173 y :3000)
npm run build            # tsc + vite build (genera sw.js y manifest.webmanifest)
npm run lint
```

La API local (opcional): ver `endpoints/README.md` (`http://localhost:8080/api`).
Prueba de humo de los flujos de escritura por API: `endpoints/scripts/probar-flujos.ps1` (escribe en las bases).

## Rutas

| Ruta | Tipo | Contenido |
|---|---|---|
| `/` | Pública | `LandingPage` (anclas `#que-es`, `#proceso`, `#requisitos`, `#transparencia`, `#faq`) |
| `/?auth=login`, `/?auth=registro` | Pública | `AuthModal` (bottom sheet en móvil, centrado desde `sm`). El estado vive en la URL: se puede enlazar y "atrás" lo cierra |
| `/app/olla` | Protegida | Registro de la olla (postulación) |
| `/app/integrantes` | Protegida | DNIs validados en RENIEC y consultados en SISFOH |
| `/app/envio` | Protegida | Resumen y envío |
| `/app/seguimiento` | Protegida | Estado y observaciones |
| `/app/resultado` | Protegida | Integrantes aprobados, kcal, kg, porciones |
| `/app/historial` | Protegida | Solicitudes anteriores y renovaciones |
| `/app/notificaciones` | Protegida | Avisos, marcar como leída |
| `/app/perfil` | Protegida | Datos de la olla y de la cuenta |
| `/login`, `/seguimiento`, `/perfil`, … | Redirect | Rutas planas anteriores → `/app/*` o `/?auth=login` |

Sin sesión, las rutas `/app/*` redirigen a `/?auth=login` y, tras ingresar, vuelven a la ruta pedida.
"Recordarme" guarda la sesión en `localStorage`; sin marcarlo, en `sessionStorage` (se pierde al cerrar el navegador).

## PWA

`vite-plugin-pwa` (Workbox, `autoUpdate`) precachea solo los estáticos. **Las respuestas de la API nunca se
cachean** (`NetworkOnly`): son datos personales (Ley N.° 29733) y los dispositivos pueden ser compartidos.
Iconos en `public/` (`pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png`, `apple-touch-icon.png`).

## Endpoints de la API (`/api`)

| Método | Ruta | Vista |
|---|---|---|
| GET | `/reniec/verificar/:dni` | Registro |
| POST | `/auth/registro-dirigente` · `/auth/login` | Registro / ingreso |
| GET / PUT | `/usuarios/me` (solo correo) · PUT `/usuarios/me/contrasena` | Perfil |
| POST | `/ollas-comunes` | Registro de la olla |
| GET / PUT | `/ollas-comunes/mia` | Perfil |
| GET | `/solicitudes/actual` (null si no hay) · `/solicitudes/:id` | Integrantes, envío, seguimiento |
| GET / POST | `/solicitudes/:id/integrantes` · DELETE `/solicitudes/:id/integrantes/:integranteId` | Integrantes |
| POST | `/solicitudes/:id/enviar` (`{ declaracion_jurada }`) | Envío |
| GET | `/solicitudes/:id/resultado` | Resultado |
| GET | `/solicitudes/historial` · POST `/solicitudes/renovar` | Historial |
| GET | `/notificaciones` · PUT `/notificaciones/:id/leer` | Notificaciones |

Todas salvo `/auth/*` y `/reniec/*` requieren `Authorization: Bearer <access_token>`.
Errores: `{ "mensaje": "...", "errores": { campo: "..." } }`; 204 sin cuerpo.

## Notas

- A la dirigenta solo se le muestra "Registrado / No registrado en SISFOH"; la clasificación y el score son
  para el evaluador.
- No existe simulador del evaluador: para ver las vistas Observada / Apta / Resultado hace falta insertar
  decisiones y asignaciones en `bd_estado_postulaciones` (pendiente 4 de `TRASPASO.md`).
- La cola offline del solicitante se retiró por diseño (la API no es idempotente);
  `cola_sincronizacion` pertenece a la Plataforma Operativa (Fase 3, aún sin endpoints).
