const chooseRoom = document.getElementById('choose-stream-room');
const activeRooms = document.getElementById('show-active-rooms');
const ServerMessage = document.getElementById('msg-block-stream');
const candidateAnswers = document.getElementById('candidate-answers-stream');
const candidateAnswersForm = document.getElementById('answers-form-stream');

const candidates = [];
const username = 'Stream-Overlay';
var roomname = '';
const socket = io();

// Login and get active rooms
socket.emit('login-stream-overlay', username);
socket.emit('getActiveRooms');

// Log server error
socket.on('server-error', () => {
    console.log('Server Error! Bitte wende dich an den Administrator unter business@screetox.de');
});

// Log welcomeMessage from server; message = {id = str, text = str, time = str}
socket.on('welcomeMessage', (message) => {
    console.log(message.text);
});

//Log message from server; message = {id = str, text = str, time = str}
socket.on('messageFromServer', (message) => {
    console.log(message);
});

// Get active rooms from server and print buttons to join; activeRoomNames = [str]
socket.on('sendActiveRoomNames', (activeRoomNames) => {
    for (let i = 0; i < activeRoomNames.length; i++) {
        if (activeRoomNames[i].length > 25) {
            const cutRoomname = activeRoomNames[i].substring(0, 22);
            const buttonDiv = document.createElement('div');
            buttonDiv.innerHTML = `<button class="btn-stream" id="${i}-btn" onclick="joinRoom(${i})" title="${activeRoomNames[i]}">${cutRoomname}...</button>`;
            const modalDiv = document.createElement('div');
            modalDiv.innerHTML = `
                <div id="${i}-modal" class="modal-stream">
                    <div class="modal-content-stream">
                        <span class="close" id="${i}-close">&times;</span>
                        <label for="${i}-pw">Passwort für ${cutRoomname}...:</label>
                        <input id="${i}-pw" type="password" />
                        <button class="btn-stream" onclick="logIntoRoom(${i})">Los geht's!</button>
                    </div>
                </div>`;
            activeRooms.appendChild(buttonDiv);
            activeRooms.appendChild(modalDiv);
        } else {
            const buttonDiv = document.createElement('div');
            buttonDiv.innerHTML = `<button class="btn-stream" id="${i}-btn" onclick="joinRoom(${i})" title="${activeRoomNames[i]}">${activeRoomNames[i]}</button>`;
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
        chooseRoom.style.display = 'none';
        candidateAnswersForm.style.display = 'block';
        document.getElementById('question-count').style.display = 'block';
        document.getElementById('headline-stream').style.marginLeft = '110px';
        socket.emit('getCandidates', this.roomname);
    } else {
        outputServerMessage(`Falsches Passwort für ${this.roomname}.`);
        reloadRooms();
    }
});

// buzzing
socket.on('sendBuzzed', (user) => {
    const answField = document.getElementById(`${user.id}`);
    if (answField) {answField.parentElement.classList.add('i-buzzed-stream');}
});
socket.on('deactivateBuzzer', () => {
    const isBuzzed = document.querySelectorAll('.i-buzzed-stream');
    isBuzzed.forEach((div) => {
        div.classList.remove('i-buzzed-stream');
    });
});
socket.on('freeBuzzer', (unlockMoment) => {
    const now = moment().valueOf();
    const timeLeft = unlockMoment - now;
    const waitTime = timeLeft < 300 ? timeLeft : 300;

    setTimeout(function() {
        const isBuzzed = document.querySelectorAll('.i-buzzed-stream');
        isBuzzed.forEach((div) => {
            div.classList.remove('i-buzzed-stream');
        });
    }, waitTime);
});

// Get candidates from current room from server amd print current points and answers; cands = [str], points = [number], answers = [str], userBuzzedId = str
socket.on('sendCandidates', (cands, points, answers, questionCount, userBuzzedId) => {
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

    const cntField = document.getElementById(`question-count`);
    if (cntField) {cntField.value = questionCount;}

    const answField = document.getElementById(`${userBuzzedId}`);
    if (answField) {answField.parentElement.classList.add('i-buzzed-stream');}
});

// Get new candidate answer from server; message = {id = str, text = str, time = str}
socket.on('newAnswerToMaster', (message) => {
    const answField = document.getElementById(`${message.id}`);
    if (answField) {
        answField.value = message.text;
    }
});

// Get new candidate points from server; message = {id = str, text = str, time = str}
socket.on('newPointsToAll', (message) => {
    const ptsField = document.getElementById(`${message.id}-points`);
    if (ptsField) {
        ptsField.value = message.text;
    }
});

// Get new question count from server; count = number
socket.on('newQuestionCountToAll', (count) => {
    const cntField = document.getElementById(`question-count`);
    if (cntField) {
        cntField.value = count;
    }
});

// New candidate joined the room, ask for new render of candidates
socket.on('newCandidate', () => {
    socket.emit('getCandidates', this.roomname);
});

// Candidate left the room, ask for new render of candidates
socket.on('leavingCandidate', () => {
    socket.emit('getCandidates', this.roomname);
});

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
    socket.emit('streamOverlayLoginTry', this.roomname, password);
}

// Move the selected answer and points to the top most position in the list; idx = number
function moveUp(idx) {
    var answMove = document.getElementById(`${idx}-answer-div`);
    var ptsMove = document.getElementById(`${idx}-points-div`);

    var parent = answMove.parentNode;
    parent.insertBefore(answMove, parent.firstChild);
    parent.insertBefore(ptsMove, parent.firstChild);
}

// Output messages from server and delete after 60 seconds; msg = str
function outputServerMessage(msg) {
    ServerMessage.style.display = 'block';
    const div = document.createElement('div');
    div.classList.add('server-msg');
    div.innerHTML = msg;
    ServerMessage.appendChild(div);

    setTimeout(function() {
        if (ServerMessage.firstChild) {ServerMessage.removeChild(ServerMessage.firstChild);}
    }, 60000);
}

// Clear candidate list and all points and answers displayed
function clearCandidates() {
    candidates.length = 0;
    if (candidateAnswers.firstChild) {
        candidateAnswers.removeChild(candidateAnswers.firstChild);
        clearCandidates();
    }
}

// reconnect to server
socket.on('reloadPage', () => {
    location.reload();
});

// Clear all messages shown from server
function clearMessages() {
    if (ServerMessage.firstChild) {
        ServerMessage.removeChild(ServerMessage.firstChild);
        clearMessages();
    }
}
