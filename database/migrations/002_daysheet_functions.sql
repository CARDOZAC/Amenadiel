-- ============================================================================
-- MIGRATION 002: Funciones de Daysheet
-- ============================================================================
-- Descripción: Agrega funciones auxiliares para actualizar los totales del daysheet

-- Función para actualizar el expected_cash de un daysheet
-- Se llama cada vez que se registra un nuevo evento de cobro
CREATE OR REPLACE FUNCTION update_daysheet_expected_cash(
    p_daysheet_id UUID,
    p_amount NUMERIC(18,6)
)
RETURNS VOID AS $$
BEGIN
    UPDATE daysheets
    SET
        expected_cash = (COALESCE(expected_cash::NUMERIC, 0) + p_amount)::TEXT,
        updated_at = NOW()
    WHERE id = p_daysheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para recalcular totales del daysheet basado en collection_events
CREATE OR REPLACE FUNCTION recalculate_daysheet_totals(p_daysheet_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_collections NUMERIC(18,6);
    v_total_expenses NUMERIC(18,6);
BEGIN
    -- Calcular total de colecciones
    SELECT COALESCE(SUM(amount::NUMERIC), 0)
    INTO v_total_collections
    FROM collection_events
    WHERE daysheet_id = p_daysheet_id;

    -- Calcular total de gastos
    SELECT COALESCE(SUM(amount::NUMERIC), 0)
    INTO v_total_expenses
    FROM expense_events
    WHERE daysheet_id = p_daysheet_id;

    -- Actualizar daysheet
    UPDATE daysheets
    SET
        expected_cash = v_total_collections::TEXT,
        total_expenses = v_total_expenses::TEXT,
        cash_variance = (COALESCE(declared_cash::NUMERIC, 0) - v_total_collections)::TEXT,
        updated_at = NOW()
    WHERE id = p_daysheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios
COMMENT ON FUNCTION update_daysheet_expected_cash IS 'Incrementa el expected_cash del daysheet cuando se registra un cobro';
COMMENT ON FUNCTION recalculate_daysheet_totals IS 'Recalcula todos los totales del daysheet basándose en eventos';
