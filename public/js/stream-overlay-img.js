const chooseRoom = document.getElementById('choose-stream-room');
const activeRooms = document.getElementById('show-active-rooms');
const quizImage = document.getElementById('quiz-image-stream');
const sharedImage = document.getElementById('shared-image-stream');

const candidates = [];
const username = 'Stream-Overlay';
var roomname = '';
const socket = io();

// Login and get active rooms
socket.emit('login-stream-overlay', username);
socket.emit('getActiveRooms');

// Log server error
socket.on('server-error', () => {
    console.log('Server Error! Bitte wende dich an den Administrator unter business@screetox.de');
});

// Log welcomeMessage from server; message = {id = str, text = str, time = str}
socket.on('welcomeMessage', (message) => {
    console.log(message.text);
});

//Log message from server; message = {id = str, text = str, time = str}
socket.on('messageFromServer', (message) => {
    console.log(message);
});

// Get active rooms from server and print buttons to join; activeRoomNames = [str]
socket.on('sendActiveRoomNames', (activeRoomNames) => {
    for (let i = 0; i < activeRoomNames.length; i++) {
        if (activeRoomNames[i].length > 25) {
            const cutRoomname = activeRoomNames[i].substring(0, 22);
            const buttonDiv = document.createElement('div');
            buttonDiv.innerHTML = `<button class="btn-stream" id="${i}-btn" onclick="joinRoom(${i})" title="${activeRoomNames[i]}">${cutRoomname}...</button>`;
            const modalDiv = document.createElement('div');
            modalDiv.innerHTML = `
                <div id="${i}-modal" class="modal-stream">
                    <div class="modal-content-stream">
                        <span class="close" id="${i}-close">&times;</span>
                        <label for="${i}-pw">Passwort für ${cutRoomname}...:</label>
                        <input id="${i}-pw" type="password" />
                        <button class="btn-stream" onclick="logIntoRoom(${i})">Los geht's!</button>
                    </div>
                </div>`;
            activeRooms.appendChild(buttonDiv);
            activeRooms.appendChild(modalDiv);
        } else {
            const buttonDiv = document.createElement('div');
            buttonDiv.innerHTML = `<button class="btn-stream" id="${i}-btn" onclick="joinRoom(${i})" title="${activeRoomNames[i]}">${activeRoomNames[i]}</button>`;
            const modalDiv = document.createElement('div');
            modalDiv.innerHTML = `
                <div id="${i}-modal" class="modal-stream">
                    <div class="modal-content-stream">
                        <span class="close" id="${i}-close">&times;</span>
                        <label for="${i}-pw">Passwort für ${activeRoomNames[i]}:</label>
                        <input id="${i}-pw" type="password" />
                        <button class="btn-stream" onclick="logIntoRoom(${i})">Los geht's!</button>
                    </div>
                </div>`;
            activeRooms.appendChild(buttonDiv);
            activeRooms.appendChild(modalDiv);
        }
    }
});

// Get answer to login try from server and login or display message; bool = bool
socket.on('loginTryAnswer', (bool) => {
    if (bool) {
        chooseRoom.style.display = 'none';
        document.getElementById('shared-image-stream').style.display = 'block';
        document.getElementById('headline-stream').style.marginLeft = '110px';
        socket.emit('getCandidates', this.roomname);
    } else {
        outputServerMessage(`Falsches Passwort für ${this.roomname}.`);
        reloadRooms();
    }
});

// Reload list of active rooms to join
function reloadRooms() {
    if (activeRooms.firstChild) {
        activeRooms.removeChild(activeRooms.firstChild);
        reloadRooms();
    } else {
        socket.emit('getActiveRooms');
    }
}

// Open modal for password input to join selected room; roomnumber = str
function joinRoom(roomnumber) {
    var modal = document.getElementById(`${roomnumber}-modal`);
    var span = document.getElementById(`${roomnumber}-close`);
    if (modal.style.display == 'block') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'block';
    }
    span.onclick = function() {
        modal.style.display = 'none';
    }
}

// Try to log into room with password; roomnumber = str
function logIntoRoom(roomnumber) {
    var modal = document.getElementById(`${roomnumber}-modal`);
    this.roomname = document.getElementById(`${roomnumber}-btn`).title;
    var password = document.getElementById(`${roomnumber}-pw`).value;
    document.getElementById(`${roomnumber}-pw`).value = '';
    document.getElementById(`${roomnumber}-btn`).blur();

    modal.style.display = 'none';
    socket.emit('streamOverlayLoginTry', this.roomname, password);
}

// Download image file
socket.on('download', (file, type) => {
    var blob = new Blob([file], {type: type});
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL( blob );
    quizImage.src = imageUrl;
});

// Show picture
socket.on('showPicture', () => {
    quizImage.style.opacity = '1';
    sharedImage.style.backgroundImage = 'url()';
});

// Hide picture
socket.on('hidePicture', () => {
    quizImage.style.opacity = '0';
    sharedImage.style.backgroundImage = 'url(/img/placeholder-quiz-tool.jpg';
});

// reconnect to server
socket.on('reloadPage', () => {
    location.reload();
});
