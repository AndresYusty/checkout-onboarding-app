import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import {
  ITransactionRepository,
  CreateTransactionData,
} from '../../domain/checkout/repositories/transaction.repository';
import { Order, OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProductById(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
    });
  }

  async create(data: CreateTransactionData): Promise<Order> {
    // Crear usuario si no existe
    let userId = data.userId;
    if (!userId) {
      // Por ahora creamos un usuario temporal, en producción vendría del auth
      const user = await this.prisma.user.create({
        data: {
          email: `temp_${Date.now()}@example.com`,
        },
      });
      userId = user.id;
    }

    // Crear dirección de envío
    const address = await this.prisma.address.create({
      data: {
        userId,
        street: data.shippingAddress.street,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        postalCode: data.shippingAddress.postalCode,
        country: data.shippingAddress.country,
        isDefault: true,
      },
    });

    // Crear orden con items
    const order = await this.prisma.order.create({
      data: {
        orderNumber: data.orderNumber,
        userId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        shippingAddressId: address.id,
        subtotal: data.subtotal,
        shippingFee: data.shippingFee,
        tax: data.tax,
        total: data.total,
        paymentMethod: data.paymentMethod,
        items: {
          create: {
            productId: data.productId,
            quantity: data.quantity,
            price: data.subtotal / data.quantity,
            subtotal: data.subtotal,
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    });

    return order;
  }

  async findById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        user: true,
      },
    });
  }

  async findByPaymentId(paymentId: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { paymentId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        user: true,
      },
    });
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    paymentStatus: PaymentStatus,
    paymentId?: string,
  ): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        paymentStatus,
        ...(paymentId && { paymentId }),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    });
  }

  async updateStock(productId: string, quantity: number): Promise<void> {
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });
  }
}

