-- ============================================
-- MIGRACIÓN: Sistema de Credenciales Efímeras
-- ============================================
-- Descripción: Tabla para almacenar credenciales temporales
-- que se envían a jueces cuando se les asigna un caso

CREATE TABLE IF NOT EXISTS public.ephemeral_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  anon_actor_id UUID NOT NULL,  -- Pseudónimo del Identity Vault
  temp_email TEXT UNIQUE NOT NULL,  -- Email temporal generado
  temp_password_hash TEXT NOT NULL,  -- Contraseña hasheada
  access_token TEXT UNIQUE NOT NULL,  -- Token JWT para acceso directo
  expires_at TIMESTAMPTZ NOT NULL,  -- Expiración (7 días)
  used_at TIMESTAMPTZ,  -- NULL = no usado, timestamp = usado
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_expires_future CHECK (expires_at > created_at)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_ephemeral_token ON ephemeral_credentials(access_token);
CREATE INDEX IF NOT EXISTS idx_ephemeral_case ON ephemeral_credentials(case_id);
CREATE INDEX IF NOT EXISTS idx_ephemeral_anon ON ephemeral_credentials(anon_actor_id);
CREATE INDEX IF NOT EXISTS idx_ephemeral_expires ON ephemeral_credentials(expires_at);

-- RLS: Solo super admin puede ver credenciales efímeras
ALTER TABLE public.ephemeral_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access to ephemeral credentials"
  ON public.ephemeral_credentials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND status = 'active'
    )
  );

-- Función para limpiar credenciales expiradas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_credentials()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ephemeral_credentials
  WHERE expires_at < NOW()
  RETURNING COUNT(*) INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios descriptivos
COMMENT ON TABLE public.ephemeral_credentials IS 'Credenciales temporales enviadas a jueces al asignarles un caso. Expiran en 7 días.';
COMMENT ON COLUMN public.ephemeral_credentials.anon_actor_id IS 'Pseudónimo del juez en el Identity Vault';
COMMENT ON COLUMN public.ephemeral_credentials.temp_email IS 'Email temporal generado para el caso (ej: caso-x9k2@sistema.temp)';
COMMENT ON COLUMN public.ephemeral_credentials.access_token IS 'Token JWT para acceso directo sin login';
COMMENT ON COLUMN public.ephemeral_credentials.used_at IS 'Timestamp de cuándo se usaron las credenciales (NULL si no se han usado)';

-- Verificación
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'ephemeral_credentials'
ORDER BY ordinal_position;
