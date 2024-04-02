const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
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
    lockAnswer,
    unlockAnswer,
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
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/doppelkekse.com-0001/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/doppelkekse.com-0001/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/doppelkekse.com-0001/chain.pem')
}
const server = https.createServer(options, app);
const PORT = 3000;
const io = socketio(server, { maxHttpBufferSize: 1e8 });
const botName = 'Server';
const buzzerActive = [];
const isBuzzed = [];
const timeLastBuzz = [];
const files = [];

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

                const answers = getCandidateAnswers(candidateArray).answers;
                const lockedAnswers = getCandidateAnswers(candidateArray).lockedAnswers;
                const points = getCandidatePoints(candidateArray);
                const questionCount = 0;
                const userBuzzedId = null;
                saveCurrentQuestion(roomname, questionCount);
                io.to(roomname).emit('newQuestionCountToAll', questionCount);
                io.to(roomname).emit('sendCandidates', candidateArray, points, answers, lockedAnswers, questionCount, userBuzzedId);
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

            const answers = getCandidateAnswers(candidateArray).answers;
            const lockedAnswers = getCandidateAnswers(candidateArray).lockedAnswers;
            const points = getCandidatePoints(candidateArray);

            const questionCount = getCurrentQuestion(roomname);
            var userBuzzedId = null;
            if (isBuzzed.includes(roomname)) {
                const index = timeLastBuzz.findIndex(last => last.room === roomname);
                if (getCurrentUser(timeLastBuzz[index].id)) {userBuzzedId = timeLastBuzz[index].id;}
            }

            socket.emit('sendCandidates', candidateArray, points, answers, lockedAnswers, questionCount, userBuzzedId);
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
                const index = files.findIndex(file => file.room === roomname);
                if (index !== -1) {
                    socket.emit('image-uploaded', {name: '/img/tmp/' + files[index].file});
                    if (files[index].isVisible) {
                        socket.emit('showPicture');
                    }
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
                const index = files.findIndex(file => file.room === roomname);
                if (index !== -1) {
                    socket.emit('image-uploaded', {name: '/img/tmp/' + files[index].file});
                    if (files[index].isVisible) {
                        socket.emit('showPicture');
                    }
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

    // Listen for answer lock
    socket.on('answerLocked', (roomname) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            lockAnswer(user.id);
            io.to(roomname).emit('answerLockedToMaster', user.id);
        } else {
            socket.emit('reloadPage');
        }
    });

    // Listen for answer unlock
    socket.on('answerUnlocked', (roomname) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            unlockAnswer(user.id);
            io.to(roomname).emit('answerUnlockedToMaster', user.id);
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

    // File upload from quizmaster
    socket.on('upload-image', (message, roomname) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            var messageName = imageNameUnique(message.name);

            const index = files.findIndex(file => file.room === roomname);
            const newFile = {file: messageName, room: roomname, isVisible: false};
            if (index === -1) {
                files.push(newFile);
            } else {
                fs.unlink(`./public/img/tmp/${files[index].file}`, (err) => {if (err) {console.log(err);}});
                files[index] = newFile;
            }

            var writer = fs.createWriteStream(path.resolve(__dirname, './public/img/tmp/' + messageName), {encoding: 'base64'});
            writer.write(message.data);
            writer.end();

            writer.on('finish', function () {
                io.to(roomname).emit('image-uploaded', {name: '/img/tmp/' + messageName});
            });
        } else {
            socket.emit('reloadPage');
        }
    });

    // Show picture to candidates
    socket.on('showPicture', (roomname) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            const index = files.findIndex(file => file.room === roomname);
            if (index !== -1) {
                files[index].isVisible = true;
            }
            io.to(roomname).emit('showPicture');
        } else {
            socket.emit('reloadPage');
        }
    });

    // Hide picture from candidates
    socket.on('hidePicture', (roomname) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            const index = files.findIndex(file => file.room === roomname);
            if (index !== -1) {
                files[index].isVisible = false;
            }
            io.to(roomname).emit('hidePicture');
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
                rooms.forEach(room => {
                    if (room != 'quizmaster' && room !== socket.id) {
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
                        const index = files.findIndex(file => file.room === room);
                        if (index !== -1) {
                            fs.unlink(`./public/img/tmp/${files[index].file}`, (err) => {if (err) {console.log(err);}});
                            files.splice(index, 1);
                            io.to(room).emit('hidePicture');
                        }
                    }
                });
            } else if (rooms.has('stream-overlay')) {
                rooms.forEach(room => {
                    if (room != 'stream-overlay') {
                        io.to(room).emit('messageFromServer', formatMessage(botName, `- ${time} -<br>Die Verbindung zum ${user.username} wurde unterbrochen.`));
                    }
                });
            } else if (!(rooms.has('spectator'))) {
                const stats = deletePoints(socket.id);
                if (stats) {
                    rooms.forEach(room => {
                        io.to(room).emit('leavingCandidate');
                        io.to(room).emit('messageFromServer', formatMessage(botName, `- ${time} -<br>Die Verbindung zu ${user.username} wurde unterbrochen.<br>Es waren ${stats.pts} Punkte auf dem Konto.`));
                    });
                } else {
                    rooms.forEach(room => {
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
    };
}

// Format image name if already exists
function imageNameUnique(name) {
    const index = files.findIndex(file => file.file === name);
    if (index === -1) {
        return name;
    } else {
        return imageNameUnique(`_${name}`);
    }
}

// Get current IP and start server
http.get({ 'host': 'api.ipify.org', 'port': 80, 'path': '/' }, function(resp) {
    resp.on('data', function(ip) {
        server.listen(PORT, () => console.log(`Server running on ${ip}:${PORT}`));
    });
});
