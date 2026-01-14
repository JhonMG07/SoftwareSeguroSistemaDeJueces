-- =============================================
-- Migración: Sistema ABAC (Atributos y Políticas)
-- Base de Datos: Principal (Supabase Main Project)
-- =============================================

-- Tabla: abac_attributes
-- Almacena los atributos ABAC del sistema
CREATE TABLE IF NOT EXISTS public.abac_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('permission', 'authorization', 'restriction')),
    description TEXT NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: security_policies
-- Almacena las políticas de seguridad
CREATE TABLE IF NOT EXISTS public.security_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: policy_rules
-- Almacena las reglas de cada política
CREATE TABLE IF NOT EXISTS public.policy_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES public.security_policies(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES public.abac_attributes(id) ON DELETE CASCADE,
    operator TEXT NOT NULL CHECK (operator IN ('equals', 'not_equals', 'greater_than', 'less_than', 'contains')),
    value TEXT NOT NULL, -- Almacenado como texto, se parsea según necesidad
    action TEXT NOT NULL CHECK (action IN ('allow', 'deny')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_abac_attributes_category ON public.abac_attributes(category);
CREATE INDEX IF NOT EXISTS idx_security_policies_active ON public.security_policies(active);
CREATE INDEX IF NOT EXISTS idx_policy_rules_policy_id ON public.policy_rules(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_rules_attribute_id ON public.policy_rules(attribute_id);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Habilitar RLS
ALTER TABLE public.abac_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_rules ENABLE ROW LEVEL SECURITY;

-- Solo Super Admin puede ver/editar atributos ABAC
CREATE POLICY "Super Admin full access to ABAC attributes"
    ON public.abac_attributes
    FOR ALL
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

-- Solo Super Admin puede ver/editar políticas
CREATE POLICY "Super Admin full access to security policies"
    ON public.security_policies
    FOR ALL
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

-- Solo Super Admin puede ver/editar reglas de políticas
CREATE POLICY "Super Admin full access to policy rules"
    ON public.policy_rules
    FOR ALL
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

-- =============================================
-- Datos iniciales (Atributos ABAC por defecto)
-- =============================================

INSERT INTO public.abac_attributes (name, category, description, level) VALUES
-- PERMISOS
('Ver Casos', 'permission', 'Permite ver casos judiciales', 1),
('Editar Casos', 'permission', 'Permite editar información de casos', 2),
('Crear Casos', 'permission', 'Permite crear nuevos casos', 3),
('Eliminar Casos', 'permission', 'Permite eliminar casos', 4),
('Gestionar Usuarios', 'permission', 'Permite crear, editar y desactivar usuarios', 5),
('Ver Usuarios', 'permission', 'Permite ver lista de usuarios del sistema', 1),

-- AUTORIZACIONES
('Información Confidencial', 'authorization', 'Acceso a información confidencial', 3),
('Información Secreta', 'authorization', 'Acceso a información secreta', 4),
('Información Ultra Secreta', 'authorization', 'Acceso a información ultra secreta', 5),

-- RESTRICCIONES
('Solo Lectura', 'restriction', 'Restricción de solo lectura', 1),
('Sin Exportación', 'restriction', 'No puede exportar documentos', 2)
ON CONFLICT DO NOTHING;

-- =============================================
-- Políticas de ejemplo
-- =============================================

-- Insertar política de ejemplo
DO $$
DECLARE
    policy_id UUID;
    attr_id UUID;
BEGIN
    -- Crear política "Acceso Jueces a Casos"
    INSERT INTO public.security_policies (name, description, active)
    VALUES ('Acceso Jueces a Casos', 'Permite a los jueces ver y editar solo sus casos asignados', true)
    RETURNING id INTO policy_id;

    -- Obtener ID del atributo "Ver Casos"
    SELECT id INTO attr_id FROM public.abac_attributes WHERE name = 'Ver Casos' LIMIT 1;

    -- Crear regla para la política
    IF attr_id IS NOT NULL THEN
        INSERT INTO public.policy_rules (policy_id, attribute_id, operator, value, action)
        VALUES (policy_id, attr_id, 'equals', 'true', 'allow');
    END IF;

    -- Crear política "Restricción Exportación Secretarios"
    INSERT INTO public.security_policies (name, description, active)
    VALUES ('Restricción Exportación Secretarios', 'Los secretarios no pueden exportar documentos', true)
    RETURNING id INTO policy_id;

    -- Obtener ID del atributo "Sin Exportación"
    SELECT id INTO attr_id FROM public.abac_attributes WHERE name = 'Sin Exportación' LIMIT 1;

    -- Crear regla para la política
    IF attr_id IS NOT NULL THEN
        INSERT INTO public.policy_rules (policy_id, attribute_id, operator, value, action)
        VALUES (policy_id, attr_id, 'equals', 'true', 'deny');
    END IF;
END $$;

-- =============================================
-- Función para actualizar updated_at automáticamente
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_abac_attributes_updated_at
    BEFORE UPDATE ON public.abac_attributes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_policies_updated_at
    BEFORE UPDATE ON public.security_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
