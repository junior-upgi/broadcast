const bodyParser = require('body-parser');
const cors = require('cors');
const CronJob = require('cron').CronJob;
const express = require('express');
const httpRequest = require('request-promise');
const moment = require('moment-timezone');
const morgan = require('morgan');
const path = require('path');

const serverConfig = require('./module/serverConfig.js');
const utility = require('./module/utility.js');
// const telegram = require('./model/telegram.js');
const telegramBot = require('./model/telegramBot.js');
const telegramChat = require('./model/telegramChat.js');
const telegramUser = require('./model/telegramUser');

const app = express();
app.set('views', path.join(__dirname, '/view'));
app.set('view engine', 'ejs');
app.use(cors()); // allow cross origin request
app.use(morgan('dev')); // log request and result to console
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json()); // parse application/json

let messageQueue = []; // array to hold message queue

app.get('/status', function(request, response) {
    return response.status(200).json({
        system: serverConfig.systemReference,
        status: 'online',
        timestamp: moment(moment(), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
    });
});

app.route('/broadcast') // routes related to broadcasting message passed in through JSON
    .get(function(request, response) { // supply user with a broadcast form
        let currentDatetime = moment(moment(), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
        response.status(200).render('jsonForm', {
            serverHost: serverConfig.serverHost,
            serverPort: serverConfig.serverPort,
            botList: telegramBot.list,
            chatList: telegramChat.list,
            userList: telegramUser.list
        });
        return utility.writeSystemLog(currentDatetime, 'GET to /broadcast', 'general', `${currentDatetime} broadcast test page served`);
    })
    .post(function(request, response) { // when data is posted to the page
        let currentDatetime = moment(moment(), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
        if (request.body.chat_id && request.body.text && request.body.token) {
            messageQueue.push({ // store a message in the message queue
                chat_id: request.body.chat_id,
                text: request.body.text,
                token: request.body.token
            });
            response.status(200).send(`${currentDatetime} message received and will be broadcasted shortly<br><a href="/broadcast">return to broadcast form</a>`);
            return utility.writeSystemLog(currentDatetime, 'POST to /broadcast', 'general', `${currentDatetime} message received and will be broadcasted shortly`);
        } else {
            console.log('\nrequired message component not found...');
            console.log(`error(request.body.chat_id): ${request.body.chat_id}`);
            console.log(`error(request.body.text): ${request.body.text}`);
            console.log(`error(request.body.token): ${request.body.token}\n`);
            response.status(500).send('required message component not found<br><a href="/broadcast">return to broadcast form</a>');
            return utility.writeSystemLog(currentDatetime, 'POST to /broadcast', 'error', `${currentDatetime} required message component not found`);
        }
    });

app.listen(serverConfig.serverPort, function(error) { // start backend server
    let currentDatetime = moment(moment(), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
    if (error) {
        utility.writeSystemLog(currentDatetime, 'server', 'error', `error starting ${serverConfig.systemReference} server: ${error}`);
        console.log(`error starting ${serverConfig.systemReference} server: ${error}`);
    } else {
        utility.writeSystemLog(currentDatetime, 'server', 'startup', `${serverConfig.systemReference} server in operation... (${serverConfig.serverUrl})`);
        console.log(`${serverConfig.systemReference} server in operation... (${serverConfig.serverUrl})`);
    }
});

utility.statusReport.start();

// periodically broadcast messages stored in message queue
let scheduledBroadcasting = new CronJob(serverConfig.broadcastFrequency, function() {
    let currentDatetime = moment(moment(), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
    // if messageQueue has message waiting and system is on for broadcasting
    if ((serverConfig.broadcastActiveStatus === true) && (messageQueue.length > 0)) {
        // determine how many message to send out during this cycle
        // -- if length is longer or equal to setting value
        // -- if length is lower than setting value
        let numberOfMessageToBroadcast =
            (messageQueue.length >= serverConfig.broadcastQuantity) ? serverConfig.broadcastQuantity : messageQueue.length;
        for (let i = 0; i < numberOfMessageToBroadcast; i++) { // loop through from the beginning of the queue
            httpRequest({
                method: 'post',
                uri: serverConfig.botAPIUrl + messageQueue[i].token + '/sendMessage',
                body: {
                    chat_id: messageQueue[i].chat_id,
                    text: messageQueue[i].text,
                    parse_mode: 'HTML'
                },
                json: true
            }).then(function(response) {
                utility.writeSystemLog(currentDatetime, 'scheduledBroadcasting', 'general', `${currentDatetime} message ${i + 1}/${numberOfMessageToBroadcast} broadcasted`);
                return;
            }).catch(function(error) {
                utility.writeSystemLog(currentDatetime, 'scheduledBroadcasting', 'general', `${currentDatetime} message ${i + 1}/${numberOfMessageToBroadcast} broadcasting failure: ${error}`);
                return;
            });
        }
        messageQueue = messageQueue.slice(numberOfMessageToBroadcast);
        utility.writeSystemLog(currentDatetime, 'scheduledBroadcasting', 'general', `${currentDatetime} ${numberOfMessageToBroadcast} message(s) broadcasted`);
    }
}, null, true, serverConfig.workingTimezone);
scheduledBroadcasting.start();
