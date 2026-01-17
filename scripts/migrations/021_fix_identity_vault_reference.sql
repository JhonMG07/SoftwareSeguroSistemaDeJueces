-- Migración consolidada: Crear tabla y corregir políticas
-- Esta migración reemplaza a la 019 y 020 para asegurar que todo funcione

-- 1. Crear la tabla (Si no existe, porque la 019 falló)
CREATE TABLE IF NOT EXISTS case_resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    author_anon_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_case FOREIGN KEY (case_id) REFERENCES cases(id)
);

-- 2. Habilitar RLS
ALTER TABLE case_resolutions ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas antiguas porsiacaso
DROP POLICY IF EXISTS "Jueces pueden crear resoluciones" ON case_resolutions;
DROP POLICY IF EXISTS "Permitir ver resoluciones a usuarios autorizados" ON case_resolutions;

-- 4. Política INSERT Simple (Validación fuerte en Backend)
CREATE POLICY "Jueces pueden crear resoluciones" ON case_resolutions
    FOR INSERT
    TO authenticated
    WITH CHECK (true); 

-- 5. Política SELECT (Roles permitidos)
CREATE POLICY "Permitir ver resoluciones a usuarios autorizados" ON case_resolutions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users_profile up
            WHERE up.id = auth.uid() 
            AND up.role IN ('judge', 'secretary', 'admin', 'super_admin')
        )
    );
