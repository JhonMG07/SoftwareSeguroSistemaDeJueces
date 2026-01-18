<div align="center">
<strong>ESCUELA POLITÉCNICA NACIONAL</strong><br><br>
<strong>DESARROLLO DE SOFTWARE SEGURO</strong><br><br>
<strong>INFORME: BACKLOG DE REQUERIMIENTOS (COMMON CRITERIA)</strong><br><br>
<strong>GRUPO 4</strong><br><br>
<strong>INTEGRANTES:</strong><br>
JHON MEZA<br>
DAMARYS OÑA<br>
STUART PALMA<br>
JUAN JOSÉ PROAÑO<br><br>
<strong>FECHA:</strong> 17/1/2026<br><br>
<strong>PhD. Jhonattan Barriga</strong>
</div>

<div style="page-break-after: always;"></div>

# Backlog de Requerimientos de Seguridad (Common Criteria Part 2)

Este documento detalla los requerimientos de seguridad implementados en el Sistema de Jueces, mapeados a las clases funcionales del Common Criteria (ISO/IEC 15408).

| ID  | Clase CC | Componente | Descripción del Requerimiento | Estado | Implementación |
| --- | --- | --- | --- | --- | --- |
| REQ-01 | **FIA** (Identificación y Autenticación) | **FIA_UID.1** | El sistema debe identificar y autenticar a los usuarios antes de permitir cualquier acción protegida. | Completado | Supabase Auth, Middleware de protección de rutas. |
| REQ-02 | **FIA** (Identificación y Autenticación) | **FIA_UAU.1** | El sistema debe requerir autenticación exitosa antes de conceder acceso a dashboards. | Completado | Login Page (`/auth/login`), Validación de sesión en servidor. |
| REQ-03 | **FDP** (Protección de Datos de Usuario) | **FDP_ACC.1** | El sistema debe restringir el acceso a los casos judiciales basándose en el rol del usuario (Juez vs Secretario). | Completado | Row Level Security (RLS) en Postgres, Policies. |
| REQ-04 | **FDP** (Protección de Datos de Usuario) | **FDP_ACF.1** | El sistema debe aplicar reglas de control de acceso basadas en atributos (ABAC) para funciones sensibles de auditoría. | Completado | Middleware `requireAdminWithPermission`, tabla `user_attributes`. |
| REQ-05 | **FAU** (Auditoría de Seguridad) | **FAU_GEN.1** | El sistema debe generar registros de auditoría para eventos de seguridad (accesos, modificaciones). | Completado | Función `logAuditAccess`, tabla `audit_access_log`. |
| REQ-06 | **FTA** (Acceso al TOE) | **FTA_SSL.3** | El sistema debe terminar la sesión después de un periodo de inactividad. | Completado | Implementación de Timeout (1 min inactividad, 5 min absoluto) en cliente. |
| REQ-07 | **FTA** (Acceso al TOE) | **FTA_MCS.1** | El sistema debe limitar el número de solicitudes concurrentes (Rate Limiting). | Completado | Middleware Rate Limiter (Token Bucket en memoria). |
| REQ-08 | **FMT** (Gestión de Seguridad) | **FMT_SMR.1** | El sistema debe mantener roles de seguridad separados (Admin, Juez, Secretario, Auditor). | Completado | Tabla `users_profile`, campo `role`. |
| REQ-09 | **SI** (Integridad del Sistema) | **SI_VAL.1** | El sistema debe validar todos los datos de entrada para prevenir inyecciones. | Completado | Librería `Zod` para esquemas, `sanitizeSearchParams`. |

## Definiciones de Roles (FMT_SMR.1)
- **Super Admin**: Gestión total de usuarios.
- **Admin (Auditor)**: Acceso de solo lectura a logs y métricas.
- **Juez**: Gestión de casos asignados.
- **Secretario**: Creación y asignación de casos.
