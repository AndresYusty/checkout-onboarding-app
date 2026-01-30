export interface CardBrand {
  type: 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
  name: string;
  logo: string;
}

export const detectCardBrand = (cardNumber: string): CardBrand => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  // VISA: Empieza con 4
  if (/^4/.test(cleaned)) {
    return { type: 'visa', name: 'VISA', logo: '💳' };
  }
  // Mastercard: Empieza con 51-55
  if (/^5[1-5]/.test(cleaned)) {
    return { type: 'mastercard', name: 'Mastercard', logo: '💳' };
  }
  // American Express: Empieza con 34 o 37
  if (/^3[47]/.test(cleaned)) {
    return { type: 'amex', name: 'American Express', logo: '💳' };
  }
  // Discover: Empieza con 6011 o 65
  if (/^6(?:011|5)/.test(cleaned)) {
    return { type: 'discover', name: 'Discover', logo: '💳' };
  }
  
  return { type: 'unknown', name: 'Tarjeta', logo: '💳' };
};

export const validateCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  // Debe tener entre 13 y 19 dígitos
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }
  
  // Algoritmo de Luhn
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

export const validateCVV = (cvv: string, cardBrand: CardBrand): boolean => {
  const cleaned = cvv.replace(/\s/g, '');
  
  if (cardBrand.type === 'amex') {
    return /^\d{4}$/.test(cleaned);
  }
  
  return /^\d{3}$/.test(cleaned);
};

export const validateExpiryDate = (month: string, year: string): boolean => {
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  
  if (monthNum < 1 || monthNum > 12) {
    return false;
  }
  
  if (yearNum < currentYear) {
    return false;
  }
  
  if (yearNum === currentYear && monthNum < currentMonth) {
    return false;
  }
  
  return true;
};

export const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\s/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
};

