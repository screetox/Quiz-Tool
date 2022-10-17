const headline = document.getElementById('headline');
const roomTitle = document.getElementById('room-title');
const quizImage = document.getElementById('quiz-image');
const chooseRoom = document.getElementById('choose-room');
const imageModal = document.getElementById('image-modal');
const sharedImage = document.getElementById('shared-image');
const quizImageBig = document.getElementById('quiz-image-big');
const activeRooms = document.getElementById('show-active-rooms');
const ServerMessage = document.getElementById('msg-block-quizmaster');
const candidateAnswersForm = document.getElementById('answers-form-spectator');
const candidateAnswers = document.getElementById('candidate-answers-spectator');
const bigImagePlaceholder = document.getElementById('quiz-image-big-placeholder');

const candidates = [];
const username = 'Spectator';
var roomname = '';
var audio = new Audio('https://screetox.de/files/sounds/buzzer.mp3');
headline.innerHTML = `Hallo, ${username}!`;
// window.history.replaceState('', 'Quiz-Tool - screetox', '/');
const socket = io();

// Login and get active rooms
socket.emit('login-spectator', username);
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

// Get answer to login try from server and login or display message; bool = bool
socket.on('loginTryAnswer', (bool) => {
    if (bool) {
        clearMessages();
        if (this.roomname.length > 25) {
            const cutRoomname = this.roomname.substring(0, 22);
            roomTitle.innerHTML = `Raum: ${cutRoomname}...`;
        } else {
            roomTitle.innerHTML = `Raum: ${this.roomname}`;
        }
        roomTitle.title = `Raum: ${this.roomname}`;
        chooseRoom.style.display = 'none';
        candidateAnswersForm.style.display = 'block';
        document.getElementById('sideboard-image').style.display = 'flex';
        socket.emit('getCandidates', this.roomname);
    } else {
        outputServerMessage(`Falsches Passwort für ${this.roomname}.`);
        reloadRooms();
    }
});

// buzzing
socket.on('sendBuzzed', (user) => {
    audio.play();
    const ptsField = document.getElementById(`${user.id}-points`);
    if (ptsField) {ptsField.parentElement.classList.add('i-buzzed');}
});
socket.on('deactivateBuzzer', () => {
    const isBuzzed = document.querySelectorAll('.i-buzzed');
    isBuzzed.forEach((div) => {
        div.classList.remove('i-buzzed');
    });
});
socket.on('freeBuzzer', (unlockMoment) => {
    const now = moment().valueOf();
    const timeLeft = unlockMoment - now;
    const waitTime = timeLeft < 300 ? timeLeft : 300;

    setTimeout(function() {
        const isBuzzed = document.querySelectorAll('.i-buzzed');
        isBuzzed.forEach((div) => {
            div.classList.remove('i-buzzed');
        });
    }, waitTime);
});

// Get candidates from current room from server amd print current points and answers; cands = [str], points = [number], ansers = [str], userBuzzedId = str
socket.on('sendCandidates', (cands, points, answers, lockedAnswers, questionCount, userBuzzedId) => {
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
        pointsDiv.classList.add('candidate-points-spectator');
        answerDiv.innerHTML = `
            <label for="${candidates[i].id}" title="${candidates[i].username}">${candidates[i].username}:</label>
            <input id="${candidates[i].id}" type="text" value="${answers[i]}" title="${answers[i]}" readonly />`;
        answerDiv.classList.add('candidate-answer', 'inline-block-label');
        candidateAnswers.appendChild(pointsDiv);
        candidateAnswers.appendChild(answerDiv);
    }

    const ptsField = document.getElementById(`${userBuzzedId}-points`);
    if (ptsField) {ptsField.parentElement.classList.add('i-buzzed');}
});

// Get new candidate answer from server; message = {id = str, text = str, time = str}
socket.on('newAnswerToMaster', (message) => {
    const answField = document.getElementById(`${message.id}`);
    if (answField) {
        answField.value = message.text;
        answField.title = message.text;
    }
});

// Get new candidate points from server; message = {id = str, text = str, time = str}
socket.on('newPointsToAll', (message) => {
    const ptsField = document.getElementById(`${message.id}-points`);
    if (ptsField) {
        ptsField.value = message.text;
        ptsField.title = message.text;
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
    socket.emit('loginTry', this.roomname, password);
}

// Display uploaded file
socket.on('image-uploaded', (message) => {
    quizImage.src = message.name;
    quizImageBig.src = message.name;
});

// Show picture
socket.on('showPicture', () => {
    quizImage.style.opacity = '1';
    quizImageBig.style.opacity = '1';
    sharedImage.style.backgroundImage = 'url()';
    bigImagePlaceholder.style.opacity = '0';
});

// Hide picture
socket.on('hidePicture', () => {
    quizImage.style.opacity = '0';
    quizImageBig.style.opacity = '0';
    sharedImage.style.backgroundImage = 'url(/img/placeholder-quiz-tool.jpg';
    bigImagePlaceholder.style.opacity = '1';
});

// Big view of image
function openImage() {
    imageModal.style.opacity = '1';
    imageModal.style.zIndex = 2;
    quizImageBig.style.zIndex = 2;
}

// Big view of image
function closeImage() {
    imageModal.style.opacity = '0';
    imageModal.style.zIndex = -1;
    quizImageBig.style.zIndex = -1;
}

// Output messages from server and delete after 60 seconds; msg = str
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

// Clear candidate list and all points and answers displayed
function clearCandidates() {
    candidates.length = 0;
    if (candidateAnswers.firstChild) {
        candidateAnswers.removeChild(candidateAnswers.firstChild);
        clearCandidates();
    }
}

// Clear all messages shown from server
function clearMessages() {
    if (ServerMessage.firstChild) {
        ServerMessage.removeChild(ServerMessage.firstChild);
        clearMessages();
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
        }
    }
});
