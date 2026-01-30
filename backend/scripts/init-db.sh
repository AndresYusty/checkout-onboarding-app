#!/bin/bash
set -e

echo "Initializing database..."

# Este script se ejecuta automáticamente cuando el contenedor de PostgreSQL se crea por primera vez
# Si ya existe el volumen con datos, este script no se ejecutará

echo "Database initialization complete!"

