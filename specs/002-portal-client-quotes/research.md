# Phase 0 Research: Cotizaciones en el Portal de Clientes

## Decisión 1: No usar `specs/06_database/04_TABLES_QUOTES_REQUIREMENTS.md` ni `specs/04_portal/03_PORTAL_QUOTES.md` como fuente de verdad

- **Decision**: Diseñar contra el schema real (verificado con `mcp__supabase__execute_sql`), no
  contra esos dos documentos.
- **Rationale**: `04_TABLES_QUOTES_REQUIREMENTS.md` describe tablas `cotizaciones`/`cotizacion_items`
  en español con estados `COTIZACION_BORRADOR` etc. — el schema real usa `quotes`/`quote_items` en
  inglés con estados `BORRADOR/EN_REVISION/ENVIADA/APROBADA/RECHAZADA/VENCIDA/CANCELADA`. Mismo
  patrón de drift ya encontrado en [001-web-catalog-category-filter] con el catálogo — confirma que
  `specs/0X_*` son diseño aspiracional, no el estado real, en todo el repo.

## Decisión 2: No tocar el motor de aprobación interno

- **Decision**: La respuesta del cliente se guarda en columnas nuevas (`client_response*`),
  separadas de `quotes.status`. Confirmado con el usuario tras encontrar los triggers reales.
- **Hallazgo que forzó esta decisión**: `quotes` tiene 11 triggers activos, entre ellos:
  - `enforce_quote_permissions()`: solo `GERENTE_GENERAL`/`DIRECTOR_COMERCIAL` (roles internos)
    pueden mover `status` a `APROBADA`/`RECHAZADA`. Un `client_contact` no tiene rol en ese sistema
    — la actualización sería rechazada por la BD sin importar cómo se invoque desde la app.
  - `validate_quote_state_transitions()`: `APROBADA` exige además que el `requirement` asociado
    esté en `APROBACION`; `RECHAZADA` exige `reject_reason` de mínimo 10 caracteres.
  - `route_quote_approvals()`: al pasar a `EN_REVISION` dispara un motor de aprobación por montos
    (`approval_rules`/`approval_requests`/`approval_steps`, multi-nivel) — confirma que "aprobar"
    es un proceso interno formal, no un clic del cliente.
  - `check_quote_approval_lock()`: bloquea cualquier cambio mientras haya una solicitud de
    aprobación `PENDIENTE`/`EN_PROCESO`.
- **Alternatives considered**: Modificar `enforce_quote_permissions`/`validate_quote_state_transitions`
  para aceptar también al `client_contact` dueño de la cotización — rechazada por el usuario:
  redefine qué significa `APROBADA` en todo el sistema y toca lógica de aprobación ya en producción
  (19 cotizaciones reales en estado `APROBADA`). Alto riesgo, fuera del alcance de este gap.

## Decisión 3: Atribución del actor de la respuesta del cliente

- **Decision**: Nueva columna `client_response_by uuid REFERENCES client_contacts(id)` (no
  `users(id)`).
- **Rationale**: Las columnas existentes `approved_by`/`rejected_by`/`status_changed_by` de
  `quotes` referencian `users(id)` (tabla de staff interno) — un `client_contact` no tiene fila ahí,
  así que no se pueden reutilizar para atribuir la respuesta del cliente sin violar la FK. Se
  agrega una columna propia con la FK correcta.

## Decisión 4: Filtro de visibilidad para el cliente

- **Decision**: `portal_get_client_quotes` solo devuelve `status IN ('ENVIADA','APROBADA',
  'RECHAZADA','VENCIDA','CANCELADA')` — nunca `BORRADOR`/`EN_REVISION`.
- **Rationale**: Esos dos estados son trabajo interno (la cotización aún se está armando o está en
  el flujo de aprobación por montos); mostrárselos al cliente sería exponer un documento a medio
  hacer. Dato real verificado: hoy existen 19 cotizaciones `APROBADA` y 4 `BORRADOR`, ninguna en
  `ENVIADA` — el flujo "enviar al cliente y esperar su respuesta" es exactamente lo que este
  feature habilita por primera vez.

## Decisión 5: Título de la cotización

- **Decision**: Derivar el título de `requirements.title` vía `quotes.requirement_id` (columna
  `NOT NULL`, siempre hay un requerimiento asociado). Fallback a `quote_code` si por algún motivo
  el join no resuelve.
- **Rationale**: `quotes` no tiene columna de título propia (verificado en `information_schema`);
  inventar una sería violar Principio I.

## Decisión 6: Trazabilidad de negocio de la respuesta

- **Decision**: El RPC `portal_respond_to_quote` inserta manualmente una fila en `business_events`
  (`event_code = 'QUOTE_CLIENT_RESPONSE'`).
- **Rationale**: `dispatch_quote_events()` solo reacciona a `UPDATE ... OF status` — como esta
  respuesta NO toca `status` (Decisión 2), ese trigger no se dispara. Sin este insert manual, la
  respuesta del cliente sería invisible en el Pulse Feed del dashboard ERP (regresión respecto al
  patrón ya establecido para business_events, cerrado en el gap E-005).

## Decisión 7: Testing / verificación de interacción

- **Decision**: Verificación primaria por inspección de datos/DOM (RPCs probadas con
  `execute_sql`, UI verificada con `javascript_tool` de solo lectura), no por clics simulados.
- **Rationale**: En el feature anterior ([001-web-catalog-category-filter]) el Browser pane de esta
  sesión no pudo hacer clic real en NINGÚN botón de la landing pública, ni siquiera en botones
  preexistentes — limitación de la herramienta, no del código. Se verificará si el portal tiene el
  mismo problema al llegar a la fase de implementación; si es así, se aplicará la misma estrategia
  de verificación por inspección directa y se dejará constancia explícita de qué falta una pasada
  manual humana.
