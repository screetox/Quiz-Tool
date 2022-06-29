const { ISO_8601 } = require('moment');
const moment = require('moment');

const activeUsers = [];
const activeRooms = [];
const currentAnswers = [];
const currentPoints = [];

function userJoin(id, username) {
    const user = { id, username };
    const time = moment().format('kk:mm:ss');

    activeUsers.push(user);
    console.log(`${time} - ${username} (${user.id}) connected as a candidat.`);

    return user;
}

function quizmasterJoin(id, username) {
    const user = { id, username };
    const time = moment().format('kk:mm:ss');

    activeUsers.push(user);
    console.log(`${time} - ${username} (${user.id}) connected as a quizmaster.`);

    return user;
}

function overlayJoin(id, username) {
    const user = { id, username };
    const time = moment().format('kk:mm:ss');

    activeUsers.push(user);
    console.log(`${time} - ${username} (${user.id}) connected as overlay.`);

    return user;
}

function createRoom(id, roomname, password) {
    const index = activeRooms.findIndex(room => room.roomname === roomname);
    if (index === -1) {
        const newRoom = { id, roomname, password };
        const time = moment().format('kk:mm:ss');

        activeRooms.push(newRoom);
        console.log(`${time} - ${activeUsers.find(user => user.id === id).username} (${id}) created new room: ${roomname}`);

        return 0;
    } else {
        return 2;
    }
}

function testPassword(roomname, password) {
    const room = activeRooms.find(room => room.roomname === roomname);
    if (room) {
        if (room.password === password) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// Get current user
function getCurrentUser(id) {
    return activeUsers.find(user => user.id === id);
}

function getActiveRoomNames() {
    const roomnames = [];
    for (let i = 0; i < activeRooms.length; i++) {
        roomnames.push(activeRooms[i].roomname);
    }
    return roomnames;
}

// Save new answer
function saveAnswer(id, answ) {
    const index = currentAnswers.findIndex(answer => answer.id === id);
    if (index !== -1) {
        currentAnswers.splice(index, 1);
    }

    const answer = { id, answ };
    currentAnswers.push(answer);
}

// Save new points
function savePoints(id, pts) {
    const index = currentPoints.findIndex(points => points.id === id);
    if (index !== -1) {
        currentPoints.splice(index, 1);
    }

    const points = { id, pts };
    currentPoints.push(points);
}

// User leaves chat
function userLeave(id) {
    const index = activeUsers.findIndex(user => user.id === id);
    const index2 = currentAnswers.findIndex(answer => answer.id === id);
    const time = moment().format('kk:mm:ss');

    // delete answer
    if (index2 !== -1) {
        currentAnswers.splice(index2, 1);
    }

    if (index !== -1) {
        const deletedUser = activeUsers.splice(index, 1)[0];
        console.log(`${time} - ${deletedUser.username} (${deletedUser.id}) disconnected.`);
        return deletedUser;
    }
}

function deletePoints(id) {
    const index = currentPoints.findIndex(points => points.id === id);
    if (index !== -1) {
        const deletedUser = currentPoints.splice(index, 1)[0];
        return deletedUser;
    }
}

function setRoomInactive(id) {
    const index = activeRooms.findIndex(room => room.id === id);
    if (index !== -1) {
        activeRooms.splice(index, 1);
    }
}

// Get candidate answers
function getCandidateAnswers(candidates) {
    const answers = [];
    for (let i = 0; i < candidates.length; i++) {
        const answer = currentAnswers.find(answer => answer.id === candidates[i].id);
        var candidateAnswer = '';
        if (answer) {
            candidateAnswer = answer.answ;
        }
        answers.push(candidateAnswer);
    }
    return answers;
}

// Get candidate points
function getCandidatePoints(candidates) {
    const points = [];
    for (let i = 0; i < candidates.length; i++) {
        const point = currentPoints.find(point => point.id === candidates[i].id);
        var candidatePoint = 0;
        if (point) {
            candidatePoint = point.pts;
        }
        points.push(candidatePoint);
    }
    return points;
}

module.exports = {
    userJoin,
    quizmasterJoin,
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
    getCandidatePoints
}