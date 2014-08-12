var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
var apn = require('./apn.js');
require('./config.js');


/**
 * @apiDefineHeaderStructure TokenHeader
 * @apiHeader {String} token Token emitido pelo server na hora do login do usuário.
 * @apiHeader {String} Content-Type application/json.
 */

/**
 * @apiDefineErrorStructure NotAuthorized
 * @apiError (Erro na autenticação) 403 Token não é válido.
 * @apiError (Erro no processo) 404 Algo falhou.
 */


/**
 * @apiDefineSuccessStructure SuccessfulAdded
 * @apiSuccess (Sucesso) 200 Adicionado com sucesso.
 */


/**
*	@apiDefineSuccessStructure Verse
*	@apiSuccess (Sucesso - 200) {String} _id id do versículo.
*	@apiSuccess (Sucesso - 200) {String} Comment Comentário.
*	@apiSuccess (Sucesso - 200) {String} Reference Referência na bíblia.
*	@apiSuccess (Sucesso - 200) {String} Author id do criador do versículo.
*	@apiSuccess (Sucesso - 200) {DateString} CreationDate Data de criação do versículo.
*	@apiSuccess (Sucesso - 200) {String[]} SharedWith Array de ids de usuários com quais o versículo foi compartilhado.
*	@apiSuccess (Sucesso - 200) {int} SharedWithLength Tamanho da propriedade anterior.
*/

/**
*	@api {post} /addverse/ Cadastrar um versículo
*	@apiHeaderStructure TokenHeader
*	@apiName PostAddVerse
*	@apiGroup Versículos
*
*	@apiParam {String} Reference Referência da bíblia, ex: "João 5:23-25".
*	@apiParam {String} Comment Comentário do versículo.
*
*	@apiExample Exemplo de payload para a request:
*		{
*			"Reference" : "João 5:23-25",
*			"Comment"	: "Edificante!"
*		}
*
*	@apiErrorStructure NotAuthorized
*	@apiSuccessStructure Verse
*/
module.exports.addVerse = function(request, res) {
	var decoded = jwt.decode(request.headers.token, tokenSecret);

	if (decoded.userid == null || decoded == null) {
		res.send(403);
		return;
	}
	var userid = decoded.userid;

	mongodb.connect(function(err, db) {

		var verse = request.body;
		verse.Author = userid;
		verse.CreationDate = new Date();
		verse.SharedWith = [];
		verse.SharedWithLength = 0;

		//Inserts verse into the collection
		db.collection('verses').insert(verse, function(err, records) {
			if (err)
				throw err;

			console.log("New verse added as " + records[0]._id);

			//Insert verse (ID) into the user's verses
			db.collection('users').update({
				_id: records[0].Author
			}, {
				$push: {
					Verses: records[0]._id
				}
			}, function(err, record) {
				if (!err)
					res.json(records[0]);
				else
					res.send(404);
			});

		});
	});
};


/**
*	@api {get} /getverse/ Pegar versículo
*	@apiHeaderStructure TokenHeader
*	@apiName PostGetVerse
*	@apiGroup Versículos
*
*	@apiSuccessStructure Verse
*	@apiErrorStructure NotAuthorized
*	@apiDescription	Pega um versículo aleatório no banco de versículos utilizando a seguinte estratégia:
*	De todos os versículos que não foi o usuário que criou e que ele ainda não pegou:
*		Pega os que tem menor SharedWithLength.
*		Persistindo o empate, pega por CreationDate(menor).
*/
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
				Author: {
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
					_id: record.Author
				}, {
					$push: {
						Verses: record._id
					}
				}, function(err, records) {
					res.json(record);
				});
				
				//Insert verse notification for author
				var notification = {};
				notification[record._id] = userid;
				apn.sendNotificationForUser(notification, record.Author);
				// db.collection('notifications').update({
				// 	"userid": record.Author
				// }, {
				// 	$push: {
				// 		Verses: notification
				// 	}
				// },{ upsert: true },function(err, records) {
				// });
			});
	});

}
