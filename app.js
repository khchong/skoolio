var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var handlebars = require('express-handlebars')
var mongoose = require('mongoose');
var session = require('client-sessions');
var woopra = require('woopra');
var multer = require('multer');

// Declare all routes here
var routes = require('./routes/index');
var profile = require('./routes/profile');
var user_projects = require('./routes/user_projects');
var interested = require('./routes/interested');
var homepage = require('./routes/homepage');
var notifications = require('./routes/notifications');
var signup = require('./routes/signup');
var login = require('./routes/login');
var logout = require('./routes/logout');

// Connect to the Mongo database, whether locally or on Heroku
var local_database_name = 'skoolio';
var local_database_uri  = 'mongodb://localhost/' + local_database_name
var database_uri = process.env.MONGOLAB_URI || local_database_uri

// Check if mongoose connected and if not, throw error
mongoose.connect(database_uri);
var db = module.exports = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function(callback) {
  console.log("DATABASE CONNECTED");
}); 



var app = module.exports = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
// app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static(__dirname + "/uploads"));
app.use(multer({dest: './uploads/'}))

app.use(session({
    cookieName: 'session',
    secret: 'ejwortjoq2ij30948nl23qnk5r2j3nk5nq23ll',
    duration: 30*60*1000,
    activeDuration: 5*60*1000,
    httpOnly: true, 
    secure: true,   
    ephemeral: true
}));

// Apply all routes 
app.use('/', routes);
app.use('/', profile);
app.use('/', interested);
app.use('/', homepage);
app.use('/', signup);
app.use('/', login);
app.use('/', logout);
app.use('/', notifications);
app.use('/', user_projects);

app.use(function(req,res,next){
    req.db = db;
    next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
