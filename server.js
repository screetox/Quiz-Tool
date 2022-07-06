const path = require('path');
const http = require('http');
const moment = require('moment');
const express = require('express');
const socketio = require('socket.io');
const {
    userJoin,
    quizmasterJoin,
    spectatorJoin,
    overlayJoin,
    createRoom,
    testPassword,
    getCurrentUser,
    getActiveRoomNames,
    saveAnswer,
    savePoints,
    userLeave,
    deletePoints,
    setRoomInactive,
    getCandidateAnswers,
    getCandidatePoints,
    getAllPoints
    } = require('./users');

const app = express();
const server = http.createServer(app);
const PORT = 3000;
const io = socketio(server);
const botName = 'Server';
const buzzerActive = [];
const isBuzzed = [];
const timeLastBuzz = [];

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Run when client connects
io.on('connection', socket => {
    socket.on('login', (username) => {
        const time = moment().format('kk:mm:ss');
        socket.emit('welcomeMessage', formatMessage(botName, `Es ist ${time} - Willkommen beim Quiz-Tool, ${username}!`));
        userJoin(socket.id, username);
    });
    socket.on('login-as-quizmaster', (username) => {
        const time = moment().format('kk:mm:ss');
        socket.emit('welcomeMessage', formatMessage(botName, `Es ist ${time} - Willkommen beim Quiz-Tool, ${username}!`));
        socket.join('quizmaster');
        quizmasterJoin(socket.id, username);
    });
    socket.on('login-spectator', (username) => {
        const time = moment().format('kk:mm:ss');
        socket.emit('welcomeMessage', formatMessage(botName, `Es ist ${time} - Willkommen beim Quiz-Tool, ${username}!`));
        socket.join('spectator');
        spectatorJoin(socket.id, username);
    });
    socket.on('login-stream-overlay', (username) => {
        const time = moment().format('kk:mm:ss');
        socket.emit('welcomeMessage', formatMessage(botName, `Es ist ${time} - Willkommen beim Quiz-Tool, ${username}!`));
        socket.join('stream-overlay');
        overlayJoin(socket.id, username);
    });

    // Create room for quizmaster
    socket.on('createRoom', (roomname, password) => {
        const roomCreated = createRoom(socket.id, roomname, password);
        if (roomCreated === 0) {
            socket.join(roomname);

            const candidateArray= [];
            const candidates = io.sockets.adapter.rooms.get(roomname);
            const quizmasters = io.sockets.adapter.rooms.get('quizmaster');
            const spectators = io.sockets.adapter.rooms.get('spectator');
            const overlays = io.sockets.adapter.rooms.get('stream-overlay');

            for (let id of candidates) {
                if (!(quizmasters?.has(id) || overlays?.has(id) || spectators?.has(id))) {
                    const candidate = getCurrentUser(id);
                    candidateArray.push(candidate);
                }
            }

            const answers = getCandidateAnswers(candidateArray);
            const points = getCandidatePoints(candidateArray);
            socket.emit('sendCandidates', candidateArray, points, answers);
        } else if (roomCreated === 2) {
            const time = moment().format('kk:mm:ss');
            socket.emit('messageFromServer', formatMessage(botName, `- ${time} -<br>Der Name <i>${roomname}</i> wird bereits verwendet.<br>Bitte verwende einen anderen Raumnamen.`));
        }
    });

    // Send CandidateNames
    socket.on('getCandidates', (roomname) => {
        const candidateArray= [];
        const candidates = io.sockets.adapter.rooms.get(roomname);
        const quizmasters = io.sockets.adapter.rooms.get('quizmaster');
        const spectators = io.sockets.adapter.rooms.get('spectator');
        const overlays = io.sockets.adapter.rooms.get('stream-overlay');

        for (let id of candidates) {
            if (!(quizmasters?.has(id) || overlays?.has(id) || spectators?.has(id))) {
                const candidate = getCurrentUser(id);
                candidateArray.push(candidate);
            }
        }

        const answers = getCandidateAnswers(candidateArray);
        const points = getCandidatePoints(candidateArray);
        socket.emit('sendCandidates', candidateArray, points, answers);
    });

    // Send active rooms
    socket.on('getActiveRooms', () => {
        const roomnames = getActiveRoomNames();
        socket.emit('sendActiveRoomNames', roomnames);
    });

    // Login user if credentials correct
    socket.on('loginTry', (roomname, password) => {
        const correct = testPassword(roomname, password);
        if (correct) {
            socket.join(roomname);
            socket.emit('loginTryAnswer', true, roomname);
            if (buzzerActive.includes(roomname)) {
                socket.emit('activateBuzzer');
            }
            if (isBuzzed.includes(roomname)) {
                const index = timeLastBuzz.findIndex(last => last.room === roomname);
                const userBuzzed = getCurrentUser(timeLastBuzz[index].id) ? getCurrentUser(timeLastBuzz[index].id) : {username: 'Jemand', id: null};
                socket.emit('sendBuzzed', userBuzzed);
            }
            io.to(roomname).emit('newCandidate', roomname);
        } else {
            socket.emit('loginTryAnswer', false, roomname);
        }
    });

    // Login user if stream overlay credentials correct
    socket.on('streamOverlayLoginTry', (roomname, password) => {
        const correct = testPassword(roomname, password);
        if (correct) {
            socket.join(roomname);
            socket.emit('loginTryAnswer', true, roomname);
        } else {
            socket.emit('loginTryAnswer', false, roomname);
        }
    });

    // Listen for newAnswer
    socket.on('newAnswer', (answ) => {
        const user = getCurrentUser(socket.id);
        var rooms = socket.rooms;

        saveAnswer(user.id, answ);
        rooms.forEach(function(room) {
            if (!(room === 'quizmaster' || room === 'stream-overlay' || room === 'spectator' || room === user.id)) {
                io.to(room).emit('newAnswerToMaster', formatMessage(user.id, answ));
            }
        });
    });

    // Listen for newBuzz
    socket.on('newBuzz', (momentSent) => {
        const user = getCurrentUser(socket.id);
        const rooms = socket.rooms;
        var roomname = '';
        rooms.forEach(function(room) {
            if (!(room === 'quizmaster' || room === 'stream-overlay' || room === 'spectator' || room === user.id)) {
                roomname = room;
            }
        });

        if (!isBuzzed.includes(roomname)) {
            io.to(roomname).emit('candidateBuzzed', user);
            isBuzzed.push(roomname);
            const setLastBuzz = {room: `${roomname}`, time: momentSent, id: user.id};
            timeLastBuzz.push(setLastBuzz);
        } else {
            const index = timeLastBuzz.findIndex(last => last.room === roomname);
            const lastBuzz = timeLastBuzz[index].time;

            if (momentSent < lastBuzz) {
                timeLastBuzz.splice(index, 1);
                io.to(roomname).emit('candidateBuzzed', user);
                const setLastBuzz = {room: `${roomname}`, time: momentSent, id: user.id};
                timeLastBuzz.push(setLastBuzz);

                console.log(lastBuzz)
            } else {
                io.to(roomname).emit('candidateBuzzedLate', user);
            }
        }
    });

    // Listen for analyzedBuzzing
    socket.on('analyzedBuzzing', (buzzedId) => {
        const user = getCurrentUser(socket.id);
        const rooms = socket.rooms;
        var roomname = '';
        rooms.forEach(function(room) {
            if (!(room === 'quizmaster' || room === 'stream-overlay' || room === 'spectator' || room === user.id)) {
                roomname = room;
            }
        });

        io.to(roomname).emit('sendBuzzed', getCurrentUser(buzzedId));
    });

    // Listen for freeBuzzers
    socket.on('freeBuzzers', () => {
        const user = getCurrentUser(socket.id);
        const rooms = socket.rooms;
        var roomname = '';
        rooms.forEach(function(room) {
            if (!(room === 'quizmaster' || room === 'stream-overlay' || room === 'spectator' || room === user.id)) {
                roomname = room;
            }
        });

        const updateMoment = moment().valueOf() + 500;
        io.to(roomname).emit('freeBuzzer', updateMoment);
        if (isBuzzed.includes(roomname)) {
            const index = isBuzzed.findIndex(room => room === roomname);
            isBuzzed.splice(index, 1);
        }
    });

    // Listen for activateBuzzers
    socket.on('activateBuzzers', () => {
        const user = getCurrentUser(socket.id);
        const rooms = socket.rooms;
        var roomname = '';
        rooms.forEach(function(room) {
            if (!(room === 'quizmaster' || room === 'stream-overlay' || room === 'spectator' || room === user.id)) {
                roomname = room;
            }
        });

        if (!buzzerActive.includes(roomname)) {
            buzzerActive.push(roomname);
        }
        const updateMoment = moment().valueOf() + 500;
        io.to(roomname).emit('freeBuzzer', updateMoment);
        io.to(roomname).emit('activateBuzzer');
    });

    // Listen for deactivateBuzzers
    socket.on('deactivateBuzzers', () => {
        const user = getCurrentUser(socket.id);
        const rooms = socket.rooms;
        var roomname = '';
        rooms.forEach(function(room) {
            if (!(room === 'quizmaster' || room === 'stream-overlay' || room === 'spectator' || room === user.id)) {
                roomname = room;
            }
        });

        if (buzzerActive.includes(roomname)) {
            const index = buzzerActive.findIndex(room => room === roomname);
            buzzerActive.splice(index, 1);
        }
        if (isBuzzed.includes(roomname)) {
            const index = isBuzzed.findIndex(room => room === roomname);
            isBuzzed.splice(index, 1);
        }
        io.to(roomname).emit('deactivateBuzzer');
    });

    // Listen for newPoints
    socket.on('newPoints', (user, pts) => {
        var rooms = socket.rooms;

        savePoints(user.id, pts);
        rooms.forEach(function(room) {
            if (!(room === 'quizmaster' || room === 'stream-overlay' || room === 'spectator' || room === user.id)) {
                io.to(room).emit('newPointsToAll', formatMessage(user.id, pts));
            }
        });
    });

    // Send Points from every candidate in room
    socket.on('getEnemyPoints', () => {
        var rooms = socket.rooms;
        rooms.forEach(function(room) {
            if (!(room === 'quizmaster' || room === 'stream-overlay' || room === 'spectator' || room === socket.id)) {
                const candidateArray= [];
                const candidates = io.sockets.adapter.rooms.get(room);
                const quizmasters = io.sockets.adapter.rooms.get('quizmaster');
                const spectators = io.sockets.adapter.rooms.get('spectator');
                const overlays = io.sockets.adapter.rooms.get('stream-overlay');

                for (let id of candidates) {
                    if (!(quizmasters?.has(id) || overlays?.has(id) || spectators?.has(id))) {
                        const candidate = getCurrentUser(id);
                        candidateArray.push(candidate);
                    }
                }

                const allPointsAndCandidateNames = getAllPoints(candidateArray);
                io.to(room).emit('sendEnemyPoints', allPointsAndCandidateNames[0], allPointsAndCandidateNames[1]);
            }
        });
    });

    // Broadcast when a user disconnects
    socket.on('disconnecting', () => {
        var rooms = socket.rooms;
        const user = userLeave(socket.id);

        if (user) {
            const time = moment().format('kk:mm:ss');

            if (rooms.has('quizmaster')) {
                setRoomInactive(socket.id);
                rooms.forEach(function(room) {
                    if (room != 'quizmaster') {
                        io.to(room).emit('messageFromServer', formatMessage(botName, `- ${time} -<br>Die Verbindung zu ${user.username} wurde unterbrochen.`));
                    }
                });
            } else if (rooms.has('stream-overlay')) {
                rooms.forEach(function(room) {
                    if (room != 'stream-overlay') {
                        io.to(room).emit('messageFromServer', formatMessage(botName, `- ${time} -<br>Die Verbindung zum ${user.username} wurde unterbrochen.`));
                    }
                });
            } else if (!(rooms.has('spectator'))) {
                const stats = deletePoints(socket.id);
                if (stats) {
                    rooms.forEach(function(room) {
                        io.to(room).emit('leavingCandidate', room);
                        io.to(room).emit('messageFromServer', formatMessage(botName, `- ${time} -<br>Die Verbindung zu ${user.username} wurde unterbrochen.<br>Es waren ${stats.pts} Punkte auf dem Konto.`));
                    });
                } else {
                    rooms.forEach(function(room) {
                        io.to(room).emit('leavingCandidate', room);
                        io.to(room).emit('messageFromServer', formatMessage(botName, `- ${time} -<br>Die Verbindung zu ${user.username} wurde unterbrochen.`));
                    });
                }
            }
        }
    });
});

// Format message to send
function formatMessage(id, text) {
    return {
        id,
        text,
        time: moment().format('kk:mm:ss')
    }
}

// Get current IP and start server
http.get({ 'host': 'api.ipify.org', 'port': 80, 'path': '/' }, function(resp) {
    resp.on('data', function(ip) {
        server.listen(PORT, () => console.log(`Server running on ${ip}:${PORT}`));
    });
});
