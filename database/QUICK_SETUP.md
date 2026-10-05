# 🚀 Setup Rápido - Supabase Configurado

## Estado Actual
✅ Variables de entorno configuradas en `.env.local`
✅ Proyecto Supabase: https://zzgcuxrfiqmzckiujhcf.supabase.co

---

## Paso 1: Aplicar Esquema SQL

1. Ir a: https://supabase.com/dashboard/project/zzgcuxrfiqmzckiujhcf/sql

2. Click en **"New Query"**

3. Copiar y pegar el contenido completo de:
   `database/migrations/001_initial_schema.sql`

4. Click en **"Run"** (Ctrl+Enter)

5. Esperar ~10 segundos. Deberías ver: **"Success. No rows returned"**

---

## Paso 2: Crear Usuarios de Prueba

**Opción A: Desde el Dashboard (MÁS FÁCIL)**

1. Ir a: https://supabase.com/dashboard/project/zzgcuxrfiqmzckiujhcf/auth/users

2. Click en **"Add User"** → **"Create new user"**

3. Crear 3 usuarios:

   **Usuario 1: Patrón**
   - Email: `patron@amenadiel.com`
   - Password: `12345`
   - ✅ Auto Confirm User (marcar checkbox)
   - Click "Create User"

   **Usuario 2: Contador**
   - Email: `contador@amenadiel.com`
   - Password: `12345`
   - ✅ Auto Confirm User
   - Click "Create User"

   **Usuario 3: Cobrador**
   - Email: `cobrador@amenadiel.com`
   - Password: `12345`
   - ✅ Auto Confirm User
   - Click "Create User"

---

## Paso 3: Vincular Usuarios con Tabla Public

Después de crear los 3 usuarios, ejecutar este SQL:

1. Volver a: https://supabase.com/dashboard/project/zzgcuxrfiqmzckiujhcf/sql

2. Ejecutar:

```sql
-- Vincular usuarios de Auth con la tabla public.users
INSERT INTO public.users (id, email, role, full_name, is_active)
SELECT
    id,
    email,
    CASE
        WHEN email = 'patron@amenadiel.com' THEN 'owner'::user_role
        WHEN email = 'contador@amenadiel.com' THEN 'accountant'::user_role
        WHEN email = 'cobrador@amenadiel.com' THEN 'collector'::user_role
    END as role,
    CASE
        WHEN email = 'patron@amenadiel.com' THEN 'Juan Patrón'
        WHEN email = 'contador@amenadiel.com' THEN 'María Contadora'
        WHEN email = 'cobrador@amenadiel.com' THEN 'Carlos Cobrador'
    END as full_name,
    true as is_active
FROM auth.users
WHERE email IN ('patron@amenadiel.com', 'contador@amenadiel.com', 'cobrador@amenadiel.com')
ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role,
        full_name = EXCLUDED.full_name;
```

---

## Paso 4: Verificar que Todo Funciona

1. Iniciar servidor local:
   ```bash
   pnpm dev
   ```

2. Abrir: http://localhost:3000

3. Probar login con:
   - `patron@amenadiel.com` / `12345`
   - `contador@amenadiel.com` / `12345`
   - `cobrador@amenadiel.com` / `12345`

---

## ⚠️ IMPORTANTE: Rotar Credenciales AHORA

**POR QUÉ:** Las claves que compartiste están comprometidas (fueron enviadas en texto plano).

**CÓMO ROTAR:**

1. Ir a: https://supabase.com/dashboard/project/zzgcuxrfiqmzckiujhcf/settings/api

2. En la sección **"Project API keys"**:
   - Click en los 3 puntos (...) junto a "anon public"
   - Click en **"Reveal"** para ver la clave actual
   - Click en **"Roll API keys"** (icono de refresh)
   - Confirmar rotación

3. Copiar las NUEVAS claves generadas

4. Actualizar `.env.local` con las nuevas claves

5. Reiniciar el servidor (`pnpm dev`)

**NUNCA COMPARTAS:**
- `SUPABASE_SERVICE_ROLE_KEY` (acceso total a DB)
- Las claves en texto plano
- El archivo `.env.local` en Git (ya está en .gitignore)

---

## ✅ Checklist Final

- [ ] Esquema SQL aplicado
- [ ] 3 usuarios creados en Supabase Auth
- [ ] Usuarios vinculados a tabla public.users
- [ ] Login funciona con los 3 usuarios
- [ ] Claves rotadas en Supabase
- [ ] `.env.local` actualizado con nuevas claves
- [ ] Servidor reiniciado

---

**¡Listo! Tu sistema DLE está configurado y seguro.** 🎉
