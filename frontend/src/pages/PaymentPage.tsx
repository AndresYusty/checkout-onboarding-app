import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setCurrentProduct, setLoading } from '../store/slices/productSlice'
import { setTransaction, setLoading as setTransactionLoading } from '../store/slices/transactionSlice'
import { productService } from '../services/api'
import { checkoutService } from '../services/checkout.service'
import { useModal } from '../context/ModalContext'
import {
  detectBrand,
  isValidLuhn,
  isValidExpiry,
  isValidCvc,
  isValidEmail,
  isValidPhone,
  formatCardNumber,
  cleanCardNumber,
  isCardValid,
  type CardBrand,
} from '../utils/cardValidation'
import { CardLogo } from '../components/CardLogos'

export default function PaymentPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { currentProduct } = useAppSelector((state) => state.product)
  const { isLoading: isTransactionLoading } = useAppSelector((state) => state.transaction)
  const { showModal } = useModal()

  const [quantity, setQuantity] = useState(1)
  const [shippingData, setShippingData] = useState({
    address: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'CO',
  })
  const [customerData, setCustomerData] = useState({
    email: '',
    fullName: '',
    phone: '',
  })
  const [cardData, setCardData] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: '',
  })
  const [cardErrors, setCardErrors] = useState({
    number: '',
    expiry: '',
    cvc: '',
  })
  const [deliveryErrors, setDeliveryErrors] = useState({
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    region: '',
  })

  useEffect(() => {
    if (productId) {
      const stored = localStorage.getItem('currentProduct')
      if (stored) {
        try {
          const product = JSON.parse(stored)
          if (product.id === productId) {
            dispatch(setCurrentProduct(product))
            return
          }
        } catch {
          // Si hay error, cargar desde API
        }
      }
      loadProduct()
    }
    
    // Cargar datos de envío guardados
    const storedShipping = localStorage.getItem('shippingData')
    if (storedShipping) {
      try {
        const data = JSON.parse(storedShipping)
        setShippingData({
          address: data.address || data.street || data.addressLine1 || '',
          city: data.city || '',
          region: data.region || data.state || '',
          postalCode: data.postalCode || '',
          country: data.country || 'CO',
        })
        setCustomerData({
          email: data.email || '',
          fullName: data.fullName || '',
          phone: data.phone || data.phoneNumber || '',
        })
      } catch {
        // Ignorar errores
      }
    }
  }, [productId])
  
  // Guardar datos en localStorage
  useEffect(() => {
    if (shippingData.address || customerData.email) {
      localStorage.setItem('shippingData', JSON.stringify({
        ...shippingData,
        ...customerData,
      }))
    }
  }, [shippingData, customerData])

  const loadProduct = async () => {
    if (!productId) return

    try {
      dispatch(setLoading(true))
      const product = await productService.getById(productId)
      dispatch(setCurrentProduct(product))
    } catch (err) {
      showModal('Error al cargar el producto', 'error', 'Error')
      navigate('/')
    } finally {
      dispatch(setLoading(false))
    }
  }

  // Validación en tiempo real
  const validateCardNumber = (number: string) => {
    const cleaned = cleanCardNumber(number)
    if (cleaned.length === 0) {
      setCardErrors((prev) => ({ ...prev, number: '' }))
      return
    }
    if (cleaned.length < 13 || cleaned.length > 19) {
      setCardErrors((prev) => ({ ...prev, number: 'El número debe tener entre 13 y 19 dígitos' }))
      return
    }
    if (!isValidLuhn(cleaned)) {
      setCardErrors((prev) => ({ ...prev, number: 'Número de tarjeta inválido' }))
      return
    }
    const brand = detectBrand(cleaned)
    if (brand === 'UNKNOWN') {
      setCardErrors((prev) => ({ ...prev, number: 'Solo se aceptan Visa y MasterCard' }))
      return
    }
    setCardErrors((prev) => ({ ...prev, number: '' }))
  }

  const validateExpiry = (month: string, year: string) => {
    if (!month || !year) {
      setCardErrors((prev) => ({ ...prev, expiry: '' }))
      return
    }
    if (!isValidExpiry(month, year)) {
      setCardErrors((prev) => ({ ...prev, expiry: 'Fecha inválida o vencida' }))
      return
    }
    setCardErrors((prev) => ({ ...prev, expiry: '' }))
  }

  const validateCvc = (cvc: string) => {
    if (cvc.length === 0) {
      setCardErrors((prev) => ({ ...prev, cvc: '' }))
      return
    }
    if (!isValidCvc(cvc)) {
      setCardErrors((prev) => ({ ...prev, cvc: 'CVC debe tener 3 o 4 dígitos' }))
      return
    }
    setCardErrors((prev) => ({ ...prev, cvc: '' }))
  }

  const validateDelivery = () => {
    const errors = {
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      region: '',
    }

    if (!customerData.email) {
      errors.email = 'El email es requerido'
    } else if (!isValidEmail(customerData.email)) {
      errors.email = 'Email inválido'
    }

    if (!customerData.phone) {
      errors.phone = 'El teléfono es requerido'
    } else if (!isValidPhone(customerData.phone)) {
      errors.phone = 'Teléfono inválido (10-13 dígitos)'
    }

    if (!shippingData.address) errors.address = 'La dirección es requerida'
    if (!shippingData.city) errors.city = 'La ciudad es requerida'
    if (!shippingData.postalCode) errors.postalCode = 'El código postal es requerido'
    if (!shippingData.region) errors.region = 'La región es requerida'

    setDeliveryErrors(errors)
    return Object.values(errors).every((err) => err === '')
  }

  const handleCheckout = async () => {
    if (!currentProduct || !productId) return

    // Validar datos de entrega
    if (!validateDelivery()) {
      showModal('Por favor corrige los errores en el formulario', 'warning', 'Campos inválidos')
      return
    }

    // Validar tarjeta completa
    const cardValidation = isCardValid(
      cardData.number,
      cardData.expMonth,
      cardData.expYear,
      cardData.cvc
    )
    if (!cardValidation.valid) {
      showModal(cardValidation.errors.join('. '), 'warning', 'Tarjeta inválida')
      return
    }

    if (quantity > currentProduct.stock) {
      showModal('La cantidad solicitada excede el stock disponible', 'error', 'Stock insuficiente')
      return
    }

    dispatch(setTransactionLoading(true))

    try {
      const result = await checkoutService.processCheckout({
        productId,
        quantity: quantity, // Enviar la cantidad real
        customer: {
          fullName: customerData.fullName || 'Cliente',
          email: customerData.email,
          phone: customerData.phone,
        },
        delivery: {
          address: shippingData.address,
          city: shippingData.city,
          country: shippingData.country,
          postalCode: shippingData.postalCode,
          region: shippingData.region,
        },
        card: {
          number: cardData.number.replace(/\s/g, ''),
          expMonth: cardData.expMonth,
          expYear: cardData.expYear,
          cvc: cardData.cvc,
        },
      })

      if (result.success) {
        dispatch(setTransaction({
          orderId: result.orderId || '',
          paymentId: result.transactionId || '',
          status: result.status === 'APPROVED' ? 'approved' : result.status === 'DECLINED' ? 'rejected' : 'pending',
          productId,
          quantity,
        }))
        
        // Limpiar localStorage del producto para forzar recarga desde API
        localStorage.removeItem('currentProduct')
        
        showModal(
          result.message || 'Pago procesado correctamente',
          result.status === 'APPROVED' ? 'success' : 'warning',
          result.status === 'APPROVED' ? 'Pago exitoso' : 'Pago pendiente'
        )
        setTimeout(() => {
          navigate(`/product/${productId}`)
        }, 2000)
      } else {
        showModal(result.error || 'Error al procesar el pago', 'error', 'Error')
      }
    } catch (error: any) {
      showModal(error.message || 'Error al procesar el pago', 'error', 'Error')
    } finally {
      dispatch(setTransactionLoading(false))
    }
  }

  if (!currentProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    )
  }

  const baseFee = 3000
  const shippingFee = 7000
  const subtotal = Number(currentProduct.price) * quantity
  const tax = Math.round(subtotal * 0.19)
  const total = subtotal + baseFee + shippingFee + tax

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => navigate(`/product/${productId}`)}
        className="mb-6 text-gray-700 hover:text-gray-900 flex items-center space-x-2 font-medium transition-colors"
      >
        <span className="text-xl">←</span>
        <span>Volver al producto</span>
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Información de Entrega y Pago</h1>
        <p className="text-gray-600">Completa tus datos para procesar el pago de forma segura con Wompi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <form className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">👤</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Datos de Cliente</h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={customerData.email}
                onChange={(e) => {
                  setCustomerData({ ...customerData, email: e.target.value })
                  if (e.target.value && !isValidEmail(e.target.value)) {
                    setDeliveryErrors((prev) => ({ ...prev, email: 'Email inválido' }))
                  } else {
                    setDeliveryErrors((prev) => ({ ...prev, email: '' }))
                  }
                }}
                onBlur={() => {
                  if (customerData.email && !isValidEmail(customerData.email)) {
                    setDeliveryErrors((prev) => ({ ...prev, email: 'Email inválido' }))
                  }
                }}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all ${
                  deliveryErrors.email
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-gray-800'
                }`}
                placeholder="tu@email.com"
              />
              {deliveryErrors.email && (
                <p className="text-sm text-red-600 mt-1">{deliveryErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={customerData.fullName}
                onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 transition-all"
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                required
                value={customerData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setCustomerData({ ...customerData, phone: value })
                  if (value && !isValidPhone(value)) {
                    setDeliveryErrors((prev) => ({ ...prev, phone: 'Teléfono inválido (10-13 dígitos)' }))
                  } else {
                    setDeliveryErrors((prev) => ({ ...prev, phone: '' }))
                  }
                }}
                onBlur={() => {
                  if (customerData.phone && !isValidPhone(customerData.phone)) {
                    setDeliveryErrors((prev) => ({ ...prev, phone: 'Teléfono inválido (10-13 dígitos)' }))
                  }
                }}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all ${
                  deliveryErrors.phone
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-gray-800'
                }`}
                placeholder="3001234567"
              />
              {deliveryErrors.phone && (
                <p className="text-sm text-red-600 mt-1">{deliveryErrors.phone}</p>
              )}
            </div>

            <div className="pt-6 border-t-2 border-gray-100 mt-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">📦</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Datos de Entrega</h2>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dirección *
              </label>
              <input
                type="text"
                required
                value={shippingData.address}
                onChange={(e) => {
                  setShippingData({ ...shippingData, address: e.target.value })
                  if (e.target.value) {
                    setDeliveryErrors((prev) => ({ ...prev, address: '' }))
                  }
                }}
                onBlur={() => {
                  if (!shippingData.address) {
                    setDeliveryErrors((prev) => ({ ...prev, address: 'La dirección es requerida' }))
                  }
                }}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all ${
                  deliveryErrors.address
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-gray-800'
                }`}
                placeholder="Calle 123 # 45-67"
              />
              {deliveryErrors.address && (
                <p className="text-sm text-red-600 mt-1">{deliveryErrors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ciudad *
                </label>
                <input
                  type="text"
                  required
                  value={shippingData.city}
                  onChange={(e) => {
                    setShippingData({ ...shippingData, city: e.target.value })
                    if (e.target.value) {
                      setDeliveryErrors((prev) => ({ ...prev, city: '' }))
                    }
                  }}
                  onBlur={() => {
                    if (!shippingData.city) {
                      setDeliveryErrors((prev) => ({ ...prev, city: 'La ciudad es requerida' }))
                    }
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all ${
                    deliveryErrors.city
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-gray-800'
                  }`}
                  placeholder="Bogotá"
                />
                {deliveryErrors.city && (
                  <p className="text-sm text-red-600 mt-1">{deliveryErrors.city}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Código Postal *
                </label>
                <input
                  type="text"
                  required
                  value={shippingData.postalCode}
                  onChange={(e) => {
                    setShippingData({ ...shippingData, postalCode: e.target.value })
                    if (e.target.value) {
                      setDeliveryErrors((prev) => ({ ...prev, postalCode: '' }))
                    }
                  }}
                  onBlur={() => {
                    if (!shippingData.postalCode) {
                      setDeliveryErrors((prev) => ({ ...prev, postalCode: 'El código postal es requerido' }))
                    }
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all ${
                    deliveryErrors.postalCode
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-gray-800'
                  }`}
                  placeholder="110111"
                />
                {deliveryErrors.postalCode && (
                  <p className="text-sm text-red-600 mt-1">{deliveryErrors.postalCode}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Departamento/Región *
              </label>
              <input
                type="text"
                required
                value={shippingData.region}
                onChange={(e) => {
                  setShippingData({ ...shippingData, region: e.target.value })
                  if (e.target.value) {
                    setDeliveryErrors((prev) => ({ ...prev, region: '' }))
                  }
                }}
                onBlur={() => {
                  if (!shippingData.region) {
                    setDeliveryErrors((prev) => ({ ...prev, region: 'La región es requerida' }))
                  }
                }}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all ${
                  deliveryErrors.region
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-gray-800'
                }`}
                placeholder="Cundinamarca"
              />
              {deliveryErrors.region && (
                <p className="text-sm text-red-600 mt-1">{deliveryErrors.region}</p>
              )}
            </div>

            <div className="pt-6 border-t-2 border-gray-100 mt-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">💳</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Datos de Tarjeta</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de Tarjeta *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardData.number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
                      const formatted = formatCardNumber(value)
                      setCardData({ ...cardData, number: formatted })
                      validateCardNumber(formatted)
                    }}
                    onBlur={() => validateCardNumber(cardData.number)}
                    className={`w-full px-4 py-3 pr-16 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all text-lg font-mono ${
                      cardErrors.number
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-gray-800'
                    }`}
                    placeholder="4242 4242 4242 4242"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    <CardLogo brand={detectBrand(cardData.number)} />
                  </div>
                </div>
                {cardErrors.number && (
                  <p className="text-sm text-red-600 mt-1">{cardErrors.number}</p>
                )}
                {!cardErrors.number &&
                  cardData.number.length > 0 &&
                  isValidLuhn(cleanCardNumber(cardData.number)) && (
                    <p className="text-sm text-green-600 mt-1">✓ Tarjeta válida</p>
                  )}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mes *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={cardData.expMonth}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 2)
                      setCardData({ ...cardData, expMonth: value })
                      validateExpiry(value, cardData.expYear)
                    }}
                    onBlur={() => validateExpiry(cardData.expMonth, cardData.expYear)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all text-center font-mono ${
                      cardErrors.expiry
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-gray-800'
                    }`}
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Año *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={cardData.expYear}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 2)
                      setCardData({ ...cardData, expYear: value })
                      validateExpiry(cardData.expMonth, value)
                    }}
                    onBlur={() => validateExpiry(cardData.expMonth, cardData.expYear)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all text-center font-mono ${
                      cardErrors.expiry
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-gray-800'
                    }`}
                    placeholder="29"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={cardData.cvc}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setCardData({ ...cardData, cvc: value })
                      validateCvc(value)
                    }}
                    onBlur={() => validateCvc(cardData.cvc)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all text-center font-mono ${
                      cardErrors.cvc
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-gray-800'
                    }`}
                    placeholder="123"
                  />
                </div>
              </div>
              {cardErrors.expiry && (
                <p className="text-sm text-red-600 mt-1">{cardErrors.expiry}</p>
              )}
              {cardErrors.cvc && <p className="text-sm text-red-600 mt-1">{cardErrors.cvc}</p>}
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Cantidad
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-xl bg-white border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white flex items-center justify-center font-bold text-lg transition-all shadow-md hover:shadow-lg"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-gray-900 w-16 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentProduct.stock, quantity + 1))}
                  disabled={quantity >= currentProduct.stock}
                  className="w-12 h-12 rounded-xl bg-white border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-800 flex items-center justify-center font-bold text-lg transition-all shadow-md hover:shadow-lg"
                >
                  +
                </button>
                <span className="text-sm text-gray-600 ml-4">
                  Stock disponible: <span className="font-bold text-gray-800">{currentProduct.stock}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isTransactionLoading}
              className="w-full bg-gray-900 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-gray-800 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              {isTransactionLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Procesando pago...</span>
                </>
              ) : (
                <>
                  <span>💳</span>
                  <span>Pagar con Wompi</span>
                </>
              )}
            </button>
            
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 pt-2">
              <span>🔒</span>
              <span>Pago seguro procesado por</span>
              <span className="font-bold">Wompi</span>
            </div>
          </form>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📋</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Resumen</h2>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{currentProduct.name}</span>
                <span className="text-gray-900">x{quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tarifa base</span>
                <span className="text-gray-900">${baseFee.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío</span>
                <span className="text-gray-900">${shippingFee.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA (19%)</span>
                <span className="text-gray-900">${tax.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">${total.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
