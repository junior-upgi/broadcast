var express = require("express");
var bodyParser = require("body-parser");
var morgan = require("morgan");
var moment = require("moment-timezone");
var mssql = require("mssql");
var CronJob = require("cron").CronJob;

var config = require("./config.js");

var app = express();
app.use(morgan("dev")); // log request and result to console
app.use(bodyParser.urlencoded({ extended: true })) // parse application/x-www-form-urlencoded
var urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(bodyParser.json()); // parse application/json
var jsonParser = bodyParser.json();

// initialize application's data model
var botList = [],
    chatList = [],
    userList = [],
    messageQueue = [];
mssql.connect(config.mssqlConfig).then(function() { // establish server connection
    var mssqlRequest = new mssql.Request(); // initialize a request object
    var queryString = "SELECT * FROM telegram.dbo.bot;";
    mssqlRequest.query(queryString)
        .then(function(resultset) { //query for a list of telegram bots available
            mssql.close();
            console.log("推播機器人列表查詢成功");
            botList = resultset;
        }).catch(function(error) {
            console.log("推播機器人列表查詢失敗：" + error);
            botList = [];
        });
    queryString = "SELECT * FROM telegram.dbo.chat;";
    mssqlRequest.query(queryString)
        .then(function(resultset) { //query for a list of chat rooms available
            mssql.close();
            console.log("聊天室列表查詢成功");
            chatList = resultset;
        }).catch(function(error) {
            console.log("聊天室列表查詢失敗：" + error);
            chatList = [];
        });
    queryString =
        "SELECT a.*,b.NAME,b.DEP,c.NAME AS DEP_NAME,b.POS_NAME,b.ID_NO,b.CNT_TEL2 " +
        "FROM telegram.dbo.[user] a " +
        "LEFT JOIN DB_U105.dbo.MF_YG b ON a.erpID=b.YG_NO " +
        "LEFT JOIN DB_U105.dbo.DEPT c ON b.DEP=c.DEP " +
        "WHERE b.OUT_DAY IS NULL AND b.YG_NO IS NOT NULL;";
    mssqlRequest.query(queryString)
        .then(function(resultset) { //query for a list of users available
            mssql.close();
            console.log("使用者列表查詢成功");
            userList = resultset;
        }).catch(function(error) {
            console.log("使用者列表查詢失敗：" + error);
            userList = [];
        });
});

app.route("/broadcast/json") // routes related to broadcasting message passed in through JSON
    .get(function(request, response) { // supply user with a broadcast form
        return response.status(200).render("jsonForm");
    })
    .post(jsonParser, function(request, response) { // store a message in the message queue
        return response.status(200);
    });

app.listen(); // start server
console.log("推播系統運行中...(" + config.serverHost + ":" + config.serverPort + ")");

var broadcastingSchedule = new CronJob(config.broadcastFrequency, function() { // periodically broadcast messages stored in message queue
}, null, true, config.workingLocale);
broadcastingSchedule.start();

var updateModelData = new CronJob(config.modelUpdateFreqency, function() { // periodically updates the application data model
    console.log(
        moment(moment(), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") +
        " 更新推播系統相關資料");
    mssql.connect(config.mssqlConfig).then(function() { // establish server connection
        var mssqlRequest = new mssql.Request(); // initialize a request object
        var queryString = "SELECT * FROM telegram.dbo.bot;";
        mssqlRequest.query(queryString)
            .then(function(resultset) { //query for a list of telegram bots available
                mssql.close();
                console.log("推播機器人列表查詢成功");
                botList = resultset;
            }).catch(function(error) {
                console.log("推播機器人列表查詢失敗：" + error);
                botList = [];
            });
        queryString = "SELECT * FROM telegram.dbo.chat;";
        mssqlRequest.query(queryString)
            .then(function(resultset) { //query for a list of chat rooms available
                mssql.close();
                console.log("聊天室列表查詢成功");
                chatList = resultset;
            }).catch(function(error) {
                console.log("聊天室列表查詢失敗：" + error);
                chatList = [];
            });
        queryString =
            "SELECT a.*,b.NAME,b.DEP,c.NAME AS DEP_NAME,b.POS_NAME,b.ID_NO,b.CNT_TEL2 " +
            "FROM telegram.dbo.[user] a " +
            "LEFT JOIN DB_U105.dbo.MF_YG b ON a.erpID=b.YG_NO " +
            "LEFT JOIN DB_U105.dbo.DEPT c ON b.DEP=c.DEP " +
            "WHERE b.OUT_DAY IS NULL AND b.YG_NO IS NOT NULL;";
        mssqlRequest.query(queryString)
            .then(function(resultset) { //query for a list of users available
                mssql.close();
                console.log("使用者列表查詢成功");
                userList = resultset;
            }).catch(function(error) {
                console.log("使用者列表查詢失敗：" + error);
                userList = [];
            });
    });
}, null, true, config.workingLocale);
updateModelData.start();