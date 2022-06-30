const chooseRoom = document.getElementById('choose-stream-room');
const activeRooms = document.getElementById('show-active-rooms');
const ServerMessage = document.getElementById('msg-block-stream');
const candidateAnswers = document.getElementById('candidate-answers-stream');
const candidateAnswersForm = document.getElementById('answers-form-stream');

const candidates = [];

// Get username from url
const urlParams = new URLSearchParams(location.search);
const username = 'Stream-Overlay';

const socket = io();

// Login
socket.emit('login-stream-overlay', username);
socket.emit('getActiveRooms');

// Server error
socket.on('server-error', () => {
    console.log('Server Error! Bitte wende dich an den Administrator unter business@screetox.de');
});

// Message from server
socket.on('welcomeMessage', message => {
    console.log(message.text);
});

// Message from server
socket.on('messageFromServer', message => {
    console.log(message);
});

socket.on('sendActiveRoomNames', (activeRoomNames) => {
    for (let i = 0; i < activeRoomNames.length; i++) {
        const buttonDiv = document.createElement('div');
        buttonDiv.innerHTML = `<button class="btn-stream" id="${i}-btn" onclick="joinRoom(${i})">${activeRoomNames[i]}</button>`;
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = `
            <div id="${i}-modal" class="modal-stream">
                <div class="modal-content-stream">
                    <span class="close" id="${i}-close">&times;</span>
                    <label for="${i}-pw">Passwort für ${activeRoomNames[i]}:</label>
                    <input id="${i}-pw" type="password" />
                    <button class="btn-stream" onclick="logIntoRoom(${i})">Los geht's!</button>
                </div>
            </div>`;
        activeRooms.appendChild(buttonDiv);
        activeRooms.appendChild(modalDiv);
    }
});

socket.on('loginTryAnswer', (bool, roomname) => {
    if (bool) {
        clearMessages();
        document.getElementById('room-title').innerHTML = `Raum: ${roomname}`;
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
            <button id="${i}-points-plus" onclick="moveUp(${i})">^</button>
            <input id="${candidates[i].id}-points" type="number" value="${points[i]}" readonly />`;
        pointsDiv.classList.add('candidate-points-stream', 'candidate-answer-huge');
        pointsDiv.id = `${i}-points-div`;
        answerDiv.innerHTML = `
            <label for="${candidates[i].id}">${candidates[i].username}:<br></label>
            <input id="${candidates[i].id}" type="text" value="${answers[i]}" readonly />`;
        answerDiv.classList.add('candidate-answer', 'candidate-answer-huge', 'inline-block-label');
        answerDiv.id = `${i}-answer-div`;
        candidateAnswers.appendChild(pointsDiv);
        candidateAnswers.appendChild(answerDiv);
    }
});

socket.on('newAnswerToMaster', message => {
    const answField = document.getElementById(`${message.id}`);
    if (answField) {
        answField.value = message.text;
    }
});

socket.on('newPointsToAll', (message) => {
    const ptsField = document.getElementById(`${message.id}-points`);
    if (ptsField) {
        ptsField.value = message.text;
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
    var roomname = document.getElementById(`${roomnumber}-btn`).innerHTML;
    var password = document.getElementById(`${roomnumber}-pw`).value;
    document.getElementById(`${roomnumber}-pw`).value = '';

    modal.style.display = "none";
    socket.emit('streamOverlayLoginTry', roomname, password);
}

function moveUp(idx) {
    var answMove = document.getElementById(`${idx}-answer-div`);
    var ptsMove = document.getElementById(`${idx}-points-div`);

    var parent = answMove.parentNode;
    parent.insertBefore(answMove, parent.firstChild);
    parent.insertBefore(ptsMove, parent.firstChild);
}

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