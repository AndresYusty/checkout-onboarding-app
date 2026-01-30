import { Injectable } from '@nestjs/common';
import { TransactionRepository } from '../../../infrastructure/repositories/transaction.repository.impl';
import { ProductRepository } from '../../../infrastructure/repositories/product.repository.impl';
import { WompiAdapter } from '../../../infrastructure/adapters/wompi.adapter';
import { randomUUID } from 'crypto';

export interface ProcessCheckoutInput {
  productId: string;
  quantity?: number; // Cantidad a comprar (default: 1)
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  delivery: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
    region?: string;
  };
  card: {
    number: string;
    expMonth: string;
    expYear: string;
    cvc: string;
  };
}

export interface ProcessCheckoutOutput {
  success: boolean;
  status?: string;
  transactionId?: string;
  orderId?: string;
  message?: string;
  error?: string;
}

@Injectable()
export class ProcessCheckoutUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly productRepository: ProductRepository,
    private readonly wompiAdapter: WompiAdapter,
  ) {}

  async execute(input: ProcessCheckoutInput): Promise<ProcessCheckoutOutput> {
    try {
      // Determinar cantidad (default: 1)
      const quantity = input.quantity || 1;

      // 1. Validar producto y stock
      const product = await this.productRepository.findById(input.productId);
      if (!product) {
        return {
          success: false,
          error: 'Producto no encontrado',
        };
      }

      console.log('Stock validation:', {
        productId: input.productId,
        quantity: quantity,
        currentStock: product.stock,
        stockAfter: product.stock - quantity,
      });

      if (product.stock < quantity) {
        return {
          success: false,
          error: `Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${quantity}`,
        };
      }

      // 2. Calcular totales (UNA SOLA FUENTE DE VERDAD - Backend recalcula TODO)
      // El frontend NO debe enviar el total, solo la cantidad
      const unitPrice = Number(product.price);
      const baseFee = 3000; // $3,000.00
      const shippingFee = 7000; // $7,000.00
      
      // Calcular en pesos primero
      const subtotal = unitPrice * quantity;
      const tax = Math.round(subtotal * 0.19); // IVA 19%
      const total = subtotal + baseFee + shippingFee + tax;
      
      // Convertir a centavos para Wompi
      const subtotalInCents = Math.round(subtotal * 100);
      const baseFeeInCents = Math.round(baseFee * 100);
      const shippingFeeInCents = Math.round(shippingFee * 100);
      const taxInCents = Math.round(tax * 100);
      const totalInCents = Math.round(total * 100);
      
      // Log detallado del cálculo (para debugging)
      console.log('=== CÁLCULO DE TOTALES ===');
      console.log({
        unitPrice,
        quantity,
        subtotal,
        baseFee,
        shippingFee,
        tax,
        total,
        subtotalInCents,
        baseFeeInCents,
        shippingFeeInCents,
        taxInCents,
        totalInCents,
      });
      console.log('========================');

      // 3. Generar referencia única
      const reference = `ORDER_${randomUUID()}`;

      // 4. Crear orden en estado PENDING (ANTES de Wompi)
      // Usar los valores calculados en pesos (no centavos)
      const order = await this.transactionRepository.create({
        orderNumber: reference,
        productId: input.productId,
        quantity: quantity, // Usar la cantidad real
        subtotal: subtotal, // Ya está en pesos
        shippingFee: shippingFee, // Ya está en pesos
        tax: tax, // Ya está en pesos
        total: total, // Ya está en pesos
        shippingAddress: {
          street: input.delivery.address,
          city: input.delivery.city,
          state: input.delivery.region,
          postalCode: input.delivery.postalCode,
          country: input.delivery.country,
        },
      });

      // 5. Tokenizar tarjeta con Wompi
      const tokenResponse = await this.wompiAdapter.tokenizeCard({
        number: input.card.number,
        expMonth: input.card.expMonth,
        expYear: input.card.expYear,
        cvc: input.card.cvc,
        cardHolder: input.customer.fullName,
      });

      const paymentToken = tokenResponse.data.id;

      // 6. Crear transacción en Wompi
      // NOTA: shipping_address NO se envía a Wompi (causa 422 en sandbox)
      // La dirección ya se guardó en el backend al crear la orden
      // IMPORTANTE: El backend recalcula el total, ignorando cualquier valor del frontend
      console.log('Enviando a Wompi:', {
        amountInCents: totalInCents,
        reference: reference,
        currency: 'COP',
      });
      
      const wompiTransaction = await this.wompiAdapter.createTransaction({
        amountInCents: totalInCents, // Total calculado por el backend
        currency: 'COP',
        customerEmail: input.customer.email,
        paymentMethod: {
          type: 'CARD',
          token: paymentToken,
          installments: 1,
        },
        reference: reference,
        // shippingAddress se omite - no es obligatorio y causa errores 422 en sandbox
      });

      const wompiTransactionId = wompiTransaction.data.id;
      const wompiStatus = wompiTransaction.data.status;

      // 7. Consultar estado de la transacción (puede no estar finalizada inmediatamente)
      let finalStatus = wompiStatus;
      if (wompiStatus === 'PENDING') {
        // Esperar un momento y consultar de nuevo
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusCheck = await this.wompiAdapter.getTransaction(wompiTransactionId);
        finalStatus = statusCheck.data.status;
      }

      // 8. Actualizar orden según resultado
      const isApproved = finalStatus === 'APPROVED';
      const isDeclined = finalStatus === 'DECLINED' || finalStatus === 'VOIDED';

      if (isApproved) {
        // Actualizar orden a APPROVED y descontar stock
        await this.transactionRepository.updateStatus(
          order.id,
          'CONFIRMED',
          'APPROVED',
          wompiTransactionId,
        );
        
        // Descontar la cantidad real comprada
        console.log('Updating stock:', {
          productId: input.productId,
          quantity: quantity,
          stockBefore: product.stock,
        });
        await this.transactionRepository.updateStock(input.productId, quantity);
        
        // Verificar stock después del descuento
        const updatedProduct = await this.productRepository.findById(input.productId);
        console.log('Stock after update:', updatedProduct?.stock);
      } else if (isDeclined) {
        // Actualizar orden a FAILED
        await this.transactionRepository.updateStatus(
          order.id,
          'CANCELLED',
          'REJECTED',
          wompiTransactionId,
        );
      } else {
        // Mantener en PENDING
        await this.transactionRepository.updateStatus(
          order.id,
          'PENDING',
          'PENDING',
          wompiTransactionId,
        );
      }

      return {
        success: isApproved,
        status: finalStatus,
        transactionId: wompiTransactionId,
        orderId: order.id,
        message: isApproved 
          ? 'Payment successful' 
          : isDeclined 
          ? 'Payment declined' 
          : 'Payment pending',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al procesar el pago',
      };
    }
  }
}

