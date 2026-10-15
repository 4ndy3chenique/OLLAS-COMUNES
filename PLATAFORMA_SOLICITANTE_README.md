# Plataforma del Solicitante — Ollas Comunes (etapa de pruebas)

Cliente web (React 19 + TypeScript + Vite + Tailwind CSS 3) para la
**dirigenta/dirigente de la olla común** (rol `SOLICITANTE_DIRIGENTE`).
Consume la API de `/server` (Node + Express + mysql2), que trabaja sobre las
4 bases MySQL con una conexión independiente por esquema.

## Cómo levantarlo

```bash
# 1. Backend
cd endpoints
npm install
cp .env.example .env              # completar credenciales (ver CLAUDE.md §3)
npm run db:migrar                 # aplica database/migraciones_etapa_prueba.sql (idempotente)
npm run dev                       # http://localhost:3000

# 2. Frontend (en la raíz web)
npm install
cp .env.example .env              # VITE_API_BASE_URL apunta a la API (obligatoria)
npm run dev                       # http://localhost:5173
```

Para simular al evaluador del Estado (vistas 5–8):

```bash
cd server
npm run db:simular -- <solicitudId> OBSERVAR "Motivo de la observación"
npm run db:simular -- <solicitudId> APROBAR
npm run db:simular -- <solicitudId> RECHAZAR "Motivo"
```

La solicitud debe estar `EN_EVALUACION` (enviada desde la Vista 4).

## Vistas y rutas

| # | Ruta | Página |
|:-:|---|---|
| 1 | `/login` | `LoginPage` — registro (DNI verificado en RENIEC) e inicio de sesión |
| 2 | `/registro-olla` | `RegistroOllaPage` — postulación de la olla |
| 3 | `/integrantes` | `IntegrantesPage` — DNIs validados en RENIEC y consultados en SISFOH |
| 4 | `/envio` | `ConfirmacionSolicitudPage` — resumen y envío |
| 5 | `/seguimiento` | `SeguimientoSolicitudPage` — estado y observaciones |
| 6 | `/resultado` | `AsignacionPage` — integrantes aprobados, kcal, kg, porciones |
| 7 | `/historial` | `HistorialPage` — solicitudes anteriores y renovaciones |
| 8 | `/notificaciones` | `NotificacionesPage` — avisos, marcar como leída |
| 9 | `/perfil` | `PerfilPage` — datos de la olla y de la cuenta |

## Endpoints de la API (`/api`)

| Método | Ruta | Vista |
|---|---|---|
| GET | `/reniec/verificar/:dni` | 1 |
| POST | `/auth/registro-dirigente` · `/auth/login` | 1 |
| GET / PUT | `/usuarios/me` · PUT `/usuarios/me/contrasena` | 9 |
| POST | `/ollas-comunes` | 2 |
| GET / PUT | `/ollas-comunes/mia` | 9 |
| GET | `/solicitudes/actual` · `/solicitudes/:id` | 3–5 |
| GET / POST | `/solicitudes/:id/integrantes` · DELETE `/solicitudes/:id/integrantes/:integranteId` | 3 |
| POST | `/solicitudes/:id/enviar` | 4 |
| GET | `/solicitudes/:id/resultado` | 6 |
| GET | `/solicitudes/historial` · POST `/solicitudes/renovar` | 7 |
| GET | `/notificaciones` · PUT `/notificaciones/:id/leer` | 8 |

Todas salvo `/auth/*` y `/reniec/*` requieren `Authorization: Bearer <access_token>`
(token simplificado de la etapa de pruebas, sin JWT).

## Notas

- A la dirigenta solo se le muestra "Registrado / No registrado en SISFOH";
  la clasificación socioeconómica y el score quedan para el evaluador.
- La cola offline anterior se retiró: no tenía endpoint en el backend y
  `cola_sincronizacion` pertenece a la Plataforma Operativa.
