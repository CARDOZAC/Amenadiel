# 🚀 Guía de Setup - Sistema DLE

## Resumen de lo que tienes

✅ **Proyecto Next.js 14** configurado con TypeScript y Tailwind CSS
✅ **Esquema de base de datos** completo en `database/migrations/001_initial_schema.sql`
✅ **Sistema de autenticación** con control de acceso por roles (RBAC)
✅ **Estructura de rutas** separada por rol (Cobrador, Contador, Patrón)
✅ **Medidas de seguridad** contra ataques de supply chain

---

## 📋 Checklist de Setup (5 pasos)

### **Paso 1: Crear Proyecto en Supabase**

1. Ir a https://supabase.com
2. Crear cuenta o hacer login
3. Click en **"New Project"**
4. Llenar el formulario:
   - **Name:** Amenadiel DLE
   - **Database Password:** (Guardar bien este password)
   - **Region:** Elegir la más cercana
   - **Pricing Plan:** Free (suficiente para desarrollo)
5. Click en **"Create new project"**
6. Esperar 2-3 minutos mientras se crea el proyecto

---

### **Paso 2: Aplicar el Esquema de Base de Datos**

1. En tu proyecto de Supabase, ir a **SQL Editor** (menú lateral izquierdo)
2. Click en **"New Query"**
3. Abrir el archivo `database/migrations/001_initial_schema.sql` de este proyecto
4. Copiar TODO el contenido
5. Pegarlo en el SQL Editor de Supabase
6. Click en **"Run"** (o Ctrl+Enter)
7. Esperar ~5 segundos
8. Deberías ver: **"Success. No rows returned"**

---

### **Paso 3: Crear Usuarios de Prueba**

**Opción A: Dashboard de Supabase (Recomendada)**

1. Ir a **Authentication → Users** (menú lateral)
2. Click en **"Add User"** → **"Create new user"**
3. Crear 3 usuarios con estos datos:

   **Usuario Patrón:**
   - Email: `patron@amenadiel.com`
   - Password: `12345`
   - Auto confirm user: ✅ (marcar checkbox)

   **Usuario Contador:**
   - Email: `contador@amenadiel.com`
   - Password: `12345`
   - Auto confirm user: ✅

   **Usuario Cobrador:**
   - Email: `cobrador@amenadiel.com`
   - Password: `12345`
   - Auto confirm user: ✅

4. Volver a **SQL Editor** y ejecutar este script:

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

### **Paso 4: Configurar Variables de Entorno**

1. En Supabase, ir a **Settings** → **API** (menú lateral)
2. Copiar estos valores:
   - **Project URL** (ej: `https://xxxxxxxxx.supabase.co`)
   - **anon public key** (clave larga que empieza con `eyJh...`)

3. En tu proyecto (carpeta `SOFTWARE AMENADIEL`), editar el archivo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...tu-clave-aqui
```

**⚠️ IMPORTANTE:**
- Reemplazar `xxxxxxxxx` con tu Project URL real
- Reemplazar `eyJhbGciOi...` con tu anon key real
- NO compartir este archivo (ya está en .gitignore)

---

### **Paso 5: Iniciar el Servidor y Probar**

1. Abrir terminal en la carpeta del proyecto
2. Instalar dependencias (si no lo hiciste):
   ```bash
   pnpm install
   ```

3. Iniciar servidor de desarrollo:
   ```bash
   pnpm dev
   ```

4. Abrir navegador en http://localhost:3000
5. Deberías ver la página de login
6. Probar los 3 usuarios:

   **Login como Patrón:**
   - Email: `patron@amenadiel.com`
   - Password: `12345`
   - Deberías ser redirigido a `/owner` (Dashboard del Patrón)

   **Login como Contador:**
   - Cerrar sesión
   - Email: `contador@amenadiel.com`
   - Password: `12345`
   - Deberías ser redirigido a `/accounting` (Panel del Contador)

   **Login como Cobrador:**
   - Cerrar sesión
   - Email: `cobrador@amenadiel.com`
   - Password: `12345`
   - Deberías ser redirigido a `/collector` (Captura de Pagos)

---

## ✅ Verificación de que Todo Funciona

### **Test 1: Login y Redirección**
- ✅ Puedes hacer login con cada usuario
- ✅ Cada usuario es redirigido a su módulo correcto
- ✅ El botón "Cerrar Sesión" funciona

### **Test 2: Control de Acceso (RBAC)**
- ✅ Si un Cobrador intenta acceder a `/accounting`, es redirigido a `/collector`
- ✅ Si un Contador intenta acceder a `/collector`, es redirigido a `/accounting`
- ✅ El Patrón puede acceder a TODOS los módulos

### **Test 3: Sesión Persistente**
- ✅ Si refrescas la página, sigues logueado
- ✅ Si cierras el navegador y lo abres, sigues logueado (hasta 7 días)

---

## 🔍 Troubleshooting

### Error: "Invalid login credentials"

**Causa:** Las credenciales son incorrectas o el usuario no existe en Supabase Auth.

**Solución:**
1. Ir a Supabase Dashboard → Authentication → Users
2. Verificar que los 3 usuarios existen
3. Verificar que los emails sean exactamente: `patron@amenadiel.com`, etc.
4. Si no existen, crearlos según el Paso 3

---

### Error: "Error al obtener información del usuario"

**Causa:** El usuario existe en `auth.users` pero NO en `public.users`.

**Solución:**
1. Ir a SQL Editor en Supabase
2. Ejecutar el script del Paso 3 (el INSERT INTO public.users...)
3. Verificar con:
   ```sql
   SELECT id, email, role, full_name FROM public.users;
   ```

---

### Error: "Supabase client error" o variables undefined

**Causa:** El archivo `.env.local` no está configurado correctamente.

**Solución:**
1. Verificar que `.env.local` existe en la raíz del proyecto
2. Verificar que tiene las 2 variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. Verificar que NO hay espacios extras
4. Reiniciar el servidor de desarrollo (Ctrl+C y luego `pnpm dev`)

---

### La página no carga o error 500

**Causa:** El esquema de base de datos no se aplicó correctamente.

**Solución:**
1. Ir a Supabase → SQL Editor
2. Ejecutar esta query para verificar las tablas:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
3. Deberías ver 10 tablas: users, routes, clients, loans, etc.
4. Si no, volver a ejecutar `001_initial_schema.sql`

---

## 🎯 Próximos Pasos

Ahora que tienes el sistema de autenticación funcionando, puedes:

1. **Implementar el Motor DLE** (cálculos de amortización diaria)
2. **Crear formularios de captura** para el Cobrador
3. **Implementar el botón de Cierre Diario** para el Contador
4. **Crear dashboards de KPIs** para el Patrón
5. **Implementar Row Level Security (RLS)** en Supabase

---

## 📞 Soporte

Si algo no funciona:
1. Verificar la consola del navegador (F12) para errores
2. Verificar la terminal donde corre `pnpm dev` para errores del servidor
3. Revisar los logs de Supabase (Dashboard → Logs)
4. Consultar `database/APPLY_SCHEMA.md` para instrucciones detalladas

---

**¡Listo! El Sistema DLE está configurado y funcionando.** 🎉
