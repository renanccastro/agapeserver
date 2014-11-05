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
var apn = require('./apn.js');




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
	socket.on('connect', function(){
		
	});
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function(data, callback) {
		var room = data.room;
		var message = data.data;
		var username = data.name;
		redis_client.lrange(room, 0, -1, function (error, items) {
		  if (error) 
			  console.log("deu erro na hora de pegar a lista no redis");
		  items.forEach(function (offline_user) {
  			console.log("OFFLINE USER: " + offline_user + " at room: " + room);
  					console.log('Usuário offline:' + offline_user);
					apn.sendNotificationWithMessageForUser(message, room, socket.username, offline_user);
  			}
		  );
		});

		// we tell the client to execute 'updatechat' with 3 parameters, username, room, data
		//para cada usuário da sala, nós mandamos um update com a mensagem.

		io.sockets.to(room).emit('updatechat', socket.username, room, message, username);
		callback();
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(data) {
		var username = data.username;
		var room = data.room;

		socket.username = username;
		socket.join(room);
		redis_client.lrem(room, 0, socket.username);
		// redis_client.sadd(username, room);
		//adicionamos a sala ao set de salas do jovem, aí o celular não precisa saber de nada o inocente

		var userIds = [];
		io.sockets.clients(room).forEach(function(s) {
			if (s.username) {
				userIds.push({
					"userId": s.username,
					"online": "yes"
				});
				console.log("Username: " + s.username + "na sala: " + room);
			}

		});
		redis_client.lrange(room, 0, -1, function(error, items) {
			if (error)
				console.log("deu erro na hora de pegar a lista no redis");
			items.forEach(function(offline_user) {
				userIds.push({
					"userId": s.username,
					"online": "no"
				});
			});
		});
		io.sockets.to(room).emit('updateusers', room, userIds);
	});


	// when the user disconnects.. perform this
	socket.on('disconnect', function() {
		var currentClientRooms = io.sockets.manager.roomClients[socket.id];
		console.log("Salas do client:" + JSON.stringify(currentClientRooms, null, 4) + JSON.stringify(io.sockets.manager.roomClients, null, 4));
		for (var current_room in currentClientRooms) {
			var actual_room = current_room.substring(1);
			console.log("sala que houve um disconnect: " + actual_room);
			redis_client.rpush(actual_room, socket.username, function(err, count) {
				if (err) {
					console.log("Deu erro na hora de salvar!");
				}
			});
			var userIds = [];
			io.sockets.clients(actual_room).forEach(function(s) {
				userIds.push(s.username);
			});
			io.sockets.emit('updateusers', actual_room, userIds);
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
