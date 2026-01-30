import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { checkoutService } from '../services/checkout.service'
import { setCurrentProduct, updateProductStock } from '../store/slices/productSlice'
import { clearTransaction } from '../store/slices/transactionSlice'
import { productService } from '../services/api'
import { useModal } from '../context/ModalContext'

export default function TransactionResultPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { currentTransaction } = useAppSelector((state) => state.transaction)
  const { showModal } = useModal()

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      loadTransaction()
    }
  }, [orderId])

  const loadTransaction = async () => {
    if (!orderId) return

    try {
      setLoading(true)
      const result = await checkoutService.getTransaction(orderId)
      
      if (result.success && result.data) {
        setOrder(result.data)
        
        // Actualizar stock en el store
        if (result.data.items && result.data.items.length > 0) {
          const item = result.data.items[0]
          dispatch(updateProductStock({
            productId: item.productId,
            newStock: item.product.stock,
          }))
        }
      } else {
        showModal('Error al cargar la transacción', 'error', 'Error')
      }
    } catch (error: any) {
      showModal('Error al cargar la transacción', 'error', 'Error')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToProduct = () => {
    if (order?.items?.[0]?.productId) {
      dispatch(clearTransaction())
      navigate(`/product/${order.items[0].productId}`)
    } else {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando resultado...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Transacción no encontrada</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  const isApproved = order.paymentStatus === 'APPROVED'
  const isRejected = order.paymentStatus === 'REJECTED'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        {/* Icono de resultado */}
        <div className="mb-6">
          {isApproved ? (
            <div className="text-8xl mb-4">✅</div>
          ) : isRejected ? (
            <div className="text-8xl mb-4">❌</div>
          ) : (
            <div className="text-8xl mb-4">⏳</div>
          )}
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isApproved
            ? '¡Pago Exitoso!'
            : isRejected
            ? 'Pago Rechazado'
            : 'Pago Pendiente'}
        </h1>

        {/* Mensaje */}
        <p className="text-lg text-gray-600 mb-8">
          {isApproved
            ? 'Tu orden ha sido procesada exitosamente. Recibirás un correo de confirmación pronto.'
            : isRejected
            ? 'Tu pago fue rechazado. Por favor intenta nuevamente con otra tarjeta.'
            : 'Tu pago está siendo procesado. Te notificaremos cuando se complete.'}
        </p>

        {/* Detalles de la orden */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles de la Orden</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Número de Orden:</span>
              <span className="font-medium text-gray-900">{order.orderNumber}</span>
            </div>
            {order.paymentId && (
              <div className="flex justify-between">
                <span className="text-gray-600">ID de Transacción:</span>
                <span className="font-medium text-gray-900">{order.paymentId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className={`font-medium ${
                isApproved ? 'text-green-600' : isRejected ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {order.paymentStatus}
              </span>
            </div>
            {order.items && order.items.length > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Producto:</span>
                  <span className="font-medium text-gray-900">
                    {order.items[0].product.name} x{order.items[0].quantity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock actualizado:</span>
                  <span className="font-medium text-gray-900">
                    {order.items[0].product.stock} unidades
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">${Number(order.total).toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleBackToProduct}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Ver Producto
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
          >
            Volver al Catálogo
          </button>
        </div>
      </div>
    </div>
  )
}

