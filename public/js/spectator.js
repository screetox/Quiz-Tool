const headline = document.getElementById('headline');
const chooseRoom = document.getElementById('choose-room');
const activeRooms = document.getElementById('show-active-rooms');
const ServerMessage = document.getElementById('msg-block-quizmaster');
const candidateAnswers = document.getElementById('candidate-answers');
const candidateAnswersForm = document.getElementById('answers-form');

const candidates = [];
const username = 'Spectator';
// window.history.replaceState('', 'Quiz-Tool - screetox', '/');
headline.innerHTML = `Hallo, ${username}!`;

const socket = io();

// Login
socket.emit('login-spectator', username);
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
        if (activeRoomNames[i].length > 25) {
            const cutRoomname = activeRoomNames[i].substring(0, 22);
            const buttonDiv = document.createElement('div');
            buttonDiv.innerHTML = `<button class="btn" id="${i}-btn" onclick="joinRoom(${i})" title="${activeRoomNames[i]}">${cutRoomname}...</button>`;
            const modalDiv = document.createElement('div');
            modalDiv.innerHTML = `
                <div id="${i}-modal" class="modal">
                    <div class="modal-content">
                        <span class="close" id="${i}-close">&times;</span>
                        <label for="${i}-pw">Passwort für ${cutRoomname}...:</label>
                        <input id="${i}-pw" type="password" />
                        <button class="btn" onclick="logIntoRoom(${i})">Los geht's!</button>
                    </div>
                </div>`;
            activeRooms.appendChild(buttonDiv);
            activeRooms.appendChild(modalDiv);
        } else {
            const buttonDiv = document.createElement('div');
            buttonDiv.innerHTML = `<button class="btn" id="${i}-btn" onclick="joinRoom(${i})" title="${activeRoomNames[i]}">${activeRoomNames[i]}</button>`;
            const modalDiv = document.createElement('div');
            modalDiv.innerHTML = `
                <div id="${i}-modal" class="modal">
                    <div class="modal-content">
                        <span class="close" id="${i}-close">&times;</span>
                        <label for="${i}-pw">Passwort für ${activeRoomNames[i]}:</label>
                        <input id="${i}-pw" type="password" />
                        <button class="btn" onclick="logIntoRoom(${i})">Los geht's!</button>
                    </div>
                </div>`;
            activeRooms.appendChild(buttonDiv);
            activeRooms.appendChild(modalDiv);
        }
    }
});

socket.on('loginTryAnswer', (bool, roomname) => {
    if (bool) {
        clearMessages();
        if (roomname.length > 25) {
            const cutRoomname = roomname.substring(0, 22);
            document.getElementById('room-title').innerHTML = `Raum: ${cutRoomname}...`;
        } else {
            document.getElementById('room-title').innerHTML = `Raum: ${roomname}`;
        }
        chooseRoom.style.display = 'none';
        candidateAnswersForm.style.display = 'block';
        socket.emit('getCandidates', roomname);
    } else {
        outputServerMessage(`Falsches Passwort für ${roomname}.`);
    }
});

socket.on('sendCandidates', (cands, points, answers) => {
    clearCandidates();

    for (let i = 0; i < cands.length; i++) {
        candidates.push(cands[i]);
    }

    for (let i = 0; i < candidates.length; i++) {
        const pointsDiv = document.createElement('div');
        const answerDiv = document.createElement('div');
        pointsDiv.innerHTML = `
            <div style="width:44px;height:32px;"></div>
            <input id="${candidates[i].id}-points" type="number" value="${points[i]}" title="${points[i]}" readonly />`;
        pointsDiv.classList.add('candidate-points');
        answerDiv.innerHTML = `
            <label for="${candidates[i].id}" title="${candidates[i].username}:">${candidates[i].username}:<br></label>
            <input id="${candidates[i].id}" type="text" value="${answers[i]}" title="${answers[i]}" readonly />`;
        answerDiv.classList.add('candidate-answer', 'inline-block-label');
        candidateAnswers.appendChild(pointsDiv);
        candidateAnswers.appendChild(answerDiv);
    }
});

socket.on('newAnswerToMaster', message => {
    const answField = document.getElementById(`${message.id}`);
    if (answField) {
        answField.value = message.text;
        answField.title = message.text;
    }
});

socket.on('newPointsToAll', (message) => {
    const ptsField = document.getElementById(`${message.id}-points`);
    if (ptsField) {
        ptsField.value = message.text;
        ptsField.title = message.text;
    }
});

socket.on('newCandidate', (roomname) => {
    socket.emit('getCandidates', roomname);
});

socket.on('leavingCandidate', (roomname) => {
    socket.emit('getCandidates', roomname);
});

function reloadRooms() {
    if (activeRooms.firstChild) {
        activeRooms.removeChild(activeRooms.firstChild);
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
    var roomname = document.getElementById(`${roomnumber}-btn`).title;
    var password = document.getElementById(`${roomnumber}-pw`).value;
    document.getElementById(`${roomnumber}-pw`).value = '';
    document.getElementById(`${roomnumber}-btn`).blur();

    modal.style.display = "none";
    socket.emit('loginTry', roomname, password);
}

function outputServerMessage(msg) {
    ServerMessage.style.display = 'block';
    const div = document.createElement('div');
    div.classList.add('server-msg');
    div.innerHTML = msg;
    ServerMessage.appendChild(div);

    setTimeout(function() {
        if (ServerMessage.firstChild) {
            ServerMessage.removeChild(ServerMessage.firstChild);
        }
    }, 60000);
}

function clearCandidates() {
    candidates.length = 0;
    if (candidateAnswers.firstChild) {
        candidateAnswers.removeChild(candidateAnswers.firstChild);
        clearCandidates();
    }
}

function clearMessages() {
    if (ServerMessage.firstChild) {
        ServerMessage.removeChild(ServerMessage.firstChild);
        clearMessages();
    }
}

window.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if (chooseRoom.style.display != "none") {
            var elements = document.getElementsByClassName('modal');
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].style.display == "block") {
                    logIntoRoom(`${i}`);
                }
            }
        }
    }
});