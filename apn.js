var mongodb = require('./mongo_db.js');
require('./config.js');
var apn = require('apn');

var options = {
	"production": false
};

var apnConnection = new apn.Connection(options);


module.exports.sendNotificationForUser = function(notification, userid) {
	mongodb.connect(function(err, db) {
		db.collection('users').findOne({
			"_id": userid
		}, function(err, user) {
				var myDevice = new apn.Device(user.device);
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
