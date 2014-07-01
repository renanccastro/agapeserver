// Make things with facebook user
var mongodb = require('./mongo_db.js');


module.exports.login = function(request, res){
   console.log("username: " + request.body.name + " accessToken: "+ request.body.accessToken);
   var accessToken = request.body.accessToken;
   var username = request.header.name;


   	mongodb.connect(function (err, db) {
	  db.collection('users', function(er, collection) {
	    collection.findOne({'username': username}, function(er,rs) {
	    	//verifica se achou o usuário
	    	if (rs != null) {
		    	if (rs.accessToken == accessToken) {
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