import { Module } from '@nestjs/common';
import { CatalogController } from './interfaces/rest/controllers/catalog.controller';
import { ProductRepository } from './infrastructure/repositories/product.repository.impl';
import { CreateProductUseCase } from './application/use-cases/catalog/create-product.use-case';
import { GetProductsUseCase } from './application/use-cases/catalog/get-products.use-case';
import type { IProductRepository } from './domain/catalog/repositories/product.repository';

// Token para inyección de dependencias
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

@Module({
  controllers: [CatalogController],
  providers: [
    ProductRepository,
    {
      provide: PRODUCT_REPOSITORY,
      useExisting: ProductRepository,
    },
    CreateProductUseCase,
    GetProductsUseCase,
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class CatalogModule {}

