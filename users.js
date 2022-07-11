const moment = require('moment');

const activeUsers = [];
const activeRooms = [];
const currentAnswers = [];
const currentPoints = [];
const currentQuestions = [];

// Candidate joins
function userJoin(id, username) {
    const user = { id, username };
    const time = moment().format('kk:mm:ss');

    activeUsers.push(user);
    console.log(`${time} - ${username} (${user.id}) connected as a candidat.`);

    return user;
}

// Quizmaster joins
function quizmasterJoin(id, username) {
    const user = { id, username };
    const time = moment().format('kk:mm:ss');

    activeUsers.push(user);
    console.log(`${time} - ${username} (${user.id}) connected as a quizmaster.`);

    return user;
}

// Spectator joins
function spectatorJoin(id, username) {
    const user = { id, username };
    const time = moment().format('kk:mm:ss');

    activeUsers.push(user);
    console.log(`${time} - ${username} (${user.id}) connected as a spectator.`);

    return user;
}

// Overlay joins
function overlayJoin(id, username) {
    const user = { id, username };
    const time = moment().format('kk:mm:ss');

    activeUsers.push(user);
    console.log(`${time} - ${username} (${user.id}) connected as overlay.`);

    return user;
}

// Quizmaster creates room
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

// Test password for room login
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

// Get names of open rooms
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

// Save new points
function saveCurrentQuestion(room, count) {
    const index = currentQuestions.findIndex(question => question.room === room);
    if (index !== -1) {
        currentQuestions.splice(index, 1);
    }

    const question = { room, count };
    currentQuestions.push(question);
}

// User leaves chat
    // delete answer
function userLeave(id) {
    const index = activeUsers.findIndex(user => user.id === id);
    const index2 = currentAnswers.findIndex(answer => answer.id === id);
    const time = moment().format('kk:mm:ss');

    if (index2 !== -1) {
        currentAnswers.splice(index2, 1);
    }

    if (index !== -1) {
        const deletedUser = activeUsers.splice(index, 1)[0];
        console.log(`${time} - ${deletedUser.username} (${deletedUser.id}) disconnected.`);
        return deletedUser;
    }
}
    // delete points
function deletePoints(id) {
    const index = currentPoints.findIndex(points => points.id === id);
    if (index !== -1) {
        const deletedUser = currentPoints.splice(index, 1)[0];
        return deletedUser;
    }
}

// Quizmaster leaves
    // set room to inactive
function setRoomInactive(id) {
    const index = activeRooms.findIndex(room => room.id === id);
    const index2 = currentQuestions.findIndex(room => room.id === id);
    if (index !== -1) {
        activeRooms.splice(index, 1);
    }
    if (index2 !== -1) {
        currentQuestions.splice(index2, 1);
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

// Get candidate points
function getAllPoints(candidates) {
    const allPoints = [];
    const allCandidates = [];
    const allCandidateIDs = [];
    for (let i = 0; i < candidates.length; i++) {
        const point = currentPoints.find(point => point.id === candidates[i].id);
        var candidatePoint = 0;
        if (point) {
            candidatePoint = point.pts;
        }
        allPoints.push(candidatePoint);
        allCandidates.push(candidates[i].username);
        allCandidateIDs.push(candidates[i].id);
    }

    const indicesAlphabetically = Array.from(allPoints.keys()).sort((a,b) => allCandidates[a].localeCompare(allCandidates[b]));
    const alphabeticallyAllPoints = indicesAlphabetically.map(i => allPoints[i]);
    const alphabeticallyAllCandidates = indicesAlphabetically.map(i => allCandidates[i]);
    const alphabeticallyAllCandidateIDs = indicesAlphabetically.map(i => allCandidateIDs[i]);

    const indices = Array.from(allPoints.keys()).sort((a,b) => alphabeticallyAllPoints[b] - alphabeticallyAllPoints[a]);
    const sortedAllPoints = indices.map(i => alphabeticallyAllPoints[i]);
    const sortedAllCandidates = indices.map(i => alphabeticallyAllCandidates[i]);
    const sortedAllCandidateIDs = indices.map(i => alphabeticallyAllCandidateIDs[i]);

    const returnAllCandidates = [];
    for (let i = 0; i < sortedAllCandidates.length; i++) {
        const id = sortedAllCandidateIDs[i];
        const username = sortedAllCandidates[i];
        returnAllCandidates.push({ id, username });
    }

    return [returnAllCandidates, sortedAllPoints];
}

// Get candidate points
function getCurrentQuestion(room) {
    const index = currentQuestions.findIndex(question => question.room === room);
    if (index !== -1) {
        return currentQuestions[index].count;
    } else {
        return 0;
    }
}

module.exports = {
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
}
