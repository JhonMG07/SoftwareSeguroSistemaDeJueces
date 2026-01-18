<div align="center">
<strong>ESCUELA POLITÉCNICA NACIONAL</strong><br><br>
<strong>DESARROLLO DE SOFTWARE SEGURO</strong><br><br>
<strong>INFORME: MODELO DE AMENAZAS Y ANÁLISIS STRIDE</strong><br><br>
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

# Modelo de Amenazas y Análisis STRIDE

Este documento analiza las amenazas potenciales al Sistema de Jueces utilizando la metodología STRIDE y detalla las mitigaciones implementadas.

## Tabla de Análisis STRIDE

| Amenaza (STRIDE) | Descripción del Riesgo | Componente Afectado | Mitigación Implementada | Estado |
| --- | --- | --- | --- | --- |
| **Spoofing** (Suplantación de Identidad) | Un atacante intenta hacerse pasar por un Juez o Admin robando credenciales o tokens. | Autenticación / Sesión | 1. **Supabase Auth**: Gestión segura de sesiones JWT.<br>2. **Secure Cookies**: Flag `HttpOnly` previene robo por XSS.<br>3. **Timeouts**: Cierre automático de sesión tras inactividad. | Mitigado |
| **Tampering** (Manipulación de Datos) | Un usuario malicioso intenta modificar el estado de un caso o asignar un juez sin permiso. | Base de Datos / API | 1. **RLS (Row Level Security)**: Postgres rechaza modificaciones no autorizadas a nivel de fila.<br>2. **Zod Validation**: Rechazo de datos con formato inválido en el servidor. | Mitigado |
| **Repudiation** (Repudio) | Un usuario realiza una acción (ej. borrar caso) y niega haberlo hecho. | Logs / Auditoría | 1. **Audit Logs**: Registro inmutable en `audit_access_log` con ID de usuario, fecha y acción.<br>2. **Traza de Base de Datos**: Timestamps automáticos `created_at`, `updated_at`. | Mitigado |
| **Information Disclosure** (Divulgación de Información) | Un Juez ve casos de otro Juez o un atacante ve errores de sistema detallados. | Frontend / API | 1. **RLS**: Filtra datos en el motor de base de datos antes de enviarlos.<br>2. **Manejo de Errores Seguro**: Middleware devuelve mensajes genéricos ("Unauthorized") en lugar de stack traces. | Mitigado |
| **Denial of Service** (Denegación de Servicio) | Un atacante inunda la API de login para bloquear el sistema. | Servidor / API | 1. **Rate Limiting**: Middleware limita requests por IP/Usuario (ej. 100 req/min).<br>2. **Infraestructura Serverless**: Escalado automático de Vercel/Supabase. | Mitigado |
| **Elevation of Privilege** (Elevación de Privilegios) | Un Secretario intenta acceder al panel de Administración manipulando la URL. | Control de Acceso | 1. **Middleware RBAC**: Verificación de rol en cada request (`requireAdmin`).<br>2. **Validación Servidor**: No se confía en el estado del cliente. | Mitigado |

## Superficie de Ataque Reducida

1. **Minimización de Endpoints Públicos**: Solo Login y Callbacks de Auth son públicos. Todo lo demás requiere sesión válida.
2. **Principio de Mínimo Privilegio**: La conexión a la base de datos se realiza con un usuario de servicio, pero el acceso real está restringido por RLS basado en el usuario autenticado (contexto de sesión).

## Matriz de Riesgo Residual

| Riesgo | Probabilidad | Impacto | Nivel | Acción |
| --- | --- | --- | --- | --- |
| Ingeniería Social (Phishing) | Media | Alto | Alto | Capacitación de usuarios (Fuera de alcance técnico). |
| Vulnerabilidad 0-day en Next.js | Baja | Alto | Medio | Mantener dependencias actualizadas (`npm audit`). |
| Fuga de credenciales de Admin | Baja | Crítico | Alto | Rotación de credenciales y logs de acceso. |
