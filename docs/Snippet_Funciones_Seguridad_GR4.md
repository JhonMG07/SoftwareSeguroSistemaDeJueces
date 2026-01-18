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

# Documentación de Código Fuente - Funciones de Seguridad

Este documento resalta las implementaciones críticas de seguridad dentro del código fuente, explicando su propósito y funcionamiento.

## 1. Middleware de Seguridad (`lib/vault/middleware.ts`)

El middleware actúa como el principal mecanismo de defensa (Gateway) para la aplicación. Intercepta todas las peticiones antes de que lleguen a las vistas.

### Funciones Clave:

#### `checkRateLimit(identifier, maxRequests)`
Implementa un algoritmo de "Token Bucket" en memoria para prevenir ataques de Denegación de Servicio (DoS) y Fuerza Bruta.
- **Entrada**: Identificador (IP/User ID).
- **Lógica**: Asigna un contador con ventana de tiempo (1 minuto). Si excede `maxRequests`, bloquea la petición.
- **Seguridad**: Protege endpoints críticos como Login y Auditoría.

#### `createSecureErrorResponse(error)`
Centraliza el manejo de errores para evitar **Information Disclosure**.
- **Lógica**: Mapea errores internos detallados (ej. "User profile not found in table users_profile") a mensajes genéricos seguros (ej. "Authentication required").
- **Beneficio**: Evita que atacantes conozcan la estructura interna de la BD o lógica.

#### `requireAdminWithPermission(requiredAttribute)`
Implementa Control de Acceso Basado en Atributos (ABAC) sobre el RBAC tradicional.
- **Uso**: Permite granularidad fina. Un `admin` puede existir sin permiso de `audit.logs.view`.

## 2. Validación de Entradas (`lib/vault/middleware.ts` / Zod)

#### `sanitizeSearchParams(params)`
Función "helper" utilizada en las APIs de búsqueda.
- **Lógica**:
    1. **Allow-list**: Elimina cualquier caracter que no sea alfanumérico o seguro (`.`, `-`, `_`).
    2. **Truncate**: Corta la entrada a 100 caracteres.
- **Protección**: Elimina vectores de ataque XSS y SQL Injection en parámetros de URL.

## 3. Autenticación y Auditoría

#### `logAuditAccess(userId, viewAccessed)`
Genera evidencia forense de las acciones de los usuarios.
- **Persistencia**: Escribe en la tabla `audit_access_log`.
- **Inmutabilidad**: La tabla está diseñada para ser "Append Only" (vía políticas RLS en BD).

## 4. Políticas RLS (Base de Datos)
*Nota: Estas políticas residen en el motor PostgreSQL de Supabase.*

- **Poder Judicial**: `SELECT * FROM cases WHERE assigned_judge_id = auth.uid()`
    - Garantiza que un juez NUNCA pueda ver los expedientes de otro juez.
- **Secretaría**: `INSERT INTO cases` permitido solo para rol `secretary`.
- **Integridad**: `UPDATE` permitido solo en campos específicos según el estado del caso.

## 5. Gestión de Permisos Dinámicos (Atribución / ABAC)

Esta lógica permite a la **Corte Suprema** (Super Admin) asignar atributos de seguridad específicos a los usuarios en tiempo real, sin redesplegar código.

**Archivo**: `app/api/admin/users/[id]/attributes/route.ts`

```typescript
// POST /api/admin/users/[id]/attributes
export async function POST(req: Request, { params }) {
    // 1. Verificación de Seguridad: Solo Super Admin con permiso 'admin.abac' puede asignar
    await enforcePermission(user.id, 'admin.abac', 'user_attributes');

    // 2. Validación de Existencia (Integridad Referencial)
    const { attribute_id } = body;
    // ... verificaciones de base de datos ...

    // 3. Asignación del Atributo (Granting Permission)
    const { data: assignment } = await supabase
        .from('user_attributes')
        .insert({
            user_id: userId,
            attribute_id: attribute_id,
            granted_by: user.id, // Trazabilidad: Quién otorgó el permiso
            expires_at: expires_at || null // Caducidad automática del permiso
        });
    
    // Log de Auditoría Automático
    console.log(`[API] Attribute assigned: ${attribute.name} to user...`);
}
```

### Conceptos Clave Implementados:
- **Segregación de Deberes**: Incluso un admin necesita el atributo `admin.abac` explícito para poder otorgar permisos a otros.
- **Permisos Temporales**: Soporte nativo para `expires_at`, permitiendo accesos de "ventana de tiempo" (Time-based access).
- **Trazabilidad (`granted_by`)**: Se registra inmutablemente qué administrador otorgó el privilegio.

## 6. Privacidad y Minimización de Datos (Identity Vault)

El sistema implementa un "Bóveda de Identidad" para disociar los datos reales de los jueces de los casos públicos, cumpliendo con principios de privacidad por diseño.

**Archivo**: `lib/vault/identity-service.ts`

```typescript
export class IdentityVaultService {
    /**
     * Resolver identidad real desde pseudónimo
     * ⚠️ RESTRINGIDO: Solo para Super Admin o sistema interno
     * Todos los accesos quedan registrados en auditoría
     */
    static async resolveIdentity(anonActorId: string, requestedBy: string) {
        // 1. Auditoría de acceso a datos sensibles (Quién intenta des-anonimizar)
        await this.logAccess(anonActorId, requestedBy, 'resolve_identity');

        // 2. Resolución segura
        const { data } = await vaultClient
            .from('identity_mapping')
            .select('user_id, case_id')
            .eq('anon_actor_id', anonActorId)
            .single();

        return { userId: data.user_id, caseId: data.case_id };
    }
}
```

### Conceptos Clave Implementados:
- **Pseudonimización**: Los jueces son conocidos públicamente solo por un ID aleatorio (`anon_actor_id`).
- **Auditoría de Re-identificación**: Cada vez que el sistema necesita saber quién es el juez real (ej. para pagarle), se genera un log de auditoría específico (`resolve_identity`).

