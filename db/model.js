var async = require('async');
var crypto = require('crypto');
var md5 = require('md5');

var db = require('./index');

function generateToken(done) {
  // 40 characters long
  crypto.randomBytes(256, function(ex, buffer) {
    if (ex) return done(ex);

    var token = crypto.createHash('sha1').update(buffer).digest('hex');
    done(null, token);
  });
}

// generateToken((e, t) => { if (e) throw e; console.log('token', t); });

function Model() {}

Model.prototype.generateAccessToken = function(client, user, scope, done) {
  generateToken(done);
};

Model.prototype.generateRefreshToken = function(client, user, scope, done) {
  generateToken(done);
};

Model.prototype.generateAuthorizationCode = function(client, user, scope, done) {
  generateToken(done);
};
  
// access_tokens: db.schema.createTable('access_tokens', function (t) {
//   t.string('access_token', 40).notNullable().primary();
//   t.string('client_id', 80);
//   t.foreign('client_id').references('clients.client_id');
//   t.string('user_id', 80);
//   t.foreign('user_id').references('users.user_id');
//   t.timestamp('expires').notNullable();
//   t.string('scope', 400);
// token = {
//   accessToken: accessToken, // same as passed in
//   accessTokenExpiresAt: access_token.expires, // Date
//   scope: '',
//   client: { id: client.client_id },
//   user: { /**/ }
// }

Model.prototype.getAccessToken = function(accessToken, done) {
  var query = db('access_tokens as at')
    .select('*')
    .join('users as u', 'u.user_id', '=', 'at.user_id')
    .where({
      'at.access_token': accessToken
    })
  console.log(query.toString());

  query
    .then(function (rows) {
      var token = rows[0];
      if (token) {
        done(null, {
          accessToken: accessToken,
          accessTokenExpiresAt: token.expires,
          scope: token.scope,
          client: { id: token.client_id },
          user: token
        });
      } else {
        done(null, false);
      }
    })
    .catch(done);
};

Model.prototype.getRefreshToken = function(refreshToken, done) {
  var query = db('refresh_tokens as rt')
    .select('*')
    .join('users as u', 'u.user_id', '=', 'rt.user_id')
    .where({ 'rt.refresh_token': refreshToken });
  console.log(query.toString());

  query
    .then(function (rows) {
      var token = rows[0];
      if (token) {
        done(null, {
          refreshToken: refreshToken,
          refreshTokenExpiresAt: token.expires,
          scope: token.scope,
          client: { id: token.client_id },
          user: token
        })
      } else {
        done(null, false);
      }
    })
    .catch(done);
};

Model.prototype.getAuthorizationCode = function(authorizationCode, done) {
  var query = db('authorization_codes as ac')
    .select('*')
    .join('users as u', 'u.user_id', '=', 'ac.user_id')
    .where({ 'ac.authorization_code': authorizationCode });
  console.log(query.toString());

  query
    .then(function (rows) {
      var token = rows[0];
      if (token) {
        done(null, {
          code: authorizationCode,
          expiresAt: token.expires,
          redirectUri: token.redirect_uri,
          scope: token.scope,
          client: { id: token.client_id },
          user: token
        });

        return null;
      } else {
        done(null, false);
      }
    })
    .catch(done);
};

Model.prototype.getClient = function(clientId, clientSecret, done) {
  // console.log(arguments);

  // refactored this way because clientSecret sometimes null???
  var whereObj = { 'c.client_id': clientId };
  if (clientSecret) {
    whereObj['c.client_secret'] = clientSecret;
  }

  var query = db('clients as c')
    .select('*')
    .where(whereObj);
  console.log(query.toString());

  query
    .then(function (rows) {
      var client = rows[0];
      if (client) {
        done(null, {
          id: clientId,
          redirectUris: [client.redirect_uri],
          grants: client.grant_types.split(' '),
          accessTokenLifetime: client.access_token_lifetime,
          refreshTokenLifetime: client.refresh_token_lifetime
        });
      } else {
        done(null, false);
      }
    })
    .catch(done);
};

Model.prototype.getUser = function(username, password, done) {
  var query = db('users as u')
    .select('*')
    .where({
      'u.username': username,
      'u.password': md5(process.env['salt'] + password)
    });
  console.log(query.toString());

  query
    .then(function (rows) {
      done(null, rows[0]);
    })
    .catch(done);
};

Model.prototype.getUserFromClient = function(client, done) {
  var query = db('user as u')
    .select('u.*')
    .join('clients as c', 'c.user_id', '=', 'u.user_id')
    .where({
      'c.client_id': client.id
    });
  console.log(query.toString());

  query
    .then(function (rows) {
      done(null, rows[0]);
    })
    .catch(done);
};

Model.prototype.saveToken = function(token, client, user, done) {
  var accessQuery = db('access_tokens')
    .insert({
      'access_token': token.accessToken,
      'client_id': client.id,
      'user_id': user.user_id,
      'expires': token.accessTokenExpiresAt,
      'scope': token.scope
    });
  console.log(accessQuery.toString());

  var refreshQuery = db('refresh_tokens')
    .insert({
      'refresh_token': token.refreshToken,
      'client_id': client.id,
      'user_id': user.user_id,
      'expires': token.refreshTokenExpiresAt,
      'scope': token.scope
    });
  console.log(refreshQuery.toString());

  async.series([
    function saveAccessToken(done) {
      accessQuery.asCallback(done);
    },
    function saveRefreshToken(done) {
      refreshQuery.asCallback(done);
    }
  ], function (err) {
    console.log("saveToken returning arguments", arguments);
    if (err) { return done(err); }

    var doneVal = Object.assign({}, token);
    doneVal.client = client;
    doneVal.user = user;
    done(null, doneVal);
  });
};

Model.prototype.saveAuthorizationCode = function(code, client, user, done) {
  var query = db('authorization_codes')
    .insert({
      'authorization_code': code.authorizationCode,
      'client_id': client.id,
      'user_id': user.user_id,
      'redirect_uri': code.redirectUri,
      'expires': code.expiresAt,
      'scope': code.scope
    });
  console.log(query.toString());

  query
    .then(function () {
      done(null, {
        authorizationCode: code.authorizationCode,
        expiresAt: code.expiresAt,
        redirectUri: code.redirectUri,
        scope: code.scope,
        client, user
      });
    })
    .catch(done);
};

Model.prototype.revokeToken = function(token, done) {
  var query = db('refresh_tokens')
    .delete()
    .where({ 'refresh_token': token.refreshToken });
  console.log(query.toString());

  query
    .then((number) => done(null, number === 0))
    .catch(done);
};

Model.prototype.revokeAuthorizationCode = function(code, done) {
  console.log(arguments);
  var query = db('authorization_codes')
    .delete()
    .where({ 'authorization_code': code.code });
  console.log(query.toString());

  query
    .then((number) => done(null, number !== 0))
    .catch(done);
};

// Model.prototype.validateScope = function(user, client, scope, done) {
//   scopes = [].join(' ');
// };

Model.prototype.verifyScope = function(token, scope, done) {
  if (!token.scope)
    return false;

  let requestedScopes = scope.split(' ');
  let authorizedScopes = token.scope.split(' ');
  done(null, requestedScopes.every(s => authorizedScopes.indexOf(s) >= 0));
};

// var m = new Model();
// m.getAccessToken('', (e, r) => console.log(e, r));
// m.getRefreshToken('', (e, r) => console.log(e, r));
// m.getAuthorizationCode('', (e, r) => console.log(e, r));
// m.getClient('', '', (e, r) => console.log(e, r));
// m.getUser('', '', (e, r) => console.log(e, r));
// m.getUserFromClient({ id: 5 }, (e, r) => console.log(e, r));
// m.saveToken({
//   accessToken: 'success ok',
//   accessTokenExpiresAt: new Date(new Date().getTime() + 86400 * 1000),
//   refreshToken: 'this is a test',
//   refreshTokenExpiresAt: new Date(new Date().getTime() + 86400 * 1000),
//   scope: 'scope'
// }, { id: 5 }, { user_id: 2 }, function(e, r) { console.log(arguments) });
// m.saveAuthorizationCode({
//   authorizationCode: 'code',
//   expiresAt: new Date(new Date().getTime() + 86400 * 1000),
//   redirectUri: 'localhost',
//   scope: 'read write'
// }, { id: 3 }, { user_id: 'things' })
// m.revokeToken(token = {
//   refreshToken: 'this is a test',
//   refreshTokenExpiresAt: new Date(new Date().getTime() + 86400 * 1000),
//   scope: 'read write',
//   client: { id: 3 },
//   user: { name: 'ok' }
// }, function(e, r) {console.log(arguments)});

module.exports = new Model();
