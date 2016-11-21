var express = require("express");
var bodyParser = require("body-parser");
var morgan = require("morgan");
var moment = require("moment-timezone");
var CronJob = require("cron").CronJob;
var mssql = require("mssql");
var httpRequest = require("request");
var config = require("./config.js");
var telegram = require("./model/telegram.js");

var app = express();
app.set("view engine", "ejs");
app.use(morgan("dev")); // log request and result to console
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
var urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(bodyParser.json()); // parse application/json
var jsonParser = bodyParser.json();

var messageQueue = []; // array to hold message queue

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
                        console.log("Telegram 資料查詢成功");
                        return response.status(200).render("jsonForm", {
                            serverHost: config.serverHost,
                            serverPort: config.serverPort,
                            botList: botList,
                            chatList: chatList,
                            userList: userList
                        });
                    }).catch(function(error) {
                        console.log("Telegram 資料查詢發生錯誤： " + error);
                        return response.status(500).send("Telegram 資料查詢發生錯誤： " + error);
                    });
            })
            .catch(function(error) { // connect failure
                return console.log("資料庫連結發生錯誤： " + error);
            });
    })
    .post(function(request, response) { // when data is posted to the page
        if (request.body.chat_id && request.body.text && request.body.token) {
            messageQueue.push({ // store a message in the message queue
                chat_id: request.body.chat_id,
                text: request.body.text,
                token: request.body.token
            });
            return response.status(200).redirect("/broadcast"); // redirect back to messaging page
        } else {
            return response.status(500).redirect("/broadcast"); // redirect back to messaging page
        }
    });

app.listen(config.serverPort); // start server
console.log("推播系統運行中...(" + config.serverHost + ":" + config.serverPort + ")");

var broadcastingSchedule = new CronJob(config.broadcastFrequency, function() { // periodically broadcast messages stored in message queue
    console.log("目前時間： " + moment(moment(), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
    console.log("訊息列表");
    messageQueue.forEach(function(message) {
        console.log("=============================================================");
        console.log("目標：" + message.chat_id);
        console.log("內容：" + message.text);
        console.log("途徑：" + message.token);
    });
    console.log("=============================================================");
    if ((config.broadcastActiveStatus === true) && (messageQueue.length > 0)) { //if queue has message waiting and system is on
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
            }, function(error, response, body) {
                if (error) {
                    console.log("推播作業發生錯誤：" + error);
                } else {
                    console.log("推播作業成功：" + response.statusCode);
                    console.log("伺服器回覆：" + JSON.stringify(body));
                }
            });
        }
        messageQueue = messageQueue.slice(numberOfMessageToBroadcast);
    }
}, null, true, config.workingTimezone);
broadcastingSchedule.start();