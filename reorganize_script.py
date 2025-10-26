#!/usr/bin/env python3
"""
Скрипт для реорганизации структуры frontend проекта ProxyFlow
Запускать из корня проекта: python reorganize_frontend.py
"""

import os
import shutil
from pathlib import Path

def create_directory_structure():
    """Создает новую структуру директорий"""
    
    base_path = Path("frontend/src")
    
    directories = [
        "components/auth",
        "components/dashboard",
        "components/common",
        "pages",
        "services",
        "context",
        "hooks",
        "utils",
    ]
    
    print("📁 Создание новой структуры директорий...")
    for directory in directories:
        dir_path = base_path / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"  ✓ {directory}/")
    
    # Создаем .gitkeep для пустых директорий
    for directory in directories:
        gitkeep = base_path / directory / ".gitkeep"
        gitkeep.touch(exist_ok=True)

def move_existing_files():
    """Перемещает существующие файлы в новую структуру"""
    
    src_path = Path("frontend/src")
    
    print("\n📦 Перемещение существующих файлов...")
    
    # App.jsx → pages/Landing.jsx
    old_app = src_path / "App.jsx"
    new_landing = src_path / "pages" / "Landing.jsx"
    
    if old_app.exists():
        shutil.copy2(old_app, new_landing)
        print(f"  ✓ App.jsx → pages/Landing.jsx")
        
        # Не удаляем старый App.jsx, создадим новый позже
        old_app.rename(src_path / "App.jsx.backup")
        print(f"  ✓ App.jsx → App.jsx.backup (бэкап)")

def create_placeholder_files():
    """Создает файлы-заглушки для новых модулей"""
    
    src_path = Path("frontend/src")
    
    files = {
        "services/api.js": """// API client будет здесь
export const API_BASE_URL = 'http://localhost:8000';
""",
        "context/AuthContext.jsx": """// Auth Context будет здесь
import { createContext } from 'react';
export const AuthContext = createContext();
""",
        "hooks/useAuth.js": """// useAuth hook будет здесь
export function useAuth() {
  return {};
}
""",
        "utils/helpers.js": """// Вспомогательные функции
export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}
""",
    }
    
    print("\n📝 Создание файлов-заглушек...")
    for filepath, content in files.items():
        full_path = src_path / filepath
        with open(full_path, 'w') as f:
            f.write(content.strip() + '\n')
        print(f"  ✓ {filepath}")

def update_package_json():
    """Показывает какие зависимости нужно установить"""
    
    print("\n📦 Необходимые зависимости для установки:")
    print("""
  cd frontend
  npm install react-router-dom
  
  Это добавит:
  - react-router-dom@^6.20.0  (для роутинга)
  
  Все остальное уже есть (React, Tailwind, Lucide)
""")

def create_instructions():
    """Создает файл с инструкциями"""
    
    instructions = """
# 🔄 Миграция завершена!

## Что было сделано:

1. ✅ Создана новая структура директорий
2. ✅ App.jsx сохранен как pages/Landing.jsx
3. ✅ Старый App.jsx переименован в App.jsx.backup
4. ✅ Созданы файлы-заглушки для сервисов

## Структура проекта сейчас:

```
frontend/src/
├── components/
│   ├── auth/              # Login, Register формы (скоро)
│   ├── dashboard/         # Dashboard компоненты (скоро)
│   └── common/            # Button, Card, Input (скоро)
├── pages/
│   └── Landing.jsx        # Ваш текущий лендинг
├── services/
│   └── api.js            # API client (заглушка)
├── context/
│   └── AuthContext.jsx   # Auth Context (заглушка)
├── hooks/
│   └── useAuth.js        # Auth hook (заглушка)
├── utils/
│   └── helpers.js        # Helpers (заглушка)
├── App.jsx               # НУЖНО СОЗДАТЬ (main router)
├── main.jsx              # Уже есть
└── index.css             # Уже есть
```

## Следующие шаги:

### 1. Установить зависимости
```bash
cd frontend
npm install react-router-dom
```

### 2. Дождаться новых артефактов:
- App.jsx (router)
- services/api.js (полный API client)
- context/AuthContext.jsx (auth state management)
- pages/Login.jsx
- pages/Register.jsx
- pages/Dashboard.jsx
- components/common/* (UI компоненты)

### 3. После получения артефактов:
- Скопировать их в соответствующие директории
- Проверить что все работает: `npm run dev`

## Важно:
- Старый App.jsx сохранен как App.jsx.backup
- Можете вернуться к нему в любой момент
- Новый App.jsx будет с React Router
"""
    
    with open("frontend/MIGRATION_COMPLETE.md", 'w') as f:
        f.write(instructions.strip())
    
    print("\n✅ Инструкции сохранены в frontend/MIGRATION_COMPLETE.md")

def main():
    print("=" * 60)
    print("🔄 ProxyFlow Frontend Reorganization")
    print("=" * 60)
    
    # Проверяем что мы в правильной директории
    if not Path("frontend/src").exists():
        print("❌ Ошибка: Запустите скрипт из корня проекта!")
        print("   Текущая директория должна содержать frontend/src/")
        return
    
    try:
        create_directory_structure()
        move_existing_files()
        create_placeholder_files()
        create_instructions()
        update_package_json()
        
        print("\n" + "=" * 60)
        print("✅ Реорганизация завершена успешно!")
        print("=" * 60)
        print("\n📖 Читайте frontend/MIGRATION_COMPLETE.md для следующих шагов")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        print("Восстановите из бэкапа если что-то пошло не так")

if __name__ == "__main__":
    main()
