# MODELO DE PERMISOS DE REQUERIMIENTOS (REQUIREMENTS PERMISSIONS)

Este documento detalla el control de acceso basado en roles (RBAC) para la creación y transición de estados del módulo de requerimientos (Pregunta 2 y Pregunta 3).

---

## 1. Permiso de Creación (Pregunta 2)

Solo los roles con atribuciones técnicas y comerciales pueden iniciar la captación de requerimientos de clientes.

*   **Permitido crear requerimientos:**
    *   `COMERCIAL` (Ejecutivo Comercial)
    *   `INGENIERO` (Ingeniero Técnico/Preventa)
    *   `SUPER_ADMIN` (Administrador global de plataforma)
*   **Bloqueado:** Todos los demás roles (ej. `AUDITOR`, `CLIENTE`, `OPERACIONES`).

---

## 2. Permiso por Transición de Estados (Pregunta 3)

| Transición de Estado | Roles Autorizados a Ejecutarla | Justificación Técnica |
| :--- | :--- | :--- |
| **Creación (INSERT)** | `COMERCIAL`, `INGENIERO` | Habilitación de requerimiento inicial. |
| `BORRADOR` $\rightarrow$ `NUEVO` | `COMERCIAL`, `INGENIERO` | Envío formal a bandeja de nuevos. |
| `NUEVO` $\rightarrow$ `EN_REVISION` | `COMERCIAL`, `INGENIERO` | Viabilidad y alcance técnico-comercial. |
| `EN_REVISION` $\rightarrow$ `DIAGNOSTICO` | `INGENIERO`, `GERENTE` | Asignación de ingenieros especializados. |
| `DIAGNOSTICO` $\rightarrow$ `COTIZACION` | `INGENIERO`, `COMERCIAL` | Registro de levantamiento de datos técnicos. |
| `COTIZACION` $\rightarrow$ `APROBACION` | `COMERCIAL` | Envío de propuesta formal al cliente. |
| `APROBACION` $\rightarrow$ `OT_GENERADA` | `GERENTE` | La gerencia del tenant aprueba y libera la OT. |
| `OT_GENERADA` $\rightarrow$ `EJECUCION` | `OPERACIONES`, `INGENIERO` | Personal técnico e ingenieros a cargo de campo. |
| `EJECUCION` $\rightarrow$ `CERRADO` | `OPERACIONES`, `GERENTE` | Entrega de obra/acta final y control directivo. |
| `Cualquier Estado` $\rightarrow$ `CANCELADO` | `COMERCIAL`, `GERENTE` | Anulación comercial del proceso (requiere motivo). |

---

## 3. Implementación de Permisos en Triggers (SQL)

La función de validación de roles en la base de datos es la siguiente:

```sql
CREATE OR REPLACE FUNCTION current_user_has_role(p_role_code varchar)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = get_current_user_id()
          AND r.role_code = p_role_code
          AND r.status = 'Activo'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```sql
CREATE OR REPLACE FUNCTION enforce_requirement_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Validar permiso de Creación (INSERT)
    IF TG_OP = 'INSERT' THEN
        IF NOT (is_platform_super_admin() OR current_user_has_role('COMERCIAL') OR current_user_has_role('INGENIERO')) THEN
            RAISE EXCEPTION 'Permiso Denegado: Su rol no está autorizado para crear requerimientos comerciales.';
        END IF;
        RETURN NEW;
    END IF;

    -- 2. Validar cambios de estado (UPDATE)
    IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
        -- El Super Admin de plataforma no se restringe por roles de negocio
        IF is_platform_super_admin() THEN
            RETURN NEW;
        END IF;

        -- Cancelación global
        IF NEW.status = 'CANCELADO' THEN
            IF NOT (current_user_has_role('COMERCIAL') OR current_user_has_role('GERENTE')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Comerciales o Gerentes pueden cancelar un requerimiento.';
            END IF;
            RETURN NEW;
        END IF;

        -- Transiciones específicas
        IF OLD.status = 'BORRADOR' AND NEW.status = 'NUEVO' THEN
            IF NOT (current_user_has_role('COMERCIAL') OR current_user_has_role('INGENIERO')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Comerciales o Ingenieros pueden registrar el requerimiento.';
            END IF;

        ELSIF OLD.status = 'NUEVO' AND NEW.status = 'EN_REVISION' THEN
            IF NOT (current_user_has_role('COMERCIAL') OR current_user_has_role('INGENIERO')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Comerciales o Ingenieros pueden poner el requerimiento en revisión.';
            END IF;

        ELSIF OLD.status = 'EN_REVISION' AND NEW.status = 'DIAGNOSTICO' THEN
            IF NOT (current_user_has_role('INGENIERO') OR current_user_has_role('GERENTE')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Ingenieros o Gerentes pueden enviar a diagnóstico.';
            END IF;

        ELSIF OLD.status = 'DIAGNOSTICO' AND NEW.status = 'COTIZACION' THEN
            IF NOT (current_user_has_role('INGENIERO') OR current_user_has_role('COMERCIAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Ingenieros o Comerciales pueden marcar el diagnóstico como terminado.';
            END IF;

        ELSIF OLD.status = 'COTIZACION' AND NEW.status = 'APROBACION' THEN
            IF NOT current_user_has_role('COMERCIAL') THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo el rol Comercial puede enviar a aprobación.';
            END IF;

        ELSIF OLD.status = 'APROBACION' AND NEW.status = 'OT_GENERADA' THEN
            IF NOT current_user_has_role('GERENTE') THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo la Gerencia puede aprobar y liberar la orden de trabajo.';
            END IF;

        ELSIF OLD.status = 'OT_GENERADA' AND NEW.status = 'EJECUCION' THEN
            IF NOT (current_user_has_role('OPERACIONES') OR current_user_has_role('INGENIERO')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo personal de Operaciones o Ingenieros pueden pasar el requerimiento a ejecución.';
            END IF;

        ELSIF OLD.status = 'EJECUCION' AND NEW.status = 'CERRADO' THEN
            IF NOT (current_user_has_role('OPERACIONES') OR current_user_has_role('GERENTE')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Operaciones o la Gerencia pueden cerrar formalmente el requerimiento.';
            END IF;

        ELSE
            RAISE EXCEPTION 'Transición de estado no autorizada por la matriz comercial o de roles.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
