-- El archivo local dunning_check.sql (nunca antes ejecutado ni una vez en
-- la vida de este proyecto) tenía un bug real: el parámetro de salida
-- `total_amount` colisiona con la columna `total_amount` seleccionada en
-- el CTE, dando "column reference total_amount is ambiguous". Se detectó
-- al probar la función por primera vez, en esta migración. Se corrige
-- calificando/renombrando la referencia a la columna del CTE.
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
            RETURNING invoices.total_amount AS overdue_amount
        )
        SELECT COUNT(*), COALESCE(SUM(overdue.overdue_amount), 0) INTO v_count, v_total
        FROM overdue;

        affected_count := v_count;
        total_amount := v_total;
        RETURN NEXT;
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION run_dunning_check(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION run_dunning_check(uuid) TO service_role;
