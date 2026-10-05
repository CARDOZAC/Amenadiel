-- ============================================================================
-- SISTEMA DLE - ESQUEMA DE BASE DE DATOS
-- Sistema de Gestión de Microcrédito Diario de Alto Rendimiento
-- v1.1 - Optimizado
-- ============================================================================
-- Principio: APPEND-ONLY - El pasado no se edita, se corrige con nuevos movimientos
-- Precisión: NUMERIC(18,6) para cálculos financieros críticos
-- Auditoría: Geolocalización y timestamps en todos los eventos
-- ============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para geolocalización

-- ============================================================================
-- ENUMS (Tipos de datos categóricos)
-- ============================================================================

-- Roles de usuario en el sistema
CREATE TYPE user_role AS ENUM (
    'owner',       -- Patrón/Inversionista (solo lectura de KPIs)
    'accountant',  -- Contador (auditoría y cierre diario)
    'collector'    -- Cobrador (captura de pagos)
);

-- Estados del préstamo
CREATE TYPE loan_status AS ENUM (
    'active',      -- Préstamo activo con pagos pendientes
    'paid_off',    -- Totalmente liquidado
    'defaulted',   -- En mora crítica (>30 días)
    'written_off'  -- Castigo contable (pérdida total)
);

-- Estados de la jornada del cobrador (DaySheet)
CREATE TYPE daysheet_status AS ENUM (
    'draft',       -- Borrador (cobrador aún trabajando)
    'submitted',   -- Enviado para revisión
    'verified',    -- Verificado por contador (efectivo cuadra)
    'closed'       -- Cerrado definitivamente (DLE ejecutado)
);

-- Tipo de evento de pago
CREATE TYPE collection_event_type AS ENUM (
    'full_payment',    -- Pago completo de la cuota diaria
    'partial_payment', -- Pago parcial (menos de la cuota)
    'excess_payment',  -- Pago superior a la cuota
    'interest_only'    -- Solo intereses (no amortiza capital)
);

-- Tipo de gasto del cobrador
CREATE TYPE expense_type AS ENUM (
    'transport',   -- Transporte
    'food',        -- Alimentación
    'communication', -- Comunicación/datos
    'other'        -- Otros gastos operativos
);

-- Tipo de movimiento contable
CREATE TYPE ledger_entry_type AS ENUM (
    'loan_disbursement',  -- Desembolso de préstamo
    'principal_payment',  -- Pago de capital
    'interest_payment',   -- Pago de intereses
    'late_fee',           -- Mora
    'expense',            -- Gasto operativo
    'adjustment'          -- Ajuste contable (corrección)
);

-- Estado del cierre diario
CREATE TYPE closing_status AS ENUM (
    'pending',     -- Pendiente de ejecución
    'processing',  -- DLE en ejecución
    'completed',   -- Completado exitosamente
    'failed'       -- Falló (requiere intervención)
);

-- ============================================================================
-- TABLA: users
-- Usuarios del sistema (Patrón, Contador, Cobradores)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Autenticación (integración con Supabase Auth)
    email TEXT NOT NULL, -- La unicidad se maneja con el índice case-insensitive
    role user_role NOT NULL,

    -- Información personal
    full_name TEXT NOT NULL,
    phone TEXT,

    -- Estado de la cuenta
    is_active BOOLEAN DEFAULT true,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX idx_users_email_case_insensitive ON users (lower(email));
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- ============================================================================
-- TABLA: routes
-- Rutas de cobro asignadas a cobradores
-- ============================================================================
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Información de la ruta
    name TEXT NOT NULL,
    description TEXT,

    -- Asignación
    collector_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Geolocalización (polígono de la zona)
    coverage_area GEOGRAPHY(POLYGON, 4326), -- PostGIS

    -- Estado
    is_active BOOLEAN DEFAULT true,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routes_collector ON routes(collector_id);
CREATE INDEX idx_routes_active ON routes(is_active) WHERE is_active = true;
CREATE INDEX idx_routes_coverage_area ON routes USING GIST(coverage_area);

-- ============================================================================
-- TABLA: clients
-- Clientes del microcrédito
-- ============================================================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Información personal
    full_name TEXT NOT NULL,
    identity_number TEXT UNIQUE, -- Cédula/DNI
    phone TEXT,

    -- Dirección y ubicación
    address TEXT,
    location GEOGRAPHY(POINT, 4326), -- PostGIS - coordenadas GPS

    -- Ruta asignada
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,

    -- Referencias personales (JSON para flexibilidad)
    personal_references JSONB DEFAULT '[]',

    -- Score de riesgo (calculado por el sistema)
    risk_score NUMERIC(5,2) DEFAULT 0.00, -- 0-100

    -- Estado
    is_active BOOLEAN DEFAULT true,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clients_route ON clients(route_id);
CREATE INDEX idx_clients_identity ON clients(identity_number);
CREATE INDEX idx_clients_active ON clients(is_active) WHERE is_active = true;
CREATE INDEX idx_clients_location ON clients USING GIST(location); -- Índice espacial

-- ============================================================================
-- TABLA: loans
-- Préstamos (contrato principal del microcrédito)
-- ============================================================================
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relaciones
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Contador que aprobó
    collector_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Cobrador asignado

    -- Condiciones financieras (INMUTABLES - no se editan después de desembolso)
    principal_amount NUMERIC(18,6) NOT NULL, -- Monto inicial del préstamo
    daily_payment NUMERIC(18,6) NOT NULL,    -- Cuota diaria esperada
    daily_interest_rate NUMERIC(10,8) NOT NULL, -- Tasa de interés diaria (ej. 0.01342400 para 490.99% TEA)
    annual_effective_rate NUMERIC(8,4),      -- TEA (ej. 490.9900 para display)

    -- Saldos actuales (ACTUALIZADOS POR DLE)
    outstanding_principal NUMERIC(18,6) NOT NULL, -- Capital pendiente
    accrued_interest NUMERIC(18,6) DEFAULT 0,     -- Intereses devengados no pagados
    total_paid_principal NUMERIC(18,6) DEFAULT 0, -- Total de capital recuperado
    total_paid_interest NUMERIC(18,6) DEFAULT 0,  -- Total de intereses cobrados

    -- Mora
    days_overdue INTEGER DEFAULT 0,          -- Días de atraso
    late_fees NUMERIC(18,6) DEFAULT 0,       -- Multas por mora

    -- Fechas
    disbursement_date DATE NOT NULL,         -- Fecha de desembolso
    first_payment_date DATE NOT NULL,        -- Fecha del primer pago esperado
    expected_end_date DATE,                  -- Fecha estimada de finalización
    actual_end_date DATE,                    -- Fecha real de liquidación

    -- Estado
    status loan_status DEFAULT 'active',

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: capital pendiente no puede ser negativo
    CONSTRAINT chk_outstanding_principal_positive CHECK (outstanding_principal >= 0)
);

-- Índices críticos para rendimiento del DLE
CREATE INDEX idx_loans_client ON loans(client_id);
CREATE INDEX idx_loans_status ON loans(status) WHERE status = 'active';
CREATE INDEX idx_loans_active_collector ON loans(collector_id) WHERE status = 'active';
CREATE INDEX idx_loans_overdue ON loans(days_overdue DESC) WHERE status = 'active';
CREATE INDEX idx_loans_disbursement_date ON loans(disbursement_date);

-- ============================================================================
-- TABLA: installments (OPCIONAL - Plan de Cuotas Teórico)
-- Generado al crear el préstamo como referencia, pero NO se usa para contabilidad.
-- Su propósito es permitir análisis de "esperado vs. real".
-- ============================================================================
CREATE TABLE installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,

    -- Número de cuota
    installment_number INTEGER NOT NULL,

    -- Fecha esperada
    due_date DATE NOT NULL,

    -- Montos teóricos (generados al inicio, INMUTABLES)
    expected_principal NUMERIC(18,6) NOT NULL,
    expected_interest NUMERIC(18,6) NOT NULL,
    expected_total NUMERIC(18,6) NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_installments_loan ON installments(loan_id, due_date);
CREATE UNIQUE INDEX idx_installments_unique ON installments(loan_id, installment_number);

-- ============================================================================
-- TABLA: daysheets
-- Jornada del cobrador (hoja de ruta diaria)
-- ============================================================================
CREATE TABLE daysheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relaciones
    collector_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,

    -- Fecha de la jornada
    work_date DATE NOT NULL,

    -- Reconciliación de efectivo
    expected_cash NUMERIC(18,6) DEFAULT 0, -- Suma de collection_events del día
    declared_cash NUMERIC(18,6),           -- Efectivo declarado por cobrador al cerrar
    total_expenses NUMERIC(18,6) DEFAULT 0, -- Suma de expense_events del día
    cash_variance NUMERIC(18,6) DEFAULT 0,  -- Diferencia (declarado - esperado)

    -- Estado de la jornada
    status daysheet_status DEFAULT 'draft',

    -- Timestamps de workflow
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Contador que verificó
    closed_at TIMESTAMPTZ,

    -- Notas del cobrador
    notes TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: solo un daysheet por cobrador por fecha
    CONSTRAINT unique_daysheet_per_collector_date UNIQUE(collector_id, work_date)
);

-- Índices críticos
CREATE INDEX idx_daysheets_collector_date ON daysheets(collector_id, work_date DESC);
CREATE INDEX idx_daysheets_status ON daysheets(status);
CREATE INDEX idx_daysheets_work_date ON daysheets(work_date DESC);

-- ============================================================================
-- TABLA: closings
-- Cierre diario consolidado (ejecuta el Motor DLE)
-- **Definida antes de las tablas que la referencian**
-- ============================================================================
CREATE TABLE closings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Fecha del cierre
    closing_date DATE UNIQUE NOT NULL,

    -- Ejecutado por
    executed_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Timestamps de ejecución
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Estado
    status closing_status DEFAULT 'pending',

    -- Resumen financiero (snapshot del día)
    total_collections NUMERIC(18,6) DEFAULT 0,
    total_principal_collected NUMERIC(18,6) DEFAULT 0,
    total_interest_collected NUMERIC(18,6) DEFAULT 0,
    total_expenses NUMERIC(18,6) DEFAULT 0,
    net_cash_flow NUMERIC(18,6) DEFAULT 0, -- Liquidez del día

    -- Estadísticas de cartera
    active_loans_count INTEGER DEFAULT 0,
    total_outstanding_principal NUMERIC(18,6) DEFAULT 0,
    overdue_loans_count INTEGER DEFAULT 0,

    -- Eventos procesados
    collection_events_processed INTEGER DEFAULT 0,

    -- Log de errores (si falló)
    error_log TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_closings_date ON closings(closing_date DESC);
CREATE INDEX idx_closings_status ON closings(status);

-- ============================================================================
-- TABLA: collection_events
-- Eventos de pago (APPEND-ONLY, inmutable después de cierre)
-- ============================================================================
CREATE TABLE collection_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relaciones
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE RESTRICT,
    collector_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    daysheet_id UUID REFERENCES daysheets(id) ON DELETE SET NULL,

    -- Monto del pago
    amount NUMERIC(18,6) NOT NULL CHECK (amount > 0),

    -- Tipo de pago
    event_type collection_event_type NOT NULL,

    -- Geolocalización y timestamp (AUDITORÍA CRÍTICA - Anti-fraude)
    location GEOGRAPHY(POINT, 4326) NOT NULL, -- GPS obligatorio
    collected_at TIMESTAMPTZ NOT NULL,        -- Timestamp del cobro

    -- Procesamiento por DLE (se llena cuando DLE procesa este evento)
    processed_by_dle BOOLEAN DEFAULT false,
    dle_closing_id UUID REFERENCES closings(id) ON DELETE SET NULL, -- VINCULADO AL CIERRE
    principal_applied NUMERIC(18,6),  -- Cuánto fue a capital
    interest_applied NUMERIC(18,6),   -- Cuánto fue a intereses

    -- Metadata
    notes TEXT,
    photo_url TEXT, -- URL de foto del recibo (opcional)

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- Constraint de no editar después de procesado se maneja a nivel de aplicación
);

-- Índices para rendimiento
CREATE INDEX idx_collection_loan ON collection_events(loan_id, collected_at DESC);
CREATE INDEX idx_collection_collector ON collection_events(collector_id, collected_at DESC);
CREATE INDEX idx_collection_daysheet ON collection_events(daysheet_id);
CREATE INDEX idx_collection_unprocessed ON collection_events(processed_by_dle, collected_at)
    WHERE processed_by_dle = false;
CREATE INDEX idx_collection_location ON collection_events USING GIST(location);
CREATE INDEX idx_collection_closing ON collection_events(dle_closing_id);

-- ============================================================================
-- TABLA: expense_events
-- Gastos del cobrador (APPEND-ONLY)
-- ============================================================================
CREATE TABLE expense_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relaciones
    collector_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    daysheet_id UUID REFERENCES daysheets(id) ON DELETE SET NULL,

    -- Gasto
    amount NUMERIC(18,6) NOT NULL CHECK (amount > 0),
    expense_type expense_type NOT NULL,
    description TEXT NOT NULL,

    -- Comprobante
    receipt_photo_url TEXT,

    -- Timestamp
    expense_date TIMESTAMPTZ NOT NULL,

    -- Aprobación (opcional para gastos grandes)
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_collector ON expense_events(collector_id, expense_date DESC);
CREATE INDEX idx_expense_daysheet ON expense_events(daysheet_id);

-- ============================================================================
-- TABLA: ledger_transactions
-- Libro mayor contable (APPEND-ONLY, inmutable, doble partida)
-- ============================================================================
CREATE TABLE ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relación con el cierre que generó esta transacción
    closing_id UUID NOT NULL REFERENCES closings(id) ON DELETE RESTRICT,

    -- Tipo de movimiento
    entry_type ledger_entry_type NOT NULL,

    -- Cuentas contables (simplificado, puede expandirse)
    debit_account TEXT NOT NULL,  -- ej. "Cash", "Accounts Receivable"
    credit_account TEXT NOT NULL, -- ej. "Interest Income", "Principal Receivable"

    -- Monto (siempre positivo, el signo lo determina debit/credit)
    amount NUMERIC(18,6) NOT NULL CHECK (amount > 0),

    -- Referencias
    loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    collection_event_id UUID REFERENCES collection_events(id) ON DELETE SET NULL,

    -- Descripción
    description TEXT,

    -- Fecha efectiva del movimiento
    transaction_date DATE NOT NULL,

    -- Auditoría (INMUTABLE)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ledger_closing ON ledger_transactions(closing_id);
CREATE INDEX idx_ledger_date ON ledger_transactions(transaction_date DESC);
CREATE INDEX idx_ledger_loan ON ledger_transactions(loan_id);
CREATE INDEX idx_ledger_type ON ledger_transactions(entry_type);


-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Actualizar el campo 'updated_at' automáticamente en cada UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger a las tablas relevantes
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daysheets_updated_at BEFORE UPDATE ON daysheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_closings_updated_at BEFORE UPDATE ON closings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTARIOS FINALES
-- ============================================================================

COMMENT ON FUNCTION update_updated_at_column IS 'Función de trigger que actualiza automáticamente la columna updated_at al valor de NOW() en cualquier fila que sea modificada.';
COMMENT ON TABLE users IS 'Usuarios del sistema: Patrón, Contador, Cobradores';
COMMENT ON TABLE routes IS 'Rutas de cobro asignadas a cobradores';
COMMENT ON TABLE clients IS 'Clientes del microcrédito con scoring de riesgo';
COMMENT ON TABLE loans IS 'Préstamos activos con saldos actualizados por DLE';
COMMENT ON TABLE installments IS 'Plan teórico de cuotas (solo referencia)';
COMMENT ON TABLE daysheets IS 'Jornada diaria del cobrador con reconciliación de efectivo';
COMMENT ON TABLE collection_events IS 'Eventos de pago (APPEND-ONLY con geolocalización)';
COMMENT ON TABLE expense_events IS 'Gastos del cobrador (APPEND-ONLY)';
COMMENT ON TABLE ledger_transactions IS 'Libro mayor contable (APPEND-ONLY, inmutable)';
COMMENT ON TABLE closings IS 'Cierre diario que ejecuta el Motor DLE';

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================
