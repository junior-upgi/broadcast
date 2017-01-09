const bodyParser = require('body-parser');
const cors = require('cors');
const CronJob = require('cron').CronJob;
const express = require('express');
const httpRequest = require('request-promise');
const moment = require('moment-timezone');
// const morgan = require('morgan');
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
// app.use(morgan('dev')); // log request and result to console
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
        utility.logger.verbose('broadcast test page requested received');
        response.status(200).render('jsonForm', {
            serverHost: serverConfig.serverHost,
            serverPort: serverConfig.serverPort,
            botList: telegramBot.list,
            chatList: telegramChat.list,
            userList: telegramUser.list
        });
        utility.logger.verbose('broadcast test page requested served');
    })
    .post(function(request, response) { // when data is posted to the page
        utility.logger.info('broadcasting request received');
        utility.logger.verbose(`message content: ${request.body.text}`);
        let currentDatetime = moment(moment(), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
        if (request.body.chat_id && request.body.text && request.body.token) {
            messageQueue.push({ // store a message in the message queue
                chat_id: request.body.chat_id,
                text: request.body.text,
                token: request.body.token
            });
            response.status(200).send(`${currentDatetime} message received and will be broadcasted shortly<br><a href="/broadcast">return to broadcast form</a>`);
            utility.logger.info('message stored successfully');
        } else {
            response.status(500).send('required message component not found<br><a href="/broadcast">return to broadcast form</a>');
            utility.alertSystemError('POST to /broadcast', `required message component not found...\nrequest.body.chat_id: ${request.body.chat_id}\nrequest.body.text: ${request.body.text}\nrequest.body.token: ${request.body.token}`);
            utility.logger.error(`required message component not found...\nrequest.body.chat_id: ${request.body.chat_id}\nrequest.body.text: ${request.body.text}\nrequest.body.token: ${request.body.token}`);
        }
    });

app.listen(serverConfig.serverPort, function(error) { // start backend server
    if (error) {
        utility.logger.error(`error starting ${serverConfig.systemReference} server: ${error}`);
    } else {
        utility.logger.info(`${serverConfig.systemReference} server in operation... (${serverConfig.serverUrl})`);
    }
});

utility.statusReport.start();

// periodically broadcast messages stored in message queue
let scheduledBroadcasting = new CronJob(serverConfig.broadcastFrequency, function() {
    utility.logger.info('commence periodic broadcasting protocol');
    // if messageQueue has message waiting and system is on for broadcasting
    if ((serverConfig.broadcastActiveStatus === true) && (messageQueue.length > 0)) {
        // determine how many message to send out during this cycle
        // -- if length is longer or equal to setting value
        // -- if length is lower than setting value
        let numberOfMessageToBroadcast =
            (messageQueue.length >= serverConfig.broadcastQuantity) ? serverConfig.broadcastQuantity : messageQueue.length;
        utility.logger.verbose(`${numberOfMessageToBroadcast}/${messageQueue.length} messages will be broadcasted during this cycle`);
        for (let i = 0; i < numberOfMessageToBroadcast; i++) { // loop through from the beginning of the queue
            let currentQueuedMessage = messageQueue[i].text;
            httpRequest({
                method: 'post',
                uri: `${serverConfig.botAPIUrl}${messageQueue[i].token}/sendMessage`,
                body: {
                    chat_id: messageQueue[i].chat_id,
                    text: messageQueue[i].text,
                    parse_mode: 'HTML'
                },
                json: true
            }).then(function(response) {
                return utility.logger.verbose(`message ${i + 1}/${numberOfMessageToBroadcast} broadcasted:\n${currentQueuedMessage}`);
            }).catch(function(error) {
                utility.alertSystemError('scheduledBroadcasting', `uri: ${serverConfig.botAPIUrl}${messageQueue[i].token}/sendMessage\ntargetID: ${messageQueue[i].chat_id}\ntarget: ${telegramUser.getUserName(parseInt(messageQueue[i].chat_id))}\nmessage: ${messageQueue[i].text}\nerror: ${error}`);
                return utility.logger.error(`message ${i + 1}/${numberOfMessageToBroadcast} broadcasting failure:\n${error}`);
            });
        }
        messageQueue = messageQueue.slice(numberOfMessageToBroadcast);
        utility.logger.verbose(`${numberOfMessageToBroadcast} message(s) broadcasted`);
        utility.logger.verbose(`${messageQueue.length} message(s) left in the queue`);
        utility.logger.info('periodic broadcasting protocol completed');
    }
}, null, true, serverConfig.workingTimezone);
scheduledBroadcasting.start();
