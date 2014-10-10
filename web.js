// web.js
var express = require("express");
var logfmt = require("logfmt");
var app = express();
var mongo = require('mongodb');
var crypto = require('crypto');
var fs = require('fs');
var facebookUser = require('./facebook_user.js');
var localUser = require('./local_user.js');
var bodyParser = require('body-parser');
var verse = require('./verse.js');
var prayRequest = require('./pray_request');
var profile = require('./profile.js');
var notifications = require('./notifications.js');
var https = require('https');
var http = require('http');
var disable304 = require('connect-disable-304');
var RedisStore = require('socket.io/lib/stores/redis');
var redis = require('redis');
var chat = require('./chat.js');




var privateKey = fs.readFileSync('./sslcert/privatekey.pem');
var certificate = fs.readFileSync('./sslcert/certificate.pem');
var credentials = {
	key: privateKey,
	cert: certificate
};

var port = Number(process.env.PORT || 5000);
var secureServer = https.createServer(credentials, app).listen(port, function() {
	console.log("HTTPS Listening on " + port);
});

var socketsPort = Number(3450);
var server = http.createServer(app).listen(socketsPort, function() {
	console.log("Sockets Listening on " + socketsPort);
});

app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(disable304());


app.post('/loginfacebookpost', facebookUser.login);
app.post('/loginandcreatifnotexistsfacebook', facebookUser.loginAndCreatIfNotExists);


app.post('/createfacebookuser', facebookUser.createFacebookUser);

app.post('/loginlocalpost', localUser.login);
app.post('/createlocaluser', localUser.createLocalUser);

app.post('/addverse', verse.addVerse);
app.get('/getverse', verse.getRandomVerse);

app.post('/addprayrequest', prayRequest.addPrayRequest);
app.get('/newprays', prayRequest.newPrays);
app.get('/getprayrequest', prayRequest.getRandomPray);

app.get('/profile/:id', profile.getProfile);
app.post('/profile/device', profile.setDevice);
app.post('/profile/editprofile', profile.editProfile);

app.get('/notifications', notifications.getNotifications);

app.get('/teste', function(req, res) {
	mongo.Db.connect(mongoUri, function(err, db) {
		db.collection('users', function(er, collection) {
			collection.insert({
				'mykey': 'myvalue'
			}, {
				safe: true
			}, function(er, rs) {});
		});
	});
});


// appSecure.listen(3450, function(){
// console.log("https listening on 3450");
// })
var io = require('socket.io').listen(server);
var redis_connection = chat.initializeChat();
var redis_client = redis_connection["client"];
io.set('store', new RedisStore({
	redis: redis,
	redisPub: redis_connection["sub"],
	redisSub: redis_connection["pub"],
	redisClient: redis_client
}));


// // usernames which are currently connected to the chat
// var usernames = {};
// var clients = {};
//
// //rooms vai ser um map de FastSets!
// var rooms = require("collections/multi-map");
//
io.sockets.on('connection', function(socket) {
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function(data) {
		var room = data.room;
		var message = data.data;

		redis_client.get(room, function(err, offline_users) {
			console.log("OFFLINE USERS: " + offline_users + " at room: " + room);
			if (offline_users) {
				for (var offline_user in offline_users) {
					console.log('Usuário offline:' + offline_user);
					//TODO:
					//ADICIONAR PUSH NOTIFICATION
				}
			}
		});
		// we tell the client to execute 'updatechat' with 3 parameters, username, room, data
		//para cada usuário da sala, nós mandamos um update com a mensagem.

		io.sockets.to(room).emit('updatechat', socket.username, room, message);
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(data) {
		var username = data.username;
		var room = data.room;

		socket.username = username;
		socket.join(room);
		redis_client.lrem(room, 0, socket.username);
		var userIds = [];
		io.sockets.clients().forEach(function(s) {
			if (s.username) {
				userIds.push(s.username);
				console.log("Username: " + s.username + "na sala: " + room);
			}

		});
		io.sockets.to(room).emit('updateusers', room, userIds);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function() {
		var currentClientRooms = io.sockets.manager.roomClients[socket.id];
		for (var current_room in currentClientRooms) {
			console.og
			redis_client.rpush(current_room, socket.username, function(err, count) {
				if (err) {
					console.log("Deu erro na hora de salvar!");
				}
			});
			var userIds = [];
			io.sockets.clients().forEach(function(s) {
				userIds.push(s.username);
			});
			io.sockets.emit('updateusers', current_room, userIds);
		}
	});

});

Array.prototype.contains = function(obj) {
	var i = this.length;
	while (i--) {
		if (this[i] === obj) {
			return true;
		}
	}
	return false;
}
