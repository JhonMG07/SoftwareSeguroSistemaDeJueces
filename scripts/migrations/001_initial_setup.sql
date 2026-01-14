-- ============================================
-- MIGRACIÓN: Crear tablas para Sistema de Jueces
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Tabla de perfiles de usuarios
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'judge', 'secretary')),
  real_name TEXT NOT NULL,
  area_competence TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de identidades anónimas (para jueces y secretarios)
CREATE TABLE IF NOT EXISTS anonymous_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
  anonymous_alias TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('judge', 'secretary')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_anonymous UNIQUE(user_id)
);

-- 3. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_anonymous_identities_user ON anonymous_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile(role);
CREATE INDEX IF NOT EXISTS idx_users_profile_email ON users_profile(email);
CREATE INDEX IF NOT EXISTS idx_users_profile_status ON users_profile(status);

-- 4. Habilitar Row Level Security
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_identities ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para users_profile

-- Política: usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = id);

-- Política: usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = id);

-- Política: super_admin puede ver todos los perfiles
CREATE POLICY "Super admin can view all profiles"
  ON users_profile FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política: super_admin puede insertar perfiles
CREATE POLICY "Super admin can insert profiles"
  ON users_profile FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política: super_admin puede actualizar perfiles
CREATE POLICY "Super admin can update all profiles"
  ON users_profile FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política: super_admin puede eliminar perfiles
CREATE POLICY "Super admin can delete profiles"
  ON users_profile FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 6. Políticas RLS para anonymous_identities

-- Política: usuarios pueden ver su propia identidad anónima
CREATE POLICY "Users can view own anonymous identity"
  ON anonymous_identities FOR SELECT
  USING (auth.uid() = user_id);

-- Política: super_admin puede ver todas las identidades anónimas (para auditoría)
CREATE POLICY "Super admin can view all anonymous identities"
  ON anonymous_identities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política: super_admin puede insertar identidades anónimas
CREATE POLICY "Super admin can insert anonymous identities"
  ON anonymous_identities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 7. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para actualizar updated_at en users_profile
CREATE TRIGGER update_users_profile_updated_at
  BEFORE UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las tablas se crearon
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users_profile', 'anonymous_identities');

-- Resultado esperado: 2 filas
-- users_profile
-- anonymous_identities
