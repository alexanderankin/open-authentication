var express = require('express');
var router = express.Router();

var util = require('../../util');
var db = require('../../db');

/**
 * Everything here is accessible only with verified cookie
 */

/* GET /dashboard. */
router.get('/', function(req, res, next) {
  db('users')
    .select('*')
    .where({ user_id: req.signedCookies['user_id'] })
    .asCallback(function (err, rows) {
      if (err) { return next(err); }

      var greeting = [ rows[0].first_name, rows[0].last_name ].join(' ');
      res.send(`<h1>Everything is working, ${greeting} </h1>`);
    });
});

module.exports = router;
