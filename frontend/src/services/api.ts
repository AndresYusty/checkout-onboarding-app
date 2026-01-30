import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Tipos para las respuestas del API
export interface Product {
  id: string
  name: string
  description?: string
  price: number
  sku?: string
  stock: number
  imageUrl?: string
  categoryId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductDto {
  name: string
  description?: string
  price: number
  sku?: string
  stock: number
  imageUrl?: string
  categoryId?: string
  isActive?: boolean
}

// Servicios del API
export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/catalog/products')
    return response.data
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/catalog/products/${id}`)
    return response.data
  },

  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await api.post<Product>('/catalog/products', data)
    return response.data
  },

  update: async (id: string, data: Partial<CreateProductDto>): Promise<Product> => {
    const response = await api.patch<Product>(`/catalog/products/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/catalog/products/${id}`)
  },
}

export default api

