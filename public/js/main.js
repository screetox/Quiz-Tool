const siteBody = document.getElementById('body-id');
const buttonDarkMode = document.getElementById('drk-md-btn');
const headline = document.getElementById('headline');
const answForm = document.getElementById('answ');
const buzzer = document.getElementById('buzzer');
const ServerMessage = document.getElementById('msg-block');
const idDisplay = document.getElementById('your-id');

// Get username from url
const urlParams = new URLSearchParams(location.search);
const username = urlParams.get('username');
// window.history.replaceState('', 'Quiz-Tool - screetox', '/');
headline.innerHTML = `Hallo, ${username}!`;

const socket = io();

// Login
socket.emit('login', username);
socket.on('sendID', id => {
    idDisplay.innerHTML = id;
});

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

// Message submit
answForm.addEventListener('input', (e) => {
    // Get Text from Input
    const answ = e.target.value;

    // Emit a message to the server
    socket.emit('newAnswer', answ);
});

function outputServerMessage(msg) {
    document.getElementById('msg-block').style.display = 'block';
    const div = document.createElement('div');
    div.classList.add('server-msg');
    div.innerHTML = msg;
    ServerMessage.insertBefore(div, ServerMessage.firstChild);

    setTimeout(function() {
        ServerMessage.removeChild(ServerMessage.lastChild);
    }, 300000);
}

function buzz() {
    buzzer.style.background = 'var(--dark-color-b)';
}

// Toggle and save dark mode
if (localStorage.quizmode) {
    if (localStorage.quizmode === 'dark') {
        activateDarkMode();
    } else if (localStorage.quizmode === 'bright') {
        deactivateDarkMode();
    } else {
        deactivateDarkMode();
    }
}
function switchDarkMode() {
    if (typeof(Storage) !== 'undefined') {
        if (localStorage.quizmode) {
            if (localStorage.quizmode === 'dark') {
                deactivateDarkMode();
            } else if (localStorage.quizmode === 'bright') {
                activateDarkMode();
            } else {
                if (siteBody.classList.contains('dark-mode')) {
                    deactivateDarkMode();
                } else {
                    activateDarkMode();
                }
            }
        } else {
            if (siteBody.classList.contains('dark-mode')) {
                deactivateDarkMode();
            } else {
                activateDarkMode();
            }
        }
    } else {
        console.log('Kein Darkmode verfügbar!');
    }
}

function activateDarkMode() {
    localStorage.quizmode = 'dark';
    siteBody.classList.add('dark-mode');
    console.log('Dark Mode activated!');
    buttonDarkMode.innerHTML = 'Bright Mode';
}

function deactivateDarkMode() {
    localStorage.quizmode = 'bright';
    if (siteBody.classList.contains('dark-mode')) {
        siteBody.classList.remove('dark-mode');
    }
    console.log('Dark Mode deactivated!');
    buttonDarkMode.innerHTML = 'Dark Mode';
}