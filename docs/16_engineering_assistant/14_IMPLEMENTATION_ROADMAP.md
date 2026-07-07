# FASE 35: Asistente de Preingeniería Industrial
# 14_IMPLEMENTATION_ROADMAP: Plan de Trabajo y Criterios de Aceptación

Este documento establece el plan de construcción incremental para el **Asistente de Preingeniería Industrial**, dividido en fases lógicas verificables para evitar roturas del sistema.

---

## 1. Plan de Trabajo por Hitos (Fases de Construcción)

```
[HITO 1: Base de Datos] ──> [HITO 2: Motores de Reglas] ──> [HITO 3: Panel ERP] ──> [HITO 4: Wizard Público] ──> [HITO 5: UAT & Cierre]
```

### HITO 1: Modelo de Datos & RLS (1 Turno)
*   **Construir**: Crear y aplicar la migración DDL conteniendo las 6 tablas (`assistant_trees`, `assistant_nodes`, `assistant_connections`, `assistant_conditions`, `assistant_sessions`, `assistant_diagnostics`), claves foráneas, restricciones, índices de rendimiento y políticas RLS.
*   **Verificación**: Ejecutar script SQL de validación de esquemas y permisos.

### HITO 2: Motores Lógicos & Server Actions (2 Turnos)
*   **Construir**: Implementar la lógica del Flow Engine, Rule Engine, Scoring Engine, Recommendation Engine y Diagnostic Engine en la carpeta `/src/utils/assistant/`. Crear las Server Actions de control de sesiones y mutaciones transaccionales en `/src/app/actions/assistant.ts`.
*   **Verificación**: Escribir y ejecutar pruebas unitarias (`test-assistant-engines.ts`) validando la ramificación del árbol y cálculo del score correctos.

### HITO 3: Panel Administrativo del ERP (2 Turnos)
*   **Construir**: Implementar el editor de árboles y la interfaz de configuración en el ERP (`/dashboard/settings/assistant`). Permitir la creación de nodos de preguntas, respuestas, reglas de impacto, asignación de puntajes y enlace de SKUs.
*   **Verificación**: Crear un árbol de prueba, validar que pase el test de ciclos acíclicos y guarde correctamente la versión en base de datos.

### HITO 4: Wizard Público & jsPDF (2 Turnos)
*   **Construir**: Reemplazar la maquetación estática de `/wizard` para consumir la API dinámica. Diseñar el SCADA Hexagon Stepper, el contador animado de CFM a 60fps, el HUD de severidad y el autocomplete de ciudades colombianas. Añadir la carga de jsPDF dinámico y el botón de WhatsApp.
*   **Verificación**: Completar la entrevista pública, descargar el PDF y corroborar que se asocie correctamente como lead en el ERP.

### HITO 5: Pruebas de Integración (UAT) y Go-Live (1 Turno)
*   **Construir**: Ejecutar el pipeline completo E2E de UAT simulando 100 respuestas diferentes, verificando la ausencia de leaks de RLS o desalineaciones de tipos.
*   **Verificación**: Go-Live checklist aprobado.

---

## 2. Criterios de Aceptación del Sistema

Para dar por concluida la implementación del Asistente, se deben cumplir obligatoriamente los siguientes requisitos:

1.  **Cero Hardcoding**: Ninguna pregunta, opción de respuesta o SKU recomendado puede vivir en el código TypeScript. Si el administrador cambia un producto en el ERP, el Asistente debe reflejarlo al instante.
2.  **Seguridad RLS y Service Role**: Las consultas públicas sólo leen datos. Las inserciones transaccionales de leads se realizan estrictamente por Server Action utilizando el rol de servicio (`supabaseAdmin`), garantizando que los visitantes no tengan RLS de escritura abierta en PostgreSQL.
3.  **PDF de 3 Páginas de Calidad**: El PDF debe diagramarse limpiamente con vectores de jsPDF y descargarse al instante sin errores de SSR o hidratación.
4.  **Cumplimiento de Tipos**: Compilación limpia mediante `tsc --noEmit` y `npm run build` sin fallos.
5.  **Auditabilidad**: Cada diagnóstico y cambio en las reglas de negocio debe registrarse en la tabla inmutable `audit_log`.
