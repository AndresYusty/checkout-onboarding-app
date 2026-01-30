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
      <div className="text-center py-20">
        <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Tu Carrito está Vacío
        </h1>
        <p className="text-gray-600 text-lg mb-8">Agrega productos increíbles a tu carrito</p>
        <Link
          to="/"
          className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Explorar Productos
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Carrito de Compras
          </h1>
          <p className="text-gray-600">Revisa tus productos antes de comprar</p>
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center space-x-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-all font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Limpiar Carrito</span>
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

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between border-b border-gray-100 pb-6 last:border-b-0 last:pb-0 hover:bg-gray-50 rounded-lg p-4 -m-4 transition-all"
            >
              <div className="flex items-center space-x-5 flex-1">
                {item.product.imageUrl ? (
                  <div className="w-24 h-24 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    ${Number(item.product.price).toLocaleString('es-CO')} c/u
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity - 1 }))}
                        className="w-8 h-8 rounded-md bg-white hover:bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-700 transition-all font-bold"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity + 1 }))}
                        disabled={item.quantity >= item.product.stock}
                        className="w-8 h-8 rounded-md bg-white hover:bg-gray-200 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-700 transition-all font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ${(Number(item.product.price) * item.quantity).toLocaleString('es-CO')}
                  </p>
                </div>
                <button
                  onClick={() => setItemToRemove(item.product.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                  title="Eliminar producto"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
        <div className="flex justify-between items-center mb-6 pb-6 border-b-2 border-gray-200">
          <span className="text-xl font-bold text-gray-700">Total:</span>
          <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ${total.toLocaleString('es-CO')}
          </span>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleCheckout}
            className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white text-center py-4 rounded-xl font-bold hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Proceder al Pago</span>
          </button>
          <Link
            to="/"
            className="block w-full bg-white border-2 border-gray-300 text-gray-700 text-center py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
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

