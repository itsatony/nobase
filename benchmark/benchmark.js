var nobase = require ('../lib/nobase');
var fs = require('fs');
var should = require('should');
var DB = new nobase('test');
var helpers = {};

var start = new Date().getTime();
for (var i=0; i < 100000; i++) {
	var answer = DB.add({ 0: i, a: 'something', b: 'else', c: new Buffer(100) });
}
var delta = new Date().getTime() - start;
console.log('[1] @ ' + delta + ' ---> adding 100000 elements');

var start = new Date().getTime();
var answer = DB.find(true);
var delta = new Date().getTime() - start;
console.log('[2] @ ' + delta + ' ---> getting (ALL) 100000 elements');

var last = false;
var filter = function(d) { last = !last; return last; };
var start = new Date().getTime();
var answer = DB.find(filter);
var delta = new Date().getTime() - start;
console.log('[3] @ ' + delta + ' ---> getting every second of 100000 elements');

var start = new Date().getTime();
var answer = DB.find(true, { skip: 50000, limit: 10 });
var delta = new Date().getTime() - start;
console.log('[4] @ ' + delta + ' ---> getting 10 elements with 50k skip');


var start = new Date().getTime();
var answer = DB.remove(true, { skip: 50000 });
var delta = new Date().getTime() - start;
console.log('[5] @ ' + delta + ' ---> deleting second 50k');

var start = new Date().getTime();
var answer = DB.find(true, { limit: 10000 });
var delta = new Date().getTime() - start;
console.log('[6] @ ' + delta + ' ---> getting with 10k limit');

var start = new Date().getTime();
var answer = DB.find(true, { limit: 10000 });
var delta = new Date().getTime() - start;
console.log('[7] @ ' + delta + ' ---> getting with 40k skip');

