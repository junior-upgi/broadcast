const CronJob = require('cron').CronJob;
const fs = require('fs');
const moment = require('moment-timezone');
const httpRequest = require('request-promise');
const uuid = require('uuid/v4');

const serverConfig = require('./serverConfig.js');

const database = require('./database.js');
const telegramUser = require('../model/telegramUser.js');
const telegramBot = require('../model/telegramBot.js');

let statusReport = new CronJob('0 0 */3 * * *', function() {
    let id = uuid().toUpperCase();
    let issuedDatetime = moment(moment(), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
    let systemRef = serverConfig.systemReference;
    let functionRef = 'statusReport';
    let type = 'maintenance';
    let message = `${issuedDatetime} ${serverConfig.systemReference} server reporting in`;
    httpRequest({
        method: 'post',
        uri: serverConfig.botAPIUrl + telegramBot.getToken('upgiITBot') + '/sendMessage',
        body: {
            chat_id: telegramUser.getUserID('蔡佳佑'),
            text: `${message}`,
            token: telegramBot.getToken('upgiITBot')
        },
        json: true
    }).then(function(response) {
        database.executeQuery(`INSERT INTO upgiSystem.dbo.customAppLog (id,issuedDatetime,systemRef,functionRef,type,message)VALUES('${id}','${issuedDatetime}','${systemRef}','${functionRef}','${type}','${message}');`, function(data, error) {
            if (error) {
                return console.log(`${serverConfig.systemReference} statusReport logging failed: ` + error);
            }
            return console.log(`${serverConfig.systemReference} statusReport @ ${issuedDatetime} completed`);
        });
    }).catch(function(error) {
        return console.log(`${serverConfig.systemReference} statusReport broadcasting failed: ` + error);
    });
}, null, true, serverConfig.workingTimezone);

function writeSystemLog(issuedDatetime, functionRef, type, message) {
    let currentDatetime = moment(moment(), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
    database.executeQuery(`INSERT INTO upgiSystem.dbo.customAppLog (issuedDatetime,systemRef,functionRef,type,message) VALUES ('${issuedDatetime}','${serverConfig.systemReference}','${functionRef}','${type}','${message}');`, function(data, error) {
        if (error) {
            console.log(`${currentDatetime} error writing system log`);
        }
    });
}

function alertSystemError(functionRef, message) {
    let currentDatetime = moment(moment(), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
    httpRequest({ // broadcast alert when error encountered
        method: 'post',
        uri: serverConfig.botAPIUrl + telegramBot.getToken('upgiITBot') + '/sendMessage',
        body: {
            chat_id: telegramUser.getUserID('蔡佳佑'),
            text: `error encountered while executing [${serverConfig.systemReference}][${functionRef}] @ ${currentDatetime}`,
            token: telegramBot.getToken('upgiITBot')
        },
        json: true
    }).then(function(response) {
        httpRequest({
            method: 'post',
            uri: serverConfig.botAPIUrl + telegramBot.getToken('upgiITBot') + '/sendMessage',
            form: {
                chat_id: telegramUser.getUserID('蔡佳佑'),
                text: `error message: ${message}`,
                token: telegramBot.getToken('upgiITBot')
            }
        }).then(function(response) {
            return console.log(`${currentDatetime} ${serverConfig.systemReference} ${functionRef} alert sent`);
        }).catch(function(error) {
            return console.log(`${currentDatetime} ${serverConfig.systemReference} ${functionRef} failure: ${error}`);
        });
    }).catch(function(error) {
        return console.log(`${currentDatetime} ${serverConfig.systemReference} ${functionRef} failure: ${error}`);
    });
}

function fileRemoval(completeFilePath, callback) {
    console.log(completeFilePath);
    fs.unlink(completeFilePath, function(error) {
        if (error !== null) {
            console.log('file removal failure (may not be critical failure): ' + error);
            return false;
        } else {
            console.log(completeFilePath + ' removed successfully');
            if (callback === undefined) {
                return true;
            } else {
                callback();
            }
        }
    });
}

module.exports = {
    alertSystemError: alertSystemError,
    fileRemoval: fileRemoval,
    statusReport: statusReport,
    writeSystemLog: writeSystemLog
};
