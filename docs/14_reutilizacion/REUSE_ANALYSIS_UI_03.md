# REUSE_ANALYSIS: UI-03 — Autenticación (Login, Recovery y Reset Password)

**Fecha:** 2026-06-19
**Fase:** UI-03: Autenticación
**Estado:** EVALUADO

Para el módulo de autenticación (pantallas de acceso, recuperación e inyección visual de White Label en login), se auditan los recursos existentes y del ecosistema:

---

## 1. Análisis de Recurso: Supabase Auth SDK

*   **Licencia**: MIT
*   **Mantenimiento**: Muy activo.
*   **Estrellas (GitHub)**: ~6,000+ (`@supabase/supabase-js`)
*   **Ventajas**:
    *   Gestiona todo el ciclo de vida de sesiones, cookies de autenticación, JWT y tokens de recuperación de contraseña de forma segura.
    *   Ya se encuentra instalado en las dependencias del proyecto.
*   **Desventajas**:
    *   Requiere inicialización de cliente en el lado de cliente y servidor de Next.js.
*   **Veredicto**: **REUTILIZAR**
    *   *Justificación*: Evita la reimplementación de almacenamiento de cookies y desencriptación de tokens JWT.

---

## 2. Análisis de Recurso: React Hook Form & Zod

*   **Licencia**: MIT
*   **Mantenimiento**: Muy activo.
*   **Ventajas**:
    *   Estándares oficiales definidos en el catálogo de componentes para la validación y captura estructurada de datos.
*   **Desventajas**:
    *   Requiere instalación de dependencias en `package.json`.
*   **Veredicto**: **REUTILIZAR**
    *   *Justificación*: Para asegurar consistencia en el manejo de inputs y validación de correo/contraseña.

---

## 3. Decisiones de Adquisición/Reutilización Registradas

| Recurso | Decisión | Uso en UI-03 |
|---|---|---|
| `@supabase/supabase-js` | REUTILIZAR | Cliente de autenticación para sign-in y recovery. |
| `react-hook-form` | REUTILIZAR | Manejo de formularios de Login y Recuperación. |
| `zod` | REUTILIZAR | Esquemas de validación de campos de credenciales. |
| `@hookform/resolvers` | REUTILIZAR | Enlace de Zod a React Hook Form. |
