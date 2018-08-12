var express = require('express');
var router = express.Router();

var md5 = require('md5');
var qs = require('querystring');

var db = require('../../db');
var util = require('../../util');


/* GET /login. */
router.get('/', function(req, res, next) {
  if (req.signedCookies.user_id) {
    return res.redirect('/dashboard');
  }
  res.render('login', req.query);
});

router.post('/', function(req, res, next) {
  db('users')
    .select('*')
    .where({
      username: req.body.username,
      password: md5(process.env['salt'] + req.body.password)
    })
    .then(function (rows) {
      if (rows[0]) {
        res.cookie('user_id', util.cookieOptions.send);
        res.redirect('/dashboard');
      } else {
        res.redirect('/login?' + qs.stringify({
          message: `Credentials (${req.body.username}) not recognized.`
        }));
      }
    })
    .catch(function (error) {
      res.redirect('/login?' + qs.stringify({
        message: `Credentials (${req.body.username}) not recognized.`
      }));
    })
})

module.exports = router;
