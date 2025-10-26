// core.js
window.currentLocationId = 'loc_vestibule'; // ← ИСПРАВЛЕНО: старт в вестибюле
window.currentNpcId = null;

async function safeFetch(url, errorMsg = 'Ошибка запроса') {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`${errorMsg}: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error(`${errorMsg}:`, e);
    return null;
  }
}

async function safePost(url, data, successMsg = 'Успешно') {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      alert(successMsg);
      return await res.json();
    } else {
      const err = await res.json();
      alert(`Ошибка: ${JSON.stringify(err.detail)}`);
      return null;
    }
  } catch (e) {
    alert(`Ошибка: ${e.message}`);
    return null;
  }
}