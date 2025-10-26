# import_school_full.py
import sqlite3
import os
import re

DB_PATH = "game_data/game.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    return conn

def sanitize_name(name: str) -> str:
    """Преобразует название в безопасный ID-суффикс"""
    name = re.sub(r'[^a-z0-9а-яё\s\-]', '', name.lower())
    name = re.sub(r'\s+', '_', name)
    name = re.sub(r'-', '_', name)
    return name

def create_location(conn, loc_id: str, name: str, loc_type: str, parent_id: str = None,
                   address: str = None, owner_id: str = "pers_director_aleksey",
                   open_time: str = "08:00", close_time: str = "20:00",
                   is_always_open: bool = False, lock_type: int = 1):
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT OR IGNORE INTO locations (
            id, name, type, parent_id, address, owner_id,
            open_time, close_time, is_always_open, lock_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (loc_id, name, loc_type, parent_id, address, owner_id,
              open_time, close_time, is_always_open, lock_type))
    except Exception as e:
        print(f"Ошибка при создании локации {loc_id}: {e}")

def create_connection(conn, from_id: str, to_id: str, conn_type: str = "door", desc: str = ""):
    if not from_id or not to_id:
        return
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT OR IGNORE INTO location_connections (
            from_location_id, to_location_id, connection_type, description, is_bidirectional
        ) VALUES (?, ?, ?, ?, 1)
        """, (from_id, to_id, conn_type, desc))
    except Exception as e:
        print(f"Ошибка при создании связи {from_id} → {to_id}: {e}")

def main():
    if not os.path.exists("game_data"):
        os.makedirs("game_data")
    
    conn = get_db_connection()
    
    # === 1. Улица и территория школы ===
    street_id = "loc_street_lenina_school45"
    create_location(conn, street_id, "Улица Ленина (у школы №45)", "street", is_always_open=True)

    porch_id = "loc_main_porch"
    create_location(conn, porch_id, "Главное крыльцо", "porch", parent_id=street_id)

    football_id = "loc_football_field"
    create_location(conn, football_id, "Футбольное поле", "playground", parent_id=street_id)

    # === 2. Школа и центральная часть ===
    school_id = "loc_school_45"
    create_location(conn, school_id, "Школа №45", "school", address="ул. Ленина, 45")

    center_id = "loc_school_45_center"
    create_location(conn, center_id, "Центральная часть", "hallway", parent_id=school_id)

    vestibule_id = "loc_vestibule"
    create_location(conn, vestibule_id, "Вестибюль", "hallway", parent_id=center_id)

    cafeteria_id = "loc_cafeteria"
    create_location(conn, cafeteria_id, "Столовая", "dining", parent_id=center_id)

    kitchen_id = "loc_kitchen"
    create_location(conn, kitchen_id, "Кухня", "kitchen", parent_id=cafeteria_id)

    auditorium_id = "loc_auditorium"
    create_location(conn, auditorium_id, "Актовый зал", "auditorium", parent_id=center_id)

    balcony_id = "loc_balcony"
    create_location(conn, balcony_id, "Балкон актового зала", "balcony", parent_id=auditorium_id)

    roof_stairs_id = "loc_roof_stairs_from_balcony"
    create_location(conn, roof_stairs_id, "Лестница на крышу (от балкона)", "staircase", parent_id=balcony_id)

    gym_junior_id = "loc_gym_junior"
    gym_senior_id = "loc_gym_senior"
    create_location(conn, gym_junior_id, "Спортзал для младших", "gym", parent_id=center_id)
    create_location(conn, gym_senior_id, "Спортзал для старших", "gym", parent_id=center_id)

    music_id = "loc_music_room"
    create_location(conn, music_id, "Кабинет музыки", "classroom", parent_id=center_id)

    craft_junior_id = "loc_craft_junior"
    craft_senior_id = "loc_craft_senior"
    create_location(conn, craft_junior_id, "Кабинет труда (младшее)", "classroom", parent_id=center_id)
    create_location(conn, craft_senior_id, "Кабинет труда (старшее)", "classroom", parent_id=center_id)

    library_id = "loc_library"
    create_location(conn, library_id, "Библиотека", "library", parent_id=center_id)

    clinic_id = "loc_clinic"
    psychologist_id = "loc_psychologist"
    create_location(conn, clinic_id, "Медпункт", "medical", parent_id=center_id)
    create_location(conn, psychologist_id, "Кабинет психолога", "office", parent_id=center_id)

    director_id = "loc_office_director"
    secretary_id = "loc_office_secretary"
    create_location(conn, director_id, "Кабинет директора", "office", parent_id=center_id)
    create_location(conn, secretary_id, "Кабинет секретаря", "office", parent_id=center_id)

    # === 3. Младшее крыло ===
    junior_wing_id = "loc_junior_wing"
    create_location(conn, junior_wing_id, "Младшее крыло", "wing", parent_id=school_id)

    # Этажи младшего крыла
    for floor in [1, 2, 3]:
        floor_id = f"loc_junior_wing_{floor}f"
        create_location(conn, floor_id, f"Этаж младшего крыла {floor}", "floor", parent_id=junior_wing_id)

        # Кабинеты
        room_count = 8 if floor > 1 else 8  # на 1 этаже 8, но 4 — для мальчиков (всё равно создаём)
        for room in range(1, room_count + 1):
            room_name = f"Кабинет м{floor}-{room}"
            room_id = f"loc_class_junior_{floor}_{room}"
            create_location(conn, room_id, room_name, "classroom", parent_id=floor_id)

        # Туалеты
        toilet_w_id = f"loc_toilet_w_junior_{floor}"
        toilet_m_id = f"loc_toilet_m_junior_{floor}"
        create_location(conn, toilet_w_id, f"Женский туалет младшее {floor}", "toilet", parent_id=floor_id)
        create_location(conn, toilet_m_id, f"Мужской туалет младшее {floor}", "toilet", parent_id=floor_id)

        # Раздевалки
        changing_1_id = f"loc_changing_junior_{floor}_1"
        changing_2_id = f"loc_changing_junior_{floor}_2"
        create_location(conn, changing_1_id, f"Раздевалка младшее {floor}-1", "changing_room", parent_id=floor_id)
        create_location(conn, changing_2_id, f"Раздевалка младшее {floor}-2", "changing_room", parent_id=floor_id)

        # Пожарные лестницы
        fire_stair_1_id = f"loc_fire_stair_junior_{floor}_1"
        fire_stair_2_id = f"loc_fire_stair_junior_{floor}_2"
        create_location(conn, fire_stair_1_id, f"Пожарная лестница младшее {floor}-1", "staircase", parent_id=floor_id)
        create_location(conn, fire_stair_2_id, f"Пожарная лестница младшее {floor}-2", "staircase", parent_id=floor_id)

    # === 4. Старшее крыло ===
    senior_wing_id = "loc_senior_wing"
    create_location(conn, senior_wing_id, "Старшее крыло", "wing", parent_id=school_id)

    for floor in [1, 2, 3]:
        floor_id = f"loc_senior_wing_{floor}f"
        create_location(conn, floor_id, f"Этаж старшего крыла {floor}", "floor", parent_id=senior_wing_id)

        room_count = 9 if floor != 2 else 8
        for room in range(1, room_count + 1):
            room_name = f"Кабинет {floor}-{room}"
            room_id = f"loc_class_senior_{floor}_{room}"
            create_location(conn, room_id, room_name, "classroom", parent_id=floor_id)

        # Туалеты
        toilet_w_id = f"loc_toilet_w_senior_{floor}"
        toilet_m_id = f"loc_toilet_m_senior_{floor}"
        create_location(conn, toilet_w_id, f"Женский туалет старшее {floor}", "toilet", parent_id=floor_id)
        create_location(conn, toilet_m_id, f"Мужской туалет старшее {floor}", "toilet", parent_id=floor_id)

        # Раздевалки (только на 2 этаже)
        if floor == 2:
            changing_1_id = f"loc_changing_senior_{floor}_1"
            changing_2_id = f"loc_changing_senior_{floor}_2"
            create_location(conn, changing_1_id, f"Раздевалка старшее {floor}-1", "changing_room", parent_id=floor_id)
            create_location(conn, changing_2_id, f"Раздевалка старшее {floor}-2", "changing_room", parent_id=floor_id)

        # Пожарные лестницы
        fire_stair_1_id = f"loc_fire_stair_senior_{floor}_1"
        fire_stair_2_id = f"loc_fire_stair_senior_{floor}_2"
        create_location(conn, fire_stair_1_id, f"Пожарная лестница старшее {floor}-1", "staircase", parent_id=floor_id)
        create_location(conn, fire_stair_2_id, f"Пожарная лестница старшее {floor}-2", "staircase", parent_id=floor_id)

        # Подсобки для уборщиц
        storage_1_id = f"loc_storage_cleaner_senior_{floor}_1"
        storage_2_id = f"loc_storage_cleaner_senior_{floor}_2"
        create_location(conn, storage_1_id, f"Подсобка уборщицы {floor}-1", "storage", parent_id=floor_id)
        create_location(conn, storage_2_id, f"Подсобка уборщицы {floor}-2", "storage", parent_id=floor_id)

    # === 5. Переходы ===
    # Улица ↔ Крыльцо
    create_connection(conn, street_id, porch_id, "path", "Дорожка к крыльцу")
    # Крыльцо ↔ Вестибюль
    create_connection(conn, porch_id, vestibule_id, "door", "Главный вход")
    # Вестибюль ↔ Центр
    create_connection(conn, vestibule_id, center_id, "hallway", "Центральный коридор")
    # Центр ↔ Младшее крыло
    create_connection(conn, center_id, junior_wing_id, "corridor", "Левый коридор")
    # Центр ↔ Старшее крыло
    create_connection(conn, center_id, senior_wing_id, "corridor", "Правый коридор")
    # Вестибюль ↔ Столовая
    create_connection(conn, vestibule_id, cafeteria_id, "door", "Вход в столовую")
    # Столовая ↔ Кухня
    create_connection(conn, cafeteria_id, kitchen_id, "door", "Проход на кухню")
    # Вестибюль ↔ Актовый зал
    create_connection(conn, vestibule_id, auditorium_id, "door", "Вход в актовый зал")
    # Актовый зал ↔ Спортзалы
    create_connection(conn, auditorium_id, gym_junior_id, "door", "Дверь в спортзал младших")
    create_connection(conn, auditorium_id, gym_senior_id, "door", "Дверь в спортзал старших")
    # Актовый зал ↔ Балкон
    create_connection(conn, auditorium_id, balcony_id, "door", "Выход на балкон")
    # Балкон ↔ Лестница на крышу
    create_connection(conn, balcony_id, roof_stairs_id, "staircase", "Лестница на крышу")
    # Центр ↔ Библиотека, Медпункт, Психолог
    create_connection(conn, center_id, library_id, "door", "Вход в библиотеку")
    create_connection(conn, center_id, clinic_id, "door", "Вход в медпункт")
    create_connection(conn, center_id, psychologist_id, "door", "Вход к психологу")
    # Центр ↔ Кабинеты директора и секретаря
    create_connection(conn, center_id, director_id, "door", "Кабинет директора")
    create_connection(conn, center_id, secretary_id, "door", "Кабинет секретаря")

    conn.commit()
    conn.close()
    print("✅ Полная структура школы №45 импортирована!")

if __name__ == "__main__":
    main()