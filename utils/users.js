const { ISO_8601 } = require('moment');
const moment = require('moment');

const activeUsers = [];
const currentAnswers = [];

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

// Save new answer
function saveAnswer(id, answ) {
    const index = currentAnswers.findIndex(answer => answer.id === id);
    if (index !== -1) {
        currentAnswers.splice(index, 1);
    }
    
    const answer = { id, answ };    
    currentAnswers.push(answer);
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

// Get candidate answers
function getCandidateAnswers(candidates) {
    const answers = [];
    for (let i = 0; i < candidates.length; i++) {
        const answer = currentAnswers.find(answer => answer.id === candidates[i].candidateId);
        var candidateAnswer = '';
        if (answer) {
            candidateAnswer = answer.answ;
        }
        answers.push(candidateAnswer);
    }
    return answers;
}

// User leaves chat
function userLeave(id) {
    const index = activeUsers.findIndex(user => user.id === id);
    const index2 = currentAnswers.findIndex(answer => answer.id === id);
    const time = moment().format('kk:mm:ss');

    // delete answer
    if (index2 !== -1) {
        currentAnswers.splice(index, 1);
    }

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
    saveAnswer,
    userLeave,
    fillCandidateNames,
    getCandidateAnswers
}