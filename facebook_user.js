// Make things with facebook user
var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
require('./config.js');


/**
*	@api {post} /loginandcreatifnotexistsfacebook/ Cria um usuário pelo facebook ou loga se já existir.
*	@apiName PostLoginAndCreateIfNotExistsFacebook
*	@apiGroup Login - Facebook
*
*	@apiParam {String} accesstoken Facebook accesstoken do usuário.
*	@apiParam {String} facebookuserid User id do usuário no facebook.
*
*	@apiSuccess (Sucesso - 200) {String} profile
*	@apiSuccess (Sucesso - 200) {String} profile._id id do usuário.
*	@apiSuccess (Sucesso - 200) {String} profile.name Nome do usuário.
*	@apiSuccess (Sucesso - 200) {String} profile.email Email do usuário.
*	@apiSuccess (Sucesso - 200) {String} profile.gender Sexo do usuário.
*	@apiSuccess (Sucesso - 200) {Date} profile.birthday Data de nascimento do usuário.
*	@apiSuccess (Sucesso - 200) {String} created_now YES/NO
*	@apiSuccess (Sucesso - 200) {String} token O token do servidor para ser usado na autenticação
*
* 
*	@apiError (403 - Erro na autenticação) 403 Falha na autenticação do facebook token.
*/
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
   					res.send(error.code);
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
	var path = 'https://graph.facebook.com/me?fields=picture,name,email,gender,birthday,location&access_token=' + token;
	request(path, function (error, response, body) {
		var data = JSON.parse(body);
	if (!error && response && response.statusCode && response.statusCode == 200) {
		var user = {
			facebookuserid: data.id,
			name: data.name,
			photo: data.picture.data.url,
			email: data.email,
			gender: data.gender,
			birthday: data.birthday,
			location: data.location
		};
		if (user.facebookuserid == postData.body.facebookuserid) {
			   	console.log("deu certo");
			callback(user);
		}else{
			failCallback({code: 403, message: "Usuário não confere com token."});
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
	   var location = userInfo.location.split(", ");
	   var city, state;
       if (typeof location[0] != 'undefined'){
		  city = location[0];
		  state = location[1];
       }
		   var document = {"_id" : userInfo.facebookuserid,
		   	   "name" : userInfo.name,
			   "email" : userInfo.email, "gender" : userInfo.gender,
			   "birthday" : new Date(userInfo.birthday),
	   		   "lastModified": new Date(),
		   	   "city" : city, "state": state};
				
				
			   console.log("Antes de chamar");
				var callback = function(image, prefix){
					document.photo = prefix + image;
					console.log("Chamou!");
		 		   console.log(document);

		 		   mongodb.connect( function (err, db) {
		 		   		db.collection('users').insert(document, function(err, records) {
		 					if (err){
								console.log(err);
		 						throw err;
							}
						
		 					var token = jwt.encode({userid: records[0]._id}, tokenSecret);
		 	   				response.json({"profile": records[0], "created_now": "YES", "token" : token});
		 					console.log("Record added as "+records[0]._id);
		 				});
		 			});					
				};
				loadBase64Image(userInfo.photo, callback);


   	};
   var failedCallback = function(error){

   };
   parseUserToken(accesstoken, requestInfo, validTokenCallback, failedCallback);
};


var loadBase64Image = function (url, callback) {
    // Required 'request' module
    var request = require('request');

    // Make request to our image url
    request({url: url, encoding: null}, function (err, res, body) {
        if (!err && res.statusCode == 200) {
            // So as encoding set to null then request body became Buffer object
            var base64prefix = 'data:' + res.headers['content-type'] + ';base64,'
                , image = body.toString('base64');
            if (typeof callback == 'function') {
				console.log("Logo antes:");
                callback(image, base64prefix);
            }
        } else {
            throw new Error('Can not download image');
        }
    });
};