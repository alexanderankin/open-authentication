var express = require('express');
var router = express.Router();

var util = require('../util');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {});
});

router.use('/install', require('./install'));

router.use('/login', require('./login'));
router.use('/logout', function (req, res, next) {
  res.clearCookie('user_id', util.cookieOptions.clear);
  res.redirect('/');
});

router.use('/dashboard', function(req, res, next) {
  if (req.signedCookies.user_id) { return next(); }

  var error = new Error('Unauthorized user for dashboard');
  error.status = 403;
  next(error);
}/*, require('./dashboard')*/);

module.exports = router;
