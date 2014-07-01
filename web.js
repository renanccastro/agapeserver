// web.js
var express = require("express");
var logfmt = require("logfmt");
var app = express();
var mongo = require('mongodb');
var crypto = require('crypto');
var fs = require('fs');
var facebookUser = require('./facebook_user.js');
var localUser = require('./local_user.js');


// var privateKey = fs.readFileSync('sslcert/privatekey.pem').toString();
// var certificate = fs.readFileSync('sslcert/certificate.pem').toString();
// var credentials = crypto.createCredentials({key: privateKey, cert: certificate});
// var appSecure = express(credentials);



var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';


app.use(logfmt.requestLogger());


app.post('/loginfacebookpost', facebookUser.login);
app.post('/loginlocalpost', localUser.login);
app.post('/createlocaluser', localUser.createLocalUser);


app.get('/teste', function(req, res){
	mongo.Db.connect(mongoUri, function (err, db) {
	  db.collection('users', function(er, collection) {
	    collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
	    });
	  });
	});
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

// appSecure.listen(3450, function(){
	// console.log("https listening on 3450");
// })