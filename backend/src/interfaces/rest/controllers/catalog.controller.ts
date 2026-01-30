import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CreateProductUseCase } from '../../../application/use-cases/catalog/create-product.use-case';
import { GetProductsUseCase } from '../../../application/use-cases/catalog/get-products.use-case';
import type { IProductRepository } from '../../../domain/catalog/repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../../../catalog.module';

@Controller('catalog/products')
export class CatalogController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductsUseCase: GetProductsUseCase,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto) {
    return this.createProductUseCase.execute(createProductDto);
  }

  @Get()
  async findAll() {
    return this.getProductsUseCase.execute();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productRepository.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productRepository.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.productRepository.delete(id);
  }
}

