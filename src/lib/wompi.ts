/**
 * Wompi (Colombia) — firma de integridad del Widget y verificación de
 * checksum de webhooks. Funciones puras, sin I/O, verificadas contra los
 * ejemplos oficiales de docs.wompi.co (ver
 * specs/003-portal-wompi-payments/research.md, Decisiones 3 y 4).
 */

import { createHash, timingSafeEqual } from "crypto";

/**
 * Firma de integridad del Widget: referencia + monto en centavos + moneda +
 * secreto de integridad, SHA256. Calculada SIEMPRE en el servidor — nunca en
 * el navegador — para que el cliente no pueda alterar el monto a pagar.
 */
export function computeIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string
): string {
  const concatenated = `${reference}${amountInCents}${currency}${integritySecret}`;
  return createHash("sha256").update(concatenated).digest("hex");
}

export interface WompiEventSignature {
  properties: string[];
  checksum: string;
  timestamp: number;
}

/**
 * Verifica el checksum de un evento de webhook: toma los valores indicados
 * por `signature.properties` (en ese orden) desde el payload, los concatena,
 * agrega el timestamp y el Events Secret, SHA256, y compara en tiempo
 * constante contra el checksum recibido.
 */
export function verifyEventChecksum(
  propertyValues: Array<string | number>,
  timestamp: number,
  checksum: string,
  eventsSecret: string
): boolean {
  const concatenated = `${propertyValues.join("")}${timestamp}${eventsSecret}`;
  const expected = createHash("sha256").update(concatenated).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(checksum, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

/**
 * Extrae, desde un payload de webhook de Wompi ya parseado, los valores de
 * las propiedades indicadas por signature.properties (ej. "transaction.id"
 * → payload.data.transaction.id), en el mismo orden.
 */
export function extractSignatureValues(
  payload: unknown,
  properties: string[]
): Array<string | number> {
  return properties.map((path) => {
    const parts = path.split(".");
    let value: unknown = payload;
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }
    return value as string | number;
  });
}
