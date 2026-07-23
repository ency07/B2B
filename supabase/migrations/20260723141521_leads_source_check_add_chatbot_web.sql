-- W-002 (chatbot sin captura de leads): agrega 'Chatbot Web' como lead_source
-- válido, siguiendo el mismo patrón ya usado para 'Cotizador Web' (una fuente
-- específica por herramienta, en vez de agrupar todo en 'Otro').
ALTER TABLE public.leads DROP CONSTRAINT leads_lead_source_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_lead_source_check
  CHECK (((lead_source)::text = ANY ((ARRAY[
    'Google Ads'::character varying,
    'SEO'::character varying,
    'LinkedIn'::character varying,
    'WhatsApp'::character varying,
    'Facebook'::character varying,
    'Instagram'::character varying,
    'Email Marketing'::character varying,
    'Directo'::character varying,
    'Referido'::character varying,
    'Distribuidor'::character varying,
    'Cotizador Web'::character varying,
    'Chatbot Web'::character varying,
    'Otro'::character varying
  ])::text[])));
