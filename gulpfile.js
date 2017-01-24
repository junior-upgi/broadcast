const gulp = require('gulp');
const requireDir = require('require-dir');

const $ = require('gulp-load-plugins')({
    lazy: true,
    camelize: true
});

const serverConfig = require('./src/backend/module/serverConfig.js');
const utility = require('./gulpTask/utility.js');

requireDir('./gulpTask');

gulp.task('help', $.taskListing);

gulp.task('startServer', ['preRebuild', 'lint', 'buildBackend'], function() {
    let nodemonOption = {
        script: './build/server.js',
        delayTime: 1,
        env: {
            'PORT': serverConfig.serverPort,
            'NODE_ENV': serverConfig.development ? 'development' : 'production'
        },
        verbose: false,
        ext: 'html js mustache',
        watch: ['./src/backend/'],
        tasks: ['preRebuild', 'lint', 'buildBackend']
    };
    return $.nodemon(nodemonOption)
        .on('start', function() {
            utility.log('*** server started on: ' + serverConfig.serverUrl);
        })
        .on('restart', function(event) {
            utility.log('*** server restarted and operating on: ' + serverConfig.serverUrl);
            utility.log('files triggered the restart:\n' + event);
        })
        .on('crash', function() {
            utility.log('*** server had crashed...');
        })
        .on('shutdown', function() {
            utility.log('*** server had been shutdown...');
        });
});
