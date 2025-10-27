# CitySim.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import logging
import requests
import random
import string
import time
from database import init_db, get_db_connection

init_db()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CitySim AI Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# === МОДЕЛИ ===

class CharacterCreate(BaseModel):
    name: str
    surname: str
    patronymic: Optional[str] = None
    age: int
    gender: str
    role: str
    location_id: str
    occupation: Optional[str] = None
    personality: Optional[str] = None
    current_goal: Optional[str] = None

class CharacterResponse(BaseModel):
    id: str
    name: str
    surname: str
    patronymic: Optional[str]
    age: int
    gender: str
    role: str
    location_id: str
    occupation: Optional[str]
    personality: Optional[str]
    current_goal: Optional[str]
    health: int
    energy: int
    stress: int
    social: int

class LocationCreate(BaseModel):
    name: str
    type: str
    parent_id: Optional[str] = None
    address: Optional[str] = None
    owner_id: Optional[str] = None
    description: Optional[str] = None
    open_time: Optional[str] = None
    close_time: Optional[str] = None
    is_always_open: bool = False
    lock_type: int = 1

class LocationResponse(BaseModel):
    id: str
    name: str
    type: str
    parent_id: Optional[str]
    address: Optional[str]
    owner_id: Optional[str]
    description: Optional[str]
    open_time: Optional[str]
    close_time: Optional[str]
    is_always_open: bool
    is_locked: bool
    lock_type: int
    capacity: int
    light_level: float
    temperature: float
    cleanliness: float

class ItemCreate(BaseModel):
    name: str
    item_type: str
    description: Optional[str] = None
    layer: Optional[int] = 0
    is_dirty: Optional[bool] = False

class ItemResponse(BaseModel):
    id: str
    item_type: str
    name: str
    description: Optional[str]
    current_location_id: Optional[str]
    current_object_id: Optional[str]
    current_holder_id: Optional[str]
    worn_by_id: Optional[str]
    layer: int
    is_dirty: bool

class ObjectCreate(BaseModel):
    name: str
    object_type: str
    description: Optional[str] = None
    is_interactable: Optional[bool] = True
    is_container: Optional[bool] = False

class ObjectResponse(BaseModel):
    id: str
    name: str
    object_type: str
    description: Optional[str]
    is_interactable: bool
    is_container: bool

class WorldStateResponse(BaseModel):
    current_timestamp: str
    weather: str
    temperature: float
    season: str
    day_of_week: str

class WorldStateUpdate(BaseModel):
    current_timestamp: Optional[str] = None
    weather: Optional[str] = None
    temperature: Optional[float] = None
    season: Optional[str] = None
    day_of_week: Optional[str] = None

class ChatRequest(BaseModel):
    npc_id: str
    player_message: str

class WearRequest(BaseModel):
    wear: bool

# === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

def generate_id(prefix: str) -> str:
    """Генерирует уникальный ID вида: prefix_1761480000000_a3b9c2d1"""
    timestamp = int(time.time() * 1000)
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{prefix}_{timestamp}_{suffix}"

def get_character_by_id(char_id: str) -> CharacterResponse:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM characters WHERE id = ?", (char_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Character not found")
    return CharacterResponse(**dict(row))

def get_location_by_id(loc_id: str) -> LocationResponse:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM locations WHERE id = ?", (loc_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Location not found")
    return LocationResponse(**dict(row))

# === ЭНДПОИНТЫ ===

@app.post("/character", response_model=CharacterResponse)
def create_character( CharacterCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    char_id = generate_id("pers")
    try:
        cursor.execute("""
        INSERT INTO characters (
            id, name, surname, patronymic, age, gender, role, location_id,
            occupation, personality, current_goal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            char_id, data.name, data.surname, data.patronymic, data.age,
            data.gender, data.role, data.location_id, data.occupation,
            data.personality, data.current_goal
        ))
        conn.commit()
        conn.close()
        return get_character_by_id(char_id)
    except Exception as e:
        conn.close()
        logger.error(f"Create character error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/character/{char_id}", response_model=CharacterResponse)
def get_character(char_id: str):
    return get_character_by_id(char_id)

@app.get("/characters", response_model=List[CharacterResponse])
def list_characters(location_id: Optional[str] = Query(None)):
    conn = get_db_connection()
    cursor = conn.cursor()
    if location_id:
        cursor.execute("SELECT * FROM characters WHERE location_id = ?", (location_id,))
    else:
        cursor.execute("SELECT * FROM characters")
    rows = cursor.fetchall()
    conn.close()
    return [CharacterResponse(**dict(row)) for row in rows]

@app.get("/player", response_model=CharacterResponse)
def get_player():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM characters WHERE role = 'player' LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Player not found")
    return CharacterResponse(**dict(row))

@app.post("/player/location/{new_location_id}")
def update_player_location(new_location_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        player = get_player()
        cursor.execute("UPDATE characters SET location_id = ? WHERE id = ?", 
                      (new_location_id, player.id))
        conn.commit()
        conn.close()
        return {"status": "location updated"}
    except Exception as e:
        conn.close()
        logger.error(f"Update player location error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/player/inventory", response_model=List[ItemResponse])
def get_player_inventory():
    player = get_player()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT *,
               CASE WHEN worn_by_id IS NOT NULL THEN 1 ELSE 0 END AS is_worn
        FROM items
        WHERE current_holder_id = ? OR worn_by_id = ?
    """, (player.id, player.id))
    rows = cursor.fetchall()
    conn.close()
    return [ItemResponse(**dict(row)) for row in rows]

@app.post("/location", response_model=LocationResponse)
def create_location( LocationCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    loc_id = generate_id("loc")
    try:
        cursor.execute("""
        INSERT INTO locations (
            id, name, type, parent_id, address, owner_id, description,
            open_time, close_time, is_always_open, lock_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            loc_id, data.name, data.type, data.parent_id, data.address,
            data.owner_id, data.description, data.open_time, data.close_time,
            data.is_always_open, data.lock_type
        ))
        conn.commit()
        conn.close()
        return get_location_by_id(loc_id)
    except Exception as e:
        conn.close()
        logger.error(f"Create location error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/location/{loc_id}", response_model=LocationResponse)
def get_location(loc_id: str):
    return get_location_by_id(loc_id)

@app.get("/locations", response_model=List[LocationResponse])
def list_all_locations():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM locations")
    rows = cursor.fetchall()
    conn.close()
    return [LocationResponse(**dict(row)) for row in rows]

@app.get("/location/{loc_id}/neighbors")
def get_location_neighbors(loc_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        -- Прямые выходы
        SELECT l.id, l.name, lc.connection_type, lc.description
        FROM location_connections lc
        JOIN locations l ON lc.to_location_id = l.id
        WHERE lc.from_location_id = ?
        
        UNION
        
        -- Обратные выходы (если связь двусторонняя)
        SELECT l.id, l.name, lc.connection_type, lc.description
        FROM location_connections lc
        JOIN locations l ON lc.from_location_id = l.id
        WHERE lc.to_location_id = ? AND lc.is_bidirectional = 1
    """, (loc_id, loc_id))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "connection_type": row["connection_type"],
            "description": row["description"]
        }
        for row in rows
    ]

@app.get("/world", response_model=WorldStateResponse)
def get_world_state():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM world_state WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=500, detail="World state not initialized")
    return WorldStateResponse(**dict(row))

@app.patch("/world")
def update_world_state( WorldStateUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    fields = []
    values = []
    for key, value in data.model_dump(exclude_unset=True).items():
        fields.append(f"{key} = ?")
        values.append(value)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    query = f"UPDATE world_state SET {', '.join(fields)} WHERE id = 1"
    cursor.execute(query, values)
    conn.commit()
    conn.close()
    return {"status": "updated"}

@app.post("/npc/chat")
def chat(req: ChatRequest):
    logger.info(f"Chat with {req.npc_id}: {req.player_message}")
    try:
        npc = get_character_by_id(req.npc_id)
        loc = get_location_by_id(npc.location_id)
    except HTTPException:
        raise HTTPException(status_code=404, detail="NPC or location not found")

    prompt = f"""Ты — {npc.name} {npc.surname}, {npc.age} лет, {npc.occupation or 'без работы'}.
Ты находишься в локации: {loc.name} (ID: {loc.id}).
Твоя личность: {npc.personality}.
Твоё состояние: энергия={npc.energy}, стресс={npc.stress}.

Игрок говорит: "{req.player_message}"

Ответь коротко, естественно, как живой человек. Не упоминай, что ты ИИ.
Твой ответ:""".strip()

    try:
        response = requests.post(
            "http://localhost:8080/completion",
            json={
                "prompt": prompt,
                "temperature": 0.7,
                "top_p": 0.9,
                "repeat_penalty": 1.1,
                "max_tokens": 150,
                "stop": ["\n", "Игрок:"]
            },
            timeout=45
        )
        if response.status_code == 200:
            ai_text = response.json().get("content", "").strip()
            if not ai_text:
                ai_text = "Хм... не знаю, что сказать."
            return {"dialogue": ai_text, "action": "speak"}
        else:
            logger.error(f"llama-server error: {response.status_code}")
            return {"dialogue": "Не могу сейчас ответить...", "action": "silent"}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return {"dialogue": "Что-то не так...", "action": "silent"}

# === ИНВЕНТАРЬ И ОДЕЖДА ===

@app.post("/item", response_model=ItemResponse)
def create_item( ItemCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    item_id = generate_id("it")
    try:
        cursor.execute("""
        INSERT INTO items (id, item_type, name, description, layer, is_dirty)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (item_id, data.item_type, data.name, data.description, data.layer, data.is_dirty))
        conn.commit()
        conn.close()
        return get_item_by_id(item_id)
    except Exception as e:
        conn.close()
        logger.error(f"Create item error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_item_by_id(item_id: str) -> ItemResponse:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")
    return ItemResponse(**dict(row))

@app.post("/object", response_model=ObjectResponse)
def create_object( ObjectCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    obj_id = generate_id("obj")
    try:
        player = get_player()
        cursor.execute("""
        INSERT INTO location_objects (
            id, location_id, name, object_type, description,
            is_interactable, is_container
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            obj_id, player.location_id, data.name, data.object_type,
            data.description, data.is_interactable, data.is_container
        ))
        conn.commit()
        conn.close()
        return get_object_by_id(obj_id)
    except Exception as e:
        conn.close()
        logger.error(f"Create object error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_object_by_id(obj_id: str) -> ObjectResponse:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM location_objects WHERE id = ?", (obj_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Object not found")
    return ObjectResponse(**dict(row))

@app.post("/item/{item_id}/wear")
def wear_item(item_id: str,  WearRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        player = get_player()
        if data.wear:
            cursor.execute("UPDATE items SET worn_by_id = ? WHERE id = ? AND current_holder_id = ?", 
                          (player.id, item_id, player.id))
        else:
            cursor.execute("UPDATE items SET worn_by_id = NULL WHERE id = ? AND worn_by_id = ?", 
                          (item_id, player.id))
        conn.commit()
        conn.close()
        return {"status": "updated"}
    except Exception as e:
        conn.close()
        logger.error(f"Wear item error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/item/{item_id}/drop_on_floor")
def drop_item_on_floor(item_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        player = get_player()
        cursor.execute("SELECT location_id FROM characters WHERE id = ?", (player.id,))
        loc_row = cursor.fetchone()
        if not loc_row:
            raise HTTPException(status_code=404, detail="Player location not found")
        current_loc = loc_row[0]

        cursor.execute("""
            UPDATE items 
            SET current_holder_id = NULL,
                worn_by_id = NULL,
                current_location_id = ?,
                current_object_id = NULL
            WHERE id = ? AND current_holder_id = ?
        """, (current_loc, item_id, player.id))

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item not found or not owned")

        conn.commit()
        conn.close()
        return {"status": "dropped on floor", "location_id": current_loc}
    except Exception as e:
        conn.close()
        logger.error(f"Drop on floor error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/item/{item_id}/pickup")
def pickup_item(item_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        player = get_player()
        cursor.execute("SELECT current_location_id FROM items WHERE id = ?", (item_id,))
        item_row = cursor.fetchone()
        if not item_row or not item_row[0]:
            raise HTTPException(status_code=404, detail="Item not on floor")

        cursor.execute("""
            UPDATE items 
            SET current_holder_id = ?,
                current_location_id = NULL
            WHERE id = ? AND current_location_id = ?
        """, (player.id, item_id, item_row[0]))

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item not available")

        conn.commit()
        conn.close()
        return {"status": "picked up"}
    except Exception as e:
        conn.close()
        logger.error(f"Pickup item error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === РЕДАКТИРОВАНИЕ И УДАЛЕНИЕ ===

@app.patch("/character/{char_id}", response_model=CharacterResponse)
def update_character(char_id: str,  CharacterCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        UPDATE characters SET
            name = ?, surname = ?, patronymic = ?, age = ?, gender = ?,
            role = ?, location_id = ?, occupation = ?, personality = ?, current_goal = ?
        WHERE id = ?
        """, (
            data.name, data.surname, data.patronymic, data.age,
            data.gender, data.role, data.location_id, data.occupation,
            data.personality, data.current_goal, char_id
        ))
        conn.commit()
        conn.close()
        return get_character_by_id(char_id)
    except Exception as e:
        conn.close()
        logger.error(f"Update character error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/character/{char_id}")
def delete_character(char_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM characters WHERE id = ?", (char_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Character not found")
        conn.commit()
        conn.close()
        return {"status": "deleted"}
    except Exception as e:
        conn.close()
        logger.error(f"Delete character error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/location/{loc_id}", response_model=LocationResponse)
def update_location(loc_id: str,  LocationCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        UPDATE locations SET
            name = ?, type = ?, parent_id = ?, address = ?, owner_id = ?,
            description = ?, open_time = ?, close_time = ?, is_always_open = ?, lock_type = ?
        WHERE id = ?
        """, (
            data.name, data.type, data.parent_id, data.address, data.owner_id,
            data.description, data.open_time, data.close_time,
            data.is_always_open, data.lock_type, loc_id
        ))
        conn.commit()
        conn.close()
        return get_location_by_id(loc_id)
    except Exception as e:
        conn.close()
        logger.error(f"Update location error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/location/{loc_id}")
def delete_location(loc_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM locations WHERE id = ?", (loc_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Location not found")
        conn.commit()
        conn.close()
        return {"status": "deleted"}
    except Exception as e:
        conn.close()
        logger.error(f"Delete location error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/item/{item_id}")
def update_item(item_id: str,  ItemCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        UPDATE items SET
            name = ?, item_type = ?, description = ?, layer = ?, is_dirty = ?
        WHERE id = ?
        """, (data.name, data.item_type, data.description, data.layer, data.is_dirty, item_id))
        conn.commit()
        conn.close()
        return {"status": "updated"}
    except Exception as e:
        conn.close()
        logger.error(f"Update item error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/item/{item_id}")
def delete_item(item_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        conn.commit()
        conn.close()
        return {"status": "deleted"}
    except Exception as e:
        conn.close()
        logger.error(f"Delete item error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === ЛОКАЦИЯ: ОБЪЕКТЫ И ПРЕДМЕТЫ НА ПОЛУ ===

@app.get("/location/{loc_id}/objects", response_model=List[ObjectResponse])
def get_location_objects(loc_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM location_objects WHERE location_id = ?", (loc_id,))
    rows = cursor.fetchall()
    conn.close()
    return [ObjectResponse(**dict(row)) for row in rows]

@app.get("/location/{loc_id}/items", response_model=List[ItemResponse])
def get_location_items(loc_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            id, item_type, name, description,
            current_location_id, current_object_id, current_holder_id, worn_by_id,
            layer, is_dirty
        FROM items
        WHERE current_location_id = ? AND current_holder_id IS NULL
    """, (loc_id,))
    rows = cursor.fetchall()
    conn.close()
    return [ItemResponse(**dict(row)) for row in rows]

@app.get("/")
def root():
    return {"message": "CitySim AI Server v1.0.0 — ready for simulation!"}