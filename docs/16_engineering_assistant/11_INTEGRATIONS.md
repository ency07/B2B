# FASE 35: Asistente de Preingeniería Industrial
# 11_INTEGRATIONS: Puntos de Integración con el Ecosistema ERP

Este documento detalla las interfaces, triggers y APIs mediante los cuales el Asistente de Preingeniería se conecta dinámicamente con los módulos preexistentes del ERP.

---

## 1. Integración con CRM y Pipeline (Leads, Clients, Contacts)

Cuando el usuario completa el Paso 3 del Wizard (Captura de Datos), se ejecuta una transacción atómica en base de datos mediante la Server Action `submitWizardData` utilizando Supabase Service Role (`supabaseAdmin`) para realizar el siguiente mapeo:

### A. Clientes (`clients`)
*   **Mecanismo**: Busca duplicados en base a Razón Social (`legal_name`) del lead.
*   **Acción**: Si ya existe, reutiliza el `client_id`. Si no existe, crea un nuevo registro con `client_type = 'Empresa'`, `status = 'PROSPECTO'` y `tax_id` en null (que es nullable desde Fase 13).

### B. Contactos (`client_contacts`)
*   **Mecanismo**: Busca duplicados por email corporativo dentro del cliente.
*   **Acción**: Si no existe, inserta en `client_contacts` asociando cargo (`position`) e indicando `is_primary = true` si es el primer contacto.

### C. Leads (`leads`)
*   **Acción**: Registra el Lead asociando `client_id`, `contact_id`, `notes` (con resumen de CFM), `lead_source = 'WIZARD'` e inicia el cálculo automático de SLA según la urgencia seleccionada.

---

## 2. Integración con Requerimientos y Oportunidades

*   **Desacoplamiento Seguro**: El visitante anónimo **no crea un requerimiento comercial (`requirements`)** directamente en el Wizard público. Esto evita violaciones a las políticas de seguridad RLS del ERP y previene la saturación del pipeline operativo con spam.
*   **Acción en ERP**: Cuando el Ejecutivo Comercial revisa el Lead en el panel `/dashboard/leads` y lo califica como `CALIFICADO` o `CALIENTE`, presiona el botón "Aceptar Lead". Esta acción ejecuta la Server Action interna del ERP que crea el Requerimiento formal, hereda el responsable técnico/comercial y asocia el informe de diagnóstico (`diagnostic_reports.id`).

---

## 3. Canales de Notificación y Envío Dinámico (WhatsApp, Email, Telegram)

### A. WhatsApp B2B
*   **Visualización**: En la pantalla de éxito, se provee un botón pre-poblado con la API de WhatsApp de AeroMax.
*   **Mensaje estructurado**:
    ```text
    Hola AeroMax. He completado el Wizard con código de reporte *{code}*. Caudal calculado: *{cfm} CFM*. Solicito cotización formal.
    ```

### B. Email (SMTP / Resend)
*   Al registrarse el Lead calificado (riesgo `'CALIENTE'` o `'TIBIO'`), el sistema despacha una notificación por correo al prospecto adjuntando el link del diagnóstico y una copia al ejecutivo comercial asignado.

### C. Telegram (Bot de Internos)
*   Si el Lead califica como `'CALIENTE'` (scoring alto), la base de datos despacha un evento en `business_events` que el enrutamiento de notificaciones de Telegram capta, enviando una alerta inmediata al grupo de venta del tenant:
    ```text
    🚨 ALERTA LEAD CALIENTE: Cementera Argos en Barranquilla requiere cotización urgente de 25,000 CFM (Código: DIA-0045).
    ```
