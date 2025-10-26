# ai_server.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import logging
import requests
import random
import string
from database import init_db, get_db_connection

init_db()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CitySim AI Server", version="0.7.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

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

def generate_id(prefix: str, base: str) -> str:
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{prefix}_{base[:20].lower().replace(' ', '_')}_{suffix}"

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

@app.post("/character", response_model=CharacterResponse)
def create_character( CharacterCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    char_id = generate_id("pers", data.name)
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
        
# PATCH /character/{char_id}
@app.patch("/character/{char_id}", response_model=CharacterResponse)
def update_character(char_id: str, data: CharacterCreate):
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

# DELETE /character/{char_id}
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
    loc_id = generate_id("loc", data.name)
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
        
@app.patch("/location/{loc_id}", response_model=LocationResponse)
def update_location(loc_id: str, data: LocationCreate):
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
        SELECT l.id, l.name, lc.connection_type, lc.description
        FROM location_connections lc
        JOIN locations l ON lc.to_location_id = l.id
        WHERE lc.from_location_id = ?
    """, (loc_id,))
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
        
class WearRequest(BaseModel):
    wear: bool

@app.post("/item/{item_id}/wear")
def wear_item(item_id: str,  WearRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        player = get_player()
        if data.wear:
            # Надеть: установить worn_by_id = player.id
            cursor.execute("UPDATE items SET worn_by_id = ? WHERE id = ? AND current_holder_id = ?", 
                          (player.id, item_id, player.id))
        else:
            # Снять: сбросить worn_by_id
            cursor.execute("UPDATE items SET worn_by_id = NULL WHERE id = ? AND worn_by_id = ?", 
                          (item_id, player.id))
        conn.commit()
        conn.close()
        return {"status": "updated"}
    except Exception as e:
        conn.close()
        logger.error(f"Wear item error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/item/{item_id}")
def delete_item(item_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        player = get_player()
        cursor.execute("DELETE FROM items WHERE id = ? AND current_holder_id = ?", (item_id, player.id))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item not found or not owned")
        conn.commit()
        conn.close()
        return {"status": "deleted"}
    except Exception as e:
        conn.close()
        logger.error(f"Delete item error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"message": "CitySim AI Server v0.7.0 — ready!"}