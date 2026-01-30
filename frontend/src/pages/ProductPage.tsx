import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setCurrentProduct, setLoading, setError } from '../store/slices/productSlice'
import { addItem } from '../store/slices/cartSlice'
import { productService } from '../services/api'
import { useModal } from '../context/ModalContext'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { currentProduct, isLoading, error } = useAppSelector((state) => state.product)
  const { showModal } = useModal()
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (id) {
      // Siempre recargar desde la API para obtener el stock actualizado
      // Especialmente importante después de una compra exitosa
      loadProduct()
    }
  }, [id])

  const loadProduct = async () => {
    if (!id) return

    try {
      dispatch(setLoading(true))
      const product = await productService.getById(id)
      dispatch(setCurrentProduct(product))
    } catch (err: any) {
      dispatch(setError('Error al cargar el producto'))
      showModal('Error al cargar el producto', 'error', 'Error')
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleAddToCart = () => {
    if (!currentProduct) return
    if (currentProduct.stock === 0) {
      showModal('Este producto no tiene stock disponible', 'error', 'Sin stock')
      return
    }
    if (quantity > currentProduct.stock) {
      showModal('La cantidad solicitada excede el stock disponible', 'error', 'Stock insuficiente')
      return
    }
    dispatch(addItem({ product: currentProduct, quantity }))
    showModal(`${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} agregada${quantity === 1 ? '' : 's'} al carrito`, 'success', 'Agregado al carrito')
    setQuantity(1)
  }

  const handleBuyNow = () => {
    if (!currentProduct) return
    if (currentProduct.stock === 0) {
      showModal('Este producto no tiene stock disponible', 'error', 'Sin stock')
      return
    }
    navigate(`/payment/${currentProduct.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-base text-gray-600">Cargando producto...</div>
        </div>
      </div>
    )
  }

  if (error || !currentProduct) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <p className="text-base text-red-600 mb-4 font-medium">{error || 'Producto no encontrado'}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 text-white px-5 py-2.5 rounded-lg hover:bg-blue-600 transition-all font-medium"
        >
          Volver al catálogo
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="mb-4 text-gray-600 hover:text-gray-800 flex items-center space-x-1 text-sm transition-colors"
      >
        <span>←</span>
        <span>Volver al catálogo</span>
      </button>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Imagen */}
          <div className="relative">
            {currentProduct.imageUrl ? (
              <div className="relative overflow-hidden rounded-lg bg-gray-50 p-3">
                <img
                  src={currentProduct.imageUrl}
                  alt={currentProduct.name}
                  className="w-full h-80 object-cover rounded-md"
                />
              </div>
            ) : (
              <div className="w-full h-80 bg-gray-50 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-5xl">📦</span>
              </div>
            )}
          </div>

          {/* Información */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-3">
                <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                  Disponible
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {currentProduct.name}
              </h1>

              {currentProduct.description && (
                <p className="text-gray-600 mb-5 text-base leading-relaxed">{currentProduct.description}</p>
              )}

              <div className="mb-5 p-4 bg-gray-50 rounded-lg">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  ${Number(currentProduct.price).toLocaleString('es-CO')}
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">Stock disponible:</span>
                  <span className="font-medium text-gray-700 px-2 py-0.5 bg-white rounded">
                    {currentProduct.stock} unidades
                  </span>
                </div>
              </div>

              {/* Selector de cantidad */}
              <div className="mb-5 p-3 bg-white border border-gray-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-md bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 flex items-center justify-center font-medium transition-colors"
                  >
                    −
                  </button>
                  <span className="text-lg font-semibold text-gray-900 w-12 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(currentProduct.stock, quantity + 1))}
                    disabled={quantity >= currentProduct.stock}
                    className="w-9 h-9 rounded-md bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-2">
                    (Stock: {currentProduct.stock})
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={currentProduct.stock === 0}
                className={`w-full py-2.5 px-5 rounded-lg font-medium text-sm transition-all border ${
                  currentProduct.stock > 0
                    ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {currentProduct.stock > 0 ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span>🛒</span>
                    <span>Agregar al Carrito</span>
                  </span>
                ) : (
                  'Sin Stock'
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={currentProduct.stock === 0}
                className={`w-full py-3 px-5 rounded-lg font-medium text-base transition-all ${
                  currentProduct.stock > 0
                    ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {currentProduct.stock > 0 ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span>💳</span>
                    <span>Pagar con Wompi</span>
                  </span>
                ) : (
                  'Sin Stock'
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Pago seguro procesado por <span className="font-medium">Wompi</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

