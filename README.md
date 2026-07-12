# ERP B2B Premium

A modern, multi-tenant Enterprise Resource Planning (ERP) platform built for B2B companies. Combines CRM, inventory management, invoicing, and customer portal capabilities in a single, scalable application.

## 🎯 Overview

**ERP B2B Premium** is a Next.js-based SaaS ERP tailored for B2B companies that need:

- **Multi-tenant isolation**: Complete data segregation across independent companies
- **Role-based access control**: Fine-grained permissions (SUPER_ADMIN, EJECUTIVO_COMERCIAL, etc.)
- **Multi-language support**: Spanish/English UI with internationalization ready
- **Real-time collaboration**: Live inventory, quote, and invoice tracking
- **Customer portal**: Self-service portal for clients to track orders and invoices

### Three Core Modules

1. **Web Module** (`src/web/`): Public-facing marketing and wizard (onboarding)
2. **ERP Module** (`src/erp/`): Internal dashboard for company staff (sales, inventory, finance)
3. **Portal Module** (`src/portal/`): Customer-facing portal for order tracking and invoices

## 🛠 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 20+ |
| **Framework** | Next.js | 16.2.9 |
| **Language** | TypeScript | 5.9.3 |
| **Database** | Supabase (PostgreSQL) | 14+ |
| **Authentication** | Supabase Auth | JWT-based |
| **Styling** | Tailwind CSS | 4.3.1 |
| **Components** | shadcn/ui + Radix UI | Latest |
| **State Management** | React Hooks + Context | Built-in |
| **Forms** | React Hook Form + Zod | 7.79.0 / 4.4.3 |
| **Tables** | TanStack React Table | 8.21.3 |
| **Charts** | Recharts | 3.8.1 |
| **PDF Export** | jsPDF | 4.2.1 |
| **Notifications** | Sonner | 2.0.7 |
| **Error Tracking** | Sentry | 10.65.0 |
| **Testing** | Vitest + Playwright | 3.1.3 / 1.61.1 |
| **Linting** | ESLint | 9.39.4 |

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Supabase account (local dev via `supabase start` or remote project)
- Environment variables configured

### Installation

```bash
# Clone the repository
git clone https://github.com/ency07/B2B.git
cd B2B

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials, Sentry keys, etc.

# Run Supabase migrations (if using local dev)
supabase migration up

# Seed development data (optional)
npm run seed:admin-dev
```

### Development

```bash
# Start dev server with HMR
npm run dev

# Open browser
# ERP: http://localhost:3000/login
# Portal: http://localhost:3000/portal/login
# Marketing: http://localhost:3000/

# Run tests in watch mode
npm run test:watch

# Run type checking
npx tsc --noEmit

# Run linting
npm run lint
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server locally
npm start

# Build output: .next/standalone (ready for Docker)
```

## 📁 Project Structure

```
E--qwen-Ollama/
├── docs/                           # Documentation (architecture, specs, guides)
│   ├── 01_vision/                 # Project vision and goals
│   ├── 04_arquitectura/           # Architecture docs
│   │   └── ADRs/                  # Architecture Decision Records
│   └── 30_configuracion_global/   # Global configuration
├── public/                        # Static assets (images, fonts)
├── scripts/                       # Development and automation scripts
│   ├── test-*.ts                  # Feature test scripts
│   ├── seed-*.ts                  # Database seeding scripts
│   └── test-sentry.ts             # Sentry integration test
├── src/
│   ├── app/                       # Next.js App Router (routes and layouts)
│   │   ├── (auth)/                # Public auth routes (/login, /recovery)
│   │   ├── (dashboard)/           # ERP dashboard routes (/dashboard/*)
│   │   ├── api/                   # API routes
│   │   ├── portal/                # Portal routes (/portal)
│   │   ├── layout.tsx             # Root layout
│   │   ├── loading.tsx            # Root loading state
│   │   └── global-error.tsx       # Global error handler with Sentry
│   ├── erp/                       # ERP module (internal dashboard)
│   │   ├── actions/               # Server actions for ERP (auth, CRUD)
│   │   ├── components/            # Shared ERP components
│   │   ├── features/              # ERP features (leads, quotes, jobs)
│   │   └── middleware/            # Auth guards for ERP routes
│   ├── portal/                    # Portal module (customer portal)
│   │   ├── actions/               # Server actions for portal
│   │   ├── components/            # Portal UI components
│   │   │   └── dashboard/         # Portal dashboard components
│   │   ├── features/              # Portal features
│   │   └── middleware/            # Portal auth guards
│   ├── web/                       # Web module (public site, wizard)
│   │   ├── actions/               # Web server actions
│   │   ├── components/            # Web components
│   │   └── features/              # Marketing features
│   ├── platform/                  # Shared platform layer
│   │   ├── auth/                  # Authentication utilities
│   │   ├── middleware/            # Shared middleware
│   │   ├── tenant/                # Tenant resolution
│   │   └── branding/              # White-label branding
│   ├── design-system/             # Design system (UI components, tokens)
│   │   ├── components/            # Reusable UI components
│   │   ├── provider/              # Theme providers
│   │   └── index.ts               # Design system exports
│   ├── lib/                       # Utilities and helpers
│   │   ├── routes.ts              # Route constants (type-safe)
│   │   ├── utils.ts               # Helper functions
│   │   └── analytics.ts           # Analytics tracking
│   ├── features/                  # Feature modules (cross-module)
│   │   ├── clients/               # Client list views
│   │   ├── crm/                   # CRM features (leads, deals)
│   │   └── invoices/              # Invoice views
│   ├── tests/                     # Test suites
│   │   ├── security/              # Security & concurrency tests
│   │   │   ├── concurrency.test.ts
│   │   │   ├── stress-routes.test.ts
│   │   │   ├── data-consistency.test.ts
│   │   │   └── concurrency.spec.ts (Playwright)
│   │   └── unit/                  # Unit tests
│   ├── instrumentation.ts         # Sentry initialization hook
│   ├── instrumentation-client.ts  # Client-side Sentry setup
│   ├── sentry.server.config.ts    # Server Sentry config
│   └── sentry.edge.config.ts      # Edge Sentry config
├── .env.example                   # Environment variables template
├── .env.local                     # Environment variables (local, gitignored)
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── next.config.ts                 # Next.js configuration
├── vitest.config.ts               # Vitest configuration
├── playwright.config.ts           # Playwright configuration
└── README.md                      # This file
```

## 📋 Key Commands

### Development
```bash
npm run dev              # Start development server (HMR enabled)
npm run build            # Build for production
npm start                # Run production build locally
npm run lint             # Run ESLint
```

### Testing
```bash
npm run test             # Run all unit tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run Playwright E2E tests (when defined)
npm run test:sentry      # Test Sentry integration
```

### Database & Seeds
```bash
npm run seed:admin-dev        # Seed admin user and test data
npm run seed:test             # Seed test users
npm run seed:test:clean       # Remove test data
npm run test:multitenant      # Test multi-tenant isolation
```

### Audit & Security
```bash
npm run audit:security        # Audit packages for vulnerabilities
npm run audit:outdated        # Check for outdated packages
npm run test:security-audit   # Run security test suite
```

## 🔐 Security & Multi-Tenancy

The platform implements **Row Level Security (RLS)** at the database layer:

- **Tenant Isolation**: Every table has a `tenant_id` column with RLS policies
- **JWT Context**: Tenant is resolved via `auth.jwt()->>'tenant_id'`
- **Subquery Resolution**: Complex tenant lookups use multi-table subqueries (ADR 003)
- **Global Catalog**: Products are shared across tenants; pricing is per-tenant (ADR 002)

See `docs/04_arquitectura/ADRs/` for detailed architecture decisions.

## 🌐 Environment Variables

Key environment variables (see `.env.example` for full list):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxxx
SENTRY_DSN=https://xxxxx:xxxxx@xxxxx.ingest.sentry.io/xxxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token

# Email & Notifications
RESEND_API_KEY=your-resend-key
NEXT_PUBLIC_WHATSAPP_NUMBER=your-whatsapp-number

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 📚 Documentation

- **[ADRs](docs/04_arquitectura/ADRs/)**: Architecture Decision Records
- **[Security Model](docs/04_arquitectura/SECURITY_MODEL.md)**: Security architecture
- **[Tenant Isolation](docs/04_arquitectura/TENANT_ISOLATION_MODEL.md)**: Multi-tenancy details
- **[RLS Model](docs/04_arquitectura/CLIENTS_RLS_MODEL.md)**: Row Level Security policies
- **[Events & Audit](docs/04_arquitectura/CLIENTS_EVENTS_MODEL.md)**: Event tracking system
- **[Business Rules](docs/06_reglas_negocio/)**: Domain-specific rules

## 🧪 Testing Strategy

### Unit & Integration Tests (Vitest)
- Located in `src/tests/`
- Run with `npm run test`
- Cover:
  - Multi-tenant isolation (RLS enforcement)
  - Data consistency under concurrent writes
  - Rate limiting logic
  - Auth flows

### E2E Tests (Playwright)
- Located in `src/tests/*.spec.ts`
- Run E2E tests (when configured): `npm run test:e2e`
- Cover:
  - Real browser workflows (login, navigation)
  - Cross-tenant isolation at UI level
  - Portal and ERP user flows

### Security Tests
- Run with `npm run test:security-audit`
- Stress-test concurrent operations
- Validate data consistency under load

## 🚀 Deployment

### Docker
The build output is optimized for Docker:
```dockerfile
FROM node:20-alpine
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]
```

### Vercel
Optimized for Vercel deployment:
```bash
vercel deploy
```

### Environment-Specific Configs
- **Development**: Local Supabase, verbose logging
- **Staging**: Remote Supabase, Sentry integration
- **Production**: CDN caching, Sentry error tracking, rate limiting

## 💡 Architecture Highlights

### Server Actions (Next.js 13+)
- All mutations use typed server actions with Zod validation
- Example: `src/erp/actions/leads-erp.ts`

### Type-Safe Routing
- Route constants in `src/lib/routes.ts` (imported everywhere)
- Prevents hardcoded URL strings, catches typos at build time

### Design System
- Centralized UI components in `src/design-system/`
- shadcn/ui + custom Tailwind tokens
- White-label customization via branding bridge

### Middleware
- Auth guards for protected routes
- Tenant resolution middleware
- Request logging and rate limiting

## 📞 Support

For issues, questions, or contributions:

- **GitHub Issues**: [Report bugs](https://github.com/ency07/B2B/issues)
- **Email**: support@example.com
- **Documentation**: See `docs/` directory

## 📄 License

Proprietary. All rights reserved.

---

**Last Updated**: July 12, 2026
**Version**: 1.0.0
**Status**: Production Ready
