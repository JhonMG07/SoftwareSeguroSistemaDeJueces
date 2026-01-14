-- ============================================
-- FIX: Políticas RLS para tabla cases
-- ============================================
-- Ejecutar en BD PRINCIPAL

-- 1. Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "Super admin full access to cases" ON cases;
DROP POLICY IF EXISTS "Assigned users can view their cases" ON cases;

-- 2. Crear políticas nuevas SIN recursión

-- Super Admin puede gestionar todos los casos
CREATE POLICY "Super admin can manage cases"
  ON cases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() 
      AND users_profile.role = 'super_admin'
    )
  );

-- Todos los usuarios autenticados pueden ver casos
-- (El filtrado de permisos se hace en el backend via pseudónimos)
CREATE POLICY "Authenticated users can view cases"
  ON cases FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- Verificar políticas
-- ============================================
SELECT tablename, policyname
FROM pg_policies
WHERE tablename = 'cases';
