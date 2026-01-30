import { Module } from '@nestjs/common';
import { CatalogController } from './interfaces/rest/controllers/catalog.controller';
import { ProductRepository } from './infrastructure/repositories/product.repository.impl';
import { CreateProductUseCase } from './application/use-cases/catalog/create-product.use-case';
import { GetProductsUseCase } from './application/use-cases/catalog/get-products.use-case';

@Module({
  controllers: [CatalogController],
  providers: [
    ProductRepository,
    CreateProductUseCase,
    GetProductsUseCase,
  ],
  exports: [ProductRepository],
})
export class CatalogModule {}

