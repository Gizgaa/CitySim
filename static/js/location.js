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
  const titleEl = document.getElementById('location-title');
  const descEl = document.getElementById('location-description');

  if (!titleEl || !descEl) {
    console.warn('Элементы локации не найдены в DOM');
    return;
  }

  if (!loc) {
    titleEl.textContent = 'Ошибка загрузки';
    descEl.textContent = 'Не удалось получить данные локации.';
    return;
  }

  titleEl.textContent = loc.name;
  descEl.textContent = loc.description || 'Описание отсутствует.';

  // Загружаем объекты
  const objects = await safeFetch(`/location/${window.currentLocationId}/objects`, 'Объекты') || [];
  const objList = document.getElementById('location-objects');
  if (objList) {
    if (objects.length === 0) {
      objList.innerHTML = '<li>Нет объектов</li>';
    } else {
      objList.innerHTML = objects.map(obj => {
        const desc = obj.description ? ` — ${obj.description}` : '';
        return `<li>${obj.name} (${obj.object_type})${desc}</li>`;
      }).join('');
    }
  }

  // Загружаем предметы на полу
  const items = await safeFetch(`/location/${window.currentLocationId}/items`, 'Предметы') || [];
  const itemList = document.getElementById('location-items');
  if (itemList) {
    if (items.length === 0) {
      itemList.innerHTML = '<li>Нет предметов</li>';
    } else {
      itemList.innerHTML = items.map(item => {
        const desc = item.description ? ` — ${item.description}` : '';
        return `<li>${item.name} (${item.item_type})${desc}</li>`;
      }).join('');
    }
  }
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

async function editLocationField(field) {
  const loc = await fetchLocation(window.currentLocationId);
  if (!loc) return;

  const newValue = prompt(`Изменить ${field === 'name' ? 'название' : 'описание'}:`, loc[field] || '');
  if (newValue === null) return;

  const updateData = { ...loc };
  updateData[field] = newValue;

  const res = await fetch(`/location/${window.currentLocationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });

  if (res.ok) {
    alert('Обновлено!');
    renderLocation();
  } else {
    alert('Ошибка обновления');
  }
}

function openConnectionsEditor() {
  alert('Редактор переходов — в разработке');
  // TODO: открыть модальное окно с выбором локаций
}

function openItemCreator() {
  openCreateModal('item');
}

function openObjectCreator() {
  openCreateModal('object');
}

function moveNpcHere() {
  alert('Переместить NPC — в разработке');
  // TODO: выбрать NPC из списка и обновить его location_id
}