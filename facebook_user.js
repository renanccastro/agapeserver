// Make things with facebook user
var mongodb = require('./mongo_db.js');


module.exports.loginAndCreatIfNotExists = function(request, res){
   console.log("facebookuserid: " + request.headers.facebookuserid + " accesstoken: "+ request.headers.accesstoken);
   var accesstoken = request.headers.accesstoken;
   var facebookuserid = request.headers.facebookuserid;


   	mongodb.connect(function (err, db) {
	  db.collection('users', function(er, collection) {
	    collection.findOne({'_id': facebookuserid}, function(er,rs) {
	    	//verifica se achou o usuário
	    	if (rs != null) {
   				parseUserToken(accesstoken, request, function(userInfo){
   					res.send("correto");
   				}, function(error){
   					res.send("errado issae");
   				});

		    }else{
		    	createFacebookUser(request, res);
		    }
	    });
	  });
	});
};



module.exports.login = function(request, res){
   console.log("facebookuserid: " + request.headers.facebookuserid + " accesstoken: "+ request.headers.accesstoken);
   var accesstoken = request.headers.accesstoken;
   var facebookuserid = request.headers.facebookuserid;


   	mongodb.connect(function (err, db) {
	  db.collection('users', function(er, collection) {
	    collection.findOne({'_id': facebookuserid}, function(er,rs) {
	    	//verifica se achou o usuário
	    	if (rs != null) {
   				parseUserToken(accesstoken, request, function(userInfo){
   					res.send("correto");
   				}, function(error){
   					res.send("errado issae");
   				});

		    }else{
		    	res.send("usuário inexistente");
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
		if (user.facebookuserid == postData.headers.facebookuserid) {
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
   var accesstoken = requestInfo.headers.accesstoken;

   var validTokenCallback = function(userInfo){

		   var document = {"_id" : userInfo.facebookuserid,
		   		"username" : userInfo.username, 
		   	   "name" : userInfo.name,
			   "email" : userInfo.email, "gender" : userInfo.gender,
			   "birthday" : new Date(userInfo.birthday), "denominationID" : requestInfo.headers.denominationID,
			   "state" : requestInfo.headers.state, "city" : requestInfo.headers.city, "country" : requestInfo.headers.country};

		   console.log(document);

		   mongodb.connect( function (err, db) {
		   		db.collection('users').insert(document, function(err, records) {
					if (err)
						throw err;
					response.send(records[0]._id);
					console.log("Record added as "+records[0]._id);
				});
			});

   	};
   var failedCallback = function(error){

   };
   parseUserToken(accesstoken, requestInfo, validTokenCallback, failedCallback);
};