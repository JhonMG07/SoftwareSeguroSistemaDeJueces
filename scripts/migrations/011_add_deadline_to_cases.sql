-- Agregar columna deadline a la tabla cases
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- Asegurar que la columna classification exista (por si acaso, ya que vi advertencias antes)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'classification') THEN
        ALTER TABLE public.cases ADD COLUMN classification text CHECK (classification IN ('public', 'confidential', 'secret', 'top_secret'));
    END IF;
END $$;
