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
app.post('/profile/device',profile.setDevice);
app.post('/profile/editprofile',profile.editProfile);

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

// usernames which are currently connected to the chat
var usernames = {};
var rooms = {};

io.sockets.on('connection', function(socket) {
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function(data) {
		var room = data.room;
		var message = data.data;
		// we tell the client to execute 'updatechat' with 3 parameters, username, room, data
		//para cada usuário da sala, nós mandamos um update com a mensagem.
		io.sockets.to(room).emit('updatechat', socket.username, room, message);
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(data) {
		var username = data.username;
		var room = data.room;
		console.log(data.username);
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		socket.join(room);
		if(!rooms[room]){
			rooms[room] = [];
		}
		if(!rooms[room].contains(username)){
			rooms[room].push(username);
		}
		io.sockets.to(room).emit('updateusers', room, rooms[room]);
	});
	
	/* when the user disconnects.. perform this
	socket.on('disconnect', function() {
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});
	*/
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