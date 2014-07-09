var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
require('./config.js');

/**
*	@apiDefineSuccessStructure Profile
*	@apiSuccess (Sucesso - 200) {String} message
*	@apiSuccess (Sucesso - 200) {String} message._id id do usuário.
*	@apiSuccess (Sucesso - 200) {String} message.password SHA1 hash da senha do usuário.
*	@apiSuccess (Sucesso - 200) {String} message.name Nome do usuário.
*	@apiSuccess (Sucesso - 200) {String} message.email Email do usuário.
*	@apiSuccess (Sucesso - 200) {String} message.gender Sexo do usuário.
*	@apiSuccess (Sucesso - 200) {Date} message.birthday Data de nascimento do usuário.
*	@apiSuccess (Sucesso - 200) {String} message.denominationID ID da denominação do usuário.
*	@apiSuccess (Sucesso - 200) {String} message.state Estado(localização) do usuário.
*	@apiSuccess (Sucesso - 200) {String} message.city Cidade(localização) do usuário.
*	@apiSuccess (Sucesso - 200) {String} message.country País(localização) do usuário.
*	@apiSuccess (Sucesso - 200) {String} status ok
*	@apiSuccess (Sucesso - 200) {String} token O token do servidor para ser usado na autenticação
*/



/**
 * @apiDefineErrorStructure NotAuthorized_v2
 * @apiError (Erro na autenticação) {String} message Senha inválida/Usuário não encontrado
 * @apiError (Erro na autenticação) {String} status failed
 */

/**
*	@api {post} /loginlocalpost/ Loga um usuário com username e senha
*	@apiName PostLoginLocalPost
*	@apiGroup Login - Local
*
*	@apiParam {String} username Username do usuário.
*	@apiParam {String} password SHA1 hash da senha do usuário.
*
*	@apiSuccessStructure Profile
*	@apiErrorStructure NotAuthorized_v2
*
*/
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
						var token = jwt.encode({userid: user._id}, tokenSecret);
						res.send({"message" : user, "status": "ok", "token" : token});
					} else {
						console.log("teste"+user.password + request.body.password);
						res.send({"message" : "Senha inválida", "status": "failed"});
					}
				} else {
					res.send({"message" : "Usuário não encontrado", "status": "failed"});	
				}
			});
		});
	});
};


/**
*	@api {post} /createlocaluser/ Cria um usuário com o perfil informado.
*	@apiName PostCreatLocalUser
*	@apiGroup Login - Local
*
*	@apiParam {String} username Username do usuário.
*	@apiParam {String} password SHA1 hash da senha do usuário.
*	@apiParam {String} username Username do usuário.
*	@apiParam {String} password SHA1 hash da senha do usuário.
*	@apiParam {String} name Nome do usuário.
*	@apiParam {String} email Email do usuário.
*	@apiParam {String} gender Sexo do usuário.
*	@apiParam {String} birthday Data de criação do versículo.
*	@apiParam {String} denominationID ID da denominação do usuário.
*	@apiParam {String} state Estado(localização) do usuário.
*	@apiParam {String} city Cidade(localização) do usuário.
*	@apiParam {String} country País(localização) do usuário.
*
*	@apiSuccess (Sucesso - 200) {String} message
*	@apiSuccess (Sucesso - 200) {String} message._id id do usuário.
*	@apiSuccess (Sucesso - 200) {String} status ok
*
*
*	@apiError (Erro na autenticação) {String} message Usuário já existe
*	@apiError (Erro na autenticação) {String} status failed
*/
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
