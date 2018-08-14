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

app.locals['title'] = 'Attempt-8-10';

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

var form = `
  <form method="post">
    <div class="form-group row">
      <label for="inputEmail3" class="col-sm-2 form-control-label">Username</label>
      <div class="col-sm-10">
        <input type="text" class="form-control" id="inputEmail3" name="username" placeholder="Username">
      </div>
    </div>
    <div class="form-group row">
      <label for="inputPassword3" class="col-sm-2 form-control-label">Password</label>
      <div class="col-sm-10">
        <input type="password" class="form-control" id="inputPassword3" name="password" placeholder="Password">
      </div>
    </div>
    <div class="form-group row">
      <div class="col-sm-offset-2 col-sm-10">
        <button type="submit" class="btn btn-secondary">Sign in</button>
      </div>
    </div>
  </form>
`;
app.use("/oauth/authorize", function(req, res, next) {
  if (req.signedCookies.user_id) return next();
  if (req.method === 'GET') return res.send(form);
  if (req.method === 'POST') {
    console.log('line67');
    require('./db')('users').select('user_id').where({
      username: req.body.username,
      password: require('md5')(process.env['salt'] + req.body.password)
    })
      .then(rows => {
        var user = rows.pop();
        if (user) {
          console.log('line 75');
          res.cookie('user_id', user.user_id, require('./util').cookieOptions.send);
        }

        console.log('line 79')
        res.redirect(req.originalUrl);
      })
      .catch(next);
  }

  else next(new Error('Neither GET nor POST'));
}, app.oauth.authorize({
  authenticateHandler: {
    handle: function (req, response) {
      return { user_id: req.signedCookies.user_id };
    }
  }
}));
app.post("/oauth/token", /*function(r, rs, n) { console.log("hello"); n(); },*/ app.oauth.token());

// app.use('/oauth/oauth2/authorize', app.oauth.authorize());
// app.use('/oauth/oauth2/token', app.oauth.token());
app.use('/oauth/oauth2/authenticate', app.oauth.authenticate());


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
