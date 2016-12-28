const mssql = require('mssql');

const serverConfig = require('./serverConfig.js');

module.exports = {
    executeQuery: function(queryString, callback) {
        let mssqlConnection = new mssql.Connection(serverConfig.mssqlConfig);
        mssqlConnection.connect()
            .then(function() {
                let mssqlRequest = new mssql.Request(mssqlConnection);
                mssqlRequest.query(queryString)
                    .then(function(recordset) {
                        // console.log('\n' + queryString + '\n');
                        mssqlConnection.close();
                        callback(recordset);
                    })
                    .catch(function(error) {
                        console.log('query failure: ' + error);
                        callback(null, error);
                    });
            })
            .catch(function(error) {
                console.log('database connection failure: ' + error);
                callback(null, error);
            });
    }
};
