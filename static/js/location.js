// location.js — управление локацией и переходами

window.fetchLocation = fetchLocation;
window.fetchLocationNeighbors = fetchLocationNeighbors;
window.renderLocation = renderLocation;
window.renderExits = renderExits;
window.loadLocationAndExits = loadLocationAndExits;

async function fetchLocation(locId) {
  return await safeFetch(`/location/${locId}`, 'Локация');
}

async function fetchLocationNeighbors(locId) {
  return await safeFetch(`/location/${locId}/neighbors`, 'Переходы') || [];
}

async function renderLocation() {
  const loc = await fetchLocation(window.currentLocationId);
  if (!loc) {
    document.getElementById('location-title').textContent = 'Ошибка загрузки';
    document.getElementById('location-description').textContent = 'Не удалось получить данные локации.';
    return;
  }
  document.getElementById('location-title').textContent = loc.name;
  document.getElementById('location-description').textContent = loc.description || 'Описание отсутствует.';
  document.getElementById('location-objects').innerHTML = '<li>Объекты скоро...</li>';
  document.getElementById('location-items').innerHTML = '<li>Предметы скоро...</li>';
}

async function renderExits() {
  const exits = await fetchLocationNeighbors(window.currentLocationId);
  const exitList = document.getElementById('location-exits');
  if (!exitList) {
    console.warn('Элемент #location-exits не найден');
    return;
  }
  if (exits.length === 0) {
    exitList.innerHTML = '<li>Нет доступных выходов</li>';
    return;
  }
  exitList.innerHTML = exits.map(exit => {
    const connType = exit.connection_type || 'дверь';
    return `<li data-loc-id="${exit.id}" title="ID: ${exit.id}">
      → ${exit.name} (${connType})
    </li>`;
  }).join('');
  exitList.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', async () => {
      const newLocId = li.getAttribute('data-loc-id');
      if (!newLocId) return;

      try {
        // Обновляем позицию игрока через POST с URL-параметром
        const res = await fetch(`/player/location/${newLocId}`, { method: 'POST' });
        if (res.ok) {
          window.currentLocationId = newLocId;
          await loadLocationAndExits();
        } else {
          alert('Не удалось обновить позицию игрока');
        }
      } catch (e) {
        console.error('Ошибка при переходе:', e);
        alert('Ошибка сети');
      }
    });
  });
}

async function loadLocationAndExits() {
  await renderLocation();
  await renderExits();
}