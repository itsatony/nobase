var NreplServer = require('nrepl').nReplServer;
var NreplClient = require('nrepl').nReplClient;

var Nbase = require('./lib/nbase.js');
DB = new Nbase('replNB');

var myrepl = new NreplServer('nbase', 4444);
DB.add(
	[ 
		{ a: 'something', b: 'else', c: new Buffer(10) },
		{ a: 'nothing', b: 'like', c: new Buffer('me'), e: { ea: 1, eb:2, ec: { eca: true } } } 
	],
	function(err, res) {
	}
);
var connectToMyself = new NreplClient('localhost', 4444);


