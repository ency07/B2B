-- MIGRACIÓN: DUNNING CHECK (auto-asignación de VENCIDA)
-- Gap E-006: Estado VENCIDA nunca se auto-asigna. No hay cobranza automática.

CREATE OR REPLACE FUNCTION run_dunning_check(p_tenant_id uuid DEFAULT NULL)
RETURNS TABLE(
    affected_count bigint,
    total_amount decimal(18,2)
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_tenant_id uuid;
    v_count bigint := 0;
    v_total decimal(18,2) := 0;
BEGIN
    FOR v_tenant_id IN
        SELECT id FROM tenants
        WHERE (p_tenant_id IS NULL OR id = p_tenant_id)
    LOOP
        WITH overdue AS (
            UPDATE invoices
            SET status = 'VENCIDA',
                updated_at = NOW()
            WHERE tenant_id = v_tenant_id
              AND status IN ('EMITIDA', 'PARCIALMENTE_PAGADA')
              AND due_date < CURRENT_DATE
              AND deleted_at IS NULL
            RETURNING total_amount
        )
        SELECT COUNT(*), COALESCE(SUM(total_amount), 0) INTO v_count, v_total
        FROM overdue;

        affected_count := v_count;
        total_amount := v_total;
        RETURN NEXT;
    END LOOP;
END;
$$;
