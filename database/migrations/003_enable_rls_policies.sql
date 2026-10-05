-- 003_enable_rls_policies.sql
-- Objetivo: Habilitar Row Level Security (RLS) y crear políticas básicas seguras
-- AVISO: Ejecutar primero en staging o con backup. Las políticas están diseñadas como punto de partida;
-- adáptalas a tu modelo de datos exacto (nombres de columnas y requerimientos de negocio).

-- 1) spatial_ref_sys: normalmente no debe exponerse vía API pública
-- Recomendación: revocar permisos públicos y NO exponer por PostgREST. No habilitamos RLS para esta tabla.
REVOKE ALL ON public.spatial_ref_sys FROM public;

-- 2) Users: cada usuario solo puede ver y modificar su propio registro
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own row" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own row" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Si permite inserción desde cliente (signup), asegurarse que uid coincide con id
CREATE POLICY "Users can insert own row" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3) collection_events: solo collectors y owners pueden insertar; collectors ven solo sus eventos; owners ven todo
ALTER TABLE public.collection_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collectors can insert events" ON public.collection_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND (u.role = 'collector' OR u.role = 'owner')
    )
  );

CREATE POLICY "Collectors can select own events" ON public.collection_events
  FOR SELECT USING (collector_id = auth.uid());

CREATE POLICY "Accountant or Owner can select all events" ON public.collection_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (u.role = 'owner' OR u.role = 'accountant')
    )
  );

-- 4) daysheets: collectors crean y ven sus daysheets; owner puede ver todo
ALTER TABLE public.daysheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collectors can insert daysheet" ON public.daysheets
  FOR INSERT WITH CHECK (collector_id = auth.uid());

CREATE POLICY "Collector can select own daysheet" ON public.daysheets
  FOR SELECT USING (collector_id = auth.uid());

CREATE POLICY "Owner can select all daysheets" ON public.daysheets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'owner'
    )
  );

-- 5) loans: accountant & owner pueden ver; collector puede ver solo loans asignados
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accountant and Owner can select loans" ON public.loans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (u.role = 'accountant' OR u.role = 'owner')
    )
  );

-- Ajusta 'assigned_collector_id' al nombre real de la columna de tu esquema si difiere
CREATE POLICY "Collector can select assigned loans" ON public.loans
  FOR SELECT USING (assigned_collector_id = auth.uid());

-- 6) clients: accountant & owner pueden ver, collectors pueden ver clientes asignados si existe la columna
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accountant and Owner can select clients" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (u.role = 'accountant' OR u.role = 'owner')
    )
  );

-- Si hay column 'assigned_collector_id' usa la política siguiente (opcional)
CREATE POLICY "Collector can select assigned clients" ON public.clients
  FOR SELECT USING (assigned_collector_id = auth.uid());

-- 7) installments, closings, expense_events, ledger_transactions: aprobar acceso por roles
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accountant and Owner can select installments" ON public.installments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (u.role = 'accountant' OR u.role = 'owner'))
  );

ALTER TABLE public.closings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accountant and Owner can select closings" ON public.closings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (u.role = 'accountant' OR u.role = 'owner'))
  );

ALTER TABLE public.expense_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Expense create by accountant or owner" ON public.expense_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (u.role = 'accountant' OR u.role = 'owner'))
  );
CREATE POLICY "Expense select by accountant or owner" ON public.expense_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (u.role = 'accountant' OR u.role = 'owner'))
  );

ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ledger select by accountant or owner" ON public.ledger_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (u.role = 'accountant' OR u.role = 'owner'))
  );

-- 8) routes: si contiene datos sensibles de cobradores, aplicar restricciones similares
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select all routes" ON public.routes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'owner')
  );

CREATE POLICY "Collector can select own routes" ON public.routes
  FOR SELECT USING (collector_id = auth.uid());

-- Pruebas y verificación (ejemplos):
-- 1) Ejecutar el archivo en staging (SQL Editor o psql con service_role):
--    psql "postgresql://<SERVICE_ROLE>:@host:5432/dbname" -f database/migrations/003_enable_rls_policies.sql
-- 2) Crear usuarios de prueba con roles 'collector', 'owner', 'accountant' (usando service_role key o seeds).
-- 3) Hacer peticiones HTTP a PostgREST/Supabase REST API con el JWT de cada usuario y comprobar que las políticas funcionan.

-- Rollback (si necesitas revertir):
-- Nota: revertir implica DESHABILITAR RLS y/o eliminar políticas. Hazlo con cuidado.
-- Ejemplo para users:
-- DROP POLICY "Users can select own row" ON public.users;
-- DROP POLICY "Users can update own row" ON public.users;
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- FIN del script.
