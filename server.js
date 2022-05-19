const path = require('path');
const http = require('http');
const moment = require('moment');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, quizmasterJoin, getCurrentUser, saveAnswer, userLeave, fillCandidateNames, getCandidateAnswers } = require('./utils/users');

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
        socket.emit('sendID', socket.id);
        userJoin(socket.id, username);
    });
    socket.on('login-as-quizmaster', (username) => {
        const time = moment().format('kk:mm:ss');
        socket.emit('welcomeMessage', formatMessage(botName, `Es ist ${time} - Willkommen beim Quiz-Tool, ${username}!`));
        socket.join('quizmaster');
        quizmasterJoin(socket.id, username);
    });

    // Listen for newAnswer
    socket.on('newAnswer', (answ) => {
        const user = getCurrentUser(socket.id);
        saveAnswer(user.id, answ);
        io.to('quizmaster').emit('newAnswerToMaster', formatMessage(user.id, answ));
    });

    // Send CandidateNames
    socket.on('getCandidateNames', (candidates) => {
        candidates = fillCandidateNames(candidates);
        const answers = getCandidateAnswers(candidates);
        socket.emit('giveCandidateNames', candidates, answers);
    })

    // Broadcast when a user disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            const time = moment().format('kk:mm:ss');
            io.to('quizmaster').emit('newAnswerToMaster', formatMessage(user.id, ''));
            io.to('quizmaster').emit('disconnectMessage', user.id, formatMessage(botName, `${time} - Die Verbindung zu ${user.username} wurde unterbrochen.`));
        }
    });
});

server.listen(PORT, () => console.log(`Server running on 217.241.0.142:${PORT}`));