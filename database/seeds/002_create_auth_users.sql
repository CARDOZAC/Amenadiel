-- ============================================================================
-- CREAR USUARIOS EN SUPABASE AUTH (MÉTODO SIMPLIFICADO)
-- ============================================================================
-- Este script crea usuarios directamente en auth.users
-- Ejecutar DESPUÉS de haber ejecutado 001_test_users.sql
-- ============================================================================

-- INSTRUCCIONES:
-- 1. Copia TODA esta query
-- 2. Pégala en Supabase SQL Editor
-- 3. Haz clic en "Run" (Ctrl+Enter)
-- 4. Si ves errores de "duplicate key", es porque ya existen - ¡está bien!

-- ============================================================================
-- CREAR USUARIOS DE AUTENTICACIÓN
-- ============================================================================

DO $$
DECLARE
  patron_id UUID := '00000000-0000-0000-0000-000000000001';
  contador_id UUID := '00000000-0000-0000-0000-000000000002';
  cobrador_id UUID := '00000000-0000-0000-0000-000000000003';
BEGIN

  -- 1. Usuario: Patrón/Owner
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
    patron_id,
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
  ) ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = EXCLUDED.email_confirmed_at;

  RAISE NOTICE '✅ Usuario "patron@amenadiel.com" creado/actualizado';

  -- 2. Usuario: Contador/Accountant
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
    contador_id,
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
  ) ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = EXCLUDED.email_confirmed_at;

  RAISE NOTICE '✅ Usuario "contador@amenadiel.com" creado/actualizado';

  -- 3. Usuario: Cobrador/Collector
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
    cobrador_id,
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
  ) ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = EXCLUDED.email_confirmed_at;

  RAISE NOTICE '✅ Usuario "cobrador@amenadiel.com" creado/actualizado';

  -- 4. También crear identidades para cada usuario
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES
    (gen_random_uuid(), patron_id, json_build_object('sub', patron_id::text, 'email', 'patron@amenadiel.com'), 'email', NOW(), NOW(), NOW()),
    (gen_random_uuid(), contador_id, json_build_object('sub', contador_id::text, 'email', 'contador@amenadiel.com'), 'email', NOW(), NOW(), NOW()),
    (gen_random_uuid(), cobrador_id, json_build_object('sub', cobrador_id::text, 'email', 'cobrador@amenadiel.com'), 'email', NOW(), NOW(), NOW())
  ON CONFLICT (provider, id) DO NOTHING;

  RAISE NOTICE '✅ Identidades creadas';

END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver usuarios creados en auth.users
SELECT
  id,
  email,
  email_confirmed_at IS NOT NULL as "email_confirmado",
  created_at
FROM auth.users
WHERE email LIKE '%@amenadiel.com'
ORDER BY email;

-- Ver usuarios en public.users
SELECT
  id,
  email,
  role,
  full_name,
  is_active
FROM public.users
WHERE email LIKE '%@amenadiel.com'
ORDER BY email;

-- ============================================================================
-- CREDENCIALES PARA HACER LOGIN
-- ============================================================================

/*

🎉 ¡Usuarios creados exitosamente!

Ahora puedes hacer login en la aplicación con:

📧 Email: patron@amenadiel.com
🔐 Password: 12345
👤 Rol: Owner (Patrón) - Acceso a todos los dashboards

📧 Email: contador@amenadiel.com
🔐 Password: 12345
👤 Rol: Accountant (Contador) - Solo /accounting

📧 Email: cobrador@amenadiel.com
🔐 Password: 12345
👤 Rol: Collector (Cobrador) - Solo /collector

⚠️ IMPORTANTE: Estos passwords son SOLO para desarrollo.
   En producción, usa contraseñas seguras y únicas.

🚀 Siguiente paso: npm run dev

*/
