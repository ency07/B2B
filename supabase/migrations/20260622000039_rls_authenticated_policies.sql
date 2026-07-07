DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS clients_select_tenant ON public.clients;
    CREATE POLICY clients_select_tenant ON public.clients
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS clients_modify_tenant ON public.clients;
    CREATE POLICY clients_modify_tenant ON public.clients
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_contacts') THEN
    ALTER TABLE IF EXISTS public.client_contacts ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS client_contacts_select_tenant ON public.client_contacts;
    CREATE POLICY client_contacts_select_tenant ON public.client_contacts
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS client_contacts_modify_tenant ON public.client_contacts;
    CREATE POLICY client_contacts_modify_tenant ON public.client_contacts
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS leads_select_tenant ON public.leads;
    CREATE POLICY leads_select_tenant ON public.leads
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS leads_modify_tenant ON public.leads;
    CREATE POLICY leads_modify_tenant ON public.leads
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'diagnostic_reports') THEN
    ALTER TABLE IF EXISTS public.diagnostic_reports ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS diagnostic_reports_select_tenant ON public.diagnostic_reports;
    CREATE POLICY diagnostic_reports_select_tenant ON public.diagnostic_reports
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS diagnostic_reports_modify_tenant ON public.diagnostic_reports;
    CREATE POLICY diagnostic_reports_modify_tenant ON public.diagnostic_reports
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wizard_sessions') THEN
    ALTER TABLE IF EXISTS public.wizard_sessions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS wizard_sessions_select_tenant ON public.wizard_sessions;
    CREATE POLICY wizard_sessions_select_tenant ON public.wizard_sessions
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS wizard_sessions_modify_tenant ON public.wizard_sessions;
    CREATE POLICY wizard_sessions_modify_tenant ON public.wizard_sessions
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requirements') THEN
    ALTER TABLE IF EXISTS public.requirements ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS requirements_select_tenant ON public.requirements;
    CREATE POLICY requirements_select_tenant ON public.requirements
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS requirements_modify_tenant ON public.requirements;
    CREATE POLICY requirements_modify_tenant ON public.requirements
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
    ALTER TABLE IF EXISTS public.quotes ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS quotes_select_tenant ON public.quotes;
    CREATE POLICY quotes_select_tenant ON public.quotes
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS quotes_modify_tenant ON public.quotes;
    CREATE POLICY quotes_modify_tenant ON public.quotes
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN
    ALTER TABLE IF EXISTS public.quote_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS quote_items_select_tenant ON public.quote_items;
    CREATE POLICY quote_items_select_tenant ON public.quote_items
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS quote_items_modify_tenant ON public.quote_items;
    CREATE POLICY quote_items_modify_tenant ON public.quote_items
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'approvals') THEN
    ALTER TABLE IF EXISTS public.approvals ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS approvals_select_tenant ON public.approvals;
    CREATE POLICY approvals_select_tenant ON public.approvals
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS approvals_modify_tenant ON public.approvals;
    CREATE POLICY approvals_modify_tenant ON public.approvals
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'approval_items') THEN
    ALTER TABLE IF EXISTS public.approval_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS approval_items_select_tenant ON public.approval_items;
    CREATE POLICY approval_items_select_tenant ON public.approval_items
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS approval_items_modify_tenant ON public.approval_items;
    CREATE POLICY approval_items_modify_tenant ON public.approval_items
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS tasks_select_tenant ON public.tasks;
    CREATE POLICY tasks_select_tenant ON public.tasks
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS tasks_modify_tenant ON public.tasks;
    CREATE POLICY tasks_modify_tenant ON public.tasks
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs_gantt_tasks') THEN
    ALTER TABLE IF EXISTS public.jobs_gantt_tasks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS jobs_gantt_tasks_select_tenant ON public.jobs_gantt_tasks;
    CREATE POLICY jobs_gantt_tasks_select_tenant ON public.jobs_gantt_tasks
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS jobs_gantt_tasks_modify_tenant ON public.jobs_gantt_tasks;
    CREATE POLICY jobs_gantt_tasks_modify_tenant ON public.jobs_gantt_tasks
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
    ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS jobs_select_tenant ON public.jobs;
    CREATE POLICY jobs_select_tenant ON public.jobs
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS jobs_modify_tenant ON public.jobs;
    CREATE POLICY jobs_modify_tenant ON public.jobs
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_tasks') THEN
    ALTER TABLE IF EXISTS public.job_tasks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS job_tasks_select_tenant ON public.job_tasks;
    CREATE POLICY job_tasks_select_tenant ON public.job_tasks
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS job_tasks_modify_tenant ON public.job_tasks;
    CREATE POLICY job_tasks_modify_tenant ON public.job_tasks
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
    ALTER TABLE IF EXISTS public.inventory_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS inventory_items_select_tenant ON public.inventory_items;
    CREATE POLICY inventory_items_select_tenant ON public.inventory_items
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS inventory_items_modify_tenant ON public.inventory_items;
    CREATE POLICY inventory_items_modify_tenant ON public.inventory_items
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_transactions') THEN
    ALTER TABLE IF EXISTS public.inventory_transactions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS inventory_transactions_select_tenant ON public.inventory_transactions;
    CREATE POLICY inventory_transactions_select_tenant ON public.inventory_transactions
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS inventory_transactions_modify_tenant ON public.inventory_transactions;
    CREATE POLICY inventory_transactions_modify_tenant ON public.inventory_transactions
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS invoices_select_tenant ON public.invoices;
    CREATE POLICY invoices_select_tenant ON public.invoices
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS invoices_modify_tenant ON public.invoices;
    CREATE POLICY invoices_modify_tenant ON public.invoices
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_items') THEN
    ALTER TABLE IF EXISTS public.invoice_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS invoice_items_select_tenant ON public.invoice_items;
    CREATE POLICY invoice_items_select_tenant ON public.invoice_items
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS invoice_items_modify_tenant ON public.invoice_items;
    CREATE POLICY invoice_items_modify_tenant ON public.invoice_items
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
    ALTER TABLE IF EXISTS public.purchase_orders ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS purchase_orders_select_tenant ON public.purchase_orders;
    CREATE POLICY purchase_orders_select_tenant ON public.purchase_orders
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS purchase_orders_modify_tenant ON public.purchase_orders;
    CREATE POLICY purchase_orders_modify_tenant ON public.purchase_orders
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_order_items') THEN
    ALTER TABLE IF EXISTS public.purchase_order_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS purchase_order_items_select_tenant ON public.purchase_order_items;
    CREATE POLICY purchase_order_items_select_tenant ON public.purchase_order_items
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS purchase_order_items_modify_tenant ON public.purchase_order_items;
    CREATE POLICY purchase_order_items_modify_tenant ON public.purchase_order_items
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'warranty_registrations') THEN
    ALTER TABLE IF EXISTS public.warranty_registrations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS warranty_registrations_select_tenant ON public.warranty_registrations;
    CREATE POLICY warranty_registrations_select_tenant ON public.warranty_registrations
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS warranty_registrations_modify_tenant ON public.warranty_registrations;
    CREATE POLICY warranty_registrations_modify_tenant ON public.warranty_registrations
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS documents_select_tenant ON public.documents;
    CREATE POLICY documents_select_tenant ON public.documents
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS documents_modify_tenant ON public.documents;
    CREATE POLICY documents_modify_tenant ON public.documents
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS notifications_select_tenant ON public.notifications;
    CREATE POLICY notifications_select_tenant ON public.notifications
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS notifications_modify_tenant ON public.notifications;
    CREATE POLICY notifications_modify_tenant ON public.notifications
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketing_campaigns') THEN
    ALTER TABLE IF EXISTS public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS marketing_campaigns_select_tenant ON public.marketing_campaigns;
    CREATE POLICY marketing_campaigns_select_tenant ON public.marketing_campaigns
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS marketing_campaigns_modify_tenant ON public.marketing_campaigns;
    CREATE POLICY marketing_campaigns_modify_tenant ON public.marketing_campaigns
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_form_submissions') THEN
    ALTER TABLE IF EXISTS public.contact_form_submissions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS contact_form_submissions_select_tenant ON public.contact_form_submissions;
    CREATE POLICY contact_form_submissions_select_tenant ON public.contact_form_submissions
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS contact_form_submissions_modify_tenant ON public.contact_form_submissions;
    CREATE POLICY contact_form_submissions_modify_tenant ON public.contact_form_submissions
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'costs') THEN
    ALTER TABLE IF EXISTS public.costs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS costs_select_tenant ON public.costs;
    CREATE POLICY costs_select_tenant ON public.costs
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS costs_modify_tenant ON public.costs;
    CREATE POLICY costs_modify_tenant ON public.costs
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profitability_records') THEN
    ALTER TABLE IF EXISTS public.profitability_records ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS profitability_records_select_tenant ON public.profitability_records;
    CREATE POLICY profitability_records_select_tenant ON public.profitability_records
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS profitability_records_modify_tenant ON public.profitability_records;
    CREATE POLICY profitability_records_modify_tenant ON public.profitability_records
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS audit_logs_select_tenant ON public.audit_logs;
    CREATE POLICY audit_logs_select_tenant ON public.audit_logs
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS audit_logs_modify_tenant ON public.audit_logs;
    CREATE POLICY audit_logs_modify_tenant ON public.audit_logs
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sync_logs') THEN
    ALTER TABLE IF EXISTS public.sync_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS sync_logs_select_tenant ON public.sync_logs;
    CREATE POLICY sync_logs_select_tenant ON public.sync_logs
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS sync_logs_modify_tenant ON public.sync_logs;
    CREATE POLICY sync_logs_modify_tenant ON public.sync_logs
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_field_definitions') THEN
    ALTER TABLE IF EXISTS public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS custom_field_definitions_select_tenant ON public.custom_field_definitions;
    CREATE POLICY custom_field_definitions_select_tenant ON public.custom_field_definitions
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS custom_field_definitions_modify_tenant ON public.custom_field_definitions;
    CREATE POLICY custom_field_definitions_modify_tenant ON public.custom_field_definitions
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_field_values') THEN
    ALTER TABLE IF EXISTS public.custom_field_values ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS custom_field_values_select_tenant ON public.custom_field_values;
    CREATE POLICY custom_field_values_select_tenant ON public.custom_field_values
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS custom_field_values_modify_tenant ON public.custom_field_values;
    CREATE POLICY custom_field_values_modify_tenant ON public.custom_field_values
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'automation_rules') THEN
    ALTER TABLE IF EXISTS public.automation_rules ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS automation_rules_select_tenant ON public.automation_rules;
    CREATE POLICY automation_rules_select_tenant ON public.automation_rules
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS automation_rules_modify_tenant ON public.automation_rules;
    CREATE POLICY automation_rules_modify_tenant ON public.automation_rules
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_sequences') THEN
    ALTER TABLE IF EXISTS public.tenant_sequences ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS tenant_sequences_select_tenant ON public.tenant_sequences;
    CREATE POLICY tenant_sequences_select_tenant ON public.tenant_sequences
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS tenant_sequences_modify_tenant ON public.tenant_sequences;
    CREATE POLICY tenant_sequences_modify_tenant ON public.tenant_sequences
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branding_versions') THEN
    ALTER TABLE IF EXISTS public.branding_versions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS branding_versions_select_tenant ON public.branding_versions;
    CREATE POLICY branding_versions_select_tenant ON public.branding_versions
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS branding_versions_modify_tenant ON public.branding_versions;
    CREATE POLICY branding_versions_modify_tenant ON public.branding_versions
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_categories') THEN
    ALTER TABLE IF EXISTS public.product_categories ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS product_categories_select_tenant ON public.product_categories;
    CREATE POLICY product_categories_select_tenant ON public.product_categories
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS product_categories_modify_tenant ON public.product_categories;
    CREATE POLICY product_categories_modify_tenant ON public.product_categories
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_subcategories') THEN
    ALTER TABLE IF EXISTS public.product_subcategories ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS product_subcategories_select_tenant ON public.product_subcategories;
    CREATE POLICY product_subcategories_select_tenant ON public.product_subcategories
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS product_subcategories_modify_tenant ON public.product_subcategories;
    CREATE POLICY product_subcategories_modify_tenant ON public.product_subcategories
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_families') THEN
    ALTER TABLE IF EXISTS public.product_families ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS product_families_select_tenant ON public.product_families;
    CREATE POLICY product_families_select_tenant ON public.product_families
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS product_families_modify_tenant ON public.product_families;
    CREATE POLICY product_families_modify_tenant ON public.product_families
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_series') THEN
    ALTER TABLE IF EXISTS public.product_series ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS product_series_select_tenant ON public.product_series;
    CREATE POLICY product_series_select_tenant ON public.product_series
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS product_series_modify_tenant ON public.product_series;
    CREATE POLICY product_series_modify_tenant ON public.product_series
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS products_select_tenant ON public.products;
    CREATE POLICY products_select_tenant ON public.products
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS products_modify_tenant ON public.products;
    CREATE POLICY products_modify_tenant ON public.products
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_specifications') THEN
    ALTER TABLE IF EXISTS public.product_specifications ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS product_specifications_select_tenant ON public.product_specifications;
    CREATE POLICY product_specifications_select_tenant ON public.product_specifications
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS product_specifications_modify_tenant ON public.product_specifications;
    CREATE POLICY product_specifications_modify_tenant ON public.product_specifications
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_images') THEN
    ALTER TABLE IF EXISTS public.product_images ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS product_images_select_tenant ON public.product_images;
    CREATE POLICY product_images_select_tenant ON public.product_images
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS product_images_modify_tenant ON public.product_images;
    CREATE POLICY product_images_modify_tenant ON public.product_images
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_documents') THEN
    ALTER TABLE IF EXISTS public.product_documents ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS product_documents_select_tenant ON public.product_documents;
    CREATE POLICY product_documents_select_tenant ON public.product_documents
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS product_documents_modify_tenant ON public.product_documents;
    CREATE POLICY product_documents_modify_tenant ON public.product_documents
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_files') THEN
    ALTER TABLE IF EXISTS public.product_files ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS product_files_select_tenant ON public.product_files;
    CREATE POLICY product_files_select_tenant ON public.product_files
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS product_files_modify_tenant ON public.product_files;
    CREATE POLICY product_files_modify_tenant ON public.product_files
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'website_pages') THEN
    ALTER TABLE IF EXISTS public.website_pages ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS website_pages_select_tenant ON public.website_pages;
    CREATE POLICY website_pages_select_tenant ON public.website_pages
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS website_pages_modify_tenant ON public.website_pages;
    CREATE POLICY website_pages_modify_tenant ON public.website_pages
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'seo_metadata') THEN
    ALTER TABLE IF EXISTS public.seo_metadata ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS seo_metadata_select_tenant ON public.seo_metadata;
    CREATE POLICY seo_metadata_select_tenant ON public.seo_metadata
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS seo_metadata_modify_tenant ON public.seo_metadata;
    CREATE POLICY seo_metadata_modify_tenant ON public.seo_metadata
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'media_assets') THEN
    ALTER TABLE IF EXISTS public.media_assets ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS media_assets_select_tenant ON public.media_assets;
    CREATE POLICY media_assets_select_tenant ON public.media_assets
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS media_assets_modify_tenant ON public.media_assets;
    CREATE POLICY media_assets_modify_tenant ON public.media_assets
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS user_roles_select_tenant ON public.user_roles;
    CREATE POLICY user_roles_select_tenant ON public.user_roles
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS user_roles_modify_tenant ON public.user_roles;
    CREATE POLICY user_roles_modify_tenant ON public.user_roles
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
    ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS user_sessions_select_tenant ON public.user_sessions;
    CREATE POLICY user_sessions_select_tenant ON public.user_sessions
      FOR SELECT TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );

    DROP POLICY IF EXISTS user_sessions_modify_tenant ON public.user_sessions;
    CREATE POLICY user_sessions_modify_tenant ON public.user_sessions
      FOR ALL TO authenticated
      USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR is_platform_super_admin()
      );
  END IF;
END;
$$;
