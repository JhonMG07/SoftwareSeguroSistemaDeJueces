-- =============================================
-- MIGRATION: Add 'por_asignar' Status
-- =============================================

-- 1. Drop the existing constraint
ALTER TABLE public.cases 
DROP CONSTRAINT IF EXISTS cases_status_check;

-- 2. Add the new constraint with 'por_asignar'
ALTER TABLE public.cases 
ADD CONSTRAINT cases_status_check 
CHECK (status IN ('por_asignar', 'asignado', 'en_revision', 'dictaminado', 'cerrado'));

-- 3. (Optional) Comment to document the change
COMMENT ON COLUMN public.cases.status IS 'por_asignar | asignado | en_revision | dictaminado | cerrado';
