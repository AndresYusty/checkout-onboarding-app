import { Link } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import { selectCartItemCount } from '../store/slices/cartSlice'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const itemCount = useAppSelector(selectCartItemCount)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-lg border-b-2 border-wompi-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-wompi-primary to-wompi-primaryDark rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
                  <span className="text-white text-xl font-bold">W</span>
                </div>
                <div>
                  <div className="text-xl font-bold text-wompi-secondary">Wompi</div>
                  <div className="text-xs text-gray-500">Checkout</div>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                to="/"
                className="text-wompi-text hover:text-wompi-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-wompi-primary/10"
              >
                📁 Catálogo
              </Link>
              <Link
                to="/cart"
                className="relative text-wompi-text hover:text-wompi-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-wompi-primary/10"
              >
                🛒 Carrito
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-wompi-primary rounded-full shadow-md">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

