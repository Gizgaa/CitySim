# migrate_to_v2.py — безопасное обновление БД CitySim v2

import sqlite3
import os

DB_PATH = "game_data/game.db"

def backup_db():
    """Создаёт резервную копию БД"""
    if os.path.exists(DB_PATH):
        backup_path = DB_PATH.replace(".db", "_backup_v1.db")
        import shutil
        shutil.copy2(DB_PATH, backup_path)
        print(f"✅ Резервная копия сохранена: {backup_path}")

def add_nested_inventory(conn):
    """Добавляет поддержку вложенных инвентарей"""
    cursor = conn.cursor()
    
    # 1. Добавляем поле container_id в items
    cursor.execute("PRAGMA table_info(items)")
    columns = [col[1] for col in cursor.fetchall()]
    if "container_id" not in columns:
        cursor.execute("""
            ALTER TABLE items 
            ADD COLUMN container_id TEXT CHECK (container_id LIKE 'it_%' OR container_id LIKE 'obj_%')
        """)
        print("✅ Добавлено поле container_id в items")

    # 2. Добавляем поле is_container в items (для вложенных предметов)
    if "is_container" not in columns:
        cursor.execute("ALTER TABLE items ADD COLUMN is_container BOOLEAN DEFAULT 0")
        print("✅ Добавлено поле is_container в items")

def create_templates_tables(conn):
    """Создаёт таблицы шаблонов"""
    cursor = conn.cursor()
    
    # Шаблоны персонажей
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS character_templates (
        id TEXT PRIMARY KEY,
        name TEXT,
        surname TEXT,
        gender TEXT CHECK(gender IN ('мужской', 'женский')),
        age_min INTEGER,
        age_max INTEGER,
        role TEXT,
        occupation TEXT,
        personality TEXT,
        health INTEGER DEFAULT 100,
        energy INTEGER DEFAULT 100,
        stress INTEGER DEFAULT 0,
        social INTEGER DEFAULT 50
    )
    """)
    
    # Шаблоны локаций
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS location_templates (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        description TEXT,
        is_always_open BOOLEAN DEFAULT 0,
        lock_type INTEGER DEFAULT 1
    )
    """)
    
    # Шаблоны предметов
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS item_templates (
        id TEXT PRIMARY KEY,
        name TEXT,
        item_type TEXT,
        description TEXT,
        layer INTEGER DEFAULT 0,
        is_dirty BOOLEAN DEFAULT 0,
        is_container BOOLEAN DEFAULT 0
    )
    """)
    
    # Шаблоны объектов
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS object_templates (
        id TEXT PRIMARY KEY,
        name TEXT,
        object_type TEXT,
        description TEXT,
        is_interactable BOOLEAN DEFAULT 1,
        is_container BOOLEAN DEFAULT 0
    )
    """)
    
    print("✅ Таблицы шаблонов созданы")

def create_item_types_table(conn):
    """Создаёт справочник типов предметов"""
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS item_types (
        type_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_wearable BOOLEAN DEFAULT 0,
        default_layer INTEGER DEFAULT 0
    )
    """)
    
    # Заполняем базовыми типами
    default_types = [
        ('clothing', 'Одежда', 'Предметы одежды', True, 1),
        ('key', 'Ключ', 'Открывает замки', False, 0),
        ('stationery', 'Канцелярия', 'Ручки, тетради', False, 0),
        ('container', 'Контейнер', 'Может содержать предметы', True, 0)
    ]
    
    cursor.executemany("""
        INSERT OR IGNORE INTO item_types (type_id, name, description, is_wearable, default_layer)
        VALUES (?, ?, ?, ?, ?)
    """, default_types)
    
    print("✅ Таблица item_types создана и заполнена")

def main():
    print("🚀 Начинаем миграцию CitySim до v2...")
    backup_db()
    
    os.makedirs("game_data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    
    try:
        add_nested_inventory(conn)
        create_templates_tables(conn)
        create_item_types_table(conn)
        conn.commit()
        print("✅ Миграция завершена успешно!")
    except Exception as e:
        print(f"❌ Ошибка миграции: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()