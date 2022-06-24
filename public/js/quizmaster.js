const siteBody = document.getElementById('body-id');
const headline = document.getElementById('headline');
const ServerMessage = document.getElementById('msg-block');
const candidateInput = document.getElementById('create-room');
const candidateAnswers = document.getElementById('candidate-answers');
const candidateInputForm = document.getElementById('input-form');
const candidateAnswersForm = document.getElementById('answers-form');

const candidates = [];
var dontSpam = true;
var roomname = '';
var password = '';

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
});

function addPoint(candidate) {
    var counter = document.getElementById(`${candidate}-points`).value;
    var counter_new = Number(counter) + 1;
    document.getElementById(`${candidate}-points`).value = `${counter_new}`;
}

function subPoint(candidate = '') {
    var counter = document.getElementById(`${candidate}-points`).value;
    var counter_new = Number(counter) - 1;
    document.getElementById(`${candidate}-points`).value = `${counter_new}`;
}

socket.on('sendCandidates', (candidates, points, answers) => {
    clearCandidates();
    console.log('sent:');
    console.log(candidates);
    candidateInputForm.style.display = 'none';
    candidateAnswersForm.style.display = 'block';

    for (let i = 0; i < candidates.length; i++) {
        if (candidates[i].id !== socket.id) {
            const pointsDiv = document.createElement('div');
            const answerDiv = document.createElement('div');
            pointsDiv.innerHTML = `
                <div class="candidate-points">
                    <button id="${i}-points-plus" onclick="addPoint(${i})">+1</button>
                    <input id="${i}-points" type="number" value="${points[i]}" readonly />
                    <button id="${i}-points-minus" onclick="subPoint(${i})">-1</button>
                </div>`;
            answerDiv.innerHTML = `
                <div class="candidate-answer">
                    <label for="${candidates[i].id}">${candidates[i].username}:<br></label>
                    <input id="${candidates[i].id}" type="text" value="${answers[i]}" readonly />
                </div>`;
            candidateAnswers.appendChild(pointsDiv);
            candidateAnswers.appendChild(answerDiv);
        }
    }
});

socket.on('newAnswerToMaster', message => {
    const answField = document.getElementById(`${message.id}`);
    if (answField) {
        answField.value = message.text;
    }
});

function outputServerMessage(msg) {
    document.getElementById('msg-block').style.display = 'block';
    const div = document.createElement('div');
    div.classList.add('server-msg');
    div.innerHTML = msg;
    ServerMessage.appendChild(div);

    setTimeout(function() {
        if (ServerMessage.firstChild) {
            ServerMessage.removeChild(ServerMessage.lastChild);
        }
    }, 60000);
}

function clearCandidates() {
    if (candidateAnswers.firstChild) {
        candidateAnswers.removeChild(candidateAnswers.lastChild);
        clearCandidates();
    }
}

function clearMessages() {
    if (ServerMessage.firstChild) {
        ServerMessage.removeChild(ServerMessage.lastChild);
        clearMessages();
    }
}