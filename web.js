// web.js
var express = require("express");
var logfmt = require("logfmt");
var app = express();
var mongo = require('mongodb');
var crypto = require('crypto');
var facebookUser = require('./facebook_user.js');
var localUser = require('./local_user.js');

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';



app.use(logfmt.requestLogger());


app.post('/loginfacebookpost', facebookUser.login);

app.post('/loginlocalpost', localUser.login);


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