import { describe, it, expect } from 'vitest'
import { detectCardBrand, validateCardNumber, validateCVV, validateExpiryDate } from './cardValidation'

describe('cardValidation', () => {
  describe('detectCardBrand', () => {
    it('should detect VISA card', () => {
      const result = detectCardBrand('4111111111111111')
      expect(result.type).toBe('visa')
      expect(result.name).toBe('VISA')
    })

    it('should detect Mastercard', () => {
      const result = detectCardBrand('5555555555554444')
      expect(result.type).toBe('mastercard')
      expect(result.name).toBe('Mastercard')
    })

    it('should return unknown for invalid card', () => {
      const result = detectCardBrand('1234567890123456')
      expect(result.type).toBe('unknown')
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
      const brand = detectCardBrand('4111111111111111')
      expect(validateCVV('123', brand)).toBe(true)
      expect(validateCVV('12', brand)).toBe(false)
    })

    it('should validate 4-digit CVV for AMEX', () => {
      const brand = detectCardBrand('378282246310005')
      expect(validateCVV('1234', brand)).toBe(true)
      expect(validateCVV('123', brand)).toBe(false)
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

