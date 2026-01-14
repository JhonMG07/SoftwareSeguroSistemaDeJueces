-- =============================================
-- Migración: Sistema ABAC Completo - Fase 1
-- Base de Datos: Principal (Supabase Main Project)
-- Fecha: 8 Enero 2026
-- =============================================

-- =============================================
-- 1. TABLA: user_attributes
-- Almacena los atributos ABAC asignados a cada usuario
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES public.abac_attributes(id) ON DELETE CASCADE,
    
    -- Metadata de asignación
    granted_by UUID REFERENCES public.users_profile(id),  -- Quién otorgó el atributo
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- NULL = nunca expira
    reason TEXT,  -- Justificación del otorgamiento
    
    -- Constraint
    UNIQUE(user_id, attribute_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_attributes_user ON public.user_attributes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_attributes_expires ON public.user_attributes(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_attributes_attribute ON public.user_attributes(attribute_id);

-- =============================================
-- 2. TABLA: policy_enforcement_log
-- Auditoría de decisiones de control de acceso
-- =============================================

CREATE TABLE IF NOT EXISTS public.policy_enforcement_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contexto de la acción
    user_id UUID NOT NULL REFERENCES public.users_profile(id),
    policy_id UUID REFERENCES public.security_policies(id),
    
    -- Detalles de la acción
    action TEXT NOT NULL,  -- ej: 'case.create', 'doc.download'
    resource_type TEXT NOT NULL,  -- ej: 'case', 'document', 'user'
    resource_id UUID,  -- ID del recurso (si aplica)
    
    -- Resultado
    result TEXT NOT NULL CHECK (result IN ('allow', 'deny')),
    reason TEXT,  -- Razón de la decisión
    
    -- Metadata adicional
    metadata JSONB,  -- Contexto adicional
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries de auditoría
CREATE INDEX IF NOT EXISTS idx_enforcement_log_user_time 
    ON public.policy_enforcement_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_enforcement_log_denials 
    ON public.policy_enforcement_log(result, timestamp DESC) 
    WHERE result = 'deny';
CREATE INDEX IF NOT EXISTS idx_enforcement_log_action 
    ON public.policy_enforcement_log(action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_enforcement_log_resource 
    ON public.policy_enforcement_log(resource_type, resource_id);

-- =============================================
-- 3. ACTUALIZACIÓN: tabla cases
-- Agregar clasificación de seguridad
-- =============================================

ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS classification TEXT 
    CHECK (classification IN ('public', 'confidential', 'secret', 'top_secret'))
    DEFAULT 'public';

-- Índice para filtros por clasificación
CREATE INDEX IF NOT EXISTS idx_cases_classification ON public.cases(classification);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE public.user_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_enforcement_log ENABLE ROW LEVEL SECURITY;

-- user_attributes: Solo Super Admin
CREATE POLICY "super_admin_full_access_user_attributes"
    ON public.user_attributes FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users_profile
            WHERE id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users_profile
            WHERE id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    );

-- policy_enforcement_log: Super Admin puede ver todos, usuarios ven los suyos
CREATE POLICY "users_view_own_enforcement_logs"
    ON public.policy_enforcement_log FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users_profile
            WHERE id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    );

-- Solo el sistema puede insertar logs (service role)
CREATE POLICY "system_insert_enforcement_logs"
    ON public.policy_enforcement_log FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- Permitir insert desde APIs autenticadas

-- =============================================
-- 5. LIMPIAR Y REPOBLAR ATRIBUTOS ABAC
-- =============================================

-- Agregar constraint único en name si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'abac_attributes_name_key'
    ) THEN
        ALTER TABLE public.abac_attributes 
        ADD CONSTRAINT abac_attributes_name_key UNIQUE (name);
    END IF;
END $$;

-- Eliminar atributos antiguos (solo los de ejemplo)
DELETE FROM public.abac_attributes 
WHERE name IN (
    'Ver Casos', 'Editar Casos', 'Crear Casos', 'Eliminar Casos',
    'Gestionar Usuarios', 'Ver Usuarios', 'Información Confidencial',
    'Información Secreta', 'Información Ultra Secreta', 
    'Solo Lectura', 'Sin Exportación'
);

-- Insertar nuevos atributos organizados
INSERT INTO public.abac_attributes (name, category, description, level) VALUES

-- CATEGORÍA: case_management (Gestión de Casos)
('case.list.view', 'permission', 'Ver lista de casos (solo metadatos básicos)', 1),
('case.details.view', 'permission', 'Ver detalles completos de un caso', 2),
('case.assigned_only', 'restriction', 'Solo puede ver casos asignados a él', 2),
('case.create', 'permission', 'Crear nuevos casos en el sistema', 3),
('case.edit.metadata', 'permission', 'Editar metadatos del caso (título, tipo, etc)', 3),
('case.edit.status', 'permission', 'Cambiar estado del caso', 3),
('case.assign.judge', 'permission', 'Asignar casos a jueces/secretarios', 4),
('case.close', 'permission', 'Cerrar/finalizar casos', 4),
('case.delete', 'permission', 'Eliminar casos del sistema', 5),

-- CATEGORÍA: document_management (Gestión de Documentos)
('doc.view', 'permission', 'Ver documentos adjuntos al caso', 1),
('doc.upload', 'permission', 'Subir nuevos documentos', 2),
('doc.download', 'permission', 'Descargar/exportar documentos', 2),
('doc.edit.metadata', 'permission', 'Editar información del documento', 2),
('doc.sign.digital', 'permission', 'Firmar documentos electrónicamente', 3),
('doc.delete', 'permission', 'Eliminar documentos', 4),

-- CATEGORÍA: user_management (Gestión de Usuarios)
('user.list.view', 'permission', 'Ver lista de usuarios del sistema', 1),
('user.profile.view', 'permission', 'Ver perfil completo de usuarios', 2),
('user.create', 'permission', 'Crear nuevos usuarios (jueces/secretarios)', 4),
('user.edit', 'permission', 'Editar información de usuarios', 4),
('user.deactivate', 'permission', 'Desactivar cuentas de usuarios', 5),
('user.secretary.assign', 'permission', 'Asignar secretario a un juez', 3),

-- CATEGORÍA: security_clearance (Niveles de Clasificación)
('clearance.L1.public', 'authorization', 'Nivel 1 - Acceso a casos públicos', 1),
('clearance.L2.confidential', 'authorization', 'Nivel 2 - Información confidencial', 3),
('clearance.L3.secret', 'authorization', 'Nivel 3 - Información secreta', 4),
('clearance.L4.top_secret', 'authorization', 'Nivel 4 - Ultra secreto (máximo)', 5),

-- CATEGORÍA: restrictions (Restricciones)
('restrict.read_only', 'restriction', 'Usuario solo puede leer, no editar', 1),
('restrict.no_export', 'restriction', 'No puede exportar/descargar documentos', 2),
('restrict.no_delete', 'restriction', 'No puede eliminar ningún recurso', 2),
('restrict.time_limited', 'restriction', 'Acceso con fecha de expiración', 1),

-- CATEGORÍA: admin_audit (Administración y Auditoría)
('admin.audit.view', 'permission', 'Ver logs de auditoría del sistema', 4),
('admin.vault.view_logs', 'permission', 'Ver logs del Identity Vault', 5),
('admin.vault.reveal_identity', 'permission', 'Revelar identidad anónima (break glass)', 5),
('admin.abac.manage', 'permission', 'Gestionar sistema ABAC (atributos y políticas)', 5),
('admin.system.backup', 'permission', 'Generar copias de seguridad del sistema', 5)

ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    level = EXCLUDED.level;

-- =============================================
-- 6. ASIGNAR ATRIBUTOS A SUPER ADMIN
-- =============================================

-- Obtener ID del super admin (ajustar email si es necesario)
DO $$
DECLARE
    admin_id UUID;
    attr_id UUID;
BEGIN
    -- Buscar super admin
    SELECT id INTO admin_id 
    FROM public.users_profile 
    WHERE role = 'super_admin' 
    LIMIT 1;

    IF admin_id IS NOT NULL THEN
        -- Asignar TODOS los atributos al super admin
        INSERT INTO public.user_attributes (user_id, attribute_id, granted_by, reason)
        SELECT 
            admin_id,
            id,
            admin_id,  -- Self-granted
            'Auto-asignado al crear el sistema ABAC'
        FROM public.abac_attributes
        ON CONFLICT (user_id, attribute_id) DO NOTHING;

        RAISE NOTICE 'Atributos asignados al Super Admin: %', admin_id;
    ELSE
        RAISE WARNING 'No se encontró Super Admin para asignar atributos';
    END IF;
END $$;

-- =============================================
-- 7. FUNCIONES HELPER
-- =============================================

-- Función para verificar si usuario tiene un atributo activo
CREATE OR REPLACE FUNCTION has_abac_attribute(
    p_user_id UUID,
    p_attribute_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    has_attr BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.user_attributes ua
        INNER JOIN public.abac_attributes aa ON ua.attribute_id = aa.id
        WHERE ua.user_id = p_user_id
        AND aa.name = p_attribute_name
        AND (ua.expires_at IS NULL OR ua.expires_at > NOW())
    ) INTO has_attr;
    
    RETURN has_attr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar clearance level (jerárquico)
CREATE OR REPLACE FUNCTION has_clearance_level(
    p_user_id UUID,
    p_required_level INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    user_level INTEGER;
BEGIN
    -- Obtener el nivel más alto de clearance del usuario
    SELECT COALESCE(MAX(
        CASE 
            WHEN aa.name LIKE 'clearance.L4.%' THEN 4
            WHEN aa.name LIKE 'clearance.L3.%' THEN 3
            WHEN aa.name LIKE 'clearance.L2.%' THEN 2
            WHEN aa.name LIKE 'clearance.L1.%' THEN 1
            ELSE 0
        END
    ), 0) INTO user_level
    FROM public.user_attributes ua
    INNER JOIN public.abac_attributes aa ON ua.attribute_id = aa.id
    WHERE ua.user_id = p_user_id
    AND aa.category = 'authorization'
    AND aa.name LIKE 'clearance.%'
    AND (ua.expires_at IS NULL OR ua.expires_at > NOW());
    
    RETURN user_level >= p_required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. TRIGGERS
-- =============================================

-- Trigger para limpiar atributos expirados (opcional, puede ser un cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_attributes()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.user_attributes
    WHERE expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar cleanup diariamente (esto requiere pg_cron extensión)
-- Para simplificar, se puede hacer manualmente o con un script

-- =============================================
-- 9. COMENTARIOS EN TABLAS
-- =============================================

COMMENT ON TABLE public.user_attributes IS 'Atributos ABAC asignados a usuarios';
COMMENT ON TABLE public.policy_enforcement_log IS 'Auditoría de decisiones de control de acceso';
COMMENT ON COLUMN public.user_attributes.expires_at IS 'NULL = permanente, fecha = expira en esa fecha';
COMMENT ON COLUMN public.policy_enforcement_log.result IS 'allow o deny';

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

-- Contar atributos creados
SELECT category, COUNT(*) as count
FROM public.abac_attributes
GROUP BY category
ORDER BY category;

-- Verificar atributos del super admin
SELECT 
    up.real_name,
    COUNT(ua.id) as total_attributes
FROM public.users_profile up
LEFT JOIN public.user_attributes ua ON up.id = ua.user_id
WHERE up.role = 'super_admin'
GROUP BY up.id, up.real_name;
