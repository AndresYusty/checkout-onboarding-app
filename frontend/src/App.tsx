import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { ModalProvider } from './context/ModalContext'
import Layout from './components/Layout'
import CatalogPage from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import PaymentPage from './pages/PaymentPage'
import TransactionResultPage from './pages/TransactionResultPage'

function App() {
  return (
    <Provider store={store}>
      <ModalProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/payment/:productId" element={<PaymentPage />} />
              <Route path="/transaction/result/:orderId" element={<TransactionResultPage />} />
            </Routes>
          </Layout>
        </Router>
      </ModalProvider>
    </Provider>
  )
}

export default App

