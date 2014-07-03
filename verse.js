var mongodb = require('./mongo_db.js');

module.exports.addVerse = function(request, res){

mongodb.connect( function (err, db) {

		var verse = request; //QUAL CAMPO PEGO DO REQUEST?
		
		//insere o verso no banco
   		db.collection('verses').insert(verse, function(err, records) {
			if (err)
				throw err;
			console.log("New verse added as "+records[0]._id);

		//adiciona o verso na carteira do usuario
		db.collection('users').update({ _.id: records[0].author}, {$set: {verses.unshift(records[0]._id)}});
		//exemplo:
		//db.users.update({_id : "472679979502123"}, {$push : { verses: "1234" }} )
		});


});