# Quickstart: Pasarela de Pagos Wompi/PSE

## Verificación SIN credenciales (disponible ahora)

1. `npx tsc --noEmit && npm run lint && npx vitest run` — el código debe compilar y pasar limpio
   aunque no haya credenciales.
2. Verificar el cálculo de firma contra el ejemplo oficial de Wompi (valor conocido, no depende de
   una cuenta real):
   - Input: `reference="sk8-438k4-xmxm392-sn2m2"`, `amount_in_cents=490000`, `currency="COP"`,
     `integrity_secret="prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6"` (ejemplo público de la
     documentación).
   - `computeIntegritySignature(...)` debe producir el mismo hash que el ejemplo Ruby de la
     documentación.
3. Simular un webhook con un secreto de prueba local (`WOMPI_EVENTS_SECRET=test_secret` en
   `.env.local` solo para esta prueba) y un payload construido a mano — confirmar que
   `verifyEventChecksum` acepta el checksum correcto y rechaza uno alterado.
4. Abrir el portal (factura con saldo pendiente) sin `WOMPI_PUBLIC_KEY` configurada — confirmar que
   se sigue viendo el mensaje "coordina con tu ejecutivo" (sin regresión).

## Activación con credenciales reales (pendiente del usuario)

1. Registrar cuenta en `comercios.wompi.co`, obtener `pub_test_...`/`prv_test_...` (llave pública/
   privada) y el **Integrity Secret** + **Events Secret** del dashboard ("Secretos de integración
   técnica").
2. Agregar a `.env`:
   ```
   WOMPI_PUBLIC_KEY=pub_test_...
   WOMPI_INTEGRITY_SECRET=...
   WOMPI_EVENTS_SECRET=...
   ```
3. Configurar la URL del webhook en el dashboard de Wompi: `https://<dominio>/api/webhooks/wompi`.
4. Prueba end-to-end: abrir una factura con saldo pendiente en el portal, pagar con la tarjeta de
   prueba `4242 4242 4242 4242` (aprobada en sandbox), confirmar que la factura pasa a
   `PAGADA`/`PARCIALMENTE_PAGADA` tras el webhook, y que `payments` tiene una fila nueva con
   `reference_number` = la referencia generada.
5. Repetir el mismo webhook (reenviar desde el dashboard de Wompi o simular) — confirmar que NO se
   crea un segundo pago.

## Verificación técnica

```bash
npx tsc --noEmit
npm run lint
npx vitest run
```
