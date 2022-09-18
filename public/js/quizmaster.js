const headline = document.getElementById('headline');
const ServerMessage = document.getElementById('msg-block-quizmaster');
const roomInputForm = document.getElementById('input-form');
const candidateAnswers = document.getElementById('candidate-answers');
const candidateAnswersForm = document.getElementById('answers-form');

const candidates = [];
var timeoutsRoomname = [];
var timeoutsPassword = [];
var roomname = '';
var password = '';
var buzzedUser = '';
var firstBuzzer = true;
var audio = new Audio('https://screetox.de/files/sounds/buzzer.mp3');
// Get username from url
const urlParams = new URLSearchParams(location.search);
const username = urlParams.get('username') ? urlParams.get('username') : 'Namenloser';
headline.innerHTML = `Hallo, ${username}!`;
// window.history.replaceState('', 'Quiz-Tool - screetox', '/');
const socket = io();

// Login
socket.emit('login-as-quizmaster', username);

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

// If roomname is provided: create room and show quiz main; if not: show error
function startQuiz() {
    if (document.getElementById('roomname').value) {
        this.roomname = document.getElementById('roomname').value;
        this.password = document.getElementById('password').value;

        clearMessages();
        document.getElementById('empty-roomname').style.display = 'none';
        if (this.roomname.length > 25) {
            const cutRoomname = this.roomname.substring(0, 22);
            document.getElementById('room-title').innerHTML = `Raum: ${cutRoomname}...`;
        } else {
            document.getElementById('room-title').innerHTML = `Raum: ${this.roomname}`;
        }
        if (this.password != '') {
            document.getElementById('room-title').title = `Raum: ${this.roomname}\n\nPasswort: ${this.password}`;
        } else {
            document.getElementById('room-title').title = `Raum: ${this.roomname}`;
        }

        socket.emit('createRoom', this.roomname, this.password);
    } else {
        document.getElementById('empty-roomname').style.display = 'block';
    }
}

// New candidate joined the room, ask for new render of candidates
socket.on('newCandidate', () => {
    socket.emit('getCandidates', this.roomname);
    socket.emit('getEnemyPoints', this.roomname);
});

// Candidate left the room, ask for new render of candidates
socket.on('leavingCandidate', () => {
    socket.emit('getCandidates', this.roomname);
    socket.emit('getEnemyPoints', this.roomname);
});

// Add count to question count and inform server
function addQuestionCount() {
    var counter = document.getElementById('question-count').value;
    var counter_new = Number(counter) + 1;
    document.getElementById('question-count').value = `${counter_new}`;
    document.getElementById('question-count').title = `${counter_new}`;
    socket.emit('newQuestionCount', this.roomname, counter_new);
}

// Sub count from question count and inform server
function subQuestionCount() {
    var counter = document.getElementById('question-count').value;
    var counter_new = Number(counter) - 1;
    document.getElementById('question-count').value = `${counter_new}`;
    document.getElementById('question-count').title = `${counter_new}`;
    socket.emit('newQuestionCount', this.roomname, counter_new);
}

// Add point to candidate and inform server; candidate = number
function addPoint(candidate) {
    var counter = document.getElementById(`${candidate}-points`).value;
    var counter_new = Number(counter) + 1;
    document.getElementById(`${candidate}-points`).value = `${counter_new}`;
    document.getElementById(`${candidate}-points`).title = `${counter_new}`;
    socket.emit('newPoints', this.roomname, candidates[candidate], counter_new);
    socket.emit('getEnemyPoints', this.roomname);
}

// Add point to candidate and inform server; candidate = number
function add3Point(candidate) {
    var counter = document.getElementById(`${candidate}-points`).value;
    var counter_new = Number(counter) + 3;
    document.getElementById(`${candidate}-points`).value = `${counter_new}`;
    document.getElementById(`${candidate}-points`).title = `${counter_new}`;
    socket.emit('newPoints', this.roomname, candidates[candidate], counter_new);
    socket.emit('getEnemyPoints', this.roomname);
}

// Sub point from candidate and inform server; candidate = number
function subPoint(candidate) {
    var counter = document.getElementById(`${candidate}-points`).value;
    var counter_new = Number(counter) - 1;
    document.getElementById(`${candidate}-points`).value = `${counter_new}`;
    document.getElementById(`${candidate}-points`).title = `${counter_new}`;
    socket.emit('newPoints', this.roomname, candidates[candidate], counter_new);
    socket.emit('getEnemyPoints', this.roomname);
}

// Sub point from candidate and inform server; candidate = number
function sub3Point(candidate) {
    var counter = document.getElementById(`${candidate}-points`).value;
    var counter_new = Number(counter) - 3;
    document.getElementById(`${candidate}-points`).value = `${counter_new}`;
    document.getElementById(`${candidate}-points`).title = `${counter_new}`;
    socket.emit('newPoints', this.roomname, candidates[candidate], counter_new);
    socket.emit('getEnemyPoints', this.roomname);
}

// Add point to all candidates and inform server
function addPointToAll() {
    for (let i = 0; i < candidates.length; i++) {
        var counter = document.getElementById(`${i}-points`).value;
        var counter_new = Number(counter) + 1;
        document.getElementById(`${i}-points`).value = `${counter_new}`;
        document.getElementById(`${i}-points`).title = `${counter_new}`;
        socket.emit('newPoints', this.roomname, candidates[i], counter_new);
    };
    socket.emit('getEnemyPoints', this.roomname);
}

// Sub point from all candidates and inform server
function subPointToAll() {
    for (let i = 0; i < candidates.length; i++) {
        var counter = document.getElementById(`${i}-points`).value;
        var counter_new = Number(counter) - 1;
        document.getElementById(`${i}-points`).value = `${counter_new}`;
        document.getElementById(`${i}-points`).title = `${counter_new}`;
        socket.emit('newPoints', this.roomname, candidates[i], counter_new);
    };
    socket.emit('getEnemyPoints', this.roomname);
}

// Set points from all candidates to 0 and inform server
function allPointsToZero() {
    for (let i = 0; i < candidates.length; i++) {
        var counter_new = 0;
        document.getElementById(`${i}-points`).value = `${counter_new}`;
        document.getElementById(`${i}-points`).title = `${counter_new}`;
        socket.emit('newPoints', this.roomname, candidates[i], counter_new);
    };
    socket.emit('getEnemyPoints', this.roomname);
    document.getElementById('allPointsToZero-modal').style.display = 'none';
}

// Ask for confirmation to set all points to 0
function askForAllPointsToZero() {
    const modal = document.getElementById('allPointsToZero-modal');
    var span = document.getElementById(`allPointsToZero-close`);
    if (modal.style.display == 'block') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'block';
    }
    span.onclick = function() {
        modal.style.display = 'none';
    }
}

// Free buzzer after buzzed
function freeBuzzer() {
    socket.emit('freeBuzzers', this.roomname);
    const button = document.getElementById('buzzerFreeButton');
    button.disabled = true;
    firstBuzzer = true;
    const isBuzzed = document.querySelectorAll('.i-buzzed');
    isBuzzed.forEach((div) => {
        div.classList.remove('i-buzzed');
    });
}

// Activate/Deactivate buzzer
function activateBuzzer() {
    socket.emit('activateBuzzers', this.roomname);
    const button = document.getElementById('buzzerActivationButton');
    button.innerHTML = 'deaktivieren';
    const state = document.getElementById('showBuzzerState');
    state.innerHTML = 'Buzzer (aktiv):';
    button.setAttribute('onclick','deactivateBuzzer()');
}
function deactivateBuzzer() {
    socket.emit('deactivateBuzzers', this.roomname);
    const button = document.getElementById('buzzerActivationButton');
    button.innerHTML = 'aktivieren';
    const state = document.getElementById('showBuzzerState');
    state.innerHTML = 'Buzzer (inaktiv):';
    button.setAttribute('onclick','activateBuzzer()');

    // free too
    const button2 = document.getElementById('buzzerFreeButton');
    button2.disabled = true;
    firstBuzzer = true;
    const isBuzzed = document.querySelectorAll('.i-buzzed');
    isBuzzed.forEach((div) => {
        div.classList.remove('i-buzzed');
    });
}

// Get candidates from current room from server amd print current points and answers; cands = [str], points = [number], ansers = [str], userBuzzedId = str
socket.on('sendCandidates', (cands, points, answers, questionCount, userBuzzedId) => {
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
            <button id="${i}-3-points-plus" onclick="add3Point(${i})" style="position:absolute;left:0;">+ 3</button>
            <input id="${i}-points" type="number" value="${points[i]}" title="${points[i]}" />
            <button id="${i}-points-minus" onclick="subPoint(${i})">- 1</button>
            <button id="${i}-3-points-minus" onclick="sub3Point(${i})" style="position:absolute;left:0;">- 3</button>`;
        pointsDiv.classList.add('candidate-points');
        answerDiv.innerHTML = `
            <label for="${candidates[i].id}" title="${candidates[i].username}">${candidates[i].username}:</label>
            <input id="${candidates[i].id}" type="text" value="${answers[i]}" title="${answers[i]}" readonly />`;
        answerDiv.classList.add('candidate-answer', 'inline-block-label');

        pointsDiv.addEventListener('input', (e) => {
            // Get Number from Input
            const pts = Number(e.target.value);
            e.target.title = `${pts}`;
            // Emit a message to the server
            socket.emit('newPoints', this.roomname, candidates[i], pts);
            socket.emit('getEnemyPoints', this.roomname);
        });

        candidateAnswers.appendChild(pointsDiv);
        candidateAnswers.appendChild(answerDiv);
    }

    const index = candidates.findIndex(cand => cand.id === userBuzzedId);
    const ptsField = document.getElementById(`${index}-points`);
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

// Detect buzzer and see who buzzed first
socket.on('candidateBuzzed', (user) => {
    buzzedUser = user.id;
    if (firstBuzzer) {
        firstBuzzer = false;
        setTimeout(function() {analyzeBuzzing();}, 300);
        audio.play();
        const button = document.getElementById('buzzerFreeButton');
        button.disabled = false;
    }
});
socket.on('candidateBuzzedLate', (later, earlier) => {
    console.log(`${later.username} buzzed later than ${earlier.username}.`)
});

// Crown whoever buzzed first
function analyzeBuzzing() {
    const analyzedBuzzedUser = buzzedUser;

    const index = candidates.findIndex(cand => cand.id === analyzedBuzzedUser);
    const ptsField = document.getElementById(`${index}-points`);
    if (ptsField) {ptsField.parentElement.classList.add('i-buzzed');}
    socket.emit('analyzedBuzzing', this.roomname, analyzedBuzzedUser);
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
            if (ServerMessage.firstChild) {ServerMessage.removeChild(ServerMessage.firstChild);}
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

document.getElementById('question-count').addEventListener('input', (e) => {
    // Get Number from Input
    const count = Number(e.target.value);
    e.target.title = `${count}`;
    // Emit a message to the server
    socket.emit('newQuestionCount', this.roomname, count);
});

// Listen for 'Enter'-keypress and try to start Quiz
window.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if (roomInputForm.style.display != 'none') {
            startQuiz();
        }
    }
});

document.getElementById('roomname').addEventListener('input', (e) => {
    var username = e.target.value;
    if (username.includes('<') || username.includes('>') || username.includes('"')) {
       e.target.value = username.replaceAll('<', '').replaceAll('>', '').replaceAll('"', '');

       var popup = document.getElementById('injectionPopupRoomname');
       popup.classList.add('show');
       for (var i = 0; i < timeoutsRoomname.length; i++) {
           clearTimeout(timeoutsRoomname[i]);
       }
       timeoutsRoomname = [];
       timeoutsRoomname.push(setTimeout(function() {popup.classList.remove('show');}, 3000));
    }
});

document.getElementById('password').addEventListener('input', (e) => {
    var username = e.target.value;
    if (username.includes('<') || username.includes('>') || username.includes('"')) {
       e.target.value = username.replaceAll('<', '').replaceAll('>', '').replaceAll('"', '');

       var popup = document.getElementById('injectionPopupPassword');
       popup.classList.add('show');
       for (var i = 0; i < timeoutsPassword.length; i++) {
           clearTimeout(timeoutsPassword[i]);
       }
       timeoutsPassword = [];
       timeoutsPassword.push(setTimeout(function() {popup.classList.remove('show');}, 3000));
    }
});
