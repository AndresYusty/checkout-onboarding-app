import { Injectable } from '@nestjs/common';
import { Order, OrderStatus, PaymentStatus } from '@prisma/client';
import { TransactionRepository } from '../../../infrastructure/repositories/transaction.repository.impl';
import { WompiAdapter } from '../../../infrastructure/adapters/wompi.adapter';

export interface CreateTransactionInput {
  productId: string;
  quantity: number;
  customerEmail: string;
  paymentToken: string;
  cardData: {
    number: string;
    cvv: string;
    expMonth: string;
    expYear: string;
    cardHolder: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly wompiPort: WompiAdapter,
  ) {}

  async execute(input: CreateTransactionInput): Promise<{ order: Order; wompiResponse: any }> {
    // 1. Obtener producto y validar stock
    const product = await this.transactionRepository.getProductById(input.productId);
    if (!product) {
      throw new Error('Producto no encontrado');
    }
    if (product.stock < input.quantity) {
      throw new Error('Stock insuficiente');
    }

    // Validar que el producto esté activo
    if (!product.isActive) {
      throw new Error('Producto no disponible');
    }

    // 2. Calcular totales (en centavos para Wompi)
    const baseFeeInCents = 300000; // $3,000.00 en centavos
    const shippingFeeInCents = 700000; // $7,000.00 en centavos
    const subtotalInCents = Math.round(Number(product.price) * input.quantity * 100); // Convertir a centavos
    const taxInCents = Math.round(subtotalInCents * 0.19); // IVA 19%
    const totalInCents = subtotalInCents + baseFeeInCents + shippingFeeInCents + taxInCents;
    
    // Valores en pesos para la BD
    const subtotal = subtotalInCents / 100;
    const shippingFee = shippingFeeInCents / 100;
    const tax = taxInCents / 100;
    const total = totalInCents / 100;

    // 3. Generar número de orden
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // 4. Crear transacción en estado PENDING
    const order = await this.transactionRepository.create({
      orderNumber,
      productId: input.productId,
      quantity: input.quantity,
      subtotal,
      shippingFee,
      tax,
      total,
      shippingAddress: input.shippingAddress,
      paymentMethod: 'CARD',
    });

    // 5. Llamar a Wompi
    const wompiResponse = await this.wompiPort.createTransaction({
      amountInCents: totalInCents,
      currency: 'COP',
      customerEmail: input.customerEmail,
      paymentMethod: {
        type: 'CARD',
        installments: 1,
        token: input.paymentToken,
      },
      reference: orderNumber,
      shippingAddress: {
        addressLine1: input.shippingAddress.street,
        city: input.shippingAddress.city,
        phoneNumber: input.shippingAddress.phone,
        region: input.shippingAddress.state || input.shippingAddress.city,
        country: input.shippingAddress.country,
      },
    });

    // 6. Actualizar orden con paymentId y estado
    const paymentStatus = this.mapWompiStatusToPaymentStatus(wompiResponse.data.status);
    const orderStatus = paymentStatus === PaymentStatus.APPROVED 
      ? OrderStatus.CONFIRMED 
      : paymentStatus === PaymentStatus.REJECTED 
      ? OrderStatus.CANCELLED 
      : OrderStatus.PENDING;

    const updatedOrder = await this.transactionRepository.updateStatus(
      order.id,
      orderStatus,
      paymentStatus,
      wompiResponse.data.id,
    );

    // 7. Si el pago fue aprobado, actualizar stock
    if (paymentStatus === PaymentStatus.APPROVED) {
      await this.transactionRepository.updateStock(input.productId, input.quantity);
    }

    return {
      order: updatedOrder,
      wompiResponse: wompiResponse.data,
    };
  }

  private mapWompiStatusToPaymentStatus(wompiStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      APPROVED: PaymentStatus.APPROVED,
      DECLINED: PaymentStatus.REJECTED,
      VOIDED: PaymentStatus.CANCELLED,
      PENDING: PaymentStatus.PENDING,
    };

    return statusMap[wompiStatus] || PaymentStatus.PENDING;
  }
}
