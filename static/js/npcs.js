// npcs.js — список NPC с поддержкой редактирования

async function fetchNpcsInLocation(locId) {
  return await safeFetch(`/characters?location_id=${locId}`, 'NPC');
}

async function renderNpcsRight() {
  const npcs = await fetchNpcsInLocation(window.currentLocationId);
  const list = document.getElementById('npc-list-right');

  if (!list) return;

  if (!npcs || npcs.length === 0) {
    list.innerHTML = '<li>Никого нет</li>';
    return;
  }

  list.innerHTML = npcs.map(npc => {
    const fullName = `${npc.name} ${npc.surname || ''}`.trim();
    return `<li data-npc-id="${npc.id}" title="ID: ${npc.id}" style="cursor:pointer;" onclick="openEditModal('${npc.id}')">
      ${fullName} (${npc.role})
    </li>`;
  }).join('');
}