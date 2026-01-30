import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setCurrentProduct, setLoading } from '../store/slices/productSlice'
import { setTransaction, setLoading as setTransactionLoading } from '../store/slices/transactionSlice'
import { productService } from '../services/api'
import { checkoutService } from '../services/checkout.service'
import { useModal } from '../context/ModalContext'

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

  const handleCheckout = async () => {
    if (!currentProduct || !productId) return

    // Validar formulario
    if (!shippingData.address || !shippingData.city || !shippingData.postalCode || !shippingData.region || !customerData.phone || !customerData.email) {
      showModal('Por favor completa todos los campos requeridos', 'warning', 'Campos incompletos')
      return
    }

    // Validar tarjeta
    if (!cardData.number || !cardData.expMonth || !cardData.expYear || !cardData.cvc) {
      showModal('Por favor completa todos los datos de la tarjeta', 'warning', 'Campos incompletos')
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
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 transition-all"
                placeholder="tu@email.com"
              />
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
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 transition-all"
                placeholder="3001234567"
              />
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
                onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 transition-all"
                placeholder="Calle 123 # 45-67"
              />
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
                  onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 transition-all"
                  placeholder="Bogotá"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Código Postal *
                </label>
                <input
                  type="text"
                  required
                  value={shippingData.postalCode}
                  onChange={(e) => setShippingData({ ...shippingData, postalCode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 transition-all"
                  placeholder="110111"
                />
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
                onChange={(e) => setShippingData({ ...shippingData, region: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 transition-all"
                placeholder="Cundinamarca"
              />
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
                <input
                  type="text"
                  required
                  maxLength={19}
                  value={cardData.number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
                    const formatted = value.match(/.{1,4}/g)?.join(' ') || value
                    setCardData({ ...cardData, number: formatted })
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 transition-all text-lg font-mono"
                  placeholder="4242 4242 4242 4242"
                />
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
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 transition-all text-center font-mono"
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
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 transition-all text-center font-mono"
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
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 transition-all text-center font-mono"
                    placeholder="123"
                  />
                </div>
              </div>
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
