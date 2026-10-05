# Guía Completa: Configuración de Supabase para Sistema DLE

## Índice
1. [Crear Proyecto en Supabase](#1-crear-proyecto-en-supabase)
2. [Obtener Credenciales](#2-obtener-credenciales)
3. [Configurar Variables de Entorno](#3-configurar-variables-de-entorno)
4. [Ejecutar Migraciones SQL](#4-ejecutar-migraciones-sql)
5. [Configurar Storage para Fotos](#5-configurar-storage-para-fotos)
6. [Crear Usuarios de Prueba](#6-crear-usuarios-de-prueba)
7. [Verificar Conexión](#7-verificar-conexión)
8. [Solución de Problemas Comunes](#8-solución-de-problemas-comunes)

---

## 1. Crear Proyecto en Supabase

### Paso 1.1: Acceder a Supabase
1. Ve a **https://supabase.com**
2. Haz clic en **"Start your project"** o **"Sign In"** si ya tienes cuenta
3. Inicia sesión con GitHub, Google o Email

### Paso 1.2: Crear Nuevo Proyecto
1. En el dashboard, haz clic en **"New Project"**
2. Selecciona tu organización (o crea una nueva)
3. Completa el formulario:
   ```
   Name:                SOFTWARE-AMENADIEL-DLE
   Database Password:   [Elige una contraseña fuerte y GUÁRDALA]
   Region:              South America (São Paulo) - más cercano a ti
   Pricing Plan:        Free
   ```
4. Haz clic en **"Create new project"**
5. ⏳ **Espera 2-3 minutos** mientras Supabase crea tu base de datos

> **IMPORTANTE**: Guarda la contraseña de la base de datos en un lugar seguro. La necesitarás si quieres conectarte directamente con herramientas como pgAdmin.

---

## 2. Obtener Credenciales

### Paso 2.1: API Keys
1. Una vez que el proyecto esté listo, ve a **Settings** (⚙️ en la barra lateral izquierda)
2. Haz clic en **"API"** en el menú de Settings
3. Encontrarás tres valores importantes:

   **a) Project URL**
   ```
   Ejemplo: https://abcdefghijklmnop.supabase.co
   ```

   **b) API Key - anon (public)**
   ```
   Ejemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   ⚠️ Esta es la clave que usarás en el frontend (es segura, tiene restricciones RLS)

   **c) API Key - service_role (secret)**
   ```
   Ejemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   ⚠️ **NUNCA expongas esta clave en el frontend**. Solo úsala en el servidor.

4. **Copia estos valores** - los necesitarás en el siguiente paso

### Paso 2.2: Storage URL
El Storage URL sigue este patrón:
```
https://[PROJECT_REF].supabase.co/storage/v1
```

Donde `[PROJECT_REF]` es el ID de tu proyecto (las letras/números antes de `.supabase.co` en tu Project URL)

**Ejemplo**:
- Project URL: `https://xyzabc123.supabase.co`
- Storage URL: `https://xyzabc123.supabase.co/storage/v1`

---

## 3. Configurar Variables de Entorno

### Paso 3.1: Crear archivo .env.local
1. En la raíz del proyecto, crea un archivo llamado **`.env.local`**
2. Copia y pega lo siguiente, **reemplazando con tus valores reales**:

```bash
# ==========================================
# SUPABASE CONFIGURATION
# ==========================================

# 🔗 Project URL (de Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co

# 🔑 Anon Key (de Settings > API - anon/public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

# 🔐 Service Role Key (de Settings > API - service_role/secret)
# ⚠️ NUNCA compartas esta clave ni la subas a git
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# 📦 Storage URL (construida a partir de Project URL)
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://TU_PROJECT_REF.supabase.co/storage/v1
```

3. **Guarda el archivo** y ciérralo

### Paso 3.2: Verificar .gitignore
1. Abre el archivo **`.gitignore`** en la raíz del proyecto
2. Verifica que contenga estas líneas:
   ```
   .env.local
   .env*.local
   ```
3. Si no están, agrégalas para evitar subir tus credenciales a git

---

## 4. Ejecutar Migraciones SQL

Ahora vamos a crear las tablas, funciones y datos de prueba en tu base de datos.

### Paso 4.1: Abrir SQL Editor
1. En Supabase, haz clic en **"SQL Editor"** (icono 📝 en la barra lateral)
2. Haz clic en **"New query"** para crear una nueva consulta

### Paso 4.2: Ejecutar Migración 001 (Esquema Principal)
1. En tu editor de código (VS Code), abre el archivo:
   ```
   database/migrations/001_initial_schema.sql
   ```
2. **Copia TODO el contenido del archivo** (Ctrl+A, Ctrl+C)
3. **Vuelve a Supabase** → SQL Editor
4. **Pega el código** en el editor (Ctrl+V)
5. Haz clic en **"Run"** (botón verde abajo a la derecha) o presiona **Ctrl+Enter**
6. ⏳ Espera unos segundos...
7. ✅ Deberías ver: **"Success. No rows returned"**

**¿Qué hace esta migración?**
- ✅ Habilita extensiones PostGIS (geolocalización) y uuid-ossp
- ✅ Crea 7 ENUMs (user_role, loan_status, etc.)
- ✅ Crea 10 tablas:
  - `users` - Usuarios del sistema
  - `routes` - Rutas de cobro
  - `clients` - Clientes de microcrédito
  - `loans` - Préstamos
  - `installments` - Plan de cuotas
  - `daysheets` - Jornada del cobrador
  - `closings` - Cierre diario
  - `collection_events` - Eventos de pago
  - `expense_events` - Gastos del cobrador
  - `ledger_transactions` - Libro mayor contable
- ✅ Crea triggers para actualizar `updated_at` automáticamente
- ✅ Crea índices optimizados

### Paso 4.3: Ejecutar Migración 002 (Funciones SQL)
1. En VS Code, abre:
   ```
   database/migrations/002_daysheet_functions.sql
   ```
2. **Copia TODO el contenido**
3. En Supabase → SQL Editor, haz clic en **"New query"**
4. **Pega el código**
5. Haz clic en **"Run"**
6. ✅ Deberías ver: **"Success. No rows returned"**

**¿Qué hace esta migración?**
- ✅ Crea función `update_daysheet_expected_cash()` - Actualiza totales cuando se registra un cobro
- ✅ Crea función `recalculate_daysheet_totals()` - Recalcula totales de una jornada

### Paso 4.4: Verificar que las tablas se crearon
1. En Supabase, haz clic en **"Table Editor"** (icono 📊 en la barra lateral)
2. Deberías ver las 10 tablas creadas:
   - ✅ users
   - ✅ routes
   - ✅ clients
   - ✅ loans
   - ✅ installments
   - ✅ daysheets
   - ✅ closings
   - ✅ collection_events
   - ✅ expense_events
   - ✅ ledger_transactions

3. Haz clic en cualquier tabla (ej: `users`) para ver su estructura

---

## 5. Configurar Storage para Fotos

Los cobradores suben fotos de los recibos. Necesitamos crear un **bucket** (contenedor) para almacenarlas.

### Paso 5.1: Crear Bucket
1. En Supabase, haz clic en **"Storage"** (icono 📦 en la barra lateral)
2. Haz clic en **"Create a new bucket"**
3. Completa el formulario:
   ```
   Name:           payment-receipts
   Public bucket:  ✅ MARCAR (las fotos serán públicas)
   ```
4. Haz clic en **"Create bucket"**

### Paso 5.2: Configurar Políticas de Storage (Security)

**OPCIÓN A: Permitir todo (para desarrollo rápido)**

1. Haz clic en el bucket **"payment-receipts"**
2. Ve a la pestaña **"Policies"**
3. Haz clic en **"New policy"**
4. Selecciona **"For full customization"**
5. Política 1 - **Permitir subir fotos**:
   ```sql
   Policy name:     Allow authenticated users to upload
   Target roles:    authenticated
   Policy command:  INSERT
   Policy definition:

   (bucket_id = 'payment-receipts'::text)
   ```
   Haz clic en **"Review"** → **"Save policy"**

6. Política 2 - **Permitir leer fotos** (para ver previews):
   ```sql
   Policy name:     Allow public read access
   Target roles:    public
   Policy command:  SELECT
   Policy definition:

   (bucket_id = 'payment-receipts'::text)
   ```
   Haz clic en **"Review"** → **"Save policy"**

**OPCIÓN B: Política restrictiva (para producción)**

1. En lugar de la política anterior, usa esta (más segura):
   ```sql
   Policy name:     Allow collectors to upload
   Target roles:    authenticated
   Policy command:  INSERT
   Policy definition:

   (bucket_id = 'payment-receipts'::text AND
    auth.uid() IN (SELECT id FROM users WHERE role = 'collector'))
   ```

> **Recomendación**: Usa OPCIÓN A para desarrollo/aprendizaje. Cuando domines Supabase, cambia a OPCIÓN B.

---

## 6. Crear Usuarios de Prueba

Necesitamos crear 3 usuarios para probar los 3 roles: Patrón, Contador y Cobrador.

### Paso 6.1: Ejecutar Seeds (Datos de Prueba)
1. En VS Code, abre:
   ```
   database/seeds/001_test_users.sql
   ```
2. **Lee el archivo** - verás que crea 3 usuarios:
   - `patron@amenadiel.com` (owner)
   - `contador@amenadiel.com` (accountant)
   - `cobrador@amenadiel.com` (collector)

   **Todos con password**: `12345` (solo para desarrollo)

3. **Copia TODO el contenido**
4. En Supabase → SQL Editor, haz clic en **"New query"**
5. **Pega el código**
6. Haz clic en **"Run"**
7. ✅ Deberías ver: **"Success. No rows returned"**

### Paso 6.2: Verificar Usuarios en Authentication

⚠️ **IMPORTANTE**: Los usuarios que acabas de crear están en la tabla `public.users`, pero Supabase también tiene un sistema de autenticación (`auth.users`). Necesitamos crear los usuarios en **ambos lugares**.

**Método Manual (Recomendado para aprender)**:

1. En Supabase, ve a **"Authentication"** (icono 👤 en la barra lateral)
2. Haz clic en **"Add user"** → **"Create new user"**
3. Completa para cada usuario:

   **Usuario 1: Patrón**
   ```
   Email:                patron@amenadiel.com
   Password:             12345
   Auto Confirm User:    ✅ MARCAR
   ```
   Haz clic en **"Create user"**

   **Copia el UUID** que se genera (ejemplo: `550e8400-e29b-41d4-a716-446655440001`)

   **Usuario 2: Contador**
   ```
   Email:                contador@amenadiel.com
   Password:             12345
   Auto Confirm User:    ✅ MARCAR
   ```
   Copia el UUID

   **Usuario 3: Cobrador**
   ```
   Email:                cobrador@amenadiel.com
   Password:             12345
   Auto Confirm User:    ✅ MARCAR
   ```
   Copia el UUID

### Paso 6.3: Actualizar IDs en public.users

Ahora necesitamos que los UUIDs de `auth.users` coincidan con los de `public.users`.

1. Ve a **SQL Editor** → **"New query"**
2. Ejecuta este query para ver los UUIDs de auth:
   ```sql
   SELECT id, email FROM auth.users ORDER BY email;
   ```
3. Copia los 3 UUIDs

4. Ejecuta este query para actualizar `public.users` (reemplaza los UUIDs con los reales):
   ```sql
   -- Actualizar UUID del patrón
   UPDATE public.users
   SET id = 'UUID_DEL_PATRON_AQUI'
   WHERE email = 'patron@amenadiel.com';

   -- Actualizar UUID del contador
   UPDATE public.users
   SET id = 'UUID_DEL_CONTADOR_AQUI'
   WHERE email = 'contador@amenadiel.com';

   -- Actualizar UUID del cobrador
   UPDATE public.users
   SET id = 'UUID_DEL_COBRADOR_AQUI'
   WHERE email = 'cobrador@amenadiel.com';
   ```

5. Verifica que se actualizaron:
   ```sql
   SELECT id, email, role, full_name FROM public.users;
   ```

   Deberías ver los 3 usuarios con sus UUIDs correctos.

---

## 7. Verificar Conexión

### Paso 7.1: Ejecutar script de verificación

Voy a crear un script que verificará que todo esté configurado correctamente.

1. En tu terminal, ejecuta:
   ```bash
   node scripts/verify-supabase.js
   ```

2. Deberías ver algo como:
   ```
   ✅ Conexión a Supabase exitosa
   ✅ Variables de entorno configuradas
   ✅ 10 tablas detectadas
   ✅ 3 usuarios encontrados
   ✅ Bucket 'payment-receipts' existe

   🎉 Todo configurado correctamente!
   ```

### Paso 7.2: Probar login en la aplicación

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre **http://localhost:3000**

3. Intenta hacer login con:
   ```
   Email:    cobrador@amenadiel.com
   Password: 12345
   ```

4. Si todo está bien, deberías ser redirigido a **`/collector`** (dashboard del cobrador)

5. Prueba logout y login con los otros usuarios:
   - `contador@amenadiel.com` → `/accounting`
   - `patron@amenadiel.com` → `/owner`

---

## 8. Solución de Problemas Comunes

### Problema 1: "Invalid API key"
**Causa**: Las variables de entorno están mal configuradas.

**Solución**:
1. Verifica que `.env.local` existe en la raíz del proyecto
2. Verifica que las keys no tengan espacios al inicio/final
3. Reinicia el servidor de desarrollo (`Ctrl+C` y `npm run dev`)

### Problema 2: "Failed to fetch" o "Network error"
**Causa**: URL de Supabase incorrecta.

**Solución**:
1. Ve a Supabase → Settings → API
2. Copia EXACTAMENTE el "Project URL"
3. Actualiza `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`
4. Reinicia el servidor

### Problema 3: "relation users does not exist"
**Causa**: Las migraciones no se ejecutaron correctamente.

**Solución**:
1. Ve a Supabase → SQL Editor
2. Ejecuta:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```
3. Si no ves las 10 tablas, vuelve a ejecutar la migración 001

### Problema 4: "Email not confirmed"
**Causa**: El usuario no se creó con "Auto Confirm".

**Solución**:
1. Ve a Authentication → Users
2. Haz clic en el usuario
3. En "Email Confirmed At", haz clic en "Send magic link" o marca el email como confirmado manualmente

### Problema 5: "Storage bucket not found"
**Causa**: El bucket no se creó o tiene nombre diferente.

**Solución**:
1. Ve a Storage
2. Verifica que existe un bucket llamado **`payment-receipts`**
3. Si tiene otro nombre, actualiza el código en `lib/supabase/storage.ts` (línea 15)

### Problema 6: "Row Level Security policy violation"
**Causa**: Falta configurar políticas de Storage o RLS en tablas.

**Solución**:
1. Si es en Storage, vuelve al Paso 5.2
2. Si es en tablas, por ahora podemos deshabilitar RLS (solo para desarrollo):
   ```sql
   -- ⚠️ Solo para desarrollo, NUNCA en producción
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
   ALTER TABLE collection_events DISABLE ROW LEVEL SECURITY;
   ALTER TABLE daysheets DISABLE ROW LEVEL SECURITY;
   ```

---

## Resumen de Credenciales

Para referencia rápida, guarda esto:

```
🌐 Supabase Dashboard:  https://supabase.com/dashboard/project/[TU_PROJECT_ID]
📧 Usuarios de prueba:
   - patron@amenadiel.com     / 12345  (Owner)
   - contador@amenadiel.com   / 12345  (Accountant)
   - cobrador@amenadiel.com   / 12345  (Collector)

📦 Storage Bucket:      payment-receipts (público)
🔐 Database Password:   [La que elegiste al crear el proyecto]
```

---

## Próximos Pasos

Una vez que todo esté funcionando:

1. ✅ **Crear datos de prueba** (rutas, clientes, préstamos)
2. ✅ **Implementar Row Level Security (RLS)** - para seguridad real
3. ✅ **Integrar dashboards con datos reales** - reemplazar mockdata
4. ✅ **Implementar Motor DLE** - procesar pagos y actualizar saldos

---

## Ayuda Adicional

Si tienes problemas:
1. Revisa la sección de **Solución de Problemas** arriba
2. Verifica los logs de Supabase: Dashboard → Logs
3. Verifica la consola del navegador (F12) para ver errores
4. Consulta la documentación oficial: https://supabase.com/docs

---

**¡Listo! Cuando termines estos pasos, tendrás Supabase completamente configurado. Avísame cómo te va y te ayudo con lo que necesites.** 🚀