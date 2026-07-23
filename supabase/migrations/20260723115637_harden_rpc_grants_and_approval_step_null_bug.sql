-- Endurecimiento de grants: el mismo error de wompi_confirm_payment (REVOKE ALL
-- FROM PUBLIC no quita los grants automáticos de Supabase a anon/authenticated en
-- creación de función) se repite en 41 funciones custom no-trigger. Clasificadas
-- en 5 grupos según a quién deben quedar expuestas. service_role/postgres ya
-- estaban presentes en todas — este migration es puramente REVOKE, sin necesidad
-- de GRANT adicional salvo donde se indica.
--
-- Funciones trigger (handle_*/enforce_*/validate_*/block_*/dispatch_*_events) NO
-- se tocan aquí: RETURNS trigger no es invocable directo (Postgres lo rechaza),
-- así que el mismo grant incompleto en ellas no es explotable. Confirmado, no
-- incluido en este barrido para no inflar el diff.

-- ─── Grupo 1: RPCs del portal — ya fallan cerrado vía auth.uid(), quedan
-- expuestas solo a authenticated (+ service_role, ya presente) ──────────────────
REVOKE ALL ON FUNCTION public.portal_get_client_jobs(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_get_client_invoices(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_get_client_payments(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_get_client_tickets(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_get_client_messages(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_create_client_ticket(uuid, character varying, text, character varying, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_send_client_message(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_get_client_requirements(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_create_client_requirement(text, text, text, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_get_client_quotes(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_get_client_quote_detail(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_respond_to_quote(uuid, character varying, text, uuid) FROM PUBLIC, anon;

-- ─── Grupo 2: helpers de identidad — resuelven vía auth.uid(), fallan cerrado
-- (NULL/false) para anon, pero no tienen razón de ser expuestas a anon ─────────
REVOKE ALL ON FUNCTION public.current_user_has_role(character varying) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_current_user_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_current_user_tenant_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin_reviewer() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_portal_client_for(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_platform_super_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_wompi_payment_context() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reviewer_tenant_id() FROM PUBLIC, anon;

-- ─── Grupo 3: helpers internos puros — confirmado por grep que ninguna se llama
-- desde el browser (3 se llaman vía supabaseAdmin/service_role server-side desde
-- dashboard.ts/core.ts/rate-limiter.ts; el resto solo internamente desde otras
-- funciones SQL). Ninguna verifica identidad del llamador — reciben p_tenant_id y
-- lo usan directo (mismo patrón que wompi_confirm_payment antes del fix). Quedan
-- solo en service_role, ya presente. ───────────────────────────────────────────
REVOKE ALL ON FUNCTION public.calculate_kpi(uuid, character varying, character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(text, text, timestamp with time zone) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_tenant_setting(uuid, character varying, character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_next_tenant_sequence(uuid, character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_and_dispatch_low_stock_events(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dispatch_material_consumed_event(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dispatch_notification_to_route(uuid, character varying, uuid, character varying, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.execute_automation_rules(uuid, character varying, uuid, character varying, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_notification_route(uuid, character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_invoice_paid_amount(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_tenant_standard_areas(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_tenant_setting(uuid, character varying, character varying, jsonb, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_item_costs(uuid, uuid, numeric, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_business_hours(timestamp with time zone, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.run_uat_validation_metadata() FROM PUBLIC, anon, authenticated;

-- ─── Grupo 4: resolve_approval_step — grant + bug de lógica NULL-unsafe. Sin
-- llamador en src/, alcanzable hoy solo vía PostgREST directo con la anon key.
-- Fix: v_user_id NULL (identidad no resuelta) debe tratarse como "no autorizado",
-- no como "comparación indefinida que no dispara la excepción". ────────────────
CREATE OR REPLACE FUNCTION public.resolve_approval_step(p_request_id uuid, p_step_order integer, p_decision character varying, p_comments text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_request record;
    v_step record;
    v_user_id uuid;
    v_flow_type varchar(50);
    v_has_pending_prev boolean;
    v_user_has_role boolean;
    v_total_steps integer;
    v_approved_steps integer;
    v_decision_caps varchar(50);
BEGIN
    v_user_id := get_current_user_id();
    v_decision_caps := upper(trim(p_decision));

    IF v_decision_caps NOT IN ('APROBADA', 'RECHAZADA', 'AJUSTES_SOLICITADOS') THEN
        RAISE EXCEPTION 'Decisión no válida. Debe ser APROBADA, RECHAZADA o AJUSTES_SOLICITADOS.';
    END IF;

    -- 1. Obtener la solicitud
    SELECT * INTO v_request
    FROM approval_requests
    WHERE id = p_request_id AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud de aprobación no encontrada.';
    END IF;

    IF v_request.status NOT IN ('PENDIENTE', 'EN_PROCESO') THEN
        RAISE EXCEPTION 'La solicitud de aprobación ya ha sido resuelta (estado actual: %).', v_request.status;
    END IF;

    -- 2. Obtener el paso específico
    SELECT * INTO v_step
    FROM approval_request_steps
    WHERE approval_request_id = p_request_id
      AND step_order = p_step_order
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Paso de aprobación % no encontrado en esta solicitud.', p_step_order;
    END IF;

    IF v_step.status <> 'PENDIENTE' THEN
        RAISE EXCEPTION 'Este paso de aprobación ya fue resuelto con estado %.', v_step.status;
    END IF;

    -- 3. Validar autoridad del firmante. v_user_id NULL (identidad no resuelta:
    -- anon, o un contacto de portal autenticado sin fila en users) debe rechazarse
    -- explícitamente — antes, "v_step.user_id <> v_user_id" con v_user_id NULL
    -- daba NULL (no TRUE), y "IF NULL THEN" no ejecuta el RAISE, dejando pasar
    -- la aprobación sin autorización real.
    IF v_step.user_id IS NOT NULL THEN
        IF (v_user_id IS NULL OR v_step.user_id <> v_user_id) AND NOT is_platform_super_admin() THEN
            RAISE EXCEPTION 'No tiene autorización para resolver este paso de aprobación (asignado al usuario %).', v_step.user_id;
        END IF;
    ELSIF v_step.role_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = v_user_id
              AND role_id = v_step.role_id
              AND tenant_id = v_request.tenant_id
        ) INTO v_user_has_role;

        IF NOT v_user_has_role AND NOT is_platform_super_admin() THEN
            RAISE EXCEPTION 'No tiene autorización para resolver este paso de aprobación (requiere rol específico).';
        END IF;
    END IF;

    -- 4. Validar secuencia si el flujo es secuencial
    IF v_request.flow_id IS NOT NULL THEN
        SELECT COALESCE(flow_type, 'SECUENCIAL') INTO v_flow_type
        FROM approval_flows
        WHERE id = v_request.flow_id;

        IF v_flow_type = 'SECUENCIAL' THEN
            SELECT EXISTS (
                SELECT 1 FROM approval_request_steps
                WHERE approval_request_id = p_request_id
                  AND step_order < p_step_order
                  AND status <> 'APROBADA'
                  AND deleted_at IS NULL
            ) INTO v_has_pending_prev;

            IF v_has_pending_prev THEN
                RAISE EXCEPTION 'No se puede resolver este paso hasta que los pasos anteriores hayan sido aprobados.';
            END IF;
        END IF;
    END IF;

    -- 5. Actualizar el paso de solicitud
    UPDATE approval_request_steps
    SET status = v_decision_caps,
        resolved_by = v_user_id,
        resolved_at = NOW(),
        comments = p_comments,
        updated_at = NOW()
    WHERE id = v_step.id;

    -- Disparar evento de firma de paso
    INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
    VALUES (
        v_request.tenant_id,
        CASE
            WHEN v_decision_caps = 'APROBADA' THEN 'APPROVAL_REQUEST_APPROVED'
            WHEN v_decision_caps = 'RECHAZADA' THEN 'APPROVAL_REQUEST_REJECTED'
            ELSE 'APPROVAL_REQUEST_ADJUSTMENTS_REQUESTED'
        END,
        'APPROVAL_REQUEST',
        v_request.id,
        jsonb_build_object(
            'request_code', v_request.request_code,
            'step_order', p_step_order,
            'comments', p_comments,
            'resolved_by', v_user_id
        ),
        v_user_id
    );

    -- 6. Evaluar estado global de la solicitud
    IF v_decision_caps = 'RECHAZADA' THEN
        UPDATE approval_requests
        SET status = 'RECHAZADA',
            resolved_by = v_user_id,
            resolved_at = NOW(),
            comments = p_comments,
            updated_at = NOW()
        WHERE id = p_request_id;

        IF v_request.entity_type = 'QUOTE' THEN
            UPDATE quotes
            SET status = 'RECHAZADA',
                reject_reason = p_comments
            WHERE id = v_request.entity_id;
        END IF;

    ELSIF v_decision_caps = 'AJUSTES_SOLICITADOS' THEN
        UPDATE approval_requests
        SET status = 'AJUSTES_SOLICITADOS',
            resolved_by = v_user_id,
            resolved_at = NOW(),
            comments = p_comments,
            updated_at = NOW()
        WHERE id = p_request_id;

        IF v_request.entity_type = 'QUOTE' THEN
            UPDATE quotes
            SET status = 'EN_REVISION'
            WHERE id = v_request.entity_id;
        END IF;

    ELSIF v_decision_caps = 'APROBADA' THEN
        SELECT COUNT(*), COUNT(CASE WHEN status = 'APROBADA' THEN 1 END)
        INTO v_total_steps, v_approved_steps
        FROM approval_request_steps
        WHERE approval_request_id = p_request_id
          AND required = true
          AND deleted_at IS NULL;

        IF v_total_steps = v_approved_steps THEN
            UPDATE approval_requests
            SET status = 'APROBADA',
                resolved_by = v_user_id,
                resolved_at = NOW(),
                comments = 'Aprobación completada por todos los pasos.',
                updated_at = NOW()
            WHERE id = p_request_id;

            IF v_request.entity_type = 'QUOTE' THEN
                UPDATE quotes
                SET status = 'APROBADA'
                WHERE id = v_request.entity_id;
            END IF;
        ELSE
            UPDATE approval_requests
            SET status = 'EN_PROCESO',
                updated_at = NOW()
            WHERE id = p_request_id;
        END IF;
    END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.resolve_approval_step(uuid, integer, character varying, text) FROM PUBLIC, anon, authenticated;

-- ─── Grupo 5: sin llamador confirmado en todo el repo (solo scripts/test-*.ts) —
-- bloqueadas por precaución a service_role. Si algo externo al repo las
-- necesita, aparecerá como error explícito de permisos, no como hueco abierto. ─
REVOKE ALL ON FUNCTION public.wizard_submit_atomic(uuid, jsonb, jsonb, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_white_label_config(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_white_label_config() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_active_tenant(uuid) FROM PUBLIC, anon, authenticated;
