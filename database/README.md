# 📊 Modelo de Datos - Sistema DLE

## Visión General

El esquema de base de datos está diseñado bajo el principio **APPEND-ONLY** para garantizar:

- ✅ **Inmutabilidad:** El pasado no se edita, se corrige con nuevos movimientos
- ✅ **Auditoría Total:** Geolocalización y timestamps en todos los eventos
- ✅ **Precisión Decimal:** `NUMERIC(18,6)` para cálculos financieros críticos
- ✅ **Trazabilidad:** Cada peso se desglosa en capital e intereses

---

## 🗂️ Estructura de Tablas

### **Módulo de Gestión de Usuarios y Rutas**

#### **users**
Usuarios del sistema (Patrón, Contador, Cobradores)

**Campos clave:**
- `role`: ENUM (`owner`, `accountant`, `collector`)
- `email`: Integración con Supabase Auth
- `is_active`: Estado de la cuenta

#### **routes**
Rutas de cobro georreferenciadas

**Campos clave:**
- `coverage_area`: GEOGRAPHY (polígono PostGIS)
- `collector_id`: Cobrador asignado a la ruta

#### **clients**
Clientes del microcrédito

**Campos clave:**
- `location`: GEOGRAPHY (punto GPS)
- `risk_score`: Score de riesgo (0-100)
- `references`: JSONB con referencias personales

---

### **Módulo Financiero Core**

#### **loans** ⭐ TABLA CENTRAL
Préstamos activos con matemática de alto rendimiento

**Condiciones Financieras (INMUTABLES):**
- `principal_amount`: Monto inicial
- `daily_interest_rate`: Tasa diaria (ej. 0.01342400 para 490.99% TEA)
- `daily_payment`: Cuota diaria esperada

**Saldos Actuales (ACTUALIZADOS POR DLE):**
- `outstanding_principal`: Capital pendiente
- `accrued_interest`: Intereses devengados
- `total_paid_principal`: Capital recuperado (KPI crítico)
- `total_paid_interest`: Intereses cobrados

**Mora:**
- `days_overdue`: Días de atraso
- `late_fees`: Multas acumuladas

#### **installments**
Plan teórico de cuotas (SOLO REFERENCIA)

**Uso:** Comparar "esperado vs real" en reportes de excepciones.

**IMPORTANTE:** Los pagos reales se registran en `collection_events`, no aquí.

---

### **Módulo de Operación Diaria**

#### **daysheets** 📋
Jornada del cobrador (hoja de ruta diaria)

**Workflow de Estados:**
```
DRAFT → SUBMITTED → VERIFIED → CLOSED
  ↓         ↓          ↓          ↓
Cobrador  Cobrador  Contador    DLE
```

**Reconciliación de Efectivo:**
- `expected_cash`: Suma de collection_events
- `declared_cash`: Efectivo declarado por cobrador
- `cash_variance`: Diferencia (alerta de fraude)

#### **collection_events** 💰 APPEND-ONLY
Eventos de pago con geolocalización obligatoria

**Auditoría Anti-Fraude:**
- `location`: GPS obligatorio
- `collected_at`: Timestamp del cobro
- `photo_url`: Foto del recibo

**Procesamiento DLE:**
- `processed_by_dle`: Bandera de procesamiento
- `principal_applied`: Cuánto fue a capital
- `interest_applied`: Cuánto fue a intereses

**Tipos de Pago:**
- `full_payment`: Cuota completa
- `partial_payment`: Abono parcial
- `interest_only`: Solo intereses (no amortiza capital)

#### **expense_events** 💸 APPEND-ONLY
Gastos del cobrador

**Categorías:**
- `transport`, `food`, `communication`, `other`

---

### **Módulo Contable**

#### **ledger_transactions** 📒 APPEND-ONLY
Libro mayor contable (doble partida)

**Características:**
- Inmutable (never UPDATE, only INSERT)
- Generado automáticamente por el DLE
- Referencia al `closing_id` que lo generó

**Cuentas:**
- `debit_account`: Cuenta débito
- `credit_account`: Cuenta crédito
- `amount`: Monto (siempre positivo)

#### **closings** 🔒
Cierre diario consolidado

**Proceso:**
1. Contador hace clic en "EJECUTAR CIERRE DIARIO"
2. Motor DLE procesa todos los `collection_events` no procesados
3. Actualiza saldos en `loans`
4. Genera `ledger_transactions`
5. Calcula KPIs en `closings`

**KPIs Generados:**
- `net_cash_flow`: Liquidez del día (para el Patrón)
- `total_principal_collected`: Recuperación de capital (TRE)
- `active_loans_count`: Cartera activa
- `overdue_loans_count`: Cartera en mora

---

## 🔑 Índices Críticos

### **Rendimiento del DLE:**
```sql
idx_collection_unprocessed  -- WHERE processed_by_dle = false
idx_loans_status            -- WHERE status = 'active'
idx_loans_overdue           -- ORDER BY days_overdue DESC
```

### **Queries Frecuentes:**
```sql
idx_daysheets_collector_date    -- Jornadas por cobrador
idx_collection_loan             -- Historial de pagos por préstamo
idx_ledger_date                 -- Movimientos contables por fecha
```

### **Geoespaciales (PostGIS):**
```sql
idx_clients_location            -- Búsqueda por proximidad
idx_collection_location         -- Verificación de rutas
```

---

## 📐 Diagrama de Relaciones

```
┌──────────┐         ┌─────────┐
│  users   │────────▶│ routes  │
└──────────┘         └─────────┘
     │                    │
     │                    ▼
     │              ┌─────────────┐
     │              │   clients   │
     │              └─────────────┘
     │                    │
     │                    ▼
     │              ┌──────────────┐
     │              │    loans     │◀──── Motor DLE actualiza saldos
     │              └──────────────┘
     │                    │
     ▼                    │
┌──────────────┐          │
│  daysheets   │          │
└──────────────┘          │
     │                    │
     ├──────────┬─────────┘
     │          │
     ▼          ▼
┌──────────┐  ┌─────────────────────┐
│ expense_ │  │ collection_events   │
│ events   │  └─────────────────────┘
└──────────┘          │
                      │
                      ▼
            ┌──────────────────────┐
            │      closings        │
            └──────────────────────┘
                      │
                      ▼
            ┌──────────────────────┐
            │ ledger_transactions  │
            └──────────────────────┘
```

---

## 🛡️ Reglas de Integridad

### **Restricciones de Borrado:**

- `ON DELETE RESTRICT`: `loans.client_id`, `collection_events.loan_id`
  - No se puede borrar un cliente con préstamos activos
  - No se puede borrar un préstamo con pagos registrados

- `ON DELETE SET NULL`: `loans.collector_id`, `daysheets.verified_by`
  - Si se borra un cobrador, sus préstamos quedan huérfanos (reasignar manualmente)

- `ON DELETE CASCADE`: `installments.loan_id`
  - Si se borra un préstamo, se borran sus cuotas teóricas

### **Constraints:**

```sql
CHECK (outstanding_principal >= 0)  -- Capital pendiente no negativo
CHECK (amount > 0)                  -- Montos siempre positivos
UNIQUE (collector_id, work_date)    -- Un daysheet por cobrador/día
UNIQUE (closing_date)               -- Un cierre por fecha
```

---

## 🚀 Cómo Aplicar el Esquema

### **Opción 1: Supabase Dashboard**

1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. SQL Editor → New Query
4. Copiar y pegar `database/migrations/001_initial_schema.sql`
5. Ejecutar (Run)

### **Opción 2: Supabase CLI**

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Inicializar proyecto local
supabase init

# Aplicar migración
supabase db push
```

---

## 📊 Queries de Ejemplo

### **Reporte de Excepciones Diarias:**

```sql
SELECT
    l.id,
    c.full_name,
    l.daily_payment AS expected,
    COALESCE(SUM(ce.amount), 0) AS collected,
    l.daily_payment - COALESCE(SUM(ce.amount), 0) AS variance
FROM loans l
JOIN clients c ON l.client_id = c.id
LEFT JOIN collection_events ce
    ON ce.loan_id = l.id
    AND DATE(ce.collected_at) = CURRENT_DATE
WHERE l.status = 'active'
GROUP BY l.id, c.full_name, l.daily_payment
HAVING l.daily_payment - COALESCE(SUM(ce.amount), 0) != 0;
```

### **Cartera por Antigüedad de Mora:**

```sql
SELECT
    CASE
        WHEN days_overdue BETWEEN -1 AND -5 THEN '-1 a -5 días'
        WHEN days_overdue BETWEEN 6 AND 12 THEN '6 a 12 días'
        WHEN days_overdue BETWEEN 13 AND 19 THEN '13 a 19 días'
        WHEN days_overdue >= 20 THEN '20+ días'
    END AS mora_range,
    COUNT(*) AS loan_count,
    SUM(outstanding_principal) AS total_at_risk
FROM loans
WHERE status = 'active' AND days_overdue > 0
GROUP BY mora_range
ORDER BY MIN(days_overdue);
```

### **KPI: Tasa de Recaudo Efectivo (TRE):**

```sql
SELECT
    SUM(total_paid_principal) /
    NULLIF(SUM(principal_amount), 0) * 100 AS tre_percentage
FROM loans
WHERE disbursement_date >= CURRENT_DATE - INTERVAL '30 days';
```

---

## 🔐 Seguridad (Row Level Security)

**TODO:** Implementar políticas RLS en Supabase:

```sql
-- Ejemplo: Cobradores solo ven sus propios daysheets
ALTER TABLE daysheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collectors see own daysheets"
ON daysheets
FOR SELECT
USING (
    collector_id = auth.uid()
    AND auth.jwt()->>'role' = 'collector'
);
```

---

## 📝 Notas Importantes

### **Extensiones Requeridas:**

- `uuid-ossp`: Generación de UUIDs
- `postgis`: Geolocalización (GEOGRAPHY types)

**Si PostGIS no está disponible:** Cambiar `GEOGRAPHY` por `TEXT` (almacenar como "lat,lon") y procesar en la aplicación.

### **Precisión Decimal:**

- `NUMERIC(18,6)`: Hasta 18 dígitos totales, 6 decimales
- Ejemplo: `999,999,999,999.123456`
- Suficiente para saldos hasta 999 billones con centavos

### **Principio APPEND-ONLY:**

**NUNCA hacer:**
```sql
UPDATE collection_events SET amount = ... WHERE id = ...
DELETE FROM ledger_transactions WHERE ...
```

**SÍ hacer:**
```sql
INSERT INTO ledger_transactions (entry_type, ...)
VALUES ('adjustment', ...);
```

---

## 🎯 Próximos Pasos

1. ✅ Aplicar esquema en Supabase
2. ⏳ Generar tipos TypeScript con Supabase CLI
3. ⏳ Implementar Server Actions para el Motor DLE
4. ⏳ Configurar Row Level Security (RLS)
5. ⏳ Crear seeds de datos de prueba

---

**Autor:** Sistema DLE
**Última actualización:** 2025-12-13
