const siteBody = document.getElementById('body-id');
const headline = document.getElementById('headline');
const answForm = document.getElementById('answ');
const buzzer = document.getElementById('buzzer');
const ServerMessage = document.getElementById('msg-block');
const idDisplay = document.getElementById('your-id');

// Get username from url
const urlParams = new URLSearchParams(location.search);
const username = urlParams.get('username') ? urlParams.get('username') : 'Namenloser';
// window.history.replaceState('', 'Quiz-Tool - screetox', '/');
headline.innerHTML = `Hallo, ${username}!`;

const socket = io();

// Login
socket.emit('login', username);
socket.on('sendID', id => {
    idDisplay.innerHTML = id;
});

// Server error
socket.on('server-error', () => {
    location.href = "/?msg=Server%20Error!%20Bitte%20wende%20dich%20an%20den%20Administrator%20unter%20business@screetox.de";
});

// Message from server
socket.on('welcomeMessage', message => {
    console.log(message.text);
});

// Message from server
socket.on('messageFromServer', message => {
    console.log(message);
    outputServerMessage(message.text);
});

// Message submit
answForm.addEventListener('input', (e) => {
    // Get Text from Input
    const answ = e.target.value;

    // Emit a message to the server
    socket.emit('newAnswer', answ);
});

function outputServerMessage(msg) {
    document.getElementById('msg-block').style.display = 'block';
    const div = document.createElement('div');
    div.classList.add('server-msg');
    div.innerHTML = msg;
    ServerMessage.insertBefore(div, ServerMessage.firstChild);

    setTimeout(function() {
        ServerMessage.removeChild(ServerMessage.lastChild);
    }, 300000);
}

function buzz() {
    buzzer.style.background = 'var(--dark-color-b)';
}