// web.js
var express = require("express");
var logfmt = require("logfmt");
var app = express();
var mongo = require('mongodb');
var crypto = require('crypto');

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';


app.use(logfmt.requestLogger());

app.get('/login', function(req, res) {
   console.log("username: " + req.query.username + " pass: "+ req.query.pass);

   	mongo.Db.connect(mongoUri, function (err, db) {
	  db.collection('users', function(er, collection) {
	    collection.findOne({'user': req.query.username}, function(er,rs) {
	    	//verifica se achou o usuário
	    	if (rs != null) {

		    	if (passwordHash == req.query.pass) {
		    		res.send("correto");
		    	} else{
		    		res.send("incorreto");
		    	}
		    }else{
		    	res.send("usuário inexistente");
		    }
	    });
	  });
	});
});

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