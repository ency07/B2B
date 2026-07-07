-- MIGRACIÓN FASE 7: INVENTARIOS (BODEGAS, ARTÍCULOS Y MOVIMIENTOS)
-- Archivo: supabase/migrations/20260617000007_inventory_core.sql

-- 1. Insertar el rol global JEFE_INVENTARIO si no existe
INSERT INTO roles (tenant_id, role_code, name, description, status)
VALUES (NULL, 'JEFE_INVENTARIO', 'Jefe de Inventarios', 'Responsable del control de bodegas, catálogo de artículos y aprobación de movimientos de inventario.', 'Activo')
ON CONFLICT (tenant_id, role_code) DO NOTHING;

-- 2. Crear Tabla de Bodegas (warehouses)
CREATE TABLE warehouses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    warehouse_code varchar(50) NOT NULL,
    site_id uuid NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    name varchar(150) NOT NULL,
    description text,
    status varchar(50) NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    
    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_warehouse_code UNIQUE (tenant_id, warehouse_code)
);

-- 3. Crear Tabla de Artículos de Inventario (inventory_items)
CREATE TABLE inventory_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    item_code varchar(50) NOT NULL,
    name varchar(250) NOT NULL,
    description text,
    category varchar(100),
    item_type varchar(50) NOT NULL DEFAULT 'Material' CHECK (item_type IN ('Material', 'Herramienta', 'Equipo', 'Consumible', 'Repuesto')),
    unit varchar(20) NOT NULL,
    minimum_stock decimal(18,4) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    reorder_point decimal(18,4) NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
    maximum_stock decimal(18,4) NOT NULL DEFAULT 0 CHECK (maximum_stock >= 0),
    average_cost decimal(18,2) NOT NULL DEFAULT 0 CHECK (average_cost >= 0),
    last_cost decimal(18,2) NOT NULL DEFAULT 0 CHECK (last_cost >= 0),
    status varchar(50) NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_item_code UNIQUE (tenant_id, item_code)
);

-- 4. Crear Tabla de Stocks/Existencias (inventory_stock)
CREATE TABLE inventory_stock (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity decimal(18,4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity decimal(18,4) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity decimal(18,4) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_warehouse_item UNIQUE (tenant_id, warehouse_id, item_id),
    CONSTRAINT chk_stock_available_non_negative CHECK (quantity >= reserved_quantity)
);

-- 5. Crear Tabla de Movimientos de Inventario (inventory_movements)
CREATE TABLE inventory_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    movement_code varchar(50) NOT NULL,
    
    -- Bodegas implicadas
    warehouse_id uuid REFERENCES warehouses(id) ON DELETE RESTRICT,
    source_warehouse_id uuid REFERENCES warehouses(id) ON DELETE RESTRICT,
    destination_warehouse_id uuid REFERENCES warehouses(id) ON DELETE RESTRICT,
    
    item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    job_id uuid REFERENCES jobs(id) ON DELETE RESTRICT,
    activity_id uuid REFERENCES job_activities(id) ON DELETE RESTRICT,
    
    movement_type varchar(50) NOT NULL CHECK (movement_type IN ('Entrada', 'Salida', 'Ajuste', 'Reserva', 'Transferencia')),
    quantity decimal(18,4) NOT NULL CHECK (quantity > 0),
    unit_cost decimal(18,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
    total_cost decimal(18,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    notes text,
    movement_date timestamp NOT NULL DEFAULT NOW(),
    status varchar(50) NOT NULL DEFAULT 'Registrado' CHECK (status IN ('Registrado', 'Aplicado', 'Anulado')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_movement_code UNIQUE (tenant_id, movement_code),
    
    -- Validación de bodegas según tipo de movimiento
    CONSTRAINT chk_movement_warehouses CHECK (
        (movement_type <> 'Transferencia' AND warehouse_id IS NOT NULL AND source_warehouse_id IS NULL AND destination_warehouse_id IS NULL)
        OR
        (movement_type = 'Transferencia' AND warehouse_id IS NULL AND source_warehouse_id IS NOT NULL AND destination_warehouse_id IS NOT NULL AND source_warehouse_id <> destination_warehouse_id)
    ),

    -- Job ID es obligatorio para Salidas a obra
    CONSTRAINT chk_movement_job_required CHECK (
        movement_type <> 'Salida' OR job_id IS NOT NULL
    )
);

-- 6. Índices de Rendimiento
CREATE INDEX idx_warehouses_tenant ON warehouses(tenant_id);
CREATE INDEX idx_inventory_items_tenant ON inventory_items(tenant_id);
CREATE INDEX idx_inventory_stock_tenant ON inventory_stock(tenant_id);
CREATE INDEX idx_inventory_stock_warehouse_item ON inventory_stock(warehouse_id, item_id);
CREATE INDEX idx_inventory_movements_tenant ON inventory_movements(tenant_id);
CREATE INDEX idx_inventory_movements_job ON inventory_movements(job_id);

-- 7. Trigger: Autogeneración de Códigos Correlativos
CREATE OR REPLACE FUNCTION handle_inventory_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'warehouses' THEN
        IF NEW.warehouse_code IS NULL OR NEW.warehouse_code = '' THEN
            NEW.warehouse_code := 'WH-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'WAREHOUSE')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'inventory_items' THEN
        IF NEW.item_code IS NULL OR NEW.item_code = '' THEN
            NEW.item_code := 'ART-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'ITEM')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'inventory_movements' THEN
        IF NEW.movement_code IS NULL OR NEW.movement_code = '' THEN
            NEW.movement_code := 'MOV-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'INVENTORY_MOVEMENT')::text, 6, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_warehouse_code BEFORE INSERT ON warehouses FOR EACH ROW EXECUTE FUNCTION handle_inventory_sequences();
CREATE TRIGGER trg_handle_item_code BEFORE INSERT ON inventory_items FOR EACH ROW EXECUTE FUNCTION handle_inventory_sequences();
CREATE TRIGGER trg_handle_movement_code BEFORE INSERT ON inventory_movements FOR EACH ROW EXECUTE FUNCTION handle_inventory_sequences();

-- 8. Trigger: Control de Permisos (RBAC)
CREATE OR REPLACE FUNCTION enforce_inventory_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF is_platform_super_admin() THEN
        RETURN NEW;
    END IF;

    IF pg_trigger_depth() = 0 THEN
        -- Tabla Bodegas
        IF TG_TABLE_NAME = 'warehouses' THEN
            IF NOT (
                current_user_has_role('JEFE_INVENTARIO') OR 
                current_user_has_role('GERENTE') OR 
                current_user_has_role('GERENTE_GENERAL')
            ) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo el Jefe de Inventario o Gerencia pueden gestionar bodegas.';
            END IF;
        
        -- Tabla Artículos
        ELSIF TG_TABLE_NAME = 'inventory_items' THEN
            IF NOT (
                current_user_has_role('JEFE_INVENTARIO') OR 
                current_user_has_role('GERENTE') OR 
                current_user_has_role('GERENTE_GENERAL')
            ) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo el Jefe de Inventario o Gerencia pueden gestionar artículos de catálogo.';
            END IF;

        -- Tabla Movimientos
        ELSIF TG_TABLE_NAME = 'inventory_movements' THEN
            IF TG_OP = 'INSERT' THEN
                IF NEW.movement_type IN ('Ajuste', 'Transferencia') THEN
                    IF NOT (
                        current_user_has_role('JEFE_INVENTARIO') OR 
                        current_user_has_role('GERENTE') OR 
                        current_user_has_role('GERENTE_GENERAL')
                    ) THEN
                        RAISE EXCEPTION 'Permiso Denegado: Solo el Jefe de Inventario o Gerencia pueden registrar Ajustes o Transferencias.';
                    END IF;
                ELSE
                    -- Entrada, Salida, Reserva
                    IF NOT (
                        current_user_has_role('ALMACENISTA') OR 
                        current_user_has_role('JEFE_INVENTARIO') OR 
                        current_user_has_role('GERENTE') OR 
                        current_user_has_role('GERENTE_GENERAL')
                    ) THEN
                        RAISE EXCEPTION 'Permiso Denegado: No cuenta con permisos de Almacenista para registrar movimientos de inventario.';
                    END IF;
                END IF;
            
            ELSIF TG_OP = 'UPDATE' THEN
                -- Transición a Aplicado (Aprobación)
                IF NEW.status = 'Aplicado' AND OLD.status = 'Registrado' THEN
                    IF NOT (
                        current_user_has_role('JEFE_INVENTARIO') OR 
                        current_user_has_role('GERENTE') OR 
                        current_user_has_role('GERENTE_GENERAL')
                    ) THEN
                        RAISE EXCEPTION 'Permiso Denegado: Solo el Jefe de Inventario o Gerencia pueden aplicar y aprobar movimientos de inventario.';
                    END IF;
                END IF;

                -- Modificación de registros ya Aplicados o Anulados
                IF OLD.status IN ('Aplicado', 'Anulado') THEN
                    RAISE EXCEPTION 'No se puede modificar un movimiento de inventario en estado final %.', OLD.status;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_warehouse_perms BEFORE INSERT OR UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION enforce_inventory_permissions();
CREATE TRIGGER trg_enforce_item_perms BEFORE INSERT OR UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION enforce_inventory_permissions();
CREATE TRIGGER trg_enforce_movement_perms BEFORE INSERT OR UPDATE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION enforce_inventory_permissions();

-- 9. Trigger: Validación de Transiciones de Estados en Movimientos
CREATE OR REPLACE FUNCTION validate_inventory_movement_transitions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Un movimiento ya aplicado o anulado es inmutable en su estado
    IF OLD.status IN ('Aplicado', 'Anulado') THEN
        RAISE EXCEPTION 'No se puede cambiar el estado de un movimiento que ya está %.', OLD.status;
    END IF;

    -- Validar transiciones permitidas (Registrado -> Aplicado / Registrado -> Anulado)
    IF OLD.status = 'Registrado' AND NEW.status NOT IN ('Aplicado', 'Anulado') THEN
        RAISE EXCEPTION 'Transición de estado inválida: de Registrado a %.', NEW.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_movement_state BEFORE UPDATE OF status ON inventory_movements FOR EACH ROW EXECUTE FUNCTION validate_inventory_movement_transitions();

-- 10. Función Auxiliar: Recálculo de Costo Promedio y Último Costo
CREATE OR REPLACE FUNCTION update_item_costs(
    p_tenant_id uuid,
    p_item_id uuid,
    p_quantity decimal(18,4),
    p_unit_cost decimal(18,2)
) RETURNS void AS $$
DECLARE
    v_total_stock decimal(18,4) := 0;
    v_avg_cost decimal(18,2) := 0;
    v_new_avg_cost decimal(18,2) := 0;
BEGIN
    -- Obtener stock actual total en el tenant (después de aplicar esta entrada)
    SELECT COALESCE(SUM(quantity), 0) INTO v_total_stock
    FROM inventory_stock
    WHERE tenant_id = p_tenant_id AND item_id = p_item_id AND deleted_at IS NULL;

    SELECT average_cost INTO v_avg_cost
    FROM inventory_items
    WHERE id = p_item_id;

    -- Si el stock actual tras la entrada es menor o igual a p_quantity, el costo promedio es el costo de esta entrada
    IF (v_total_stock - p_quantity) <= 0 THEN
        v_new_avg_cost := p_unit_cost;
    ELSE
        v_new_avg_cost := (((v_total_stock - p_quantity) * v_avg_cost) + (p_quantity * p_unit_cost)) / v_total_stock;
    END IF;

    UPDATE inventory_items
    SET average_cost = ROUND(v_new_avg_cost, 2),
        last_cost = p_unit_cost,
        updated_at = NOW()
    WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Función Auxiliar: Envío de Alertas por Stock Bajo o Crítico
CREATE OR REPLACE FUNCTION check_and_dispatch_low_stock_events(
    p_tenant_id uuid,
    p_item_id uuid
) RETURNS void AS $$
BEGIN
    -- Stub: Redefinida con cuerpo completo más abajo
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Redefinimos esta función para que tenga cuerpo completo
CREATE OR REPLACE FUNCTION check_and_dispatch_low_stock_events(
    p_tenant_id uuid,
    p_item_id uuid
) RETURNS void AS $$
DECLARE
    v_total_avail decimal(18,4) := 0;
    v_min_stock decimal(18,4) := 0;
    v_reorder_pt decimal(18,4) := 0;
    v_item_code varchar(50);
    v_item_name varchar(250);
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    SELECT COALESCE(SUM(available_quantity), 0) INTO v_total_avail
    FROM inventory_stock
    WHERE tenant_id = p_tenant_id AND item_id = p_item_id AND deleted_at IS NULL;

    SELECT item_code, name, minimum_stock, reorder_point 
    INTO v_item_code, v_item_name, v_min_stock, v_reorder_pt
    FROM inventory_items
    WHERE id = p_item_id;

    IF v_total_avail <= v_reorder_pt AND v_reorder_pt > 0 THEN
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (
            p_tenant_id,
            'INVENTORY_STOCK_CRITICAL',
            'INVENTORY_ITEM',
            p_item_id,
            jsonb_build_object(
                'item_code', v_item_code,
                'name', v_item_name,
                'available_stock', v_total_avail,
                'reorder_point', v_reorder_pt
            ),
            v_user_id
        );
    ELSIF v_total_avail <= v_min_stock AND v_min_stock > 0 THEN
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (
            p_tenant_id,
            'INVENTORY_STOCK_LOW',
            'INVENTORY_ITEM',
            p_item_id,
            jsonb_build_object(
                'item_code', v_item_code,
                'name', v_item_name,
                'available_stock', v_total_avail,
                'minimum_stock', v_min_stock
            ),
            v_user_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Función Auxiliar: Evento de consumo de materiales
CREATE OR REPLACE FUNCTION dispatch_material_consumed_event(
    p_tenant_id uuid,
    p_movement_id uuid
) RETURNS void AS $$
DECLARE
    v_mov record;
    v_item record;
BEGIN
    SELECT * INTO v_mov FROM inventory_movements WHERE id = p_movement_id;
    SELECT * INTO v_item FROM inventory_items WHERE id = v_mov.item_id;

    INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
    VALUES (
        p_tenant_id,
        'JOB_MATERIAL_CONSUMED',
        'JOB',
        v_mov.job_id,
        jsonb_build_object(
            'movement_id', v_mov.id,
            'movement_code', v_mov.movement_code,
            'item_id', v_mov.item_id,
            'item_code', v_item.item_code,
            'name', v_item.name,
            'quantity', v_mov.quantity,
            'unit_cost', v_mov.unit_cost,
            'total_cost', v_mov.total_cost,
            'activity_id', v_mov.activity_id,
            'consumed_by', v_mov.created_by,
            'consumed_at', v_mov.movement_date
        ),
        v_mov.created_by
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger: Autocompletado de Costo de Salida y Afectación de Existencias
CREATE OR REPLACE FUNCTION handle_inventory_stock_affectation()
RETURNS TRIGGER AS $$
DECLARE
    v_current_qty decimal(18,4) := 0;
    v_current_res decimal(18,4) := 0;
    v_dest_qty decimal(18,4) := 0;
BEGIN
    -- Autocompletado del unit_cost para Salida
    IF TG_OP = 'INSERT' AND NEW.movement_type = 'Salida' AND (NEW.unit_cost IS NULL OR NEW.unit_cost = 0) THEN
        SELECT average_cost INTO NEW.unit_cost FROM inventory_items WHERE id = NEW.item_id;
    END IF;

    -- Procesar la afectación cuando el movimiento se APLICA (aprobación)
    IF TG_OP = 'UPDATE' AND NEW.status = 'Aplicado' AND OLD.status = 'Registrado' THEN
        
        -- A. Movimiento no Transferencia (Entrada, Salida, Reserva, Ajuste)
        IF NEW.movement_type <> 'Transferencia' THEN
            -- Asegurar existencia en inventory_stock
            INSERT INTO inventory_stock (tenant_id, warehouse_id, item_id, quantity, reserved_quantity)
            VALUES (NEW.tenant_id, NEW.warehouse_id, NEW.item_id, 0, 0)
            ON CONFLICT (tenant_id, warehouse_id, item_id) DO NOTHING;

            SELECT quantity, reserved_quantity INTO v_current_qty, v_current_res
            FROM inventory_stock
            WHERE tenant_id = NEW.tenant_id AND warehouse_id = NEW.warehouse_id AND item_id = NEW.item_id;

            IF NEW.movement_type = 'Entrada' THEN
                v_current_qty := v_current_qty + NEW.quantity;
            
            ELSIF NEW.movement_type = 'Salida' THEN
                -- Si es salida de reserva (contiene palabra RESERVA en notas) y hay reserva suficiente
                IF LOWER(COALESCE(NEW.notes, '')) LIKE '%reserva%' AND v_current_res >= NEW.quantity THEN
                    v_current_qty := v_current_qty - NEW.quantity;
                    v_current_res := v_current_res - NEW.quantity;
                ELSE
                    v_current_qty := v_current_qty - NEW.quantity;
                END IF;
            
            ELSIF NEW.movement_type = 'Reserva' THEN
                v_current_res := v_current_res + NEW.quantity;
            
            ELSIF NEW.movement_type = 'Ajuste' THEN
                -- Palabras clave en notas para ajuste negativo
                IF LOWER(COALESCE(NEW.notes, '')) SIMILAR TO '%(disminuye|negativo|resta)%' THEN
                    v_current_qty := v_current_qty - NEW.quantity;
                ELSE
                    v_current_qty := v_current_qty + NEW.quantity;
                END IF;
            END IF;

            -- Validar no stocks negativos en BD
            IF v_current_qty < 0 THEN
                RAISE EXCEPTION 'Stock Negativo Prohibido: El stock físico final sería % (Bodega %, Artículo %).', v_current_qty, NEW.warehouse_id, NEW.item_id;
            END IF;

            IF v_current_qty < v_current_res THEN
                RAISE EXCEPTION 'Stock Reservado Negativo Prohibido: El stock disponible final sería % (Físico: %, Reservado: %). Bodega %, Artículo %.', (v_current_qty - v_current_res), v_current_qty, v_current_res, NEW.warehouse_id, NEW.item_id;
            END IF;

            UPDATE inventory_stock
            SET quantity = v_current_qty,
                reserved_quantity = v_current_res,
                updated_at = NOW(),
                updated_by = get_current_user_id()
            WHERE tenant_id = NEW.tenant_id AND warehouse_id = NEW.warehouse_id AND item_id = NEW.item_id;

        -- B. Movimiento es Transferencia
        ELSE
            -- Bodega Origen (Salida de stock)
            INSERT INTO inventory_stock (tenant_id, warehouse_id, item_id, quantity, reserved_quantity)
            VALUES (NEW.tenant_id, NEW.source_warehouse_id, NEW.item_id, 0, 0)
            ON CONFLICT (tenant_id, warehouse_id, item_id) DO NOTHING;

            SELECT quantity, reserved_quantity INTO v_current_qty, v_current_res
            FROM inventory_stock
            WHERE tenant_id = NEW.tenant_id AND warehouse_id = NEW.source_warehouse_id AND item_id = NEW.item_id;

            v_current_qty := v_current_qty - NEW.quantity;

            IF v_current_qty < 0 OR v_current_qty < v_current_res THEN
                RAISE EXCEPTION 'Stock Insuficiente en Bodega Origen: No se puede transferir %. Stock físico origen quedarían en %, reservado % (Bodega %, Artículo %).', NEW.quantity, v_current_qty, v_current_res, NEW.source_warehouse_id, NEW.item_id;
            END IF;

            UPDATE inventory_stock
            SET quantity = v_current_qty,
                updated_at = NOW(),
                updated_by = get_current_user_id()
            WHERE tenant_id = NEW.tenant_id AND warehouse_id = NEW.source_warehouse_id AND item_id = NEW.item_id;

            -- Bodega Destino (Entrada de stock)
            INSERT INTO inventory_stock (tenant_id, warehouse_id, item_id, quantity, reserved_quantity)
            VALUES (NEW.tenant_id, NEW.destination_warehouse_id, NEW.item_id, 0, 0)
            ON CONFLICT (tenant_id, warehouse_id, item_id) DO NOTHING;

            SELECT quantity INTO v_dest_qty
            FROM inventory_stock
            WHERE tenant_id = NEW.tenant_id AND warehouse_id = NEW.destination_warehouse_id AND item_id = NEW.item_id;

            v_dest_qty := v_dest_qty + NEW.quantity;

            UPDATE inventory_stock
            SET quantity = v_dest_qty,
                updated_at = NOW(),
                updated_by = get_current_user_id()
            WHERE tenant_id = NEW.tenant_id AND warehouse_id = NEW.destination_warehouse_id AND item_id = NEW.item_id;
        END IF;

        -- Recalcular costos del artículo si es Entrada
        IF NEW.movement_type = 'Entrada' THEN
            PERFORM update_item_costs(NEW.tenant_id, NEW.item_id, NEW.quantity, NEW.unit_cost);
        END IF;

        -- Despachar alertas de stock
        PERFORM check_and_dispatch_low_stock_events(NEW.tenant_id, NEW.item_id);

        -- Evento de consumo de materiales
        IF NEW.movement_type = 'Salida' AND NEW.job_id IS NOT NULL THEN
            PERFORM dispatch_material_consumed_event(NEW.tenant_id, NEW.id);
        END IF;

    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger AFTER INSERT o BEFORE UPDATE (para completar unit_cost y afectar stock)
CREATE TRIGGER trg_handle_movement_cost_autofill
BEFORE INSERT ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION handle_inventory_stock_affectation();

CREATE TRIGGER trg_handle_movement_stock_update
BEFORE UPDATE OF status ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION handle_inventory_stock_affectation();

-- 14. Trigger: Despacho de Eventos de Negocio
CREATE OR REPLACE FUNCTION dispatch_inventory_events()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_event_code varchar(100);
    v_payload jsonb;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_TABLE_NAME = 'warehouses' THEN
        IF TG_OP = 'INSERT' THEN
            v_event_code := 'WAREHOUSE_CREATED';
            v_payload := jsonb_build_object('warehouse_code', NEW.warehouse_code, 'name', NEW.name);
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
                v_event_code := 'WAREHOUSE_DELETED';
                v_payload := jsonb_build_object('warehouse_code', OLD.warehouse_code, 'delete_reason', NEW.delete_reason);
            ELSE
                v_event_code := 'WAREHOUSE_UPDATED';
                v_payload := jsonb_build_object('warehouse_code', NEW.warehouse_code, 'old_name', OLD.name, 'new_name', NEW.name);
            END IF;
        END IF;
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, v_event_code, 'WAREHOUSE', NEW.id, v_payload, v_user_id);

    ELSIF TG_TABLE_NAME = 'inventory_items' THEN
        IF TG_OP = 'INSERT' THEN
            v_event_code := 'INVENTORY_ITEM_CREATED';
            v_payload := jsonb_build_object('item_code', NEW.item_code, 'name', NEW.name);
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
                v_event_code := 'INVENTORY_ITEM_DELETED';
                v_payload := jsonb_build_object('item_code', OLD.item_code, 'delete_reason', NEW.delete_reason);
            ELSE
                v_event_code := 'INVENTORY_ITEM_UPDATED';
                v_payload := jsonb_build_object('item_code', NEW.item_code, 'old_name', OLD.name, 'new_name', NEW.name);
            END IF;
        END IF;
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, v_event_code, 'INVENTORY_ITEM', NEW.id, v_payload, v_user_id);

    ELSIF TG_TABLE_NAME = 'inventory_movements' THEN
        IF TG_OP = 'INSERT' THEN
            IF NEW.movement_type = 'Transferencia' THEN
                v_event_code := 'INVENTORY_TRANSFER_CREATED';
                v_payload := jsonb_build_object('movement_code', NEW.movement_code, 'source', NEW.source_warehouse_id, 'dest', NEW.destination_warehouse_id);
            ELSE
                v_event_code := 'INVENTORY_MOVEMENT_CREATED';
                v_payload := jsonb_build_object('movement_code', NEW.movement_code, 'type', NEW.movement_type, 'qty', NEW.quantity);
            END IF;
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, v_event_code, 'INVENTORY_MOVEMENT', NEW.id, v_payload, v_user_id);
        
        ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
            IF NEW.status = 'Aplicado' THEN
                IF NEW.movement_type = 'Transferencia' THEN
                    v_event_code := 'INVENTORY_TRANSFER_COMPLETED';
                ELSE
                    v_event_code := 'INVENTORY_MOVEMENT_APPLIED';
                END IF;
            ELSIF NEW.status = 'Anulado' THEN
                v_event_code := 'INVENTORY_MOVEMENT_CANCELLED';
            END IF;
            v_payload := jsonb_build_object('movement_code', NEW.movement_code, 'old_status', OLD.status, 'new_status', NEW.status);
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, v_event_code, 'INVENTORY_MOVEMENT', NEW.id, v_payload, v_user_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_warehouse_events AFTER INSERT OR UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION dispatch_inventory_events();
CREATE TRIGGER trg_dispatch_item_events AFTER INSERT OR UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION dispatch_inventory_events();
CREATE TRIGGER trg_dispatch_movement_events AFTER INSERT OR UPDATE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION dispatch_inventory_events();

-- 15. Trigger: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
CREATE OR REPLACE FUNCTION block_physical_inventory_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los datos de inventario son inmutables en base de datos. Utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_warehouse_delete BEFORE DELETE ON warehouses FOR EACH ROW EXECUTE FUNCTION block_physical_inventory_delete();
CREATE TRIGGER trg_block_item_delete BEFORE DELETE ON inventory_items FOR EACH ROW EXECUTE FUNCTION block_physical_inventory_delete();
CREATE TRIGGER trg_block_stock_delete BEFORE DELETE ON inventory_stock FOR EACH ROW EXECUTE FUNCTION block_physical_inventory_delete();
CREATE TRIGGER trg_block_movement_delete BEFORE DELETE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION block_physical_inventory_delete();

-- 16. Trigger: Trazabilidad General (handle_approval_traceability)
CREATE TRIGGER trg_warehouse_traceability BEFORE INSERT OR UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_item_traceability BEFORE INSERT OR UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_stock_traceability BEFORE INSERT OR UPDATE ON inventory_stock FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_movement_traceability BEFORE INSERT OR UPDATE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- 17. Trigger: Integración con Auditoría General (process_audit_log)
CREATE TRIGGER audit_warehouses AFTER INSERT OR UPDATE OR DELETE ON warehouses FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_inventory_items AFTER INSERT OR UPDATE OR DELETE ON inventory_items FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_inventory_stock AFTER INSERT OR UPDATE OR DELETE ON inventory_stock FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_inventory_movements AFTER INSERT OR UPDATE OR DELETE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 18. Habilitación de Row Level Security (RLS)
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- 19. Políticas de Seguridad RLS
-- A. Bodegas (warehouses)
CREATE POLICY warehouses_super_admin ON warehouses FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY warehouses_select_tenant ON warehouses FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY warehouses_write_tenant ON warehouses FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- B. Artículos (inventory_items)
CREATE POLICY items_super_admin ON inventory_items FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY items_select_tenant ON inventory_items FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY items_write_tenant ON inventory_items FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- C. Existencias (inventory_stock)
CREATE POLICY stock_super_admin ON inventory_stock FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY stock_select_tenant ON inventory_stock FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY stock_write_tenant ON inventory_stock FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- D. Movimientos (inventory_movements)
CREATE POLICY movements_super_admin ON inventory_movements FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY movements_select_tenant ON inventory_movements FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY movements_write_tenant ON inventory_movements FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);
