// chat.js — чат с ИИ

// Отправка сообщения игроком
async function sendChatMessage() {
  const inputEl = document.getElementById('player-input');
  const message = inputEl?.value.trim();
  if (!message || !currentNpcId) {
    alert('Выберите NPC и введите сообщение.');
    return;
  }

  const chatLog = document.getElementById('chat-log');
  if (!chatLog) return;

  // Отображаем сообщение игрока
  chatLog.textContent += `\nИгрок: ${message}`;
  inputEl.value = '';
  chatLog.scrollTop = chatLog.scrollHeight;

  // Отправляем запрос к ИИ
  try {
    const res = await fetch('/npc/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ npc_id: currentNpcId, player_message: message })
    });

    const data = await res.json();
    const aiResponse = data.dialogue || '...';

    // Отображаем ответ ИИ
    chatLog.textContent += `\n${aiResponse}\n`;
  } catch (e) {
    chatLog.textContent += `\n[Ошибка чата: ${e.message}]\n`;
  }

  chatLog.scrollTop = chatLog.scrollHeight;
}

// Инициализация обработчиков
document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById('send-btn');
  const inputEl = document.getElementById('player-input');

  if (sendBtn) {
    sendBtn.addEventListener('click', sendChatMessage);
  }

  if (inputEl) {
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChatMessage();
    });
  }
});