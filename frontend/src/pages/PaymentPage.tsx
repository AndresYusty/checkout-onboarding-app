import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setCurrentProduct, setLoading } from '../store/slices/productSlice'
import { setLoading as setTransactionLoading } from '../store/slices/transactionSlice'
import { selectCartItems, clearCart } from '../store/slices/cartSlice'
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
} from '../utils/cardValidation'
import { CardLogo } from '../components/CardLogos'

export default function PaymentPage() {
  const { productId } = useParams<{ productId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { currentProduct } = useAppSelector((state) => state.product)
  const { isLoading: isTransactionLoading } = useAppSelector((state) => state.transaction)
  const cartItems = useAppSelector(selectCartItems)
  const { showModal } = useModal()
  const fromCart = searchParams.get('fromCart') === 'true'

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

    dispatch(setTransactionLoading(true))

    try {
      const itemsToProcess = fromCart && cartItems.length > 0 ? cartItems : currentProduct ? [{ product: currentProduct, quantity }] : []
      
      if (itemsToProcess.length === 0) {
        showModal('No hay productos para procesar', 'error', 'Error')
        dispatch(setTransactionLoading(false))
        return
      }
      
      // Validar stock para todos los productos
      for (const item of itemsToProcess) {
        if (item.product && item.quantity > item.product.stock) {
          showModal(
            `Stock insuficiente para ${item.product.name}. Disponible: ${item.product.stock}, Solicitado: ${item.quantity}`,
            'error',
            'Stock insuficiente'
          )
          dispatch(setTransactionLoading(false))
          return
        }
      }

      // Procesar cada producto
      const results = []
      for (const item of itemsToProcess) {
        if (!item.product) continue
        const result = await checkoutService.processCheckout({
          productId: item.product.id,
          quantity: item.quantity,
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
        results.push(result)
        
        // Si algún pago falla, detener el proceso
        if (!result.success) {
          showModal(result.error || 'Error al procesar el pago', 'error', 'Error')
          dispatch(setTransactionLoading(false))
          return
        }
      }

      // Todos los pagos fueron exitosos
      const allApproved = results.every(r => r.status === 'APPROVED')
      
      // Limpiar localStorage y carrito si viene del carrito
      localStorage.removeItem('currentProduct')
      if (fromCart) {
        dispatch(clearCart())
      }
      
      showModal(
        fromCart 
          ? `${results.length} producto${results.length > 1 ? 's' : ''} pagado${results.length > 1 ? 's' : ''} exitosamente`
          : 'Pago procesado correctamente',
        allApproved ? 'success' : 'warning',
        allApproved ? 'Pago exitoso' : 'Pago pendiente'
      )
      
      setTimeout(() => {
        if (fromCart) {
          navigate('/')
        } else {
          navigate(`/product/${productId}`)
        }
      }, 2000)
    } catch (error: any) {
      showModal(error.message || 'Error al procesar el pago', 'error', 'Error')
    } finally {
      dispatch(setTransactionLoading(false))
    }
  }

  // Si viene del carrito, no necesitamos currentProduct
  if (!fromCart && !currentProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    )
  }

  // Si viene del carrito pero no hay productos, redirigir
  if (fromCart && cartItems.length === 0) {
    navigate('/cart')
    return null
  }

  const baseFee = 3000
  const shippingFee = 7000
  
  // Calcular totales según si viene del carrito o no
  const calculateTotals = () => {
    if (fromCart && cartItems.length > 0) {
      // Calcular para todos los productos del carrito
      const cartSubtotal = cartItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
      const cartTax = Math.round(cartSubtotal * 0.19)
      const cartTotal = cartSubtotal + baseFee + shippingFee + cartTax
      return {
        subtotal: cartSubtotal,
        tax: cartTax,
        total: cartTotal,
        items: cartItems,
      }
    } else {
      // Calcular para un solo producto
      if (!currentProduct) {
        return { subtotal: 0, tax: 0, total: 0, items: [] }
      }
      const subtotal = Number(currentProduct.price) * quantity
      const tax = Math.round(subtotal * 0.19)
      const total = subtotal + baseFee + shippingFee + tax
      return {
        subtotal,
        tax,
        total,
        items: [{ product: currentProduct, quantity }],
      }
    }
  }
  
  const totals = calculateTotals()

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => fromCart ? navigate('/cart') : navigate(`/product/${productId}`)}
        className="mb-6 text-gray-700 hover:text-gray-900 flex items-center space-x-2 font-medium transition-colors"
      >
        <span className="text-xl">←</span>
        <span>{fromCart ? 'Volver al carrito' : 'Volver al producto'}</span>
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Información de Entrega y Pago</h1>
        <p className="text-sm text-gray-500">Completa tus datos para procesar el pago de forma segura</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <form className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Datos de Cliente</h2>
              <p className="text-xs text-gray-500 mt-0.5">Información del comprador</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${
                  deliveryErrors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="tu@email.com"
              />
              {deliveryErrors.email && (
                <p className="text-sm text-red-600 mt-1">{deliveryErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre Completo
              </label>
              <input
                type="text"
                value={customerData.fullName}
                onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${
                  deliveryErrors.phone
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="3001234567"
              />
              {deliveryErrors.phone && (
                <p className="text-sm text-red-600 mt-1">{deliveryErrors.phone}</p>
              )}
            </div>

            <div className="pt-5 border-t border-gray-200 mt-5">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Datos de Entrega</h2>
                <p className="text-xs text-gray-500 mt-0.5">Dirección de envío</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${
                  deliveryErrors.address
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="Calle 123 # 45-67"
              />
              {deliveryErrors.address && (
                <p className="text-sm text-red-600 mt-1">{deliveryErrors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${
                    deliveryErrors.city
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Bogotá"
                />
                {deliveryErrors.city && (
                  <p className="text-sm text-red-600 mt-1">{deliveryErrors.city}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${
                    deliveryErrors.postalCode
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="110111"
                />
                {deliveryErrors.postalCode && (
                  <p className="text-sm text-red-600 mt-1">{deliveryErrors.postalCode}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${
                  deliveryErrors.region
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="Cundinamarca"
              />
              {deliveryErrors.region && (
                <p className="text-sm text-red-600 mt-1">{deliveryErrors.region}</p>
              )}
            </div>

            <div className="pt-5 border-t border-gray-200 mt-5">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Datos de Tarjeta</h2>
                <p className="text-xs text-gray-500 mt-0.5">Información de pago</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    className={`w-full px-3 py-2.5 pr-14 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-mono ${
                      cardErrors.number
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="5555 5555 5555 4444"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center font-mono text-sm ${
                      cardErrors.expiry
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center font-mono text-sm ${
                      cardErrors.expiry
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="29"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center font-mono text-sm ${
                      cardErrors.cvc
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
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

            {!fromCart && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center font-medium transition-all"
                  >
                    −
                  </button>
                  <span className="text-lg font-semibold text-gray-900 w-12 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => currentProduct && setQuantity(Math.min(currentProduct.stock, quantity + 1))}
                    disabled={!currentProduct || quantity >= currentProduct.stock}
                    className="w-10 h-10 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-all"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-3">
                    Stock: <span className="font-medium text-gray-700">{currentProduct?.stock || 0}</span>
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isTransactionLoading}
              className="w-full bg-gray-900 text-white py-3 px-5 rounded-lg font-medium text-base hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sticky top-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
            </div>

            <div className="space-y-2 mb-4">
              {totals.items.map((item) => (
                item.product && (
                  <div key={item.product.id} className="flex justify-between text-sm pb-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600">{item.product.name}</span>
                    <span className="text-gray-900">x{item.quantity}</span>
                  </div>
                )
              ))}
              <div className="flex justify-between text-sm pt-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${totals.subtotal.toLocaleString('es-CO')}</span>
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
                <span className="text-gray-900">${totals.tax.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">${totals.total.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
