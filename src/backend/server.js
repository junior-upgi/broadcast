const bodyParser = require("body-parser");
const cors = require("cors");
const CronJob = require("cron").CronJob;
const express = require("express");
const httpRequest = require("request-promise");
const moment = require("moment-timezone");
const morgan = require("morgan");
const mssql = require("mssql");
const Q = require("q");

const serverConfig = require("./module/serverConfig.js");
const telegram = require("./model/telegram.js");

const app = express();
app.set("view engine", "ejs");
app.use(cors()); // allow cross origin request
app.use(morgan("dev")); // log request and result to console
app.use(bodyParser.urlencoded({
    extended: true
})); // parse application/x-www-form-urlencoded
const urlencodedParser = bodyParser.urlencoded({
    extended: true
});
app.use(bodyParser.json()); // parse application/json
const jsonParser = bodyParser.json();

let messageQueue = []; // array to hold message queue

app.get("/status", function(request, response) {
    return response.status(200).json({
        system: serverConfig.systemReference,
        status: "online",
        timestamp: moment(moment(), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss")
    });
});

app.listen(serverConfig.serverPort, function(error) { // start backend server
    if (error) {
        console.log(`error starting ${serverConfig.systemReference} server: ${error}`);
    } else {
        console.log(`${serverConfig.systemReference} server in operation... (${serverConfig.serverUrl})`);
    }
});

app.route("/broadcast") // routes related to broadcasting message passed in through JSON
    .get(function(request, response) { // supply user with a broadcast form
        var mssqlConnection = new mssql.Connection(serverConfig.mssqlConfig); // init db connection obj
        var mssqlRequest;
        mssqlConnection.connect() // start db connection
            .then(function() { // connect success
                mssqlRequest = new mssql.Request(mssqlConnection); // init db request obj
                var botList = [];
                var chatList = [];
                var userList = [];
                var getTelegramDataList = function(queryString, mssqlRequestObject) {
                    return mssqlRequestObject.query(queryString);
                };
                getTelegramDataList(telegram.getBotListQuery, mssqlRequest) // get bot data
                    .then(function(resultset) {
                        botList = resultset;
                        return getTelegramDataList(telegram.getChatListQuery, mssqlRequest); // get chat data
                    }).then(function(resultset) {
                        chatList = resultset;
                        return getTelegramDataList(telegram.getUserListQuery, mssqlRequest); // get user data
                    }).then(function(resultset) {
                        userList = resultset;
                        mssqlConnection.close(); // close database connection
                        return response.status(200).render("jsonForm", {
                            serverHost: serverConfig.serverHost,
                            serverPort: serverConfig.serverPort,
                            botList: botList,
                            chatList: chatList,
                            userList: userList
                        });
                    }).catch(function(error) {
                        return response.status(500).send(".dbo.telegram data extraction error: " + error);
                    });
            })
            .catch(function(error) { // connect failure
                return console.log("error connecting to database " + error);
            });
    })
    .post(function(request, response) { // when data is posted to the page
        if (request.body.chat_id && request.body.text && request.body.token) {
            messageQueue.push({ // store a message in the message queue
                chat_id: request.body.chat_id,
                text: request.body.text,
                token: request.body.token
            });
            console.log("broadcast");
            return response.status(200).send('message received and will be broadcasted shortly<br><a href="/broadcast">return to broadcast form</a>');
        } else {
            console.log("required message component not found...");
            console.log("error(request.body.chat_id): " + request.body.chat_id);
            console.log("error(request.body.text): " + request.body.text);
            console.log("error(request.body.token): " + request.body.token);
            return response.status(500).send('required message component not found<br><a href="/broadcast">return to broadcast form</a>');
        }
    });

var scheduledBroadcasting = new CronJob(serverConfig.broadcastFrequency, function() { // periodically broadcast messages stored in message queue
    console.log("Telegram broadcast server in operation...(" + serverConfig.serverHost + ":" + serverConfig.serverPort + ")");
    console.log("current time: " + moment(moment(), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
    console.log("message queue");
    messageQueue.forEach(function(message) {
        console.log("=============================================================");
        console.log("recipient: " + message.chat_id);
        console.log("message content:\n" + message.text);
        console.log("bot: " + message.token);
    });
    console.log("=============================================================");
    if ((serverConfig.broadcastActiveStatus === true) && (messageQueue.length > 0)) { // if queue has message waiting and system is on
        var numberOfMessageToBroadcast = (messageQueue.length >= serverConfig.broadcastQuantity) ? serverConfig.broadcastQuantity : messageQueue.length;
        for (i = 0; i < numberOfMessageToBroadcast; i++) { // loop through from the beginning of the queue
            httpRequest({
                url: serverConfig.botAPIUrl + messageQueue[i].token + "/sendMessage",
                method: "post",
                headers: {
                    "Content-Type": "application/json"
                },
                json: {
                    "chat_id": messageQueue[i].chat_id,
                    "text": messageQueue[i].text,
                    "parse_mode": "HTML"
                }
            }, function(error, httpResponse, body) {
                if ((error || (httpResponse.statusCode !== 200)) && (body.ok !== true)) {
                    mssql.close();
                    console.log("broadcast error: " + error);
                    console.log("response body.ok: " + body.ok);
                    console.log("response body.error_code: " + body.error_code);
                    console.log("response body.description: " + body.description);
                } else {
                    mssql.close();
                }
            });
        }
        messageQueue = messageQueue.slice(numberOfMessageToBroadcast);
    }
}, null, true, serverConfig.workingTimezone);
scheduledBroadcasting.start();
