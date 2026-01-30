# Script de setup rápido para Docker
Write-Host "🚀 Configurando entorno Docker..." -ForegroundColor Green

# Crear .env del backend si no existe
if (-not (Test-Path "backend\.env")) {
    Write-Host "📝 Creando backend/.env desde .env.example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✅ backend/.env creado. Edita con tus claves reales de Wompi" -ForegroundColor Green
} else {
    Write-Host "✓ backend/.env ya existe" -ForegroundColor Gray
}

# Crear .env del frontend si no existe
if (-not (Test-Path "frontend\.env")) {
    Write-Host "📝 Creando frontend/.env desde .env.example..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "✅ frontend/.env creado" -ForegroundColor Green
} else {
    Write-Host "✓ frontend/.env ya existe" -ForegroundColor Gray
}

Write-Host "`n✨ Setup completado!" -ForegroundColor Green
Write-Host "`n📌 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Edita backend/.env con tus claves reales de Wompi" -ForegroundColor White
Write-Host "2. Ejecuta: docker-compose up --build" -ForegroundColor White

