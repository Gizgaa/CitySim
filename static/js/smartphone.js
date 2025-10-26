// smartphone.js — управление смартфоном и приложениями

// Открытие модального окна (приложения)
function openApp(appName) {
  const modal = document.getElementById(`modal-${appName}`);
  if (modal) {
    modal.style.display = 'block';
    // Отложенный рендер для инвентаря
    if (appName === 'inventory') {
      setTimeout(() => {
        if (typeof renderInventory === 'function') {
          renderInventory();
        }
      }, 50); // даём время на отображение DOM
    }
  }
}

// Закрытие модального окна
function closeApp(appName) {
  const modal = document.getElementById(`modal-${appName}`);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Закрытие по клику вне модального окна
document.addEventListener('click', (e) => {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

// Закрытие по нажатию Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
  }
});

// Инициализация: скрыть все модальные окна при загрузке
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
});