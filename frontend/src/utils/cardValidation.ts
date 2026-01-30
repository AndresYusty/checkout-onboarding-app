export type CardBrand = 'VISA' | 'MASTERCARD' | 'UNKNOWN';

export function cleanCardNumber(value: string): string {
  return value.replace(/\D/g, '');
}

// Algoritmo de Luhn
export function isValidLuhn(cardNumber: string): boolean {
  const cleaned = cleanCardNumber(cardNumber);
  let sum = 0;
  let shouldDouble = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    if (Number.isNaN(digit)) return false;

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function detectBrand(cardNumberRaw: string): CardBrand {
  const n = cleanCardNumber(cardNumberRaw);

  // VISA: 4 + (13/16/19)
  if (/^4\d{12}(\d{3})?(\d{3})?$/.test(n)) return 'VISA';

  // MasterCard: 51-55 + 16
  if (/^5[1-5]\d{14}$/.test(n)) return 'MASTERCARD';

  // MasterCard: 2221-2720 + 16
  const first4 = parseInt(n.slice(0, 4), 10);
  if (n.length === 16 && first4 >= 2221 && first4 <= 2720) return 'MASTERCARD';

  return 'UNKNOWN';
}

export function isValidExpiry(mm: string, yy: string): boolean {
  const month = parseInt(mm, 10);
  let year = parseInt(yy, 10);
  if (Number.isNaN(month) || Number.isNaN(year)) return false;
  if (month < 1 || month > 12) return false;

  // Asumir YY (ej 29 => 2029)
  if (year < 100) year += 2000;

  const now = new Date();
  const exp = new Date(year, month); // Fin del mes
  return exp > now;
}

export function isValidCvc(cvc: string): boolean {
  return /^\d{3,4}$/.test(cvc.trim());
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const p = phone.replace(/\D/g, '');
  return p.length >= 10 && p.length <= 13;
}

export function formatCardNumber(value: string): string {
  const cleaned = cleanCardNumber(value);
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
}

// Alias para compatibilidad
export const detectCardBrand = detectBrand;

// Funciones de validación individuales
export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cleanCardNumber(cardNumber);
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  if (!isValidLuhn(cleaned)) return false;
  const brand = detectBrand(cardNumber);
  return brand !== 'UNKNOWN';
}

export function validateCVV(cvv: string, brand?: CardBrand): boolean {
  const cleaned = cvv.trim();
  // Para VISA y MASTERCARD: 3 dígitos
  // Para AMEX: 4 dígitos (aunque no lo soportamos, mantenemos la lógica)
  if (brand === 'UNKNOWN' || !brand) {
    return /^\d{3,4}$/.test(cleaned);
  }
  // Solo soportamos VISA y MASTERCARD (3 dígitos)
  return /^\d{3}$/.test(cleaned);
}

export function validateExpiryDate(mm: string, yy: string): boolean {
  return isValidExpiry(mm, yy);
}

// Validación completa de tarjeta
export function isCardValid(
  cardNumber: string,
  expMonth: string,
  expYear: string,
  cvc: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const cleaned = cleanCardNumber(cardNumber);

  // Validar número
  if (cleaned.length < 13 || cleaned.length > 19) {
    errors.push('El número de tarjeta debe tener entre 13 y 19 dígitos');
  } else if (!isValidLuhn(cleaned)) {
    errors.push('El número de tarjeta no es válido (algoritmo de Luhn)');
  }

  // Validar marca
  const brand = detectBrand(cardNumber);
  if (brand === 'UNKNOWN' && cleaned.length > 0) {
    errors.push('Marca de tarjeta no reconocida (solo Visa y MasterCard)');
  }

  // Validar fecha
  if (!isValidExpiry(expMonth, expYear)) {
    errors.push('La fecha de expiración no es válida o está vencida');
  }

  // Validar CVC
  if (!isValidCvc(cvc)) {
    errors.push('El CVC debe tener 3 o 4 dígitos');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

