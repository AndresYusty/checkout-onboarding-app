import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear categorías
  const categoriaElectronica = await prisma.category.upsert({
    where: { slug: 'electronica' },
    update: {},
    create: {
      name: 'Electrónica',
      slug: 'electronica',
      description: 'Dispositivos y accesorios electrónicos',
      isActive: true,
    },
  });

  const categoriaRopa = await prisma.category.upsert({
    where: { slug: 'ropa' },
    update: {},
    create: {
      name: 'Ropa',
      slug: 'ropa',
      description: 'Ropa y accesorios de moda',
      isActive: true,
    },
  });

  const categoriaHogar = await prisma.category.upsert({
    where: { slug: 'hogar' },
    update: {},
    create: {
      name: 'Hogar',
      slug: 'hogar',
      description: 'Artículos para el hogar',
      isActive: true,
    },
  });

  console.log('✅ Categorías creadas');

  // Crear productos
  const productos = [
    {
      name: 'iPhone 15 Pro',
      description: 'El smartphone más avanzado de Apple con chip A17 Pro',
      price: 3999000,
      sku: 'IPH15PRO-128',
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
      categoryId: categoriaElectronica.id,
      isActive: true,
    },
    {
      name: 'Samsung Galaxy S24',
      description: 'Smartphone Android de última generación',
      price: 3299000,
      sku: 'SGS24-256',
      stock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
      categoryId: categoriaElectronica.id,
      isActive: true,
    },
    {
      name: 'AirPods Pro',
      description: 'Auriculares inalámbricos con cancelación de ruido activa',
      price: 899000,
      sku: 'APPRO-2GEN',
      stock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500',
      categoryId: categoriaElectronica.id,
      isActive: true,
    },
    {
      name: 'Camiseta Básica',
      description: 'Camiseta de algodón 100% en varios colores',
      price: 45000,
      sku: 'CAM-BAS-001',
      stock: 100,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      categoryId: categoriaRopa.id,
      isActive: true,
    },
    {
      name: 'Jeans Clásicos',
      description: 'Pantalón jeans de corte clásico, cómodo y duradero',
      price: 129000,
      sku: 'JEAN-CLS-001',
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
      categoryId: categoriaRopa.id,
      isActive: true,
    },
    {
      name: 'Zapatillas Deportivas',
      description: 'Zapatillas cómodas para uso diario y deporte',
      price: 199000,
      sku: 'ZAP-DEP-001',
      stock: 40,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      categoryId: categoriaRopa.id,
      isActive: true,
    },
    {
      name: 'Lámpara de Escritorio LED',
      description: 'Lámpara LED ajustable para escritorio, luz cálida y fría',
      price: 89000,
      sku: 'LAMP-LED-001',
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500',
      categoryId: categoriaHogar.id,
      isActive: true,
    },
    {
      name: 'Set de Sábanas Algodón',
      description: 'Juego de sábanas de algodón egipcio, incluye funda y fundas de almohada',
      price: 149000,
      sku: 'SAB-ALG-001',
      stock: 35,
      imageUrl: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=500',
      categoryId: categoriaHogar.id,
      isActive: true,
    },
    {
      name: 'MacBook Pro 14"',
      description: 'Laptop profesional con chip M3 Pro, 16GB RAM, 512GB SSD',
      price: 8999000,
      sku: 'MBP14-M3-512',
      stock: 10,
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
      categoryId: categoriaElectronica.id,
      isActive: true,
    },
    {
      name: 'Reloj Inteligente',
      description: 'Smartwatch con monitor de actividad física y notificaciones',
      price: 599000,
      sku: 'REL-SMT-001',
      stock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      categoryId: categoriaElectronica.id,
      isActive: true,
    },
  ];

  for (const producto of productos) {
    await prisma.product.upsert({
      where: { sku: producto.sku },
      update: {},
      create: producto,
    });
  }

  console.log(`✅ ${productos.length} productos creados`);
  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

