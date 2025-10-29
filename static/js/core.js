// core.js — исправленная инициализация с ожиданием позиции игрока

// Глобальные переменные (инициализируются позже)
window.currentLocationId = null;
window.currentNpcId = null;

// Флаг: готова ли система к работе
window.CitySimReady = false;

// Загрузка последней позиции игрока
async function loadPlayerLocation() {
  try {
    const res = await fetch('/player');
    if (res.ok) {
      const player = await res.json();
      window.currentLocationId = player.location_id;
    } else {
      console.warn('Игрок не найден, старт в вестибюле');
      window.currentLocationId = 'loc_vestibule';
    }
  } catch (e) {
    console.warn('Ошибка загрузки игрока:', e);
    window.currentLocationId = 'loc_vestibule';
  }
  window.CitySimReady = true;
}

// Безопасный fetch
async function safeFetch(url, errorMsg = 'Ошибка запроса') {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`${errorMsg}: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error(`${errorMsg}:`, e);
    return null;
  }
}

// Безопасный POST
async function safePost(url, data, successMsg = 'Успешно') {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      alert(successMsg);
      return await res.json();
    } else {
      const err = await res.json();
      alert(`Ошибка: ${JSON.stringify(err.detail)}`);
      return null;
    }
  } catch (e) {
    alert(`Ошибка: ${e.message}`);
    return null;
  }
}

// Запуск инициализации
loadPlayerLocation();

window.devMode = false;

function toggleDevMode() {
  window.devMode = !window.devMode;
  document.body.classList.toggle('dev-mode', window.devMode);
  const btn = document.getElementById('dev-toggle');
  btn.textContent = window.devMode ? '🛠️ Dev Mode (ON)' : '🛠️ Dev Mode';
}

// Глобальный объект для хранения шаблонов
window.templates = {
  items: [],
  objects: [],
  characters: []
};

async function loadTemplates() {
  window.templates.items = await safeFetch('/item_templates') || [];
  window.templates.objects = await safeFetch('/object_templates') || [];
  window.templates.characters = await safeFetch('/character_templates') || [];
}

// Загрузим шаблоны при старте
loadTemplates();

function applyTemplate(type) {
  const select = document.getElementById(`${type}_template_select`);
  const tplId = select.value;
  if (!tplId) return;

  let url = '';
  if (type === 'item') url = `/item_template/${tplId}`;
  // ... аналогично для object и character

  fetch(url)
    .then(r => r.json())
    .then(tpl => {
      // Применяем поля шаблона к форме
      if (type === 'item') {
        document.getElementById('i_name').value = tpl.name;
        document.getElementById('i_type').value = tpl.item_type;
        document.getElementById('i_description').value = tpl.description || '';
        document.getElementById('i_layer').value = tpl.layer || 0;
        document.getElementById('i_is_dirty').checked = tpl.is_dirty || false;
      }
      // ... аналогично для object и character
    })
    .catch(e => alert('Ошибка загрузки шаблона: ' + e.message));
}

async function loadPlayerLocation() {
  try {
    const res = await fetch('/player');
    if (res.ok) {
      const player = await res.json();
      window.currentLocationId = player.location_id;
    } else {
      // Создаём игрока, если нет
      const createRes = await fetch('/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Игрок",
          surname: "Главный",
          age: 17,
          gender: "мужской",
          role: "player",
          location_id: "loc_vestibule"
        })
      });
      if (createRes.ok) {
        const newPlayer = await createRes.json();
        window.currentLocationId = newPlayer.location_id;
      } else {
        window.currentLocationId = 'loc_vestibule';
      }
    }
  } catch (e) {
    console.warn('Ошибка загрузки/создания игрока:', e);
    window.currentLocationId = 'loc_vestibule';
  }
  window.CitySimReady = true;
}