// Make things with facebook user
var mongodb = require('./mongo_db.js');


module.exports.login = function(request, res){
   console.log("username: " + request.headers.name + " accessToken: "+ request.headers.accessToken);
   var accessToken = request.headers.accessToken;
   var username = request.headers.name;


   	mongodb.connect(function (err, db) {
	  db.collection('users', function(er, collection) {
	    collection.findOne({'username': username}, function(er,rs) {
	    	//verifica se achou o usuário
	    	if (rs != null) {
		    	if (rs.accessToken == accessToken) {
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
};


module.exports.createFacebookUser = function(request, res){
   var accessToken = res.headers.accessToken;

   var validTokenCallback = function(userInfo){

		   var document = {"username" : request.headers.username,
			   "email" : userInfo.email, "gender" : userInfo,
			   "birthday" : new Date(request.headers.birthday), "denominationID" : request.headers.denominationID,
			   "state" : request.headers.state, "city" : request.headers.city, "country" : request.headers.country};

		   console.log(document);

		   mongodb.connect( function (err, db) {
		   		db.collection('users').insert(document, function(err, records) {
					if (err)
						throw err;
					res.send(records[0]._id);
					console.log("Record added as "+records[0]._id);
				});
			});

   	};
   var failedCallback = function(error){

   };

   parseUserToken(accessToken, request, validTokenCallback, failedCallback);
};


/*callback({facebookUserId: data.id,
			username: data.username,
			firstName: data.first_name,
			lastName: data.last_name,
			email: data.email}),
failCallback({code: response.statusCode, message: data.error.message})*/
module.exports.parseUserToken = function parseUserToken(token, postData, callback, failCallback) {
	var request = require('request');
	var path = 'https://graph.facebook.com/me?access_token=' + token;
	request(path, function (error, response, body) {
		var data = JSON.parse(body);
	if (!error && response && response.statusCode && response.statusCode == 200) {
		var user = {
			facebookUserId: data.id,
			username: data.username,
			firstName: data.first_name,
			lastName: data.last_name,
			email: data.email

		};
		if (user.username == postData.headers.username &&
   			user.email == postData.headers.email) {
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