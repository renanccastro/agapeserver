var mongodb = require('./mongo_db.js');
require('./config.js');
var apn = require('apn');
var ObjectID = require('mongodb').ObjectID;
var utils = require('./utils.js');


var options = {
	"production": false
};

var apnConnection = new apn.Connection(options);


module.exports.sendNotificationForUser = function(notification, userid) {
	var targetUserId = utils.sanitizedUserID(userid);
	mongodb.connect(function(err, db) {
		if(err){res.send(404);
			return;
		}
		db.collection('users').findOne({
			"_id": targetUserId
		}, function(err, user) {
			if (!user)
				return;
			try {
				var myDevice = new apn.Device(user.device);
			}
			catch(err){
				console.log("invalid device token");
				return;
			}
			var note = new apn.Notification();
			note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
			note.badge = 1;
			note.sound = "ping.aiff";
			note.alert = "\uD83D\uDCE7 \u2709 Alguém pegou o/a seu/sua versículo/oração.";
			note.payload = notification;
			apnConnection.pushNotification(note, myDevice);
		});
	});
}
module.exports.sendNotificationWithMessageForUser = function(message, room, fromUserid, toUserid) {
	var targetUserId = utils.sanitizedUserID(toUserid);
	mongodb.connect(function(err, db) {
		if(err){res.send(404);
			return;
		}
		db.collection('users').findOne({
			"_id": targetUserId
		}, function(err, user) {
			if (!user){
				console.log('No user found with id:' + targetUserId);
				return;
			}
			try {
				var myDevice = new apn.Device(user.device);
			}
			catch(err){
				console.log("invalid device token");
				return;
			}
			var note = new apn.Notification();
			note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
			note.badge = 1;
			note.sound = "ping.aiff";
			note.alert = message;
			note.payload = {"room" : room, 'from' : fromUserid};
			apnConnection.pushNotification(note, myDevice);
		  	console.log("Push enviado para o id:" + myDevice);
			
		});
	});
}
