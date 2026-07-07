import { Client } from 'pg';
import { getPgAdminConfig } from './lib/pg-admin-client';

const TENANT_ID = 'a0000000-0000-0000-0000-000000000000'; // ACME / AeroMax
const USER_ID = 'a9000000-0000-0000-0000-000000000000';   // Admin Acme
const SITE_ID = 'a1000000-0000-0000-0000-000000000000';   // Sede Central Acme
const AREA_ID = 'a7000000-0000-0000-0000-000000000000';   // Ingeniería

// 25 realistic B2B companies
const COMPANIES_DATA = [
  // --- BARRANQUILLA, COLOMBIA (13 companies) ---
  {
    legal_name: 'Cementos del Caribe S.A.S.',
    commercial_name: 'Cementos del Caribe',
    tax_id: 'NIT-800123456-1',
    industry: 'Cemento',
    website: 'www.cementosdelcaribe.com.co',
    email: 'compras@cementosdelcaribe.com.co',
    phone: '+57 5 350-1122',
    country: 'Colombia',
    state: 'Atlántico',
    city: 'Barranquilla',
    address: 'Vía 40 #77-150, Zona Industrial',
    contacts: [
      { first_name: 'José', last_name: 'García', position: 'Gerente de Mantenimiento', email: 'j.garcia@cementosdelcaribe.com.co', phone: '+57 300 123 4567' }
    ],
    project: {
      title: 'Sistema de Extracción de Polvo en Tolva 4',
      description: 'Cálculo de caudal requerido para extracción de material particulado en zona de carga de clinker. Severidad alta por polución.',
      category: 'FABRICACION',
      estimated_value: 28500000,
      priority: 'HIGH',
      status: 'EN_EJECUCION',
      job_title: 'Extractor Centrífugo AX-7500 en Tolva 4',
      quote_note: 'Propuesta comercial para extractor centrífugo a medida en acero reforzado con pintura epóxica anti-abrasiva.'
    }
  },
  {
    legal_name: 'Minera de Carbón del Cerrejón Limitada',
    commercial_name: 'Cerrejón Carbón',
    tax_id: 'NIT-800987654-2',
    industry: 'Minería',
    website: 'www.cerrejon.com.co',
    email: 'abastecimiento@cerrejon.com.co',
    phone: '+57 5 350-9988',
    country: 'Colombia',
    state: 'La Guajira',
    city: 'Barranquilla',
    address: 'Cra 53 #82-12, Edificio Empresarial',
    contacts: [
      { first_name: 'Ing. Carlos', last_name: 'Sarmiento', position: 'Superintendente de Ventilación', email: 'c.sarmiento@cerrejon.com.co', phone: '+57 312 987 6543' }
    ],
    project: {
      title: 'Ventilación Secundaria de Socavón Sur',
      description: 'Ventilador axial de alta contrapresión para inyección de aire fresco en túnel de acarreo. Condiciones extremas de polvo.',
      category: 'FABRICACION',
      estimated_value: 45000000,
      priority: 'CRITICAL',
      status: 'EN_EJECUCION',
      job_title: 'Sistemas de Inyección Axial Minera Cerrejón',
      quote_note: 'Propuesta de ventilador axial con álabes de paso variable y motor cerrado a prueba de explosión ATEX IP55.'
    }
  },
  {
    legal_name: 'Química Industrial de la Costa S.A.',
    commercial_name: 'QuimiCosta',
    tax_id: 'NIT-800456123-3',
    industry: 'Química',
    website: 'www.quimicosta.com.co',
    email: 'contacto@quimicosta.com.co',
    phone: '+57 5 379-3344',
    country: 'Colombia',
    state: 'Atlántico',
    city: 'Barranquilla',
    address: 'Zona Franca de Barranquilla, Lote 12',
    contacts: [
      { first_name: 'Dra. Sandra', last_name: 'Mendoza', position: 'Directora de Seguridad HSEQ', email: 's.mendoza@quimicosta.com.co', phone: '+57 310 456 7890' }
    ],
    project: {
      title: 'Extracción de Gases Ácidos en Línea 2',
      description: 'Diseño de extractor tipo hongo en acero inoxidable 316 para evacuar vapores corrosivos de reactores de síntesis.',
      category: 'FABRICACION',
      estimated_value: 19800000,
      priority: 'HIGH',
      status: 'FINALIZADO',
      job_title: 'Instalación Extractor de Techo QuimiCosta Hongo Inox',
      quote_note: 'Extractor centrífugo de techo tipo hongo, construcción total en acero inoxidable 316, motor IP65.'
    }
  },
  {
    legal_name: 'Harinera del Norte S.A.S.',
    commercial_name: 'Harinera del Norte',
    tax_id: 'NIT-890333222-4',
    industry: 'Alimentos',
    website: 'www.harineradelnorte.co',
    email: 'ingenieria@harineradelnorte.co',
    phone: '+57 5 360-4560',
    country: 'Colombia',
    state: 'Atlántico',
    city: 'Barranquilla',
    address: 'Calle 17 #2B-45, Las Nieves',
    contacts: [
      { first_name: 'Andrés', last_name: 'Pineda', position: 'Jefe de Planta', email: 'a.pineda@harineradelnorte.co', phone: '+57 301 789 0123' }
    ],
    project: {
      title: 'Ventilación e Higienización de Silos de Harina',
      description: 'Presurización y filtración de aire para evitar contaminación cruzada de harina y control térmico de silos.',
      category: 'VENTA',
      estimated_value: 15400000,
      priority: 'MEDIUM',
      status: 'ENTREGADO',
      job_title: 'Suministro Unidad de Ventilación Acústica Harinera',
      quote_note: 'Unidad de ventilación encajonada acústicamente con filtros de alta eficiencia MERV 13.'
    }
  },
  {
    legal_name: 'Clínica Portoazul Auna S.A.',
    commercial_name: 'Clínica Portoazul',
    tax_id: 'NIT-900555666-5',
    industry: 'Hospital / Salud',
    website: 'www.clinicaportoazul.com.co',
    email: 'mantenimiento@clinicaportoazul.com.co',
    phone: '+57 5 367-2500',
    country: 'Colombia',
    state: 'Atlántico',
    city: 'Barranquilla',
    address: 'Corredor Universitario Km 3, Cl 3B',
    contacts: [
      { first_name: 'Ing. Mateo', last_name: 'Ortega', position: 'Coordinador Biomédico', email: 'm.ortega@clinicaportoazul.com.co', phone: '+57 314 234 5678' }
    ],
    project: {
      title: 'Renovación de Aire Quirófano 5',
      description: 'Inyección de aire estéril y mantenimiento de presión positiva en sala de cirugía. Exigencia médica estricta.',
      category: 'MANTENIMIENTO',
      estimated_value: 8500000,
      priority: 'HIGH',
      status: 'CERRADO',
      job_title: 'Mantenimiento Correctivo Unidad Quirófano 5',
      quote_note: 'Cambio de filtros HEPA absolute, balanceo del ventilador y calibración de presiones diferenciales.'
    }
  },
  {
    legal_name: 'Laboratorios del Atlántico Ltda.',
    commercial_name: 'LabAtlántico',
    tax_id: 'NIT-800222111-6',
    industry: 'Laboratorio',
    website: 'www.labatlantico.co',
    email: 'calidad@labatlantico.co',
    phone: '+57 5 356-8899',
    country: 'Colombia',
    state: 'Atlántico',
    city: 'Barranquilla',
    address: 'Calle 79 #51B-88',
    contacts: [
      { first_name: 'Dra. Patricia', last_name: 'Vargas', position: 'Directora de Calidad', email: 'p.vargas@labatlantico.co', phone: '+57 320 987 1122' }
    ],
    project: {
      title: 'Campanas de Extracción Química Laboratorio Central',
      description: 'Suministro de extractores resistentes a solventes y reactivos químicos fuertes para cabinas de flujo.',
      category: 'VENTA',
      estimated_value: 12500000,
      priority: 'MEDIUM',
      status: 'COTIZACION',
      job_title: '',
      quote_note: 'Suministro de extractores tipo hongo de bajo ruido con recubrimiento epóxico resistente a reactivos químicos.'
    }
  },
  {
    legal_name: 'Siderúrgica del Norte S.A.',
    commercial_name: 'SiderNorte',
    tax_id: 'NIT-890200300-7',
    industry: 'Siderúrgica / Metales',
    website: 'www.sidernorte.com.co',
    email: 'proyectos@sidernorte.com.co',
    phone: '+57 5 375-6000',
    country: 'Colombia',
    state: 'Atlántico',
    city: 'Barranquilla',
    address: 'Vía 40 #85-220',
    contacts: [
      { first_name: 'Ing. Fernando', last_name: 'Correa', position: 'Jefe de Proyectos de Expansión', email: 'f.correa@sidernorte.com.co', phone: '+57 300 666 7777' }
    ],
    project: {
      title: 'Enfriamiento de Horno de Fundición de Acero',
      description: 'Inyección forzada de aire a alta velocidad para enfriamiento rápido de la zona de moldes. Altas temperaturas.',
      category: 'FABRICACION',
      estimated_value: 62000000,
      priority: 'CRITICAL',
      status: 'EN_EJECUCION',
      job_title: 'Sopladores Centrífugos Enfriamiento SiderNorte',
      quote_note: 'Fabricación especial de soplador centrífugo de alta presión con rotor balanceado dinámicamente ISO G2.5.'
    }
  },
  {
    legal_name: 'Instalaciones y Climas del Caribe S.A.S.',
    commercial_name: 'InstalClimas Caribe',
    tax_id: 'NIT-901444555-8',
    industry: 'Climatización',
    website: 'www.instalclimaskaribe.co',
    email: 'ventas@instalclimaskaribe.co',
    phone: '+57 5 385-1234',
    country: 'Colombia',
    state: 'Atlántico',
    city: 'Barranquilla',
    address: 'Carrera 46 #74-99',
    contacts: [
      { first_name: 'Luis', last_name: 'Bermúdez', position: 'Ingeniero de Ventas B2B', email: 'l.bermudez@instalclimaskaribe.co', phone: '+57 311 555 6677' }
    ],
    project: {
      title: 'Extractor de Humo para Parqueadero Subterráneo CC',
      description: 'Ventiladores axiales de chorro (Jet Fans) para dilución de CO y control de humos en parqueaderos subterráneos.',
      category: 'VENTA',
      estimated_value: 38000000,
      priority: 'HIGH',
      status: 'COTIZACION',
      job_title: '',
      quote_note: 'Cotización comercial para 4 ventiladores de tubo axial reversibles con motores certificados ATEX F300.'
    }
  },
  {
    legal_name: 'Sociedad Portuaria de Barranquilla S.A.',
    commercial_name: 'Puerto de Barranquilla',
    tax_id: 'NIT-800101202-9',
    industry: 'Puerto / Logística',
    website: 'www.puertodebarranquilla.com',
    email: 'operaciones@puertodebarranquilla.com',
    phone: '+57 5 330-7777',
    country: 'Colombia',
    state: 'Atlántico',
    city: 'Barranquilla',
    address: 'Calle 1 final, Zona Portuaria',
    contacts: [
      { first_name: 'Ing. Alfonso', last_name: 'De la Espriella', position: 'Director de Infraestructura', email: 'a.espriella@puertodebarranquilla.com', phone: '+57 318 444 8899' }
    ],
    project: {
      title: 'Ventilación de Bodega de Graneles Portuarios',
      description: 'Presurización cruzada para evitar la condensación y disipar polución en bodega de almacenamiento de maíz.',
      category: 'FABRICACION',
      estimated_value: 54000000,
      priority: 'HIGH',
      status: 'EN_EJECUCION',
      job_title: 'Sistemas de Presurización Cruzada Bodega Puerto',
      quote_note: 'Unidades axiales de pared con lamas de gravedad en aluminio y control automático de velocidad por sensores.'
    }
  },
  {
    legal_name: 'Vidrios y Cristales Templados S.A.S.',
    commercial_name: 'VidrioTemplado',
    tax_id: 'NIT-900888999-0',
    industry: 'Vidrio / Cerámica',
    website: 'www.vidriotemplado.co',
    email: 'planta@vidriotemplado.co',
    phone: '+57 5 365-4433',
    country: 'Colombia',
    state: 'Atlántico',
    city: 'Barranquilla',
    address: 'Vía Oriental Km 5, Soledad',
    contacts: [
      { first_name: 'Jorge', last_name: 'López', position: 'Jefe de Planta de Templado', email: 'j.lopez@vidriotemplado.co', phone: '+57 305 444 5566' }
    ],
    project: {
      title: 'Cortinas de Aire para Horno de Templado',
      description: 'Cortinas de aire de alta velocidad para contención térmica del horno de templado de vidrios de seguridad.',
      category: 'VENTA',
      estimated_value: 14200000,
      priority: 'MEDIUM',
      status: 'FINALIZADO',
      job_title: 'Suministro Cortinas de Aire Horno VidrioTemplado',
      quote_note: 'Suministro de cortinas de aire industriales AeroMax con difusores de precisión y motor monofásico de alta velocidad.'
    }
  },
  {
    legal_name: 'Textiles del Caribe S.A.',
    commercial_name: 'TexCaribe',
    tax_id: 'NIT-890111444-1',
    industry: 'Textil / Calzado',
    website: 'www.texcaribe.com.co',
    email: 'mantenimiento@texcaribe.com.co',
    phone: '+57 5 370-1200',
    country: 'Colombia',
    state: 'Atlántico',
    city: 'Barranquilla',
    address: 'Calle 30 #4-88',
    contacts: [
      { first_name: 'Andrés', last_name: 'Guzmán', position: 'Ingeniero de Servicios', email: 'a.guzman@texcaribe.com.co', phone: '+57 315 777 8888' }
    ],
    project: {
      title: 'Extracción de Pelusa de Hilatura',
      description: 'Línea de conductos y extractores axiales con filtros de mangas para remoción de pelusa y fibras textiles.',
      category: 'FABRICACION',
      estimated_value: 29000000,
      priority: 'MEDIUM',
      status: 'PROGRAMADO',
      job_title: 'Montaje Conductos y Extractores Planta Hilatura',
      quote_note: 'Fabricación y ensamble de extractores axiales con álabes aerodinámicos de alta resistencia a acumulación de fibras.'
    }
  },
  {
    legal_name: 'Generadora de Energía de la Costa S.A.S.',
    commercial_name: 'Gecelca',
    tax_id: 'NIT-800444333-2',
    industry: 'Energía',
    website: 'www.gecelca.com.co',
    email: 'compras@gecelca.com.co',
    phone: '+57 5 330-8800',
    country: 'Colombia',
    state: 'Atlántico',
    city: 'Barranquilla',
    address: 'Cra 54 #72-140',
    contacts: [
      { first_name: 'Ing. Rodrigo', last_name: 'Restrepo', position: 'Supervisor de Planta Térmica', email: 'r.restrepo@gecelca.com.co', phone: '+57 317 222 3344' }
    ],
    project: {
      title: 'Extracción de Sala de Motores de Combustión',
      description: 'Evacuación de calor residual y gases combustibles de la sala de motogeneradores. Exigencia crítica de seguridad.',
      category: 'FABRICACION',
      estimated_value: 78000000,
      priority: 'CRITICAL',
      status: 'EN_EJECUCION',
      job_title: 'Sistemas de Extracción Crítica Sala Motores Gecelca',
      quote_note: 'Diseño especial de extractor centrífugo ATEX con acoplamiento por polea y correas, rotor de aluminio antichispas.'
    }
  },
  {
    legal_name: 'Papeles del Caribe S.A.',
    commercial_name: 'PapelCaribe',
    tax_id: 'NIT-800555444-3',
    industry: 'Celulosa / Papel',
    website: 'www.papelcaribe.co',
    email: 'compras@papelcaribe.co',
    phone: '+57 5 379-5050',
    country: 'Colombia',
    state: 'Atlántico',
    city: 'Barranquilla',
    address: 'Corredor Industrial Vía a Juan Mina Km 4',
    contacts: [
      { first_name: 'Ing. Mauricio', last_name: 'Ochoa', position: 'Jefe de Operaciones Celulosa', email: 'm.ochoa@papelcaribe.co', phone: '+57 321 444 5555' }
    ],
    project: {
      title: 'Extracción de Vapor de Secadores de Papel',
      description: 'Extracción de vapores de agua calientes y altamente húmedos en la campana de secado de la máquina papelera.',
      category: 'FABRICACION',
      estimated_value: 41000000,
      priority: 'HIGH',
      status: 'EN_EJECUCION',
      job_title: 'Extractores de Vapor Campana de Secado PapelCaribe',
      quote_note: 'Extractor axial de turbina en acero inoxidable 316L con motor exterior aislado térmicamente para alta humedad.'
    }
  },

  // --- ALICANTE, ESPAÑA (12 companies) ---
  {
    legal_name: 'Cerámicas del Cid S.L.',
    commercial_name: 'Cerámicas del Cid',
    tax_id: 'ES-B12345678',
    industry: 'Vidrio / Cerámica',
    website: 'www.ceramicasdelcid.es',
    email: 'info@ceramicasdelcid.es',
    phone: '+34 96 512 3456',
    country: 'España',
    state: 'Alicante',
    city: 'Alicante',
    address: 'Polígono Industrial Las Atalayas, Parcela 14',
    contacts: [
      { first_name: 'Ramón', last_name: 'Vila', position: 'Jefe de Hornos de Cocción', email: 'r.vila@ceramicasdelcid.es', phone: '+34 600 123 456' }
    ],
    project: {
      title: 'Enfriamiento Rápido de Zona de Enfriado Horno 3',
      description: 'Inyección de alto flujo de aire filtrado para enfriado uniforme de piezas cerámicas salientes del horno.',
      category: 'FABRICACION',
      estimated_value: 32000,
      priority: 'HIGH',
      status: 'EN_EJECUCION',
      job_title: 'Sistemas de Soplado de Enfriado Cerámicas del Cid',
      quote_note: 'Soplador centrífugo industrial AeroMax de alta presión con aislamiento acústico y álabes curvados hacia atrás.'
    }
  },
  {
    legal_name: 'Calzados Elche Industrial S.A.',
    commercial_name: 'Elche Industrial',
    tax_id: 'ES-A87654321',
    industry: 'Textil / Calzado',
    website: 'www.elcheindustrial.es',
    email: 'compras@elcheindustrial.es',
    phone: '+34 96 568 9900',
    country: 'España',
    state: 'Alicante',
    city: 'Alicante',
    address: 'Polígono Industrial Carrús, C/ Platino 25',
    contacts: [
      { first_name: 'Javier', last_name: 'Martínez', position: 'Responsable de Producción', email: 'j.martinez@elcheindustrial.es', phone: '+34 611 223 344' }
    ],
    project: {
      title: 'Extracción de Disolventes en Línea de Pegado',
      description: 'Sistema de extracción localizada por campanas para vapores de colas y disolventes en la sección de montado.',
      category: 'FABRICACION',
      estimated_value: 22000,
      priority: 'HIGH',
      status: 'EN_EJECUCION',
      job_title: 'Extractores de Disolventes Montado Calzado Elche',
      quote_note: 'Suministro de extractores axiales con carcasa tubular y motor con certificación ATEX Zone 1 IIB T4.'
    }
  },
  {
    legal_name: 'Logística Portuaria de Alicante S.A.',
    commercial_name: 'AlicantePort Logística',
    tax_id: 'ES-A45612378',
    industry: 'Puerto / Logística',
    website: 'www.alicanteport.es',
    email: 'operaciones@alicanteport.es',
    phone: '+34 96 513 8800',
    country: 'España',
    state: 'Alicante',
    city: 'Alicante',
    address: 'Muelle de Poniente, S/N, Puerto de Alicante',
    contacts: [
      { first_name: 'José María', last_name: 'Peral', position: 'Jefe de Infraestructura Portuaria', email: 'jm.peral@alicanteport.es', phone: '+34 622 334 455' }
    ],
    project: {
      title: 'Ventilación Bodega de Cargas Peligrosas AP',
      description: 'Presurización y extracción forzada a prueba de chispas en la zona de almacenamiento temporal de químicos.',
      category: 'VENTA',
      estimated_value: 29500,
      priority: 'CRITICAL',
      status: 'FINALIZADO',
      job_title: 'Suministro de Unidades Axiales ATEX Muelle Poniente',
      quote_note: 'Suministro e instalación de ventiladores de pared helicoidales con compuertas antirretorno certificadas.'
    }
  },
  {
    legal_name: 'Hornos y Panificadoras del Sureste S.L.',
    commercial_name: 'PanSureste',
    tax_id: 'ES-B99001122',
    industry: 'Alimentos',
    website: 'www.pansureste.es',
    email: 'mantenimiento@pansureste.es',
    phone: '+34 96 525 6677',
    country: 'España',
    state: 'Alicante',
    city: 'Alicante',
    address: 'Polígono Industrial Pla de la Vallonga, C/ Trigo 4',
    contacts: [
      { first_name: 'Manuel', last_name: 'Gómez', position: 'Jefe de Mantenimiento de Planta', email: 'm.gomez@pansureste.es', phone: '+34 633 445 566' }
    ],
    project: {
      title: 'Extracción de Calor de Hornos Continuos',
      description: 'Evacuación de aire caliente acumulado sobre la campana de los hornos continuos de panadería. Altas temperaturas.',
      category: 'VENTA',
      estimated_value: 12800,
      priority: 'MEDIUM',
      status: 'ENTREGADO',
      job_title: 'Suministro Extractor Helicoidal Alta Temperatura',
      quote_note: 'Extractor helicoidal de techo resistente a temperaturas de hasta 150ºC de forma continua.'
    }
  },
  {
    legal_name: 'Hospital General Universitario de Alicante',
    commercial_name: 'Hospital Alicante',
    tax_id: 'ES-Q0300123A',
    industry: 'Hospital / Salud',
    website: 'www.hospitalgeneralalicante.san.gva.es',
    email: 'mantenimiento_hgua@gva.es',
    phone: '+34 96 593 3000',
    country: 'España',
    state: 'Alicante',
    city: 'Alicante',
    address: 'Pintor Baeza, 12',
    contacts: [
      { first_name: 'Dr. Francisco', last_name: 'Sanz', position: 'Ingeniero Jefe de Instalaciones', email: 'f.sanz@gva.es', phone: '+34 644 556 677' }
    ],
    project: {
      title: 'Presión Negativa en Sala de Aislamiento Infeccioso',
      description: 'Sistema de extracción controlado por sensor de presión para sala de aislamiento. Máxima fiabilidad de ventilación.',
      category: 'FABRICACION',
      estimated_value: 18500,
      priority: 'HIGH',
      status: 'CERRADO',
      job_title: 'Montaje Sistema Extracción Presión Negativa HGUA',
      quote_note: 'Extractor acústico en gabinete de alta estanqueidad con filtros HEPA H14 y sistema de bypass regulado.'
    }
  },
  {
    legal_name: 'Laboratorios Farmacéuticos Levantes S.A.',
    commercial_name: 'FarmaLevante',
    tax_id: 'ES-A99112233',
    industry: 'Laboratorio',
    website: 'www.farmalevante.es',
    email: 'calidad@farmalevante.es',
    phone: '+34 96 544 1122',
    country: 'España',
    state: 'Alicante',
    city: 'Alicante',
    address: 'Polígono Industrial Inbisa, Nave 8',
    contacts: [
      { first_name: 'Dra. María', last_name: 'Ortiz', position: 'Directora Técnica Farmacéutica', email: 'm.ortiz@farmalevante.es', phone: '+34 655 667 788' }
    ],
    project: {
      title: 'Ventilación Sala Blanca Envasado de Jarabes',
      description: 'Inyección de aire ultrafiltrado y control de humedad relativa para sala de envasado estéril.',
      category: 'MANTENIMIENTO',
      estimated_value: 7800,
      priority: 'HIGH',
      status: 'CERRADO',
      job_title: 'Mantenimiento Preventivo Climatizadora Levantes',
      quote_note: 'Calibración de caudal, desinfección de conductos de impulsión y sustitución de etapas de prefiltrado.'
    }
  },
  {
    legal_name: 'Siderurgia del Mediterráneo S.L.',
    commercial_name: 'SiderMed',
    tax_id: 'ES-B11223344',
    industry: 'Siderúrgica / Metales',
    website: 'www.sidermed.es',
    email: 'proyectos@sidermed.es',
    phone: '+34 96 588 5544',
    country: 'España',
    state: 'Alicante',
    city: 'Alicante',
    address: 'Polígono Industrial de Monforte del Cid, Parcela 2',
    contacts: [
      { first_name: 'Ignacio', last_name: 'Ferrer', position: 'Responsable de Hornos e Ingeniería', email: 'i.ferrer@sidermed.es', phone: '+34 666 778 899' }
    ],
    project: {
      title: 'Sistema de Aspiración de Humos de Colada',
      description: 'Campana de gran envergadura y extractor centrífugo acoplado para gases de fundición de chatarra de acero.',
      category: 'FABRICACION',
      estimated_value: 48000,
      priority: 'CRITICAL',
      status: 'EN_EJECUCION',
      job_title: 'Extractor de Humos de Colada Horno SiderMed',
      quote_note: 'Extractor centrífugo de alto rendimiento con transmisión por poleas, álabes de autolimpieza antidesgaste.'
    }
  },
  {
    legal_name: 'Instalaciones Técnicas Alicante S.A.',
    commercial_name: 'InstalTec Alicante',
    tax_id: 'ES-A44556677',
    industry: 'Climatización',
    website: 'www.instaltecalicante.es',
    email: 'proyectos@instaltecalicante.es',
    phone: '+34 96 512 8899',
    country: 'España',
    state: 'Alicante',
    city: 'Alicante',
    address: 'Avda. de Denia, 45, Planta 1',
    contacts: [
      { first_name: 'Carlos', last_name: 'Ruiz', position: 'Ingeniero Calculista de HVAC', email: 'c.ruiz@instaltecalicante.es', phone: '+34 677 889 900' }
    ],
    project: {
      title: 'Renovación de Aire de Palacio de Deportes Alicante',
      description: 'Presurización y evacuación de calor de pabellón multiusos para cumplimiento de normativa RITE.',
      category: 'VENTA',
      estimated_value: 36000,
      priority: 'HIGH',
      status: 'COTIZACION',
      job_title: '',
      quote_note: 'Suministro de 6 extractores centrífugos de tejado de gran caudal y bajo consumo con variador electrónico.'
    }
  },
  {
    legal_name: 'Cementos del Mediterráneo S.A.',
    commercial_name: 'CemMed',
    tax_id: 'ES-A99008877',
    industry: 'Cemento',
    website: 'www.cemmed.es',
    email: 'proyectos@cemmed.es',
    phone: '+34 96 535 4400',
    country: 'España',
    state: 'Alicante',
    city: 'Alicante',
    address: 'Ctra. de Novelda Km 8',
    contacts: [
      { first_name: 'Enrique', last_name: 'Pascual', position: 'Responsable de Mantenimiento Mecánico', email: 'e.pascual@cemmed.es', phone: '+34 688 990 011' }
    ],
    project: {
      title: 'Aspiración de Polvo Filtro de Mangas Chimenea',
      description: 'Ventilador soplador para transporte neumático e impulsión de gases filtrados a través de chimenea.',
      category: 'FABRICACION',
      estimated_value: 52000,
      priority: 'HIGH',
      status: 'EN_EJECUCION',
      job_title: 'Extractor Centrífugo Chimenea de Filtrado CemMed',
      quote_note: 'Ventilador centrífugo reforzado para polvo en suspensión, alabes radiales rectos y compuerta de regulación manual.'
    }
  },
  {
    legal_name: 'Depósitos y Logística Alicante S.L.',
    commercial_name: 'DepoLog Alicante',
    tax_id: 'ES-B88776655',
    industry: 'Puerto / Logística',
    website: 'www.depologalicante.es',
    email: 'logistica@depologalicante.es',
    phone: '+34 96 590 1234',
    country: 'España',
    state: 'Alicante',
    city: 'Alicante',
    address: 'Polígono Industrial Babel, Nave 4',
    contacts: [
      { first_name: 'Marta', last_name: 'Jiménez', position: 'Jefe de Operaciones de Depósito', email: 'm.jimenez@depologalicante.es', phone: '+34 699 001 122' }
    ],
    project: {
      title: 'Ventilación de Nave de Almacenamiento Alimentario',
      description: 'Extracción de calor diurno en cubierta metálica para mantenimiento de temperatura máxima de 25ºC en bodega.',
      category: 'VENTA',
      estimated_value: 16500,
      priority: 'MEDIUM',
      status: 'FINALIZADO',
      job_title: 'Instalación de Extractores de Cubierta DepoLog',
      quote_note: 'Unidades de ventilación AeroMax tipo hongo instaladas en tejado con deflectores de aire e interruptor de seguridad.'
    }
  },
  {
    legal_name: 'Químicas de Levante S.A.',
    commercial_name: 'QuimiLevante',
    tax_id: 'ES-A44005511',
    industry: 'Química',
    website: 'www.quimilevante.es',
    email: 'hseq@quimilevante.es',
    phone: '+34 96 515 4500',
    country: 'España',
    state: 'Alicante',
    city: 'Alicante',
    address: 'Camino Viejo de Elche Km 4',
    contacts: [
      { first_name: 'Dr. Alejandro', last_name: 'Santos', position: 'Director Técnico y de Planta', email: 'a.santos@quimilevante.es', phone: '+34 600 998 877' }
    ],
    project: {
      title: 'Lavador de Gases de Emisión en Cubierta',
      description: 'Inyección forzada a torre de lavado de gases con extractor anticorrosión. Entorno extremadamente agresivo.',
      category: 'FABRICACION',
      estimated_value: 39000,
      priority: 'HIGH',
      status: 'PROGRAMADO',
      job_title: 'Montaje de Extractor Anticorrosivo QuimiLevante',
      quote_note: 'Fabricación especial de ventilador centrífugo construido en Polipropileno (PP) de alta densidad, resistente a ácidos.'
    }
  },
  {
    legal_name: 'Alimentación Marina del Sureste S.A.',
    commercial_name: 'SeaFood Sureste',
    tax_id: 'ES-A99887766',
    industry: 'Alimentos',
    website: 'www.seafoodsureste.es',
    email: 'calidad@seafoodsureste.es',
    phone: '+34 96 580 4000',
    country: 'España',
    state: 'Alicante',
    city: 'Alicante',
    address: 'Polígono Industrial Salinetas, C/ Atún 3',
    contacts: [
      { first_name: 'Ing. Pedro', last_name: 'Navarro', position: 'Jefe de Mantenimiento Frigorífico', email: 'p.navarro@seafoodsureste.es', phone: '+34 611 998 877' }
    ],
    project: {
      title: 'Extracción de Olores en Sala de Eviscerado',
      description: 'Ventilación cruzada rápida e inyección de aire con filtros desodorizantes de carbón activado para sala de pescados.',
      category: 'FABRICACION',
      estimated_value: 26000,
      priority: 'MEDIUM',
      status: 'EN_EJECUCION',
      job_title: 'Sistemas de Renovación Aire Sala Eviscerado SeaFood',
      quote_note: 'Ventiladores axiales de pared helicoidales con lamas motorizadas y celdas de filtración de carbón activado.'
    }
  }
];

async function seed() {
  console.log('--------------------------------------------------');
  console.log('INICIANDO CONEXIÓN DIRECTA A POSTGRESQL (BYPASS)...');
  console.log('--------------------------------------------------');

  const client = new Client(getPgAdminConfig());

  await client.connect();
  console.log('¡Conectado directamente a PostgreSQL!');

  console.log('Deshabilitando triggers específicos de bloqueo de borrado...');
  await client.query("ALTER TABLE payments DISABLE TRIGGER trg_block_payment_delete;");
  await client.query("ALTER TABLE payments DISABLE TRIGGER trg_handle_payment_application;");
  await client.query("ALTER TABLE invoice_items DISABLE TRIGGER trg_block_invoice_item_delete;");
  await client.query("ALTER TABLE invoice_items DISABLE TRIGGER trg_invoice_item_totals_before;");
  await client.query("ALTER TABLE invoice_items DISABLE TRIGGER trg_invoice_item_totals_after;");
  await client.query("ALTER TABLE invoices DISABLE TRIGGER trg_block_invoice_delete;");
  await client.query("ALTER TABLE invoices DISABLE TRIGGER trg_invoice_immutability;");
  await client.query("ALTER TABLE job_activities DISABLE TRIGGER trg_block_activity_delete;");
  await client.query("ALTER TABLE jobs DISABLE TRIGGER trg_block_job_delete;");
  await client.query("ALTER TABLE quote_items DISABLE TRIGGER trg_block_physical_quote_item_delete;");
  await client.query("ALTER TABLE quotes DISABLE TRIGGER trg_block_physical_quote_delete;");
  await client.query("ALTER TABLE requirements DISABLE TRIGGER trg_block_physical_requirement_delete;");
  await client.query("ALTER TABLE leads DISABLE TRIGGER trg_block_lead_delete;");

  console.log('Limpiando datos transaccionales previos para el tenant ACME...');
  await client.query("DELETE FROM payments WHERE tenant_id = $1;", [TENANT_ID]);
  await client.query("DELETE FROM invoice_items WHERE tenant_id = $1;", [TENANT_ID]);
  await client.query("DELETE FROM invoices WHERE tenant_id = $1;", [TENANT_ID]);
  await client.query("DELETE FROM job_activities WHERE tenant_id = $1;", [TENANT_ID]);
  await client.query("DELETE FROM jobs WHERE tenant_id = $1;", [TENANT_ID]);
  await client.query("DELETE FROM quote_items WHERE tenant_id = $1;", [TENANT_ID]);
  await client.query("DELETE FROM quotes WHERE tenant_id = $1;", [TENANT_ID]);
  await client.query("DELETE FROM requirements WHERE tenant_id = $1;", [TENANT_ID]);
  await client.query("DELETE FROM leads WHERE tenant_id = $1;", [TENANT_ID]);
  await client.query("DELETE FROM client_contacts WHERE tenant_id = $1;", [TENANT_ID]);
  await client.query("DELETE FROM client_sites WHERE tenant_id = $1;", [TENANT_ID]);
  await client.query("DELETE FROM clients WHERE tenant_id = $1;", [TENANT_ID]);
  console.log('✓ Limpieza completada.');

  console.log('Re-habilitando triggers de bloqueo de borrado...');
  await client.query("ALTER TABLE payments ENABLE TRIGGER trg_block_payment_delete;");
  await client.query("ALTER TABLE payments ENABLE TRIGGER trg_handle_payment_application;");
  await client.query("ALTER TABLE invoice_items ENABLE TRIGGER trg_block_invoice_item_delete;");
  await client.query("ALTER TABLE invoice_items ENABLE TRIGGER trg_invoice_item_totals_before;");
  await client.query("ALTER TABLE invoice_items ENABLE TRIGGER trg_invoice_item_totals_after;");
  await client.query("ALTER TABLE invoices ENABLE TRIGGER trg_block_invoice_delete;");
  await client.query("ALTER TABLE invoices ENABLE TRIGGER trg_invoice_immutability;");
  await client.query("ALTER TABLE job_activities ENABLE TRIGGER trg_block_activity_delete;");
  await client.query("ALTER TABLE jobs ENABLE TRIGGER trg_block_job_delete;");
  await client.query("ALTER TABLE quote_items ENABLE TRIGGER trg_block_physical_quote_item_delete;");
  await client.query("ALTER TABLE quotes ENABLE TRIGGER trg_block_physical_quote_delete;");
  await client.query("ALTER TABLE requirements ENABLE TRIGGER trg_block_physical_requirement_delete;");
  await client.query("ALTER TABLE leads ENABLE TRIGGER trg_block_lead_delete;");

  let count = 0;
  for (const company of COMPANIES_DATA) {
    count++;
    console.log(`[${count}/25] Insertando ${company.legal_name}...`);

    // Insert client
    const resCli = await client.query(
      `INSERT INTO clients (
        tenant_id, client_code, client_type, legal_name, commercial_name, tax_id, industry, website, email, phone, country, state, city, address, assigned_user_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id;`,
      [
        TENANT_ID,
        `CLI-${Math.floor(100000 + Math.random() * 900000)}`, // temporary, trigger will overwrite if needed or we supply unique code
        'Empresa',
        company.legal_name,
        company.commercial_name,
        company.tax_id,
        company.industry,
        company.website,
        company.email,
        company.phone,
        company.country,
        company.state,
        company.city,
        company.address,
        USER_ID,
        'ACTIVO'
      ]
    );
    const clientId = resCli.rows[0].id;

    // Insert client site
    await client.query(
      `INSERT INTO client_sites (
        tenant_id, client_id, site_name, country, state, city, address, phone, is_billing, is_shipping
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [
        TENANT_ID,
        clientId,
        company.country === 'España' ? 'Sede Principal Alicante' : 'Planta Industrial Barranquilla',
        company.country,
        company.state,
        company.city,
        company.address,
        company.phone,
        true,
        true
      ]
    );

    // Insert contact
    const resCnt = await client.query(
      `INSERT INTO client_contacts (
        tenant_id, client_id, first_name, last_name, position, email, phone, mobile, is_primary, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id;`,
      [
        TENANT_ID,
        clientId,
        company.contacts[0].first_name,
        company.contacts[0].last_name,
        company.contacts[0].position,
        company.contacts[0].email,
        company.contacts[0].phone,
        company.contacts[0].phone,
        true,
        'ACTIVO'
      ]
    );
    const contactId = resCnt.rows[0].id;

    // Map risk level: 'LOW' -> 'FRIO', 'HIGH'/'CRITICAL' -> 'CALIENTE', 'MEDIUM' -> 'TIBIO'
    const spRiskLevel = company.project.priority === 'CRITICAL' ? 'CALIENTE' : company.project.priority === 'HIGH' ? 'CALIENTE' : 'TIBIO';
    const urgencyVal = company.project.priority === 'CRITICAL' || company.project.priority === 'HIGH' ? 'alta' : 'media';

    // Insert Lead trace
    await client.query(
      `INSERT INTO leads (
        tenant_id, lead_code, name, company_name, position, phone, email, city, urgency, lead_score, risk_level, is_verified, client_id, contact_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);`,
      [
        TENANT_ID,
        `LED-${Math.floor(100000 + Math.random() * 900000)}`,
        company.contacts[0].first_name + ' ' + company.contacts[0].last_name,
        company.legal_name,
        company.contacts[0].position,
        company.contacts[0].phone,
        company.contacts[0].email,
        company.city,
        urgencyVal,
        90,
        spRiskLevel,
        true,
        clientId,
        contactId,
        'NUEVO'
      ]
    );

    // Insert Project Requirement
    const resReq = await client.query(
      `INSERT INTO requirements (
        tenant_id, requirement_code, client_id, contact_id, title, description, category, source, created_by, sales_user_id, engineering_user_id, estimated_value, priority, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id;`,
      [
        TENANT_ID,
        `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
        clientId,
        contactId,
        company.project.title,
        company.project.description,
        company.project.category,
        'Formulario Web',
        USER_ID,
        USER_ID,
        USER_ID,
        company.project.estimated_value,
        company.project.priority,
        company.project.status === 'COTIZACION' ? 'COTIZACION' : 'OT_GENERADA'
      ]
    );
    const reqId = resReq.rows[0].id;

    // Insert Quote
    const resQte = await client.query(
      `INSERT INTO quotes (
        tenant_id, quote_code, client_id, requirement_id, assigned_user_id, notes, status, subtotal, total_amount, quote_date, valid_until
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, CURRENT_DATE + 30) RETURNING id;`,
      [
        TENANT_ID,
        `QT-${Math.floor(100000 + Math.random() * 900000)}`,
        clientId,
        reqId,
        USER_ID,
        company.project.quote_note,
        'APROBADA',
        company.project.estimated_value,
        Math.round(company.project.estimated_value * 1.19)
      ]
    );
    const quoteId = resQte.rows[0].id;

    // Insert Quote item
    await client.query(
      `INSERT INTO quote_items (
        tenant_id, quote_id, item_order, item_type, description, quantity, unit, unit_price, line_total
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
      [
        TENANT_ID,
        quoteId,
        1,
        'EQUIPO',
        company.project.title,
        1,
        'UNIDAD',
        company.project.estimated_value,
        company.project.estimated_value
      ]
    );

    // Insert Job (if status isn't just COTIZACION)
    if (company.project.status !== 'COTIZACION') {
      const resJob = await client.query(
        `INSERT INTO jobs (
          tenant_id, job_code, client_id, requirement_id, quote_id, site_id, area_id, title, description, assigned_user_id, planned_start_date, planned_end_date, actual_start_date, status, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '15 days', CURRENT_TIMESTAMP, $11, $12) RETURNING id;`,
        [
          TENANT_ID,
          `JOB-${Math.floor(100000 + Math.random() * 900000)}`,
          clientId,
          reqId,
          quoteId,
          SITE_ID,
          AREA_ID,
          company.project.job_title,
          company.project.description,
          USER_ID,
          company.project.status,
          company.project.priority
        ]
      );
      const jobId = resJob.rows[0].id;

      // Add dynamic activity log for manufacturing
      await client.query(
        `INSERT INTO job_activities (
          tenant_id, job_id, activity_code, title, description, assigned_user_id, planned_start_date, planned_end_date, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '2 days', $7, $8);`,
        [
          TENANT_ID,
          jobId,
          `ACT-CFD-${Math.floor(100000 + Math.random() * 900000)}`,
          'Simulación CFD y calibración inicial',
          'Cálculos de caudal validados por Ing. Carlos Mendoza. Listo para ensamble en taller.',
          USER_ID,
          'COMPLETADA',
          USER_ID
        ]
      );

      // Insert Invoice
      const isPaid = company.project.status === 'ENTREGADO' || company.project.status === 'CERRADO';
      const currency = company.country === 'España' ? 'EUR' : 'COP';
      const subtotal = company.project.estimated_value;
      const taxAmount = Math.round(subtotal * 0.19);
      const totalAmount = Math.round(subtotal * 1.19);
      const paidAmount = isPaid ? totalAmount : 0;
      const invoiceStatus = isPaid ? 'PAGADA' : 'EMITIDA';

      const resInv = await client.query(
        `INSERT INTO invoices (
          tenant_id, invoice_code, client_id, source_type, source_id, quote_id, job_id,
          invoice_date, due_date, currency_code, subtotal, discount_amount, tax_amount,
          total_amount, paid_amount, notes, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, CURRENT_DATE + 30, $8, $9, $10, $11, $12, 0, $13, 'BORRADOR', $14) RETURNING id;`,
        [
          TENANT_ID,
          `FAC-${Math.floor(100000 + Math.random() * 900000)}`,
          clientId,
          'JOB',
          jobId,
          quoteId,
          jobId,
          currency,
          subtotal,
          0,
          taxAmount,
          totalAmount,
          `Facturación por ${company.project.job_title}`,
          USER_ID
        ]
      );
      const invoiceId = resInv.rows[0].id;

      // Insert invoice line item
      await client.query(
        `INSERT INTO invoice_items (
          tenant_id, invoice_id, line_number, description, quantity, unit_price, discount_amount, tax_amount, line_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        [
          TENANT_ID,
          invoiceId,
          1,
          `Servicio de preingeniería y turbomaquinaria: ${company.project.title}`,
          1,
          subtotal,
          0,
          taxAmount,
          subtotal
        ]
      );

      // Update final status to EMITIDA first so payments can be applied
      await client.query(
        `UPDATE invoices SET status = 'EMITIDA', paid_amount = 0 WHERE id = $1;`,
        [invoiceId]
      );

      // Insert Payment if paid
      if (isPaid) {
        const paymentCode = `PAG-${Math.floor(100000 + Math.random() * 900000)}`;
        await client.query(
          `INSERT INTO payments (
            tenant_id, payment_code, client_id, invoice_id, amount, payment_date, payment_method, reference_number, status
          ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8);`,
          [
            TENANT_ID,
            paymentCode,
            clientId,
            invoiceId,
            totalAmount,
            'Transferencia',
            `REF-TX-${Math.floor(10000000 + Math.random() * 90000000)}`,
            'APLICADO'
          ]
        );
      }
    }
  }

  await client.end();
  console.log('--------------------------------------------------');
  console.log(`¡CARGA COMPLETADA! ${count} empresas B2B insertadas.`);
  console.log('--------------------------------------------------');
}

seed().catch(err => {
  console.error('Fallo crítico en el script de carga:', err);
  process.exit(1);
});
