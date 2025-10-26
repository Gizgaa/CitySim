// editor.js — полный редактор мира: создание, редактирование, удаление

// === СОЗДАНИЕ ===

function openCreateModal(type) {
  document.getElementById('create-type').value = type;
  buildCreateForm(type, null); // data = null → окно создания
  document.getElementById('modal-create').style.display = 'block';
}

async function submitCreateForm() {
  const type = document.getElementById('create-type')?.value;
  if (!type) return;

  let data = null;
  let url = '';
  let successMsg = '';

  if (type === 'character') {
    const name = document.getElementById('c_name')?.value.trim();
    const surname = document.getElementById('c_surname')?.value.trim();
    if (!name || !surname) { alert('Имя и фамилия обязательны'); return; }
    data = {
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
    successMsg = 'Персонаж создан!';
  } else if (type === 'location') {
    const name = document.getElementById('l_name')?.value.trim();
    if (!name) { alert('Название обязательно'); return; }
    data = {
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
    successMsg = 'Локация создана!';
  }

  if (data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      alert(successMsg);
      closeModal('create');
      // Обновить интерфейс
      if (typeof loadLocationAndExits === 'function') loadLocationAndExits();
      if (typeof renderNpcsRight === 'function') renderNpcsRight();
    } else {
      const err = await res.json();
      alert('Ошибка: ' + JSON.stringify(err.detail));
    }
  }
}

// === РЕДАКТИРОВАНИЕ ===

function openEditModal(id) {
  if (!id) return;
  if (id.startsWith('pers_')) {
    fetch(`/character/${id}`)
      .then(r => r.json())
      .then(char => {
        buildCreateForm('character', char);
        document.getElementById('edit-id-display').textContent = id;
        document.getElementById('modal-edit').style.display = 'block';
      })
      .catch(e => alert('Ошибка загрузки персонажа: ' + e.message));
  } else if (id.startsWith('loc_')) {
    fetch(`/location/${id}`)
      .then(r => r.json())
      .then(loc => {
        buildCreateForm('location', loc);
        document.getElementById('edit-id-display').textContent = id;
        document.getElementById('modal-edit').style.display = 'block';
      })
      .catch(e => alert('Ошибка загрузки локации: ' + e.message));
  }
}

function buildCreateForm(type, data = null) {
  // Определяем, для какого окна строим форму
  const isEdit = data !== null;
  const containerId = isEdit ? 'edit-form-container' : 'create-form-container';
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error('Контейнер формы не найден:', containerId);
    return;
  }

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
      ${isEdit ? `<input type="hidden" id="edit-id" value="${data.id}">` : ''}
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
      ${isEdit ? `<input type="hidden" id="edit-id" value="${data.id}">` : ''}
      <label>Название: <input type="text" id="l_name" value="${name}" required></label>
      <label>Тип: <input type="text" id="l_type" value="${typeVal}" required></label>
      <label>Родитель (ID): <input type="text" id="l_parent_id" value="${parent_id}" placeholder="loc_..."></label>
      <label>Адрес: <input type="text" id="l_address" value="${address}"></label>
      <label>Владелец (ID): <input type="text" id="l_owner_id" value="${owner_id}" placeholder="pers_... или loc_..."></label>
      <label>Описание: <textarea id="l_description" rows="3">${description}</textarea></label>
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
  }

  container.innerHTML = html;
}

// === СОХРАНЕНИЕ ИЗМЕНЕНИЙ ===

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

// === УДАЛЕНИЕ ===

async function deleteEntity() {
  if (!confirm('Вы уверены, что хотите удалить?')) return;

  const id = document.getElementById('edit-id-display')?.textContent;
  if (!id) return;

  let url = '';
  if (id.startsWith('pers_')) url = `/character/${id}`;
  else if (id.startsWith('loc_')) url = `/location/${id}`;
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

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function closeModal(modalName) {
  document.getElementById(`modal-${modalName}`).style.display = 'none';
}