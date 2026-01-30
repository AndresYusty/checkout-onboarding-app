import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useModal } from '../context/ModalContext'
import ConfirmModal from '../components/ConfirmModal'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart()
  const { showModal } = useModal()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Carrito de Compras</h1>
        <p className="text-gray-600 text-lg mb-6">Tu carrito está vacío</p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Ver Productos
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Carrito de Compras</h1>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          Limpiar Carrito
        </button>
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearCart()
          showModal('Carrito limpiado exitosamente', 'info', 'Carrito vacío')
        }}
        title="Limpiar carrito"
        message="¿Estás seguro de que deseas eliminar todos los productos del carrito? Esta acción no se puede deshacer."
        confirmText="Sí, limpiar"
        cancelText="Cancelar"
        type="warning"
      />

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between border-b pb-4 last:border-b-0"
            >
              <div className="flex items-center space-x-4 flex-1">
                {item.product.imageUrl && (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.product.name}
                  </h3>
                  <p className="text-gray-600">
                    ${Number(item.product.price).toLocaleString('es-CO')} c/u
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <div className="w-32 text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${(Number(item.product.price) * item.quantity).toLocaleString('es-CO')}
                  </p>
                </div>
                <button
                  onClick={() => setItemToRemove(item.product.id)}
                  className="text-red-600 hover:text-red-700 ml-4 transition-transform hover:scale-110"
                  title="Eliminar producto"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-semibold text-gray-900">Total:</span>
          <span className="text-3xl font-bold text-gray-900">
            ${getTotal().toLocaleString('es-CO')}
          </span>
        </div>
        <Link
          to="/checkout"
          className="block w-full bg-green-600 text-white text-center py-3 rounded-md font-medium hover:bg-green-700 transition-colors"
        >
          Proceder al Checkout
        </Link>
      </div>

      {itemToRemove && (
        <ConfirmModal
          isOpen={!!itemToRemove}
          onClose={() => setItemToRemove(null)}
          onConfirm={() => {
            const product = items.find(item => item.product.id === itemToRemove)?.product
            removeItem(itemToRemove)
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

