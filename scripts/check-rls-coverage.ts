import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const TABLES_CHECK = [
  "clients", "client_contacts", "leads", "diagnostic_reports", "wizard_sessions",
  "requirements", "quotes", "quote_items", "approvals", "approval_items",
  "jobs", "job_tasks", "inventory_items", "inventory_transactions",
  "invoices", "invoice_items", "purchase_orders", "purchase_order_items",
  "warranty_registrations", "documents", "notifications", "marketing_campaigns",
  "contact_form_submissions", "costs", "profitability_records", "audit_logs",
  "sync_logs", "custom_field_definitions", "custom_field_values", "automation_rules",
  "tenant_sequences", "branding_versions",
  "product_categories", "product_subcategories", "product_families", "product_series",
  "products", "product_specifications", "product_images", "product_documents",
  "product_files", "website_pages", "seo_metadata", "media_assets",
  "user_roles", "user_sessions", "tenant_settings",
];

async function checkRls() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas");
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const missing: string[] = [];
  const noPolicies: string[] = [];

  console.log(`\n🔍 Verificando cobertura RLS...\n`);

  // Query all tables with their RLS status and policy count
  const sql = `
    SELECT
      t.tablename::text AS table_name,
      t.rowsecurity::boolean AS rls_enabled,
      COUNT(p.policyname)::int AS policy_count
    FROM pg_tables t
    LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
    WHERE t.schemaname = 'public'
      AND t.tablename = ANY($1)
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename;
  `;

  // Use raw SQL via rpc
  const { error: _sqlErr } = await admin.rpc("exec_sql", {
    query: sql,
    params: [TABLES_CHECK],
  });
  if (_sqlErr) {
    // Fallback: try direct query or use information_schema
    console.warn("⚠️  No se pudo ejecutar query directa. Intentando con information_schema...");
  }

  // Fallback approach: query via information_schema
  for (const table of TABLES_CHECK) {
    const { data: tableData } = await admin
      .from("information_schema.tables")
      .select("table_name, table_type, is_insertable_into")
      .eq("table_schema", "public")
      .eq("table_name", table);

    if (!tableData || tableData.length === 0) {
      console.log(`  ⚠️  ${table}: no existe (omitido)`);
      continue;
    }

    const { data: rlsData } = await admin.rpc("exec_sql", {
      query: `
        SELECT t.rowsecurity
        FROM pg_tables t
        WHERE t.schemaname = 'public' AND t.tablename = '${table.replace(/'/g, "''")}';
      `,
      params: [],
    });

    let rlsEnabled = false;
    if (rlsData) {
      rlsEnabled = Array.isArray(rlsData) ? rlsData[0]?.rowsecurity : false;
    }

    if (!rlsEnabled) {
      console.log(`  ❌ ${table}: RLS DESHABILITADO`);
      missing.push(table);
      continue;
    }

    // Check policies for authenticated role
    const { data: policies } = await admin.rpc("exec_sql", {
      query: `
        SELECT p.policyname, p.cmd, p.roles
        FROM pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename = '${table.replace(/'/g, "''")}'
        ORDER BY p.policyname;
      `,
      params: [],
    });

    const policyList = Array.isArray(policies) ? policies : [];

    if (policyList.length === 0) {
      console.log(`  ⚠️  ${table}: RLS habilitado pero sin políticas`);
      noPolicies.push(table);
    } else {
      const authCount = policyList.filter(
        (p: { roles: string[] }) => p.roles && p.roles.includes("authenticated")
      ).length;
      const anonCount = policyList.filter(
        (p: { roles: string[] }) => p.roles && p.roles.includes("anon")
      ).length;
      console.log(
        `  ✅ ${table}: RLS activo | ${policyList.length} políticas` +
          (authCount > 0 ? ` | ${authCount} para authenticated` : "") +
          (anonCount > 0 ? ` | ${anonCount} para anon` : "")
      );
    }
  }

  console.log("\n========== RESUMEN ==========");
  if (missing.length === 0 && noPolicies.length === 0) {
    console.log("✅ Todas las tablas verificadas tienen RLS habilitado con políticas.");
    process.exit(0);
  }
  if (missing.length > 0) {
    console.log(`❌ ${missing.length} tabla(s) sin RLS habilitado:`);
    missing.forEach((t) => console.log(`   - ${t}`));
  }
  if (noPolicies.length > 0) {
    console.log(`⚠️  ${noPolicies.length} tabla(s) con RLS habilitado pero sin políticas:`);
    noPolicies.forEach((t) => console.log(`   - ${t}`));
  }
  process.exit(missing.length > 0 ? 1 : 0);
}

checkRls().catch((err) => {
  console.error("Error ejecutando check-rls-coverage:", err);
  process.exit(1);
});
