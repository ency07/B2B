-- FASE 22: Pruebas de Aceptación de Usuario (UAT)
-- Archivo: supabase/migrations/20260617000022_uat_validation.sql

-- Paso 1: Creación de Cliente y Contacto (clients + client_contacts)
-- Paso 2: Registro de Oportunidad (Requerimiento) (requirements en estado REGISTRADO)
-- Paso 3: Generación y Versionado de Cotización (quotes + quote_items)
-- Paso 4: Flujo de Aprobaciones Básicas y Avanzadas (approval_requests -> aprobación de gerencia)
-- Paso 5: Generación Automática de Orden de Trabajo (Job) (requirements.status -> OT_GENERADA)
-- Paso 6: Desglose de Actividades Operativas (job_activities asignadas a técnicos)
-- Paso 7: Consumo de Inventario y Actualización de Costos (inventory_movements -> average_cost)
-- Paso 8: Carga Documental de Acta de Entrega (documents con type DELIVERY_NOTE y status PUBLICADO)
-- Paso 9: Entrega y Cierre del Trabajo (jobs.status -> ENTREGADO -> CERRADO)
-- Paso 10: Autogeneración de Garantía (warranties creada automáticamente por trigger)
-- Paso 11: Emisión de Factura y Aplicación de Pagos (invoices + payments + customer_advances)
-- Paso 12: Cálculo de Margen de Rentabilidad (vistas job_profitability y client_profitability)

CREATE OR REPLACE FUNCTION run_uat_validation_metadata()
RETURNS jsonb AS $$
BEGIN
    RETURN jsonb_build_object(
        'phase', 22,
        'name', 'User Acceptance Testing (UAT)',
        'steps_configured', jsonb_build_array(
            'STEP_1_CLIENT_AND_CONTACT',
            'STEP_2_OPPORTUNITY_REQUIREMENT',
            'STEP_3_QUOTE_GENERATION_AND_VERSIONING',
            'STEP_4_APPROVAL_FLOWS_COMPLEX',
            'STEP_5_AUTOMATIC_JOB_GENERATION',
            'STEP_6_OPERATIONAL_ACTIVITIES_BREAKDOWN',
            'STEP_7_INVENTORY_CONSUMPTION_COSTING',
            'STEP_8_DOCUMENTARY_DELIVERY_NOTE',
            'STEP_9_JOB_DELIVERY_AND_CLOSURE',
            'STEP_10_AUTOMATIC_WARRANTY_PROVISION',
            'STEP_11_INVOICING_AND_PAYMENTS_APPLICATION',
            'STEP_12_PROFITABILITY_MARGINS_CALCULATION'
        ),
        'assertions', jsonb_build_object(
            'client_contacts_primary_check', true,
            'requirements_status_flow', true,
            'quote_items_autocalculo', true,
            'approval_flow_rules_hierarchy', true,
            'jobs_auto_generation_on_ot_generada', true,
            'job_activities_dates_range_validation', true,
            'inventory_average_cost_recalc', true,
            'documents_delivery_note_check', true,
            'warranty_generation_on_job_closed', true,
            'invoice_status_recalculation', true,
            'profitability_security_invoker', true
        )
    );
END;
$$ LANGUAGE plpgsql;
