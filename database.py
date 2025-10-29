# database.py
import sqlite3
import os

DB_PATH = "game_data/game.db"

def init_db():
    os.makedirs("game_data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

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

    # Шаблоны предметов
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS item_templates (
        id TEXT PRIMARY KEY CHECK (id LIKE 'tpl_it_%'),
        name TEXT NOT NULL,
        item_type TEXT NOT NULL,
        description TEXT,
        layer INTEGER DEFAULT 0,
        is_dirty BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
    )
    """)

    # Шаблоны объектов
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS object_templates (
        id TEXT PRIMARY KEY CHECK (id LIKE 'tpl_obj_%'),
        name TEXT NOT NULL,
        object_type TEXT NOT NULL,
        description TEXT,
        is_interactable BOOLEAN DEFAULT 1,
        is_container BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
    )
    """)

    # Шаблоны персонажей
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS character_templates (
        id TEXT PRIMARY KEY CHECK (id LIKE 'tpl_pers_%'),
        name TEXT NOT NULL,
        surname TEXT,
        patronymic TEXT,
        age INTEGER,
        gender TEXT,
        role TEXT NOT NULL,
        occupation TEXT,
        personality TEXT,
        current_goal TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    )
    """)

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
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS location_templates (
        id TEXT PRIMARY KEY CHECK (id LIKE 'tpl_loc_%'),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        parent_id TEXT,
        address TEXT,
        owner_id TEXT,
        description TEXT,
        open_time TEXT,
        close_time TEXT,
        is_always_open BOOLEAN DEFAULT 0,
        lock_type INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    )
    """)

    cursor.execute("INSERT OR IGNORE INTO world_state (id) VALUES (1)")
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn