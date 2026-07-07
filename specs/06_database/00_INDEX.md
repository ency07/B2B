# DATA ARCHITECTURE — Arquitectura de Datos

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Base de Datos | PostgreSQL (vía Supabase) | 15+ |
| SDK | Supabase JS | v2 |
| Auth | Supabase Auth (GoTrue) | — |
| Storage | Supabase Storage (S3-compatible) | — |
| Realtime | Supabase Realtime (WebSockets) | — |
| Migraciones | Supabase CLI | Última |

---

## Estructura de archivos

| Archivo | Contenido |
|---|---|
| `00_INDEX.md` | Índice maestro, arquitectura general |
| `01_NAMING_CONVENTIONS.md` | Convenciones de nomenclatura |
| `02_TABLES_AUTH_CORE.md` | Tenants, usuarios, roles, permisos, auditoría |
| `03_TABLES_CRM.md` | Leads, clientes, empresas, contactos |
| `04_TABLES_QUOTES_REQUIREMENTS.md` | Requerimientos, cotizaciones, versiones |
| `05_TABLES_JOBS.md` | Órdenes de trabajo, checklist, producción |
| `06_TABLES_INVENTORY.md` | Productos, stock, movimientos, kardex, bodegas |
| `07_TABLES_PURCHASES.md` | Proveedores, solicitudes, OC, recepción |
| `08_TABLES_INVOICING.md` | Facturas, pagos, NC, cartera, anticipos |
| `09_TABLES_PORTAL_CMS.md` | CMS, blog, garantías, tickets, banners |
| `10_RLS_POLICIES.md` | Políticas Row Level Security |
| `11_TRIGGERS_FUNCTIONS.md` | Triggers, funciones, RPC, secuencias |
| `12_INDEXES_CONSTRAINTS.md` | Índices, constraints, rendimiento |
| `13_STORAGE_BUCKETS.md` | Arquitectura de storage, buckets |

---

## Arquitectura general

### Esquemas

```
┌─────────────────────────────────────────────────────┐
│                        auth                          │
│  (Schema de Supabase: usuarios, sesiones, tokens)    │
├─────────────────────────────────────────────────────┤
│                       public                         │
│  Todas las tablas operacionales del ERP              │
│  • tenants, users_profiles, roles, permissions       │
│  • leads, clients, companies, contacts               │
│  • requirements, quotes, quote_versions              │
│  • jobs, job_tasks, job_checklists, job_materials    │
│  • products, stock, movements, kardex, warehouses    │
│  • suppliers, purchase_requests, purchase_orders     │
│  • invoices, payments, credit_notes, anticipos       │
│  • warranty, tickets, cms_pages, blog_posts          │
│  • audit_log, business_events, tenant_settings       │
├─────────────────────────────────────────────────────┤
│                      storage                         │
│  (Schema de Supabase: buckets, objetos, políticas)   │
└─────────────────────────────────────────────────────┘
```

### Principios de diseño

1. **Toda tabla operacional tiene `tenant_id`.**
2. **Toda tabla operacional tiene `created_by`, `updated_by`.**
3. **Toda tabla operacional usa soft delete (`deleted_at`, `deleted_by`, `delete_reason`).**
4. **Delete físico prohibido en tablas operacionales.**
5. **`audit_log` registra toda mutación con diff JSONB.**
6. **`business_events` registra todo hito de negocio.**
7. **RLS activo en todas las tablas con datos sensibles.**
8. **Códigos secuenciales por tenant via `tenant_sequences`.**
9. **UUID como primary keys.**
10. **Timestamps con `timestamptz` (UTC).**
