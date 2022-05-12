const headline = document.getElementById('headline');
const answForm = document.getElementById('answ');
const ServerMessage = document.getElementById('msg-block');
const candidateInput = document.getElementById('candidate-input');
const candidateAnswers = document.getElementById('candidate-answers');
const candidateInputForm = document.getElementById('input-form');
const candidateAnswersForm = document.getElementById('answers-form');

const candidates = [];

// Get username from url
const urlParams = new URLSearchParams(location.search);
const username = urlParams.get('username');
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

function addCandidate() {
    const div = document.createElement('div');
    div.innerHTML = `<label for="cand${candidates.length}">Kandidat ${candidates.length + 1}:</label>
    <input id="cand${candidates.length}" type="text" placeholder="Eindeutige ID eingeben..." />`;
    candidateInput.appendChild(div);
    const candidateName = `candidate${candidates.length}`;
    const placeheolderId = 0;
    const newCandidate = { placeheolderId, candidateName };
    candidates.push(newCandidate);
    console.log(candidates);
}

function startQuiz() {
    candidateInputForm.style.display = 'none';
    candidateAnswersForm.style.display = 'block';

    for (let i = 0; i < candidates.length; i++) {
        const candidateId = document.getElementById(`cand${i}`).value;
        const candidateName = `candidate${i}`;
        candidates[i] = { candidateId, candidateName };
    }
    console.log(candidates);

    socket.emit('getCandidateNames', candidates);
}

socket.on('giveCandidateNames', (candidates) => {
    for (let i = 0; i < candidates.length; i++) {
        const div = document.createElement('div');
        div.innerHTML = `<label for="answ${i}">${candidates[i].candidateName}:</label>
        <input id="${candidates[i].candidateId}" type="text" readonly />`;
        candidateAnswers.appendChild(div);
    }

    console.log(candidates);
});

socket.on('newAnswerToMaster', message => {
    const answField = document.getElementById(`${message.id}`);
    answField.value = message.text;
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