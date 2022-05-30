const siteBody = document.getElementById('body-id');
const headline = document.getElementById('headline');
const idDisplay1 = document.getElementById('your-id-1');
const idDisplay2 = document.getElementById('your-id-2');
const ServerMessage = document.getElementById('msg-block');
const candidateInput = document.getElementById('candidate-input');
const candidateAnswers = document.getElementById('candidate-answers');
const candidateInputForm = document.getElementById('input-form');
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

// Disconnect Message
socket.on('disconnectMessage', (id, message) => {
    for (let i = 0; i < candidates.length; i++) {
        if (id === candidates[i].candidateId) {
            console.log(message);
            outputServerMessage(message.text);
        }
    }
});

function addCandidate() {
    const div = document.createElement('div');
    div.innerHTML = `<label for="cand${candidates.length}">Kandidat ${candidates.length + 1}:</label>
    <input id="cand${candidates.length}" type="text" placeholder="Eindeutige ID eingeben..." />`;
    candidateInput.appendChild(div);
    const candidateName = `candidate${candidates.length}`;
    const placeheolderId = 0;
    const newCandidate = { placeheolderId, candidateName };
    candidates.push(newCandidate);
}

function startQuiz() {
    candidateInputForm.style.display = 'none';
    candidateAnswersForm.style.display = 'block';

    for (let i = 0; i < candidates.length; i++) {
        const candidateId = document.getElementById(`cand${i}`).value;
        const candidateName = `candidate${i}`;
        candidates[i] = { candidateId, candidateName };
    }
    socket.emit('getCandidateNames', candidates);
}

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

socket.on('giveCandidateNames', (candidates, answers) => {
            for (let i = 0; i < candidates.length; i++) {
                const pointsDiv = document.createElement('div');
                const answerDiv = document.createElement('div');
                pointsDiv.innerHTML = `<div class="candidate-points">
            <button id="${i}-points-plus" onclick="addPoint(${i})">+1</button>
            <input id="${i}-points" type="number" value="0" readonly />
            <button id="${i}-points-minus" onclick="subPoint(${i})">-1</button>
        </div>`;
                answerDiv.innerHTML = `<div class="candidate-answer">
            <label for="${candidates[i].candidateId}">${candidates[i].candidateName}:<br></label>
            <div>
                <input id="${candidates[i].candidateId}" type="text" value="${answers[i]}" readonly />
                <img class="settings-btn" id="cand${i}-btn" src="img/settings.png" width="30" height="30" alt="settings" onclick="openSettings(${i})" />
            </div>
            <div id="cand${i}-modal" class="modal">
                <div class="modal-content">
                    <span class="close" id="cand${i}-close">&times;</span>
                    <label for="changeCand${i}">Neue eindeutige ID für <strong>${candidates[i].candidateName}</strong>:</label>
                    <input id="changeCand${i}" type="text" value="${document.getElementById(`cand${i}`).value}" />
                    <button class="btn quizmaster-button" onclick="changeCand(${i})">Speichern</button>
                </div>
            </div>
        </div>`;
        candidateAnswers.appendChild(pointsDiv);
        candidateAnswers.appendChild(answerDiv);
    }
});

socket.on('sendID', id => {
    idDisplay1.innerHTML = id;
    idDisplay2.innerHTML = id;
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
    div.classList.add('quizmaster-msg');
    div.innerHTML = msg;
    ServerMessage.insertBefore(div, ServerMessage.firstChild);

    setTimeout(function() {
        ServerMessage.removeChild(ServerMessage.lastChild);
    }, 300000);
}

function openSettings(i) {
    var modal = document.getElementById(`cand${i}-modal`);
    var span = document.getElementById(`cand${i}-close`);
    if (modal.style.display == "block") {
        modal.style.display = "none";
    } else {
        modal.style.display = "block";
    }
    span.onclick = function() {
        modal.style.display = "none";
    }
}

function changeCand(i) {
    const newId = document.getElementById(`changeCand${i}`).value;
    document.getElementById(`cand${i}`).value = newId;

    candidateAnswers.innerHTML = '';
    startQuiz();
}