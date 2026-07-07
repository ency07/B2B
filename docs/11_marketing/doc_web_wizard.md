# DOCUMENTACIÓN DETALLADA: WEB PÚBLICA Y FORMULARIO WIZARD

---

## 1. ESTRUCTURA DE LA WEB PÚBLICA Y MARKETING

La web pública de la plataforma está diseñada como una herramienta técnica que proyecta autoridad de ingeniería, evitando el aspecto de landing page de marketing genérica. Utiliza el Next.js App Router para estructurar las rutas públicas.

### 1.1 Páginas y Rutas Públicas (`app/(marketing)`)
*   **Inicio (`/`):** Presentación institucional, catálogo técnico general y acceso destacado al cotizador/wizard de diagnóstico.
*   **Quiénes Somos (`/quienes-somos`):** Información sobre el equipo de ingenieros, certificaciones de calidad y trayectoria industrial en LATAM.
*   **Servicios (`/servicios`):** Detalle de las líneas de negocio de la empresa (Fabricación a medida, Venta de equipos, Mantenimiento predictivo/preventivo y Reparación correctiva).
*   **Proyectos (`/proyectos`):** Portafolio de montajes industriales ejecutados (plantas químicas, minería, data centers).
*   **Contacto (`/contacto`):** Formulario general de contacto para consultas no relacionadas con el cotizador técnico.

### 1.2 Reglas de SEO y Metadatos (`app/layout.tsx` y `app/robots.ts`)
Para cumplir con los estándares técnicos y de visibilidad:
*   **Title y Meta Descriptions:** Cada página define metadatos estáticos y dinámicos usando la API de metadatos de Next.js.
*   **Robots (`app/robots.ts`):** Configura las reglas de indexación para rastreadores (ej. Googlebot), permitiendo acceso a rutas de marketing y bloqueando directorios internos del CRM y el Portal de Clientes.
*   **Sitemap (`app/sitemap.ts`):** Genera dinámicamente el mapa de la web incluyendo las URLs públicas con prioridades de actualización.
*   **Estructura Semántica:** Se utiliza HTML5 estricto (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`) con un único `<h1>` por página y jerarquía coherente de encabezados (`<h2>`, `<h3>`).

---

## 2. FLUJO DETALLADO DEL FORMULARIO WIZARD (COTIZADOR)

El formulario wizard se localiza en la ruta `/cotizador` y es controlado por el componente [WizardForm.tsx](file:///c:/Users/Administrator/Desktop/platform/components/wizard/WizardForm.tsx). Cuenta con un stepper hexagonal de 4 nodos que guía al usuario por la evaluación técnica.

### 2.1 Paso 1: Selección de Servicio (`StepService.tsx`)
El usuario define la naturaleza del requerimiento.
*   **Campos y Tipos:**
    *   `service` (Enum de Zod): `"fabricacion" | "venta" | "mantenimiento" | "reparacion"`.
*   **Interfaz de Usuario:** Renderiza tarjetas interactivas de aspecto técnico. Al seleccionar el servicio, el estado global de Zustand (`useWizardStore.ts`) limpia los inputs de los pasos posteriores y avanza de forma automática.
*   **Deep-Linking B2B:** El componente lee los parámetros de la URL (`?servicio=xxx`). Si la URL contiene un parámetro válido, se preselecciona el servicio y salta de inmediato al Paso 2, facilitando campañas dirigidas.

### 2.2 Paso 2: Análisis Técnico (`StepFlowCalculator.tsx` o `StepSymptoms.tsx`)
Dependiendo de la selección del Paso 1, el wizard bifurca su lógica:

#### Ruta A: Fabricación o Venta (`StepFlowCalculator.tsx`)
Calcula el caudal de ventilación requerido en base a las dimensiones físicas de la nave industrial.
*   **Campos e Inputs:**
    *   `length` (Largo): Campo numérico decimal (`number`).
    *   `width` (Ancho): Campo numérico decimal (`number`).
    *   `height` (Altura): Campo numérico decimal (`number`).
    *   `environment` (Ambiente Operativo): Selección exclusiva (`string`).
*   **Validaciones de Zod (`FlowCalculatorSchema`):**
    *   `length`: Obligatorio, valor numérico positivo mayor a 0, máximo de 1000 metros.
    *   `width`: Obligatorio, valor numérico positivo mayor a 0, máximo de 1000 metros.
    *   `height`: Obligatorio, valor numérico positivo mayor a 0, máximo de 100 metros.
    *   `environment`: Cadena no vacía obligatoria.

#### Ruta B: Mantenimiento o Reparación (`StepSymptoms.tsx`)
Checklist para identificar fallas en equipos existentes y clasificar la complejidad del servicio.
*   **Campos e Inputs (Booleanos por defecto en `false`):**
    *   *Mantenimiento preventivo standard:* `preventivo`.
    *   *Disminución de caudal:* `eficiencia`.
    *   *Signos de corrosión/desgaste:* `desgaste`.
    *   *Vibración sutil o ruido leve:* `vibracion_sutil`.
    *   *Aumento de consumo energético:* `consumo`.
    *   *Falta de sensores de monitoreo:* `monitoreo`.
    *   *Falla crítica (paro repentino):* `falla_critica`.
    *   *El motor no enciende:* `no_enciende`.
    *   *Presencia de humo/olor a quemado:* `humo`.
    *   *Problema eléctrico en tablero:* `falla_electrica`.
    *   *Vibración o ruido severo:* `ruido_severo`.
    *   *Daño físico visible en aspas:* `danos_estructurales`.
*   **Validaciones de Zod (`SymptomsSchema`):** Todos los campos son opcionales y se coercionan a booleanos.

### 2.3 Paso 3: Viabilidad (`StepLead.tsx`)
Captura los datos del lead y calcula la viabilidad comercial y técnica del proyecto.
*   **Campos e Inputs:**
    *   `nombre` (Nombre de contacto): Texto, min 2, máx 100 caracteres.
    *   `empresa` (Razón Social): Texto, min 2, máx 100 caracteres.
    *   `cargo` (Cargo profesional): Desplegable obligatorio (`"Director de Planta" | "Gerente de Mantenimiento" | "Supervisor de HVAC / Operaciones" | "Ingeniero de Proyectos" | "Compras / Abastecimiento" | "Otro"`).
    *   `telefono` (Teléfono corporativo): Texto, min 6, máx 30 caracteres.
    *   `email` (Correo corporativo): Texto con formato de email.
    *   `ciudad` (Ciudad de la planta): Texto autocompletable, min 2, máx 100 caracteres.
    *   `urgencia` (Urgencia del requerimiento): Enum (`"baja" | "media" | "alta"`).
*   **Validaciones Especiales de Zod (`LeadFormSchema`):**
    *   *Teléfono (Colombia):* Filtra caracteres especiales. Aplica expresión regular para validar números móviles (`^(\+?57)?3\d{9}$`) y líneas fijas (`^(\+?57)?60[1-8]\d{7}$`). Si es válido y no posee el prefijo internacional, el esquema lo transforma inyectándole `+57` al inicio.
    *   *Email (Filtro Anti-Spam):* Valida formato y restringe el uso de correos desechables o temporales comparando el dominio del email contra una lista negra: `mailinator.com`, `guerrillamail.com`, `tempmail.com`, `yopmail.com`, `10minutemail.com`, `yopmail.fr`, `yopmail.net`, `cool.fr.nf`, `jetable.org`, `dispostable.com` y cualquier dominio que incluya la palabra `tempmail`.
    *   *Ciudad (Normalización):* Si el texto coincide con el listado `COLOMBIAN_CITIES`, se auto-selecciona. De lo contrario, se procesa en base a una función de normalización que remueve caracteres especiales, acentos, convierte a minúsculas y capitaliza la primera letra.

### 2.4 Paso 4: Resumen y Descarga (`StepSummary.tsx`)
*   Muestra el diagnóstico final procesado.
*   Presenta los cálculos (caudal en CFM, volumen total, categoría del caudal).
*   Despliega observaciones técnicas detalladas, sugerencias de aleaciones, protocolo de inspección y un rango estimado de inversión económica (en COP y USD).
*   Provee el botón para descargar el reporte de preingeniería en formato PDF.

---

## 3. ALGORITMOS DE CÁLCULO Y PREINGENIERÍA (`lib/calculations/flow.ts`)

El frontend del wizard jamás muestra las fórmulas internas ni valores exactos propietarios; únicamente expone rangos de inversión y recomendaciones generales para proteger el conocimiento de la empresa.

### 3.1 Cálculo de Volumen y Caudal (CFM)
El volumen $V$ se calcula en metros cúbicos ($m^3$).
El Caudal en CFM (pies cúbicos por minuto) se obtiene multiplicando por el coeficiente de renovación de aire por hora (ACH) de la planta y convirtiendo las unidades:
$$\text{CFM} = \frac{length \times width \times height \times \text{ACH} \times 35.3147}{60}$$

Los valores de ACH aplicados en base al entorno son:
*   Planta pesada / Metalmecánica (`heavy_plant`): $35\text{ ACH}$
*   Data Center (`data_center`): $25\text{ ACH}$
*   Minería / Túneles (`mining`): $55\text{ ACH}$
*   Bodega / Almacén (`warehouse`): $12\text{ ACH}$
*   *Default:* $10\text{ ACH}$

### 3.2 Clasificación de Caudal y Recomendación de Materiales
En función de los CFM calculados, el algoritmo categoriza el proyecto:

1.  **Caudal Crítico de Infraestructura Máxima (CFM > 60,000):**
    *   *Recomendación:* Sistema tipo Plenum con ventiladores centrífugos de acoplamiento directo y motores WEG/Siemens de eficiencia IE4.
    *   *Materiales:* Carcasa en Acero ASTM A514 de alta resistencia; álabes forjados en Aluminio Aeronáutico 6061-T6 o Acero Inoxidable 316L.
2.  **Flujo Industrial de Alta Presión y Caudal Elevado (25,000 < CFM <= 60,000):**
    *   *Recomendación:* Extractor centrífugo de álabes inclinados hacia atrás (Airfoil) autolimitador con variador de frecuencia.
    *   *Materiales:* Rotor y voluta en Acero Inoxidable 304, equilibrado dinámico según norma ISO 1940 grado G2.5.
3.  **Flujo Industrial Estándar de Regulación Activa (8,000 < CFM <= 25,000):**
    *   *Recomendación:* Extractor centrífugo de álabes curvados hacia adelante (Forward Curved) con transmisión por bandas/poleas y motor IE3.
    *   *Materiales:* Estructura de Acero Galvanizado G90, chumaceras tipo bloque de pie SKF o NSK de servicio pesado.
4.  **Flujo Compacto Especializado de Baja Presión (CFM <= 8,000):**
    *   *Recomendación:* Extractor helicocentrifugador o axial tubular de acoplamiento directo de bajas revoluciones.
    *   *Materiales:* Carcasa de lámina de Acero al Carbón ASTM A36 con pintura epóxica, álabes de Poliamida reforzada con fibra de vidrio (PAGAS).

### 3.3 Evaluación de Síntomas y Severidad
Suma el puntaje ponderado de los síntomas del Paso 2:
*   *Mantenimiento:* Puntuación máxima capada en 100. Severidad es **Alta** (Score >= 60), **Media** (Score >= 30) o **Baja** (Score < 30).
*   *Reparación:* Puntuación máxima capada en 100. Severidad es **Alta** (Score >= 50), **Media** (Score >= 20) o **Baja** (Score < 20).
*   Genera recomendaciones operativas según la severidad (ej. para Mantenimiento con severidad alta, se recomienda parada técnica en 48 horas para balanceo dinámico y termografía).

### 3.4 Algoritmo de Precios Dinámicos
1.  **Cálculo del Precio Base (COP):**
    *   *Fabricación:* COP 12,000,000 base + escala por flujo (CFM / 10,000 * COP 2,200,000) + factor de categoría (Plenum Crítico añade COP 14,000,000; Alta Presión añade COP 7,500,000; Estándar añade COP 3,200,000).
    *   *Venta:* COP 5,500,000 base + escala por flujo (CFM / 12,000 * COP 1,400,000) + factor crítico (añade COP 6,000,000).
    *   *Mantenimiento:* COP 1,800,000 base + incremento por complejidad (Score / 100 * COP 1,600,000) + factor de severidad alta (+COP 1,400,000) o media (+COP 500,000).
    *   *Reparación:* COP 3,200,000 base + incremento por complejidad (Score / 100 * COP 2,800,000) + factor de severidad alta (+COP 2,500,000) o media (+COP 900,000).
2.  **Multiplicador por Urgencia:**
    *   Urgencia `alta` (Emergencia en Sitio 24h) $\rightarrow$ multiplica el costo base por **1.35** (+35%).
    *   Urgencia `media` (Mantenimiento Trimestral) $\rightarrow$ multiplica el costo base por **1.10** (+10%).
    *   Urgencia `baja` (Planificación Futura) $\rightarrow$ multiplica por **1.0**.
3.  **Rango de Desviación:** Se genera una variación de $\pm 15\%$ para cubrir imprevistos de ingeniería en obra.
4.  **Tasa de Cambio:** Convierte a USD dividiendo por $4000\text{ COP}$ y redondeando los extremos a los USD 50 más cercanos.

---

## 4. PERSISTENCIA EN BASE DE DATOS Y FLUJO DE ACCIONES

Cuando el usuario pulsa "Procesar Preingeniería" en [StepLead.tsx](file:///c:/Users/Administrator/Desktop/platform/components/wizard/StepLead.tsx), se disparan los Server Actions en cascada:

```
[Wizard Form Submit]
         │
         ▼
[createLeadAction] ────> (Inserta en leads como isVerified: true)
         │               (Calcula leadScore y riskLevel)
         │               (Upsert en crm_companies y crm_contacts)
         ▼
[createDiagnosticAction] ──> (Guarda dimensiones y observaciones en diagnostic_reports)
         │
         ▼
[createOpportunityAction] ─> (Crea oportunidad comercial en estado 'analisis' con valor máx)
         │
         ▼
[createProposalAction] ────> (Crea propuesta comercial en estado 'borrador' asociada)
         │
         ▼
[createPipelineEntryAction] ─> (Inserta lead en crm_pipeline en etapa 'nuevo')
         │
         ▼
[createActivityLogAction] ──> (Escribe log 'lead_created' en crm_activity_logs)
         │
         ▼
[Summary Screen & PDF Download]
```

### 4.1 Cálculo del Score de Leads y Nivel de Riesgo B2B
En `lib/server-actions/leads.ts`, se evalúa el perfil del lead para clasificarlo:
*   **Dominio de correo corporativo (+30):** Si el dominio del email no pertenece a proveedores de correo público (`gmail.com`, `hotmail.com`, `yahoo.com`, `live.com`, `outlook.com`, `icloud.com`, `aol.com`).
*   **Línea telefónica de Colombia (+25):** Si el número inicia con el prefijo internacional `+57`.
*   **Presupuesto elevado (+20):** Si el costo estimado máximo supera los COP 50,000,000.
*   **Cargo gerencial/técnico (+15):** Si el cargo del solicitante incluye palabras clave como: `gerente`, `director`, `jefe`, `supervisor`, `manager`, `lead`, `coordinador`.
*   **Ciudad industrial (+15):** Si la planta se ubica en un foco industrial: `barranquilla`, `bogota`, `medellin`, `cali`, `cartagena`, `santa marta`.
*   **Dominio empresarial completo (+10):** Si el dominio corporativo incluye un TLD válido de longitud de cadena mayor a 4 caracteres.

**Clasificación de Riesgo:**
*   `Score >= 75` $\rightarrow$ **HOT**
*   `45 <= Score < 75` $\rightarrow$ **WARM**
*   `15 <= Score < 45` $\rightarrow$ **LOW**
*   `Score < 15` $\rightarrow$ **SPAM**

### 4.2 Inserción de Entidades Relacionadas (B2B Upsert)
*   **crmCompanies:** Busca si existe una compañía con el `companyName` exacto provisto. Si existe, obtiene su ID. Si no, inserta el nuevo registro asignando la ciudad normalizada.
*   **crmContacts:** Busca si existe un contacto con el email ingresado. Si existe, obtiene su ID. Si no, inserta el contacto asociándolo al ID de la compañía.
*   **leads:** Inserta el lead con todos sus parámetros, asociando `companyId`, `contactId` y el `leadScore` y `riskLevel` calculados.

### 4.3 Generación y Almacenamiento de Reporte Técnico
*   Crea una fila en `diagnostic_reports` vinculada al `leadId`. Guarda las dimensiones físicas, caudal CFM calculado y observaciones.
*   *Nota de Suposición Razonable:* La generación del PDF físico se simula a nivel de frontend con librerías del cliente. Una vez generado el archivo base64 del PDF, se invoca a `uploadPdfAction(leadId, pdfBase64)` en el servidor, el cual inicializa un bucket público `"pdfs"` en Supabase Storage, sube el archivo a `reports/{leadId}.pdf`, obtiene su URL pública de descarga y la actualiza en la fila de `diagnostic_reports`.

---

## 5. ERRORES FRECUENTES Y CONTROL EN FORMULARIOS

*   **Email Temporal / Blacklist:** Zod rechaza el envío mostrando: *"Por favor utiliza un correo empresarial o personal real para recibir el reporte PDF."*
*   **Número de Teléfono Inválido:** Si no cumple con la longitud mínima o estructura de línea de celular o fija colombiana, se detiene el envío con la alerta: *"El número ingresado no corresponde a una línea válida en Colombia."*
*   **Fallo del Servidor / Timeout:** Si la base de datos no responde a tiempo, el Server Action lanza una excepción que es capturada por el frontend, mapeándola a un error amigable en el log de progreso (HUD): *"No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente."*
