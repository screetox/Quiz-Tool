const moment = require('moment');

function formatMessage(id, text) {
    return {
        id,
        text,
        time: moment().format('k:mm')
    }
}

module.exports = formatMessage;