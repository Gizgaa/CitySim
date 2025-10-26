// world.js — управление глобальным состоянием мира

// Загрузка и отображение времени/погоды
async function renderWorldState() {
  const world = await safeFetch('/world', 'Мир');
  if (!world) return;

  try {
    const dt = new Date(world.current_timestamp);
    const timeStr = dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('game-time').textContent = timeStr;
    document.getElementById('weather').textContent = `${world.weather}, ${world.temperature}°C`;
  } catch (e) {
    console.error('Ошибка формата даты:', e);
    document.getElementById('game-time').textContent = '--:--';
    document.getElementById('weather').textContent = 'Ошибка погоды';
  }
}

// Обновление мира (вызывается из редактора)
async function updateWorldState(data) {
  const res = await fetch('/world', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return await res.json();
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  renderWorldState();
});