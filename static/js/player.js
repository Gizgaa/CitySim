// player.js — статус игрока и инвентарь

async function fetchPlayer() {
  return await safeFetch('/player', 'Игрок');
}

async function renderPlayerStatus() {
  const player = await fetchPlayer();
  const inventory = await fetchPlayerInventory();

  const els = {
    name: document.getElementById('player-name'),
    health: document.getElementById('player-health'),
    energy: document.getElementById('player-energy'),
    stress: document.getElementById('player-stress'),
    social: document.getElementById('player-social'),
    energy2: document.getElementById('player-energy2'),
    stress2: document.getElementById('player-stress2'),
    appearance: document.querySelector('.appearance-placeholder'),
    inv: document.getElementById('player-inventory')
  };

  if (!player) {
    els.name.textContent = 'Нет игрока';
    els.health.textContent = '--';
    els.energy.textContent = '--';
    els.stress.textContent = '--';
    els.social.textContent = '--';
    els.energy2.textContent = '--';
    els.stress2.textContent = '--';
    els.appearance.textContent = 'Создайте персонажа с ролью "player"';
    els.inv.innerHTML = '<li>Игрок не найден</li>';
    return;
  }

  // Обновляем данные
  els.name.textContent = `${player.name} ${player.surname || ''}`;
  els.health.textContent = player.health;
  els.energy.textContent = player.energy;
  els.stress.textContent = player.stress;
  els.social.textContent = player.social;
  els.energy2.textContent = player.energy;
  els.stress2.textContent = player.stress;

  // Фильтруем надетые предметы (worn_by_id === player.id)
  const wornItems = inventory.filter(item => 
    item.worn_by_id && item.worn_by_id === player.id
  ).sort((a, b) => (a.layer || 0) - (b.layer || 0));

  if (wornItems.length > 0) {
    const names = wornItems.map(item => item.name).join(', ');
    els.appearance.textContent = `Одет: ${names}`;
  } else {
    els.appearance.textContent = 'Без одежды';
  }
}