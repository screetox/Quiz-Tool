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

    socket.on('getActiveRooms', () => {
        const roomnames = getActiveRoomNames();
        socket.emit('sendActiveRoomNames', roomnames);
    });

    // Send CandidateNames
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

    socket.on('loginTry', (roomname, password) => {
        const correct = testPassword(roomname, password);
        if (correct) {
            socket.join(roomname);
            socket.emit('loginTryAnswer', true, roomname);
            io.to(roomname).emit('newCandidate', roomname);
        } else {
            socket.emit('loginTryAnswer', false, roomname);
        }
    });

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

http.get({ 'host': 'api.ipify.org', 'port': 80, 'path': '/' }, function(resp) {
    resp.on('data', function(ip) {
        server.listen(PORT, () => console.log(`Server running on ${ip}:${PORT}`));
    });
});

function formatMessage(id, text) {
    return {
        id,
        text,
        time: moment().format('kk:mm:ss')
    }
}
