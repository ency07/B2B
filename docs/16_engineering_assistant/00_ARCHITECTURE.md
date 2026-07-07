# FASE 35: Asistente de Preingeniería Industrial
# 00_ARCHITECTURE: Arquitectura General del Sistema

Este documento establece el diseño y la arquitectura empresarial del **Asistente de Preingeniería Industrial** (Ingeniero Virtual) integrado en el **ERP B2B Premium** (AeroMax Industrial).

---

## 1. Objetivo y Visión General

El Asistente de Preingeniería Industrial es un **motor de decisiones determinista y configurable** en base a reglas de negocio y árboles de decisión almacenados en base de datos.
*   **Preventa de Ingeniería**: Actúa como un ingeniero consultor digital que guía al cliente a través de una entrevista estructurada para descubrir sus necesidades operativas en ventilación y extracción.
*   **Sin Inteligencia Artificial**: No utiliza LLMs (no OpenAI, no Claude, no Gemini). Esto asegura consistencia, predictibilidad, cero alucinaciones y control absoluto sobre las estimaciones técnicas.
*   **Autoadministración Total**: Toda pregunta, flujo de ramificación, regla de negocio, puntaje de scoring, recomendación e informe se configura desde el panel administrativo del ERP sin tocar código.

---

## 2. Alcance del Sistema

*   **Entrevista Dinámica**: Generación de flujos de preguntas basados en respuestas anteriores de forma ramificada.
*   **Motor de Reglas**: Evaluación lógica de condiciones compuestas (Ej: `SI sector = minería Y temp > 40°C ENTONCES...`).
*   **Motor de Scoring**: Cálculo de criticidad, riesgo, urgencia, probabilidad comercial y valor de inversión.
*   **Motor de Recomendaciones**: Asociación de productos de inventario, accesorios, repuestos y servicios operativos.
*   **Motor de Diagnóstico**: Redacción del Pre-Diagnóstico técnico y resumen ejecutivo para el prospecto.
*   **Trazabilidad y Control B2B**: Persistencia en el ERP y conversión automática a Leads para el equipo comercial.

---

## 3. Modelo de Capas y Responsabilidades

```
+-------------------------------------------------------------------+
|                        PRESENTACIÓN (UI)                          |
|  - Wizard Público (WizardStepper.tsx - UX de Ingeniería)          |
|  - Panel del Administrador (Creación visual de árboles en ERP)    |
+-------------------------------------------------------------------+
|                          CAPA API                                 |
|  - Server Actions (/app/actions/assistant.ts)                     |
|  - Controladores de Sesiones, Transiciones y Reglas               |
+-------------------------------------------------------------------+
|                        MOTORES LÓGICOS                            |
|  - Flow Engine: Controla la navegación del árbol de decisiones.   |
|  - Rule Engine: Evalúa condiciones lógicas (AND/OR).              |
|  - Scoring Engine: Computa métricas de valor y riesgo.            |
|  - Recommendation Engine: Asocia SKUs y servicios.                |
|  - Diagnostic Engine: Genera el pre-diagnóstico final.            |
+-------------------------------------------------------------------+
|                        PERSISTENCIA (BD)                          |
|  - PostgreSQL + RLS (Aislamiento Multi-Tenant)                    |
|  - Esquema Relacional de Árboles, Nodos, Reglas y Sesiones        |
+-------------------------------------------------------------------+
```

---

## 4. Flujo General del Sistema (E2E)

```
[Visitante inicia Wizard] ──> [Crea Sesión (assistant_sessions)]
                                    │
                                    ▼
[Flow Engine recupera primer Nodo] <─── [Navegación / Respuesta]
  ├── Si es Pregunta: Muestra UI        │
  └── Si es Transición: Evalúa Rule Engine ───────────────────┘
                                    │
                       (Al llegar a Nodo Diagnóstico)
                                    ▼
                        [Ejecuta Scoring Engine]
                                    │
                                    ▼
                     [Ejecuta Recommendation Engine]
                                    │
                                    ▼
                       [Ejecuta Diagnostic Engine]
                                    │
                                    ▼
               [Crea Cliente/Contacto/Lead en base de datos]
                                    │
                                    ▼
         [Genera PDF local en cliente y redirige a WhatsApp]
```

---

## 5. Escalabilidad, Rendimiento y Multi-Tenant (White Label)

*   **Aislamiento SaaS (Multi-Tenant)**: Todas las tablas del motor contienen `tenant_id` obligatorio protegido mediante Row Level Security (RLS) en PostgreSQL. Un inquilino nunca puede visualizar o ejecutar el árbol de decisiones de otro.
*   **White Label Total**: Las preguntas, temas, logotipos de cabecera y colores de los botones del Wizard se cargan dinámicamente desde `tenant_settings` sin recompilar.
*   **Rendimiento y Caching**:
    *   Los árboles de decisión activos se recuperan en una sola consulta estructurada (`JSONB` agregados) y se conservan en la caché de servidor (Next.js Data Cache) para evitar sequential scans recurrentes en base de datos.
    *   La ejecución de las transiciones se calcula del lado del servidor para proteger las reglas de negocio propietarias de la empresa.
*   **Auditoría Inmutable**: Todo cambio en los árboles de decisión o ejecución de diagnósticos por clientes se registra en la tabla `audit_log` transversal del ERP.
