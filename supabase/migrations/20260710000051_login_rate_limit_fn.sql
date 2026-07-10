-- =============================================================================
-- MIGRACIÓN 51: Función atómica de rate limiting para login
-- =============================================================================
-- Extiende la tabla rate_limits (migración 43) con una función PL/pgSQL que
-- realiza INSERT ... ON CONFLICT DO UPDATE en una sola sentencia, garantizando
-- atomicidad incluso bajo concurrencia. El caller compara el count retornado
-- con su límite configurado; la decisión de bloquear queda en la capa de app.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_identifier TEXT,
  p_window_key TEXT,
  p_expires_at TIMESTAMPTZ
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.rate_limits (identifier, window_key, count, expires_at)
  VALUES (p_identifier, p_window_key, 1, p_expires_at)
  ON CONFLICT (identifier, window_key)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.check_and_increment_rate_limit IS
  'Incrementa atómicamente el contador de rate limiting para un identificador '
  'y ventana temporal. Retorna el nuevo count. Usar con INSERT ON CONFLICT '
  'garantiza atomicidad frente a requests concurrentes. El único índice UNIQUE '
  'en (identifier, window_key) actúa como mutex de facto.';
