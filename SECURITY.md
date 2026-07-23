# Security Guidelines

## 🔒 Secrets Management

### Never commit `.env` to git
- `.env` is in `.gitignore` and should never be version controlled
- Use GitHub Secrets or environment manager (Vercel, Fly.io) for real credentials

### Real credentials location
- **Local development**: Copy `.env.example` to `.env.local` and add real values
- **CI/CD**: Set environment variables via GitHub Secrets
- **Staging/Production**: Use managed environment variables (Vercel, Railway, etc.)

### Credentials in this project
Real credentials required (NEVER commit these):
- `SUPABASE_SERVICE_ROLE_KEY` — admin token for Supabase
- `SUPABASE_DB_PASSWORD` — postgres direct connection
- `GOOGLE_API_KEY` — Google APIs
- `DIAN_API_KEY` — Colombian electronic invoicing
- `RESEND_API_KEY` — transactional email
- `ADMIN_DEV_PASSWORD` — admin dev account (dev-only)

### Before deployment
1. Verify `.env` is NOT in git history
2. Set all credentials via environment manager
3. Test that app works without `.env` file present

## 🔐 Known Security Issues

See GitHub issue `[SECURITY P0] Critical Issues Blocking Production` for:
- [ ] `supabaseAdmin` RLS bypass audit (25 files)
- [ ] Cache permission TTL verification
- [ ] Logging centralization
- [ ] Rate limiting UI feedback

## References
- [Supabase Security Guide](https://supabase.com/docs/guides/api/security)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
