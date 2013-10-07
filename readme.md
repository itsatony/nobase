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
		DB.find('test_id_001', {}, function(errors, results) { console.log(errors); console.log(results); } );
````
    - get everything
````
		DB.find(true, {}, function(errors, results) { console.log(errors); console.log(results); } );
````
    - finding by array of ids
````
		DB.find(['test_id_001','test_id_002'], {}, function(errors, results) { console.log(errors); console.log(results); } );
````
    - finding by function. will get EVERY document from the store. expected is a true||false return value.
````
		DB.find(function(doc) { return doc.blubb === 'somethingWeWantToFind'; }, {}, function(errors, results) { console.log(errors); console.log(results); } );
````
    - finding documents with a simple object query. 
object-based queries are always AND queries and use a basic === compare which is NOT suitable for objects, etc.
this is SIGNIFICANTLY SLOWER than providing your own check function!
````
		DB.find({blubb : 'somethingWeWantToFind' }, {}, function(errors, results) { console.log(errors); console.log(results); } );
````
    - for all find calls the second argument is the options object.
options here are skip and limit. 
the following example will return only the second entry of the store:
````
		DB.find(true, { skip:1, limit:1 }, function(errors, results) { console.log(errors); console.log(results); } );
````
    - find has another option: noclone . it defaults to false because it is UNSAFE. it is much faster, BUT
if you modify the results object you will also modify the DB entry! if you are sure about what you are doing, use it to speed up find about 8-10x !
````
		DB.find(true, { noclone: true }, function(errors, results) { console.log(errors); console.log(results); } );
````


* adding documents

    - adding a new document (with a set _id for testing.. )
````
		DB.add({ _id: 'test_id_001', blubb: 'something', blee: 'else', bibb: new Buffer(100) }, {}, function(errors, results) { console.log(errors); console.log(results); } );
````
    - adding multiple new documents
````
		DB.add([ { _id: 'test_id_002', file: new Buffer(100) }, { _id: 'test_id_003', file: new Buffer(100) } ], {}, function(errors, results) { console.log(errors); console.log(results); } );
````



* deleting documents

    - delete a document by id
````
		DB.remove('test_id_001', {}, function(errors, results) { console.log(errors); console.log(results); } );
````
    - deleting multiple documents
````
		DB.remove([ 'test_id_001', 'test_id_001' ], {}, function(errors, results) { console.log(errors); console.log(results); } );
````



* updating documents

    - update a document by id
````
		DB.update('test_id_001', { thing: 'update test single' }, {}, function(errors, results) { console.log(errors); console.log(results); } );
````
    - updating multiple documents by array of ids
````
		DB.update([ 'test_id_001','test_id_002' ], { thing: 'update test multi' } , {}, function(errors, results) { console.log(errors); console.log(results); } );
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

v 0.1.2


# author

Toni Wagner


#Licence

free
