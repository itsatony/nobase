var Nbase = require ('../lib/nbase');
var fs = require('fs');
var should = require('should');

var DB = new Nbase('test', '_uuid');

var helpers = {};

describe(
	'Adding Single Document Without Id',
	function() {
		it(
			'should return an object with errors:null and results = [ doc ]', 
			function(done) {
				DB.add(
					[ { a: 'something', b: 'else', c: new Buffer(100) } ],
					function(err, res) {
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[0].a.should.equal('something');
						res[0].c.should.be.an.instanceof(Buffer);
						helpers._uuid = res[0]._uuid;
						should.exist(DB.index[helpers._uuid]);
						done();
					}
				);
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
				var query = { _uuid: helpers._uuid };
				DB.find(
					query,
					function(err, res) {
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[0].a.should.equal('something');
						res[0].c.should.be.an.instanceof(Buffer);
						done();
					}
				);
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
				DB.update(
					helpers._uuid, 
					{ d: 'new', b: 'different' },
					function(err, res) {
						// console.log('===');
						// console.log(res);
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[0].a.should.equal('something');
						res[0].b.should.equal('different');
						res[0].c.should.be.an.instanceof(Buffer);
						res[0].d.should.equal('new');
						done();
					}
				);
				
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
				DB.exists(
					helpers._uuid,
					function(err, res) {
						res.should.be.true;
						done();
					}
				);
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
				DB.exists(
					'BLABLA',
					function(err, res) {
						res.should.be.false;
						done();
					}
				);
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
				DB.exists(
					function(doc) { return (doc.a === 'something') },
					function(err, res) {
						res.should.be.true;
						done();
					}
				);
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
				answer.should.be.type('number');
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
				DB.find(
					{ a: 'something' },
					function(err, res) {
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[0].a.should.equal('something');
						done();
					}
				);
			}
		);
	}
);

describe(
	'removing A Single Document By Id',
	function() {
		it(
			'should return an object with errors:null and results = [ doc.a = "something" && && doc.b = "else" && doc.d = "new" ]', 
			function(done) {
				DB.remove(
					helpers._uuid,
					function(err, res) {
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[0].a.should.equal('something');
						res[0].b.should.equal('different');
						res[0].c.should.be.an.instanceof(Buffer);
						res[0].d.should.equal('new');
						should.not.exist(DB.store[helpers._uuid]);
						done();
					}
				);				
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
				DB.add(
					[ { a: 1 } , { a: 'test_multi' } ],
					function(err, res) {
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[0].a.should.equal(1);
						should.exist(res[1]);
						res[1].should.be.type('object');
						res[1]._uuid.should.be.type('string');
						res[1].a.should.equal('test_multi');
						should.exist(DB.index[res[0]._uuid]);
						should.exist(DB.index[res[1]._uuid]);
						done();
					}
				);
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
				DB.find(
					true,
					function(err, res) {
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						res.length.should.equal(2);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[0].a.should.equal(1);
						should.exist(res[1]);
						res[1].should.be.type('object');
						res[1]._uuid.should.be.type('string');
						res[1].a.should.equal('test_multi');
						done();
					}
				);
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
				DB.find(true, { limit: 1 },
					function(err, res) {
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						res.length.should.equal(1);
						should.exist(res[0]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[0].a.should.equal(1);
						should.not.exist(res[1]);
						done();
					}
				);
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
				DB.find(true, { skip: 1 },
					function(err, res) {
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[0].a.should.equal('test_multi');
						should.not.exist(res[1]);
						done();
					}
				);
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
				DB.find(function(d) { return (typeof d.a === 'string'); },
					function(err, res) {
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[0].a.should.equal('test_multi');
						should.not.exist(res[1]);
						done();
					}
				);
			}
		);
	}
);

describe(
	'finding documents with a _id array',
	function() {
		it(
			'should return an array of objects with errors:null and results = [ doc1, doc2 ]', 
			function(done) {
				DB.find(
					[ Object.keys(DB.index)[0], Object.keys(DB.index)[1] ],
					function(err, res) {
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						should.exist(res[1]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[1].should.be.type('object');
						res[1]._uuid.should.be.type('string');
						should.not.exist(res[2]);
						done();
					}
				);
				
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
				DB.update(function(d) { return (typeof d.a === 'string'); }, { a: 'updated', b: 2 },
					function(err, res) {						
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[0].a.should.equal('updated');
						res[0].b.should.equal(2);
						should.not.exist(res[1]);
						done();
					}
				);
			}
		);
	}
);
 
 
 
 
 
 
 
 
/* 
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

 */
 
describe(
	'updating documents with a _id array',
	function() {
		it(
			'should return an array of objects with errors:null and results = [ doc1, doc2 ]', 
			function(done) {
				var id0 = Object.keys(DB.index)[0];
				var id1 = Object.keys(DB.index)[1];
				DB.update(
					[ id0, id1 ], 
					{ remove: 1 },
					function(err, res) {
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						should.exist(res[1]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[1].should.be.type('object');
						res[1]._uuid.should.be.type('string');
						res[1].remove.should.be.type('number');
						should.not.exist(res[2]);
						done();
					}
				);
			}
		);
	}
);

describe(
	'deleting documents with a _id array',
	function() {
		it(
			'should return an array of objects with errors:null and results = [ doc1, doc2 ]', 
			function(done) {
				DB.remove(
					[ Object.keys(DB.index)[0], Object.keys(DB.index)[1] ],
					function(err, res) {
						should.equal(err, null);
						should.exist(res);
						res.should.be.an.instanceof(Array);
						should.exist(res[0]);
						should.exist(res[1]);
						res[0].should.be.type('object');
						res[0]._uuid.should.be.type('string');
						res[1].should.be.type('object');
						res[1]._uuid.should.be.type('string');
						should.not.exist(res[2]);
						should.not.exist(DB.store[res[0]._uuid]);
						should.not.exist(DB.store[res[1]._uuid]);
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
				should.equal(err, null);
				should.exist(res);
				res.should.be.a('object');
				should.exist(res['updated']);
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
				should.equal(err, null);
				should.exist(res);
				res.should.be.an.instanceof(Array);
				should.exist(res[0]);
				res[0].should.be.a('object');
				res[0]._uuid.should.be.a('string');
				res[0].a.should.equal('updated');
				res[0].b.should.equal(2);
				should.exist(res[1]);
				res[1].should.be.a('object');
				res[1]._uuid.should.be.a('string');
				res[1].a.should.equal('updated');
				res[1].b.should.equal(17);
				
				done();
			}
		);
	}
);
 */
 
 