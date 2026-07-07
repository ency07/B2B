# MATRIZ DE ESTADOS Y TRANSICIONES DE REQUERIMIENTOS (REQUIREMENTS STATES)

Este documento especifica la matriz oficial de estados, las transiciones permitidas y la lógica de validación del trigger de cambio de estado.

---

## 1. Estados Oficiales

1.  **`BORRADOR`:** Requerimiento en edición inicial por el creador.
2.  **`NUEVO`:** Requerimiento registrado oficialmente en la bandeja comercial.
3.  **`EN_REVISION`:** Análisis preliminar de viabilidad.
4.  **`DIAGNOSTICO`:** Asignado a un ingeniero para levantamiento técnico.
5.  **`COTIZACION`:** Requerimiento en cotización comercial.
6.  **`APROBACION`:** Cotización enviada a aprobación de gerencia o cliente.
7.  **`OT_GENERADA`:** Propuesta aprobada comercialmente, orden de trabajo generada.
8.  **`EJECUCION`:** Trabajo activo en campo.
9.  **`CERRADO`:** Trabajo ejecutado y requerimiento completado exitosamente.
10. **`CANCELADO`:** Requerimiento anulado.

---

## 2. Reglas de Validación por Estado (Observación 3 y 4)

El trigger `validate_requirement_state_transitions` valida las siguientes reglas en base de datos:

| Estado Destino | Regla de Validación / Prerrequisito |
| :--- | :--- |
| **`DIAGNOSTICO`** | Debe existir un Ingeniero asignado (`engineering_user_id IS NOT NULL`). |
| **`COTIZACION`** | Debe existir un Comercial asignado (`sales_user_id IS NOT NULL`) y haberse cargado el PDF de Diagnóstico (`document_type = 'DIAGNOSTIC'` y `mime_type = 'application/pdf'`). |
| **`APROBACION`** | Debe existir descripción comercial suficiente ($\ge 15$ caracteres) y la propuesta comercial en PDF (`document_type = 'QUOTE'` y `mime_type = 'application/pdf'`). |
| **`OT_GENERADA`** | Debe existir el documento firmado de Aprobación (`document_type = 'APPROVAL'`). |
| **`CANCELADO`** | Se debe definir un código de catálogo (`cancel_code` in `'CLIENTE_DESISTE'`, `'SIN_PRESUPUESTO'`, `'FUERA_ALCANCE'`, `'DUPLICADO'`, `'ERROR_REGISTRO'`, `'OTRO'`) y justificación (`cancel_reason` $\ge 10$ caracteres). |

---

## 3. Función de Validación en la Base de Datos

```sql
CREATE OR REPLACE FUNCTION validate_requirement_state_transitions()
RETURNS TRIGGER AS $$
DECLARE
    v_has_doc boolean;
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Validación de Cancelación Estructurada (Observación 4)
    IF NEW.status = 'CANCELADO' THEN
        IF NEW.cancel_code IS NULL THEN
            RAISE EXCEPTION 'Para cancelar un requerimiento se debe suministrar un código de catálogo (cancel_code).';
        END IF;
        IF NEW.cancel_reason IS NULL OR length(trim(NEW.cancel_reason)) < 10 THEN
            RAISE EXCEPTION 'Para cancelar un requerimiento se debe ingresar un motivo de justificación detallado (cancel_reason, mínimo 10 caracteres).';
        END IF;
        
        NEW.cancelled_by := get_current_user_id();
        NEW.cancelled_at := NOW();
        RETURN NEW;
    END IF;

    -- Validar Secuencia
    IF NEW.status = 'NUEVO' THEN
        IF OLD.status <> 'BORRADOR' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSIF NEW.status = 'EN_REVISION' THEN
        IF OLD.status <> 'NUEVO' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSIF NEW.status = 'DIAGNOSTICO' THEN
        IF OLD.status <> 'EN_REVISION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        -- Asignación obligatoria de Ingeniero (Observación 3)
        IF NEW.engineering_user_id IS NULL THEN
            RAISE EXCEPTION 'No se puede cambiar a DIAGNOSTICO sin un responsable de ingeniería asignado (engineering_user_id).';
        END IF;

    ELSIF NEW.status = 'COTIZACION' THEN
        IF OLD.status <> 'DIAGNOSTICO' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        -- Asignación obligatoria de Comercial (Observación 3)
        IF NEW.sales_user_id IS NULL THEN
            RAISE EXCEPTION 'No se puede cambiar a COTIZACION sin un comercial asignado (sales_user_id).';
        END IF;
        -- Validación de existencia de Diagnóstico PDF
        SELECT EXISTS (
            SELECT 1 FROM documents 
            WHERE entity_type = 'REQUIREMENT' 
              AND entity_id = NEW.id 
              AND document_type = 'DIAGNOSTIC'
              AND mime_type = 'application/pdf'
              AND deleted_at IS NULL
        ) INTO v_has_doc;

        IF NOT v_has_doc THEN
            RAISE EXCEPTION 'No se puede pasar a COTIZACION sin registrar al menos un documento de tipo DIAGNOSTIC en formato PDF.';
        END IF;

    ELSIF NEW.status = 'APROBACION' THEN
        IF OLD.status <> 'COTIZACION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        -- Validación de descripción
        IF NEW.description IS NULL OR length(trim(NEW.description)) < 15 THEN
            RAISE EXCEPTION 'La descripción debe contener detalles técnicos y comerciales (mínimo 15 caracteres) para proceder a APROBACION.';
        END IF;
        -- Validación de existencia de Cotización PDF
        SELECT EXISTS (
            SELECT 1 FROM documents 
            WHERE entity_type = 'REQUIREMENT' 
              AND entity_id = NEW.id 
              AND document_type = 'QUOTE'
              AND mime_type = 'application/pdf'
              AND deleted_at IS NULL
        ) INTO v_has_doc;

        IF NOT v_has_doc THEN
            RAISE EXCEPTION 'No se puede pasar a APROBACION sin registrar al menos un documento de tipo QUOTE en formato PDF.';
        END IF;

    ELSIF NEW.status = 'OT_GENERADA' THEN
        IF OLD.status <> 'APROBACION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        -- Validación de existencia de documento de Aprobación
        SELECT EXISTS (
            SELECT 1 FROM documents 
            WHERE entity_type = 'REQUIREMENT' 
              AND entity_id = NEW.id 
              AND document_type = 'APPROVAL'
              AND deleted_at IS NULL
        ) INTO v_has_doc;

        IF NOT v_has_doc THEN
            RAISE EXCEPTION 'No se puede pasar a OT_GENERADA sin registrar el documento de tipo APPROVAL.';
        END IF;

    ELSIF NEW.status = 'EJECUCION' THEN
        IF OLD.status <> 'OT_GENERADA' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSIF NEW.status = 'CERRADO' THEN
        IF OLD.status <> 'EJECUCION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSE
        RAISE EXCEPTION 'Estado no reconocido: %', NEW.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
