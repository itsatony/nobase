var Nbase = require ('../lib/nbase');
var fs = require('fs');
var should = require('should');
var DB = new Nbase('test');
var helpers = {};
var c = 0;

/* 
c++;
var start = new Date().getTime();
var answer = DB.addIndex('d');
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> indexing d attribute');
 */
// ---[[[
console.log('[' + c + '] @ ' + 0 + 'ms ---> creating 100000 elements');
c++;
var one = [];
var two = [];
var three = [];
var four = [];
for (var i=0; i < 25000; i++) {	
	one[i] = { 0: i, a: 'something', b: 'else', c: new Buffer(100), d: 'one' };
	two[i] = { 0: i+25000, a: 'something', b: 'else', c: new Buffer(30), d: 'two' };
	three[i] = { 0: i+50000, a: 'something', b: 'else', c: new Buffer(250), d: 'three' };
	four[i] = { 0: i+75000, a: 'something', b: 'else', c: new Buffer(20), d: 'four' };
}

var start = new Date().getTime();
for (var i=0; i < 25000; i++) {	
	var answer = DB.add(one[i]);
	var answer = DB.add(two[i]);
	var answer = DB.add(three[i]);
	var answer = DB.add(four[i]);
}

var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> adding 100000 elements: ' + DB.count());

// ---[[[
c++;
var start = new Date().getTime();
var answer = DB.find(true);
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> getting (ALL) 100000 elements');

// ---[[[
c++;
var last = false;
var filter = function(d) { last = !last; return last; };
var start = new Date().getTime();
var answer = DB.find(filter);
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> getting every second of 100000 elements');

// ---[[[
c++;
var last = false;
var filter = function(d) { d.d === 'two'; };
var start = new Date().getTime();
var answer = DB.find(filter);
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> getting 25000 elements by query-filter-function');

// ---[[[
c++;
var last = false;
var filter = function(d) { d.d === 'two'; };
var start = new Date().getTime();
var answer = DB.find({ d: 'two' });
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> getting 25000 elements by 1-query-object');

// ---[[[
c++;
var last = false;
var filter = function(d) { d.d === 'two' && d.b === 'else'; };
var start = new Date().getTime();
var answer = DB.find(filter);
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> getting 25000 elements by 2-query-filter-function');

// ---[[[
c++;
var last = false;
var filter = function(d) { d.d === 'two'; };
var start = new Date().getTime();
var answer = DB.find({ d: 'two', b: 'else' });
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> getting 25000 elements by 2-query-object');

// ---[[[
c++;
var start = new Date().getTime();
var answer = DB.find(true, { skip: 50000, limit: 10 });
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> getting 10 elements with 50k skip');

// ---[[[
c++;
var start = new Date().getTime();
var answer = DB.find(true, { limit: 10000 });
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> getting with 10k limit');

// ---[[[
c++;
var start = new Date().getTime();
var answer = DB.find(true, { limit: 10000 });
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> getting with 40k skip');

// ---[[[
c++;
var start = new Date().getTime();
var answer = DB.update(true, { c: 2 }, { limit: 10000, skip: 10000 });
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> updating 10k with 10k skip');

/* 
// ---[[[
c++;
var start = new Date().getTime();
var answer = DB.getIndexedDocuments('d', 'one');
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> getting one index = ' + answer.results.length);
 */
 
// ---[[[
c++;
var start = new Date().getTime();
var answer = DB.remove(true, { skip: 30000 });
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> deleting ending 70k');

// ---[[[
c++;
var start = new Date().getTime();
var count = DB.count();
var delta = new Date().getTime() - start;
console.log('[' + c + '] @ ' + delta + 'ms ---> counting ' + count);
/* 
// ---[[[
c++;
var start2 = new Date().getTime();
var answer = DB.dumpToFile(
	'./testdump.json',
	function() {
		var delta = new Date().getTime() - start2;
		console.log('[' + c + '] @ ' + delta + 'ms ---> dumping to File ' + count);
		// ---[[[
		c++;
		var start = new Date().getTime();
		var answer = DB.wipe();
		var delta = new Date().getTime() - start;
		console.log('[' + c + '] @ ' + delta + 'ms ---> wiping DB ');

		// ---[[[
		c++;
		var start3 = new Date().getTime();
		var answer = DB.readFromFileDump(
			'./testdump.json',
			'replace',
			function() {
				var delta = new Date().getTime() - start3;
				console.log('[' + c + '] @ ' + delta + 'ms ---> reading from Dump ' + count);
				
				// ---[[[
				c++;
				var start4 = new Date().getTime();
				var answer = DB.readFromFileDump(
					'./testdump.json',
					'add',
					function() {
						var delta = new Date().getTime() - start4;
						console.log('[' + c + '] @ ' + delta + 'ms ---> add by reading from Dump ' + count);
					}
				);
			}
		);
	}
);
 */






