# Inicio Rápido - Sistema DLE

Esta es la guía express para poner en marcha el sistema en **15 minutos**.

## Requisitos Previos
- ✅ Node.js 18+ instalado
- ✅ pnpm instalado (`npm install -g pnpm`)
- ✅ Cuenta en Supabase ([supabase.com](https://supabase.com))

---

## 🚀 Pasos Rápidos

### 1. Instalar Dependencias (2 min)
```bash
pnpm install
```

### 2. Crear Proyecto en Supabase (3 min)

1. Ve a https://supabase.com/dashboard
2. Clic en **"New Project"**
3. Completa:
   - **Name**: `SOFTWARE-AMENADIEL-DLE`
   - **Database Password**: [Elige una y guárdala]
   - **Region**: South America (São Paulo)
   - **Plan**: Free
4. Clic en **"Create new project"**
5. ⏳ Espera 2-3 minutos

### 3. Configurar Variables de Entorno (2 min)

1. En Supabase, ve a **Settings** ⚙️ > **API**
2. Copia estos 3 valores:
   - **Project URL**
   - **anon/public key**
   - **service_role key**

3. En la raíz del proyecto, crea `.env.local`:
```bash
# Copia .env.example y reemplaza con tus valores
cp .env.example .env.local
```

4. Abre `.env.local` y pega tus credenciales:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[TU_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[tu_anon_key]
SUPABASE_SERVICE_ROLE_KEY=[tu_service_role_key]
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://[TU_PROJECT_REF].supabase.co/storage/v1
```

### 4. Ejecutar Migraciones SQL (5 min)

En Supabase, ve a **SQL Editor** 📝 y ejecuta (en orden):

**a) Migración 001 - Esquema:**
```sql
-- Copia TODO el contenido de: database/migrations/001_initial_schema.sql
-- Pégalo en SQL Editor y haz clic en "Run"
```

**b) Migración 002 - Funciones:**
```sql
-- Copia TODO el contenido de: database/migrations/002_daysheet_functions.sql
-- Pégalo en SQL Editor y haz clic en "Run"
```

**c) Seed 001 - Usuarios en public.users:**
```sql
-- Copia TODO el contenido de: database/seeds/001_test_users.sql
-- Pégalo en SQL Editor y haz clic en "Run"
```

**d) Seed 002 - Usuarios en auth.users:**
```sql
-- Copia TODO el contenido de: database/seeds/002_create_auth_users.sql
-- Pégalo en SQL Editor y haz clic en "Run"
```

### 5. Configurar Storage (2 min)

1. En Supabase, ve a **Storage** 📦
2. Clic en **"Create a new bucket"**
3. Completa:
   - **Name**: `payment-receipts`
   - **Public bucket**: ✅ Marcar
4. Clic en **"Create bucket"**
5. Ve a **Policies** del bucket
6. Clic en **"New policy"** > **"For full customization"**
7. Crea 2 políticas:

**Política 1 - Permitir subir:**
```sql
Policy name: Allow authenticated users to upload
Target roles: authenticated
Policy command: INSERT
WITH CHECK expression: (bucket_id = 'payment-receipts'::text)
```

**Política 2 - Permitir leer:**
```sql
Policy name: Allow public read access
Target roles: public
Policy command: SELECT
USING expression: (bucket_id = 'payment-receipts'::text)
```

### 6. Verificar Configuración (1 min)

```bash
pnpm verify:supabase
```

Deberías ver:
```
✅ Variables de entorno configuradas
✅ Conexión a Supabase exitosa
✅ 10 tablas detectadas
✅ 3 usuarios encontrados
✅ Bucket 'payment-receipts' existe
🎉 ¡Todo configurado correctamente!
```

### 7. Iniciar Aplicación

```bash
pnpm dev
```

Abre http://localhost:3000

---

## 🔐 Credenciales de Prueba

### Patrón (Owner)
```
Email: patron@amenadiel.com
Password: 12345
Acceso: Todos los dashboards (solo lectura)
```

### Contador (Accountant)
```
Email: contador@amenadiel.com
Password: 12345
Acceso: /accounting
```

### Cobrador (Collector)
```
Email: cobrador@amenadiel.com
Password: 12345
Acceso: /collector
```

---

## ❓ Problemas Comunes

### "Invalid API key"
- Verifica que `.env.local` existe y tiene las keys correctas
- Reinicia el servidor (`Ctrl+C` y `pnpm dev`)

### "relation users does not exist"
- Ejecuta las migraciones SQL en Supabase (Paso 4)

### "Email not confirmed"
- En Supabase > Authentication > Users, confirma los emails manualmente

### "Storage bucket not found"
- Crea el bucket en Supabase > Storage (Paso 5)

---

## 📚 Documentación Completa

Para instrucciones detalladas, consulta:
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Guía completa de configuración de Supabase
- **[GPS_PHOTO_SETUP.md](./GPS_PHOTO_SETUP.md)** - Configuración de GPS y fotos
- **[database/QUICK_SETUP.md](./database/QUICK_SETUP.md)** - Documentación de base de datos

---

## 🎯 Próximos Pasos

Una vez funcionando:

1. **Crear datos de prueba**: Rutas, clientes y préstamos
2. **Implementar RLS**: Seguridad a nivel de fila
3. **Integrar dashboards**: Reemplazar mockdata con datos reales
4. **Desarrollar Motor DLE**: Procesamiento de pagos diarios

---

**¿Listo? ¡Empecemos! 🚀**

Si tienes problemas, revisa [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para instrucciones detalladas.
