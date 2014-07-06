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
						response = {"message" : user, "status": "ok"};
						res.send(JSON.stringify(response));
					} else {
						response = {"message" : "Senha inválida", "status": "failed"};
						res.send(JSON.stringify(response));
					}
				} else {
					response = {"message" : "Usuário não encontrado", "status": "failed"};
					res.send(JSON.stringify(response));	
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
					response = {"message" : "Usuário já existe", "status": "failed"};
					res.send(JSON.stringify(response));
				} else {
					//insere o usuario
					db.collection('users').insert(document, function(err, records) {
						if (err)
							throw err;
						response = {"message" : records[0]._id, "status": "ok"};
						res.send(JSON.stringify(response));
						console.log("Record added as " + records[0]._id);
					});
				}
	 		});
		});
	});
}
