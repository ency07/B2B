-- MIGRACIÓN: MÓDULO DE COMPRAS (PURCHASES)
-- Archivo: supabase/migrations/20260720220000_purchases_core.sql

-- 1. Actualizar tabla clientes para soportar proveedores
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS entity_type varchar(20) DEFAULT 'CLIENTE' CHECK (entity_type IN ('CLIENTE', 'PROVEEDOR', 'AMBOS'));
CREATE INDEX IF NOT EXISTS idx_clients_entity_type ON public.clients(entity_type);

-- 2. Tabla de Órdenes de Compra
CREATE TABLE public.purchase_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    code varchar(50) NOT NULL,
    vendor_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    status varchar(50) NOT NULL DEFAULT 'BORRADOR' 
        CHECK (status IN ('BORRADOR', 'EN_APROBACION', 'APROBADA', 'RECHAZADA', 'EN_CAMINO', 'RECIBIDA', 'CANCELADA')),
    total_amount decimal(18,2) NOT NULL DEFAULT 0,
    notes text,
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES public.users(id),
    approved_by uuid REFERENCES public.users(id),
    approved_at timestamp,
    deleted_at timestamp,
    CONSTRAINT unique_tenant_po_code UNIQUE (tenant_id, code)
);

-- 3. Tabla de Items de OC
CREATE TABLE public.purchase_order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    description text NOT NULL,
    quantity decimal(12,2) NOT NULL DEFAULT 1,
    unit_price decimal(18,2) NOT NULL DEFAULT 0,
    subtotal decimal(18,2) NOT NULL DEFAULT 0
);

-- 4. Índices
CREATE INDEX idx_po_tenant ON public.purchase_orders(tenant_id);
CREATE INDEX idx_po_vendor ON public.purchase_orders(vendor_id);
CREATE INDEX idx_po_status ON public.purchase_orders(status);

-- 5. Triggers de código correlativo (OC-000001)
CREATE OR REPLACE FUNCTION handle_po_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := 'OC-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'PURCHASE_ORDER')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_po_code BEFORE INSERT ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION handle_po_code();

-- 6. Auditoría y RLS
CREATE TRIGGER audit_po AFTER INSERT OR UPDATE OR DELETE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION process_audit_log();
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY po_tenant_isolation ON public.purchase_orders FOR ALL TO authenticated 
    USING (tenant_id = (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1))
    WITH CHECK (tenant_id = (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1));

-- 7. Permisos RBAC
INSERT INTO public.permissions (permission_code, name, module, description)
VALUES 
    ('purchases.create', 'Crear OC', 'Compras', 'Permite crear órdenes de compra.'),
    ('purchases.approve', 'Aprobar OC', 'Compras', 'Permite aprobar órdenes de compra.'),
    ('purchases.view', 'Ver OC', 'Compras', 'Permite visualizar el listado de compras.')
ON CONFLICT (permission_code) DO NOTHING;
