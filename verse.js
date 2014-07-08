var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
require('./config.js');

module.exports.addVerse = function(request, res) {
	var decoded = jwt.decode(request.headers.token, tokenSecret);

	if (!(decoded.userid == request.body.author) || decoded == null) {
		res.send(403);
		return;
	}
	var userid = decoded.userid;

	mongodb.connect(function(err, db) {

		var verse = request.body;
		verse.author = userid;
		verse.CreationDate = Date.now();
		verse.SharedWith = [];
		verse.SharedWithLength = 0;

		//Inserts verse into the collection
		db.collection('verses').insert(verse, function(err, records) {
			if (err)
				throw err;

			console.log("New verse added as " + records[0]._id);

			//Insert verse (ID) into the user's verses
			db.collection('users').update({
				_id: records[0].author
			}, {
				$push: {
					verses: records[0]._id
				}
			});

		});
	});
};

module.exports.getRandomVerse = function(request, res) {
	var decoded = jwt.decode(request.headers.token, tokenSecret);

	if (decoded == null || decoded.userid == null) {
		res.send(403);
		return;
	}
	var userid = decoded.userid;
	mongodb.connect(function(err, db) {
		//Find the verse, and update the fields(SharedWith   and 	SharedWithLenght)
		db.collection('verses').findAndModify({
				author: {
					$ne: userid
				}
			}, [
				["CreationDate", "asc"],
				["SharedWithLength", "asc"]
			], {
				$push: {
					SharedWith: userid
				},
				$inc: {
					SharedWithLength: 1
				}
			},
			function(err, records) {
				if (err) {
					throw err;
				}

				console.log("Versículo " + records[0]._id);

				//Insert verse (ID) into the user's verses pocket
				db.collection('users').update({
					_id: records[0].author
				}, {
					$push: {
						verses: records[0]._id
					}
				});
				res.json(records[0]);
			});
	});

}
