# AI TEST PROTOCOL (Protocolo de Pruebas de Aceptación)

Este documento define la estructura y las directivas obligatorias para planificar, automatizar y ejecutar pruebas de aceptación técnica y de negocio.

---

## 1. Pruebas Automatizadas

Cada módulo construido debe acompañarse de un script de verificación en `scripts/` (ej: `test-requirements.ts`) con una doble estrategia de ejecución:

### 1.1 Verificación Sintáctica Estática (Fallback)
*   Si las variables de conexión a base de datos (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) no se encuentran configuradas en el entorno local, el script realizará un análisis estático del archivo de migración SQL.
*   Valida la existencia de sentencias clave como la creación de tablas, triggers específicos y políticas de seguridad RLS habilitadas.

### 1.2 Verificación Lógica e Integración Activa
*   Si las credenciales están presentes, el script se conectará al motor para realizar una simulación real de la operación.
*   **Aislamiento de Pruebas:** Todos los registros de prueba (tenants, usuarios, clientes, requerimientos) deben crearse con códigos identificativos y eliminarse al finalizar el script (`cleanUp`) para mantener limpia la base de datos.
*   **Pruebas de RLS Masivas:** Debe incluirse un escenario que valide el aislamiento estricto de datos con usuarios y tenants múltiples (ej: simulación con 25 tenants y 106 usuarios).

---

## 2. Pruebas Manuales Operativas

El plan de pruebas del sistema (`test plan`) debe detallar la secuencia de pasos lógicos de negocio que el usuario final realizará en el ERP:

1.  **Restricción de Roles:** Intentar realizar acciones (como crear requerimientos o aprobar cotizaciones) con roles de usuario no autorizados para comprobar el rechazo del sistema.
2.  **Validación de Adjuntos Obligatorios:** Probar el bloqueo de transiciones de estado cuando hacen falta archivos PDF de soporte (ej: reporte técnico para pasar a cotización).
3.  **Soft Delete:** Comprobar que los registros borrados lógicamente desaparezcan de las bandejas normales y solo se muestren en perfiles de auditoría.
