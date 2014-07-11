var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
require('./config.js');

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
*	@apiSucessStructure SuccessfulAdded
*
*/
module.exports.addPrayRequest = function(request, res) {
	var decoded = jwt.decode(request.headers.token, tokenSecret);

	if (decoded.userid == null || decoded == null) {
		res.send(403);
		return;
	}
	var userid = decoded.userid;

	mongodb.connect(function(err, db) {

		var pray = request.body;
		pray.Author = userid;
		pray.CreationDate = new Date();
		pray.EstimatedEndDate = new Date(request.body.EstimatedEndDate);
		pray.SharedWith = [];
		pray.SharedWithLength = 0;

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
					res.send(200);
				else
					res.send(404);
			});

		});
	});
};