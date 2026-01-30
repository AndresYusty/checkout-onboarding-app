import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setProducts, setLoading, setError } from '../store/slices/productSlice'
import { productService } from '../services/api'
import { useModal } from '../context/ModalContext'

export default function CatalogPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { products, isLoading, error } = useAppSelector((state) => state.product)
  const { showModal } = useModal()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      dispatch(setLoading(true))
      const data = await productService.getAll()
      dispatch(setProducts(data))
    } catch (err) {
      dispatch(setError('Error al cargar los productos'))
      showModal('Error al cargar los productos', 'error', 'Error')
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando productos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Descubre Nuestros Productos
        </h1>
        <p className="text-gray-600 text-lg">Encuentra lo que buscas con la mejor calidad y precio</p>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-600 text-xl font-medium">No hay productos disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className="relative overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
                {product.stock > 0 && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    Disponible
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    Agotado
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {product.description}
                  </p>
                )}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ${Number(product.price).toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="font-medium">{product.stock} unidades</span>
                  </div>
                </div>
                <button
                  onClick={() => handleProductClick(product.id)}
                  disabled={product.stock === 0}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform ${
                    product.stock > 0
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {product.stock > 0 ? 'Ver Detalles' : 'Sin Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

