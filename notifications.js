var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
require('./config.js');

module.exports.getNotifications = function(request, res){
	var decoded = jwt.decode(request.headers.token, tokenSecret);

	if (!decoded || !decoded.userid) {
		res.send(403);
		return;
	}
	var userid = decoded.userid;
	
	mongodb.connect(function(err, db) {
		if(err){res.send(404);
			return;
		}
		
		db.collection('notifications', function(er, collection) {
			if(er){res.send(404);
				return;
			}
			
			collection.findOne({
				"userid": userid
			}, function(er, not) {
				if(not == null || er != null){
					res.send(404);
					return;
				}
				res.json(not);
				collection.remove({"userid": userid}, function(err, numberOfRemovedDocs){});
			});
		});
	});
	
}