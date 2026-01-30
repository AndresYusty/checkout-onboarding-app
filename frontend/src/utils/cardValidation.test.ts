import { describe, it, expect } from 'vitest'
import { detectBrand, validateCardNumber, validateCVV, validateExpiryDate, CardBrand } from './cardValidation'

describe('cardValidation', () => {
  describe('detectBrand', () => {
    it('should detect VISA card', () => {
      const result = detectBrand('4111111111111111')
      expect(result).toBe('VISA')
    })

    it('should detect Mastercard', () => {
      const result = detectBrand('5555555555554444')
      expect(result).toBe('MASTERCARD')
    })

    it('should return UNKNOWN for invalid card', () => {
      const result = detectBrand('1234567890123456')
      expect(result).toBe('UNKNOWN')
    })
  })

  describe('validateCardNumber', () => {
    it('should validate correct card number', () => {
      // VISA test card
      expect(validateCardNumber('4111111111111111')).toBe(true)
    })

    it('should reject invalid card number', () => {
      expect(validateCardNumber('1234567890123456')).toBe(false)
    })

    it('should reject short card number', () => {
      expect(validateCardNumber('123456789012')).toBe(false)
    })
  })

  describe('validateCVV', () => {
    it('should validate 3-digit CVV for VISA', () => {
      const brand: CardBrand = 'VISA'
      expect(validateCVV('123', brand)).toBe(true)
      expect(validateCVV('12', brand)).toBe(false)
    })

    it('should validate 3-digit CVV for Mastercard', () => {
      const brand: CardBrand = 'MASTERCARD'
      expect(validateCVV('123', brand)).toBe(true)
      expect(validateCVV('12', brand)).toBe(false)
    })
  })

  describe('validateExpiryDate', () => {
    it('should validate future expiry date', () => {
      const futureYear = (new Date().getFullYear() % 100) + 1
      expect(validateExpiryDate('12', futureYear.toString())).toBe(true)
    })

    it('should reject past expiry date', () => {
      const pastYear = (new Date().getFullYear() % 100) - 1
      expect(validateExpiryDate('12', pastYear.toString())).toBe(false)
    })

    it('should reject invalid month', () => {
      expect(validateExpiryDate('13', '25')).toBe(false)
      expect(validateExpiryDate('0', '25')).toBe(false)
    })
  })
})

