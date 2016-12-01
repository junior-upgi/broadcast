var serverHost = "http://localhost";
var serverPort = process.env.PORT || 9001;
//var mssqlServerHost = "http://upgi.ddns.net"; // access database from the internet (development)
var mssqlServerHost = "http://192.168.168.5"; // access database from LAN (production)
var mssqlServerPort = process.env.PORT || 1433;
var upgiSystemAccount = "upgiSystem";
var upgiSystemPassword = "upgiSystem";

var mssqlConfig = {
    server: mssqlServerHost.slice(7),
    user: upgiSystemAccount,
    password: upgiSystemPassword,
    port: mssqlServerPort
};

const workingTimezone = "Asia/Taipei";

const botAPIUrl = "https://api.telegram.org/bot";

var broadcastActiveStatus = true; // switch broadcast system on/off
var broadcastFrequency = "*/5 * * * * *"; // how often broadcast action is triggered
var broadcastQuantity = 30; // how many message to broadcast each time

module.exports = {
    serverHost,
    serverPort,
    upgiSystemAccount,
    upgiSystemPassword,
    mssqlConfig,
    botAPIUrl,
    broadcastActiveStatus,
    broadcastFrequency,
    broadcastQuantity,
    workingTimezone
};