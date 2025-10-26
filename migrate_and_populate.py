# migrate_and_populate.py
import sqlite3
import os
import shutil
from datetime import datetime

OLD_DB = "game_data/game.db"
NEW_DB = "game_data/game_new.db"
BACKUP_DB = "game_data/game_backup.db"

def create_new_schema(conn):
    cursor = conn.cursor()

    # Таблицы (в точности как в исправленном database.py)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS location_types (
        type_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        default_open_time TEXT,
        default_close_time TEXT,
        is_indoor BOOLEAN
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY CHECK (id LIKE 'loc_%'),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        parent_id TEXT REFERENCES locations(id),
        address TEXT,
        owner_id TEXT,
        description TEXT,
        open_time TEXT,
        close_time TEXT,
        is_always_open BOOLEAN DEFAULT 0,
        is_locked BOOLEAN DEFAULT 0,
        lock_type INTEGER DEFAULT 1,
        required_key_id TEXT,
        capacity INTEGER DEFAULT 100,
        light_level REAL DEFAULT 1.0,
        temperature REAL DEFAULT 22.0,
        cleanliness REAL DEFAULT 1.0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS location_connections (
        from_location_id TEXT NOT NULL CHECK (from_location_id LIKE 'loc_%'),
        to_location_id TEXT NOT NULL CHECK (to_location_id LIKE 'loc_%'),
        connection_type TEXT DEFAULT 'door',
        description TEXT,
        is_bidirectional BOOLEAN DEFAULT 1,
        requires_key_id TEXT,
        requires_permission TEXT,
        is_blocked BOOLEAN DEFAULT 0,
        FOREIGN KEY (from_location_id) REFERENCES locations(id),
        FOREIGN KEY (to_location_id) REFERENCES locations(id),
        PRIMARY KEY (from_location_id, to_location_id)
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY CHECK (id LIKE 'pers_%'),
        name TEXT NOT NULL,
        surname TEXT,
        patronymic TEXT,
        age INTEGER,
        gender TEXT,
        role TEXT NOT NULL,
        location_id TEXT NOT NULL CHECK (location_id LIKE 'loc_%'),
        occupation TEXT,
        personality TEXT,
        current_goal TEXT,
        health INTEGER DEFAULT 100,
        energy INTEGER DEFAULT 100,
        stress INTEGER DEFAULT 0,
        social INTEGER DEFAULT 50,
        FOREIGN KEY (location_id) REFERENCES locations(id)
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS location_objects (
        id TEXT PRIMARY KEY CHECK (id LIKE 'obj_%'),
        location_id TEXT NOT NULL CHECK (location_id LIKE 'loc_%'),
        name TEXT NOT NULL,
        object_type TEXT NOT NULL,
        description TEXT,
        is_interactable BOOLEAN DEFAULT 1,
        is_container BOOLEAN DEFAULT 0,
        capacity INTEGER DEFAULT 10,
        current_fill INTEGER DEFAULT 0,
        owner_id TEXT,
        FOREIGN KEY (location_id) REFERENCES locations(id)
    )""")

    # ИСПРАВЛЕНО: добавлены worn_by_id, layer, is_dirty
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY CHECK (id LIKE 'it_%'),
        item_type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        current_location_id TEXT CHECK (current_location_id LIKE 'loc_%'),
        current_object_id TEXT CHECK (current_object_id LIKE 'obj_%'),
        current_holder_id TEXT CHECK (current_holder_id LIKE 'pers_%'),
        worn_by_id TEXT CHECK (worn_by_id LIKE 'pers_%'),
        layer INTEGER DEFAULT 0,
        is_dirty BOOLEAN DEFAULT 0,
        dropped_by TEXT CHECK (dropped_by LIKE 'pers_%'),
        dropped_at TEXT DEFAULT (datetime('now'))
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS location_effects (
        id TEXT PRIMARY KEY CHECK (id LIKE 'eff_%'),
        target_location_id TEXT CHECK (target_location_id LIKE 'loc_%'),
        target_object_id TEXT CHECK (target_object_id LIKE 'obj_%'),
        effect_type TEXT NOT NULL,
        intensity REAL DEFAULT 1.0,
        duration_seconds INTEGER,
        applied_by TEXT CHECK (applied_by LIKE 'pers_%'),
        applied_at TEXT DEFAULT (datetime('now')),
        expires_at TEXT
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS world_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_timestamp TEXT NOT NULL DEFAULT '2025-10-26T08:00:00',
        weather TEXT NOT NULL DEFAULT 'пасмурно',
        temperature REAL DEFAULT 12.0,
        season TEXT NOT NULL DEFAULT 'осень',
        day_of_week TEXT NOT NULL DEFAULT 'воскресенье'
    )""")

    # Инициализация мира
    cursor.execute("INSERT OR IGNORE INTO world_state (id) VALUES (1)")

    conn.commit()

def copy_table_data(old_conn, new_conn, table_name, columns=None):
    old_cursor = old_conn.cursor()
    new_cursor = new_conn.cursor()

    old_cursor.execute(f"PRAGMA table_info({table_name})")
    old_cols = [row[1] for row in old_cursor.fetchall()]
    new_cursor.execute(f"PRAGMA table_info({table_name})")
    new_cols = [row[1] for row in new_cursor.fetchall()]

    # Определяем общие столбцы
    common_cols = [col for col in old_cols if col in new_cols]
    if columns:
        common_cols = [col for col in common_cols if col in columns]

    if not common_cols:
        print(f"⚠️  Нет общих столбцов для таблицы {table_name}")
        return

    old_cursor.execute(f"SELECT {', '.join(common_cols)} FROM {table_name}")
    rows = old_cursor.fetchall()

    if rows:
        placeholders = ', '.join(['?' for _ in common_cols])
        new_cursor.executemany(
            f"INSERT INTO {table_name} ({', '.join(common_cols)}) VALUES ({placeholders})",
            rows
        )
        new_conn.commit()
        print(f"✅ Скопировано {len(rows)} записей в {table_name}")
    else:
        print(f"ℹ️  Таблица {table_name} пуста")

def add_test_items(new_conn):
    cursor = new_conn.cursor()

    # Найдём игрока
    cursor.execute("SELECT id FROM characters WHERE role = 'player' LIMIT 1")
    player_row = cursor.fetchone()
    player_id = player_row[0] if player_row else None

    # Найдём локацию школы
    cursor.execute("SELECT id FROM locations WHERE id LIKE 'loc_school_45%' LIMIT 1")
    loc_row = cursor.fetchone()
    school_id = loc_row[0] if loc_row else "loc_school_45"

    test_items = [
        # Одежда
        ("it_uniform_skirt_01", "clothing", "Школьная юбка", "Чёрная школьная юбка", None, None, player_id, player_id, 1, False),
        ("it_uniform_shirt_01", "clothing", "Школьная рубашка", "Белая рубашка с воротником", None, None, player_id, player_id, 2, False),
        ("it_sneakers_01", "clothing", "Кроссовки", "Удобные чёрные кроссовки", None, None, player_id, player_id, 0, True),
        # Предметы
        ("it_notebook_01", "item", "Тетрадь по математике", "В клетку, исписана наполовину", school_id, None, player_id, None, 0, False),
        ("it_pencil_01", "item", "Карандаш", "Простой карандаш с ластиком", school_id, None, player_id, None, 0, False),
        ("it_key_class_1_1", "key", "Ключ от кабинета 1-1", "Металлический ключ", None, None, player_id, None, 0, False),
    ]

    for item in test_items:
        cursor.execute("""
            INSERT OR IGNORE INTO items (
                id, item_type, name, description,
                current_location_id, current_object_id, current_holder_id,
                worn_by_id, layer, is_dirty
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, item)

    new_conn.commit()
    print(f"✅ Добавлено {len(test_items)} тестовых предметов")

def main():
    print("🚀 Запуск миграции и наполнения БД...")

    if not os.path.exists(OLD_DB):
        print(f"❌ Старая БД не найдена: {OLD_DB}")
        return

    # Резервная копия
    print("💾 Создаём резервную копию...")
    shutil.copy2(OLD_DB, BACKUP_DB)
    print(f"✅ Резервная копия сохранена: {BACKUP_DB}")

    # Подключаемся к БД
    old_conn = sqlite3.connect(OLD_DB)
    new_conn = sqlite3.connect(NEW_DB)

    # Создаём новую схему
    print("🆕 Создаём новую схему...")
    create_new_schema(new_conn)

    # Копируем данные
    tables = ["location_types", "locations", "location_connections", "characters", "location_objects", "location_effects"]
    for table in tables:
        copy_table_data(old_conn, new_conn, table)

    # Для items — копируем только существующие столбцы
    copy_table_data(old_conn, new_conn, "items", 
                    columns=["id", "item_type", "name", "description", 
                             "current_location_id", "current_object_id", "current_holder_id", "dropped_by"])

    # Добавляем тестовые предметы
    add_test_items(new_conn)

    # Закрываем соединения
    old_conn.close()
    new_conn.close()

    # Заменяем старую БД новой
    print("🔄 Заменяем старую БД новой...")
    os.replace(NEW_DB, OLD_DB)
    print("✅ Миграция завершена! БД обновлена.")

if __name__ == "__main__":
    main()