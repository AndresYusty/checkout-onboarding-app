import * as crypto from 'crypto';

export interface SignatureParams {
  reference: string;
  amountInCents: number;
  currency: string;
  integritySecret: string;
  expirationTime?: string;
}

/**
 * Genera la firma de integridad SHA256 para Wompi
 * Formato: <Referencia><Monto><Moneda><FechaExpiracion?><SecretoIntegridad>
 */
export function generateWompiSignature(params: SignatureParams): string {
  const { reference, amountInCents, currency, integritySecret, expirationTime } = params;

  // Construir la cadena concatenada
  let concatenatedString = `${reference}${amountInCents}${currency}`;
  
  // Si hay fecha de expiración, agregarla
  if (expirationTime) {
    concatenatedString += expirationTime;
  }
  
  // Agregar el secreto de integridad al final
  concatenatedString += integritySecret;

  // Generar hash SHA256
  const hash = crypto.createHash('sha256');
  hash.update(concatenatedString);
  return hash.digest('hex');
}

/**
 * Valida una firma de integridad recibida de Wompi
 */
export function validateWompiSignature(
  receivedSignature: string,
  params: SignatureParams,
): boolean {
  const generatedSignature = generateWompiSignature(params);
  return receivedSignature === generatedSignature;
}

