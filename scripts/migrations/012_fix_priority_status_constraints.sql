-- Actualizar constraints de la tabla cases para alinear con la UI
-- Cambia 'normal' por 'medium' en prioridad y actualiza estados

-- PASO 1: Eliminar constraints existentes
ALTER TABLE public.cases 
DROP CONSTRAINT IF EXISTS cases_priority_check;

ALTER TABLE public.cases 
DROP CONSTRAINT IF EXISTS cases_status_check;

-- PASO 2: Actualizar datos existentes ANTES de agregar nuevas constraints
UPDATE public.cases 
SET priority = 'medium' 
WHERE priority = 'normal';

UPDATE public.cases 
SET status = 'in_review' 
WHERE status = 'in_progress';

UPDATE public.cases 
SET status = 'in_review' 
WHERE status = 'assigned';

-- PASO 3: Ahora sí, agregar las nuevas constraints
ALTER TABLE public.cases 
ADD CONSTRAINT cases_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE public.cases 
ADD CONSTRAINT cases_status_check 
CHECK (status IN ('pending', 'in_review', 'resolved', 'archived', 'rejected'));
