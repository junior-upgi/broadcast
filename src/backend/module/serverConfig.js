const systemReference = 'broadcast';
const development = false;
const serverHostname = 'upgilinuxvm1';

// broadcasting configuration
const botAPIUrl = 'https://api.telegram.org/bot';

function broadcastServerUrl() {
    let broadcastServerPort = 9001;
    if (development === true) {
        return `http://upgi.ddns.net:${broadcastServerPort}/broadcast`; // access broadcast server from internet (development)
    } else {
        return `http://192.168.168.25:${broadcastServerPort}/broadcast`; // access broadcast server from LAN (production)
    }
}
const broadcastActiveStatus = true; // switch broadcast system on/off
const broadcastFrequency = '* * * * * *'; // how often broadcast action is triggered
const broadcastQuantity = 5; // how many message to broadcast each time

// server configuration
const serverHost = 'http://localhost';
const serverPort = 9001;
const browserSyncPort = 9991;

function publicServerUrl() {
    if (development === true) {
        return `${serverHost}:${browserSyncPort}/${systemReference}`; // development
    } else {
        return `http://upgi.ddns.net:${serverPort}/${systemReference}`; // production
    }
}

// database access configuration
function mssqlServerHost() {
    if (development === true) {
        return 'http://127.0.0.1'; // access database through SSH (development)
    } else {
        return 'http://192.168.168.5'; // access database from LAN (production)
    }
}
const mssqlServerPort = 1433;

function mssqlServerUrl() {
    if (development === true) {
        return `${mssqlServerHost()}:${mssqlServerPort}`; // access database through SSH (development)
    } else {
        return `${mssqlServerHost()}:${mssqlServerPort}`; // access database from LAN (production)
    }
}
const connectionTimeout = 60000;
const requestTimeout = 60000;
const upgiSystemAccount = 'upgiSystem';
const upgiSystemPassword = 'upgiSystem';

// ldap
const ldapServerUrl = 'ldap://upgi.ddns.net:389';

function passphrase() { // can be later changed to pull something from other locations
    return 'This is not a passphrase';
}

// logging
const logDir = 'log';

// misc
const workingTimezone = 'Asia/Taipei';
const reportingFrequency = '0 0 8,22 * * *';

module.exports = {
    botAPIUrl: botAPIUrl,
    broadcastServerUrl: broadcastServerUrl(),
    broadcastActiveStatus: broadcastActiveStatus,
    broadcastFrequency: broadcastFrequency,
    broadcastQuantity: broadcastQuantity,
    browserSyncPort: browserSyncPort,
    development: development,
    ldapServerUrl: ldapServerUrl,
    logDir: logDir,
    mssqlConfig: {
        server: mssqlServerHost().slice(7),
        user: upgiSystemAccount,
        password: upgiSystemPassword,
        port: mssqlServerPort,
        connectionTimeout: connectionTimeout,
        requestTimeout: requestTimeout
    },
    mssqlServerUrl: mssqlServerUrl(),
    passphrase: passphrase(),
    publicServerUrl: publicServerUrl(),
    reportingFrequency: reportingFrequency,
    serverHost: serverHost,
    serverHostname: serverHostname,
    serverPort: serverPort,
    serverUrl: `${serverHost}:${serverPort}`,
    systemReference: systemReference,
    upgiSystemAccount: upgiSystemAccount,
    upgiSystemPassword: upgiSystemPassword,
    workingTimezone: workingTimezone
};
