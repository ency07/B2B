-- P-004 (perfil de contacto solo lectura): hoy no existe ninguna política RLS
-- que permita a un contacto de portal hacer UPDATE de su propia fila en
-- client_contacts — todas las políticas de UPDATE (cc_tenant_write,
-- contacts_update_tenant) exigen una fila coincidente en public.users, que es
-- la tabla de PERSONAL del ERP, no de contactos de portal. Sin esta política,
-- updateClientContactName() fallaría en silencio (0 filas afectadas).
--
-- Alcance deliberadamente angosto: la política permite UPDATE de la fila
-- propia (auth_user_id = auth.uid()), pero como RLS no restringe columnas
-- individuales, un trigger separado hace auth_user_id y tenant_id inmutables
-- sin importar quién escriba (incluye escrituras de staff/service_role) —
-- así esta política no se convierte en una puerta para que un contacto
-- cambie a qué tenant/cuenta de login pertenece su propia fila vía una
-- llamada cruda a PostgREST. email y client_id NO se protegen aquí a
-- propósito: no hay evidencia de que el ERP dependa de poder cambiarlos vía
-- UPDATE simple, pero tampoco se confirmó que no lo haga, así que no se
-- tocan para no romper un flujo de staff existente. El único código que
-- escribe a través de esta política nueva (updateClientContactName) solo
-- envía first_name/last_name.

CREATE OR REPLACE FUNCTION public.protect_client_contact_immutable_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
    RAISE EXCEPTION 'No se puede modificar auth_user_id de un contacto existente.';
  END IF;
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'No se puede modificar tenant_id de un contacto existente.';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_contact_immutable_columns ON public.client_contacts;
CREATE TRIGGER trg_protect_contact_immutable_columns
  BEFORE UPDATE ON public.client_contacts
  FOR EACH ROW EXECUTE FUNCTION public.protect_client_contact_immutable_columns();

CREATE POLICY cc_self_update ON public.client_contacts
  FOR UPDATE
  USING (auth_user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (auth_user_id = auth.uid());
