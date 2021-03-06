const headline = document.getElementById('headline');
const answForm = document.getElementById('answ');
const buzzer = document.getElementById('buzzer');
const ServerMessage = document.getElementById('msg-block');
const activeRooms = document.getElementById('show-active-rooms');
const chooseRoom = document.getElementById('choose-room');
const candidateForm = document.getElementById('candidate-form');
const sideboard = document.getElementById('sideboard');
const enemyPoints = document.getElementById('enemy-points');

var roomname = '';
var audio = new Audio('https://screetox.de/files/sounds/buzzer.mp3');
var audioPlayed = false;
// Get username from url
const urlParams = new URLSearchParams(location.search);
const username = urlParams.get('username') ? urlParams.get('username') : 'Namenloser';
headline.innerHTML = `Hallo, ${username}!`;
// window.history.replaceState('', 'Quiz-Tool - screetox', '/');
const socket = io();

// Login
socket.emit('login', username);
socket.emit('getActiveRooms');

// Exit application and show server error
socket.on('server-error', () => {
    location.href = '/?msg=Server%20Error!%20Bitte%20wende%20dich%20an%20den%20Administrator%20unter%20business@screetox.de';
});

// Log welcomeMessage from server; message = {id = str, text = str, time = str}
socket.on('welcomeMessage', (message) => {
    console.log(message.text);
});

//Log message from server; message = {id = str, text = str, time = str}
socket.on('messageFromServer', (message) => {
    console.log(message);
    outputServerMessage(message.text);
});

// Get active rooms from server and print buttons to join; activeRoomNames = [str]
socket.on('sendActiveRoomNames', (activeRoomNames) => {
    for (let i = 0; i < activeRoomNames.length; i++) {
        if (activeRoomNames[i].length > 25) {
            const cutRoomname = activeRoomNames[i].substring(0, 22);
            const buttonDiv = document.createElement('div');
            buttonDiv.innerHTML = `<button class="btn" id="${i}-btn" onclick="joinRoom(${i})" title="${activeRoomNames[i]}">${cutRoomname}...</button>`;
            const modalDiv = document.createElement('div');
            modalDiv.innerHTML = `
                <div id="${i}-modal" class="modal">
                    <div class="modal-content">
                        <span class="close" id="${i}-close">&times;</span>
                        <label for="${i}-pw">Passwort f??r ${cutRoomname}...:</label>
                        <input id="${i}-pw" type="password" />
                        <button class="btn" onclick="logIntoRoom(${i})">Los geht's!</button>
                    </div>
                </div>`;
            activeRooms.appendChild(buttonDiv);
            activeRooms.appendChild(modalDiv);
        }
        else {
            const buttonDiv = document.createElement('div');
            buttonDiv.innerHTML = `<button class="btn" id="${i}-btn" onclick="joinRoom(${i})" title="${activeRoomNames[i]}">${activeRoomNames[i]}</button>`;
            const modalDiv = document.createElement('div');
            modalDiv.innerHTML = `
                <div id="${i}-modal" class="modal">
                    <div class="modal-content">
                        <span class="close" id="${i}-close">&times;</span>
                        <label for="${i}-pw">Passwort f??r ${activeRoomNames[i]}:</label>
                        <input id="${i}-pw" type="password" />
                        <button id="${i}-lets-go" class="btn" onclick="logIntoRoom(${i})">Los geht's!</button>
                    </div>
                </div>`;
            activeRooms.appendChild(buttonDiv);
            activeRooms.appendChild(modalDiv);
        }
    }
});

// Get answer to login try from server and login or display message; bool = bool
socket.on('loginTryAnswer', (bool) => {
    if (bool) {
        clearMessages();
        if (this.roomname.length > 25) {
            const cutRoomname = this.roomname.substring(0, 22);
            document.getElementById('room-title').innerHTML = `Raum: ${cutRoomname}...`;
        } else {
            document.getElementById('room-title').innerHTML = `Raum: ${this.roomname}`;
        }
        document.getElementById('room-title').title = `Raum: ${this.roomname}`;
        chooseRoom.style.display = 'none';
        candidateForm.style.display = 'block';
        sideboard.style.display = 'flex';
    } else {
        outputServerMessage(`Falsches Passwort f??r ${this.roomname}.`);
        reloadRooms();
    }
});

// get points from all candidates and display in sidebar; allCandidates = [str], allPoints = [number]
socket.on('sendEnemyPoints', (allCandidates, allPoints) => {
    clearPoints();
    for (let i = 0; i < allPoints.length; i++) {
        const div = document.createElement('div');
        div.innerHTML = `<p class="enemy-name" title="${allCandidates[i].username}">${allCandidates[i].username}</p>
                         <p class="enemy-point" title="${allPoints[i]}">${allPoints[i]}</p>`;

        if (allCandidates[i].id === socket.id) {
            div.classList.add('own-point');
        } else {
            div.classList.add('enemy-points-grid');
        }

        enemyPoints.appendChild(div);
    }
});

// Get new question count from server; count = number
socket.on('newQuestionCountToAll', (count) => {
    const cntField = document.getElementById(`question-count`);
    if (cntField) {
        cntField.innerHTML = `${count}`;
        cntField.title = `${count}`;
    }
});

// other buzzing
socket.on('sendBuzzed', (user) => {
    const buzzer = document.getElementById('buzzer');
    if (user.id === socket.id) {
        buzzer.innerHTML = `Du hast<br>gebuzzert!`;
    } else {
        if (!(audioPlayed)) {audio.play();}
        if (user.username.length > 8) {
            const cutName = user.username.substring(0, 6)
            buzzer.innerHTML = `${cutName}...<br>hat gebuzzert!`;
        } else {
            buzzer.innerHTML = `${user.username}<br>hat gebuzzert!`;
        }
    }
    buzzer.disabled = true;
});

// Activate/Deactivate buzzer
socket.on('activateBuzzer', () => {
    const buzzer = document.getElementById('buzzer');
    buzzer.disabled = false;
    buzzer.innerHTML = 'Buzzer!';
});
socket.on('deactivateBuzzer', () => {
    const buzzer = document.getElementById('buzzer');
    buzzer.disabled = true;
    buzzer.innerHTML = 'Buzzer!<br><span>(inactive)</span>';
});

// Free buzzer
socket.on('freeBuzzer', (unlockMoment) => {
    const now = moment().valueOf();
    const timeLeft = unlockMoment - now;
    const waitTime = timeLeft < 300 ? timeLeft : 300;

    setTimeout(function() {
        const buzzer = document.getElementById('buzzer');
        buzzer.innerHTML = 'Buzzer!';
        buzzer.disabled = false;
    }, waitTime);
});

// Message submit
answForm.addEventListener('input', (e) => {
    // Get Text from Input
    const answ = e.target.value;
    e.target.title = answ;
    // Emit a message to the server
    socket.emit('newAnswer', this.roomname, answ);
});

// Output messages from server and delete after 60 seconds; msg = str
function outputServerMessage(msg) {
    ServerMessage.style.display = 'block';
    const div = document.createElement('div');
    div.classList.add('server-msg');
    div.innerHTML = msg;
    ServerMessage.appendChild(div);

    setTimeout(function() {
        ServerMessage.removeChild(ServerMessage.firstChild);
    }, 60000);
}

// Reload list of active rooms to join
function reloadRooms() {
    if (activeRooms.firstChild) {
        activeRooms.removeChild(activeRooms.firstChild);
        reloadRooms();
    } else {
        socket.emit('getActiveRooms');
    }
}

// Open modal for password input to join selected room; roomnumber = str
function joinRoom(roomnumber) {
    var modal = document.getElementById(`${roomnumber}-modal`);
    var span = document.getElementById(`${roomnumber}-close`);
    if (modal.style.display == 'block') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'block';
    }
    span.onclick = function() {
        modal.style.display = 'none';
    }
}

// Try to log into room with password; roomnumber = str
function logIntoRoom(roomnumber) {
    var modal = document.getElementById(`${roomnumber}-modal`);
    this.roomname = document.getElementById(`${roomnumber}-btn`).title;
    var password = document.getElementById(`${roomnumber}-pw`).value;
    document.getElementById(`${roomnumber}-pw`).value = '';
    document.getElementById(`${roomnumber}-btn`).blur();

    modal.style.display = 'none';
    socket.emit('loginTry', this.roomname, password);
}

// Clear points shown in sidebar
function clearPoints() {
    if (enemyPoints.firstChild) {
        enemyPoints.removeChild(enemyPoints.firstChild);
        clearPoints();
    }
}

// Clear all messages shown from server
function clearMessages() {
    if (ServerMessage.firstChild) {
        ServerMessage.removeChild(ServerMessage.firstChild);
        clearMessages();
    }
}

// self buzzing
function buzz() {
    const buzzer = document.getElementById('buzzer');
    if (!(buzzer.disabled)) {
        audio.play();
        audioPlayed = true;
        setTimeout(function() {audioPlayed = false;}, 600);
        const momentBuzzed = moment();
        socket.emit('newBuzz', this.roomname, momentBuzzed);
        buzzer.disabled = true;
        buzzer.innerHTML = '...';
    }
}

// reconnect to server
socket.on('reloadPage', () => {
    location.reload();
});

// Listen for 'Enter'-keypress and try to login if a password modal is active
window.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if (chooseRoom.style.display != 'none') {
            var elements = document.getElementsByClassName('modal');
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].style.display == 'block') {
                    logIntoRoom(`${i}`);
                }
            }
        } else if (candidateForm.style.display != 'none') {
            buzz();
        }
    }
    if (event.key === ' ') {
        if ((candidateForm.style.display != 'none') && (this.document.activeElement != answForm)) {
            buzz();
        }
    }
});
