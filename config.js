//var serverHost = "http://localhost"; // development
var serverHost = "http://192.168.168.25"; // production
var serverPort = process.env.PORT || 9001;
var mssqlServerHost = "http://upgi.ddns.net"; // access database from the internet (development)
//var mssqlServerHost = "http://192.168.168.5"; // access database from LAN (production)
var upgiSystemAccount = "upgiSystem";
var upgiSystemPassword = "upgiSystem";

var mssqlConfig = {
    server: mssqlServerHost.slice(7),
    user: upgiSystemAccount,
    password: upgiSystemPassword
};

const botAPIUrl = "https://api.telegram.org/bot";

const broadcastFrequency = "* * * * * *";

const modelUpdateFreqency = "0 */5 * * * *";

const workingLocale = "Asia/Taipei";

module.exports = {
    serverHost,
    serverPort,
    upgiSystemAccount,
    upgiSystemPassword,
    mssqlConfig,
    botAPIUrl,
    broadcastFrequency,
    modelUpdateFreqency,
    workingLocale
};