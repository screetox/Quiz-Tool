const siteBody = document.getElementById('body-id');
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