const moment = require('moment');

function formatMessage(username, text) {
    return {
        username,
        text,
        time: moment().format('k:mm')
    }
}

module.exports = formatMessage;