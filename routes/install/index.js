var express = require('express');
var router = express.Router();

var qs = require('querystring');

var db = require('../../db');
var install = require('../../db/install');

/* GET /install */
router.get('/', function(req, res, next) {
  var error = req.query.error;
  var credentials = req.query.credentials;
  var dbName = db.client.connectionSettings.database;
  res.render('install', { error, credentials, dbName });
});

/**
 * check creds -> install -> report error on /install or confirm
 * else complain credentials on /install
 */
router.post('/', function (req, res, next) {
  if (req.body.user === process.env['reset_user'] &&
    req.body.pass === process.env['reset_pass']) {

    install(function (error) {
      if (error) {
        error = error.code ? error.code : ('' + error);
        return res.redirect('/install?' + qs.stringify({ error }));
      }

      res.redirect('/install/confirm');
    });
  }

  else {
    res.redirect('/install?' + qs.stringify({ credentials: true }));
  }
});

router.get('/confirm', function (req, res, next) {
  res.render('confirm');
});

module.exports = router;
