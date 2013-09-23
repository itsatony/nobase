# nobase

nobase is a nodejs document db running exclusively in-process memory

* installing

````
    npm install nobase
````

* constructing a new nobase ( mongodb equivalent would be a collection )

````
    vws.bla = new aNodeBase('bla');
````

* finding documents

````
    // finding by single id
		bla.find('test_id_001', {}, function(errors, results) { console.log(errors); console.log(results); } );

		// get everything
		bla.find(true, {}, function(errors, results) { console.log(errors); console.log(results); } );

		// finding by array of ids
		bla.find(['test_id_001','test_id_002'], {}, function(errors, results) { console.log(errors); console.log(results); } );

		// finding by function. will get EVERY document from the store. expected is a true||false return value.
		bla.find(function(doc) { return doc.blubb === 'somethingWeWantToFind'; }, {}, function(errors, results) { console.log(errors); console.log(results); } );
````


* adding documents

````
		// adding a new document (with a set _id for testing.. )
		bla.add({ _id: 'test_id_001', blubb: 'something', blee: 'else', bibb: new Buffer(100) }, {}, function(errors, results) { console.log(errors); console.log(results); } );
		
		// adding multiple new documents
		bla.add([ { _id: 'test_id_002', file: new Buffer(100) }, { _id: 'test_id_003', file: new Buffer(100) } ], {}, function(errors, results) { console.log(errors); console.log(results); } );
 
````



* deleting documents

````		
		// delete a document by id
		bla.delete('test_id_001', {}, function(errors, results) { console.log(errors); console.log(results); } );
		
		// deleting multiple documents
		bla.delete([ 'test_id_001', 'test_id_001' ], {}, function(errors, results) { console.log(errors); console.log(results); } );

 
````



* updating documents

````		
		// update a document by id
		bla.update('test_id_001', { thing: 'update test single' }, {}, function(errors, results) { console.log(errors); console.log(results); } );

		// updating multiple documents by array of ids
		bla.update([ 'test_id_001','test_id_002' ], { thing: 'update test multi' } , {}, function(errors, results) { console.log(errors); console.log(results); } );
 
````



# VERSION
v 0.1.0


# author

Toni Wagner

#Licence

free
