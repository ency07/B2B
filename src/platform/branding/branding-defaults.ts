export interface BrandingConfig {
  // SUBSECCIÓN A: Información de Empresa
  nombre_comercial: string;
  razon_social: string;
  nit: string;
  direccion: string;
  ciudad: string;
  pais: string;
  telefono_principal: string;
  email_corporativo: string;
  web: string;

  // Localizacion
  zona_horaria: string;
  idioma: string;
  moneda: string;
  formato_fecha: string;
  formato_hora: string;
  separador_decimal: string;
  separador_miles: string;

  // SUBSECCIÓN B: Logos y recursos visuales
  logo_claro_url: string;
  logo_oscuro_url: string;
  logo_login_url: string;
  logo_pdf_url: string;
  favicon_url: string;
  splash_url: string;
  loader_url: string;
  icono_movil_url: string;
  whatsapp: string;

  // SUBSECCIÓN C: Colores
  color_primario: string;
  color_secundario: string;
  color_exito: string;
  color_warning: string;
  color_danger: string;
  color_info: string;

  // SUBSECCIÓN D: Tipografía
  tipografia_principal: string;
  border_radius: string;
  sombras: string;
  animaciones: string;

  // Documentos
  firma_url: string;
  sello_url: string;

  // Tema visual (light/dark/system).
  // - "dark": fuerza dark mode.
  // - "light": fuerza light mode.
  // - "system" o undefined: usa la preferencia del sistema operativo.
  // Configurable desde el CMS de branding. Default: no se fuerza nada.
  theme?: "light" | "dark" | "system";

  // NUEVAS VARIABLES DE PERSONALIZACIÓN INTEGRAL (FASE 34)
  nombre_erp: string;
  nombre_portal_cliente: string;
  titulo_navegador: string;
  landing_video_url: string;
  landing_titulo: string;
  landing_subtitulo: string;
  dossier_url: string;
  plantilla_correo_asunto: string;
  plantilla_correo_cuerpo: string;
  plantilla_pdf_encabezado: string;
  plantilla_pdf_pie: string;
  
  // Novedades para remover quemados
  version_sistema: string;
  copyright_footer: string;
  red_linkedin: string;
  red_youtube: string;
  red_instagram: string;
  red_twitter: string;
  hero_tipo_fondo: "video" | "imagen";
  landing_imagen_url: string;
  prefijo_referencias: string;

  // === HERO EDITABLE (copy) ===
  hero_eyebrow: string;        // Línea superior: "Ingeniería de ventilación industrial"
  hero_cta_primario_label: string; // Label del botón 1 (compartido por las 4 slides)
  hero_cta_secundario_label: string; // Label del botón 2
  // El Hero es un carrusel de 4 slides — una por etapa del proceso. Colores
  // de texto y acento por slide son fijos (parte del sistema de diseño),
  // solo el copy es editable.
  hero_slides: HeroSlideContent[];

  chatbot_steps: ChatbotStep[];

  // === CONTENIDO EDITORIAL DE LA LANDING (editable desde CMS, sin tocar código) ===
  sectores: SectorContent[];
  casos: CaseSlideContent[];
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  trust_marquee: TrustMarqueeContent;
  problem_solving: ProblemCardContent[];
  process_pipeline: ProcessStepContent[];
  disciplines: DisciplineContent[];
  services: ServiceContent[];
  certificaciones: string[];
}

export interface TrustMarqueeClient {
  name: string;
  // URL del logo (white-label: cada tenant sube el suyo). Si está vacío,
  // se muestra el nombre en texto como fallback — nunca bloquea la publicación.
  logoUrl?: string;
}

export interface TrustMarqueeContent {
  eyebrow: string;
  statLine: string;
  clients: TrustMarqueeClient[];
}

export interface ProblemCardContent {
  hook: string;
  story: string;
  statBefore: string;
  statAfter: string;
  statLabel: string;
}

export interface ProcessStepContent {
  name: string;
  headline: string;
  description: string;
  duration: string;
  deliverables: string[];
}

export interface DisciplineContent {
  name: string;
  shortDescription: string;
  statValue: string;
  statLabel: string;
  deliverables: string[];
}

export interface ServiceContent {
  name: string;
  shortDescription: string;
  longDescription: string;
  deliverable: string;
}

export interface ChatbotStep {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: { label: string; action: string }[];
  // Si se asigna, este mensaje se muestra automáticamente como punto de
  // entrada cuando el usuario abre el chat estando en ese paso del Wizard
  // (1=Servicio, 2=Análisis, 3=Contacto, 4=Cálculos, 5=Resultado). Opcional
  // — sin asignar, el step solo se alcanza navegando el árbol de opciones.
  forWizardStep?: number;
}

export interface SectorContent {
  name: string;
  shortDescription: string;
}

export interface HeroSlideContent {
  eyebrow: string;
  titleMain: string;
  titleItalic: string;
  desc: string;
  tag: string;
  duration: string;
  mediaLabel: string;
  photoUrl: string;
  photoAlt: string;
}

export interface CaseResultRow {
  label: string;
  before: string;
  after: string;
}

export interface CaseSlideContent {
  sector: string;
  location: string;
  year: string;
  titleMain: string;
  titleItalic: string;
  photoUrl: string;
  photoAlt: string;
  results: CaseResultRow[];
  quote: string;
  quoteAuthor: string;
  quoteRole: string;
}

// Default settings. Genericos: cualquier tenant recibe estos defaults si
// no tiene tenant_settings propio en Supabase. La personalizacion se
// hace desde el CMS de branding (no hay hardcoded por tenant).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getBrandingDefaults(_tenantCode?: string | null): BrandingConfig {
  return {
    // Subsection A
    nombre_comercial: "Empresa B2B",
    razon_social: "Empresa B2B S.A.",
    nit: "000.000.000-0",
    direccion: "Sin dirección",
    ciudad: "Ciudad",
    pais: "País",
    telefono_principal: "+00 000 000 0000",
    email_corporativo: "info@empresa.com",
    web: "https://empresa.com",
    zona_horaria: "America/Bogota",
    idioma: "es",
    moneda: "COP",
    formato_fecha: "DD/MM/YYYY",
    formato_hora: "HH:mm",
    separador_decimal: ",",
    separador_miles: ".",

    // Subsection B
    logo_claro_url: "",
    logo_oscuro_url: "",
    logo_login_url: "",
    logo_pdf_url: "",
    favicon_url: "",
    splash_url: "",
    loader_url: "",
    icono_movil_url: "",
    whatsapp: "",

    // Subsection C
    color_primario: "#2563EB",
    color_secundario: "#0F172A",
    color_exito: "#10B981",
    color_warning: "#F59E0B",
    color_danger: "#EF4444",
    color_info: "#3B82F6",

    // Subsection D
    tipografia_principal: "Inter",
    border_radius: "8px",
    sombras: "sutil",
    animaciones: "activadas",

    // Documentos
    firma_url: "",
    sello_url: "",

    // Nuevas configuraciones con defaults
    nombre_erp: "Administrador ERP",
    nombre_portal_cliente: "Portal Cliente",
    titulo_navegador: "Plataforma B2B",
    landing_video_url: "/video_hero.mp4",
    landing_titulo: "SOLUCIONES INDUSTRIALES",
    landing_subtitulo: "Plataforma integral de servicios y gestión B2B",
    dossier_url: "",
    plantilla_correo_asunto: "[{{nombre_comercial}}] Notificación de sistema",
    plantilla_correo_cuerpo: "Estimado cliente,\n\nEste es un mensaje automático de la plataforma.\n\nAtentamente,\nEl Equipo.",
    plantilla_pdf_encabezado: "DOCUMENTO OFICIAL",
    plantilla_pdf_pie: "Generado por Sistema B2B",

    // Nuevos defaults
    version_sistema: "v1.0.0",
    copyright_footer: "© 2026 Empresa B2B. Todos los derechos reservados.",
    red_linkedin: "https://linkedin.com/company/empresa",
    red_youtube: "https://youtube.com/c/empresa",
    red_instagram: "https://instagram.com/empresa",
    red_twitter: "https://twitter.com/empresa",
    hero_tipo_fondo: "imagen",
    landing_imagen_url: "/industrial_plant_ventilation.webp",
    prefijo_referencias: "REF-CYH",

    // === HERO EDITABLE (defaults) ===
    hero_eyebrow: "Ingeniería de ventilación industrial",
    hero_cta_primario_label: "Iniciar Cotización Industrial",
    hero_cta_secundario_label: "Conocer el proceso",
    hero_slides: [
      {
        eyebrow: "DIAGNÓSTICO TÉCNICO",
        titleMain: "El control del aire",
        titleItalic: "empieza por medirlo.",
        desc: "Visita en planta con instrumentación calibrada. Mapeo de caudales, presión y temperatura antes de proponer una sola pieza de equipo.",
        tag: "INSTRUMENTACIÓN CALIBRADA",
        duration: "5–8 días de diagnóstico",
        mediaLabel: "video: medición en planta",
        photoUrl: "/industrial_plant_ventilation.webp",
        photoAlt: "Instrumentación calibrada midiendo caudal en planta",
      },
      {
        eyebrow: "SIMULACIÓN Y DISEÑO",
        titleMain: "El aire se diseña",
        titleItalic: "antes de fabricarse.",
        desc: "Modelado CFD 3D del comportamiento del aire. Selección de equipos y memoria de cálculo firmada por ingeniero responsable.",
        tag: "SIMULACIÓN CFD 3D",
        duration: "10–14 días de diseño",
        mediaLabel: "video: simulación CFD del flujo de aire",
        photoUrl: "/axial_duct_fan.webp",
        photoAlt: "Simulación y diseño de ductos de ventilación axial",
      },
      {
        eyebrow: "EJECUCIÓN DE INGENIERÍA",
        titleMain: "El control del aire",
        titleItalic: "que sostiene su planta.",
        desc: "Fabricación en planta propia con acero certificado. Balanceo ISO 1940 G2.5 e instalación con cero paradas no planificadas.",
        tag: "ZONA DE COLADA · +45°C",
        duration: "20–35 días de ejecución",
        mediaLabel: "foto: fabricación y montaje certificado",
        photoUrl: "/industrial_centrifugal_fan.webp",
        photoAlt: "Fabricación y montaje certificado de ventilador centrífugo",
      },
      {
        eyebrow: "RESULTADOS GARANTIZADOS",
        titleMain: "El aire, verificado.",
        titleItalic: "no prometido.",
        desc: "Medición post-instalación y reporte de cumplimiento frente al diseño. Línea directa con ingeniería, sin intermediarios.",
        tag: "RESULTADOS AUDITADOS",
        duration: "Continuo · mantenimiento programado",
        mediaLabel: "foto: medición y certificación post-instalación",
        photoUrl: "/rotor_dynamic_balancing.webp",
        photoAlt: "Medición y certificación de balanceo dinámico post-instalación",
      },
    ],

    chatbot_steps: [
      {
        id: "main_menu",
        sender: "bot",
        text: "Bienvenido al portal de Asistencia e Ingeniería B2B. Para optimizar su tiempo, indíquenos cómo prefiere que le ayudemos a dimensionar su proyecto:",
        options: [
          { label: "Necesito guía paso a paso 🧭", action: "guia_basica" },
          { label: "Tengo mis parámetros técnicos ⚙️", action: "acceso_experto" },
          { label: "Ver fichas técnicas 📄", action: "fichas" },
          { label: "Contactar a un ingeniero 👷", action: "sedes" }
        ]
      },
      {
        id: "guia_basica",
        sender: "bot",
        text: "¡Excelente! No necesita ser un experto. Nuestro sistema interactivo le hará preguntas sencillas sobre su espacio (Largo, Ancho, Alto) y el tipo de actividad que realiza.\n\nCon esos datos básicos, nosotros nos encargamos de calcular automáticamente los caudales requeridos y le recomendaremos el equipo ideal.",
        options: [
          { label: "Iniciar Asistente Guiado 📐", action: "go_wizard" },
          { label: "Volver al menú ↩️", action: "main_menu" }
        ]
      },
      {
        id: "acceso_experto",
        sender: "bot",
        text: "Perfecto. Ingrese directamente al Motor de Preingeniería. El sistema procesará sus variables de infraestructura y renovaciones por hora (ACH) bajo estándares normativos (ej. ASHRAE), determinando el caudal exacto (CFM) y sugiriendo los materiales constructivos idóneos.",
        options: [
          { label: "Ir al Motor de Cálculo ➔", action: "go_wizard" },
          { label: "Volver al menú ↩️", action: "main_menu" }
        ]
      },
      {
        id: "fichas",
        sender: "bot",
        text: "Disponemos de fichas técnicas y planos CAD (STEP/DWG) para todas nuestras líneas de turbomaquinaria industrial: Extractores Axiales, Centrífugos, Extractores Hongo en Inoxidable y gabinetes acústicos. Puede explorarlos directamente en la sección 'Catálogo Técnico'.",
        options: [
          { label: "Ir al Catálogo Técnico ➔", action: "go_catalog" },
          { label: "Volver al Menú Principal ↩️", action: "main_menu" }
        ]
      },
      {
        id: "sedes",
        sender: "bot",
        text: "Contamos con soporte técnico y preingeniería especializada:\n\n📍 Sede Principal:\nZona Industrial\n📧 Email: soporte@empresa.com\n📞 Teléfono: +00 000 000 0000",
        options: [
          { label: "Enviar Formulario de Contacto ✉️", action: "go_contact" },
          { label: "Volver al Menú Principal ↩️", action: "main_menu" }
        ]
      },
      {
        id: "ayuda_paso1_servicio",
        sender: "bot",
        text: "Estás en el Paso 1 (Servicio). Aquí eliges qué tipo de solución necesitas (ventilación general, extracción localizada, climatización de precisión, etc.) y la prioridad del proyecto.\n\n¿No sabes cuál aplica a tu caso? Descríbenos brevemente tu espacio y actividad, y un ingeniero te confirma la categoría correcta.",
        forWizardStep: 1,
        options: [
          { label: "No sé cuál elegir, hablar con un ingeniero 👷", action: "sedes" },
          { label: "Ver menú completo ↩️", action: "main_menu" }
        ]
      },
      {
        id: "ayuda_paso2_analisis",
        sender: "bot",
        text: "Estás en el Paso 2 (Análisis). Aquí pedimos las dimensiones de tu espacio (Largo, Ancho, Alto) y el ACH requerido.\n\nACH = Renovaciones de Aire por Hora: cuántas veces se reemplaza completamente el aire del espacio en una hora. Depende de la actividad — por ejemplo, una bodega necesita menos ACH que un área de soldadura. Si no conoces tu ACH, indícanos la actividad que se realiza en el espacio y te sugerimos el rango correcto.",
        forWizardStep: 2,
        options: [
          { label: "No sé qué ACH necesito 🤔", action: "sedes" },
          { label: "Ver menú completo ↩️", action: "main_menu" }
        ]
      },
      {
        id: "ayuda_paso3_contacto",
        sender: "bot",
        text: "Estás en el Paso 3 (Contacto). Solicitamos tus datos de empresa para poder enviarte la cotización formal y que un ingeniero de nuestro equipo pueda darle seguimiento a tu caso.\n\nTus datos no se comparten con terceros y solo se usan para este proceso de cotización.",
        forWizardStep: 3,
        options: [
          { label: "¿Por qué necesitan mi NIT/empresa? ℹ️", action: "sedes" },
          { label: "Ver menú completo ↩️", action: "main_menu" }
        ]
      },
      {
        id: "ayuda_paso4_calculos",
        sender: "bot",
        text: "Estás en el Paso 4 (Cálculos). Aquí verás el CFM requerido — Pies Cúbicos por Minuto, la medida de cuánto aire debe mover el equipo — y una estimación preliminar de inversión según el equipo recomendado.\n\nEsta es una estimación automática basada en tus datos; el ingeniero la valida y ajusta antes de la cotización final.",
        forWizardStep: 4,
        options: [
          { label: "Quiero que un ingeniero revise mi caso 👷", action: "sedes" },
          { label: "Ver menú completo ↩️", action: "main_menu" }
        ]
      },
      {
        id: "ayuda_paso5_resultado",
        sender: "bot",
        text: "¡Listo! Este es tu resultado preliminar. El siguiente paso es que un ingeniero revise los detalles de tu proyecto y te contacte con la cotización formal y el equipo específico recomendado.",
        forWizardStep: 5,
        options: [
          { label: "Hablar con un ingeniero ahora 👷", action: "sedes" },
          { label: "Ver menú completo ↩️", action: "main_menu" }
        ]
      }
    ],

    sectores: [
      { name: "Minería y siderurgia", shortDescription: "Extracción de polvos metálicos, humos de arco eléctrico y gases de procesos térmicos en condiciones severas. Tolerancia a partículas abrasivas y temperaturas > 200°C." },
      { name: "Data centers", shortDescription: "Climatización de precisión con redundancia N+1. Filtración HEPA H13, variadores de frecuencia, monitoreo BMS. Cumplimiento ASHRAE 62.1 y TIA-942 Tier IV." },
      { name: "Manufactura y alimentos", shortDescription: "Ventilación general, extracción localizada en soldadura, cabinas de pintura. Materiales sanitizables (acero galvanizado, inoxidable). Cumplimiento HACCP / INVIMA." },
      { name: "Procesamiento químico", shortDescription: "Extracción de vapores en áreas clasificadas ATEX Zone 1. Materiales resistentes a ambientes agresivos (PVC, PP, FRP). Sistemas cerrados con monitoreo continuo." },
    ],
    // Sin casos de éxito por defecto: no se debe fabricar testimonios ni
    // atribuir resultados a empresas reales sin su consentimiento. Cada
    // tenant carga sus propios casos (reales, con permiso del cliente)
    // desde el CMS antes de publicar su sitio.
    casos: [],
    certificaciones: ["AMCA", "ISO 1940 G2.5", "ASHRAE 62.1"],
    meta_title: "Sistemas de Ventilación Industrial Premium",
    meta_description: "Diseño, fabricación e instalación de sistemas industriales de ventilación B2B.",
    meta_keywords: "ventilación, extractor axial, extractor hongo, AMCA",

    // Sin clientes de referencia por defecto: nombrar empresas reales como
    // clientes sin su consentimiento es un riesgo legal, no solo de marca.
    // Cada tenant carga su propia lista desde el CMS.
    trust_marquee: {
      eyebrow: "Empresas que confían en nuestra ingeniería",
      statLine: "22 años · +310 operaciones completadas",
      clients: [],
    },

    problem_solving: [
      {
        hook: "Una auditoría no se gana con equipos nuevos.",
        story: "RETIE, RAS, OSHA, AMCA — los marcos regulatorios cambian cada año. El riesgo no es técnico, es de negocio. Una no conformidad cuesta USD 80K en promedio y detiene operaciones.",
        statBefore: "62%", statAfter: "100%", statLabel: "Cumplimiento RETIE verificado",
      },
      {
        hook: "El 47% de la factura eléctrica se va en aire.",
        story: "Los sistemas heredados operan fuera de su curva de diseño. Sobredimensionados, desbalanceados, sin control. Cada kilovatio desperdiciado es margen operativo perdido.",
        statBefore: "100%", statAfter: "68%", statLabel: "Consumo eléctrico basal",
      },
      {
        hook: "A las 14:00 la planta deja de operar.",
        story: "En zonas de colada o soldadura, la temperatura ambiente cruza los 45°C durante 6 horas al día. La productividad cae 30%. El riesgo operativo se vuelve estructural.",
        statBefore: "47°C", statAfter: "25°C", statLabel: "Pico zona de colada",
      },
    ],

    process_pipeline: [
      {
        name: "Diagnóstico técnico",
        headline: "Medir antes de proponer.",
        description: "Visita en planta con instrumentación calibrada. Mapeo de caudales, presión, temperatura y partículas. Identificación de zonas muertas, turbulencias y sobrecargas.",
        duration: "5–8 días",
        deliverables: ["Mapa térmico y de caudales", "Curva actual de operación", "Reporte de hallazgos críticos"],
      },
      {
        name: "Simulación y diseño",
        headline: "Modelar la solución antes de fabricarla.",
        description: "Modelado CFD 3D del comportamiento del aire. Selección de equipos. Cálculo de ductos, dampers y transiciones. Memoria de cálculo firmada.",
        duration: "10–14 días",
        deliverables: ["Simulación CFD 3D", "Selección de equipos", "Planos de fabricación"],
      },
      {
        name: "Ejecución de ingeniería",
        headline: "Fabricación y montaje con estándares auditables.",
        description: "Manufactura en planta propia con acero certificado. Balanceo ISO 1940 G2.5. Instalación por equipo certificado con cero paradas no planificadas.",
        duration: "20–35 días",
        deliverables: ["Fabricación in-house", "Balanceo y pruebas de banco", "Instalación certificada"],
      },
      {
        name: "Resultados garantizados",
        headline: "Verificación con instrumentación, no con palabras.",
        description: "Medición post-instalación. Reporte de cumplimiento vs. diseño. Plan de mantenimiento programado. Línea directa con ingeniería.",
        duration: "Continuo",
        deliverables: ["Medición de cumplimiento", "Reporte certificado", "Mantenimiento programado"],
      },
    ],

    disciplines: [
      {
        name: "Ingeniería",
        shortDescription: "Diseño, simulación CFD y memoria de cálculo firmada por ingeniero responsable.",
        statValue: "10-14", statLabel: "días de diseño",
        deliverables: ["Simulación CFD 3D del flujo", "Selección óptima de equipos", "Memoria de cálculo firmada", "Planos de fabricación"],
      },
      {
        name: "Instalación",
        shortDescription: "Montaje mecánico certificado en planta operativa. Cero paradas no planificadas.",
        statValue: "5-10", statLabel: "días de montaje",
        deliverables: ["Montaje mecánico certificado", "Conexión eléctrica y variadores", "Puesta en marcha y balanceo", "Capacitación a operadores"],
      },
      {
        name: "Mantenimiento",
        shortDescription: "Programa preventivo que garantiza la continuidad operativa de la planta.",
        statValue: "12", statLabel: "meses entre visitas",
        deliverables: ["Análisis de vibración triaxial", "Termografía de motores", "Balanceo dinámico G2.5", "Reporte de condición auditado"],
      },
      {
        name: "Auditoría",
        shortDescription: "Medición aerodinámica en sitio. Curva de rendimiento certificada bajo normas AMCA.",
        statValue: "100%", statLabel: "normas AMCA",
        deliverables: ["Curva de rendimiento certificada", "Informe de eficiencia energética", "Análisis de cumplimiento RETIE", "Plan de optimización medible"],
      },
    ],

    services: [
      {
        name: "Balanceo Estático",
        shortDescription: "Corrección por adición o remoción de pesos para que el eje principal de inercias se aproxime al eje de giro hasta que la vibración residual esté dentro de niveles admisibles.",
        longDescription: "Servicio de balanceo estático en planta o in-situ. Aplicable a impulsores de ventiladores centrífugos y axiales. Utilizamos instrumentación digital de la más alta precisión y sensibilidad.",
        deliverable: "Certificado de balanceo ISO 1940 G2.5",
      },
      {
        name: "Mediciones Aerodinámicas",
        shortDescription: "Determinación de caudales y presiones estáticas de ventiladores. Levantamiento de curvas de rendimiento reales para validar el diseño vs. operación.",
        longDescription: "Caracterización aerodinámica completa: caudal, presión estática, presión total, velocidad de salida, eficiencia y nivel de ruido. Curva de rendimiento auditada en sitio.",
        deliverable: "Curva CFM vs Presión certificada",
      },
      {
        name: "Fabricación y Reparación",
        shortDescription: "Fabricación y reparación de ventiladores centrífugos y axiales. Reconstrucción, soldadura, alineación y balanceo estático en nuestra planta.",
        longDescription: "Manufactura y mantenimiento mayor de turbomaquinaria. Reconstrucción de impulsores, reemplazo de ejes, soldadura certificada, alineación láser y balanceo. Acero ASTM A36 certificado.",
        deliverable: "Reconstrucción completa con garantía 12 meses",
      },
      {
        name: "Sistemas Hongo de Extracción e Inyección",
        shortDescription: "Diseño, fabricación, construcción e instalación de sistemas de extracción e inyección de aire tipo hongo. Instrumentación digital de alta precisión.",
        longDescription: "Diseño e instalación de sistemas completos de extracción localizada tipo hongo. Aplicaciones: soldadura, vapores, polvos, ambientes corrosivos. Fabricación con acero galvanizado, inoxidable o al carbono según especificación.",
        deliverable: "Sistema llave en mano con puesta en marcha",
      },
    ],
  };
}
