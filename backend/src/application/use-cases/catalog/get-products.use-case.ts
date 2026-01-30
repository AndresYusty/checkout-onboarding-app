import { Injectable } from '@nestjs/common';
import { Product } from '@prisma/client';
import { ProductRepository } from '../../../infrastructure/repositories/product.repository.impl';

@Injectable()
export class GetProductsUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}

