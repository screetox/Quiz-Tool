const { ISO_8601 } = require('moment');
const moment = require('moment');

const activeUsers = [];

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

// Get current user
function getCurrentUser(id) {
    return activeUsers.find(user => user.id === id);
}

// Fill candidate names
function fillCandidateNames(candidates) {
    for (let i = 0; i < candidates.length; i++) {
        const user = activeUsers.find(user => user.id === candidates[i].candidateId);
        var candidateName = 'User nicht gefunden!';
        var candidateId = candidates[i].candidateId;
        if (user) {
            candidateName = user.username;
            candidateId = user.id;
        }
        candidates[i] = { candidateId, candidateName };
    }
    return candidates;
}

// User leaves chat
function userLeave(id) {
    const index = activeUsers.findIndex(user => user.id === id);
    const time = moment().format('kk:mm:ss');

    if (index !== -1) {
        const deletedUser = activeUsers.splice(index, 1)[0];
        console.log(`${time} - ${deletedUser.username} (${deletedUser.id}) disconnected.`);
        return deletedUser;
    }
}

module.exports = {
    userJoin,
    quizmasterJoin,
    getCurrentUser,
    userLeave,
    fillCandidateNames
}