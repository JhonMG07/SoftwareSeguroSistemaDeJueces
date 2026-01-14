-- =============================================
-- Migración: RLS con ABAC Clearance para Casos
-- Fecha: 12 Enero 2026
-- =============================================

-- =============================================
-- 1. RLS POLICY: Casos filtrados por Clearance
-- =============================================

-- Eliminar policy existente si existe
DROP POLICY IF EXISTS "Users can view cases based on clearance" ON public.cases;

-- Crear nueva policy con verificación de clearance
CREATE POLICY "abac_clearance_case_access"
ON public.cases
FOR SELECT
TO authenticated
USING (
    -- Caso público: todos pueden ver
    classification = 'public'
    OR classification IS NULL
    
    -- Super admin puede ver todo
    OR EXISTS (
        SELECT 1 FROM public.users_profile
        WHERE id = auth.uid()
        AND role = 'super_admin'
        AND status = 'active'
    )
    
    -- Verificar clearance level del usuario
    OR (
        classification = 'confidential' 
        AND has_clearance_level(auth.uid(), 2)
    )
    OR (
        classification = 'secret' 
        AND has_clearance_level(auth.uid(), 3)
    )
    OR (
        classification = 'top_secret' 
        AND has_clearance_level(auth.uid(), 4)
    )
);

-- =============================================
-- 2. RLS POLICY: Filtro básico por rol
-- =============================================

-- NOTA: El filtro de "solo casos asignados" se maneja en la capa de aplicación
-- porque requiere consultar el Identity Vault (BD separada)
-- Ver: /api/judge/cases

-- Eliminar policy existente
DROP POLICY IF EXISTS "Judge can view assigned cases" ON public.cases;

-- Policy básica: usuarios activos pueden ver casos
CREATE POLICY "authenticated_users_view_cases"
ON public.cases
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users_profile
        WHERE id = auth.uid()
        AND status = 'active'
    )
);

-- =============================================
-- 3. RLS POLICY: Insertar casos (solo con permiso)
-- =============================================

CREATE POLICY "abac_case_create"
ON public.cases
FOR INSERT
TO authenticated
WITH CHECK (
    has_abac_attribute(auth.uid(), 'case.create')
);

-- =============================================
-- 4. RLS POLICY: Actualizar casos
-- =============================================

CREATE POLICY "abac_case_update"
ON public.cases
FOR UPDATE
TO authenticated
USING (
    -- Super admin
    EXISTS (
        SELECT 1 FROM public.users_profile
        WHERE id = auth.uid()
        AND role = 'super_admin'
        AND status = 'active'
    )
    -- O tiene permiso de editar metadata
    OR has_abac_attribute(auth.uid(), 'case.edit.metadata')
    -- O tiene permiso de editar status
    OR has_abac_attribute(auth.uid(), 'case.edit.status')
);

-- =============================================
-- 5. RLS POLICY: Eliminar casos
-- =============================================

CREATE POLICY "abac_case_delete"
ON public.cases
FOR DELETE
TO authenticated
USING (
    has_abac_attribute(auth.uid(), 'case.delete')
);

-- =============================================
-- 6. COMENTARIOS
-- =============================================

COMMENT ON POLICY "abac_clearance_case_access" ON public.cases IS 
'Permite acceso a casos según nivel de clearance ABAC del usuario';

COMMENT ON POLICY "authenticated_users_view_cases" ON public.cases IS 
'Permite a usuarios autenticados ver casos. El filtro de asignación se hace en capa de aplicación via Identity Vault.';

COMMENT ON POLICY "abac_case_create" ON public.cases IS 
'Solo usuarios con atributo case.create pueden crear casos';

COMMENT ON POLICY "abac_case_update" ON public.cases IS 
'Controla quién puede actualizar casos según atributos ABAC';

COMMENT ON POLICY "abac_case_delete" ON public.cases IS 
'Solo usuarios con atributo case.delete pueden eliminar casos';
