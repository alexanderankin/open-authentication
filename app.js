// load variables from .env
var path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')
});

var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var OAuthServer = require('express-oauth-server');

var middleware = require('./middleware');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// set defaults, useful for initial scaffolded views
app.locals['title'] = 'Attempt-8-10';

// initialize OAuth server library
app.oauth = new OAuthServer({
  model: require('./db/model'),
  useErrorHandler: true, 
  continueMiddleware: false
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env['cookie_secret'] || 'keyboard ninja'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(middleware.checkInstall);

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/oauth/oauth2/authorize', app.oauth.authorize());
app.use('/oauth/oauth2/authenticate', app.oauth.authenticate());
app.use('/oauth/oauth2/token', app.oauth.token());


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

module.exports = app;
