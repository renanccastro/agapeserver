var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
var ObjectID = require('mongodb').ObjectID;
require('./config.js');

module.exports.getProfile = function(request, res) {
	console.log("token: " + request.headers.token);
	console.log("secret: " + tokenSecret);
	var decoded = jwt.decode(request.headers.token, tokenSecret);

	if (!decoded || !decoded.userid) {
		res.send(403);
		return;
	}
	console.log(request.params.id);
	var targetUserId = request.params.id;
	var objectId;
	try{
		objectId = new ObjectID(targetUserId);
		targetUserId = objectId;
	}
	catch(err){
		console.log("Não deu certo o objectId.");
		targetUserId = request.params.id;
	}
	mongodb.connect(function(err, db) {
		db.collection('users', function(er, collection) {
			collection.findOne({
				'_id': targetUserId
			}, function(er, user) {
				if(er || user == null){
					res.send(404);
					return;
				}
				var response = {};
				response._id = user._id;
				response.name = user.name;
				response.email = user.email;
				response.gender = user.gender;
				response.state = user.state;
				response.city = user.city;
				response.country = user.country;
				response.photo = user.photo;
				response.lastModified = user.lastModified;
				res.json(response);
			});
		});
	});
}
module.exports.setDevice = function(request, res){
	var decoded = jwt.decode(request.headers.token, tokenSecret);

	if (!decoded || !decoded.userid) {
		res.send(403);
		return;
	}
	var userid = decoded.userid;
	
	mongodb.connect(function(err, db) {
		db.collection('users', function(er, collection) {
			collection.update({"_id" : userid} , {$set : {"device" : request.body.device}}, function(err,response){if(!err) res.send(200); else res.send(404);});
		});
	});
}