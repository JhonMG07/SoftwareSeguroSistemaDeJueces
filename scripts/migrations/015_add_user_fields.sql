-- ============================================
-- MIGRACIÓN: Agregar campos department y phone a users_profile
-- ============================================

-- Agregar columna department si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'department'
  ) THEN
    ALTER TABLE public.users_profile ADD COLUMN department TEXT;
  END IF;
END $$;

-- Agregar columna phone si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users_profile ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Verificación
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
  AND column_name IN ('department', 'phone');
