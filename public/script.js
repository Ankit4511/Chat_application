// public/script.js
let ws;
let currentRoom = 'general';
let username = '';

function joinChat() {
  username = document.getElementById('username').value.trim();
  if (!username) return;

  ws = new WebSocket(`ws://${location.host}`);
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'get-rooms' }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'error') {
      document.getElementById('error').textContent = data.message;
      return;
    }

    if (data.type === 'rooms') {
      updateRoomList(data.rooms);
    }

    if (data.type === 'system' || data.type === 'message') {
      const msgArea = document.getElementById('messages');
      const div = document.createElement('div');
      div.innerHTML = data.type === 'message'
        ? `<b>${data.username}</b> [${data.timestamp}]: ${formatText(data.message)}`
        : `<i>${data.message}</i>`;
      msgArea.appendChild(div);
      msgArea.scrollTop = msgArea.scrollHeight;
    }
  };

  ws.onclose = () => alert('Disconnected from server');

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: 'join', username, room: currentRoom }));
    document.getElementById('login').style.display = 'none';
    document.getElementById('chat').style.display = 'flex';
  });
}

function sendMessage() {
  const input = document.getElementById('message-input');
  const msg = input.value.trim();
  if (!msg) return;
  ws.send(JSON.stringify({ type: 'message', message: msg }));
  input.value = '';
}

function createRoom() {
  const newRoom = document.getElementById('new-room').value.trim();
  if (newRoom) {
    ws.send(JSON.stringify({ type: 'create-room', room: newRoom }));
    document.getElementById('new-room').value = '';
  }
}

function updateRoomList(rooms) {
  const ul = document.getElementById('room-list');
  ul.innerHTML = '';
  rooms.forEach(room => {
    const li = document.createElement('li');
    li.textContent = room;
    li.onclick = () => switchRoom(room);
    ul.appendChild(li);
  });
}

function switchRoom(room) {
  if (room === currentRoom) return;
  currentRoom = room;
  document.getElementById('messages').innerHTML = '';
  ws.send(JSON.stringify({ type: 'join', username, room }));
}

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")       // **bold**
    .replace(/\*(.*?)\*/g, "<i>$1</i>")           // *italic*
    .replace(/(https?:\/\/[^\s]+)/g, "<a href='$1' target='_blank'>$1</a>"); // links
}
