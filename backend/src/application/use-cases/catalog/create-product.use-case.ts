import { Injectable } from '@nestjs/common';
import { Product } from '@prisma/client';
import { ProductRepository } from '../../../infrastructure/repositories/product.repository.impl';
import type { CreateProductData } from '../../../domain/catalog/repositories/product.repository';

@Injectable()
export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(data: CreateProductData): Promise<Product> {
    // Validar que el SKU no exista si se proporciona
    if (data.sku) {
      const existingProduct = await this.productRepository.findBySku(data.sku);
      if (existingProduct) {
        throw new Error(`Product with SKU ${data.sku} already exists`);
      }
    }

    return this.productRepository.create(data);
  }
}

