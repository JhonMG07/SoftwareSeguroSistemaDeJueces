-- ============================================
-- FIX: Eliminar políticas con recursión infinita
-- ============================================
-- Ejecutar en BD PRINCIPAL

-- 1. Eliminar todas las políticas existentes de users_profile
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
DROP POLICY IF EXISTS "Super admin can view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Super admin can insert profiles" ON users_profile;
DROP POLICY IF EXISTS "Super admin can update all profiles" ON users_profile;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON users_profile;

-- 2. Crear políticas SIN recursión
-- La clave es NO consultar users_profile dentro de las políticas

-- Política: Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = id);

-- Política: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = id);

-- Política: Permitir SELECT a todos los usuarios autenticados
-- (El filtrado de permisos se hace en el código del backend)
CREATE POLICY "Authenticated users can view profiles"
  ON users_profile FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Solo service role puede insertar
CREATE POLICY "Service role can insert profiles"
  ON users_profile FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Política: Solo service role puede actualizar otros perfiles
CREATE POLICY "Service role can update profiles"
  ON users_profile FOR UPDATE
  USING (auth.role() = 'service_role');

-- Política: Solo service role puede eliminar
CREATE POLICY "Service role can delete profiles"
  ON users_profile FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================
-- Verificar políticas
-- ============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users_profile';
