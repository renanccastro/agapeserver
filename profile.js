var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
require('./config.js');

module.exports.getProfile = function(request, res) {
	var decoded = jwt.decode(request.headers.token, tokenSecret);

	if (decoded.userid == null || decoded == null) {
		res.send(403);
		return;
	}
	var targetUserId = req.params.id;

	mongodb.connect(function(err, db) {
		db.collection('users', function(er, collection) {
			collection.findOne({
				'_id': targetUserId
			}, function(er, user) {
				if(er){
					res.send(404);
				}
				var response;
				response._id = user._id;
				response.name = user.name;
				response.email = user.email;
				response.gender = user.gender;
				response.state = user.state;
				response.city = user.city;
				response.photo = user.photo;
				response.lastModified = user.lastModified;
				res.json(response);
			});
		});
	});
}
