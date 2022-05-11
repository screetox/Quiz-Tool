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

    setTimeout(function(){
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
