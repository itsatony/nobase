var nobase = require ('../lib/nobase');
var fs = require('fs');
var should = require('should');

var DB = new nobase('test');

var helpers = {};

describe(
	'Adding Single Document Without Id',
	function() {
		it(
			'should return an object with errors:null and results = [ doc ]', 
			function(done) {
				var answer = DB.add({ a: 'something', b: 'else', c: new Buffer(100) });
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal('something');
				answer.results[0].c.should.be.an.instanceof(Buffer);
				helpers._id = answer.results[0]._id;
				should.exist(DB.store[helpers._id]);
				done();
			}
		);
	}
);

describe(
	'Finding Single Document By Id',
	function() {
		it(
			'should return an object with errors:null and results = [ doc ]', 
			function(done) {
				var answer = DB.find(helpers._id);
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal('something');
				answer.results[0].c.should.be.an.instanceof(Buffer);
				done();
			}
		);
	}
);

describe(
	'Finding Document and modifying it without affecting the DB',
	function() {
		it(
			'should return an object with errors:null and results = [ doc ]', 
			function(done) {
				var answer = DB.find(helpers._id);
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal('something');
				answer.results[0].c.should.be.an.instanceof(Buffer);
				answer.results[0].c = 'changed';
				DB.store[answer.results[0]._id].c.should.be.an.instanceof(Buffer);
				done();
			}
		);
	}
);

describe(
	'Updating Single Document By Id',
	function() {
		it(
			'should return an object with errors:null and results = [ doc.a = "something" && && doc.b = "different" && doc.d = "new" ]', 
			function(done) {
				var answer = DB.update(helpers._id, { d: 'new', b: 'different' });
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal('something');
				answer.results[0].b.should.equal('different');
				answer.results[0].c.should.be.an.instanceof(Buffer);
				answer.results[0].d.should.equal('new');
				done();
			}
		);
	}
);

describe(
	'POSITIVE checking if a document exists by Id',
	function() {
		it(
			'should return true', 
			function(done) {
				var answer = DB.exists(helpers._id);
				answer.should.be.true;
				done();
			}
		);
	}
);

describe(
	'NEGATIVE checking if a document exists by Id',
	function() {
		it(
			'should return false', 
			function(done) {
				var answer = DB.exists('BLABLA');
				answer.should.be.false;
				done();
			}
		);
	}
);

describe(
	'POSITIVE checking if a document exists by query',
	function() {
		it(
			'should return true', 
			function(done) {
				var answer = DB.exists(function(doc) { return (doc.a === 'something') });
				answer.should.be.true;
				done();
			}
		);
	}
);

describe(
	'count DB entries',
	function() {
		it(
			'should return a number', 
			function(done) {
				var answer = DB.count();
				answer.should.be.a('number');
				done();
			}
		);
	}
);

describe(
	'finding document with a object-based query',
	function() {
		it(
			'should return a document', 
			function(done) {
				var answer = DB.find({ a: 'something'});
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal('something');
				done();
			}
		);
	}
);

describe(
	'removing A Single Document By Id',
	function() {
		it(
			'should return an object with errors:null and results = [ doc.a = "something" && && doc.b = "different" && doc.d = "new" ]', 
			function(done) {
				var answer = DB.remove(helpers._id);
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal('something');
				answer.results[0].b.should.equal('different');
				answer.results[0].c.should.be.an.instanceof(Buffer);
				answer.results[0].d.should.equal('new');
				should.not.exist(DB.store[helpers._id]);
				done();
			}
		);
	}
);


describe(
	'adding multiple documents',
	function() {
		it(
			'should return an array of objects with errors:null and results = [ doc1, doc2 ]', 
			function(done) {
				var answer = DB.add([ { a: 1 } , { a: 'test_multi' } ]);
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal(1);
				should.exist(answer.results[1]);
				answer.results[1].should.be.a('object');
				answer.results[1]._id.should.be.a('string');
				answer.results[1].a.should.equal('test_multi');
				should.exist(DB.store[answer.results[0]._id]);
				should.exist(DB.store[answer.results[1]._id]);
				done();
			}
		);
	}
);

describe(
	'finding all documents',
	function() {
		it(
			'should return an array of objects with errors:null and results = [ doc1, doc2 ]', 
			function(done) {
				var answer = DB.find(true);
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal(1);
				should.exist(answer.results[1]);
				answer.results[1].should.be.a('object');
				answer.results[1]._id.should.be.a('string');
				answer.results[1].a.should.equal('test_multi');
				done();
			}
		);
	}
);

describe(
	'finding all documents with limit 1',
	function() {
		it(
			'should return an array of objects with errors:null and results = [ doc1, doc2 ]', 
			function(done) {
				var answer = DB.find(true, { limit: 1 });
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal(1);
				should.not.exist(answer.results[1]);
				done();
			}
		);
	}
);

describe(
	'finding all documents with skip 1',
	function() {
		it(
			'should return an array of objects with errors:null and results = [ doc1, doc2 ]', 
			function(done) {
				var answer = DB.find(true, { skip: 1 });
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal('test_multi');
				should.not.exist(answer.results[1]);
				done();
			}
		);
	}
);

describe(
	'finding documents with a filter function',
	function() {
		it(
			'should return an array of objects with errors:null and results = [ doc2 ]', 
			function(done) {
				var answer = DB.find(function(d) { return (typeof d.a === 'string'); });
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal('test_multi');
				should.not.exist(answer.results[1]);
				done();
			}
		);
	}
);


describe(
	'updating documents with a filter function',
	function() {
		it(
			'should return an array of objects with errors:null and results = [ doc2 ]', 
			function(done) {
				var answer = DB.update(function(d) { return (typeof d.a === 'string'); }, { a: 'updated', b: 2 });
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal('updated');
				answer.results[0].b.should.equal(2);
				should.not.exist(answer.results[1]);
				done();
			}
		);
	}
);


describe(
	'writing db to file',
	function() {
		it(
			'file should be on disk', 
			function(done) {
				DB.dumpToFile(
					'./dump.json',
					function(err) {
						var exists = fs.existsSync('./dump.json');
						exists.should.be.true;
						done();
					}
				);
			}
		);
	}
);


describe(
	'getting db from file',
	function() {
		it(
			'should fill the db', 
			function(done) {
				DB.readFromFileDump(
					'./dump.json',
					'replace',
					function(err, err2, content, store) {
						var count = DB.count();
						count.should.equal(2);
						done();
					}
				);
			}
		);
	}
);

describe(
	'extending db from file',
	function() {
		it(
			'should add to the db', 
			function(done) {
				DB.wipe();
				DB.add([ {x:1 }, {x:2}]);
				DB.readFromFileDump(
					'./dump.json',
					'add',
					function(err, err2, content, store) {
						var count = DB.count();
						count.should.equal(4);
						done();
					}
				);
			}
		);
	}
);


 
 
// --- INDEX NONSENSE
 
/* 

describe(
	'creating a document index',
	function() {
		it(
			'should return a object with result-ids listed as arrays relative to their "a" value', 
			function(done) {
				var answer = DB.addIndex('a');
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.a('object');
				should.exist(answer.results['updated']);
				done();
			}
		);
	}
); */

/* 
describe(
	'get documents by index',
	function() {
		it(
			'should return an array of objects with errors:null and results = [ doc2 ]', 
			function(done) {
				var preanswer = DB.add([ { a: 'updated', b: 17 } , { a: 'test_multi', b: 30 } ]);
				var answer = DB.getIndexedDocuments('a', 'updated');
				should.equal(answer.errors, null);
				should.exist(answer.results);
				answer.results.should.be.an.instanceof(Array);
				should.exist(answer.results[0]);
				answer.results[0].should.be.a('object');
				answer.results[0]._id.should.be.a('string');
				answer.results[0].a.should.equal('updated');
				answer.results[0].b.should.equal(2);
				should.exist(answer.results[1]);
				answer.results[1].should.be.a('object');
				answer.results[1]._id.should.be.a('string');
				answer.results[1].a.should.equal('updated');
				answer.results[1].b.should.equal(17);
				
				done();
			}
		);
	}
);
 */
 
 