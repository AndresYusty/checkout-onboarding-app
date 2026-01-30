import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { TransactionRepository } from '../../../infrastructure/repositories/transaction.repository.impl';
import { OrderStatus, PaymentStatus, Order, OrderItem } from '@prisma/client';
import { generateWompiSignature } from '../../../utils/wompi-signature.util';
import { ConfigService } from '@nestjs/config';

type OrderWithItems = Order & {
  items: (OrderItem & {
    product: any;
  })[];
};

interface WompiWebhookEvent {
  event: string;
  data: {
    transaction: {
      id: string;
      status: string;
      amount_in_cents: number;
      currency: string;
      customer_email: string;
      payment_method: {
        type: string;
      };
      reference: string;
      created_at: string;
      finalized_at?: string;
    };
  };
  timestamp: number;
  signature: {
    checksum: string;
    properties: string[];
  };
}

@Controller('webhooks')
export class WompiWebhookController {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly configService: ConfigService,
  ) {}

  @Post('wompi')
  @HttpCode(HttpStatus.OK)
  async handleWompiWebhook(
    @Body() event: WompiWebhookEvent,
    @Headers('x-signature') signature?: string,
  ) {
    try {
      // Validar que el evento sea de transacción
      if (event.event !== 'transaction.updated') {
        return { received: true };
      }

      const transaction = event.data.transaction;
      const order = await this.transactionRepository.findByPaymentId(transaction.id);

      if (!order) {
        console.warn(`Order not found for payment ID: ${transaction.id}`);
        return { received: true };
      }

      // Mapear estado de Wompi a estados internos
      const paymentStatus = this.mapWompiStatusToPaymentStatus(transaction.status);
      const orderStatus =
        paymentStatus === PaymentStatus.APPROVED
          ? OrderStatus.CONFIRMED
          : paymentStatus === PaymentStatus.REJECTED
          ? OrderStatus.CANCELLED
          : OrderStatus.PENDING;

      // Actualizar orden
      const updatedOrder = await this.transactionRepository.updateStatus(
        order.id,
        orderStatus,
        paymentStatus,
        transaction.id,
      ) as OrderWithItems;

      // Si el pago fue aprobado, actualizar stock
      if (paymentStatus === PaymentStatus.APPROVED && updatedOrder.items && updatedOrder.items.length > 0) {
        const item = updatedOrder.items[0];
        await this.transactionRepository.updateStock(item.productId, item.quantity);
      }

      return { received: true, processed: true };
    } catch (error: any) {
      console.error('Error processing Wompi webhook:', error);
      return { received: true, error: error.message };
    }
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

