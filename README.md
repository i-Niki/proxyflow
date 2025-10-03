# ProxyFlow - Premium Proxy Service

## 🚀 Быстрый старт

### Запуск с Docker

```bash
# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### API доступен на:
- Документация: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## 📖 API Примеры

### Регистрация
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "securepass123"
  }'
```

### Вход
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

### Получить прокси
```bash
curl -X POST "http://localhost:8000/proxy/get" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "proxy_type": "residential",
    "country": "US",
    "quantity": 5
  }'
```

## 🛠️ Управление

### Добавить прокси в базу

Подключитесь к PostgreSQL:
```bash
docker-compose exec postgres psql -U proxyuser -d proxyflow
```

Добавьте прокси:
```sql
INSERT INTO proxy_pools (proxy_type, ip_address, port, country, is_active, success_rate)
VALUES ('residential', '192.168.1.100', 8080, 'US', true, 100.0);
```

### Остановка сервисов
```bash
docker-compose down
```

### Очистка данных
```bash
docker-compose down -v
```

## 📊 Структура проекта

```
proxyflow/
├── main.py              # FastAPI приложение
├── requirements.txt     # Python зависимости
├── docker-compose.yml   # Docker конфигурация
├── Dockerfile          # Docker образ
├── .env                # Переменные окружения
└── README.md           # Документация
```

## 🔐 Безопасность

- Измените `SECRET_KEY` в .env
- Используйте сильные пароли для БД
- Включите HTTPS в production
- Регулярно обновляйте зависимости

## 📝 Лицензия

MIT License
