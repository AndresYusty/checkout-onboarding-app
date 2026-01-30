import { Order, PaymentStatus, OrderStatus } from '@prisma/client';

export interface ITransactionRepository {
  create(data: CreateTransactionData): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByPaymentId(paymentId: string): Promise<Order | null>;
  updateStatus(id: string, status: OrderStatus, paymentStatus: PaymentStatus, paymentId?: string): Promise<Order>;
  updateStock(productId: string, quantity: number): Promise<void>;
}

export interface CreateTransactionData {
  orderNumber: string;
  userId?: string;
  productId: string;
  quantity: number;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  paymentMethod?: string;
}

