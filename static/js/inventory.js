// inventory.js — управление инвентарём в модальном окне

async function fetchPlayerInventory() {
  const res = await fetch('/player/inventory');
  if (!res.ok) throw new Error('Ошибка загрузки инвентаря');
  return await res.json();
}

async function renderInventory() {
  const list = document.getElementById('inventory-list');
  if (!list) {
    console.warn('Элемент #inventory-list не найден');
    return;
  }

  try {
    const inventory = await fetchPlayerInventory();
    
    if (inventory.length === 0) {
      list.innerHTML = '<p>Инвентарь пуст</p>';
      return;
    }

    // Сортируем: сначала надетое (по layer), потом остальное
    const sorted = [...inventory].sort((a, b) => {
      const aWorn = a.worn_by_id ? 1 : 0;
      const bWorn = b.worn_by_id ? 1 : 0;
      if (aWorn !== bWorn) return bWorn - aWorn; // надетое — выше
      if (aWorn && bWorn) return (a.layer || 0) - (b.layer || 0); // по слою
      return 0;
    });

    let html = '';
    for (const item of sorted) {
      const isWorn = item.worn_by_id;
      const layerInfo = isWorn ? ` (слой ${item.layer})` : '';
      const dirtyIcon = item.is_dirty ? ' 🧺' : '';
      const wearBtn = isWorn 
        ? `<button onclick="wearItem('${item.id}', false)">Снять</button>`
        : `<button onclick="wearItem('${item.id}', true)">Надеть</button>`;
      const dropBtn = `<button class="btn-danger" onclick="dropItemOnFloor('${item.id}')">→ На пол</button>`;

      html += `
        <div style="padding:8px; border-bottom:1px solid #eee; font-size:14px;">
          <strong>${item.name}</strong>${layerInfo}${dirtyIcon}<br>
          <em>${item.description || ''}</em><br>
          ${wearBtn} ${dropBtn}
        </div>
      `;
    }

    list.innerHTML = html;
  } catch (e) {
    console.error('Ошибка загрузки инвентаря:', e);
    list.innerHTML = `<p>Ошибка: ${e.message}</p>`;
  }
}

// Надеть/снять одежду
async function wearItem(itemId, wear) {
  const res = await fetch(`/item/${itemId}/wear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wear: wear })
  });
  if (res.ok) {
    renderInventory(); // обновить список
  } else {
    alert('Ошибка смены одежды');
  }
}

// Выбросить предмет НА ПОЛ текущей локации (не удалять!)
async function dropItemOnFloor(itemId) {
  if (!confirm('Выбросить предмет на пол текущей локации?')) return;
  const res = await fetch(`/item/${itemId}/drop_on_floor`, { method: 'POST' });
  if (res.ok) {
    renderInventory();
  } else {
    alert('Ошибка выбрасывания');
  }
}

// Экспорт для глобального доступа
window.renderInventory = renderInventory;
window.wearItem = wearItem;
window.dropItemOnFloor = dropItemOnFloor;