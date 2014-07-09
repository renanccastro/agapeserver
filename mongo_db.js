var mongo = require('mongodb');

var mongoUri = process.env.MONGOLAB_URI ||
	process.env.MONGOHQ_URL ||
	'mongodb://localhost/agape';

module.exports.connect = function(callback) {
	mongo.Db.connect(mongoUri, function(err, db) {
		callback(err, db);
	});
};
