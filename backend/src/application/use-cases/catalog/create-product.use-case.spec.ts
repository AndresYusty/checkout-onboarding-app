import { Test, TestingModule } from '@nestjs/testing';
import { CreateProductUseCase } from './create-product.use-case';
import { ProductRepository } from '../../../infrastructure/repositories/product.repository.impl';
import { Product, Prisma } from '@prisma/client';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let productRepository: jest.Mocked<ProductRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySku: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ProductRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductUseCase,
        {
          provide: ProductRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateProductUseCase>(CreateProductUseCase);
    productRepository = module.get(ProductRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a product when SKU does not exist', async () => {
    const productData = {
      name: 'Test Product',
      price: 10000,
      stock: 10,
      sku: 'TEST-001',
    };

    (productRepository.findBySku as jest.Mock).mockResolvedValue(null);
    (productRepository.create as jest.Mock).mockResolvedValue({
      id: '1',
      ...productData,
      description: null,
      imageUrl: null,
      categoryId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      price: new Prisma.Decimal(productData.price),
    } as unknown as Product);

    const result = await useCase.execute(productData);

    expect(productRepository.findBySku).toHaveBeenCalledWith('TEST-001');
    expect(productRepository.create).toHaveBeenCalledWith(productData);
    expect(result).toBeDefined();
  });

  it('should throw error when SKU already exists', async () => {
    const productData = {
      name: 'Test Product',
      price: 10000,
      stock: 10,
      sku: 'TEST-001',
    };

    (productRepository.findBySku as jest.Mock).mockResolvedValue({
      id: '1',
      ...productData,
      description: null,
      imageUrl: null,
      categoryId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      price: new Prisma.Decimal(productData.price),
    } as unknown as Product);

    await expect(useCase.execute(productData)).rejects.toThrow(
      'Product with SKU TEST-001 already exists'
    );
  });
});
