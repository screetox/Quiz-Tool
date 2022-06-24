const moment = require('moment');

function formatMessage(id, text) {
    return {
        id,
        text,
        time: moment().format('kk:mm:ss')
    }
}

module.exports = formatMessage;