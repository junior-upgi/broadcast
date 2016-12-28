const moment = require('moment-timezone');
const mssql = require('mssql');

const serverConfig = require('./serverConfig.js');
const utility = require('./utility.js');

module.exports = {
    executeQuery: function(queryString, callback) {
        let currentDatetime = moment(moment(), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
        let mssqlConnection = new mssql.Connection(serverConfig.mssqlConfig);
        mssqlConnection.connect()
            .then(function() {
                let mssqlRequest = new mssql.Request(mssqlConnection);
                mssqlRequest.query(queryString)
                    .then(function(recordset) {
                        // console.log('\n' + queryString + '\n');
                        mssqlConnection.close();
                        utility.writeSystemLog(currentDatetime, 'database operation', 'general', `query success: ${queryString}`);
                        callback(recordset);
                    })
                    .catch(function(error) {
                        // utility.alertSystemError('query failure', `[queryString]: ${queryString}`, error);
                        utility.writeSystemLog(currentDatetime, 'database operation', 'error', `query failure: ${queryString}\n\n${error}`);
                        console.log('query failure: ' + error);
                        callback(null, error);
                    });
            })
            .catch(function(error) {
                // utility.alertSystemError('database connection failure', `[queryString]: ${queryString}`, error);
                utility.writeSystemLog(currentDatetime, 'database operation', 'error', `connection failure: ${queryString}\n\n${error}`);
                console.log('database connection failure: ' + error);
                callback(null, error);
            });
    }
};
