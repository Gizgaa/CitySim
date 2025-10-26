// inventory.js — управление инвентарём в модальном окне

async function fetchPlayerInventory() {
  console.log('Запрос инвентаря...');
  const res = await fetch('/player/inventory');
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  console.log('Инвентарь получен:', data);
  return data;
}

async function renderInventory() {
  const list = document.getElementById('inventory-list');
  if (!list) {
    console.error('❌ Элемент #inventory-list не найден в DOM!');
    return;
  }

  try {
    const inventory = await fetchPlayerInventory();
    console.log('✅ Инвентарь загружен:', inventory);

    if (inventory.length === 0) {
      list.innerHTML = '<p>Инвентарь пуст</p>';
      return;
    }

    const sorted = [...inventory].sort((a, b) => {
      const aWorn = a.worn_by_id ? 1 : 0;
      const bWorn = b.worn_by_id ? 1 : 0;
      if (aWorn !== bWorn) return bWorn - aWorn;
      if (aWorn && bWorn) return (a.layer || 0) - (b.layer || 0);
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
      const dropBtn = `<button class="btn-danger" onclick="dropItem('${item.id}')">Выкинуть</button>`;

      html += `
        <div style="padding:8px; border-bottom:1px solid #eee; font-size:14px;">
          <strong>${item.name}</strong>${layerInfo}${dirtyIcon}<br>
          <em>${item.description || ''}</em><br>
          ${wearBtn} ${dropBtn}
        </div>
      `;
    }

    list.innerHTML = html;
    console.log('✅ Инвентарь отображён в DOM');
  } catch (e) {
    console.error('❌ Ошибка загрузки инвентаря:', e);
    list.innerHTML = `<p>Ошибка: ${e.message}</p>`;
  }
}

// Надеть/снять одежду
async function wearItem(itemId, wear) {
  const url = `/item/${itemId}/wear`;
  const res = await fetch(url, {
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

// Выбросить предмет
async function dropItem(itemId) {
  if (!confirm('Выкинуть предмет?')) return;
  const res = await fetch(`/item/${itemId}`, { method: 'DELETE' });
  if (res.ok) {
    renderInventory();
  } else {
    alert('Ошибка удаления');
  }
}

// Экспорт для глобального доступа
window.renderInventory = renderInventory;
window.wearItem = wearItem;
window.dropItem = dropItem;