# FASE 35: Asistente de Preingeniería Industrial
# 12_SECURITY: Modelo de Seguridad, RLS y Control de Accesos

Este documento detalla las directrices de seguridad, mitigación de abusos e integridad relacional del Asistente de Preingeniería.

---

## 1. Objetivo y Alcance

El Asistente es un canal de interacción público en la web externa, lo que lo expone a ataques de inyección, denegación de servicio (DoS) e intentos de extracción de datos empresariales. Su objetivo es blindar el acceso a Supabase y PostgreSQL cumpliendo con el principio de **Zero Trust** (Pilar IX de la Constitución Técnica).

---

## 2. Aislamiento Multi-Tenant (RLS) y Service Role Bypass

*   **Row Level Security (RLS)**: Las tablas de configuración del asistente (`assistant_trees`, `assistant_nodes`, `assistant_connections`, `assistant_conditions`) tienen RLS activo. Los usuarios de la base de datos sólo leen las configuraciones de su propio `tenant_id`.
*   **Bypass Controlado para Visitantes (Server Actions)**:
    *   Un visitante anónimo de la web no posee un token JWT de Supabase con un rol del ERP. Por lo tanto, no tiene permisos de inserción en `clients`, `client_contacts` o `leads`.
    *   Para solucionar esto sin habilitar inserciones anónimas peligrosas en base de datos, el formulario del Wizard llama a la Server Action segura `submitWizardData` en el servidor de Next.js.
    *   Esta acción valida los datos con Zod y luego realiza las inserciones utilizando `supabaseAdmin` (Service Role de Supabase) en el servidor. Esto encapsula la mutación y evita exponer políticas RLS de escritura al público.

---

## 3. Rate Limiting y Protección Anti-Abuso (Pilar XI)

Para evitar la creación masiva de leads ficticios o saturación de la base de datos:
*   **Rate Limiter por IP**: Se aplica un control de tasa en el Middleware de Next.js para peticiones al endpoint `/api/wizard` o llamadas a la Server Action.
*   **Restricción**: Máximo 5 solicitudes completas por hora por IP. Si se supera el límite, el servidor retorna inmediatamente un estado de error `429 Too Many Requests`.
*   **Validación de Dominio de Correo**: El sistema analiza el dominio del email corporativo. Si el email proviene de un dominio público desechable, el scoring disminuye el puntaje de probabilidad comercial y clasifica el Lead como `'FRIO'` o `'SPAM'`, desactivando alertas prioritarias por Telegram.

---

## 4. Inmutabilidad y Auditoría Técnica

*   **Inmutabilidad de Diagnósticos**: La tabla `assistant_diagnostics` es inmutable. Una vez creado el prediagnóstico, queda prohibido cualquier `UPDATE` o `DELETE` físico. Las correcciones posteriores se registran mediante nuevas sesiones.
*   **Log de Auditoría**: Toda alteración en los árboles de decisión por el administrador o creación de diagnósticos por clientes se registra de forma obligatoria en la tabla `audit_log` general, almacenando la fecha, IP, navegador y cambio de datos del operador.
*   **Sanitización de Archivos**: Los planos CAD o documentos cargados por el usuario se suben a un bucket de almacenamiento de Supabase aislado, donde sólo se permiten formatos seguros (`.pdf`, `.step`, `.dwg`, `.dxf`) y se valida que el archivo no supere los 10MB antes de registrar la URL.
