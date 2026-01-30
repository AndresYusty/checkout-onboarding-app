import { Product } from '@prisma/client';

export interface IProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  delete(id: string): Promise<void>;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  sku?: string;
  stock: number;
  imageUrl?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  sku?: string;
  stock?: number;
  imageUrl?: string;
  categoryId?: string;
  isActive?: boolean;
}

