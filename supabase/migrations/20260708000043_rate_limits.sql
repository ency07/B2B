-- Rate limiting table for persistent serverless rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    window_key TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Unique constraint for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier_window
ON public.rate_limits (identifier, window_key);

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at
ON public.rate_limits (expires_at);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only platform admins can read rate limits
CREATE POLICY "rate_limits_select_admin"
ON public.rate_limits FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.user_roles ur ON ur.user_id = u.id
        JOIN public.roles r ON r.id = ur.role_id
        WHERE u.auth_user_id = auth.uid()
        AND r.role_code IN ('SUPER_ADMIN', 'ADMIN_DEV')
    )
);

-- Service role can do everything (for server-side rate limiting)
CREATE POLICY "rate_limits_service_role"
ON public.rate_limits FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');