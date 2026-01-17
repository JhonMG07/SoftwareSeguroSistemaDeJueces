-- ============================================
-- MIGRACIÓN DE CORRECCIÓN: Fix Case Type Constraint
-- ============================================

-- 1. Normalizar datos existentes a minúsculas para cumplir con el nuevo constraint
UPDATE cases 
SET case_type = lower(case_type);

-- 2. Eliminar constraint posiblemente defectuoso
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_case_type_check;

-- 3. Crear constraint correcto y explícito
ALTER TABLE cases ADD CONSTRAINT cases_case_type_check 
  CHECK (case_type IN ('civil', 'penal', 'laboral', 'administrativo'));

-- 4. Verificar
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'cases_case_type_check';
