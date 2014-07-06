var mongodb = require('./mongo_db.js');

module.exports.login = function(request, res) {
	console.log(request.body);
	console.log("username: " + request.body.username + " password: " + request.body.password);
	var username = request.body.username;
	var password = request.body.password;

	mongodb.connect(function(err, db) {
		db.collection('users', function(er, collection) {
			collection.findOne({
				"username": username
			}, function(er, user) {
				//verifica se achou o usuário
				if (user != null) {
					if (user.password == password) {
						res.send(user);
					} else {
						res.send("Failed to authenticate.");
					}
				} else {
					res.send("No user found.");
				}
			});
		});
	});
};

module.exports.createLocalUser = function(request, res) {

	var document = {
		"username": request.body.username,
		"password": request.body.password,
		"name": request.body.name,
		"email": request.body.email,
		"gender": request.body.gender,
		"birthday": new Date(request.body.birthday),
		"denominationID": request.body.denominationID,
		"state": request.body.state,
		"city": request.body.city,
		"country": request.body.country
	};

	console.log(document);

	mongodb.connect(function(err, db) {
		db.collection('users', function(er, collection) {
			collection.findOne({
				"username": request.body.username
			}, function(er, user) {
				//verifica se achou o usuário
				if (user != null) {
					response = {"message" : "Usuário já existe", "status": "ok"};
					res.send(JSON.stringify(response));
				} else {
					//insere o usuario
					db.collection('users').insert(document, function(err, records) {
						if (err)
							throw err;
						res.send(records[0]._id);
						console.log("Record added as " + records[0]._id);
					});
				}
	 		});
		});
	});
}
