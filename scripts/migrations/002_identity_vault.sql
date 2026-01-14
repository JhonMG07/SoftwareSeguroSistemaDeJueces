-- ============================================
-- Identity Vault - Base de Datos Separada
-- ============================================
-- Este SQL debe ejecutarse en el SEGUNDO proyecto Supabase
-- (Identity Vault Project)

-- Tabla: Mapeo de identidades anónimas
CREATE TABLE IF NOT EXISTS identity_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_actor_id UUID UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  case_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Auditoría de accesos
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  -- Un usuario solo puede tener un pseudónimo por caso
  CONSTRAINT unique_user_case UNIQUE(user_id, case_id)
);

-- Tabla: Log de auditoría de accesos al vault
CREATE TABLE IF NOT EXISTS identity_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_actor_id UUID NOT NULL,
  accessed_by UUID NOT NULL,
  access_reason TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_identity_mapping_anon 
  ON identity_mapping(anon_actor_id);

CREATE INDEX IF NOT EXISTS idx_identity_mapping_user 
  ON identity_mapping(user_id);

CREATE INDEX IF NOT EXISTS idx_identity_mapping_case 
  ON identity_mapping(case_id);

CREATE INDEX IF NOT EXISTS idx_identity_access_log_anon 
  ON identity_access_log(anon_actor_id);

CREATE INDEX IF NOT EXISTS idx_identity_access_log_accessed_at 
  ON identity_access_log(accessed_at DESC);

-- Habilitar Row Level Security
ALTER TABLE identity_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_access_log ENABLE ROW LEVEL SECURITY;

-- Política: Solo service key puede acceder
-- (Dado que usamos service key desde backend, estas políticas son
--  defensa en profundidad adicional)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'identity_mapping' 
    AND policyname = 'Service key full access to mapping'
  ) THEN
    CREATE POLICY "Service key full access to mapping"
      ON identity_mapping FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'identity_access_log' 
    AND policyname = 'Service key full access to logs'
  ) THEN
    CREATE POLICY "Service key full access to logs"
      ON identity_access_log FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- Verificación
-- ============================================

-- Verificar que las tablas se crearon correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('identity_mapping', 'identity_access_log');

-- Resultado esperado: 2 filas
-- identity_mapping
-- identity_access_log

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('identity_mapping', 'identity_access_log');
