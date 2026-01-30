import { Injectable, Inject } from '@nestjs/common';
import type { IProductRepository, CreateProductData } from '../../../domain/catalog/repositories/product.repository';
import { Product } from '@prisma/client';
import { PRODUCT_REPOSITORY } from '../../../catalog.module';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
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

