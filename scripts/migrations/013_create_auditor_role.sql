-- ============================================
-- MIGRACIÓN: Crear Rol de Auditor
-- ============================================
-- Descripción: Agrega el rol 'auditor' con acceso SOLO a:
-- - Logs del sistema
-- - Métricas agregadas
-- NO tiene acceso a casos, usuarios ni documentos

-- PASO 1: Actualizar constraint de roles en users_profile
ALTER TABLE public.users_profile 
DROP CONSTRAINT IF EXISTS users_profile_role_check;

ALTER TABLE public.users_profile 
ADD CONSTRAINT users_profile_role_check 
CHECK (role IN ('super_admin', 'admin', 'judge', 'secretary', 'auditor'));

-- PASO 2: Crear atributos ABAC para el rol de auditor
-- Solo 3 atributos: logs, métricas y restricción de solo lectura

-- Atributo 1: Ver logs de auditoría
INSERT INTO public.abac_attributes (name, category, description, level) 
VALUES 
  ('Ver Logs de Auditoría', 'permission', 'Ver logs de auditoría del sistema', 4)
ON CONFLICT DO NOTHING;

-- Atributo 2: Ver métricas agregadas
INSERT INTO public.abac_attributes (name, category, description, level) 
VALUES 
  ('Ver Métricas del Sistema', 'permission', 'Ver métricas y estadísticas agregadas del sistema', 3)
ON CONFLICT DO NOTHING;

-- Atributo 3: Restricción de solo lectura (ya existe probablemente)
INSERT INTO public.abac_attributes (name, category, description, level) 
VALUES 
  ('Solo Lectura', 'restriction', 'Usuario con permisos de solo lectura (no puede crear, editar o eliminar)', 1)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver los atributos ABAC creados para auditores
SELECT id, name, category, description, level
FROM public.abac_attributes 
WHERE name IN (
  'Ver Logs de Auditoría',
  'Ver Métricas del Sistema',
  'Solo Lectura'
);

-- Nota: Para crear un usuario auditor:
-- 1. Ejecutar este script
-- 2. Crear usuario desde el panel de administración con rol 'auditor'
-- 3. Asignarle estos 3 atributos ABAC desde la interfaz de gestión de usuarios
