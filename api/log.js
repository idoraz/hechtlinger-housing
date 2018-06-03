var moment = require('moment');

class Log {
    logToConsole(message) {
        console.log(`${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')} ${this.message}`);
    }
}