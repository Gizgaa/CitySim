// editor.js — единый редактор для всех сущностей

// === ОТКРЫТИЕ МОДАЛЬНЫХ ОКОН ===

function openCreateModal(type) {
  document.getElementById('create-type').value = type;
  buildCreateForm(type, null);
  document.getElementById('modal-create').style.display = 'block';
}

function openEditModal(id) {
  if (!id) return;
  if (id.startsWith('pers_')) {
    fetch(`/character/${id}`).then(r => r.json()).then(data => {
      buildCreateForm('character', data);
      document.getElementById('edit-id-display').textContent = id;
      document.getElementById('modal-edit').style.display = 'block';
    }).catch(e => alert('Ошибка загрузки персонажа: ' + e.message));
  } else if (id.startsWith('loc_')) {
    fetch(`/location/${id}`).then(r => r.json()).then(data => {
      buildCreateForm('location', data);
      document.getElementById('edit-id-display').textContent = id;
      document.getElementById('modal-edit').style.display = 'block';
    }).catch(e => alert('Ошибка загрузки локации: ' + e.message));
  } else if (id.startsWith('it_')) {
    fetch(`/item/${id}`).then(r => r.json()).then(data => {
      buildCreateForm('item', data);
      document.getElementById('edit-id-display').textContent = id;
      document.getElementById('modal-edit').style.display = 'block';
    }).catch(e => alert('Ошибка загрузки предмета: ' + e.message));
  } else if (id.startsWith('obj_')) {
    fetch(`/object/${id}`).then(r => r.json()).then(data => {
      buildCreateForm('object', data);
      document.getElementById('edit-id-display').textContent = id;
      document.getElementById('modal-edit').style.display = 'block';
    }).catch(e => alert('Ошибка загрузки объекта: ' + e.message));
  }
}

// === ПОСТРОЕНИЕ ФОРМЫ ===

function buildCreateForm(type, data = null) {
  const createForm = document.getElementById('create-form-container');
  const editForm = document.getElementById('edit-form');
  const targetForm = editForm || createForm;
  if (!targetForm) return;

  let html = '';

  if (type === 'character') {
    const name = data?.name || '';
    const surname = data?.surname || '';
    const patronymic = data?.patronymic || '';
    const age = data?.age || 16;
    const gender = data?.gender || 'женский';
    const role = data?.role || 'npc';
    const location_id = data?.location_id || window.currentLocationId;
    const occupation = data?.occupation || '';
    const personality = data?.personality || '';
    html = `
      ${data ? `<input type="hidden" id="edit-id" value="${data.id}">` : ''}
      <label>Имя: <input type="text" id="c_name" value="${name}" required></label>
      <label>Фамилия: <input type="text" id="c_surname" value="${surname}" required></label>
      <label>Отчество: <input type="text" id="c_patronymic" value="${patronymic}"></label>
      <label>Возраст: <input type="number" id="c_age" value="${age}" min="0" max="120" required></label>
      <label>Пол:
        <select id="c_gender" required>
          <option value="мужской" ${gender === 'мужской' ? 'selected' : ''}>Мужской</option>
          <option value="женский" ${gender === 'женский' ? 'selected' : ''}>Женский</option>
        </select>
      </label>
      <label>Роль:
        <select id="c_role" required>
          <option value="npc" ${role === 'npc' ? 'selected' : ''}>NPC</option>
          <option value="player" ${role === 'player' ? 'selected' : ''}>Игрок</option>
        </select>
      </label>
      <label>ID локации: <input type="text" id="c_location_id" value="${location_id}" placeholder="loc_..." required></label>
      <label>Профессия: <input type="text" id="c_occupation" value="${occupation}"></label>
      <label>Личность: <textarea id="c_personality" rows="3">${personality}</textarea></label>
    `;
  } else if (type === 'location') {
    const name = data?.name || '';
    const typeVal = data?.type || 'classroom';
    const parent_id = data?.parent_id || '';
    const address = data?.address || '';
    const owner_id = data?.owner_id || '';
    const description = data?.description || '';
    const is_always_open = data?.is_always_open || false;
    const lock_type = data?.lock_type || 1;
    html = `
      ${data ? `<input type="hidden" id="edit-id" value="${data.id}">` : ''}
      <label>Название: <input type="text" id="l_name" value="${name}" required></label>
      <label>Тип: <input type="text" id="l_type" value="${typeVal}" required></label>
      <label>Родитель (ID): <input type="text" id="l_parent_id" value="${parent_id}" placeholder="loc_..."></label>
      <label>Адрес: <input type="text" id="l_address" value="${address}"></label>
      <label>Владелец (ID): <input type="text" id="l_owner_id" value="${owner_id}" placeholder="pers_... или loc_..."></label>
      <label>Описание:
        <textarea id="l_description" rows="6" style="width:100%;font-family:monospace;"
          placeholder="Подробное описание локации...">${description}</textarea>
      </label>
      <label><input type="checkbox" id="l_is_always_open" ${is_always_open ? 'checked' : ''}> Всегда открыто</label>
      <label>Тип замка:
        <select id="l_lock_type">
          <option value="1" ${lock_type == 1 ? 'selected' : ''}>Без замка</option>
          <option value="2" ${lock_type == 2 ? 'selected' : ''}>Ключ с обеих сторон</option>
          <option value="3" ${lock_type == 3 ? 'selected' : ''}>Ключ снаружи</option>
          <option value="4" ${lock_type == 4 ? 'selected' : ''}>Только изнутри</option>
        </select>
      </label>
    `;
  } else if (type === 'item') {
    const name = data?.name || '';
    const item_type = data?.item_type || 'clothing';
    const description = data?.description || '';
    const layer = data?.layer || 0;
    const is_dirty = data?.is_dirty || false;
    const quantity = data?._quantity || 1;
    html = `
      ${data ? `<input type="hidden" id="edit-id" value="${data.id}">` : ''}
      <label>Количество: <input type="number" id="i_quantity" value="${quantity}" min="1" max="100"></label>
      <button type="button" onclick="copyExistingItem()">📋 Скопировать существующий предмет</button>
      <hr>
      <label>Название: <input type="text" id="i_name" value="${name}" required></label>
      <label>Тип: <input type="text" id="i_type" value="${item_type}" required></label>
      <label>Описание: <textarea id="i_description" rows="4">${description}</textarea></label>
      <label>Слой одежды (0–5): <input type="number" id="i_layer" value="${layer}" min="0" max="5"></label>
      <label><input type="checkbox" id="i_is_dirty" ${is_dirty ? 'checked' : ''}> Грязный</label>
      <hr>
      <label>Создать из шаблона:
        <select id="i_template_select">
          <option value="">— выберите шаблон —</option>
          ${window.templates.items.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
        </select>
      </label>
      <button type="button" onclick="applyTemplate('item')">Применить шаблон</button>
    `;
  } else if (type === 'object') {
    const name = data?.name || '';
    const object_type = data?.object_type || 'desk';
    const description = data?.description || '';
    const is_interactable = data?.is_interactable !== false;
    const is_container = data?.is_container || false;
    const quantity = data?._quantity || 1;
    html = `
      ${data ? `<input type="hidden" id="edit-id" value="${data.id}">` : ''}
      <label>Количество: <input type="number" id="o_quantity" value="${quantity}" min="1" max="100"></label>
      <button type="button" onclick="copyExistingObject()">📋 Скопировать существующий объект</button>
      <hr>
      <label>Название: <input type="text" id="o_name" value="${name}" required></label>
      <label>Тип: <input type="text" id="o_type" value="${object_type}" required></label>
      <label>Описание: <textarea id="o_description" rows="4">${description}</textarea></label>
      <label><input type="checkbox" id="o_interactable" ${is_interactable ? 'checked' : ''}> Интерактивный</label>
      <label><input type="checkbox" id="o_container" ${is_container ? 'checked' : ''}> Контейнер</label>
      <hr>
      <label>Создать из шаблона:
        <select id="o_template_select">
          <option value="">— выберите шаблон —</option>
          ${window.templates.objects.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
        </select>
      </label>
      <button type="button" onclick="applyTemplate('object')">Применить шаблон</button>
    `;
  } else if (type === 'character_template') {
    const name = data?.name || '';
    const surname = data?.surname || '';
    const patronymic = data?.patronymic || '';
    const age = data?.age || 16;
    const gender = data?.gender || 'женский';
    const role = data?.role || 'npc';
    const occupation = data?.occupation || '';
    const personality = data?.personality || '';
    html = `
      <label>Имя: <input type="text" id="c_name" value="${name}" required></label>
      <label>Фамилия: <input type="text" id="c_surname" value="${surname}" required></label>
      <label>Отчество: <input type="text" id="c_patronymic" value="${patronymic}"></label>
      <label>Возраст: <input type="number" id="c_age" value="${age}" min="0" max="120" required></label>
      <label>Пол:
        <select id="c_gender" required>
          <option value="мужской" ${gender === 'мужской' ? 'selected' : ''}>Мужской</option>
          <option value="женский" ${gender === 'женский' ? 'selected' : ''}>Женский</option>
        </select>
      </label>
      <label>Роль:
        <select id="c_role" required>
          <option value="npc" ${role === 'npc' ? 'selected' : ''}>NPC</option>
          <option value="player" ${role === 'player' ? 'selected' : ''}>Игрок</option>
        </select>
      </label>
      <label>Профессия: <input type="text" id="c_occupation" value="${occupation}"></label>
      <label>Личность: <textarea id="c_personality" rows="3">${personality}</textarea></label>
    `;
  } else if (type === 'location_template') {
    const name = data?.name || '';
    const typeVal = data?.type || 'classroom';
    const parent_id = data?.parent_id || '';
    const address = data?.address || '';
    const owner_id = data?.owner_id || '';
    const description = data?.description || '';
    const is_always_open = data?.is_always_open || false;
    const lock_type = data?.lock_type || 1;
    html = `
      <label>Название: <input type="text" id="l_name" value="${name}" required></label>
      <label>Тип: <input type="text" id="l_type" value="${typeVal}" required></label>
      <label>Родитель (ID): <input type="text" id="l_parent_id" value="${parent_id}" placeholder="loc_..."></label>
      <label>Адрес: <input type="text" id="l_address" value="${address}"></label>
      <label>Владелец (ID): <input type="text" id="l_owner_id" value="${owner_id}" placeholder="pers_... или loc_..."></label>
      <label>Описание:
        <textarea id="l_description" rows="6" style="width:100%;font-family:monospace;"
          placeholder="Подробное описание локации...">${description}</textarea>
      </label>
      <label><input type="checkbox" id="l_is_always_open" ${is_always_open ? 'checked' : ''}> Всегда открыто</label>
      <label>Тип замка:
        <select id="l_lock_type">
          <option value="1" ${lock_type == 1 ? 'selected' : ''}>Без замка</option>
          <option value="2" ${lock_type == 2 ? 'selected' : ''}>Ключ с обеих сторон</option>
          <option value="3" ${lock_type == 3 ? 'selected' : ''}>Ключ снаружи</option>
          <option value="4" ${lock_type == 4 ? 'selected' : ''}>Только изнутри</option>
        </select>
      </label>
    `;
  } else if (type === 'item_template') {
    const name = data?.name || '';
    const item_type = data?.item_type || 'clothing';
    const description = data?.description || '';
    const layer = data?.layer || 0;
    const is_dirty = data?.is_dirty || false;
    html = `
      <label>Название: <input type="text" id="i_name" value="${name}" required></label>
      <label>Тип: <input type="text" id="i_type" value="${item_type}" required></label>
      <label>Описание: <textarea id="i_description" rows="4">${description}</textarea></label>
      <label>Слой одежды (0–5): <input type="number" id="i_layer" value="${layer}" min="0" max="5"></label>
      <label><input type="checkbox" id="i_is_dirty" ${is_dirty ? 'checked' : ''}> Грязный</label>
    `;
  } else if (type === 'object_template') {
    const name = data?.name || '';
    const object_type = data?.object_type || 'desk';
    const description = data?.description || '';
    const is_interactable = data?.is_interactable !== false;
    const is_container = data?.is_container || false;
    html = `
      <label>Название: <input type="text" id="o_name" value="${name}" required></label>
      <label>Тип: <input type="text" id="o_type" value="${object_type}" required></label>
      <label>Описание: <textarea id="o_description" rows="4">${description}</textarea></label>
      <label><input type="checkbox" id="o_interactable" ${is_interactable ? 'checked' : ''}> Интерактивный</label>
      <label><input type="checkbox" id="o_container" ${is_container ? 'checked' : ''}> Контейнер</label>
    `;
  }

  targetForm.innerHTML = html;
}

// === ОТПРАВКА ФОРМ ===

async function submitCreateForm() {
  const type = document.getElementById('create-type')?.value;
  if (!type) return;

  let url = '';
  let baseData = null;

  if (type === 'character') {
    const name = document.getElementById('c_name')?.value.trim();
    const surname = document.getElementById('c_surname')?.value.trim();
    if (!name || !surname) { alert('Имя и фамилия обязательны'); return; }
    baseData = {
      name,
      surname,
      patronymic: document.getElementById('c_patronymic')?.value.trim() || null,
      age: parseInt(document.getElementById('c_age')?.value) || 16,
      gender: document.getElementById('c_gender')?.value || 'женский',
      role: document.getElementById('c_role')?.value || 'npc',
      location_id: document.getElementById('c_location_id')?.value.trim() || window.currentLocationId,
      occupation: document.getElementById('c_occupation')?.value.trim() || null,
      personality: document.getElementById('c_personality')?.value.trim() || null
    };
    url = '/character';
  } else if (type === 'location') {
    const name = document.getElementById('l_name')?.value.trim();
    if (!name) { alert('Название обязательно'); return; }
    baseData = {
      name,
      type: document.getElementById('l_type')?.value.trim() || 'room',
      parent_id: document.getElementById('l_parent_id')?.value.trim() || null,
      address: document.getElementById('l_address')?.value.trim() || null,
      owner_id: document.getElementById('l_owner_id')?.value.trim() || null,
      description: document.getElementById('l_description')?.value.trim() || null,
      is_always_open: document.getElementById('l_is_always_open')?.checked || false,
      lock_type: parseInt(document.getElementById('l_lock_type')?.value) || 1
    };
    url = '/location';
  } else if (type === 'item') {
    const name = document.getElementById('i_name')?.value.trim();
    const item_type = document.getElementById('i_type')?.value.trim();
    if (!name) { alert('Название обязательно'); return; }
    baseData = {
      name,
      item_type,
      description: document.getElementById('i_description')?.value.trim() || null,
      layer: parseInt(document.getElementById('i_layer')?.value) || 0,
      is_dirty: document.getElementById('i_is_dirty')?.checked || false
    };
    const quantity = parseInt(document.getElementById('i_quantity')?.value) || 1;
    for (let i = 0; i < quantity; i++) {
      const res = await fetch('/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseData)
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Ошибка при создании предмета #${i+1}: ${JSON.stringify(err.detail)}`);
        return;
      }
    }
    alert(`Создано ${quantity} предмет(ов)`);
    closeModal('create');
    if (typeof loadLocationAndExits === 'function') loadLocationAndExits();
    if (typeof renderNpcsRight === 'function') renderNpcsRight();
    if (typeof renderPlayerStatus === 'function') renderPlayerStatus();
    return;
  } else if (type === 'object') {
    const name = document.getElementById('o_name')?.value.trim();
    const object_type = document.getElementById('o_type')?.value.trim();
    if (!name) { alert('Название обязательно'); return; }
    baseData = {
      name,
      object_type,
      description: document.getElementById('o_description')?.value.trim() || null,
      is_interactable: document.getElementById('o_interactable')?.checked || false,
      is_container: document.getElementById('o_container')?.checked || false
    };
    const quantity = parseInt(document.getElementById('o_quantity')?.value) || 1;
    for (let i = 0; i < quantity; i++) {
      const res = await fetch('/object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseData)
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Ошибка при создании объекта #${i+1}: ${JSON.stringify(err.detail)}`);
        return;
      }
    }
    alert(`Создано ${quantity} объект(ов)`);
    closeModal('create');
    if (typeof loadLocationAndExits === 'function') loadLocationAndExits();
    return;
  } else if (type === 'character_template') {
    const name = document.getElementById('c_name')?.value.trim();
    const surname = document.getElementById('c_surname')?.value.trim();
    if (!name || !surname) { alert('Имя и фамилия обязательны'); return; }
    baseData = {
      name,
      surname,
      patronymic: document.getElementById('c_patronymic')?.value.trim() || null,
      age: parseInt(document.getElementById('c_age')?.value) || 16,
      gender: document.getElementById('c_gender')?.value || 'женский',
      role: document.getElementById('c_role')?.value || 'npc',
      occupation: document.getElementById('c_occupation')?.value.trim() || null,
      personality: document.getElementById('c_personality')?.value.trim() || null
    };
    url = '/character_template';
  } else if (type === 'location_template') {
    const name = document.getElementById('l_name')?.value.trim();
    if (!name) { alert('Название обязательно'); return; }
    baseData = {
      name,
      type: document.getElementById('l_type')?.value.trim() || 'room',
      parent_id: document.getElementById('l_parent_id')?.value.trim() || null,
      address: document.getElementById('l_address')?.value.trim() || null,
      owner_id: document.getElementById('l_owner_id')?.value.trim() || null,
      description: document.getElementById('l_description')?.value.trim() || null,
      is_always_open: document.getElementById('l_is_always_open')?.checked || false,
      lock_type: parseInt(document.getElementById('l_lock_type')?.value) || 1
    };
    url = '/location_template';
  } else if (type === 'item_template') {
    const name = document.getElementById('i_name')?.value.trim();
    if (!name) { alert('Название обязательно'); return; }
    baseData = {
      name,
      item_type: document.getElementById('i_type')?.value.trim() || 'item',
      description: document.getElementById('i_description')?.value.trim() || null,
      layer: parseInt(document.getElementById('i_layer')?.value) || 0,
      is_dirty: document.getElementById('i_is_dirty')?.checked || false
    };
    url = '/item_template';
  } else if (type === 'object_template') {
    const name = document.getElementById('o_name')?.value.trim();
    if (!name) { alert('Название обязательно'); return; }
    baseData = {
      name,
      object_type: document.getElementById('o_type')?.value.trim() || 'object',
      description: document.getElementById('o_description')?.value.trim() || null,
      is_interactable: document.getElementById('o_interactable')?.checked || false,
      is_container: document.getElementById('o_container')?.checked || false
    };
    url = '/object_template';
  }

  if (baseData && url) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseData)
    });
    if (res.ok) {
      alert('Создано!');
      closeModal('create');
      if (typeof loadLocationAndExits === 'function') loadLocationAndExits();
      if (typeof renderNpcsRight === 'function') renderNpcsRight();
      if (typeof renderPlayerStatus === 'function') renderPlayerStatus();
    } else {
      const err = await res.json();
      alert('Ошибка: ' + JSON.stringify(err.detail));
    }
  }
}

async function submitEditForm() {
  const id = document.getElementById('edit-id')?.value;
  if (!id) return;
  let url = '';
  let formData = null;
  if (id.startsWith('pers_')) {
    formData = {
      name: document.getElementById('c_name').value.trim(),
      surname: document.getElementById('c_surname').value.trim(),
      patronymic: document.getElementById('c_patronymic').value.trim() || null,
      age: parseInt(document.getElementById('c_age').value),
      gender: document.getElementById('c_gender').value,
      role: document.getElementById('c_role').value,
      location_id: document.getElementById('c_location_id').value.trim(),
      occupation: document.getElementById('c_occupation').value.trim() || null,
      personality: document.getElementById('c_personality').value.trim() || null
    };
    url = `/character/${id}`;
  } else if (id.startsWith('loc_')) {
    formData = {
      name: document.getElementById('l_name').value.trim(),
      type: document.getElementById('l_type').value.trim(),
      parent_id: document.getElementById('l_parent_id').value.trim() || null,
      address: document.getElementById('l_address').value.trim() || null,
      owner_id: document.getElementById('l_owner_id').value.trim() || null,
      description: document.getElementById('l_description').value.trim() || null,
      is_always_open: document.getElementById('l_is_always_open').checked,
      lock_type: parseInt(document.getElementById('l_lock_type').value)
    };
    url = `/location/${id}`;
  } else if (id.startsWith('it_')) {
    formData = {
      name: document.getElementById('i_name').value.trim(),
      item_type: document.getElementById('i_type').value.trim(),
      description: document.getElementById('i_description').value.trim() || null,
      layer: parseInt(document.getElementById('i_layer').value) || 0,
      is_dirty: document.getElementById('i_is_dirty').checked || false
    };
    url = `/item/${id}`;
  } else if (id.startsWith('obj_')) {
    formData = {
      name: document.getElementById('o_name').value.trim(),
      object_type: document.getElementById('o_type').value.trim(),
      description: document.getElementById('o_description').value.trim() || null,
      is_interactable: document.getElementById('o_interactable').checked || false,
      is_container: document.getElementById('o_container').checked || false
    };
    url = `/object/${id}`;
  }
  if (formData && url) {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      alert('Изменения сохранены!');
      closeModal('edit');
      if (typeof loadLocationAndExits === 'function') loadLocationAndExits();
      if (typeof renderNpcsRight === 'function') renderNpcsRight();
      if (typeof renderPlayerStatus === 'function') renderPlayerStatus();
    } else {
      const err = await res.json();
      alert('Ошибка: ' + JSON.stringify(err.detail));
    }
  }
}

async function deleteEntity() {
  if (!confirm('Вы уверены, что хотите удалить?')) return;
  const id = document.getElementById('edit-id-display')?.textContent;
  if (!id) return;
  let url = '';
  if (id.startsWith('pers_')) url = `/character/${id}`;
  else if (id.startsWith('loc_')) url = `/location/${id}`;
  else if (id.startsWith('it_')) url = `/item/${id}`;
  else if (id.startsWith('obj_')) url = `/object/${id}`;
  else return;
  const res = await fetch(url, { method: 'DELETE' });
  if (res.ok) {
    alert('Удалено!');
    closeModal('edit');
    if (typeof loadLocationAndExits === 'function') loadLocationAndExits();
    if (typeof renderNpcsRight === 'function') renderNpcsRight();
  } else {
    const err = await res.json();
    alert('Ошибка: ' + JSON.stringify(err.detail));
  }
}

function closeModal(modalName) {
  document.getElementById(`modal-${modalName}`).style.display = 'none';
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

async function copyExistingItem() {
  const items = await safeFetch('/items') || [];
  if (!items.length) {
    alert('Нет предметов для копирования');
    return;
  }
  const options = items.map(i => 
    `<option value="${i.id}">${i.name} (${i.id}) — ${i.item_type}</option>`
  ).join('');
  const modalHtml = `
    <div id="copy-item-modal" class="modal" style="display:block;">
      <div class="modal-content">
        <span class="close" onclick="document.getElementById('copy-item-modal').remove()">&times;</span>
        <h3>📋 Выберите предмет для копирования</h3>
        <select id="copy-item-select" style="width:100%;margin:10px 0;">
          ${options}
        </select>
        <button onclick="applyCopiedItem()">Применить</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function applyCopiedItem() {
  const id = document.getElementById('copy-item-select').value;
  if (!id) return;
  fetch(`/item/${id}`)
    .then(r => r.json())
    .then(item => {
      delete item.id;
      delete item.current_location_id;
      delete item.current_object_id;
      delete item.current_holder_id;
      delete item.worn_by_id;
      delete item.dropped_by;
      item._quantity = 1;
      buildCreateForm('item', item);
      document.getElementById('copy-item-modal').remove();
    })
    .catch(e => alert('Ошибка загрузки: ' + e.message));
}

async function copyExistingObject() {
  const objects = await safeFetch('/objects') || [];
  if (!objects.length) return alert('Нет объектов');
  const options = objects.map(o => `<option value="${o.id}">${o.name} (${o.id})</option>`).join('');
  const modal = `
    <div id="copy-obj-modal" class="modal" style="display:block;">
      <div class="modal-content">
        <span class="close" onclick="document.getElementById('copy-obj-modal').remove()">&times;</span>
        <h3>Выберите объект для копирования</h3>
        <select id="copy-obj-select">${options}</select>
        <button onclick="applyCopiedObject()">Применить</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

function applyCopiedObject() {
  const id = document.getElementById('copy-obj-select').value;
  if (!id) return;
  fetch(`/object/${id}`)
    .then(r => r.json())
    .then(obj => {
      delete obj.id;
      delete obj.location_id;
      obj._quantity = 1;
      buildCreateForm('object', obj);
      document.getElementById('copy-obj-modal').remove();
    })
    .catch(e => alert('Ошибка загрузки: ' + e.message));
}

function applyTemplate(type) {
  const select = document.getElementById(`${type}_template_select`);
  const tplId = select.value;
  if (!tplId) return;
  fetch(`/item_template/${tplId}`) // временно только для item
    .then(r => r.json())
    .then(tpl => {
      if (type === 'item') {
        document.getElementById('i_name').value = tpl.name;
        document.getElementById('i_type').value = tpl.item_type;
        document.getElementById('i_description').value = tpl.description || '';
        document.getElementById('i_layer').value = tpl.layer || 0;
        document.getElementById('i_is_dirty').checked = tpl.is_dirty || false;
      }
      // TODO: реализовать для object, character, location
    })
    .catch(e => alert('Ошибка загрузки шаблона: ' + e.message));
}

// === ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ===

window.openCreateModal = openCreateModal;
window.buildCreateForm = buildCreateForm;
window.submitCreateForm = submitCreateForm;
window.openEditModal = openEditModal;
window.submitEditForm = submitEditForm;
window.deleteEntity = deleteEntity;
window.copyExistingItem = copyExistingItem;
window.applyCopiedItem = applyCopiedItem;
window.copyExistingObject = copyExistingObject;
window.applyCopiedObject = applyCopiedObject;
window.applyTemplate = applyTemplate;