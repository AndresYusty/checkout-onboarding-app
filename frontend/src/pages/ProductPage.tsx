import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setCurrentProduct, setLoading, setError } from '../store/slices/productSlice'
import { productService } from '../services/api'
import { useModal } from '../context/ModalContext'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { currentProduct, isLoading, error } = useAppSelector((state) => state.product)
  const { showModal } = useModal()

  useEffect(() => {
    if (id) {
      // Intentar cargar desde localStorage primero
      const stored = localStorage.getItem('currentProduct')
      if (stored) {
        try {
          const product = JSON.parse(stored)
          if (product.id === id) {
            dispatch(setCurrentProduct(product))
            return
          }
        } catch {
          // Si hay error, cargar desde API
        }
      }
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
        <div className="text-lg text-gray-600">Cargando producto...</div>
      </div>
    )
  }

  if (error || !currentProduct) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">{error || 'Producto no encontrado'}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Volver al catálogo
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="mb-4 text-blue-600 hover:text-blue-700 flex items-center"
      >
        ← Volver al catálogo
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Imagen */}
          <div>
            {currentProduct.imageUrl ? (
              <img
                src={currentProduct.imageUrl}
                alt={currentProduct.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-4xl">📦</span>
              </div>
            )}
          </div>

          {/* Información */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {currentProduct.name}
              </h1>

              {currentProduct.description && (
                <p className="text-gray-600 mb-6">{currentProduct.description}</p>
              )}

              <div className="mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  ${Number(currentProduct.price).toLocaleString('es-CO')}
                </div>
                <div className="text-sm text-gray-500">
                  Stock disponible: <span className="font-semibold">{currentProduct.stock} unidades</span>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={handleBuyNow}
                disabled={currentProduct.stock === 0}
                className={`w-full py-4 px-6 rounded-md font-medium text-lg transition-colors ${
                  currentProduct.stock > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {currentProduct.stock > 0 ? '🛒 Pagar con tarjeta de crédito' : 'Sin Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

