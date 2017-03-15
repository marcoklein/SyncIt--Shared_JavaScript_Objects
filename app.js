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


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

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


io.on('connection', function (connected) {
    console.log("SyncIt connection: " + connected);
});

server.listen(3000);

server.on("listening", function () {

    // sync every 100ms
    var timeOut = function () {

        setTimeout(function () {
            timeOut();
        }, 1000);

        syncIt.syncNow();
    };
    timeOut();


    var testObject = {
        value: "test object",
        players: [
            {
                x: 200,
                y: 200
            }]
    };


    // sync the test object with the client
    syncIt.sync("game_state", testObject);




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
