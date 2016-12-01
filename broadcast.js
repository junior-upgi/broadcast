var bodyParser = require("body-parser");
var cors = require("cors");
var CronJob = require("cron").CronJob;
var express = require("express");
var httpRequest = require("request");
var moment = require("moment-timezone");
var morgan = require("morgan");
var mssql = require("mssql");
var Q = require("q");

var config = require("./config.js");
var telegram = require("./model/telegram.js");

var app = express();
app.set("view engine", "ejs");
app.use(cors()); // allow cross origin request
app.use(morgan("dev")); // log request and result to console
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
var urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(bodyParser.json()); // parse application/json
var jsonParser = bodyParser.json();

var messageQueue = []; // array to hold message queue

app.get("/status", function(request, response) {
    return response.status(200).json({
        status: "online",
        timestamp: moment(moment(), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss")
    });
});

app.route("/broadcast") // routes related to broadcasting message passed in through JSON
    .get(function(request, response) { // supply user with a broadcast form
        var mssqlConnection = new mssql.Connection(config.mssqlConfig); // init db connection obj
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
                            serverHost: config.serverHost,
                            serverPort: config.serverPort,
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

app.listen(config.serverPort); // start server
console.log("Telegram broadcast server in operation...(" + config.serverHost + ":" + config.serverPort + ")");

var scheduledBroadcasting = new CronJob(config.broadcastFrequency, function() { // periodically broadcast messages stored in message queue
    console.log("Telegram broadcast server in operation...(" + config.serverHost + ":" + config.serverPort + ")");
    console.log("current time: " + moment(moment(), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
    console.log("message queue");
    messageQueue.forEach(function(message) {
        console.log("=============================================================");
        console.log("recipient: " + message.chat_id);
        console.log("message content:\n" + message.text);
        console.log("bot: " + message.token);
    });
    console.log("=============================================================");
    if ((config.broadcastActiveStatus === true) && (messageQueue.length > 0)) { // if queue has message waiting and system is on
        var numberOfMessageToBroadcast = (messageQueue.length >= config.broadcastQuantity) ? config.broadcastQuantity : messageQueue.length;
        for (i = 0; i < numberOfMessageToBroadcast; i++) { // loop through from the beginning of the queue
            httpRequest({
                url: config.botAPIUrl + messageQueue[i].token + "/sendMessage",
                method: "post",
                headers: { "Content-Type": "application/json" },
                json: {
                    "chat_id": messageQueue[i].chat_id,
                    "text": messageQueue[i].text,
                    "parse_mode": "HTML"
                }
            }, function(error, httpResponse, body) {
                if (error || (httpResponse.statusCode !== 200)) {
                    mssql.close();
                    console.log("broadcast error: " + error + "\n" + JSON.stringify(body));
                } else {
                    mssql.close();
                }
            });
        }
        messageQueue = messageQueue.slice(numberOfMessageToBroadcast);
    }
}, null, true, config.workingTimezone);
scheduledBroadcasting.start();