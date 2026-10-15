# CLAUDE.md — Plataforma del Solicitante (Olla Común) · Etapa de pruebas

## 1. Rol y objetivo

Trabajas sobre un proyecto **ya creado** con dos carpetas:

- `/server` → backend (lógica, acceso a las 4 bases de datos MySQL).
- `/client` → frontend web (vistas de la Plataforma del Solicitante).

El proyecto ya tiene una base de código con errores. Tu trabajo es, en este orden:

1. **Explorar** el proyecto existente antes de escribir código.
2. **Corregir los errores** que impiden que arranque o funcione.
3. **Ajustar el esquema** de base de datos con las migraciones de la sección 5.
4. **Completar las 9 vistas** de la sección 6 conectadas a las bases reales.

Idioma del proyecto: **español** (nombres de tablas, mensajes de UI, comentarios).

---

## 2. Reglas de trabajo

- **No asumas el stack.** Revisa primero `/server` y `/client` (`package.json`, `composer.json`, estructura de carpetas, archivos de entrada) y respeta el lenguaje, framework y convenciones que ya existen. No migres a otro framework ni reescribas desde cero lo que ya funciona.
- Trabaja **solo dentro de `/server` y `/client`**. Los scripts SQL nuevos van en `/server/database/` (crea la carpeta si no existe).
- Antes de un cambio grande, explica brevemente qué vas a hacer y por qué. Tras cada corrección, indica cómo probarla.
- Ejecuta el proyecto (instalar dependencias, levantar server y client) y usa los errores reales de consola como guía. No inventes errores.
- Usa **los nombres de tabla reales** de la sección 4. Los documentos de diseño usaban nombres sugeridos (`usuarios_dirigentes`, `ciudadanos`, `expedientes_solicitud`, etc.) que **no existen** en las bases; si el código los usa, esa es una causa de error.
- Etapa de pruebas: **sin capas de seguridad complejas** (sin JWT obligatorio, sin cifrado extra, sin HTTPS). Mínimos que sí se mantienen: contraseñas con hash (bcrypt o `password_hash` según el stack) y consultas **parametrizadas** (nunca concatenar SQL).

---

## 3. Conexión a las bases de datos

Archivo `.env` en `/server` (agrega `.env` a `.gitignore` y crea un `.env.example` con las mismas claves sin valores):

```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=<usuario_bd>
DB_PASSWORD=<contraseña_bd>
DB_CHARSET=utf8mb4

DB_NAME_CENTRAL=bd_operativa_central
DB_NAME_POSTULACIONES=bd_estado_postulaciones
DB_NAME_MOCK_RENIEC=bd_estado_reniec
DB_NAME_MOCK_SISFOH=bd_estado_sisfoh
```

**Regla de arquitectura:** crea **una conexión (o pool) independiente por esquema**, cada una con su `DB_NAME_*`. Ninguna consulta cruza esquemas en SQL (prohibido `SELECT ... FROM bd_estado_reniec.personas_reniec` desde la conexión de otra base). Los cruces se hacen en código: se consulta una base, se obtiene el dato y se usa en la otra. Esto mantiene el aislamiento entre dominios para cuando cada base viva en un servidor distinto.

Centraliza las conexiones en un único módulo (p. ej. `server/config/db.*`) que exporte `central`, `postulaciones`, `reniec` y `sisfoh`.

---

## 4. Las 4 bases de datos (tablas reales)

### 4.1 `bd_operativa_central` (Plataforma Operativa + cuentas)
Relevantes para el solicitante:
- `roles` (id, nombre ENUM: `SOLICITANTE_DIRIGENTE`, `ALMACENERO`, `TRANSPORTISTA`, `AUDITOR`, `ADMINISTRADOR`, descripcion)
- `usuarios` (id, dni CHAR(8) UNIQUE, nombres, apellidos, email UNIQUE, password_hash, rol_id FK, olla_id FK NULL, estado, created_at)
- `tokens_sesion` (usuario_id, refresh_token_hash, dispositivo, emitido_en, expira_en, revocado)
- `ollas_comunes` (id, nombre, direccion, distrito, solicitud_id_estado — FK lógica a `bd_estado_postulaciones.solicitudes.id`, estado_aprobacion ENUM `PENDIENTE`/`APTA`/`NO_APTA`, fecha_aprobacion, created_at)
- Otras tablas (beneficiarios, guías de despacho, FSM, cola de sincronización, bitácora, KPIs) pertenecen a la Plataforma Operativa: **no las modifiques** en esta etapa.

### 4.2 `bd_estado_postulaciones` (Estado — postulación y evaluación)
- `funcionarios_estado` (evaluadores del Estado)
- `solicitudes` (id, olla_nombre, dirigente_dni, dirigente_nombres, dirigente_apellidos, direccion, distrito, fecha_solicitud, estado ENUM `PENDIENTE`/`EN_EVALUACION`/`OBSERVADA`/`APTA`/`NO_APTA`, evaluador_asignado_id)
- `integrantes_solicitud` (id, solicitud_id FK, dni, nombres, apellidos, fecha_nacimiento, parentesco_con_dirigente; UNIQUE solicitud_id+dni)
- `evaluaciones` (solicitud_id, resultado_reniec, resultado_sisfoh, integrantes_validados, aptitud_automatica, fecha_evaluacion)
- `decisiones` (solicitud_id, funcionario_id, decision ENUM `APROBAR`/`OBSERVAR`/`RECHAZAR`, observaciones, fecha_decision)
- `asignaciones` (solicitud_id, num_integrantes_aprobados, kcal_total_asignado, kg_insumos_asignado, porciones_diarias, fecha_asignacion)
- `bitacora_evaluaciones` (solicitud_id, funcionario_id, accion, firma_hmac, timestamp)
- `parametros_evaluacion` (UMBRAL_SCORE_FOCALIZACION=25.00, KCAL_POR_INTEGRANTE_DIA=2100, PORCIONES_POR_INTEGRANTE_DIA=3)

### 4.3 `bd_estado_reniec` (mock RENIEC — identidad)
- `personas_reniec` (dni PK, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, estado_civil, estado_documento ENUM `VIGENTE`/`VENCIDO`/`ANULADO`/`OBSERVADO`, fecha_emision, fecha_caducidad, dni_valido_modulo11)
- `consultas_reniec` (log: dni_consultado, sistema_solicitante, fecha_hora_solicitud, fecha_hora_respuesta, tiempo_respuesta_ms, resultado ENUM `VALIDO`/`INVALIDO`/`NO_ENCONTRADO`, respondida_correctamente)

> RENIEC separa `apellido_paterno` y `apellido_materno`; las demás bases usan un solo campo `apellidos`. Regla de mapeo: `apellidos = CONCAT(apellido_paterno, ' ', apellido_materno)`.

### 4.4 `bd_estado_sisfoh` (mock SISFOH — clasificación socioeconómica)
- `hogares_sisfoh` (id, dni_jefe_hogar UNIQUE, direccion, distrito, num_integrantes_declarados, clasificacion_socioeconomica ENUM `POBRE_EXTREMO`/`POBRE`/`NO_POBRE`, score_focalizacion, fecha_clasificacion)
- `integrantes_hogar_sisfoh` (hogar_id FK, dni, nombres, apellidos, parentesco, edad)
- `consultas_sisfoh` (log: dni_jefe_hogar_consultado, sistema_solicitante, tiempos, resultado ENUM `CLASIFICADO`/`NO_REGISTRADO`, respondida_correctamente)

---

## 5. Migraciones obligatorias (crear `/server/database/migraciones_etapa_prueba.sql`)

Aplícalas antes de desarrollar las vistas. Si una tabla ya tiene filas y una columna `NOT NULL` falla, créala primero como `NULL`, completa los datos y luego cámbiala a `NOT NULL`.

```sql
-- ============================================================
-- 5.1 Quitar FK de los logs de consulta (rompen los casos negativos:
--     un DNI inexistente no puede registrarse en el log)
--     Verifica el nombre real con:
--     SHOW CREATE TABLE bd_estado_reniec.consultas_reniec;
-- ============================================================
ALTER TABLE bd_estado_reniec.consultas_reniec DROP FOREIGN KEY consultas_reniec_ibfk_1;
ALTER TABLE bd_estado_sisfoh.consultas_sisfoh DROP FOREIGN KEY consultas_sisfoh_ibfk_1;

-- ============================================================
-- 5.2 Semilla de roles (sin esto el registro del dirigente falla)
-- ============================================================
INSERT IGNORE INTO bd_operativa_central.roles (nombre, descripcion) VALUES
  ('SOLICITANTE_DIRIGENTE','Dirigente o representante de la olla común'),
  ('ALMACENERO','Gestiona despachos en almacén'),
  ('TRANSPORTISTA','Traslada insumos a la olla'),
  ('AUDITOR','Consulta trazabilidad y bitácoras'),
  ('ADMINISTRADOR','Administración del sistema');

-- ============================================================
-- 5.3 Datos de la olla común en la solicitud
--     (nombre ya existe: olla_nombre; dirigenta: dirigente_nombres/apellidos)
-- ============================================================
ALTER TABLE bd_estado_postulaciones.solicitudes
  ADD COLUMN num_personas_declaradas SMALLINT UNSIGNED NOT NULL AFTER olla_nombre,
  ADD COLUMN fecha_fundacion DATE NOT NULL AFTER num_personas_declaradas;

-- ============================================================
-- 5.4 Notificaciones (Vista 8)
-- ============================================================
CREATE TABLE IF NOT EXISTS bd_estado_postulaciones.notificaciones (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  solicitud_id  INT NOT NULL,
  tipo          ENUM('OBSERVACION','APROBACION','RECHAZO','VENCIMIENTO','INFO') NOT NULL,
  mensaje       VARCHAR(500) NOT NULL,
  leida         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_solicitud FOREIGN KEY (solicitud_id)
    REFERENCES bd_estado_postulaciones.solicitudes(id)
) ENGINE=InnoDB;

-- ============================================================
-- 5.5 Capacidad: una olla puede superar 255 integrantes
-- ============================================================
ALTER TABLE bd_estado_postulaciones.asignaciones
  MODIFY num_integrantes_aprobados SMALLINT UNSIGNED NOT NULL;
ALTER TABLE bd_estado_postulaciones.evaluaciones
  MODIFY integrantes_validados SMALLINT UNSIGNED NULL;

-- ============================================================
-- 5.6 Perfil de la olla en la base central (Vista 9)
-- ============================================================
ALTER TABLE bd_operativa_central.ollas_comunes
  ADD COLUMN num_personas_declaradas SMALLINT UNSIGNED NULL AFTER distrito,
  ADD COLUMN fecha_fundacion DATE NULL AFTER num_personas_declaradas,
  ADD COLUMN dirigente_usuario_id INT NULL AFTER fecha_fundacion,
  ADD CONSTRAINT fk_olla_dirigente FOREIGN KEY (dirigente_usuario_id)
    REFERENCES bd_operativa_central.usuarios(id),
  ADD UNIQUE KEY uq_olla_solicitud (solicitud_id_estado);

-- ============================================================
-- 5.7 Semilla RENIEC coherente con el hogar SISFOH de prueba
--     + casos negativos para probar validaciones
-- ============================================================
INSERT IGNORE INTO bd_estado_reniec.personas_reniec
  (dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, estado_civil,
   estado_documento, fecha_emision, fecha_caducidad, dni_valido_modulo11)
VALUES
  ('11223344','Pedro','Quispe','Ramos','1983-06-20','CASADO','VIGENTE','2019-03-10','2029-03-10', TRUE),
  ('22334455','Ana Lucía','Quispe','Ramos','2012-08-05','SOLTERO','VIGENTE','2020-09-01','2028-09-01', TRUE),
  ('33445566','Luis','Quispe','Ramos','2015-10-14','SOLTERO','VIGENTE','2021-01-20','2029-01-20', TRUE),
  ('44556677','Rosa','Torres','Vda. de Quispe','1956-02-28','VIUDO','VIGENTE','2017-07-15','2027-07-15', TRUE),
  ('55667788','Carmen','Huamán','Pérez','1978-12-01','SOLTERO','VENCIDO','2012-05-05','2022-05-05', TRUE),
  ('66778899','Jorge','Mendoza','Salas','1988-03-30','CASADO','ANULADO','2016-04-04','2026-04-04', TRUE);
-- '99999999' queda sin registrar a propósito → caso NO_ENCONTRADO
-- '78912345' (Juan Carlos) existe en RENIEC pero no en SISFOH → caso NO_REGISTRADO
```

---

## 6. Vistas de la Plataforma del Solicitante (`/client`)

Usuario único: la **dirigenta/dirigente** de la olla común (rol `SOLICITANTE_DIRIGENTE`).

| # | Vista | Qué hace | Bases y tablas (L = lectura, E = escritura) |
|:-:|:---|:---|:---|
| 1 | **Login / Registro** | Alta de la cuenta única del dirigente e inicio de sesión | Central: E `usuarios` (con rol `SOLICITANTE_DIRIGENTE`, `olla_id = NULL`), L `roles`, E `tokens_sesion` (opcional en pruebas) · RENIEC: L `personas_reniec` para validar el DNI al registrarse, E `consultas_reniec` |
| 2 | **Registro de la olla común (postulación)** | Formulario con: **nombre de la olla, cantidad de personas involucradas, nombre de la dirigenta, fecha de creación**, dirección y distrito | Postulaciones: E `solicitudes` (`olla_nombre`, `num_personas_declaradas`, `dirigente_dni`, `dirigente_nombres`, `dirigente_apellidos`, `fecha_fundacion`, `direccion`, `distrito`) · Central: E `ollas_comunes` en estado `PENDIENTE` con `solicitud_id_estado` y `dirigente_usuario_id` |
| 3 | **Integrantes de la olla** | Carga de DNIs de las familias; cada DNI se valida en RENIEC y se consulta en SISFOH | Postulaciones: E `integrantes_solicitud` · RENIEC: L `personas_reniec`, E `consultas_reniec` · SISFOH: L `integrantes_hogar_sisfoh`/`hogares_sisfoh`, E `consultas_sisfoh` |
| 4 | **Envío y confirmación** | Resumen y envío; la solicitud pasa a `EN_EVALUACION` y queda como expediente | Postulaciones: E `solicitudes.estado`, E `bitacora_evaluaciones`, E `notificaciones` (tipo `INFO`) |
| 5 | **Seguimiento del estado** | Pendiente / En evaluación / Observada / Apta / No apta, con observaciones | Postulaciones: L `solicitudes`, L `decisiones` |
| 6 | **Resultado y asignación** | Si es APTA: integrantes aprobados, kcal, kg de insumos y porciones diarias | Postulaciones: L `evaluaciones`, L `asignaciones` · Central: L `ollas_comunes` |
| 7 | **Historial** | Solicitudes anteriores y renovaciones | Postulaciones: L `solicitudes` filtrado por `dirigente_dni` (no se crea tabla nueva) |
| 8 | **Notificaciones** | Observaciones, aprobación, rechazo, vencimientos; marcar como leída | Postulaciones: L/E `notificaciones` |
| 9 | **Perfil de la olla / dirigente** | Editar datos de la organización y de la cuenta | Central: L/E `ollas_comunes`, L/E `usuarios` |

### Reglas de negocio por vista

**Vista 1 — Registro**
- El DNI debe existir en `personas_reniec` con `estado_documento = 'VIGENTE'`; si no, mostrar el motivo (no encontrado, vencido, anulado).
- Autocompletar nombres y apellidos desde RENIEC (aplicando la regla de mapeo de apellidos).
- Registrar cada consulta en `consultas_reniec` con `sistema_solicitante = 'plataforma_solicitante'` y el tiempo en ms.
- Una cuenta por DNI y por email (ya son UNIQUE).

**Vista 2 — Registro de la olla común**
- Campos obligatorios: nombre de la olla, cantidad de personas involucradas (entero > 0), nombre de la dirigenta, fecha de creación (no futura), dirección, distrito.
- El nombre de la dirigenta se **precarga desde la cuenta** logueada (se asume que quien registra es la dirigenta titular de la cuenta).
- Al guardar: crear la fila en `solicitudes` (estado `PENDIENTE`) y la fila en `ollas_comunes` (estado `PENDIENTE`, `solicitud_id_estado` = id de la solicitud, `dirigente_usuario_id` = usuario actual) y actualizar `usuarios.olla_id`.
- Son dos bases distintas: usa una transacción en cada conexión; si la segunda escritura falla, revierte o elimina la primera y muestra el error.
- `solicitudes` guarda lo que se postuló (histórico); `ollas_comunes` es el perfil editable (fuente de verdad del perfil).

**Vista 3 — Integrantes**
- Validar formato del DNI (8 dígitos) antes de consultar.
- RENIEC: `NO_ENCONTRADO` o documento no vigente → no se agrega; mostrar motivo.
- SISFOH: buscar el DNI en `integrantes_hogar_sisfoh`. **A la dirigenta solo se le muestra "Registrado en SISFOH / No registrado"**; la clasificación y el score son datos socioeconómicos de terceros y quedan solo para el evaluador.
- Evitar DNIs repetidos en la misma solicitud (UNIQUE `solicitud_id + dni`).
- Mostrar el contador: *integrantes registrados vs. personas declaradas* en la Vista 2.

**Vista 4 — Envío**
- Solo se puede enviar si hay al menos 1 integrante válido.
- Si registrados ≠ declarados, mostrar advertencia (no bloquea el envío; el evaluador podrá observarla).
- Tras enviar, la solicitud ya no es editable salvo que vuelva como `OBSERVADA`.

**Vistas 5–8** — Solo lectura para la dirigenta (excepto marcar notificaciones como leídas). Los cambios de estado, decisiones y asignaciones los hace el evaluador del Estado (fuera de esta plataforma). Para probar, puedes crear un script de semilla en `/server/database/` que simule una evaluación, una decisión `APROBAR` y una asignación calculada con `parametros_evaluacion` (kcal = integrantes × 2100; porciones = integrantes × 3).

**Al quedar APTA** — Actualizar `bd_operativa_central.ollas_comunes`: `estado_aprobacion = 'APTA'`, `fecha_aprobacion = NOW()` (función de servicio que escribe en ambas conexiones).

---

## 7. Casos de prueba mínimos

| DNI | Esperado |
|:--|:--|
| `45678912` | RENIEC válido · SISFOH registrado (jefa de hogar) → usar para registrar a la dirigenta |
| `11223344`, `22334455`, `33445566`, `44556677` | RENIEC válido · SISFOH registrado (mismo hogar) |
| `78912345` | RENIEC válido · SISFOH no registrado |
| `55667788` | RENIEC documento VENCIDO → rechazar |
| `66778899` | RENIEC documento ANULADO → rechazar |
| `99999999` | RENIEC NO_ENCONTRADO → rechazar y registrar en el log sin error |
| `1234567` / `ABCDEFGH` | Formato inválido → rechazar sin consultar |

---

## 8. Primer paso al iniciar

1. Lista la estructura de `/server` y `/client` e identifica el stack.
2. Instala dependencias y levanta ambos; recopila los errores.
3. Presenta un resumen: stack detectado, errores encontrados, causa probable de cada uno y plan de corrección.
4. Espera confirmación antes de cambios estructurales grandes; las correcciones puntuales puedes aplicarlas directamente.
