var knex = require('knex')({
  client: 'mysql',
  connection: {
    host     : process.env['mysqlh'] || '127.0.0.1',
    user     : process.env['mysqlu'] || 'your_database_user',
    password : process.env['mysqlp'] || 'your_database_password',
    database : process.env['mysqldb'] || 'ioauth'
  }
});

module.exports = knex;

// require('repl').start('knex>').context.knex = knex;
