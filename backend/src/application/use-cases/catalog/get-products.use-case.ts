import { Injectable, Inject } from '@nestjs/common';
import type { IProductRepository } from '../../../domain/catalog/repositories/product.repository';
import { Product } from '@prisma/client';
import { PRODUCT_REPOSITORY } from '../../../catalog.module';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}

