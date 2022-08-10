const ServerMessage = document.getElementById('msg-block');
const quizmasterCheckbox = document.getElementById('quizmaster-login');
const loginForm = document.getElementById('login-form');

// Get msg from url
const urlParams = new URLSearchParams(location.search);
const msg = urlParams.get('msg');
var timeouts = [];

if (msg) {
    document.getElementById('msg-block').style.display = 'block';
    const div = document.createElement('div');
    div.classList.add('server-msg');
    div.innerHTML = msg;
    ServerMessage.appendChild(div);
}

window.history.replaceState('', 'Quiz-Tool - screetox', '/');

function login() {
    if (quizmasterCheckbox.checked) {
        loginForm.action = 'quizmaster.html';
    } else {
        loginForm.action = 'main.html';
    }
    loginForm.submit();
}

function spectate() {
    loginForm.action = 'spectator.html';
    loginForm.submit();
}

function streamOverlay() {
    loginForm.action = 'stream-overlay.html';
    loginForm.submit();
}

window.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        login();
    }
});

document.getElementById('username').addEventListener('input', (e) => {
    var username = e.target.value;
    if (username.includes('<') || username.includes('>') || username.includes('"')) {
        e.target.value = username.replaceAll('<', '').replaceAll('>', '').replaceAll('"', '');

        var popup = document.getElementById('injectionPopupUsername');
        popup.classList.add('show');
        for (var i = 0; i < timeouts.length; i++) {
            clearTimeout(timeouts[i]);
        }
        timeouts.push(setTimeout(function() {popup.classList.remove('show');}, 3000));
    }
});
