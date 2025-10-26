let currentLocationId = 'loc_school_45';
let currentNpcId = null;

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

async function safeFetch(url, errorMsg = 'Ошибка') {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${errorMsg} (${res.status})`);
    return await res.json();
  } catch (e) {
    console.error(errorMsg, e);
    return null;
  }
}

// === ГЛОБАЛЬНОЕ СОСТОЯНИЕ ===
async function renderWorldState() {
  const world = await safeFetch('/world', 'Мир');
  if (!world) return;
  const dt = new Date(world.current_timestamp);
  document.getElementById('game-time').textContent = dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('weather').textContent = `${world.weather}, ${world.temperature}°C`;
}

// === ИГРОК ===
async function renderPlayerStatus() {
  const player = await safeFetch('/player', 'Игрок');
  if (!player) {
    document.getElementById('player-name').textContent = 'Нет игрока';
    document.getElementById('player-health').textContent = '--';
    document.getElementById('player-energy').textContent = '--';
    document.getElementById('player-stress').textContent = '--';
    document.getElementById('player-social').textContent = '--';
    document.getElementById('player-energy2').textContent = '--';
    document.getElementById('player-stress2').textContent = '--';
    document.querySelector('.appearance-placeholder').textContent = 'Создайте игрока';
    document.getElementById('player-inventory').innerHTML = '<li>Создайте игрока</li>';
    return;
  }

  document.getElementById('player-name').textContent = `${player.name} ${player.surname || ''}`;
  document.getElementById('player-health').textContent = player.health;
  document.getElementById('player-energy').textContent = player.energy;
  document.getElementById('player-stress').textContent = player.stress;
  document.getElementById('player-social').textContent = player.social;
  document.getElementById('player-energy2').textContent = player.energy;
  document.getElementById('player-stress2').textContent = player.stress;

  const inventory = await safeFetch('/player/inventory', 'Инвентарь') || [];
  const worn = inventory.filter(i => i.worn_by_id).map(i => i.name).join(', ');
  document.querySelector('.appearance-placeholder').textContent = worn || 'Без одежды';

  document.getElementById('player-inventory').innerHTML = 
    inventory.length 
      ? inventory.map(i => `<li>${i.name}${i.worn_by_id ? ' 👕' : ''}</li>`).join('')
      : '<li>Пусто</li>';
}

// === ЛОКАЦИЯ ===
async function renderLocation() {
  const loc = await safeFetch(`/location/${currentLocationId}`, 'Локация');
  if (!loc) {
    document.getElementById('location-title').textContent = 'Ошибка';
    document.getElementById('location-description').textContent = 'Не удалось загрузить локацию';
    return;
  }
  document.getElementById('location-title').textContent = loc.name;
  document.getElementById('location-description').textContent = loc.description || 'Описание отсутствует.';
  document.getElementById('location-objects').innerHTML = '<li>Объекты скоро...</li>';
  document.getElementById('location-items').innerHTML = '<li>Предметы скоро...</li>';
}

// === NPC ===
async function renderNpcsRight() {
  const npcs = await safeFetch(`/characters?location_id=${currentLocationId}`, 'NPC') || [];
  document.getElementById('npc-list-right').innerHTML = 
    npcs.length 
      ? npcs.map(n => `<li onclick="selectNpc('${n.id}')" title="${n.id}">${n.name} ${n.surname || ''}</li>`).join('')
      : '<li>Никого нет</li>';
}

function selectNpc(id) {
  currentNpcId = id;
  document.getElementById('chat-log').textContent = `Выбран: ${id}\n`;
}

// === ЧАТ ===
async function sendChatMessage() {
  const msg = document.getElementById('player-input').value.trim();
  if (!msg || !currentNpcId) return;
  const log = document.getElementById('chat-log');
  log.textContent += `\nИгрок: ${msg}`;
  document.getElementById('player-input').value = '';
  log.scrollTop = log.scrollHeight;

  const res = await fetch('/npc/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ npc_id: currentNpcId, player_message: msg })
  });
  const data = await res.json();
  log.textContent += `\n${data.dialogue || '...'}\n`;
  log.scrollTop = log.scrollHeight;
}

// === ЗАГРУЗКА ВСЕГО ===
async function loadAll() {
  await renderWorldState();
  await renderLocation();
  await renderNpcsRight();
  await renderPlayerStatus();
}

// === ИНИЦИАЛИЗАЦИЯ ===
document.getElementById('send-btn').onclick = sendChatMessage;
document.getElementById('player-input').onkeypress = (e) => {
  if (e.key === 'Enter') sendChatMessage();
};

// Запуск
loadAll();