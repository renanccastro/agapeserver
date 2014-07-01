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
		    	res.send("usuário inexistente");
		    }
	    });
	  });
	});
};