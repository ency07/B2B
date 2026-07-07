# FASE 35: Asistente de Preingeniería Industrial
# 09_PUBLIC_WIZARD: Asistente Público de Preventa (Wizard UI/UX)

Este documento define la estructura y experiencia de usuario del **Wizard Público** (Asistente de Preventa) integrado en la web externa, diseñado para interactuar con los visitantes de forma consultiva.

---

## 1. Objetivo y Alcance

El **Wizard Público** (`/wizard`) es la cara visible del Asistente de Preingeniería. Su objetivo es:
*   Entrevistar al visitante de forma dinámica consumiendo la estructura de nodos de base de datos.
*   Presentar un pre-diagnóstico técnico y estimación comercial de alta fidelidad.
*   Captar leads calificados para el ERP sin violar las políticas de seguridad (RLS).
*   Garantizar una experiencia interactiva sin parpadeos, adaptada a dispositivos móviles.

---

## 2. Flujo de Navegación y Captura de Datos

El Wizard se ejecuta mediante un enrutamiento en cliente (`"use client"`) estructurado en las siguientes fases:

### Fase 1: Inicialización y Carga del Árbol
*   Se lee el código de inquilino (`tenant_code` de URL o dominio) y se realiza una llamada asíncrona a la Server Action para recuperar el árbol de decisiones activo.
*   Se inicializa un token de sesión temporal en `localStorage` que apunta a `assistant_sessions.id`.

### Fase 2: Entrevista Dinámica (Form Builder)
*   El usuario responde las preguntas renderizadas por el Form Builder. Cada cambio realiza un guardado asíncrono intermitente en segundo plano (debounce de 1s) en la base de datos (`wizard_sessions`) para registrar abandonos.
*   **Controles Avanzados**:
    *   *Firma*: Panel de lienzo HTML5 (Canvas) para firma digital del disclaimer.
    *   *Archivos*: Carga directa de planos de planta a Supabase Storage (carpeta pública `/wizard-uploads/` con nombres UUID aleatorios).
    *   *GPS*: Solicitud de coordenadas del navegador para mapear altitud y condiciones climáticas de la zona.

### Fase 3: Captura de Oportunidad Comercial B2B (Paso Obligatorio)
*   Antes de mostrar el Diagnóstico Final y la estimación de precios, el sistema despliega el formulario B2B obligatorio (Nombre, Empresa, Cargo, Teléfono y Email Corporativo). Si el usuario abandona en este punto, el Lead ya queda registrado en el ERP clasificado como abandono de embudo para remarketing telefónico.

---

## 3. Prevención de Ruido Visual e Industrial Design (Siemens Style)

Siguiendo las reglas de la *Dirección de Arte de AeroMax*, la interfaz del Wizard debe:
*   Evitar marcos de neón, cajas oscuras parpadeantes y animaciones de rebote.
*   Utilizar bordes finos de zinc (`border-zinc-800`), tipografía Inter para preguntas y JetBrains Mono para valores técnicos.
*   Mostrar una barra de progreso sobria con hexágonos SCADA conectados por líneas finas, indicando el avance porcentual del cuestionario de forma discreta.
