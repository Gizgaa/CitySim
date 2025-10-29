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

  // Обязательные поля для LocationCreate: name, type
  const updateData = {
    name: field === 'name' ? newValue : loc.name,
    type: loc.type, // ← всегда отправляем type!
    parent_id: loc.parent_id,
    address: loc.address,
    owner_id: loc.owner_id,
    description: field === 'description' ? newValue : loc.description,
    is_always_open: loc.is_always_open,
    lock_type: loc.lock_type
  };

  const res = await fetch(`/location/${window.currentLocationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });

  if (res.ok) {
    alert('Обновлено!');
    renderLocation();
  } else {
    const errorText = await res.text();
    console.error('Ошибка обновления:', errorText);
    alert(`Ошибка обновления: ${errorText}`);
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

async function openConnectionsEditor() {
  const locId = window.currentLocationId;
  const loc = await fetchLocation(locId);
  if (!loc) return;

  // Загружаем все локации для выбора
  const allLocs = await safeFetch('/locations', 'Все локации') || [];
  const currentConnections = await safeFetch(`/location/${locId}/neighbors`, 'Текущие связи') || [];
  const connectedIds = new Set(currentConnections.map(c => c.id));

  let optionsHtml = allLocs
    .filter(l => l.id !== locId)
    .map(l => {
      const checked = connectedIds.has(l.id) ? 'checked' : '';
      return `<label style="display:block;margin:4px 0;"><input type="checkbox" data-target="${l.id}" ${checked}> ${l.name} (${l.id})</label>`;
    })
    .join('');

  const modalHtml = `
    <div id="connections-modal" class="modal" style="display:block;">
      <div class="modal-content" style="max-width:700px;">
        <span class="close" onclick="closeConnectionsEditor()">&times;</span>
        <h3>🔗 Переходы из: ${loc.name}</h3>
        <p>Отметьте локации, с которыми должна быть связь (двусторонняя):</p>
        <div style="max-height:400px;overflow-y:auto;border:1px solid #eee;padding:10px;">
          ${optionsHtml}
        </div>
        <button onclick="saveConnections('${locId}')" style="margin-top:12px;">Сохранить переходы</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeConnectionsEditor() {
  const modal = document.getElementById('connections-modal');
  if (modal) modal.remove();
}

async function saveConnections(fromLocId) {
  const checkboxes = document.querySelectorAll('#connections-modal input[type="checkbox"]');
  const targetIds = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.getAttribute('data-target'));

  // Удалим старые связи
  const connRes = await fetch(`/location/${fromLocId}/neighbors`);
  const oldConnections = await connRes.json();
  for (const conn of oldConnections) {
    // Удаляем обе стороны (если двусторонняя)
    await fetch(`/location_connection/${fromLocId}/${conn.id}`, { method: 'DELETE' });
    await fetch(`/location_connection/${conn.id}/${fromLocId}`, { method: 'DELETE' });
  }

  // Создадим новые
  for (const toLocId of targetIds) {
    await fetch('/location_connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_location_id: fromLocId,
        to_location_id: toLocId,
        is_bidirectional: true
      })
    });
  }

  alert('Переходы обновлены!');
  closeConnectionsEditor();
  loadLocationAndExits(); // обновить список выходов
}

async function moveNpcHere() {
  const npcs = await safeFetch('/characters', 'Все NPC') || [];
  const currentLoc = window.currentLocationId;
  const options = npcs
    .filter(n => n.id.startsWith('pers_') && n.role !== 'player')
    .map(n => `<option value="${n.id}">${n.name} ${n.surname || ''} (${n.id})</option>`)
    .join('');

  if (!options) {
    alert('Нет NPC для перемещения');
    return;
  }

  const selectHtml = `
    <div id="move-npc-modal" class="modal" style="display:block;">
      <div class="modal-content">
        <span class="close" onclick="document.getElementById('move-npc-modal').remove()">&times;</span>
        <h3>👤 Переместить NPC в эту локацию</h3>
        <select id="npc-to-move" style="width:100%;margin:10px 0;">${options}</select>
        <button onclick="doMoveNpc('${currentLoc}')">Переместить</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', selectHtml);
}

async function doMoveNpc(targetLocId) {
  const npcId = document.getElementById('npc-to-move').value;
  if (!npcId) return;

  const res = await fetch(`/character/${npcId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location_id: targetLocId })
  });

  if (res.ok) {
    alert('NPC перемещён!');
    document.getElementById('move-npc-modal').remove();
    renderNpcsRight();
  } else {
    alert('Ошибка перемещения');
  }
}

async function moveNpcHere() {
  const npcs = await safeFetch('/characters') || [];
  if (!npcs.length) {
    alert('Нет NPC');
    return;
  }
  const options = npcs
    .filter(n => n.role !== 'player')
    .map(n => {
      const name = `${n.name} ${n.surname || ''}`.trim();
      return `<option value="${n.id}">${name} (${n.id})</option>`;
    })
    .join('');

  const modal = `
    <div id="move-npc-modal" class="modal" style="display:block;">
      <div class="modal-content">
        <span class="close" onclick="document.getElementById('move-npc-modal').remove()">&times;</span>
        <h3>👤 Переместить NPC в эту локацию</h3>
        <input type="text" id="npc-search" placeholder="Поиск по имени или ID..." style="width:100%;margin:10px 0;">
        <select id="npc-select" size="8" style="width:100%;height:200px;">
          ${options}
        </select>
        <button onclick="doMoveNpc('${window.currentLocationId}')" style="margin-top:10px;">Переместить сюда</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);

  // Фильтрация поиска
  const search = document.getElementById('npc-search');
  const select = document.getElementById('npc-select');
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    for (const opt of select.options) {
      const text = opt.textContent.toLowerCase();
      opt.style.display = text.includes(q) ? 'block' : 'none';
    }
  });
}

async function doMoveNpc(targetLocId) {
  const select = document.getElementById('npc-select');
  const selected = Array.from(select.selectedOptions)[0];
  if (!selected) {
    alert('Выберите NPC');
    return;
  }
  const npcId = selected.value;
  const res = await fetch(`/character/${npcId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location_id: targetLocId })
  });
  if (res.ok) {
    alert('NPC перемещён!');
    document.getElementById('move-npc-modal').remove();
    renderNpcsRight();
  } else {
    alert('Ошибка перемещения');
  }
}