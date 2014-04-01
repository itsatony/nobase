/*
	a very simple non-persistant in-process document store for nodejs .	
	
	attention! this is still very early development.. anything might change!
	
*/

var Minions = require('minions');
var fs = require('fs');
var minions = new Minions(['node']);
var extend = require('util')._extend;
var uuid = require('node-uuid');
var events = require('events');


/**
 *  the constructor - in mongodb terms use this to create a 'collection'.
 *
 *  @param {String} baseName : the name of this collection
 *
 *	examples:
 *		var DB = new Nobase('DB');
 * 
 *
 */
var Nobase = function(baseName, uuidName, options) {
	// this.idcount = 0;
	var opId = 'cr';
	this.opVersion = 0;
	this.name = (typeof baseName === 'string') ? baseName : 'noname';
	this.uuidName = (typeof uuidName === 'string') ? uuidName : '_id';
	this.options = {
		oplog: false
	};
	if (typeof options === 'object' && options !== null && ! options instanceof Array) {
		minions.extendDeep(this.options, options);
	}
	// wipe will reset everything ;)
	if (this.options.oplog === true) {
		opId += thisNodeBase.nbid();
		this.oplog.add(
			{
				opId: opId,
				id: '*',
				preV: 0,
				postV: 0
			}
		);
	}
	this.events = new events.EventEmitter();
	this.wipe();
};


/**
 *  getting documents from the store.
 *
 *  @param {Object || String || Array} query : 
 *  @param {Object} opts : 
 *
 *	examples:
 *		// finding by single id
 *		var done = DB.find('test_id_001', {}); console.log(done.errors); console.log(done.results); 
 *		// get everything
 *		var done = DB.find(true, {}); console.log(done.errors); console.log(done.results); 
 *		// finding by array of ids
 *		var done = DB.find(['test_id_001','test_id_002'], {}); console.log(done.errors); console.log(done.results); 
 *		// finding by function. will get EVERY document from the store. expected is a true||false return value.
 *		var done = DB.find(function(doc) { return doc.blubb === 'somethingWeWantToFind'; }, {}); console.log(done.errors); console.log(done.results); 
 *		
 *
 */
Nobase.prototype.find = function(query, opts) {
	var thisNodeBase = this;
	var errors = null;
	var results = [];
	var options = minions.defaultTo(opts, { skip:0, limit: false, noclone: false });	
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
	function doResult(doc) {
		skip--;
		if (typeof limit === 'number' && limit === results.length ) {
			return false;
		}
		if ( skip > -1 ) {
			return true;		
		}
		if (options.noclone === true) {
			results.push(doc);
		} else {
			// slower .. about 2x .. but maybe more reliable? var clone = minions.cloneObject(doc);
			var clone = extend({}, doc);
			results.push(clone);
		}
		return true;
	};
	var added = false;
	if (typeof query === 'boolean' && query === true) {
		if (options.noclone === true) {
			return this.store;
		}
		this.batchFor(
			this.store,
			function(key, value) { 
				var added = doResult(value);
				if (added === false) {
					return 'break';
				}
				return true; 
			}, 
			100
		);
		// for (var i in this.store) {
			// added = doResult(this.store[i]);
			// if (added === false) break;
		// }
	} else if (typeof query === 'string' && typeof this.store[query] !== 'undefined') {
		doResult(this.store[query]);
	} else if (typeof query === 'function') {
		this.batchFor(
			this.store,
			function(key, value) { 
				var added = false;
				if (query(value) === true) {
					added = doResult(value);
					if (added === false) {
						return 'break';
					}
				}				
				return true; 
			}, 
			100
		);
		// for (var i in this.store) {
			// if (query(this.store[i]) === true) {
				// added = doResult(this.store[i]);
				// if (added === false) {
					// break;
				// }
			// }
		// }
	} else if (typeof query === 'object' && query instanceof Array) {
		// ---[[[ query by list of _ids
		for (var n=0; n<query.length; n+=1) {
			if (typeof this.store[query[n]] !== 'undefined') {
				doResult(this.store[query[n]]);
			}
		}
	} else if (typeof query === 'object') {
		// ---[[[ query object for flexQuery
		function _flexQuery(doc, query) {
			for (var n in query) {
				if (doc[n] !== query[n]) {
					return false;
				}
			}
			return true;
		};
		this.batchFor(
			this.store,
			function(key, value) { 
				var added = false;
				if (_flexQuery(value, query) === true) {
					added = doResult(value);
					if (added === false) {
						return 'break';
					}
				}				
				return true; 
			}, 
			100
		);
		// for (var i in this.store) {
			// if (_flexQuery(this.store[i], query) === true) {
				// added = doResult(this.store[i]);
				// if (added === false) {
					// break;
				// }
			// }
		// }
	}
	return { errors: errors, results: results };
};



/**
 *  add documents to the store.
 *
 *  @param {Object} document : 
 *  @param {Object} opts : 
 *
 *	examples:
 *		// adding a new document (with a set _id for testing.. )
 *		var done = DB.add({ _id: 'test_id_001', blubb: 'something', blee: 'else', bibb: new Buffer(100) }, {}); console.log(done.errors); console.log(done.results); 
 *		// adding multiple new documents
 *		var done = DB.add([ { _id: 'test_id_002', file: new Buffer(100) }, { _id: 'test_id_003', file: new Buffer(100) } ], {}); console.log(done.errors); console.log(done.results); 
 *
 */
Nobase.prototype.add = function(document, opts) {
	var thisNodeBase = this;
	var options = (typeof opts === 'object') ? opts : { overwrite: false, version: 1 };
	if (typeof options.overwrite !== 'boolean') {
		options.overwrite = false;
	}
	if (typeof options.version !== 'boolean') {
		options.version = 1;
	}
	var errors = null;
	var opId = 'ad';
	if (this.options.oplog === true) {
		opId += thisNodeBase.nbid();
	}
	function doAdd(doc) {
		doc[thisNodeBase.uuidName] = thisNodeBase.nbid(doc[thisNodeBase.uuidName]);
		if (typeof thisNodeBase.store[doc[thisNodeBase.uuidName]] === 'undefined') thisNodeBase.numberOfEntries++;
		if (typeof thisNodeBase.store[doc[thisNodeBase.uuidName]] === 'undefined' || options.overwrite === true) {
			thisNodeBase.store[doc[thisNodeBase.uuidName]] = doc;
			thisNodeBase.versions[doc[thisNodeBase.uuidName]] = options.version;
			if (thisNodeBase.options.oplog === true) {
				thisNodeBase.oplog.add({
					opId: opId,
					id: thisNodeBase.uuidName,
					preV: 0,
					postV: thisNodeBase.versions[doc[thisNodeBase.uuidName]]
				});
			}
		}
	};
	if (document instanceof Array != true) {
		document = [ document ];
	}
	var L = document.length;
	this.batchFor(
		document,
		function(key, value) { 
			doAdd(value);
			return true; 
		}, 
		100
	);
	// for (var y = 0; y < L; y++) {
		// doAdd(document[y]);
	// }
	return { errors: errors, results: document };
};


/**
 *  get the number of stored objects
 *
 *	examples:
 *		DB.count();
 *
 */
Nobase.prototype.count = function() {
	return this.numberOfEntries;
};


/**
 *  force a new active count of stored objects
 *
 *	examples:
 *		DB.recount();
 *
 */
Nobase.prototype.recount = function() {
	this.numberOfEntries = minions.objectSize(this.store);
	return this.numberOfEntries;
};


/**
 *  check if an object exists
 *
 *	examples:
 *		// checks if any document matches the given condition
 *		var documentExists = DB.idExists(function(doc) { return (doc.name === 'joe'); });
 *
 */
Nobase.prototype.exists = function(query) {
	if (typeof query === 'string') {
		return (typeof this.store[query] === 'object');
	}
	var answer = this.find( query, { limit: 1, skip: 0} );
	return (answer.results.length === 1);
};


/**
 *  empty the datastore
 *
 */
Nobase.prototype.wipe = function() {
	var opId = 'wp';
	this.numberOfEntries = 0;
	this.store = {};
	this.versions = {};
	this.oplogStore = [];
	if (this.options.oplog === true) {
		opId += thisNodeBase.nbid();
		this.oplog.add(
			{
				opId: opId,
				id: '*',
				preV: 0,
				postV: 0
			}
		);
	}
	return this.store = {};
};


/**
 *  delete documents from the store.
 *
 *  @param {Object || String || Array} query : 
 *  @param {Object} opts : 
 *
 *	examples:
 *		// delete a document by id
 *		var done = DB.remove('test_id_001', {}; console.log(done.errors); console.log(done.results); 
 *		// deleting multiple documents
 *		var done = DB.remove([ 'test_id_001', 'test_id_001' ], {}); console.log(done.errors); console.log(done.results); 
 *
 */
Nobase.prototype.remove = function(query, opts) {
	var thisNodeBase = this;
	var errors = null;
	var results = [];
	var options = minions.defaultTo(opts, { skip:0, limit: false, noclone: false });	
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
	var opId = 'rm';
	if (this.options.oplog === true) {
		opId += thisNodeBase.nbid();
	}
	function doDelete(index) {
		skip--;
		if ( skip > -1	|| (typeof limit === 'number' && limit === results.length ) ) return;
		if (options.noclone === true) {
			results.push(thisNodeBase.store[index]);
		} else {
			// slower .. about 2x .. but maybe more reliable? var clone = minions.cloneObject(thisNodeBase.store[index]);
			var clone = extend({}, thisNodeBase.store[index]);
			results.push(clone);
		}
		// thisNodeBase.updateIndices(clone, true);
		var preV = thisNodeBase.versions[index];
		if (thisNodeBase.options.oplog === true) {
			thisNodeBase.oplog.add({
				opId: opId,
				id: index,
				preV: preV,
				postV: 0
			});
		}
		delete thisNodeBase.store[index];
		delete thisNodeBase.versions[index];
		thisNodeBase.numberOfEntries--;
		return true;
	};
	var answer = this.find(query, options);
	if (answer.errors !== null) {
		errors = answer.errors;
	} else {
		this.batchFor(
			answer.results,
			function(key, value) { 
				doDelete(value[thisNodeBase.uuidName]);
				return true; 
			}, 
			100
		);
		// for (var n=0; n < answer.results.length; n++) {
			// doDelete(answer.results[n][thisNodeBase.uuidName]);
		// }
	}
	return { errors: errors, results: results };
};


/**
 *  update documents in the store.
 *
 *  @param {Object || String || Array} query : 
 *  @param {Object} upDocument : 
 *  @param {Object} opts : 
 *
 *	examples:
 *		// update a document by id
 *		var done = DB.update('test_id_001', { thing: 'update test single' }, {}); console.log(done.errors); console.log(done.results); 
 *		// updating multiple documents by array of ids
 *		var done = DB.update([ 'test_id_001','test_id_002' ], { thing: 'update test multi' } , {},); console.log(done.errors); console.log(done.results); 
 *
 */
Nobase.prototype.update = function(query, upDocument, opts) {
	var thisNodeBase = this;
	var errors = null;
	var results = [];
	var options = minions.defaultTo(opts, { skip:0, limit: false });	
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
	var opId = 'up';
	if (this.options.oplog === true) {
		opId += thisNodeBase.nbid();
	}
	function doUpdate(index, newAttributes) {
		skip--;
		if ( skip > -1	|| (typeof limit === 'number' && limit === results.length ) ) return;
		// thisNodeBase.updateIndices(thisNodeBase.store[index], true);
		var res = minions.extendDeep(false, thisNodeBase.store[index], newAttributes);
		var preV = thisNodeBase.versions[index];
		thisNodeBase.versions[index] += 1;
		results.push(res);
		if (thisNodeBase.options.oplog === true) {
			thisNodeBase.oplog.add({
				opId: opId,
				id: index,
				preV: preV,
				postV: thisNodeBase.versions[index]
			});
		}
		// thisNodeBase.updateIndices(res);
		return true;
	};
	var answer = this.find(query, options);
	if (answer.errors !== null) {
		errors = answer.errors;
	} else {
		this.batchFor(
			answer.results,
			function(key, value) { 
				doUpdate(value[thisNodeBase.uuidName], upDocument);
				return true; 
			}, 
			100
		);
		// for (var n=0; n < answer.results.length; n++) {
			// doUpdate(answer.results[n][thisNodeBase.uuidName], upDocument);
		// }
	}
	return { errors: errors, results: results };
};


/**
 *  add operations to our oplog.
 *
 *  @param {object} entry : ...
 *
 */
Nobase.prototype.oplog = function(entry) {
};


/**
 *  add operations to our oplog.
 *
 *  @param {object} entry : ...
 *
 */
Nobase.prototype.oplog = function() {
	thisNodeBase = this;
};
Nobase.prototype.oplog.prototype.add = function(entry) {
	this.opVersion += 1;
	this.oplogStore.push(entry);
	this.events.emit('op', entry);
	return this;
};
Nobase.prototype.oplog.prototype.run = function(opArray) {
	var optype = '';
	for (var i = 0; i < opArray.length; i+=1) {
		optype = opArray[i].opId.substr(0,2);
		if (optype === 'wp');
	}
};


/**
 *  create a unique identifier.
 *
 *  @param {string || mongoDB.ObjectId} id : 
 *
 */
Nobase.prototype.nbid = function(id) {
	// this.idcount++;
	if (typeof id === 'string') {
		return id;
	}
	if (typeof id === 'object') {
		if (typeof id.toHexString === 'function') {
			return id.toHexString();
		} else if (typeof id.toString === 'function') {
			return id.toString();
		}
	}
	return uuid.v1().toString();
	// var pre = this.fixedLengthNumber(this.idcount, 16);
	// return pre + ' - ' + uuid.v1().toString();
};


/**
 *  fixed length total instance counter.
 *
 *  @param {number} counter : just a number
 *  @param {number} length : the number of chars to be prepended to with 0s 
 *
 */
Nobase.prototype.fixedLengthNumber = function(num, length) {
	var fixed = '';
	var nullCount = length - num.toString().length;
	while (fixed.length < length) {
		fixed += '0';
	}
	fixed += num.toString();
	return fixed;
};


/**
 *  dump all content into a json file
 *
 *  @param {string} filepath 
 *  @param {Function} callback : async, so you HAVE TO WAIT FOR THIS TO RETURN!
 *
 */
Nobase.prototype.dumpToFile = function(filepath, callback) {
	var thisNodeBase = this;
	var completeDB = JSON.stringify(thisNodeBase.store);
	fs.writeFile(
		filepath,
		completeDB,
		{
			encoding: 'utf8'
		},
		function(err) {
			if (typeof callback === 'function') {
				callback(err);
			}
		}
	);	
	return true;
};


/**
 *  dump all content into a json file
 *
 *  @param {string} filepath 
 *  @param {mode} 'replace' will wipe store, 'add' will add to store 
 *  @param {Function} callback : async, so you HAVE TO WAIT FOR THIS TO RETURN!
 *
 */
Nobase.prototype.readFromFileDump = function(filepath, mode, callback) {
	var thisNodeBase = this;
	mode = minions.defaultTo(mode, 'replace');
	if (mode === 'replace') {
		this.wipe();
	}
	fs.readFile(
		filepath,
		{
			encoding: 'utf8'
		},
		function(err, content) {
			var err2 = null;
			try {
				var completeDB = JSON.parse(content);
			} catch (err2) {
			}
			if (mode === 'replace') {
				thisNodeBase.store = completeDB;
				thisNodeBase.recount();
			} else {
				thisNodeBase.batchFor(
					completeDB,
					function(key, value) { 
						thisNodeBase.add(value, { overwrite: true });
						return true; 
					}, 
					100
				);
				// for (var key in completeDB) {
					// thisNodeBase.add(completeDB[key], { overwrite: true });
				// }
			}
			if (typeof callback === 'function') {
				callback(err, err2, content);
			}
		}
	);	
	return true;
};







console.log('[NoBase] store available');
module.exports = Nobase;




// ----------------------  attempt to introduce indices .. kinda stupid ..



/**
 *  adding an index to the store. only works with keys of type number or string
 *
 *  @param {Object || String || Array} query : 
 *  @param {Object} opts : 
 *  @param {Function} callback : OPTIONAL - it all works synchronously! a callback function that will receive errors and results as arrays
 *
 *	examples:
 *		
 *		
 *
 */
/* Nobase.prototype.addIndex = function(key, callback) {
	var errors = null;
	var results = [];
	this.indices[key] = {};
	for (var doc in this.store) {
		if (typeof this.store[doc][key] === 'number' || typeof this.store[doc][key] === 'string') {
			var keyval = this.store[doc][key];
			if (typeof this.indices[key][keyval] !== 'object') this.indices[key][keyval] = [];
			if (this.indices[key][keyval].indexOf(this.store[doc]._id) === -1) this.indices[key][keyval].push(this.store[doc]._id);
		}
	}
	if (typeof callback === 'function') callback(errors, results);
	return { errors: errors, results: this.indices[key] };
}; */


/**
 *  updating indices with new document
 *
 *  @param {Object || String || Array} query : 
 *  @param {Object} opts : 
 *  @param {Function} callback : OPTIONAL - it all works synchronously! a callback function that will receive errors and results as arrays
 *
 *	examples:
 *		
 *		
 *
 */ 
/* Nobase.prototype.updateIndices = function(document, removed) {	
	for (var key in this.indices) {
		if (typeof document[key] === 'number' || typeof this.store[document._id][key] === 'string') {
			var keyval = document[key];
			if (typeof this.indices[key][keyval] !== 'object') this.indices[key][keyval] = [];
			if (removed) {
				var idx = this.indices[key][keyval].indexOf(document._id);
				if (idx !== -1) this.indices[key][keyval].splice(idx, 1);
			} else {
				if (this.indices[key][keyval].indexOf(document._id) === -1) this.indices[key][keyval].push(document._id);
			}
		}
	}
	return true;
}; */


/**
 *  updating indices with new document
 *
 *  @param {Object || String || Array} query : 
 *  @param {Object} opts : 
 *  @param {Function} callback : OPTIONAL - it all works synchronously! a callback function that will receive errors and results as arrays
 *
 *	examples:
 *		
 *		
 *
 */ 
// Nobase.prototype.getIndexedDocuments = function(key, value, callback) {	
	// var errors = null;
	// var results = [];
	// if (typeof this.indices[key] === 'object' && typeof this.indices[key][value] === 'object') {
		// for (var id = 0; id < this.indices[key][value].length; id++) {
			// results.push(minions.cloneObject(this.store[this.indices[key][value][id]]));
		// }
	// } else {
		// if (typeof this.indices[key] !== 'object') errors = [ new Error('no matching index found') ];
		// else if (typeof this.indices[key][value] !== 'object') errors = [ new Error('no matching value found') ];
	// }
	// if (typeof callback === 'function') callback(errors, results);
	// return { errors: errors, results: results };
// };


// this.batchFor(obj,function(key, value) { return true; }, 100);
Nobase.prototype.batchFor = function(obj, callback, batchSize) {
  var keys = Object.keys(obj);
  var length = keys.length;
  var i = 0;
	var limit = 0;
	var result = true;
  while (i < length) {
    limit = i + batchSize;
    if (limit > length) {
      limit = length;
		}
    process.nextTick(
			function() {
        for (; i<limit; i+=1) {
          result = callback(keys[i], obj[keys[i]]);
					if (result === 'break') {
						i = length+1;
						break;
					}
        }
			}
		);
  }
	return this;
};

