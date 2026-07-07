-- MIGRACIÓN FASE 17: RENTABILIDAD COMERCIAL Y OPERATIVA
-- Archivo: supabase/migrations/20260617000017_profitability_core.sql

-- 1. Vista de Rentabilidad por Trabajo (job_profitability)
CREATE OR REPLACE VIEW job_profitability 
WITH (security_invoker = true) AS
SELECT 
    j.tenant_id,
    j.id AS job_id,
    j.job_code,
    j.title AS job_name,
    j.client_id,
    c.legal_name AS client_name,
    COALESCE(i.total_invoiced, 0.00) AS total_invoiced,
    COALESCE(co.total_cost, 0.00) AS total_cost,
    (COALESCE(i.total_invoiced, 0.00) - COALESCE(co.total_cost, 0.00)) AS gross_margin,
    CASE 
        WHEN COALESCE(i.total_invoiced, 0.00) = 0 THEN 
            CASE WHEN COALESCE(co.total_cost, 0.00) > 0 THEN -100.00 ELSE 0.00 END
        ELSE 
            ROUND(((COALESCE(i.total_invoiced, 0.00) - COALESCE(co.total_cost, 0.00)) / i.total_invoiced) * 100, 2)
    END AS profitability_percent
FROM jobs j
JOIN clients c ON j.client_id = c.id
LEFT JOIN (
    SELECT job_id, SUM(total_amount) AS total_invoiced
    FROM invoices
    WHERE status IN ('EMITIDA', 'PARCIALMENTE_PAGADA', 'PAGADA', 'VENCIDA')
      AND deleted_at IS NULL
    GROUP BY job_id
) i ON j.id = i.job_id
LEFT JOIN (
    SELECT job_id, SUM(total_cost) AS total_cost
    FROM costs
    WHERE status = 'APROBADO'
      AND deleted_at IS NULL
    GROUP BY job_id
) co ON j.id = co.job_id
WHERE j.deleted_at IS NULL;

-- 2. Vista de Rentabilidad por Cliente (client_profitability)
CREATE OR REPLACE VIEW client_profitability 
WITH (security_invoker = true) AS
SELECT 
    c.tenant_id,
    c.id AS client_id,
    c.legal_name AS client_name,
    COALESCE(i.total_invoiced, 0.00) AS total_invoiced,
    COALESCE(co.total_cost, 0.00) AS total_cost,
    (COALESCE(i.total_invoiced, 0.00) - COALESCE(co.total_cost, 0.00)) AS gross_margin,
    CASE 
        WHEN COALESCE(i.total_invoiced, 0.00) = 0 THEN 
            CASE WHEN COALESCE(co.total_cost, 0.00) > 0 THEN -100.00 ELSE 0.00 END
        ELSE 
            ROUND(((COALESCE(i.total_invoiced, 0.00) - COALESCE(co.total_cost, 0.00)) / i.total_invoiced) * 100, 2)
    END AS profitability_percent
FROM clients c
LEFT JOIN (
    SELECT client_id, SUM(total_amount) AS total_invoiced
    FROM invoices
    WHERE status IN ('EMITIDA', 'PARCIALMENTE_PAGADA', 'PAGADA', 'VENCIDA')
      AND deleted_at IS NULL
    GROUP BY client_id
) i ON c.id = i.client_id
LEFT JOIN (
    SELECT j.client_id, SUM(co.total_cost) AS total_cost
    FROM jobs j
    JOIN costs co ON j.id = co.job_id
    WHERE co.status = 'APROBADO'
      AND co.deleted_at IS NULL
      AND j.deleted_at IS NULL
    GROUP BY j.client_id
) co ON c.id = co.client_id
WHERE c.deleted_at IS NULL;
