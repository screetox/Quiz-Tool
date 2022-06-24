const siteBody = document.getElementById('body-id');
const headline = document.getElementById('headline');
const answForm = document.getElementById('answ');
const buzzer = document.getElementById('buzzer');
const ServerMessage = document.getElementById('msg-block');
const activeRooms = document.getElementById('show-active-rooms');
const chooseRoom = document.getElementById('choose-room');
const candidateForm = document.getElementById('candidate-form');

// Get username from url
const urlParams = new URLSearchParams(location.search);
const username = urlParams.get('username') ? urlParams.get('username') : 'Namenloser';
// window.history.replaceState('', 'Quiz-Tool - screetox', '/');
headline.innerHTML = `Hallo, ${username}!`;

const socket = io();

// Login
socket.emit('login', username);
socket.emit('getActiveRooms');

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

socket.on('sendActiveRoomNames', (activeRoomNames) => {
    for (let i = 0; i < activeRoomNames.length; i++) {
        const buttonDiv = document.createElement('div');
        buttonDiv.innerHTML = `<button class="btn" id="${i}-btn" onclick="joinRoom(${i})">${activeRoomNames[i]}</button>`;
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = `
            <div id="${i}-modal" class="modal">
                <div class="modal-content">
                    <span class="close" id="${i}-close">&times;</span>
                    <label for="${i}-pw">Passwort für ${activeRoomNames[i]}:</label>
                    <input id="${i}-pw" type="password" />
                    <button class="btn quizmaster-button" onclick="logIntoRoom(${i})">Los geht's!</button>
                </div>
            </div>`;
        activeRooms.appendChild(buttonDiv);
        activeRooms.appendChild(modalDiv);
    }
});

socket.on('loginTryAnswer', (bool, roomname) => {
    if (bool) {
        document.getElementById('room-title').innerHTML = `Raum: ${roomname}`;
        chooseRoom.style.display = 'none';
        candidateForm.style.display = 'block';
    } else {
        outputServerMessage(`Falsches Passwort für ${roomname}.`);
    }
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
    ServerMessage.appendChild(div);

    setTimeout(function() {
        ServerMessage.removeChild(ServerMessage.lastChild);
    }, 60000);
}

function reloadRooms() {
    if (activeRooms.firstChild) {
        activeRooms.removeChild(activeRooms.lastChild);
        reloadRooms();
    } else {
        socket.emit('getActiveRooms');
    }
}

function joinRoom(roomnumber) {
    var modal = document.getElementById(`${roomnumber}-modal`);
    var span = document.getElementById(`${roomnumber}-close`);
    if (modal.style.display == "block") {
        modal.style.display = "none";
    } else {
        modal.style.display = "block";
    }
    span.onclick = function() {
        modal.style.display = "none";
    }
}

function logIntoRoom(roomnumber) {
    var modal = document.getElementById(`${roomnumber}-modal`);
    var roomname = document.getElementById(`${roomnumber}-btn`).innerHTML;
    var password = document.getElementById(`${roomnumber}-pw`).value;
    document.getElementById(`${roomnumber}-pw`).value = '';

    modal.style.display = "none";
    socket.emit('loginTry', roomname, password);
}

function buzz() {
    buzzer.style.background = 'var(--dark-color-b)';
}