const headline = document.getElementById('headline');
const idDisplay1 = document.getElementById('your-id-1');
const idDisplay2 = document.getElementById('your-id-2');
const siteBody = document.getElementById('body-id-stream');
const ServerMessage = document.getElementById('msg-block');
const candidateInput = document.getElementById('candidate-input');
const candidateInputForm = document.getElementById('input-form-stream');
const candidateAnswers = document.getElementById('candidate-answers-stream');

const candidates = [];

// Get username from url
const urlParams = new URLSearchParams(location.search);
const username = 'Stream-Overlay';
siteBody.style.padding = '20px';

const socket = io();

// Login
socket.emit('login-stream-overlay', username);

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
    candidateAnswers.style.display = 'grid';

    for (let i = 0; i < candidates.length; i++) {
        const candidateId = document.getElementById(`cand${i}`).value;
        const candidateName = `candidate${i}`;
        candidates[i] = { candidateId, candidateName };
    }
    socket.emit('getCandidateNames', candidates);
}

socket.on('giveCandidateNames', (candidates, answers) => {
            for (let i = 0; i < candidates.length; i++) {
                const pointsDiv = document.createElement('div');
                const answerDiv = document.createElement('div');
                pointsDiv.innerHTML = `<div class="candidate-points-stream">
            <input id="${i}-points" class="candidate-answer-huge" type="number" value="0" readonly />
        </div>`;
                answerDiv.innerHTML = `<div class="candidate-answer">
            <label for="${candidates[i].candidateId}">${candidates[i].candidateName}:<br></label>
            <div>
                <input id="${candidates[i].candidateId}" class="candidate-answer-huge" type="text" value="${answers[i]}" readonly />
                <img class="settings-btn" id="cand${i}-btn" src="img/settings.png" width="30" height="30" alt="settings" onclick="openSettings(${i})" />
            </div>
            <div id="cand${i}-modal" class="modal">
                <div class="modal-content-stream">
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

socket.on('newAnswerToMaster', message => {
    const answField = document.getElementById(`${message.id}`);
    if (answField) {
        answField.value = message.text;
    }
});

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