import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { removeItem, updateQuantity, clearCart, selectCartItems, selectCartTotal } from '../store/slices/cartSlice'
import { useModal } from '../context/ModalContext'
import ConfirmModal from '../components/ConfirmModal'

export default function CartPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const items = useAppSelector(selectCartItems)
  const total = useAppSelector(selectCartTotal)
  const { showModal } = useModal()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<string | null>(null)

  const handleCheckout = () => {
    if (items.length === 0) {
      showModal('Tu carrito está vacío', 'warning', 'Carrito vacío')
      return
    }
    // Redirigir al primer producto del carrito con flag de carrito
    const firstItem = items[0]
    navigate(`/payment/${firstItem.product.id}?fromCart=true`)
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Carrito de Compras</h1>
        <p className="text-gray-600 mb-6">Tu carrito está vacío</p>
        <Link
          to="/"
          className="inline-block bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          Ver Productos
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Carrito de Compras</h1>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
        >
          Limpiar Carrito
        </button>
      </div>

        <ConfirmModal
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          onConfirm={() => {
            dispatch(clearCart())
            showModal('Carrito limpiado exitosamente', 'info', 'Carrito vacío')
          }}
          title="Limpiar carrito"
          message="¿Estás seguro de que deseas eliminar todos los productos del carrito? Esta acción no se puede deshacer."
          confirmText="Sí, limpiar"
          cancelText="Cancelar"
          type="warning"
        />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-5">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center space-x-4 flex-1">
                {item.product.imageUrl ? (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    ${Number(item.product.price).toLocaleString('es-CO')} c/u
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity - 1 }))}
                    className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-700 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-medium text-gray-900">{item.quantity}</span>
                  <button
                    onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity + 1 }))}
                    disabled={item.quantity >= item.product.stock}
                    className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-700 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="w-24 text-right">
                  <p className="text-base font-semibold text-gray-900">
                    ${(Number(item.product.price) * item.quantity).toLocaleString('es-CO')}
                  </p>
                </div>
                <button
                  onClick={() => setItemToRemove(item.product.id)}
                  className="text-red-600 hover:text-red-700 ml-2 transition-colors p-1"
                  title="Eliminar producto"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
          <span className="text-lg font-semibold text-gray-900">Total:</span>
          <span className="text-2xl font-bold text-gray-900">
            ${total.toLocaleString('es-CO')}
          </span>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleCheckout}
            className="w-full bg-gray-900 text-white text-center py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md"
          >
            💳 Proceder al Pago
          </button>
          <Link
            to="/"
            className="block w-full bg-white border border-gray-300 text-gray-700 text-center py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Continuar Comprando
          </Link>
        </div>
      </div>

      {itemToRemove && (
        <ConfirmModal
          isOpen={!!itemToRemove}
          onClose={() => setItemToRemove(null)}
          onConfirm={() => {
            const product = items.find(item => item.product.id === itemToRemove)?.product
            dispatch(removeItem(itemToRemove!))
            showModal(
              `${product?.name || 'Producto'} eliminado del carrito`,
              'info',
              'Producto eliminado'
            )
            setItemToRemove(null)
          }}
          title="Eliminar producto"
          message={`¿Estás seguro de que deseas eliminar "${items.find(item => item.product.id === itemToRemove)?.product.name}" del carrito?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="warning"
        />
      )}
    </div>
  )
}

