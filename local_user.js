var mongodb = require('./mongo_db.js');

module.exports.login = function(request, res){
	// console.log(request);
   console.log("username: " + request.headers.name + " password: "+ request.headers.password);
   var username = request.headers.name;
   var password = request.headers.password;

   	mongodb.connect( function (err, db) {
	  db.collection('users', function(er, collection) {
	    collection.findOne({"username": username}, function(er,user) {
	    	//verifica se achou o usuário
	    	if (user != null) {
		    	if (user.password == password) {
		    		res.send("correto");
		    	} else{
		    		res.send("incorreto");
		    	}
		    }else{
		    	res.send("usuario inexistente");
		    }
	    });
	  });
	});
};

module.exports.createLocalUser = function(request, res){

   var document = {"username" : request.headers.username, "password": request.headers.password,
   				   "email" : request.headers.email, "gender" : request.headers.gender,
   				   "birthday" : new Date(request.headers.birthday), "denominationID" : request.headers.denominationID,
   				   "state" : request.headers.state, "city" : request.headers.city, "country" : request.headers.country};

   console.log(document);

   mongodb.connect( function (err, db) {
   		db.collection('users').insert(document, function(err, records) {
			if (err)
				throw err;
			res.send(recors[0]._id);
			console.log("Record added as "+records[0]._id);
		});
	});
};