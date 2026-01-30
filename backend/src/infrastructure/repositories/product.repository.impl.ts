import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import {
  IProductRepository,
  CreateProductData,
  UpdateProductData,
} from '../../domain/catalog/repositories/product.repository';
import { Product } from '@prisma/client';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { sku },
      include: { category: true },
    });
  }

  async create(data: CreateProductData): Promise<Product> {
    return this.prisma.product.create({
      data,
      include: { category: true },
    });
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }
}

