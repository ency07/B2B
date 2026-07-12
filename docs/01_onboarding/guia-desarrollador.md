# Guía de Onboarding para Desarrolladores

Bienvenido al proyecto **ERP B2B Premium**. Esta guía te preparará para contribuir efectivamente.

## 📖 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Multi-Tenancy](#multi-tenancy)
3. [Diferencias: Web, ERP y Portal](#diferencias-web-erp-y-portal)
4. [Primeros Pasos](#primeros-pasos)
5. [Agregar una Nueva Tabla con RLS](#agregar-una-nueva-tabla-con-rls)
6. [Crear una Server Action](#crear-una-server-action)
7. [Debugging](#debugging)
8. [Recursos](#recursos)

---

## Arquitectura General

### Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL con RLS)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod (validación)
- **Authentication**: Supabase Auth (JWT)

### Estructura de Carpetas

```
src/
├── app/                 # Next.js routes (páginas públicas, auth, dashboards)
├── erp/                 # Módulo ERP (dashboard interno)
├── portal/              # Módulo Portal (portal de clientes)
├── web/                 # Módulo Web (marketing, wizard)
├── platform/            # Capa compartida (auth, middleware, tenant)
├── design-system/       # Componentes UI reutilizables
├── lib/                 # Utilidades (routes.ts, helpers, analytics)
├── features/            # Características transversales (crm, invoices)
└── tests/               # Pruebas (Vitest + Playwright)
```

---

## Multi-Tenancy

### ¿Qué es un Tenant?

Un **tenant** es una empresa/organización independiente usando la plataforma. Cada tenant tiene:
- Sus propios datos (clientes, órdenes, empleados, etc.)
- Sus propios precios y configuración
- Sus propias credenciales de acceso

### Aislamiento via RLS (Row Level Security)

PostgreSQL/Supabase fuerza el aislamiento a nivel de base de datos mediante **políticas RLS**:

```sql
-- Ejemplo: tabla 'jobs' (órdenes de trabajo)
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients,
  tenant_id UUID REFERENCES tenants,  -- 👈 Clave para aislamiento
  code TEXT UNIQUE,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: un usuario solo ve datos de su tenant
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_tenant_isolation ON jobs
  USING (tenant_id = auth.jwt()->>'tenant_id');
```

**Significa**: Aunque ejecutes `SELECT * FROM jobs`, PostgreSQL te retorna solo filas donde `tenant_id` coincide con el de tu JWT.

### El JWT Contiene el Tenant

Después de login, recibes un JWT que incluye:

```json
{
  "sub": "user-uuid",
  "email": "user@company.com",
  "tenant_id": "acme-tenant-uuid",  // 👈 Inyectado por Auth Hook
  "role": "EJECUTIVO_COMERCIAL"
}
```

Este JWT se usa en **cada request** para:
1. Identificar quién eres
2. Determinar qué tenant eres
3. Filtrar datos via RLS

### Resolución de Tenant

**Opción 1: JWT directo** (simple)
```sql
-- El JWT ya contiene tenant_id
WHERE tenant_id = auth.jwt()->>'tenant_id'
```

**Opción 2: Subquery** (dinámico)
```sql
-- Resolver tenant vía relación user → client → tenant
WHERE tenant_id IN (
  SELECT tenant_id FROM clients
  WHERE id = client_id
)
```

Usa Opción 2 cuando el tenant_id no pueda estar en el JWT (ej: usuarios con múltiples tenants).

---

## Diferencias: Web, ERP y Portal

### Módulo Web (`src/web/`)

**Propósito**: Marketing público + Onboarding (wizard)

- **Rutas**: `/`, `/privacidad`, `/wizard`
- **Usuarios**: No autenticados → empresas nuevas
- **Autenticación**: Ninguna (público) → creación de cuenta via wizard
- **Datos**: Lee catálogo global (products), sin RLS

**Ejemplo**:
```typescript
// src/web/components/PricingTable.tsx
export default function PricingTable() {
  // Lee productos públicos (sin tenant_id)
  const { data: products } = await supabase
    .from('products')
    .select('*');
  return <div>{/* render products */}</div>;
}
```

### Módulo ERP (`src/erp/`)

**Propósito**: Dashboard interno para empleados

- **Rutas**: `/login`, `/dashboard/*`
- **Usuarios**: Empleados autenticados de una empresa
- **Autenticación**: Email + password → JWT con tenant_id
- **Datos**: Todo filtrado por RLS (tenant_id)

**Roles**: SUPER_ADMIN, EJECUTIVO_COMERCIAL, GERENTE_INVENTARIO, etc.

**Ejemplo**:
```typescript
// src/erp/components/LeadsList.tsx
export default async function LeadsList() {
  // RLS automáticamente filtra por tenant_id del JWT
  const { data: leads } = await supabase
    .from('leads')
    .select('*');  // ← Solo ve leads de su tenant
  return <div>{/* render leads */}</div>;
}
```

### Módulo Portal (`src/portal/`)

**Propósito**: Portal de clientes (órdenes, facturas, soporte)

- **Rutas**: `/portal/login`, `/portal`
- **Usuarios**: Contactos de clientes (externos)
- **Autenticación**: Email + password → JWT con tenant_id
- **Datos**: Filtered por RLS, datos limitados (órdenes propias, facturas propias)

**Diferencia clave**: El portal NO ve todo; solo datos relevantes al cliente.

**Ejemplo**:
```typescript
// src/portal/actions/portal.ts
export async function getClientJobs(clientId?: string) {
  // RLS: solo ve órdenes de su empresa cliente
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('client_id', clientId || currentClient.id);
  return jobs;
}
```

---

## Primeros Pasos

### 1. Clonar y Setup

```bash
# Clonar el repo
git clone https://github.com/ency07/B2B.git
cd B2B

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales Supabase
```

### 2. Iniciar Supabase

**Opción A: Local**
```bash
supabase start
# Te dará las credenciales locales
# Cópia a .env.local
```

**Opción B: Remoto**
```bash
# Usa las credenciales de tu proyecto Supabase remoto
# Agrega a .env.local
```

### 3. Ejecutar Migraciones

```bash
# Si usas Supabase local
supabase migration up

# Si usas Supabase remoto, aplica manualmente via dashboard
```

### 4. Seed de Datos

```bash
# Crea admin local + datos de prueba
npm run seed:admin-dev

# Ahora puedes loguearte con credenciales de seed
# Email: admin@example.com (ver output)
```

### 5. Iniciar Dev Server

```bash
npm run dev
# Abre http://localhost:3000
```

---

## Agregar una Nueva Tabla con RLS

Seguir este patrón para cualquier tabla nueva:

### Paso 1: Crear la Tabla en Supabase

**Patrón**: Cada tabla tenant-específica debe tener `tenant_id` + RLS

```sql
-- Migración: supabase/migrations/20260712_create_departments.sql

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, name)  -- Único por tenant, no globalmente
);

-- Índices para RLS y queries
CREATE INDEX departments_tenant_idx ON departments(tenant_id);
CREATE INDEX departments_name_idx ON departments(name);

-- RLS: Aislamiento de tenant
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY departments_select ON departments
  FOR SELECT
  USING (tenant_id = auth.jwt()->>'tenant_id');

CREATE POLICY departments_insert ON departments
  FOR INSERT
  WITH CHECK (tenant_id = auth.jwt()->>'tenant_id');

CREATE POLICY departments_update ON departments
  FOR UPDATE
  USING (tenant_id = auth.jwt()->>'tenant_id');

CREATE POLICY departments_delete ON departments
  FOR DELETE
  USING (tenant_id = auth.jwt()->>'tenant_id');
```

### Paso 2: Generar TypeScript Types

```bash
# Supabase CLI auto-genera tipos
supabase gen types typescript > src/types/database.ts
```

### Paso 3: Crear un Server Action

```typescript
// src/erp/actions/departments.ts

'use server';

import { supabaseAdmin } from '@/platform/auth/clients';
import { z } from 'zod';

const CreateDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
});

type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

export async function createDepartment(
  tenantId: string,
  input: CreateDepartmentInput
) {
  // Validar entrada
  const parsed = CreateDepartmentSchema.parse(input);

  // Insertar con tenant_id (RLS verifica automáticamente)
  const { data, error } = await supabaseAdmin
    .from('departments')
    .insert({
      tenant_id: tenantId,
      name: parsed.name,
      description: parsed.description,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create department: ${error.message}`);
  }

  return data;
}

export async function getDepartments(tenantId: string) {
  const { data, error } = await supabaseAdmin
    .from('departments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch departments: ${error.message}`);
  }

  return data;
}
```

### Paso 4: Usar en un Componente

```typescript
// src/erp/components/DepartmentsList.tsx

'use client';

import { useState, useEffect } from 'react';
import { getDepartments, createDepartment } from '@/erp/actions/departments';

export default function DepartmentsList({ tenantId }: { tenantId: string }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDepartments(tenantId).then(setDepartments).finally(() => setLoading(false));
  }, [tenantId]);

  const handleCreate = async (name: string) => {
    const newDept = await createDepartment(tenantId, { name });
    setDepartments([...departments, newDept]);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Departments</h2>
      <ul>
        {departments.map(d => <li key={d.id}>{d.name}</li>)}
      </ul>
      <button onClick={() => handleCreate('New Dept')}>Add</button>
    </div>
  );
}
```

---

## Crear una Server Action

Server Actions son funciones backend-seguras llamadas desde el cliente. Siempre usan validación Zod:

### Template

```typescript
// src/erp/actions/example.ts

'use server';

import { supabaseAdmin } from '@/platform/auth/clients';
import { z } from 'zod';

// 1. Define schema con Zod
const MyActionSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1).max(100),
  age: z.number().int().positive().optional(),
});

type MyActionInput = z.infer<typeof MyActionSchema>;

// 2. Implement server action
export async function myAction(input: MyActionInput) {
  // 3. Validate with Zod (throws if invalid)
  const parsed = MyActionSchema.parse(input);

  // 4. Call database
  const { data, error } = await supabaseAdmin
    .from('my_table')
    .insert(parsed)
    .select()
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  // 5. Return typed result
  return data;
}
```

### En un Componente

```typescript
'use client';

import { myAction } from '@/erp/actions/example';

export default function MyForm() {
  const handleSubmit = async (formData: FormData) => {
    try {
      const result = await myAction({
        email: formData.get('email'),
        name: formData.get('name'),
      });
      console.log('Success:', result);
    } catch (err) {
      console.error('Error:', err.message);
    }
  };

  return (
    <form action={handleSubmit}>
      <input name="email" type="email" required />
      <input name="name" type="text" required />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Debugging

### Ver SQL Queries

Habilita logging de Supabase en `.env.local`:

```env
SUPABASE_DEBUG=true
```

Luego revisa la consola del servidor para ver SQL ejecutado.

### Verificar Policies RLS

Conecta a tu base de datos y corre:

```sql
-- Ver policies de una tabla
SELECT * FROM pg_policies WHERE tablename = 'jobs';

-- Ver por qué falla un query (PostgreSQL 14+)
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM jobs;
```

### Debugg Auth/JWT

```typescript
// Dentro de una Server Action
import { getCurrentClient } from '@/lib/portal-auth';

const client = await getCurrentClient();
console.log('Current tenant:', client.tenantId);
console.log('User roles:', client.roles);
```

### Tests

```bash
# Run unit tests
npm run test

# Watch mode
npm run test:watch

# Security/concurrency tests
npm run test:security-audit

# E2E tests (si existen)
npm run test:e2e
```

---

## Recursos

### Documentación Interna

- **ADRs**: `docs/04_arquitectura/ADRs/`
  - `001-multi-tenancy-rls.md` — Decisión de usar RLS
  - `003-auth-hook-subquery.md` — Resolución de tenant
- **Security**: `docs/04_arquitectura/SECURITY_MODEL.md`
- **RLS Details**: `docs/04_arquitectura/CLIENTS_RLS_MODEL.md`

### Links Externos

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL RLS**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Next.js Server Actions**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
- **Zod Validation**: https://zod.dev
- **Tailwind CSS**: https://tailwindcss.com

### Comandos Útiles

```bash
# Setup inicial
npm install && npm run seed:admin-dev

# Desarrollo
npm run dev                  # dev server
npm run test:watch          # tests en watch
npm run lint                # linting

# Deploy
npm run build               # build para producción
npm start                   # run prod build localmente

# Database
supabase migration new <name>  # crear nueva migración
supabase migration up          # aplicar migraciones
supabase db push               # sync local → remote
```

---

## Próximos Pasos

1. **Lee la sección relevante** a tu tarea (ERP, Portal, Web)
2. **Estudia una tabla existente** (ej: `leads`, `jobs`) para ver el patrón
3. **Mira un Server Action existente** para ver validación Zod
4. **Escribe tu primer test** (Vitest) para entender el flujo
5. **Pregunta en el equipo** si tienes dudas sobre arquitectura

¡Bienvenido al equipo! 🚀
