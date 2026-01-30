import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

async function setupDatabase() {
  console.log('🚀 Iniciando configuración de la base de datos...\n');

  // 1. Leer el archivo .env
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: No se encontró el archivo .env');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="(.+)"/);
  
  if (!dbUrlMatch) {
    console.error('❌ Error: No se encontró DATABASE_URL en el archivo .env');
    process.exit(1);
  }

  const databaseUrl = dbUrlMatch[1];
  console.log('✅ DATABASE_URL encontrado\n');

  // 2. Parsear la URL de la base de datos
  const url = new URL(databaseUrl);
  const dbName = url.pathname.slice(1).split('?')[0]; // Remover el '/' inicial y los query params
  
  // Crear URL para conectarse a la BD 'postgres' (para crear la nueva BD)
  const adminUrl = `${url.protocol}//${url.username}:${url.password}@${url.hostname}:${url.port}/postgres`;

  console.log(`📦 Base de datos objetivo: ${dbName}`);
  console.log(`🔌 Conectando a PostgreSQL...\n`);

  // 3. Conectar y crear la base de datos si no existe
  const adminClient = new Client({ connectionString: adminUrl });

  try {
    await adminClient.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // Verificar si la base de datos existe
    const dbCheckResult = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (dbCheckResult.rows.length === 0) {
      console.log(`📝 Creando base de datos "${dbName}"...`);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Base de datos "${dbName}" creada exitosamente\n`);
    } else {
      console.log(`ℹ️  La base de datos "${dbName}" ya existe\n`);
    }

    await adminClient.end();
  } catch (error: any) {
    console.error('❌ Error al crear la base de datos:', error.message);
    await adminClient.end().catch(() => {});
    process.exit(1);
  }

  // 4. Generar el cliente de Prisma
  console.log('🔧 Generando cliente de Prisma...');
  try {
    execSync('npx prisma generate', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });
    console.log('✅ Cliente de Prisma generado\n');
  } catch (error) {
    console.error('❌ Error al generar el cliente de Prisma');
    process.exit(1);
  }

  // 5. Ejecutar migraciones
  console.log('🔄 Ejecutando migraciones...');
  try {
    // Verificar si ya existen migraciones
    const migrationsPath = path.join(__dirname, '..', 'prisma', 'migrations');
    const hasMigrations = fs.existsSync(migrationsPath) && 
      fs.readdirSync(migrationsPath).length > 0;

    if (hasMigrations) {
      console.log('ℹ️  Migraciones existentes encontradas, aplicando...');
      execSync('npx prisma migrate deploy', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
      });
    } else {
      console.log('📝 Creando migración inicial...');
      execSync('npx prisma migrate dev --name init', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
      });
    }
    console.log('✅ Migraciones ejecutadas exitosamente\n');
  } catch (error) {
    console.error('❌ Error al ejecutar las migraciones');
    process.exit(1);
  }

  console.log('🎉 ¡Configuración completada exitosamente!');
  console.log('\n📌 Próximos pasos:');
  console.log('   npm run start:dev  - Para iniciar el servidor de desarrollo\n');
}

setupDatabase().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

