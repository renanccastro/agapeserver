var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
require('./config.js');

module.exports.addVerse = function(request, res) {
	var decoded = jwt.decode(request.headers.token, tokenSecret);
	
	if(!(decoded.userid == request.body.author) || decoded == null){
		res.send(403);
		return;
	}

	mongodb.connect(function(err, db) {

		var verse = request.body;

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
