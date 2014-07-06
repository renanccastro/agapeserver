// Make things with facebook user
var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
require('./config.js');


module.exports.loginAndCreatIfNotExists = function(request, res){
   console.log("facebookuserid: " + request.body.facebookuserid + " accesstoken: "+ request.body.accesstoken);
   var accesstoken = request.body.accesstoken;
   var facebookuserid = request.body.facebookuserid;


   	mongodb.connect(function (err, db) {
	  db.collection('users', function(er, collection) {
	    collection.findOne({'_id': facebookuserid}, function(er,user) {
	    	//verifica se achou o usuário
	    	if (user != null) {
   				parseUserToken(accesstoken, request, function(userInfo){
					var token = jwt.encode({userid: user._id}, tokenSecret);
   					res.json({"profile": user, "created_now": "NO", "token" : token});
   				}, function(error){
   					res.send("Failed to authenticate!");
   				});

		    }else{
		    	createFacebookUser(request, res);
		    }
	    });
	  });
	});
};



module.exports.login = function(request, res){
   console.log("facebookuserid: " + request.body.facebookuserid + " accesstoken: "+ request.body.accesstoken);
   var accesstoken = request.body.accesstoken;
   var facebookuserid = request.body.facebookuserid;


   	mongodb.connect(function (err, db) {
	  db.collection('users', function(er, collection) {
	    collection.findOne({'_id': facebookuserid}, function(er,user) {
	    	//verifica se achou o usuário
	    	if (user != null) {
   				parseUserToken(accesstoken, request, function(userInfo){
					var token = jwt.encode({userid: user._id}, tokenSecret);
   					res.json({"profile": user, "created_now": "YES", "token" : token});
   				}, function(error){
   					res.send("Failed to authenticate.");
   				});

		    }else{
		    	res.send("No user Found.");
		    }
	    });
	  });
	});
};


module.exports.createFacebookUser = createFacebookUser;

/*callback({facebookuserid: data.id,
			username: data.username,
			firstName: data.first_name,
			lastName: data.last_name,
			email: data.email}),
failCallback({code: response.statusCode, message: data.error.message})*/
function parseUserToken(token, postData, callback, failCallback) {
	console.log("token: " + token);
	var request = require('request');
	var path = 'https://graph.facebook.com/me?access_token=' + token;
	request(path, function (error, response, body) {
		var data = JSON.parse(body);
	if (!error && response && response.statusCode && response.statusCode == 200) {
		var user = {
			facebookuserid: data.id,
			name: data.first_name + " " + data.last_name,
			username: data.username,
			email: data.email,
			gender: data.gender,
			birthday: data.birthday
		};
		if (user.facebookuserid == postData.body.facebookuserid) {
			   	console.log("deu certo");
			callback(user);
		}else{
			failCallback({code: 404, message: "Usuário não confere com token."});
		}
	}
	else {
		console.log(data.error);
		failCallback({code: response.statusCode, message: data.error.message})
	}
	});
}


//Cria um usuario no facebook
function createFacebookUser(requestInfo, response){
   var accesstoken = requestInfo.body.accesstoken;

   var validTokenCallback = function(userInfo){

		   var document = {"_id" : userInfo.facebookuserid,
		   		"username" : userInfo.username, 
		   	   "name" : userInfo.name,
			   "email" : userInfo.email, "gender" : userInfo.gender,
			   "birthday" : new Date(userInfo.birthday), "denominationID" : requestInfo.body.denominationID,
			   "state" : requestInfo.body.state, "city" : requestInfo.body.city, "country" : requestInfo.body.country};

		   console.log(document);

		   mongodb.connect( function (err, db) {
		   		db.collection('users').insert(document, function(err, records) {
					if (err)
						throw err;
						
					var token = jwt.encode({userid: records[0]._id}, tokenSecret);
	   				res.json({"profile": records[0]._id, "created_now": "YES", "token" : token});
					console.log("Record added as "+records[0]._id);
				});
			});

   	};
   var failedCallback = function(error){

   };
   parseUserToken(accesstoken, requestInfo, validTokenCallback, failedCallback);
};