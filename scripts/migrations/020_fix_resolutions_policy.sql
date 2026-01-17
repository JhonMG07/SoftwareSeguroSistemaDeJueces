-- Corregir política RLS para permitir al Super Admin ver resoluciones
DROP POLICY IF EXISTS "Permitir ver resoluciones a usuarios autorizados" ON case_resolutions;

CREATE POLICY "Permitir ver resoluciones a usuarios autorizados" ON case_resolutions
    FOR SELECT
    TO authenticated
    USING (
        -- 1. Jueces Asignados (via Identity Vault)
        EXISTS (
            SELECT 1 FROM case_assignments ca
            WHERE ca.case_id = case_resolutions.case_id
            AND (
                ca.anon_actor_id IN (
                    SELECT anon_actor_id FROM identity_vault 
                    WHERE user_id = auth.uid()
                )
            )
        )
        OR
        -- 2. Staff autorizado (Secretarios, Admins y SUPER ADMIN)
        EXISTS (
            SELECT 1 FROM users_profile up
            WHERE up.id = auth.uid() 
            AND up.role IN ('secretary', 'admin', 'super_admin') -- Agregado super_admin
        )
    );
