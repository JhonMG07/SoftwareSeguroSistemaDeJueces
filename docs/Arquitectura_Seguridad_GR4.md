<div align="center">
<strong>ESCUELA POLITÉCNICA NACIONAL</strong><br><br>
<strong>DESARROLLO DE SOFTWARE SEGURO</strong><br><br>
<strong>INFORME: ARQUITECTURA DE SEGURIDAD (MODELO C4)</strong><br><br>
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

# Diagrama de Arquitectura de Seguridad (Modelo C4)

Este documento describe la arquitectura del sistema con énfasis en los componentes de seguridad.

## Diagrama de Contenedores (Mermaid)

```mermaid
C4Context
    title Diagrama de Contenedores - Sistema de Gestión de Jueces

    Person(corte, "Corte Suprema (Super Admin)", "Usuario con acceso total. Gestiona usuarios y jueces.")
    Person(auditor, "Auditor Interno", "Usuario con acceso de solo lectura a logs y métricas.")
    Person(juez, "Juez", "Usuario que gestiona casos y sentencias.")
    Person(secretario, "Secretario", "Usuario que crea y asigna casos.")
    
    System_Boundary(sistema, "Sistema de Gestión Judicial Seguro") {
        Container(webapp, "Web Application", "Next.js / React", "Interfaz de usuario y API Backend. Renderizado seguro y manejo de estado.")
        Container(middleware, "Security Middleware", "Next.js Edge", "Intercepta requests, valida sesiones JWT, Rate Limiting y aplica RBAC.")
        ContainerDb(database, "Base de Datos", "PostgreSQL (Supabase)", "Almacena datos encriptados. Aplica RLS para segregación de datos.")
        Container(authCheck, "Auth Service", "Supabase Auth (GoTrue)", "Gestiona identidad, tokens y hashing de contraseñas.")
    }

    Rel(corte, webapp, "Administra usuarios (HTTPS)", "Gestión de Jueces")
    Rel(auditor, webapp, "Audita (HTTPS)", "Ver Logs Auditables")
    Rel(juez, webapp, "Usa (HTTPS)", "Visualiza casos")
    Rel(secretario, webapp, "Usa (HTTPS)", "Asigna casos")

    Rel(webapp, middleware, "Pasa par de tráfico", "Filtrado")
    Rel(middleware, authCheck, "Valida Token", "JWT")
    Rel(webapp, database, "Lee/Escribe (SQL sobre HTTPS)", "Datos sanitizados")
    
    UpdateRelStyle(webapp, database, "blue", "solid")
    UpdateRelStyle(middleware, webapp, "red", "dashed")
```

## Descripción de Componentes

1.  **Web Application (Next.js)**:
    *   **Función**: Servir la interfaz de usuario y procesar lógica de negocio en Server Actions.
    *   **Seguridad**: Escapado automático de React (XSS), validación de esquemas Zod.

2.  **Security Middleware**:
    *   **Función**: Primera línea de defensa.
    *   **Seguridad**: Rate Limiting (DoS protection), Validación de Sesión, Enrutamiento seguro.

3.  **Supabase Auth**:
    *   **Función**: Proveedor de Identidad.
    *   **Seguridad**: Manejo de estándares seguros (JWT, bcrypt), no expone contraseñas al backend de aplicación.

4.  **Base de Datos (PostgreSQL)**:
    *   **Función**: Persistencia.
    *   **Seguridad**: **RLS (Row Level Security)** es el núcleo. Aunque la API se vea comprometida, la BD no retornará filas que el usuario (`auth.uid()`) no tenga permiso de ver.
