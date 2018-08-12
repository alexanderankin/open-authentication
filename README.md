# IOAuth

A Standalone OAuth server.

## Setup

In no particular order:

* check `template.env`
* yarn install && yarn start
* create a database ahead of time if psql or mysql
* TODO SIGNUPS meanwhile checkout `bin/seed`

## Development

I have been using [this](https://github.com/ging/oauth2-example-client) tool
to test this implementation, with a slight change (i used port 3036):

```
diff --git a/server.js b/server.js
index f0f77f9..811de7b 100644
--- a/server.js
+++ b/server.js
@@ -87,5 +87,6 @@ app.get('/logout', function(req, res){
     res.redirect('/');
 });
 
-console.log('Server listen in port 80. Connect to localhost');
-app.listen(80);
+var port = parseInt(process.env['PORT'], 10) || 80;
+console.log('Server listen in port ' + port + '. Connect to localhost');
+app.listen(port);
```

the most recent configuration i tried was:

```
var config = {}

// server
config.idmURL = 'http://localhost:3000/oauth';
config.client_id = 'client1';
config.client_secret = 'client1secret';
config.callbackURL = 'http://localhost:3036/login';

// Depending on Grant Type:
// Authorization Code Grant: code
// Implicit Grant: token
config.response_type = 'code';

module.exports = config;
```
