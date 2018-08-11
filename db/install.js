var async = require('async');

var db = require('./index');

var tables = {
  settings: db.schema.createTable('settings', function (t) {
    t.string('field', 100).notNullable().primary();
    t.string('value', 100);
  }),
  users: db.schema.createTable('users', function (t) {
    t.string('user_id', 80).notNullable().primary();
    t.string('username', 80);
    t.string('password', 80);
    t.string('first_name', 80);
    t.string('last_name', 80);
    t.string('email', 80);
    t.boolean('email_verified');
    t.string('scope', 4000);
  }),
  clients: db.schema.createTable('clients', function (t) {
    t.string('client_id', 80).notNullable().primary();
    t.string('client_secret', 80);
    t.string('redirect_uri', 2000);
    t.string('grant_types', 80);
    t.string('scope', 4000);
    t.string('user_id', 80);
  }),
  access_tokens: db.schema.createTable('access_tokens', function (t) {
    t.string('access_token', 40).notNullable().primary();
    t.string('client_id', 80);
    t.foreign('client_id').references('clients.client_id');
    t.string('user_id', 80);
    t.foreign('user_id').references('users.user_id');
    t.timestamp('expires').notNullable();
    t.string('scope', 4000);
  }),
  authorization_codes: db.schema.createTable('authorization_codes', function (t) {
    t.string('authorization_code', 40).notNullable().primary();
    t.string('client_id', 80);
    t.string('user_id', 80);
    t.string('redirect_uri', 2000).notNullable();
    t.timestamp('expires').notNullable();
    t.string('scope', 4000);
    t.string('id_token', 1000);
  }),
  jti: db.schema.createTable('jti', function (t) {
    t.string('issuer', 80).notNullable();
    t.string('subject', 80);
    t.string('audience', 80);
    t.timestamp('expires').notNullable();
    t.string('jti', 2000).notNullable();
  }),
  jwt: db.schema.createTable('jwt', function (t) {
    t.string('client_id', 80).notNullable();
    t.string('subject', 80);
    t.string('public_key', 2000).notNullable();
  }),
  public_keys: db.schema.createTable('public_keys', function (t) {
    t.string('client_id', 80);
    t.string('public_key', 2000);
    t.string('private_key', 2000);
    t.string('encryption_algorithm', 100).defaultTo("RS256");
  }),
  refresh_tokens: db.schema.createTable('refresh_tokens', function (t) {
    t.string('refresh_token', 40).notNullable().primary();
    t.string('client_id', 80);
    t.string('user_id', 80);
    t.timestamp('expires').notNullable();
    t.string('scope', 4000);
  }),
  scopes: db.schema.createTable('scopes', function (t) {
    t.string('scope', 80).notNullable().primary();
    t.boolean('is_default');
  }),
};

function install(callback) {
  var dbName = db.client.connectionSettings.database;
  db.raw(`drop database if exists ${dbName};`).asCallback(function (err, result) {
    if (err) { console.log("line 81"); return callback(err); }

    db.raw(`create database ${dbName};`).asCallback(function (err, result) {
      if (err) { return callback(err); }
    
      console.log(`dropped and created ${dbName}.`);
      db.raw(`use ${dbName};`).asCallback(function (err, result) {
        if (err) { return callback(err); }

        async.eachOfSeries(tables, function (value, key, done) {
          value
            .then((r) => {
              done(null);
              return null;
            })
            .catch((e) => {
              done(e);
              return null;
            });
        }, callback);
      });
    });
  });
}

// install(function (err) {
//   console.log('done', err);
// });

module.exports = install;
