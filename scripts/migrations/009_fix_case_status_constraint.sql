-- ============================================
-- MIGRACIÓN DE CORRECCIÓN: Fix Case Status Constraint (Orden Correcto)
-- ============================================

-- 1. Primero ELIMINAR el constraint defectuoso para permitir modificaciones
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_status_check;

-- 2. Ahora sí, normalizar datos existentes (sin reglas que estorben)
UPDATE cases SET status = 'pending' WHERE status ILIKE 'pendiente' OR status ILIKE 'por asignar';
UPDATE cases SET status = 'assigned' WHERE status ILIKE 'asignado';
UPDATE cases SET status = 'in_progress' WHERE status ILIKE 'en revision' OR status ILIKE 'en proceso';
UPDATE cases SET status = 'resolved' WHERE status ILIKE 'dictaminado' OR status ILIKE 'resuelto';
UPDATE cases SET status = 'archived' WHERE status ILIKE 'cerrado' OR status ILIKE 'archivado';

-- Asegurar minúsculas
UPDATE cases 
SET status = lower(status);

-- 3. Crear constraint correcto y explícito
-- Valores permitidos: 'pending', 'assigned', 'in_progress', 'resolved', 'archived'
ALTER TABLE cases ADD CONSTRAINT cases_status_check 
  CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'archived'));

-- 4. Verificar
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'cases_status_check';
