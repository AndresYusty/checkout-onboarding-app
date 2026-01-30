import { useState, useEffect } from 'react'
import { detectCardBrand, validateCardNumber, validateCVV, validateExpiryDate, formatCardNumber, CardBrand } from '../utils/cardValidation'
import { createWompiToken } from '../utils/wompiToken'

interface CreditCardModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (cardData: {
    number: string
    cvv: string
    expMonth: string
    expYear: string
    cardHolder: string
    token: string
  }) => void
  total: number
}

export default function CreditCardModal({ isOpen, onClose, onConfirm, total }: CreditCardModalProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [cvv, setCvv] = useState('')
  const [expMonth, setExpMonth] = useState('')
  const [expYear, setExpYear] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [cardBrand, setCardBrand] = useState<CardBrand>({ type: 'unknown', name: 'Tarjeta', logo: '💳' })

  useEffect(() => {
    if (cardNumber) {
      const brand = detectCardBrand(cardNumber)
      setCardBrand(brand)
    }
  }, [cardNumber])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!validateCardNumber(cardNumber)) {
      newErrors.cardNumber = 'Número de tarjeta inválido'
    }

    if (!validateCVV(cvv, cardBrand)) {
      newErrors.cvv = cardBrand.type === 'amex' ? 'CVV debe tener 4 dígitos' : 'CVV debe tener 3 dígitos'
    }

    if (!validateExpiryDate(expMonth, expYear)) {
      newErrors.expiry = 'Fecha de expiración inválida'
    }

    if (!cardHolder.trim() || cardHolder.trim().length < 3) {
      newErrors.cardHolder = 'Nombre del titular es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Crear token de tarjeta con Wompi
      const token = await createWompiToken({
        number: cardNumber.replace(/\s/g, ''),
        cvc: cvv,
        exp_month: expMonth.padStart(2, '0'),
        exp_year: expYear.padStart(2, '0'),
        card_holder: cardHolder.toUpperCase(),
      })

      onConfirm({
        number: cardNumber.replace(/\s/g, ''),
        cvv,
        expMonth: expMonth.padStart(2, '0'),
        expYear: expYear.padStart(2, '0'),
        cardHolder: cardHolder.toUpperCase(),
        token,
      })
    } catch (error: any) {
      setErrors({ ...errors, general: error.message || 'Error al procesar la tarjeta' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Información de Pago</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Card Brand Display */}
          <div className="flex items-center justify-center mb-4">
            <div className="text-6xl">{cardBrand.logo}</div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">Tipo de tarjeta</div>
              <div className="text-lg font-semibold">{cardBrand.name}</div>
            </div>
          </div>

          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Tarjeta *
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => {
                const formatted = formatCardNumber(e.target.value.replace(/\D/g, ''))
                setCardNumber(formatted)
                if (errors.cardNumber) {
                  setErrors({ ...errors, cardNumber: '' })
                }
              }}
              maxLength={19}
              placeholder="1234 5678 9012 3456"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.cardNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.cardNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
            )}
          </div>

          {/* Card Holder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Titular *
            </label>
            <input
              type="text"
              value={cardHolder}
              onChange={(e) => {
                setCardHolder(e.target.value.toUpperCase())
                if (errors.cardHolder) {
                  setErrors({ ...errors, cardHolder: '' })
                }
              }}
              placeholder="JUAN PEREZ"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.cardHolder ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.cardHolder && (
              <p className="mt-1 text-sm text-red-600">{errors.cardHolder}</p>
            )}
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Expiración *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={expMonth}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 2)
                    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                      setExpMonth(value)
                      if (errors.expiry) {
                        setErrors({ ...errors, expiry: '' })
                      }
                    }
                  }}
                  placeholder="MM"
                  maxLength={2}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.expiry ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                <input
                  type="text"
                  value={expYear}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 2)
                    setExpYear(value)
                    if (errors.expiry) {
                      setErrors({ ...errors, expiry: '' })
                    }
                  }}
                  placeholder="YY"
                  maxLength={2}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.expiry ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </div>
              {errors.expiry && (
                <p className="mt-1 text-sm text-red-600">{errors.expiry}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV *
              </label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, cardBrand.type === 'amex' ? 4 : 3)
                  setCvv(value)
                  if (errors.cvv) {
                    setErrors({ ...errors, cvv: '' })
                  }
                }}
                placeholder={cardBrand.type === 'amex' ? '1234' : '123'}
                maxLength={cardBrand.type === 'amex' ? 4 : 3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.cvv ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.cvv && (
                <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total a pagar:</span>
              <span className="text-2xl font-bold text-gray-900">
                ${total.toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Procesando...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

