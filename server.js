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
    saveCurrentQuestion,
    userLeave,
    deletePoints,
    setRoomInactive,
    getCandidateAnswers,
    getCandidatePoints,
    getAllPoints,
    getCurrentQuestion
    } = require('./users');
const { time } = require('console');

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
io.on('connection', (socket) => {
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
        const user = getCurrentUser(socket.id);
        if (user) {
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
                const questionCount = 0;
                const userBuzzedId = null;
                socket.emit('sendCandidates', candidateArray, points, answers, questionCount, userBuzzedId);
            } else if (roomCreated === 2) {
                const time = moment().format('kk:mm:ss');
                socket.emit('messageFromServer', formatMessage(botName, `- ${time} -<br>Der Name <i>${roomname}</i> wird bereits verwendet.<br>Bitte verwende einen anderen Raumnamen.`));
            }
        } else {
            socket.emit('reloadPage');
        }
    });

    // Send CandidateNames
    socket.on('getCandidates', (roomname) => {
        const user = getCurrentUser(socket.id);
        if (user) {
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

            const questionCount = getCurrentQuestion(roomname);
            var userBuzzedId = null;
            if (isBuzzed.includes(roomname)) {
                const index = timeLastBuzz.findIndex(last => last.room === roomname);
                if (getCurrentUser(timeLastBuzz[index].id)) {userBuzzedId = timeLastBuzz[index].id;}
            }

            socket.emit('sendCandidates', candidateArray, points, answers, questionCount, userBuzzedId);
        } else {
            socket.emit('reloadPage');
        }
    });

    // Send active rooms
    socket.on('getActiveRooms', () => {
        const user = getCurrentUser(socket.id);
        if (user) {
            const roomnames = getActiveRoomNames();
            socket.emit('sendActiveRoomNames', roomnames);
        } else {
            socket.emit('reloadPage');
        }
    });

    // Login user if credentials correct
    socket.on('loginTry', (roomname, password) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            const correct = testPassword(roomname, password);
            if (correct) {
                socket.join(roomname);
                socket.emit('loginTryAnswer', true);
                if (buzzerActive.includes(roomname)) {
                    socket.emit('activateBuzzer');
                }
                if (isBuzzed.includes(roomname)) {
                    const index = timeLastBuzz.findIndex(last => last.room === roomname);
                    const userBuzzed = getCurrentUser(timeLastBuzz[index].id) ? getCurrentUser(timeLastBuzz[index].id) : {username: 'Jemand', id: null};
                    socket.emit('sendBuzzed', userBuzzed);
                }
                socket.emit('newQuestionCountToAll', getCurrentQuestion(roomname));
                const rooms = socket.rooms;
                if (!(rooms.has('spectator'))) {
                    io.to(roomname).emit('newCandidate');
                }
            } else {
                socket.emit('loginTryAnswer', false);
            }
        } else {
            socket.emit('reloadPage');
        }
    });

    // Login user if stream overlay credentials correct
    socket.on('streamOverlayLoginTry', (roomname, password) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            const correct = testPassword(roomname, password);
            if (correct) {
                socket.join(roomname);
                socket.emit('loginTryAnswer', true);
                if (isBuzzed.includes(roomname)) {
                    const index = timeLastBuzz.findIndex(last => last.room === roomname);
                    const userBuzzed = getCurrentUser(timeLastBuzz[index].id) ? getCurrentUser(timeLastBuzz[index].id) : {username: 'Jemand', id: null};
                    setTimeout(function() {socket.emit('sendBuzzed', userBuzzed);}, 300);
                }
            } else {
                socket.emit('loginTryAnswer', false);
            }
        } else {
            socket.emit('reloadPage');
        }
    });

    // Listen for newAnswer
    socket.on('newAnswer', (roomname, answ) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            saveAnswer(user.id, answ);
            io.to(roomname).emit('newAnswerToMaster', formatMessage(user.id, answ));
        } else {
            socket.emit('reloadPage');
        }
    });

    // Listen for newBuzz
    socket.on('newBuzz', (roomname, momentSent) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            if (!isBuzzed.includes(roomname)) {
                isBuzzed.push(roomname);
                io.to(roomname).emit('candidateBuzzed', user);

                const index = timeLastBuzz.findIndex(last => last.room === roomname);
                if (index != -1) {timeLastBuzz.splice(index, 1);}

                const setLastBuzz = {room: `${roomname}`, time: momentSent, id: user.id};
                timeLastBuzz.push(setLastBuzz);
            } else {
                const index = timeLastBuzz.findIndex(last => last.room === roomname);
                if (index != -1) {
                    const lastBuzz = timeLastBuzz[index].time;
                    const orig = getCurrentUser(timeLastBuzz[index].id);
                    if (momentSent < lastBuzz) {
                        timeLastBuzz.splice(index, 1);
                        io.to(roomname).emit('candidateBuzzed', user);
                        io.to(roomname).emit('candidateBuzzedLate', orig, user);
                        const setLastBuzz = {room: `${roomname}`, time: momentSent, id: user.id};
                        timeLastBuzz.push(setLastBuzz);
                    } else {
                        io.to(roomname).emit('candidateBuzzedLate', user, orig);
                    }
                } else {
                    io.to(roomname).emit('candidateBuzzed', user);
                    const setLastBuzz = {room: `${roomname}`, time: momentSent, id: user.id};
                    timeLastBuzz.push(setLastBuzz);
                }
            }
        } else {
            socket.emit('reloadPage');
        }
    });

    // Listen for analyzedBuzzing
    socket.on('analyzedBuzzing', (roomname, buzzedId) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            io.to(roomname).emit('sendBuzzed', getCurrentUser(buzzedId));
        } else {
            socket.emit('reloadPage');
        }
    });

    // Listen for freeBuzzers
    socket.on('freeBuzzers', (roomname) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            const updateMoment = moment().valueOf() + 300;
            io.to(roomname).emit('freeBuzzer', updateMoment);
            if (isBuzzed.includes(roomname)) {
                const index = isBuzzed.findIndex(room => room === roomname);
                isBuzzed.splice(index, 1);
            }
        } else {
            socket.emit('reloadPage');
        }
    });

    // Listen for activateBuzzers
    socket.on('activateBuzzers', (roomname) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            if (!buzzerActive.includes(roomname)) {
                buzzerActive.push(roomname);
            }
            const updateMoment = moment().valueOf() + 300;
            io.to(roomname).emit('freeBuzzer', updateMoment);
            io.to(roomname).emit('activateBuzzer');
        } else {
            socket.emit('reloadPage');
        }
    });

    // Listen for deactivateBuzzers
    socket.on('deactivateBuzzers', (roomname) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            if (buzzerActive.includes(roomname)) {
                const index = buzzerActive.findIndex(room => room === roomname);
                buzzerActive.splice(index, 1);
            }
            if (isBuzzed.includes(roomname)) {
                const index = isBuzzed.findIndex(room => room === roomname);
                isBuzzed.splice(index, 1);
            }
            io.to(roomname).emit('deactivateBuzzer');
        } else {
            socket.emit('reloadPage');
        }
    });

    // Listen for newQuestionCount
    socket.on('newQuestionCount', (roomname, count) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            saveCurrentQuestion(roomname, count);
            io.to(roomname).emit('newQuestionCountToAll', count);
        } else {
            socket.emit('reloadPage');
        }
    });

    // Listen for getQuestionCount
    socket.on('getQuestionCount', (roomname) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            getCurrentQuestion(roomname);
            socket.emit('newQuestionCountToAll', count);
        } else {
            socket.emit('reloadPage');
        }
    });

    // Listen for newPoints
    socket.on('newPoints', (roomname, userPts, pts) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            savePoints(userPts.id, pts);
            io.to(roomname).emit('newPointsToAll', formatMessage(userPts.id, pts));
        } else {
            socket.emit('reloadPage');
        }
    });

    // Send Points from every candidate in room
    socket.on('getEnemyPoints', (roomname) => {
        const user = getCurrentUser(socket.id);
        if (user) {
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

            const allPointsAndCandidateNames = getAllPoints(candidateArray);
            io.to(roomname).emit('sendEnemyPoints', allPointsAndCandidateNames[0], allPointsAndCandidateNames[1]);
        } else {
            socket.emit('reloadPage');
        }
    });

    // Broadcast when a user disconnects
    socket.on('disconnecting', () => {
        const user = userLeave(socket.id);

        if (user) {
            var rooms = socket.rooms;
            const time = moment().format('kk:mm:ss');

            if (rooms.has('quizmaster')) {
                setRoomInactive(socket.id);
                rooms.forEach(function(room) {
                    if (room != 'quizmaster') {
                        io.to(room).emit('messageFromServer', formatMessage(botName, `- ${time} -<br>Die Verbindung zu ${user.username} wurde unterbrochen.`));

                        if (buzzerActive.includes(room)) {
                            const index = buzzerActive.findIndex(roomname => roomname === room);
                            buzzerActive.splice(index, 1);
                            io.to(room).emit('deactivateBuzzer');
                        }
                        if (isBuzzed.includes(room)) {
                            const index = isBuzzed.findIndex(roomname => roomname === room);
                            isBuzzed.splice(index, 1);
                        }
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
                        io.to(room).emit('leavingCandidate');
                        io.to(room).emit('messageFromServer', formatMessage(botName, `- ${time} -<br>Die Verbindung zu ${user.username} wurde unterbrochen.<br>Es waren ${stats.pts} Punkte auf dem Konto.`));
                    });
                } else {
                    rooms.forEach(function(room) {
                        io.to(room).emit('leavingCandidate');
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
