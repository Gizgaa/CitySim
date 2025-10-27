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