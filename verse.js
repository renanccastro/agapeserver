var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
require('./config.js');

module.exports.addVerse = function(request, res) {
	var decoded = jwt.decode(request.headers.token, tokenSecret);

	if (decoded.userid == null || decoded == null) {
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
			}, function(err, record) {
				if (!err)
					res.send(200);
				else
					res.send(403);
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
				//acha versículos que não são do usuário e que não foram pegos por ele ainda
				author: {
					$ne: userid
				},
				SharedWith: {
					$nin: [userid]
				}
			}, [
				["SharedWithLength", "asc"],
				["CreationDate", "asc"]
			], {
				$push: {
					SharedWith: userid
				},
				$inc: {
					SharedWithLength: 1
				}
			},
			//Seta para já vir o documento atualizado
			{
				"new": true
			},
			function(err, record) {
				//se não conseguiu achar, retorna 404.
				if (err || record == null) {
					res.send(404);
					return;
				}

				console.log("Versículo " + record);

				//Insert verse (ID) into the user's verses pocket
				db.collection('users').update({
					_id: record.author
				}, {
					$push: {
						verses: record._id
					}
				}, function(err, records) {
					res.json(record);
				});
			});
	});

}
