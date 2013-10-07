[![build status](https://secure.travis-ci.org/itsatony/nobase.png)](http://travis-ci.org/itsatony/nobase)

# nobase

[nobase] is a nodejs document store running exclusively in-process memory. non-persistant !

The goal here was to have a simple, yet efficient document store for handling in-process data.

This project is still in very early development, hence anything is subject to change!


* installing

````
    npm install nobase
````

* constructing a new nobase ( mongodb equivalent would be a collection )

````
    var nobase = require('nobase');
    var DB = new nobase('DB');
````

* finding documents

    - finding by single id
````
		var answer = DB.find('test_id_001', {});
		console.log(answer.errors); 
		console.log(answer.results);
````
    - get everything
````
		var answer = DB.find(true, {});
		console.log(answer.errors); 
		console.log(answer.results);
````
    - finding by array of ids
````
		var answer = DB.find(['test_id_001','test_id_002'], {});
		console.log(answer.errors); 
		console.log(answer.results);
````
    - finding by function. will get EVERY document from the store. expected is a true||false return value.
````
		var answer = DB.find(function(doc) { return doc.blubb === 'somethingWeWantToFind'; }, {});
		console.log(answer.errors); 
		console.log(answer.results);
````
    - finding documents with a simple object query. 
object-based queries are always AND queries and use a basic === compare which is NOT suitable for objects, etc.
this is SIGNIFICANTLY SLOWER than providing your own check function!
````
		var answer = DB.find({blubb : 'somethingWeWantToFind' }, {});
		console.log(answer.errors); 
		console.log(answer.results);
````
    - for all find calls the second argument is the options object.
options here are skip and limit. 
the following example will return only the second entry of the store:
````
		var answer = DB.find(true, { skip:1, limit:1 });
		console.log(answer.errors); 
		console.log(answer.results);
````
    - find has another option: noclone . it defaults to false because it is UNSAFE. it is much faster, BUT
if you modify the results object you will also modify the DB entry! if you are sure about what you are doing, use it to speed up find about 8-10x !
````
		var answer = DB.find(true, { noclone: true });
		console.log(answer.errors); 
		console.log(answer.results);
````


* adding documents

    - adding a new document (with a set _id for testing.. )
````
		var answer = DB.add({ _id: 'test_id_001', blubb: 'something', blee: 'else', bibb: new Buffer(100) }, {});
		console.log(answer.errors); 
		console.log(answer.results);
````
    - adding multiple new documents
````
		var answer = DB.add([ { _id: 'test_id_002', file: new Buffer(100) }, { _id: 'test_id_003', file: new Buffer(100) } ], {});
		console.log(answer.errors); 
		console.log(answer.results);
````



* deleting documents

    - delete a document by id
````
		var answer = DB.remove('test_id_001', {});
		console.log(answer.errors); 
		console.log(answer.results);
````
    - deleting multiple documents
````
		var answer = DB.remove([ 'test_id_001', 'test_id_001' ], {});
		console.log(answer.errors); 
		console.log(answer.results);
````



* updating documents

    - update a document by id
````
		var answer = DB.update('test_id_001', { thing: 'update test single' }, {});
		console.log(answer.errors); 
		console.log(answer.results);
````
    - updating multiple documents by array of ids
````
		var answer = DB.update([ 'test_id_001','test_id_002' ], { thing: 'update test multi' } , {});
		console.log(answer.errors); 
		console.log(answer.results);
````


* checking if a document exists

    - update a document by id
````
		var thereIsADocument = DB.exists('test_id_001');
````
    - updating multiple documents by array of ids
````
		var thereIsADocument = DB.exists(function(doc) { return (doc.id === 'test_id_001'); }); 
````


* counting entries in the DB

````		
		var iHaveThisManyEntries = DB.count(); 
````


* wiping the DB

````		
		// clear all data
		DB.wipe(); 
````


* dumping the DB to a JSON file

````		
		DB.dumpToFile('./dump.json', function() { console.log('done'); }); 
````


* reading DB content from a dumped JSON file

````		
		DB.readFromFileDump = function('./dump.json', 'replace', function() { console.log('done'); }); 
````



# VERSION

v 0.1.3


# author

Toni Wagner


#Licence

free
