-- ============================================================================
-- SEED: Usuarios de Prueba
-- ============================================================================
-- IMPORTANTE: Estos usuarios son SOLO PARA DESARROLLO
-- En producción, crear usuarios reales con contraseñas seguras
-- ============================================================================

-- NOTA: Supabase Auth usa una tabla separada (auth.users) para autenticación
-- Este script crea usuarios en nuestra tabla custom (public.users)
-- Después de ejecutar este script, debes crear los usuarios en Supabase Auth Dashboard

-- ============================================================================
-- 1. Crear usuarios en nuestra tabla public.users
-- ============================================================================

-- Usuario 1: Patrón/Owner
INSERT INTO public.users (id, email, role, full_name, phone, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'patron@amenadiel.com', 'owner', 'Juan Patrón', '+57 300 1234567', true)
ON CONFLICT (email) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active;

-- Usuario 2: Contador/Accountant
INSERT INTO public.users (id, email, role, full_name, phone, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'contador@amenadiel.com', 'accountant', 'María Contadora', '+57 300 2345678', true)
ON CONFLICT (email) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active;

-- Usuario 3: Cobrador/Collector
INSERT INTO public.users (id, email, role, full_name, phone, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000003', 'cobrador@amenadiel.com', 'collector', 'Carlos Cobrador', '+57 300 3456789', true)
ON CONFLICT (email) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active;

-- ============================================================================
-- 2. INSTRUCCIONES: Crear usuarios en Supabase Auth
-- ============================================================================

/*

IMPORTANTE: Este script solo crea registros en public.users.
Para que funcione el login, debes crear los usuarios en Supabase Auth:

OPCIÓN A: Dashboard de Supabase (Más fácil)
-------------------------------------------
1. Ir a: https://supabase.com/dashboard → Tu Proyecto → Authentication → Users
2. Click en "Add User" → "Create new user"
3. Crear cada usuario con estos datos:

   Usuario Patrón:
   - Email: patron@amenadiel.com
   - Password: 12345
   - Email confirmation: Skip (desmarcar "Send email confirmation")

   Usuario Contador:
   - Email: contador@amenadiel.com
   - Password: 12345
   - Email confirmation: Skip

   Usuario Cobrador:
   - Email: cobrador@amenadiel.com
   - Password: 12345
   - Email confirmation: Skip

OPCIÓN B: SQL (Para automatizar)
---------------------------------
Ejecutar este bloque SQL en el SQL Editor de Supabase:

-- NOTA: Esta función requiere permisos de service_role
-- Solo funciona desde el dashboard de Supabase, NO desde la aplicación

-- 1. Patrón
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'patron@amenadiel.com',
    crypt('12345', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Juan Patrón"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Contador
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'contador@amenadiel.com',
    crypt('12345', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"María Contadora"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- 3. Cobrador
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'cobrador@amenadiel.com',
    crypt('12345', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Carlos Cobrador"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

*/

-- ============================================================================
-- 3. Vincular auth.users con public.users (Trigger)
-- ============================================================================

/*
Este trigger sincroniza auth.users con public.users automáticamente
cuando se crea un nuevo usuario en Supabase Auth
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'collector' -- Rol por defecto
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
    true
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger que ejecuta la función cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. Verificación
-- ============================================================================

-- Verificar que los usuarios se crearon correctamente
SELECT
    id,
    email,
    role,
    full_name,
    is_active,
    created_at
FROM public.users
ORDER BY
    CASE role
        WHEN 'owner' THEN 1
        WHEN 'accountant' THEN 2
        WHEN 'collector' THEN 3
    END;

-- ============================================================================
-- FIN DEL SEED
-- ============================================================================

COMMENT ON TABLE public.users IS 'Usuarios del sistema - sincronizado con auth.users via trigger';
