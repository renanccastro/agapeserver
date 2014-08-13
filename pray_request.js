var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
var apn = require('./apn.js');
require('./config.js');



/**
 *	@apiDefineSuccessStructure Pray
 *	@apiSuccess (Sucesso - 200) {String} _id id do versículo.
 *	@apiSuccess (Sucesso - 200) {String} Description descrição do pedido.
 *	@apiSuccess (Sucesso - 200) {DateString} EstimatedEndDate data estimada de término.
 *	@apiSuccess (Sucesso - 200) {int} Anonymous 0/1 para pedidos anônimos.
 *	@apiSuccess (Sucesso - 200) {String} Author id do criador do versículo.
 *	@apiSuccess (Sucesso - 200) {DateString} CreationDate Data de criação do versículo.
 *	@apiSuccess (Sucesso - 200) {String[]} SharedWith Array de ids de usuários com quais o versículo foi compartilhado.
 *	@apiSuccess (Sucesso - 200) {int} SharedWithLength Tamanho da propriedade anterior.
 */



/**
 *	@api {post} /addprayrequest/ Cadastra um pedido de oração
 *	@apiHeaderStructure TokenHeader
 *	@apiName PostAddPrayRequest
 *	@apiGroup Pedidos de oração
 *
 *	@apiParam {String} Description Descrição do pedido, ex: Orem pelas provas do Ivan.
 *	@apiParam {DateString} EstimatedEndDate String representando a data estimada de término do pedido no formato ISO 8601.
 *	@apiParam {Integer (0 ou 1)} Anonymous Se o pedido é anônimo ou não.
 *
 *	@apiExample Exemplo de payload para a request de um pedido NÃO ANÔNIMO:
 *		{
 *			"Description"		: "Orem pelas provas do Ivan",
 *			"EstimatedEndDate" : "2004-02-12T15:19:21+00:00",
 *			"Anonymous"	: 0
 *		}
 *
 *	@apiErrorStructure NotAuthorized
 *	@apiSuccessStructure Pray
 *
 */
module.exports.addPrayRequest = function(request, res) {
	var decoded = jwt.decode(request.headers.token, tokenSecret);

	if (!decoded.userid || !decoded) {
		res.send(403);
		return;
	}
	var userid = decoded.userid;
	var gotDate = {};
	gotDate[userid] = new Date();

	mongodb.connect(function(err, db) {

		var pray = request.body;
		pray.Author = userid;
		pray.CreationDate = new Date();
		pray.EstimatedEndDate = new Date(request.body.EstimatedEndDate);
		pray.SharedWith = [];
		pray.SharedWithLength = 0;
		pray.GotDate = [gotDate];

		//Inserts pray into the collection
		db.collection('pray_requests').insert(pray, function(err, records) {
			if (err)
				throw err;

			console.log("New pray request added as " + records[0]._id);

			//Insert request (ID) into the user's PrayRequests
			db.collection('users').update({
				_id: records[0].author
			}, {
				$push: {
					PrayRequests: records[0]._id
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
 *	@api {get} /getprayrequest/ Pegar pedido de oração
 *	@apiHeaderStructure TokenHeader
 *	@apiName GetPrayRequest
 *	@apiGroup Pedidos de oração
 *
 *	@apiSuccessStructure Pray
 *	@apiErrorStructure NotAuthorized
 *	@apiDescription	Pega um pedido aleatório no banco de versículos utilizando a seguinte estratégia:
 *	De todos os pedidos que não foi o usuário que criou e que ele ainda não pegou:
 *		Pega os que tem menor SharedWithLength.
 *	   	Persistindo o empate, pega por CreationDate(menor).
 */
module.exports.getRandomPray = function(request, res) {
	var decoded = jwt.decode(request.headers.token, tokenSecret);

	if (!decoded || !decoded.userid) {
		res.send(403);
		return;
	}
	var userid = decoded.userid;
	var gotDate = {};
	gotDate[userid] = new Date();
	mongodb.connect(function(err, db) {
		//Find the Pray, and update the fields(SharedWith   and 	SharedWithLenght)
		db.collection('pray_requests').findAndModify({
				//acha pedidos que não são do usuário e que não foram pegos por ele ainda
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
					SharedWith: userid,
					GotDate: gotDate
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
				if (err || !record) {
					res.send(404);
					return;
				}

				console.log("Versículo " + record);

				//Insert Pray (ID) into the user's pray pocket
				db.collection('users').update({
					_id: record.Author
				}, {
					$push: {
						PrayRequests: record._id
					}
				}, function(err, records) {
					res.json(record);
				});

				var notification = {};
				notification[record._id] = userid;
				apn.sendNotificationForUser(notification, record.Author);

				//Insert pray notification for author
				// db.collection('notifications').update({
				// 	"userid": record.Author
				// }, {
				// 	$push: {
				// 		PrayRequests: notification
				// 	}
				// },{ upsert: true }, function(err, records) {
				// });

			});
	});

}
