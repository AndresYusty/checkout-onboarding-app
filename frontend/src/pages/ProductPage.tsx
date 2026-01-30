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
          <div className="w-16 h-16 border-4 border-wompi-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-wompi-text font-medium">Cargando producto...</div>
        </div>
      </div>
    )
  }

  if (error || !currentProduct) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">⚠️</span>
        </div>
        <p className="text-lg text-red-600 mb-4 font-semibold">{error || 'Producto no encontrado'}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-wompi-primary to-wompi-primaryDark text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
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
        className="mb-6 text-wompi-primary hover:text-wompi-primaryDark flex items-center space-x-2 font-medium transition-colors"
      >
        <span className="text-xl">←</span>
        <span>Volver al catálogo</span>
      </button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {/* Imagen */}
          <div className="relative">
            {currentProduct.imageUrl ? (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-wompi-primary/10 to-wompi-primaryLight/10 p-4">
                <img
                  src={currentProduct.imageUrl}
                  alt={currentProduct.name}
                  className="w-full h-96 object-cover rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-wompi-primary/20 to-wompi-primaryLight/20 rounded-xl flex items-center justify-center">
                <span className="text-wompi-primary text-6xl">📦</span>
              </div>
            )}
          </div>

          {/* Información */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-wompi-primary/10 text-wompi-primaryDark text-xs font-semibold rounded-full mb-3">
                  Disponible
                </span>
              </div>
              
              <h1 className="text-4xl font-bold text-wompi-secondary mb-4">
                {currentProduct.name}
              </h1>

              {currentProduct.description && (
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">{currentProduct.description}</p>
              )}

              <div className="mb-6 p-6 bg-gradient-to-br from-wompi-primary/5 to-wompi-primaryLight/5 rounded-xl border border-wompi-primary/20">
                <div className="text-5xl font-bold text-wompi-secondary mb-3">
                  ${Number(currentProduct.price).toLocaleString('es-CO')}
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Stock disponible:</span>
                  <span className="font-bold text-wompi-primaryDark px-2 py-1 bg-white rounded-md">
                    {currentProduct.stock} unidades
                  </span>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={handleBuyNow}
                disabled={currentProduct.stock === 0}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg ${
                  currentProduct.stock > 0
                    ? 'bg-gradient-to-r from-wompi-primary to-wompi-primaryDark text-white hover:shadow-xl hover:from-wompi-primaryDark hover:to-wompi-primary'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
              <p className="text-center text-xs text-gray-500 mt-3">
                Pago seguro procesado por <span className="font-semibold text-wompi-primary">Wompi</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

