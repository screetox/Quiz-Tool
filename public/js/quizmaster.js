const headline = document.getElementById('headline');
const ServerMessage = document.getElementById('msg-block-quizmaster');
const roomInputForm = document.getElementById('input-form');
const candidateAnswers = document.getElementById('candidate-answers');
const candidateAnswersForm = document.getElementById('answers-form');

const candidates = [];

// Get username from url
const urlParams = new URLSearchParams(location.search);
const username = urlParams.get('username') ? urlParams.get('username') : 'Namenloser';
// window.history.replaceState('', 'Quiz-Tool - screetox', '/');
headline.innerHTML = `Hallo, ${username}!`;

const socket = io();

// Login
socket.emit('login-as-quizmaster', username);

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

function startQuiz() {
    if (document.getElementById('roomname').value) {
        roomname = document.getElementById('roomname').value;
        password = document.getElementById('password').value;

        clearMessages();
        document.getElementById('empty-roomname').style.display = 'none';
        document.getElementById('room-title').innerHTML = `Raum: ${roomname}`;

        socket.emit('createRoom', roomname, password);
    } else {
        document.getElementById('empty-roomname').style.display = 'block';
    }
}

socket.on('newCandidate', (roomname) => {
    socket.emit('getCandidates', roomname);
    socket.emit('getEnemyPoints');
});

socket.on('leavingCandidate', (roomname) => {
    socket.emit('getCandidates', roomname);
    socket.emit('getEnemyPoints');
});

function addPoint(candidate) {
    var counter = document.getElementById(`${candidate}-points`).value;
    var counter_new = Number(counter) + 1;
    document.getElementById(`${candidate}-points`).value = `${counter_new}`;
    document.getElementById(`${candidate}-points`).title = `${counter_new}`;
    socket.emit('newPoints', candidates[candidate], counter_new);
    socket.emit('getEnemyPoints');
}

function subPoint(candidate) {
    var counter = document.getElementById(`${candidate}-points`).value;
    var counter_new = Number(counter) - 1;
    document.getElementById(`${candidate}-points`).value = `${counter_new}`;
    document.getElementById(`${candidate}-points`).title = `${counter_new}`;
    socket.emit('newPoints', candidates[candidate], counter_new);
    socket.emit('getEnemyPoints');
}

function addPointToAll() {
    for (let i = 0; i < candidates.length; i++) {
        var counter = document.getElementById(`${i}-points`).value;
        var counter_new = Number(counter) + 1;
        document.getElementById(`${i}-points`).value = `${counter_new}`;
        document.getElementById(`${i}-points`).title = `${counter_new}`;
        socket.emit('newPoints', candidates[i], counter_new);
    };
    socket.emit('getEnemyPoints');
}

function subPointToAll() {
    for (let i = 0; i < candidates.length; i++) {
        var counter = document.getElementById(`${i}-points`).value;
        var counter_new = Number(counter) - 1;
        document.getElementById(`${i}-points`).value = `${counter_new}`;
        document.getElementById(`${i}-points`).title = `${counter_new}`;
        socket.emit('newPoints', candidates[i], counter_new);
    };
    socket.emit('getEnemyPoints');
}

function allPointsToZero() {
    for (let i = 0; i < candidates.length; i++) {
        var counter_new = 0;
        document.getElementById(`${i}-points`).value = `${counter_new}`;
        document.getElementById(`${i}-points`).title = `${counter_new}`;
        socket.emit('newPoints', candidates[i], counter_new);
    };
    socket.emit('getEnemyPoints');
    document.getElementById('allPointsToZero-modal').style.display = 'none';
}

function askForAllPointsToZero() {
    const modal = document.getElementById('allPointsToZero-modal');
    var span = document.getElementById(`allPointsToZero-close`);
    if (modal.style.display == "block") {
        modal.style.display = "none";
    } else {
        modal.style.display = "block";
    }
    span.onclick = function() {
        modal.style.display = "none";
    }
}

socket.on('sendCandidates', (cands, points, answers) => {
    clearCandidates();
    roomInputForm.style.display = 'none';
    candidateAnswersForm.style.display = 'block';

    for (let i = 0; i < cands.length; i++) {
        candidates.push(cands[i]);
    }

    for (let i = 0; i < candidates.length; i++) {
        const pointsDiv = document.createElement('div');
        const answerDiv = document.createElement('div');
        pointsDiv.innerHTML = `
            <button id="${i}-points-plus" onclick="addPoint(${i})">+ 1</button>
            <input id="${i}-points" type="number" value="${points[i]}" title="${points[i]}" />
            <button id="${i}-points-minus" onclick="subPoint(${i})">- 1</button>`;
        pointsDiv.classList.add('candidate-points');
        answerDiv.innerHTML = `
            <label for="${candidates[i].id}" title="${candidates[i].username}:">${candidates[i].username}:<br></label>
            <input id="${candidates[i].id}" type="text" value="${answers[i]}" title="${answers[i]}" readonly />`;
        answerDiv.classList.add('candidate-answer', 'inline-block-label');

        pointsDiv.addEventListener('input', (e) => {
            // Get Number from Input
            const pts = Number(e.target.value);
            e.target.title = `${pts}`;
            // Emit a message to the server
            socket.emit('newPoints', candidates[i], pts);
            socket.emit('getEnemyPoints');
        });

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