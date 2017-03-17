
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

var server = require('http').createServer(app);
var io = require('socket.io')(server);

var SyncIt = require("./syncit.js");
var syncIt = new SyncIt(io);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

server.listen(3000);

server.on("listening", function () {


    // game logic is defined here


    // globally shared game state, used by each client to render data
    var gameState = {
        players: []
    };
    syncIt.sync("gameState", gameState);


    syncIt.setOnClientConnectedListener(function (client) {
        console.log("Connected " + client.id);
    });

    syncIt.setOnClientDisconnectedListener(function (client) {
        console.log("Disconnected " + client.id);
    });



    syncIt.start(40);
});




/* HELPER */


function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

module.exports = app;
