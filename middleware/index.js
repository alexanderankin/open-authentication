var qs = require('querystring');

var knex = require('../db');

function checkInstall(req, res, next) {
  // console.log(req.originalUrl.startsWith('/install'));
  if (req.originalUrl.startsWith('/install')) {
    return next();
  }

  knex.schema.hasTable('settings').asCallback(function (error, exists) {
    if (error) {
      res.redirect('/install?' + qs.stringify({ error: error.code }));
    }

    if (exists) {
      next();
    } else {
      res.redirect('/install?' + qs.stringify({ error: 'No Table' }));
    }
  });
}

module.exports = {
  checkInstall
};
