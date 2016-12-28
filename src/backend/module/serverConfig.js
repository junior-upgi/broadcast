const systemReference = 'broadcast';

const development = true;
const serverHost = 'http://127.0.0.1';
const serverPort = 9001;
const mssqlServerHost = 'http://192.168.168.5'; // access database from LAN (production)
// const mssqlServerHost = 'http://127.0.0.1'; // access database through SSH (development)
const mssqlServerPort = 1433;
var upgiSystemAccount = 'upgiSystem';
var upgiSystemPassword = 'upgiSystem';
const smtpTransportAccount = 'smtps://junior.upgi@gmail.com:cHApPPZV@smtp.gmail.com';
const workingTimezone = 'Asia/Taipei';

var mssqlConfig = {
    server: mssqlServerHost.slice(7),
    user: upgiSystemAccount,
    password: upgiSystemPassword,
    port: mssqlServerPort
};

const workingTimezone = 'Asia/Taipei';

const botAPIUrl = 'https://api.telegram.org/bot';

var broadcastActiveStatus = true; // switch broadcast system on/off
var broadcastFrequency = '*/5 * * * * *'; // how often broadcast action is triggered
var broadcastQuantity = 30; // how many message to broadcast each time

module.exports = {
    systemReference: systemReference,
    development: development,
    serverHost: serverHost,
    serverPort: serverPort,
    serverUrl: serverHost + ':' + serverPort,
    // publicServerUrl: 'http://upgi.ddns.net:' + serverPort, // production
    publicServerUrl: serverHost + ':' + 9999, // development with browserSync
    mssqlServerHost: mssqlServerHost,
    mssqlServerPort: mssqlServerPort,
    mssqlServerUrl: mssqlServerHost + ':' + mssqlServerHost,
    upgiSystemAccount: upgiSystemAccount,
    upgiSystemPassword: upgiSystemPassword,
    mssqlConfig: {
        server: mssqlServerHost.slice(7),
        user: upgiSystemAccount,
        password: upgiSystemPassword,
        port: mssqlServerPort,
        connectionTimeout: 60000,
        requestTimeout: 60000
    },
    smtpTransportAccount: smtpTransportAccount,
    workingTimezone: workingTimezone,

    broadcastActiveStatus: broadcastActiveStatus,
    broadcastFrequency: broadcastFrequency,
    broadcastQuantity: broadcastQuantity,
    botAPIUrl: botAPIUrl
};
