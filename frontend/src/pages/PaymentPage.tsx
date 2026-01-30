import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setCurrentProduct, setLoading } from '../store/slices/productSlice'
import { setTransaction, setLoading as setTransactionLoading } from '../store/slices/transactionSlice'
import { productService } from '../services/api'
import { checkoutService } from '../services/checkout.service'
import WompiWidget from '../components/WompiWidget'
import { useModal } from '../context/ModalContext'

export default function PaymentPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { currentProduct } = useAppSelector((state) => state.product)
  const { isLoading: isTransactionLoading } = useAppSelector((state) => state.transaction)
  const { showModal } = useModal()

  const [checkoutSession, setCheckoutSession] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [shippingData, setShippingData] = useState({
    addressLine1: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'CO',
    phoneNumber: '',
    name: '',
  })
  const [customerData, setCustomerData] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    phoneNumberPrefix: '+57',
  })

  useEffect(() => {
    if (productId) {
      // Intentar cargar desde localStorage primero
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
          addressLine1: data.street || data.addressLine1 || '',
          city: data.city || '',
          region: data.state || data.region || '',
          postalCode: data.postalCode || '',
          country: data.country || 'CO',
          phoneNumber: data.phone || data.phoneNumber || '',
          name: data.name || '',
        })
      } catch {
        // Ignorar errores
      }
    }
  }, [productId])
  
  // Guardar datos de envío en localStorage
  useEffect(() => {
    if (shippingData.addressLine1 || shippingData.email) {
      localStorage.setItem('shippingData', JSON.stringify(shippingData))
    }
  }, [shippingData])

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

  const handleCreateSession = async () => {
    if (!currentProduct || !productId) return

    // Validar formulario
    if (!shippingData.addressLine1 || !shippingData.city || !shippingData.postalCode || !shippingData.region || !customerData.phoneNumber || !customerData.email) {
      showModal('Por favor completa todos los campos requeridos', 'warning', 'Campos incompletos')
      return
    }

    if (quantity > currentProduct.stock) {
      showModal('La cantidad solicitada excede el stock disponible', 'error', 'Stock insuficiente')
      return
    }

    dispatch(setTransactionLoading(true))

    try {
      const result = await checkoutService.createCheckoutSession({
        productId,
        quantity,
        customerEmail: customerData.email,
        shippingAddress: {
          addressLine1: shippingData.addressLine1,
          city: shippingData.city,
          region: shippingData.region,
          country: shippingData.country,
          phoneNumber: customerData.phoneNumber,
          name: shippingData.name || customerData.fullName,
          postalCode: shippingData.postalCode,
        },
        customerData: {
          email: customerData.email,
          fullName: customerData.fullName,
          phoneNumber: customerData.phoneNumber,
          phoneNumberPrefix: customerData.phoneNumberPrefix,
        },
        redirectUrl: `${window.location.origin}/transaction/result`,
      })

      if (result.success && result.data) {
        setCheckoutSession(result.data)
      } else {
        showModal(result.error || 'Error al crear la sesión de pago', 'error', 'Error')
      }
    } catch (error: any) {
      showModal(error.message || 'Error al crear la sesión de pago', 'error', 'Error')
    } finally {
      dispatch(setTransactionLoading(false))
    }
  }

  const handleWompiSuccess = (result: any) => {
    const transaction = result.transaction
    if (transaction) {
      dispatch(setTransaction({
        orderId: transaction.reference,
        paymentId: transaction.id,
        status: transaction.status === 'APPROVED' ? 'approved' : 'rejected',
        productId,
        quantity,
      }))

      navigate(`/transaction/result/${transaction.reference}`)
    }
  }

  const handleWompiError = (error: any) => {
    console.error('Wompi error:', error)
    showModal(error.message || 'Error al procesar el pago', 'error', 'Error de pago')
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
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(`/product/${productId}`)}
        className="mb-4 text-blue-600 hover:text-blue-700 flex items-center"
      >
        ← Volver al producto
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Información de Entrega y Pago</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <form className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Datos de Entrega</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={customerData.fullName}
                onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerData.phoneNumberPrefix}
                  onChange={(e) => setCustomerData({ ...customerData, phoneNumberPrefix: e.target.value })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+57"
                />
                <input
                  type="tel"
                  required
                  value={customerData.phoneNumber}
                  onChange={(e) => setCustomerData({ ...customerData, phoneNumber: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección *
              </label>
              <input
                type="text"
                required
                value={shippingData.addressLine1}
                onChange={(e) => setShippingData({ ...shippingData, addressLine1: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad *
                </label>
                <input
                  type="text"
                  required
                  value={shippingData.city}
                  onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal *
                </label>
                <input
                  type="text"
                  required
                  value={shippingData.postalCode}
                  onChange={(e) => setShippingData({ ...shippingData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento/Región *
              </label>
              <input
                type="text"
                required
                value={shippingData.region}
                onChange={(e) => setShippingData({ ...shippingData, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentProduct.stock, quantity + 1))}
                  disabled={quantity >= currentProduct.stock}
                  className="w-10 h-10 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  +
                </button>
                <span className="text-sm text-gray-500">
                  (Stock: {currentProduct.stock})
                </span>
              </div>
            </div>

            {!checkoutSession ? (
              <button
                type="button"
                onClick={handleCreateSession}
                disabled={isTransactionLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTransactionLoading ? 'Creando sesión...' : 'Continuar con el pago'}
              </button>
            ) : (
              <div className="space-y-4">
                <WompiWidget
                  publicKey={checkoutSession.publicKey}
                  currency={checkoutSession.currency}
                  amountInCents={checkoutSession.amountInCents}
                  reference={checkoutSession.reference}
                  signature={checkoutSession.signature}
                  redirectUrl={checkoutSession.redirectUrl}
                  shippingAddress={checkoutSession.shippingAddress}
                  customerData={checkoutSession.customerData}
                  taxInCents={checkoutSession.taxInCents}
                  onSuccess={handleWompiSuccess}
                  onError={handleWompiError}
                />
                <button
                  type="button"
                  onClick={() => setCheckoutSession(null)}
                  className="w-full bg-gray-200 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-300"
                >
                  Volver a editar
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen</h2>

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
