-- ============================================
-- MIGRACIÓN: Tablas para Casos y Asignaciones
-- ============================================
-- Ejecutar en: BD PRINCIPAL (Proyecto Supabase original)
-- Proyecto: sistema-jueces (NO en el vault)

-- Tabla: Casos judiciales
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  case_type TEXT NOT NULL CHECK (case_type IN ('civil', 'penal', 'laboral', 'administrativo')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'archived')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by UUID REFERENCES users_profile(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Asignaciones de casos
-- ⚠️ IMPORTANTE: Solo contiene anon_actor_id, NUNCA user_id
CREATE TABLE IF NOT EXISTS case_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  anon_actor_id UUID NOT NULL,  -- ← Pseudónimo, NO es user_id
  role TEXT NOT NULL CHECK (role IN ('judge', 'secretary')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  assigned_by UUID REFERENCES users_profile(id) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un pseudónimo solo puede estar asignado una vez al mismo caso
  UNIQUE(case_id, anon_actor_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);
CREATE INDEX IF NOT EXISTS idx_cases_number ON cases(case_number);

CREATE INDEX IF NOT EXISTS idx_assignments_case ON case_assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_assignments_anon ON case_assignments(anon_actor_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON case_assignments(status);

-- Trigger para actualizar updated_at en cases
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS: CASES
-- ============================================

-- Super Admin puede gestionar todos los casos
CREATE POLICY "Super admin full access to cases"
  ON cases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Jueces y secretarios pueden ver solo casos asignados a ellos
-- La verificación se hace contra sus pseudónimos en case_assignments
CREATE POLICY "Assigned users can view their cases"
  ON cases FOR SELECT
  USING (
    id IN (
      SELECT case_id 
      FROM case_assignments
      WHERE anon_actor_id IN (
        -- Este select se resolvería consultando el Identity Vault
        -- desde el backend, no directamente en RLS
        SELECT '00000000-0000-0000-0000-000000000000'::uuid
        WHERE false  -- Placeholder, acceso real via backend
      )
    )
  );

-- ============================================
-- POLÍTICAS RLS: CASE_ASSIGNMENTS
-- ============================================

-- Super Admin puede ver todas las asignaciones
CREATE POLICY "Super admin can view assignments"
  ON case_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super Admin puede crear asignaciones
CREATE POLICY "Super admin can create assignments"
  ON case_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super Admin puede actualizar asignaciones
CREATE POLICY "Super admin can update assignments"
  ON case_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Usuarios pueden ver sus propias asignaciones
-- (El backend debe inyectar el anon_actor_id en la query)
CREATE POLICY "Users can view own assignments via backend"
  ON case_assignments FOR SELECT
  USING (true);  -- El filtrado real se hace en el backend

-- ============================================
-- Verificación
-- ============================================

-- Verificar que las tablas se crearon
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('cases', 'case_assignments');

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('cases', 'case_assignments');

-- Resultado esperado: 
-- cases
-- case_assignments
