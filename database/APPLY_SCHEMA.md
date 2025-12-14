# 🚀 Cómo Aplicar el Esquema en Supabase

## Prerequisitos

1. ✅ Cuenta en Supabase (https://supabase.com)
2. ✅ Proyecto creado en Supabase
3. ✅ Extensión PostGIS habilitada (o modificar el esquema para no usarla)

---

## Método 1: Supabase Dashboard (Recomendado para inicio)

### Paso 1: Acceder al SQL Editor

1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. En el menú lateral, hacer clic en **SQL Editor**

### Paso 2: Verificar Extensiones

Ejecutar primero esta query para verificar si PostGIS está disponible:

```sql
SELECT * FROM pg_available_extensions WHERE name = 'postgis';
```

**Si PostGIS NO está disponible:**
- Abrir `database/migrations/001_initial_schema.sql`
- Comentar la línea: `CREATE EXTENSION IF NOT EXISTS "postgis";`
- Cambiar todos los tipos `GEOGRAPHY` por `TEXT`
- **Alternativa:** Usar el plan Pro de Supabase que incluye PostGIS

### Paso 3: Ejecutar el Esquema

1. Abrir el archivo `database/migrations/001_initial_schema.sql`
2. Copiar TODO el contenido
3. Pegarlo en el SQL Editor de Supabase
4. Click en **Run** (o `Ctrl+Enter`)

**Tiempo estimado:** 5-10 segundos

### Paso 4: Verificar la Creación

Ejecutar esta query para verificar que las tablas se crearon:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Deberías ver 10 tablas:**
- users
- routes
- clients
- loans
- installments
- daysheets
- collection_events
- expense_events
- ledger_transactions
- closings

---

## Método 2: Supabase CLI (Para desarrollo local)

### Paso 1: Instalar Supabase CLI

```bash
npm install -g supabase
```

### Paso 2: Login

```bash
supabase login
```

### Paso 3: Link al Proyecto

```bash
supabase link --project-ref TU_PROJECT_REF
```

**Obtener PROJECT_REF:**
- Dashboard de Supabase → Settings → General → Reference ID

### Paso 4: Inicializar Migraciones

```bash
supabase init
```

### Paso 5: Crear y Aplicar Migración

```bash
# Copiar el archivo SQL a la carpeta de migraciones de Supabase
cp database/migrations/001_initial_schema.sql supabase/migrations/

# Aplicar migración
supabase db push
```

---

## Método 3: Desde el Código (Programático)

**IMPORTANTE:** Solo usar después de haber aplicado el esquema manualmente primero.

```typescript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // USAR SERVICE ROLE, no anon key
);

const sql = fs.readFileSync('database/migrations/001_initial_schema.sql', 'utf-8');

const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

if (error) {
  console.error('Error al aplicar esquema:', error);
} else {
  console.log('Esquema aplicado exitosamente');
}
```

---

## Configuración Post-Migración

### 1. Crear Usuario de Prueba

```sql
INSERT INTO users (email, role, full_name, phone, is_active)
VALUES
  ('owner@amenadiel.com', 'owner', 'Juan Patrón', '+1234567890', true),
  ('contador@amenadiel.com', 'accountant', 'María Contadora', '+1234567891', true),
  ('cobrador1@amenadiel.com', 'collector', 'Carlos Cobrador', '+1234567892', true);
```

### 2. Habilitar Row Level Security (RLS)

**CRÍTICO para seguridad en producción:**

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daysheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE closings ENABLE ROW LEVEL SECURITY;

-- Política de ejemplo: Cobradores solo ven sus propios daysheets
CREATE POLICY "Collectors see own daysheets"
ON daysheets
FOR SELECT
USING (
  collector_id = auth.uid()
  AND auth.jwt()->>'role' = 'collector'
);

-- TODO: Implementar políticas completas para cada rol
```

### 3. Generar Tipos TypeScript Automáticamente

```bash
# Instalar CLI
npm install -g supabase

# Generar tipos
supabase gen types typescript --linked > lib/types/supabase.types.ts
```

**NOTA:** Ya creamos tipos manualmente en `lib/types/database.types.ts`. Los tipos generados automáticamente son una alternativa.

---

## Verificación de Integridad

### Query 1: Verificar ENUMs

```sql
SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%status' OR t.typname LIKE '%type' OR t.typname = 'user_role'
ORDER BY t.typname, e.enumsortorder;
```

### Query 2: Verificar Índices

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Query 3: Verificar Foreign Keys

```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

---

## Rollback (Deshacer Migración)

**⚠️ CUIDADO: Esto borrará TODAS las tablas y datos**

```sql
-- Borrar todas las tablas en orden inverso (respetando foreign keys)
DROP TABLE IF EXISTS ledger_transactions CASCADE;
DROP TABLE IF EXISTS closings CASCADE;
DROP TABLE IF EXISTS expense_events CASCADE;
DROP TABLE IF EXISTS collection_events CASCADE;
DROP TABLE IF EXISTS daysheets CASCADE;
DROP TABLE IF EXISTS installments CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Borrar ENUMs
DROP TYPE IF EXISTS closing_status CASCADE;
DROP TYPE IF EXISTS ledger_entry_type CASCADE;
DROP TYPE IF EXISTS expense_type CASCADE;
DROP TYPE IF EXISTS collection_event_type CASCADE;
DROP TYPE IF EXISTS daysheet_status CASCADE;
DROP TYPE IF EXISTS loan_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Borrar funciones
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

---

## Troubleshooting

### Error: "extension postgis does not exist"

**Solución 1:** Upgrade a plan Pro de Supabase

**Solución 2:** Modificar esquema para no usar PostGIS:

1. Comentar: `CREATE EXTENSION IF NOT EXISTS "postgis";`
2. Reemplazar en todas las tablas:
   ```sql
   -- DE:
   location GEOGRAPHY(POINT, 4326)

   -- A:
   location_lat NUMERIC(10, 8),
   location_lon NUMERIC(11, 8)
   ```

### Error: "permission denied to create extension"

**Causa:** Tu rol de PostgreSQL no tiene permisos.

**Solución:** Contactar a soporte de Supabase o usar el dashboard para habilitar extensiones.

### Error: "relation already exists"

**Causa:** Ya ejecutaste el esquema previamente.

**Solución:**
1. Hacer rollback (ver sección anterior)
2. O modificar el script para usar `CREATE TABLE IF NOT EXISTS`

---

## Siguientes Pasos

Después de aplicar el esquema:

1. ✅ Configurar variables de entorno en `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   ```

2. ✅ Crear seeds de datos de prueba (opcional):
   ```bash
   # Ver database/seeds/001_test_data.sql (próximo archivo)
   ```

3. ✅ Implementar Server Actions para el Motor DLE

4. ✅ Configurar autenticación de usuarios con Supabase Auth

---

**¿Problemas?** Revisa la documentación de Supabase: https://supabase.com/docs
