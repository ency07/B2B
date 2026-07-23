# Quickstart: Validar cotizaciones en el Portal

## Prerrequisitos

- Migración `supabase/migrations/<timestamp>_portal_quotes.sql` aplicada al proyecto Supabase real.
- Un `client_contact` de prueba con `auth_user_id` seteado, o usar el modo admin-reviewer con
  `?client_id=<uuid>` en la URL del portal.
- Al menos una fila en `quotes` con `status = 'ENVIADA'` para ese cliente (los datos actuales solo
  tienen `APROBADA`/`BORRADOR` — puede requerir un `UPDATE` manual de prueba, o crear una nueva vía
  ERP, para probar el flujo de respuesta).

## Verificación a nivel de base de datos (antes de tocar UI)

```sql
-- Confirmar que las columnas nuevas existen y son nullable
select column_name, is_nullable from information_schema.columns
where table_name = 'quotes' and column_name like 'client_response%';

-- Confirmar que los RPC nuevos existen
select proname from pg_proc where proname like 'portal_%quote%';

-- Probar portal_get_client_quotes con un client_id real (como admin, vía SQL editor con rol authenticated simulado no es directo — probar desde la app es más confiable)
```

## Levantar el entorno

```bash
npm run dev
```

Ir a `http://localhost:3000/portal?tenant=acme&client_id=<uuid-con-datos>` (modo admin-reviewer) o
iniciar sesión como el `client_contact` de prueba.

## Escenarios a validar (mapean a spec.md → Acceptance Scenarios)

1. **Lista**: pestaña "Cotizaciones" muestra solo `ENVIADA/APROBADA/RECHAZADA/VENCIDA/CANCELADA`,
   nunca `BORRADOR/EN_REVISION`.
2. **Detalle**: abrir una cotización `ENVIADA` sin respuesta → ver items reales + totales + botones
   Aceptar/Rechazar.
3. **Aceptar**: clic en Aceptar → la tarjeta pasa a "Tu respuesta: Aceptada", sin botones.
4. **Rechazar sin motivo**: debe fallar con mensaje de validación (mínimo 10 caracteres).
5. **Rechazar con motivo**: se guarda `client_response_reason`.
6. **No se puede responder dos veces**: reabrir la misma cotización → solo lectura.
7. **Aislamiento**: intentar pasar el `quoteId` de otro cliente (vía devtools/network) →
   `portal_respond_to_quote` no afecta filas, retorna error genérico.
8. **PDF**: botón "Descargar PDF" genera un PDF con los datos reales de esa cotización.
9. **`quotes.status` intacto**: verificar en la BD que `status` de la cotización respondida NO
   cambió — sigue en `ENVIADA` — solo cambiaron las columnas `client_response*`.

## Verificación técnica

```bash
npx tsc --noEmit
npm run lint
npx vitest run
```
