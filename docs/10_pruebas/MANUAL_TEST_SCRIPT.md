# GUION DE PRUEBAS MANUALES (MANUAL TEST SCRIPT)

Este documento detalla el protocolo de pruebas de aceptación manual para validar el comportamiento del ecosistema **la plataforma (ERP + CRM + Portal Cliente + Web Pública)**. Cubre la creación de datos de prueba, la verificación de roles y permisos (RBAC), transiciones de estados de negocio e integraciones críticas.

---

## 1. Datos Demo de Entrada

### 1.1 Estructura de 25 Empresas Demo (Tenants)

El script de pruebas inicializa automáticamente los siguientes tenants aislados en la base de datos:

| # | Nombre de la Empresa | Tipo / Sector | Código de Tenant | Sede Principal |
| :- | :--- | :--- | :--- | :--- |
| 1 | Metalúrgica del Norte S.A. | Manufactura | `TEN-MAN-01` | Medellín, Colombia |
| 2 | Plásticos LATAM Corp | Manufactura | `TEN-MAN-02` | Bogotá, Colombia |
| 3 | Textilera Andina | Manufactura | `TEN-MAN-03` | Cali, Colombia |
| 4 | Alimentos del Valle S.A.S | Manufactura | `TEN-MAN-04` | Barranquilla, Colombia |
| 5 | Cementera del Caribe | Manufactura | `TEN-MAN-05` | Cartagena, Colombia |
| 6 | Oro Verde Corporation | Minería | `TEN-MIN-01` | Bucaramanga, Colombia |
| 7 | Carbones del Cerrejón B2B | Minería | `TEN-MIN-02` | Riohacha, Colombia |
| 8 | Canteras de los Andes | Minería | `TEN-MIN-03` | Ibagué, Colombia |
| 9 | Cobre de Occidente | Minería | `TEN-MIN-04` | Neiva, Colombia |
| 10 | Esmeraldas de Colombia S.A. | Minería | `TEN-MIN-05` | Tunja, Colombia |
| 11 | Climacon LATAM | HVAC | `TEN-HVA-01` | Bogotá, Colombia |
| 12 | Tecnoaire Limitada | HVAC | `TEN-HVA-02` | Cali, Colombia |
| 13 | Refrigeración Industrial Andina | HVAC | `TEN-HVA-03` | Medellín, Colombia |
| 14 | Climas de la Sabana S.A.S | HVAC | `TEN-HVA-04` | Chía, Colombia |
| 15 | Aire Puro del Pacífico | HVAC | `TEN-HVA-05` | Buenaventura, Colombia |
| 16 | Cloud Center Colombia | Data Center | `TEN-DTC-01` | Bogotá, Colombia |
| 17 | Host Latam Corp | Data Center | `TEN-DTC-02` | Medellín, Colombia |
| 18 | Data Safe Bogotá | Data Center | `TEN-DTC-03` | Bogotá, Colombia |
| 19 | TeleData Systems S.A. | Data Center | `TEN-DTC-04` | Barranquilla, Colombia |
| 20 | Server Vault Colombia | Data Center | `TEN-DTC-05` | Cali, Colombia |
| 21 | Transportes del Pacífico | Logística | `TEN-LOG-01` | Buenaventura, Colombia |
| 22 | Envíos Express B2B | Logística | `TEN-LOG-02` | Bogotá, Colombia |
| 23 | Logística Continental | Logística | `TEN-LOG-03` | Cartagena, Colombia |
| 24 | Carga Rápida LATAM | Logística | `TEN-LOG-04` | Medellín, Colombia |
| 25 | Almacenes Centrales S.A.S | Logística | `TEN-LOG-05` | Barranquilla, Colombia |

### 1.2 Distribución de 106 Usuarios Demo

Se inicializarán 106 cuentas de prueba distribuidas por los siguientes roles oficiales, con credenciales de prueba (`user.role@b2b-premium.test` / clave `Demo2026*`):

*   **SUPER_ADMIN (1 usuario):** `super.admin@b2b-premium.test`
*   **ADMIN_EMPRESA (2 usuarios):** `admin.empresa1@b2b-premium.test`, `admin.empresa2@b2b-premium.test`
*   **GERENTES (5 usuarios):** `gerente.general@b2b-premium.test`, `director.operaciones@b2b-premium.test`, `director.comercial@b2b-premium.test`, `director.financiero@b2b-premium.test`, `gerente.area@b2b-premium.test`
*   **DIRECTORES (5 usuarios):** De finanzas, comercial, operaciones, etc.
*   **JEFES DE DEPARTAMENTO (10 usuarios):** `jefe.proyectos@b2b-premium.test`, `jefe.mantenimiento@b2b-premium.test`, `jefe.inventario@b2b-premium.test`, `jefe.compras@b2b-premium.test`, `jefe.cartera@b2b-premium.test`, `jefe.calidad@b2b-premium.test`, etc.
*   **EJECUTIVOS COMERCIALES (10 usuarios):** `ejecutivo.comercial1@b2b-premium.test` ... `10`
*   **INGENIEROS DE CAMPO / PROYECTOS (10 usuarios):** `ingeniero.proyectos1@b2b-premium.test` ... `10`
*   **TÉCNICOS DE CAMPO (15 usuarios):** `tecnico.campo1@b2b-premium.test` ... `15`
*   **ALMACENISTAS (5 usuarios):** `almacenista1@b2b-premium.test` ... `5`
*   **PERSONAL DE CARTERA (5 usuarios):** `auxiliar.cartera1@b2b-premium.test` ... `5`
*   **AUDITORES DE LOGS (3 usuarios):** `auditor1@b2b-premium.test` ... `3`
*   **CLIENTES B2B (25 usuarios):** `cliente.metalurgica@b2b-premium.test`, `cliente.oroverde@b2b-premium.test`, etc.
*   **PROVEEDORES (10 usuarios):** `proveedor1@b2b-premium.test` ... `10`

---

## 2. Bloque 1: Pruebas de Web Pública y Cotizador Wizard

### Caso 1.1: Flujo de Cotización por Wizard (`/cotizador`)
*   **Paso 1: Selección de Servicio.**
    *   *Acción:* Hacer clic en la tarjeta "Fabricación a medida".
    *   *Resultado Esperado:* Avanza automáticamente al Paso 2 sin requerir clics adicionales.
*   **Paso 2: Análisis Técnico.**
    *   *Acción:* Ingresar dimensiones: Ancho `25` m, Largo `50` m, Altura `6` m. Seleccionar Ambiente: "Planta pesada / Metalmecánica (35 ACH)".
    *   *Resultado Esperado:* En el estado de Zustand se almacena el caudal calculado de 88,286 CFM.
*   **Paso 3: Formulario de Lead.**
    *   *Acción:* Rellenar campos: Nombre `Juan Pérez`, Empresa `Metalúrgica del Norte`, Cargo `Director de Planta`, Teléfono `3157894512`, Urgencia `alta`.
    *   *Acción:* Ingresar email de lista negra `test@mailinator.com`.
    *   *Resultado Esperado:* Mensaje de error de Zod: *"Por favor utiliza un correo empresarial o personal real..."*
    *   *Acción:* Cambiar email a `j.perez@metalurgicanorte.com.co`. Pulsar "Procesar Preingeniería".
    *   *Resultado Esperado:*
        - Se inician Server Actions.
        - Se crea Lead con `leadScore` de 90 (Clasificación **HOT**).
        - Se realiza el B2B Upsert (Compañía `Metalúrgica del Norte` y Contacto `Juan Pérez`).
        - Se guarda reporte de diagnóstico en `diagnostic_reports`.
        - Se simula la subida de PDF base64 al bucket de Supabase `"pdfs"`.
*   **Paso 4: Resumen y Descarga.**
    *   *Acción:* Visualizar el rango de inversión calculada en COP y USD (multiplicado por 1.35 de urgencia alta). Hacer clic en "Descargar PDF".
    *   *Resultado Esperado:* Descarga un PDF formateado con el diagnóstico preliminar.

### Caso 1.2: Deep-Linking Comercial
*   **Acción:** Navegar a la URL `/cotizador?servicio=venta`.
*   **Resultado Esperado:** Se preselecciona el servicio "Venta de equipos" y salta directamente al Paso 2 de especificaciones.

---

## 3. Bloque 2: Pruebas de Portal de Clientes (`/portal`)

### Caso 2.1: Visualización y Aprobación de Cotizaciones
*   **Usuario:** `cliente.metalurgica@b2b-premium.test`
*   **Paso 1:** Ingresar al portal. Navegar a "Cotizaciones".
*   **Paso 2:** Seleccionar cotización `QT-2026-001` (Costo COP 55,000,000, estado `Enviada`).
*   **Paso 3:** Hacer clic en "Aceptar Cotización".
*   **Resultado Esperado:**
    - Estado de la cotización pasa a `Aprobada`.
    - Genera evento `QuoteApproved`.
    - Genera registro en `audit_log` con acción `STATUS_CHANGE`.
    - Crea automáticamente un registro de Oportunidad Comercial ganada.

### Caso 2.2: Pago mediante Pasarela Wompi Sandbox
*   **Usuario:** `cliente.metalurgica@b2b-premium.test`
*   **Paso 1:** Navegar a "Facturas". Seleccionar `INV-2026-042` por COP 20,000,000 (estado `Pendiente`).
*   **Paso 2:** Hacer clic en botón "Pagar con Wompi".
*   **Paso 3:** En la pasarela Sandbox de Wompi, seleccionar resultado: "Transacción Aprobada".
*   **Resultado Esperado:**
    - Wompi envía webhook `payment.approved`.
    - El backend actualiza la transacción en `payment_transactions` a `Pagado`.
    - El balance de la factura se recalcula a COP 0 y su estado cambia a `Pagada`.
    - Se genera una alerta en la bandeja de Finanzas del ERP.

### Caso 2.3: Pago Parcial y Abono
*   **Usuario:** `cliente.metalurgica@b2b-premium.test`
*   **Paso 1:** En la factura `INV-2026-043` por COP 15,000,000, seleccionar "Pago Parcial".
*   **Paso 2:** Ingresar monto COP 5,000,000. Proceder con el pago en Sandbox.
*   **Resultado Esperado:**
    - El estado de la factura cambia a `ParcialmentePagada`.
    - El campo `paid_amount` se actualiza a COP 5,000,000.
    - El campo `balance_amount` se recalcula a COP 10,000,000.

---

## 4. Bloque 3: Pruebas de ERP Interno

### Caso 3.1: Aislamiento Multitenant (RLS)
*   **Usuario A:** `ejecutivo.comercial1@b2b-premium.test` (Socio del tenant `TEN-MAN-01`).
*   **Usuario B:** `ejecutivo.comercial2@b2b-premium.test` (Socio del tenant `TEN-HVA-01`).
*   **Paso 1:** Usuario A crea un cliente `Metalúrgica del Norte` y un contacto.
*   **Paso 2:** Iniciar sesión como Usuario B. Intentar consultar la lista de clientes o consultar el ID del cliente de Usuario A vía API `/api/v1/clients/{id}`.
*   **Resultado Esperado:**
    - La consulta general de clientes de Usuario B no muestra a `Metalúrgica del Norte`.
    - La consulta directa por ID retorna error `404 Not Found` o `403 Forbidden` (bloqueado por RLS en Postgres).

### Caso 3.2: Motor de Aprobación de Cotizaciones
*   **Usuario:** `ejecutivo.comercial1@b2b-premium.test`
*   **Paso 1:** Crear cotización por valor COP 4,500,000. Pulsar "Enviar a Aprobación".
    *   *Resultado Esperado:* Pasa automáticamente a `Enviada` (regla de monto menor a 5M no requiere flujo).
*   **Paso 2:** Crear cotización por valor COP 12,000,000. Pulsar "Enviar a Aprobación".
    *   *Resultado Esperado:* Estado pasa a `En Revisión`. Se genera solicitud en la bandeja de aprobación del `Jefe de Área`.
*   **Paso 3:** Iniciar sesión como `jefe.proyectos@b2b-premium.test`. Navegar a "Bandeja de Aprobaciones". Hacer clic en "Aprobar".
    *   *Resultado Esperado:* Estado de la cotización cambia a `Enviada` (lista para envío al cliente).
*   **Paso 4:** Crear cotización por valor COP 25,000,000.
    *   *Resultado Esperado:* Requiere aprobación secuencial: Paso 1 `Jefe de Área` $\rightarrow$ Paso 2 `Gerencia General`.
    *   *Acción:* Jefe de Área aprueba.
    *   *Resultado Esperado:* Estado se mantiene en `En Revisión`. Se activa el paso del Gerente General.
    *   *Acción:* Gerente General pulsa "Rechazar" con comentario *"Ajustar margen de materiales"*.
    *   *Resultado Esperado:* Estado de la cotización cambia a `Rechazada`. Se notifica al comercial creador.

### Caso 3.3: Ejecución de Trabajos (Operations Workflow)
*   **Usuario:** `jefe.proyectos@b2b-premium.test`
*   **Paso 1: Crear Trabajo.** Vincular a cliente `Metalúrgica del Norte` y requerimiento `REQ-001`. Estado inicial: `Pendiente`.
*   **Paso 2: Programar Trabajo.** Intentar pasar a `Programado` sin asignar responsable.
    *   *Resultado Esperado:* Error de validación: *"Debe asignar un ingeniero o técnico responsable."*
    *   *Acción:* Asignar a `tecnico.campo1@b2b-premium.test` y definir fecha programada. Guardar.
    *   *Resultado Esperado:* Estado cambia a `Programado`.
*   **Paso 3: Ejecución.** Pasar a `En Ejecución`.
    *   *Resultado Esperado:* El sistema marca automáticamente la fecha `actual_start_date` con el timestamp del servidor.
*   **Paso 4: Finalización.** Intentar pasar a `Finalizado` con actividades en estado `Pendiente`.
    *   *Resultado Esperado:* Rechaza cambio de estado.
    *   *Acción:* Marcar todas las tareas asignadas como `Completadas`. Cambiar estado del Trabajo a `Finalizado`.
    *   *Resultado Esperado:* Estado cambia a `Finalizado`.
*   **Paso 5: Entrega.** Intentar pasar a `Entregado` sin cargar Acta de Entrega.
    *   *Resultado Esperado:* Rechaza cambio de estado: *"Debe adjuntar el Acta de Entrega firmada."*
    *   *Acción:* Subir PDF simulado al módulo documental asociado al Job. Cambiar estado a `Entregado`.
    *   *Resultado Esperado:* Estado cambia a `Entregado`.
*   **Paso 6: Cierre.** Cambiar estado a `Cerrado`.
    *   *Resultado Esperado:* El sistema marca automáticamente `actual_end_date` y genera el registro de inicio de periodo de Garantía.

### Caso 3.4: Control de Inventario y Kardex
*   **Usuario:** `almacenista1@b2b-premium.test`
*   **Paso 1: Entrada de Mercancía.** Registrar movimiento de tipo `Entrada` de 100 unidades del item `EXT-CENT-04` (Extractor Centrífugo) en Bodega Principal. Costo unitario: COP 1,200,000.
    *   *Resultado Esperado:*
        - El stock de `EXT-CENT-04` incrementa a 100 en `inventory_stock`.
        - El costo promedio (`average_cost`) se recalcula en `inventory_items`.
        - Se registra transacción en `inventory_movements` con estado `Aplicado`.
*   **Paso 2: Salida a Obra.** Registrar movimiento de tipo `Salida` de 2 unidades del item `EXT-CENT-04` vinculado al `job_id` de la obra en `Metalúrgica del Norte`.
    *   *Resultado Esperado:*
        - El stock disponible se reduce en 2 unidades.
        - Se inserta automáticamente un registro en la tabla `costs` del bloque financiero asociado al Job, por valor de COP 2,400,000 (2 unidades * COP 1,200,000), en estado `Registrado` para posterior aprobación de costos.

### Caso 3.5: Auditoría Global (Logs)
*   **Usuario:** `auditor1@b2b-premium.test`
*   **Paso 1:** Ingresar al módulo "Log de Auditoría".
*   **Paso 2:** Filtrar acciones por tenant `TEN-MAN-01` y acción `STATUS_CHANGE`.
*   **Resultado Esperado:**
    - Muestra los logs de los cambios de estado de la cotización y el trabajo realizados en el tenant `TEN-MAN-01`.
    - Se visualizan los campos `old_values` (ej. `Borrador`) y `new_values` (ej. `En Revisión`) en formato JSON.
    - El auditor tiene los campos de edición e inserción bloqueados (vista de sólo lectura).

---

## 5. Checklists de Validación de Componentes UI

Durante la ejecución del guion de pruebas manual, el tester debe marcar conformidad en los siguientes elementos de interfaz:

- [ ] **Validación de Botones:** Todos los botones de envío (`Submit`), aprobación (`Approve`), rechazo (`Reject`) y descargas de reportes PDF deben mostrar estados de carga (`loading spinners`) inhabilitando clics repetidos.
- [ ] **Validación de Iconos:** Los iconos de estado (alerta roja para vencido, verde para pagado, naranja para en revisión) deben coincidir exactamente con el estado registrado de la entidad.
- [ ] **Validación de Filtros:** Los filtros de búsqueda por texto en tablas (inventario, clientes y logs) y selectores de fecha de cartera deben refrescar la vista en menos de 2 segundos.
- [ ] **Validación de Formularios:** Los formularios deben mostrar validaciones visuales instantáneas en color rojo si un campo obligatorio se deja vacío o el formato (como el NIT o teléfono) no cumple con el esquema de Zod.
