import api from './api'

export interface CreateCheckoutSessionDto {
  productId: string
  quantity: number
  customerEmail: string
  shippingAddress: {
    addressLine1: string
    addressLine2?: string
    country: string
    city: string
    phoneNumber: string
    region: string
    name?: string
    postalCode?: string
  }
  customerData?: {
    email: string
    fullName?: string
    phoneNumber?: string
    phoneNumberPrefix?: string
    legalId?: string
    legalIdType?: string
  }
  redirectUrl?: string
}

export interface CheckoutSessionResponse {
  success: boolean
  data?: {
    publicKey: string
    currency: string
    amountInCents: number
    reference: string
    signature: string
    redirectUrl: string
    shippingAddress: any
    customerData: any
    taxInCents: {
      vat: number
    }
    product: any
    quantity: number
  }
  error?: string
}

export interface CreateTransactionDto {
  productId: string
  quantity: number
  customerEmail: string
  paymentToken: string
  cardData: {
    number: string
    cvv: string
    expMonth: string
    expYear: string
    cardHolder: string
  }
  shippingAddress: {
    street: string
    city: string
    state?: string
    postalCode: string
    country: string
    phone: string
  }
}

export interface TransactionResponse {
  success: boolean
  data?: {
    order: any
    transaction: any
  }
  error?: string
}

export const checkoutService = {
  createCheckoutSession: async (data: CreateCheckoutSessionDto): Promise<CheckoutSessionResponse> => {
    const response = await api.post<CheckoutSessionResponse>('/checkout/sessions', data)
    return response.data
  },

  createTransaction: async (data: CreateTransactionDto): Promise<TransactionResponse> => {
    const response = await api.post<TransactionResponse>('/checkout/transactions', data)
    return response.data
  },

  getTransaction: async (orderId: string): Promise<TransactionResponse> => {
    const response = await api.get<TransactionResponse>(`/checkout/transactions/${orderId}`)
    return response.data
  },
}
