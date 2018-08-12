var qs = require('querystring');

var knex = require('../db');

var success = false;

function checkInstall(req, res, next) {
  // assume db not dropped during server function
  if (success) return next();

  // allow for install to work before installed
  if (req.originalUrl.startsWith('/install')) {
    return next();
  }

  // check if settings table is present
  knex.schema.hasTable('settings').asCallback(function (error, exists) {
    if (error) {
      res.redirect('/install?' + qs.stringify({ error: error.code }));
    }

    if (exists) {
      success = true;
      next();
    } else {
      res.redirect('/install?' + qs.stringify({ error: 'No Table' }));
    }
  });
}

module.exports = {
  checkInstall
};
