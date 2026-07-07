# FASE 35: Asistente de Preingeniería Industrial
# 13_SEQUENCE_DIAGRAMS: Diagramas de Secuencia del Sistema

Este documento describe la secuencia temporal de mensajes, transacciones y lógica de ejecución para los dos casos de uso críticos del Asistente: la navegación y la resolución del diagnóstico final.

---

## 1. Secuencia de Transición y Evaluación de Nodos

Muestra cómo interactúan el cliente (Wizard UI), la Server Action (Flow Engine), el Motor de Reglas (Rule Engine) y PostgreSQL durante la navegación del árbol de decisiones.

```mermaid
sequenceNumber: true
sequenceDiagram
    autonumber
    actor Cliente as Visitante (UI)
    participant Action as Server Action (Flow Engine)
    participant Rule as Rule Engine
    participant DB as PostgreSQL (Supabase)

    Cliente->>Action: Iniciar Sesión (tenant_code)
    Action->>DB: Buscar Árbol Activo (tenant_id)
    DB-->>Action: Retorna id_arbol, nodo_inicial_id
    Action->>DB: Crear Sesión en assistant_sessions (IN_PROGRESS)
    DB-->>Action: Retorna session_token, primer_nodo
    Action-->>Cliente: Carga Pregunta Inicial (Paso 1)

    Cliente->>Action: Enviar Respuesta (nodo_actual, variables)
    Action->>DB: Registrar respuestas en JSONB (answers.variables)
    Action->>DB: Buscar conexiones salientes del nodo_actual
    DB-->>Action: Retorna conexiones (source, target, condition_id)

    alt Conexión con Condición (Bifurcación)
        Action->>Rule: Evaluar Regla (condition_id, answers.variables)
        Rule-->>Action: Retorna TRUE o FALSE
    else Conexión Directa
        Action->>Action: Seleccionar target_node_id directo
    end

    Action->>DB: Actualizar session (current_node_id = target_node_id)
    Action-->>Cliente: Carga Siguiente Pregunta / Nodo
```

---

## 2. Secuencia de Finalización, Diagnóstico y Registro Comercial

Muestra el flujo atómico al llegar al nodo de diagnóstico final. Se realiza la inserción transaccional de leads y la llamada al motor de generación de reportes en el cliente.

```mermaid
sequenceNumber: true
sequenceDiagram
    autonumber
    actor Cliente as Visitante (UI)
    participant Action as Server Action (Wizard Action)
    participant Score as Scoring Engine
    participant Reco as Recommendation Engine
    participant Diag as Diagnostic Engine
    participant DB as PostgreSQL (SupabaseAdmin)
    participant PDF as jsPDF (Cliente)

    Cliente->>Action: Confirmar Formulario B2B (Paso 3)
    Note over Action: Ejecución Transaccional Segura (Service Role)
    
    Action->>Score: Calcular Criticidad, Urgencia y Rango Comercial
    Score-->>Action: Retorna score_results (JSONB)
    
    Action->>Reco: Asociar SKUs de Equipos y Servicios del Catálogo
    Reco-->>Action: Retorna recommendations (JSONB)
    
    Action->>Diag: Redactar Resumen Ejecutivo y Pre-Diagnóstico
    Diag-->>Action: Retorna pre_diagnosis (texto + causas)

    Action->>DB: Upsert Cliente B2B (legal_name)
    DB-->>Action: Retorna client_id
    
    Action->>DB: Upsert Contacto B2B (email)
    DB-->>Action: Retorna contact_id
    
    Action->>DB: Insert Lead con Score y SLA (Riesgo en Español)
    DB-->>Action: Retorna lead_id
    
    Action->>DB: Insert Diagnostic Report (pre_diagnosis, scores, target products)
    DB-->>Action: Retorna diagnostic_code
    
    Action->>DB: Actualizar Sesión (status = COMPLETED)
    Action-->>Cliente: Retorna diagnostic_code, total_cfm, estimación, recomendación

    Cliente->>PDF: Descargar Reporte (Clic)
    Note over PDF: Importación Dinámica en Cliente
    PDF->>PDF: Dibujar Portada, Tablas de CFM, Precios y Disclaimer
    PDF-->>Cliente: Descarga de Reporte_Preingenieria.pdf (3 Páginas)
```
