-- Tabla para almacenar los dictámenes/resoluciones de los casos
CREATE TABLE case_resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    author_anon_id TEXT NOT NULL, -- ID anónimo del juez (Identity Vault)
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_case FOREIGN KEY (case_id) REFERENCES cases(id)
);

-- Habilitar RLS
ALTER TABLE case_resolutions ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad

-- 1. Jueces pueden crear resoluciones si están asignados (validado por lógica de negocio + anon_id)
-- Por ahora, permitimos insert a authenticated si tienen acceso al caso (simplificado)
-- Idealmente usaríamos el vault, pero RLS no ve la cookie. 
-- La validación fuerte se hace en el server action.
CREATE POLICY "Jueces pueden crear resoluciones" ON case_resolutions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM case_assignments ca
            WHERE ca.case_id = case_resolutions.case_id
            AND ca.role = 'judge'
            AND ca.status = 'active'
            AND ca.anon_actor_id IN (
                SELECT anon_actor_id FROM identity_mapping 
                WHERE user_id = auth.uid()
            )
        )
    );

-- 2. Secretarios y Jueces asignados pueden ver resoluciones
CREATE POLICY "Permitir ver resoluciones a usuarios autorizados" ON case_resolutions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM case_assignments ca
            WHERE ca.case_id = case_resolutions.case_id
            AND (
                ca.anon_actor_id IN (
                    SELECT anon_actor_id FROM identity_mapping 
                    WHERE user_id = auth.uid()
                )
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM users_profile up
            WHERE up.id = auth.uid() AND up.role IN ('secretary', 'admin', 'super_admin')
        )
    );
