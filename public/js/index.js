const siteBody = document.getElementById('body-id');
const buttonDarkMode = document.getElementById('drk-md-btn');
const ServerMessage = document.getElementById('msg-block');
const quizmasterCheckbox = document.getElementById('quizmaster-login');
const loginForm = document.getElementById('login-form');

// Get msg from url
const urlParams = new URLSearchParams(location.search);
const msg = urlParams.get('msg');

if (msg) {
    document.getElementById('msg-block').style.display = 'block';
    const div = document.createElement('div');
    div.classList.add('server-msg');
    div.innerHTML = msg;
    ServerMessage.insertBefore(div, ServerMessage.firstChild);

    setTimeout(function() {
        ServerMessage.removeChild(ServerMessage.lastChild);
    }, 300000);
}

window.history.replaceState('', 'Quiz-Tool - screetox', '/');

quizmasterCheckbox.addEventListener('change', function() {
    if (this.checked) {
        loginForm.action = 'quizmaster.html';
    } else {
        loginForm.action = 'main.html';
    }
});

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