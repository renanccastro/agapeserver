// Make things with facebook user
var mongodb = require('./mongo_db.js');
var jwt = require('jwt-simple');
var redis = require('redis');
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
	
	  // subscriber.auth(tokenSecret);
	  // publisher.auth(tokenSecret);
	  // client.auth(tokenSecret);
	  
	
	
	var returnedObject = {};
	returnedObject["sub"] = subscriber;
	returnedObject["pub"] = publisher;
	returnedObject["client"] = client;
	return returnedObject;
};