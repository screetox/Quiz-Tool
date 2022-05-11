const moment = require('moment');

const activeUsers = [];

function getActiveUsers() {
    return activeUsers;
}

function userJoin(id, username) {
    const user = { id, username };
    const time = moment().format('kk:mm:ss');

    activeUsers.push(user);
    console.log(`${time} - ${username} connected as a candidat.`);

    return user;
}

function quizmasterJoin(id, username) {
    const user = { id, username };
    const time = moment().format('kk:mm:ss');

    activeUsers.push(user);
    console.log(`${time} - ${username} connected as a quizmaster.`);

    return user;
}

// Get current user
function getCurrentUser(id) {
    return activeUsers.find(user => user.id === id);
}

// User leaves chat
function userLeave(id) {
    const index = activeUsers.findIndex(user => user.id === id);
    const time = moment().format('kk:mm:ss');

    if (index !== -1) {
        const deletedUser = activeUsers.splice(index, 1)[0];
        console.log(`${time} - ${deletedUser.username} disconnected.`);
        return deletedUser;
    }
}

module.exports = {
    getActiveUsers,
    userJoin,
    quizmasterJoin,
    getCurrentUser,
    userLeave
}