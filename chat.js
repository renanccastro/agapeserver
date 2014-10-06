// Make things with facebook user
var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
var redis = require(NODE_MODULES_PATH + 'redis');
require('./config.js');

module.exports.initializeChat = function(){
	var subscriber = redis.createClient(redis_port, redis_host);
	subscriber.on("error", function(err) {
	  console.error('There was an error with the redis client ' + err);
	});
	var publisher = redis.createClient(redis_port, redis_host);
	publisher.on("error", function(err) {
	  console.error('There was an error with the redis client ' + err);
	});
	var client = redis.createClient(redis_port, redis_host);
	client.on("error", function(err) {
	  console.error('There was an error with the redis client ' + err);
	});
	
	if (credentials.password != '') {
	  subscriber.auth(credentials.password);
	  publisher.auth(credentials.password);
	  client.auth(credentials.password);
	}	
	
	
	var returnedObject = {};
	returnedObject["sub"] = subscriber;
	returnedObject["pub"] = publisher;
	returnedObject["client"] = client;
	return returnedObject;
};

module.exports.userConnected = function(socket, username, room){
	console.log(username);
	// we store the username in the socket session for this client
	socket.username = username;
	// add the client's username to the global list
	mongodb.connect(function (err, db) {
  	  	db.collection('chat', function(er, collection) {
				
		});	
	});
	usernames[username] = username;
	socket.join(room);
	if(!rooms.has(room)){
		rooms.get = [];
	}
	if(!rooms[room].contains(username)){
		rooms[room].push(username);
	}
	io.sockets.to(room).emit('updateusers', room, rooms[room]);
		
};