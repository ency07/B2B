-- SEMILLA DE DATOS: PERMISOS, ROLES GLOBALES Y FUNCIONES DE CATÁLOGOS POR DEFECTO
-- Archivo: supabase/migrations/20260617000001_seed_master_data.sql

-- 1. Insertar Catálogo de Permisos Estándar
INSERT INTO permissions (permission_code, name, module, description) VALUES
-- Módulo Tenants y Seguridad
('tenants.create', 'Crear Empresa (Tenant)', 'Plataforma', 'Permite registrar nuevas empresas en el ecosistema.'),
('tenants.view', 'Ver Empresas (Tenants)', 'Plataforma', 'Permite consultar la lista global de empresas.'),
('tenants.settings', 'Configurar Empresa', 'Plataforma', 'Permite editar parámetros de la empresa propia.'),
('users.create', 'Crear Usuarios', 'Seguridad', 'Permite registrar nuevos usuarios dentro de la empresa.'),
('users.edit', 'Editar Usuarios', 'Seguridad', 'Permite actualizar perfiles de usuarios de la empresa.'),
('users.permissions', 'Gestionar Permisos', 'Seguridad', 'Permite modificar roles y excepciones de permisos a usuarios.'),
-- Módulo Comercial
('clients.create', 'Crear Clientes', 'Comercial', 'Permite registrar nuevos clientes B2B.'),
('clients.edit', 'Editar Clientes', 'Comercial', 'Permite actualizar datos de clientes existentes.'),
('clients.view', 'Consultar Clientes', 'Comercial', 'Permite ver fichas y contactos de clientes.'),
('quotes.create', 'Crear Cotizaciones', 'Comercial', 'Permite elaborar nuevas propuestas comerciales.'),
('quotes.approve', 'Aprobar Cotizaciones', 'Comercial', 'Permite firmar digitalmente y aprobar propuestas.'),
('quotes.view', 'Ver Cotizaciones', 'Comercial', 'Permite consultar el catálogo e histórico de cotizaciones.'),
-- Módulo Operaciones
('jobs.create', 'Crear Trabajos', 'Operaciones', 'Permite abrir nuevas órdenes de trabajo de ingeniería.'),
('jobs.manage', 'Gestionar Ejecución', 'Operaciones', 'Permite programar y cambiar estados de trabajos.'),
('jobs.close', 'Cerrar Trabajos', 'Operaciones', 'Permite realizar el cierre técnico y financiero de una obra.'),
('documents.upload', 'Cargar Evidencias y Actas', 'Operaciones', 'Permite subir actas de entrega, planos y fotos de obra.'),
('documents.view', 'Consultar Módulo Documental', 'Operaciones', 'Permite buscar y descargar archivos asociados.'),
-- Módulo Inventario
('items.manage', 'Gestionar Catálogo de Items', 'Inventario', 'Permite crear y deshabilitar materiales y repuestos.'),
('inventory.movement', 'Registrar Entradas/Salidas', 'Inventario', 'Permite operar el kardex y movimientos de almacén.'),
('inventory.view', 'Consultar Existencias', 'Inventario', 'Permite ver el stock en tiempo real en todas las bodegas.'),
-- Módulo Finanzas
('invoices.create', 'Emitir Facturas', 'Finanzas', 'Permite generar facturas de cobro asociadas a cotizaciones.'),
('payments.confirm', 'Confirmar Recaudos', 'Finanzas', 'Permite validar y conciliar comprobantes de pago de clientes.'),
('payments.view', 'Consultar Historial Cartera', 'Finanzas', 'Permite ver saldos pendientes de facturas y anticipos.'),
-- Módulo Auditoría
('audit.view_global', 'Auditar Plataforma', 'Auditoría', 'Permite ver logs de auditoría de todas las empresas.'),
('audit.view_tenant', 'Auditar Empresa', 'Auditoría', 'Permite ver logs de auditoría de la empresa propia.')
ON CONFLICT (permission_code) DO NOTHING;

-- 2. Insertar Roles Globales (donde tenant_id IS NULL)
INSERT INTO roles (tenant_id, role_code, name, description, status) VALUES
(NULL, 'SUPER_ADMIN', 'Super Administrador de Plataforma', 'Administrador global del ecosistema y los tenants.', 'Activo'),
(NULL, 'ADMIN_EMPRESA', 'Administrador de Empresa', 'Gestor administrativo y de usuarios dentro de la empresa propia.', 'Activo'),
(NULL, 'GERENTE_GENERAL', 'Gerente General', 'Visualización completa de KPIs y máxima jerarquía de aprobación.', 'Activo'),
(NULL, 'DIRECTOR_COMERCIAL', 'Director Comercial', 'Responsable del embudo de ventas y aprobación comercial intermedia.', 'Activo'),
(NULL, 'EJECUTIVO_COMERCIAL', 'Ejecutivo Comercial', 'Creación de leads, cotizaciones y seguimiento de clientes.', 'Activo'),
(NULL, 'DIRECTOR_OPERACIONES', 'Director de Operaciones', 'Responsable de la ejecución de proyectos y cierre de trabajos.', 'Activo'),
(NULL, 'TECNICO_CAMPO', 'Técnico de Campo', 'Visualización de cronogramas y registro de bitácoras de obra.', 'Activo'),
(NULL, 'ALMACENISTA', 'Almacenista / Jefe de Bodega', 'Control de existencias, bodegas y movimientos de inventario.', 'Activo'),
(NULL, 'AUDITOR', 'Auditor de Procesos', 'Consulta de logs de auditoría de sólo lectura.', 'Activo'),
(NULL, 'CLIENTE', 'Cliente Externo B2B', 'Perfil de autoservicio para cotizaciones, pagos y garantías.', 'Activo')
ON CONFLICT (tenant_id, role_code) DO NOTHING;

-- 3. Crear Función de Inicialización de Catálogo de Áreas Estándar
CREATE OR REPLACE FUNCTION seed_tenant_standard_areas(target_tenant_id uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO areas (tenant_id, area_code, name, description, status) VALUES
    (target_tenant_id, 'DIR-GEN', 'Dirección General', 'Gerencia general y planeación estratégica.', 'Activo'),
    (target_tenant_id, 'COM', 'Comercial', 'Ventas, marketing y fidelización de clientes.', 'Activo'),
    (target_tenant_id, 'ING', 'Ingeniería', 'Diseño de sistemas de aire acondicionado y ventilación.', 'Activo'),
    (target_tenant_id, 'PROY', 'Proyectos', 'Montaje e instalaciones de sistemas mecánicos industriales.', 'Activo'),
    (target_tenant_id, 'OPER', 'Operaciones', 'Logística de técnicos de campo y coordinación de servicios.', 'Activo'),
    (target_tenant_id, 'MANT', 'Mantenimiento', 'Mantenimiento predictivo, preventivo y correctivo de equipos.', 'Activo'),
    (target_tenant_id, 'INV', 'Inventario', 'Administración de materias primas, repuestos y herramientas.', 'Activo'),
    (target_tenant_id, 'COMP', 'Compras', 'Abastecimiento de insumos y evaluación de proveedores.', 'Activo'),
    (target_tenant_id, 'CAL', 'Calidad', 'Aseguramiento de estándares técnicos e interventoría.', 'Activo'),
    (target_tenant_id, 'FIN', 'Finanzas', 'Presupuestos, costos, contabilidad y facturación.', 'Activo'),
    (target_tenant_id, 'CART', 'Cartera', 'Control de recaudos, pasarela y cobro administrativo.', 'Activo'),
    (target_tenant_id, 'TH', 'Talento Humano', 'Selección, contratación y bienestar del personal.', 'Activo'),
    (target_tenant_id, 'TI', 'TI', 'Soporte informático e infraestructura digital.', 'Activo'),
    (target_tenant_id, 'SAC', 'Servicio al Cliente', 'Atención postventa, garantías y reclamos.', 'Activo')
    ON CONFLICT (tenant_id, area_code) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
