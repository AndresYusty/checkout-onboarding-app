import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { CreateCheckoutSessionDto } from '../dto/create-checkout-session.dto';
import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import { CreateTransactionUseCase } from '../../../application/use-cases/checkout/create-transaction.use-case';
import { ProcessCheckoutUseCase } from '../../../application/use-cases/checkout/process-checkout.use-case';
import { TransactionRepository } from '../../../infrastructure/repositories/transaction.repository.impl';
import { ProductRepository } from '../../../infrastructure/repositories/product.repository.impl';
import { generateWompiSignature } from '../../../utils/wompi-signature.util';
import { ConfigService } from '@nestjs/config';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly processCheckoutUseCase: ProcessCheckoutUseCase,
    private readonly transactionRepository: TransactionRepository,
    private readonly productRepository: ProductRepository,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async processCheckout(@Body() createCheckoutDto: CreateCheckoutDto) {
    return this.processCheckoutUseCase.execute(createCheckoutDto);
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createCheckoutSession(@Body() createSessionDto: CreateCheckoutSessionDto) {
    try {
      // 1. Obtener producto
      const product = await this.productRepository.findById(createSessionDto.productId);
      if (!product) {
        return {
          success: false,
          error: 'Producto no encontrado',
        };
      }

      if (product.stock < createSessionDto.quantity) {
        return {
          success: false,
          error: 'Stock insuficiente',
        };
      }

      // 2. Calcular totales
      const baseFeeInCents = 300000; // $3,000.00
      const shippingFeeInCents = 700000; // $7,000.00
      const subtotalInCents = Math.round(Number(product.price) * createSessionDto.quantity * 100);
      const taxInCents = Math.round(subtotalInCents * 0.19); // IVA 19%
      const totalInCents = subtotalInCents + baseFeeInCents + shippingFeeInCents + taxInCents;

      // 3. Generar referencia única
      const reference = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // 4. Generar firma de integridad
      const integritySecret = this.configService.get<string>('WOMPI_INTEGRITY_SECRET') || '';
      const signature = generateWompiSignature({
        reference,
        amountInCents: totalInCents,
        currency: 'COP',
        integritySecret,
      });

      // 5. Obtener llave pública
      const publicKey = this.configService.get<string>('WOMPI_PUBLIC_KEY') || '';

      return {
        success: true,
        data: {
          publicKey,
          currency: 'COP',
          amountInCents: totalInCents,
          reference,
          signature,
          redirectUrl: createSessionDto.redirectUrl || `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'}/transaction/result`,
          shippingAddress: {
            addressLine1: createSessionDto.shippingAddress.addressLine1,
            addressLine2: createSessionDto.shippingAddress.addressLine2,
            country: createSessionDto.shippingAddress.country,
            city: createSessionDto.shippingAddress.city,
            phoneNumber: createSessionDto.shippingAddress.phoneNumber,
            region: createSessionDto.shippingAddress.region,
            name: createSessionDto.shippingAddress.name,
            postalCode: createSessionDto.shippingAddress.postalCode,
          },
          customerData: createSessionDto.customerData || {
            email: createSessionDto.customerEmail,
          },
          taxInCents: {
            vat: taxInCents,
          },
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
          },
          quantity: createSessionDto.quantity,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    try {
      const result = await this.createTransactionUseCase.execute(createTransactionDto);
      return {
        success: true,
        data: {
          order: result.order,
          transaction: result.wompiResponse,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('transactions/:id')
  async getTransaction(@Param('id') id: string) {
    const order = await this.transactionRepository.findById(id);
    if (!order) {
      return {
        success: false,
        error: 'Transacción no encontrada',
      };
    }
    return {
      success: true,
      data: order,
    };
  }

  @Get('transactions/payment/:paymentId')
  async getTransactionByPaymentId(@Param('paymentId') paymentId: string) {
    const order = await this.transactionRepository.findByPaymentId(paymentId);
    if (!order) {
      return {
        success: false,
        error: 'Transacción no encontrada',
      };
    }
    return {
      success: true,
      data: order,
    };
  }
}
