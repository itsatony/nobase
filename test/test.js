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
	'Removing A Single Document By Id',
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
	'Adding multiple documents',
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
	'Finding all documents',
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
