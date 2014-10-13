var ObjectID = require('mongodb').ObjectID;
module.exports.sanitizedUserID = function(userid){
	var objectId;
	var targetUserId;
	try {
		objectId = new ObjectID(userid);
		targetUserId = objectId;
	} catch (err) {
		console.log("Não deu certo o objectId.");
		targetUserId = userid;
	}
	return targetUserId;
};