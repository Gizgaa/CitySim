// search.js — поиск сущностей

async function performSearch() {
  const query = document.getElementById('search-query').value.trim();
  if (!query) return;

  const resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = '<p>Поиск...</p>';

  try {
    let results = [];
    if (query.startsWith('pers_') || query.startsWith('loc_')) {
      const res = await fetch(`/${query.startsWith('pers_') ? 'character' : 'location'}/${query}`);
      if (res.ok) results = [await res.json()];
    } else {
      const [chars, locs] = await Promise.all([
        fetch('/characters').then(r => r.json()),
        fetch('/locations').then(r => r.json())
      ]);
      const q = query.toLowerCase();
      results = [
        ...chars.filter(c => (c.name && c.name.toLowerCase().includes(q)) || (c.surname && c.surname.toLowerCase().includes(q))),
        ...locs.filter(l => l.name && l.name.toLowerCase().includes(q))
      ];
    }

    if (results.length === 0) {
      resultsDiv.innerHTML = '<p>Ничего не найдено.</p>';
    } else {
      resultsDiv.innerHTML = results.map(item => {
        const id = item.id;
        const name = item.name || id;
        const type = id.startsWith('pers_') ? 'Персонаж' : 'Локация';
        return `<div onclick="openEditModal('${id}')" title="${id}" style="padding:6px;cursor:pointer;border-bottom:1px solid #eee;">
          [${id}] ${name} (${type})
        </div>`;
      }).join('');
    }
  } catch (e) {
    resultsDiv.innerHTML = `<p>Ошибка: ${e.message}</p>`;
  }
}