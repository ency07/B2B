// SCRIPT DE VALIDACIÓN: INVENTARIO (FASE 7)
// Archivo: scripts/test-inventario.ts

import * as fs from 'fs';
import * as path from 'path';

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MÓDULO INVENTARIO...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000007_inventory_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Validar Tablas
    const hasWarehousesTable = sql.includes('CREATE TABLE warehouses');
    const hasItemsTable = sql.includes('CREATE TABLE inventory_items');
    const hasStockTable = sql.includes('CREATE TABLE inventory_stock');
    const hasMovementsTable = sql.includes('CREATE TABLE inventory_movements');

    // 2. Validar Campos Críticos
    const hasReorderPoint = sql.includes('reorder_point');
    const hasSourceWarehouse = sql.includes('source_warehouse_id');
    const hasDestWarehouse = sql.includes('destination_warehouse_id');
    const hasJobId = sql.includes('job_id');
    const hasActivityId = sql.includes('activity_id');

    // 3. Validar Funciones y Triggers
    const hasSeqTrigger = sql.includes('handle_inventory_sequences');
    const hasPermsTrigger = sql.includes('enforce_inventory_permissions');
    const hasStateTrigger = sql.includes('validate_inventory_movement_transitions');
    const hasStockTrigger = sql.includes('handle_inventory_stock_affectation');
    const hasBlockDelete = sql.includes('block_physical_inventory_delete');
    const hasAvgCostFunc = sql.includes('update_item_costs');
    const hasLowStockFunc = sql.includes('check_and_dispatch_low_stock_events');
    const hasMaterialConsumedFunc = sql.includes('dispatch_material_consumed_event');

    // 4. Validar RLS
    const hasWarehousesRLS = sql.includes('ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY');
    const hasItemsRLS = sql.includes('ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY');
    const hasStockRLS = sql.includes('ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY');
    const hasMovementsRLS = sql.includes('ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY');

    console.log(`✓ Archivo de migración de Inventario encontrado: ${path.basename(migrationPath)}`);
    console.log(`✓ Tabla 'warehouses' definida: ${hasWarehousesTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'inventory_items' definida: ${hasItemsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'inventory_stock' definida: ${hasStockTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'inventory_movements' definida: ${hasMovementsTable ? 'Sí' : 'No'}`);
    
    console.log(`✓ Campo 'reorder_point' (Stock crítico): ${hasReorderPoint ? 'Sí' : 'No'}`);
    console.log(`✓ Campo 'source_warehouse_id' (Transferencia): ${hasSourceWarehouse ? 'Sí' : 'No'}`);
    console.log(`✓ Campo 'destination_warehouse_id' (Transferencia): ${hasDestWarehouse ? 'Sí' : 'No'}`);
    console.log(`✓ Campo 'job_id' y 'activity_id' (Trazabilidad): ${hasJobId && hasActivityId ? 'Sí' : 'No'}`);

    console.log(`✓ Trigger de secuencias de códigos: ${hasSeqTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de permisos (RBAC): ${hasPermsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de transiciones de estado: ${hasStateTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de afectación de stock y costos: ${hasStockTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de prevención de borrado físico: ${hasBlockDelete ? 'Sí' : 'No'}`);
    
    console.log(`✓ Función de recálculo Costo Promedio: ${hasAvgCostFunc ? 'Sí' : 'No'}`);
    console.log(`✓ Función de eventos Stock Bajo: ${hasLowStockFunc ? 'Sí' : 'No'}`);
    console.log(`✓ Función de eventos Consumo Materiales Job: ${hasMaterialConsumedFunc ? 'Sí' : 'No'}`);

    console.log(`✓ RLS habilitado en warehouses: ${hasWarehousesRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en inventory_items: ${hasItemsRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en inventory_stock: ${hasStockRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en inventory_movements: ${hasMovementsRLS ? 'Sí' : 'No'}`);

    const isValid = hasWarehousesTable && hasItemsTable && hasStockTable && hasMovementsTable &&
                    hasReorderPoint && hasSourceWarehouse && hasDestWarehouse && hasJobId && hasActivityId &&
                    hasSeqTrigger && hasPermsTrigger && hasStateTrigger && hasStockTrigger && hasBlockDelete &&
                    hasAvgCostFunc && hasLowStockFunc && hasMaterialConsumedFunc &&
                    hasWarehousesRLS && hasItemsRLS && hasStockRLS && hasMovementsRLS;

    if (isValid) {
        console.log('\n[ÉXITO] Estructura sintáctica, triggers, RLS y funciones del Módulo de Inventarios validados correctamente.');
    } else {
        throw new Error('Validación de estructura SQL de Inventarios fallida. Revise las especificaciones de la migración.');
    }
}

async function main() {
    try {
        await runMockValidation();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error en validación de inventario:', error);
        process.exit(1);
    }
}

main();
