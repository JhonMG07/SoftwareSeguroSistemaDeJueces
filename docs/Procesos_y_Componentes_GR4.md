**ESCUELA POLITÉCNICA NACIONAL**
**DESARROLLO DE SOFTWARE SEGURO**
**INFORME: ÍNDICE DE ENTREGABLES DEL PROYECTO**
**GRUPO 4**

**INTEGRANTES:**
* JHON MEZA
* DAMARYS OÑA
* STUART PALMA
* JUAN JOSÉ PROAÑO

**FECHA:** 17/1/2026
**PhD. Jhonattan Barriga**

---

# Procesos de Negocio y Componentes de Seguridad

## 1. Lista de Procesos de Negocio
A continuación se detallan los flujos principales de la aplicación:

### 1.1 Autenticación y Gestión de Sesiones
- **Inicio de Sesión**: El usuario ingresa credenciales. El sistema valida contra Supabase Auth.
- **Redirección por Rol**: Tras el login, el middleware detecta el rol (`users_profile`) y redirige al dashboard correspondiente.
- **Cierre de Sesión (Logout)**: El usuario cierra sesión voluntariamente o por inactividad. Se invalida la cookie de sesión y se limpian formularios.
- **Expiración de Sesión**: El sistema cierra la sesión automáticamente tras 1 minuto de inactividad o 5 minutos de tiempo absoluto.

### 1.2 Gestión de Casos (Secretario)
- **Creación de Caso**: El secretario ingresa detalles de una demanda. El sistema valida entradas con Zod y guarda en la BD.
- **Asignación de Juez**: El secretario selecciona un caso y lo asigna a un juez disponible.
- **Priorización**: Asignación de niveles de prioridad a los casos.

### 1.3 Gestión Judicial (Juez)
- **Visualización de Casos**: El juez ve solo los casos asignados a su ID (RLS).
- **Actualización de Estado**: El juez cambia el estado del caso (ej. En Proceso, Sentencia).
- **Subida de Evidencia**: (Si aplica) Carga de archivos seguros.

### 1.4 Auditoría y Administración (Admin/Auditor)
- **Monitoreo de Accesos**: El auditor visualiza logs de acceso en tiempo real.
- **Detección de Anomalías**: Revisión de intentos fallidos o accesos no autorizados.
- **Gestión de Usuarios (Super Admin)**: Creación, bloqueo y modificación de roles de usuarios.

---

## 2. Listado de Componentes de Seguridad

### 2.1 Componentes de Identidad y Acceso
- **Supabase Auth (GoTrue)**: Motor principal de autenticación. Maneja JWT, refresh tokens y encriptación de contraseñas (Bcrypt).
- **Next.js Middleware**: Interceptor de peticiones HTTP. Verifica la sesión y el rol antes de renderizar cualquier página protegida. Implementa control de acceso basado en roles (RBAC).
- **PostgreSQL Row Level Security (RLS)**: Políticas de seguridad a nivel de base de datos que aseguran que los usuarios solo accedan a las filas permitidas (ej. Juez solo ve sus casos).

### 2.2 Validación y Sanitización
- **Zod**: Librería de validación de esquemas TypeScript. Se usa en todos los formularios (Login, Crear Caso) para prevenir datos malformados.
- **Sanitize Functions**: Funciones personalizadas (`sanitizeSearchParams`) para limpiar entradas de API contra XSS e inyecciones SQL.
- **UUID Validation**: Regex estricto para validar identificadores únicos.

### 2.3 Monitoreo y Auditoría
- **Audit Logging System**: Módulo personalizado que registra eventos críticos en la tabla `audit_access_log`.
- **In-Memory Rate Limiter**: Componente en `middleware.ts` que limita la frecuencia de peticiones por IP/Usuario para prevenir ataques de Fuerza Bruta y DoS.

### 2.4 Cifrado y Protección de Datos
- **HTTPS/TLS**: Encriptación en tránsito forzada por el despliegue (Vercel/Supabase).
- **Secure Cookies**: Cookies de sesión configuradas con atributos `HttpOnly`, `Secure` y `SameSite=Lax`.
- **Environment Barriers**: Separación estricta de variables de entorno (`.env.local`) para no exponer llaves de servicio en el cliente.
