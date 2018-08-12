var express = require('express');
var router = express.Router();

var async = require('async');
var url = require('url');

var util = require('../../util');
var db = require('../../db');

/**
 * Everything here is accessible only with verified cookie
 */

/* GET /dashboard. */
router.get('/', function(req, res, next) {
  var userQuery = db('users')
    .select('*').where({ user_id: req.signedCookies['user_id'] });
  var clientsQuery = db('clients')
    .select('*').where({ user_id: req.signedCookies['user_id'] });
  var atokensQuery = db('access_tokens')
    .select('*').where({ user_id: req.signedCookies['user_id'] });
  
  async.series([
    function(done) { userQuery.asCallback(done); },
    function(done) { clientsQuery.asCallback(done); },
    function(done) { atokensQuery.asCallback(done); }
  ], function (err, results) {
    if (err) { return next(err); }

    var user = results[0].pop();
    // if (!user) return next(new Error('No user for cookie'));
    if (!user) return res.redirect('/logout');

    var clients = (results[1] && results[1][0]) ? results[1] : [{}];
    var clientHeaders = Object.keys(clients[0]);

    // tweak: skip some of them
    var skip = ['user_id', 'access_token_lifetime', 'refresh_token_lifetime'];
    clientHeaders = clientHeaders.filter(h => skip.indexOf(h) < 0);

    var sessions = (results[2] && results[2][0]) ? results[2] : [{}];
    var sessionHeaders = Object.keys(sessions[0]);

    res.render('dashboard/index', {
      user, clients, clientHeaders, sessions, sessionHeaders
    });
  });
});

router.get('/clients', function (req, res, next) {
  res.render('dashboard/clients');
});

router.post('/clients', function(req, res, next) {
  var b_ = req.body;

  // this variable will have all values to populate form
  var values = {
    values: {
      inputClientId          : b_.inputClientId,
      inputClientSecret      : b_.inputClientSecret,
      inputClientRedirect    : b_.inputClientRedirect,
      grantAuthorization_code: b_.grantAuthorization_code ? true : undefined,
      grantClient_credentials: b_.grantClient_credentials ? true : undefined,
      grantRefresh_token     : b_.grantRefresh_token ? true : undefined,
      grantPassword          : b_.grantPassword ? true : undefined,
      inputAccessTokenLifetime: b_.inputAccessTokenLifetime,
      inputRefreshTokenLifetime: b_.inputRefreshTokenLifetime,
    },
    errors: []
  };

  values.values = values.values || {};

  // values of the scope checkboxes
  var scopeValues = Object.keys(b_).filter(k => k.startsWith('scope'));
  scopeValues.forEach(value => {
    values.values[value] = true;
  });

  if (!b_.inputClientId || !b_.inputClientSecret)
    values.errors.push('Client Id and Secret must be given');

  try {
    new url.URL(b_.inputClientRedirect);
  } catch (e) {
    values.errors.push('Client Redirect must be valid url');
  }

  var atLeastOneGrant = (b_.grantAuthorization_code
    || b_.grantClient_credentials
    || b_.grantRefresh_token
    || b_.grantPassword);
  if (!atLeastOneGrant)
    values.errors.push('Client application must support at least one grant');

  if (!scopeValues.length)
    values.errors.push('Client application must be given at least one scope');

  // this is error screen
  if (values.errors && values.errors.length) {
    console.log('rendering with values', values)
    return res.render('dashboard/clients', values);
  }

  var grant_types = '';
  if (b_.grantAuthorization_code) grant_types += 'authorization_code' + ' ';
  if (b_.grantClient_credentials) grant_types += 'client_credentials' + ' ';
  if (b_.grantRefresh_token) grant_types += 'refresh_token' + ' ';
  if (b_.grantPassword) grant_types += 'password';

  var query = db('clients')
    .insert({
      client_id: b_.inputClientId,
      client_secret: b_.inputClientSecret,
      redirect_uri: b_.inputClientRedirect,
      grant_types,
      scope: scopeValues.map(s => s.slice(5)).join(' '),
      user_id: req.signedCookies.user_id
    });
  // console.log(query.toString());

  query
    .then(r => {
      res.redirect('/dashboard');
    })
    .catch(e => {
      if (e.code === 'ER_DUP_ENTRY')
        values.errors.push('This client already exists');
      else
        values.errors.push('' + e);

      res.render('dashboard/clients', values);
    });
});

module.exports = router;
