#!/bin/bash

echo "🚀 Запуск ProxyFlow..."

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен"
    exit 1
fi

# Запуск контейнеров
docker-compose up -d

echo "⏳ Ожидание запуска сервисов..."
sleep 10

# Проверка
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "✅ ProxyFlow успешно запущен!"
    echo ""
    echo "📝 API документация: http://localhost:8000/docs"
    echo "🔍 Health check: http://localhost:8000/health"
    echo ""
    echo "📊 Логи: docker-compose logs -f"
else
    echo "❌ Ошибка запуска. Проверьте логи: docker-compose logs"
fi
