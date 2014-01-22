/*
	a very simple non-persistant in-process document store for nodejs .	
	
	attention! this is still very early development.. anything might change!
	
*/

var Minions = require('minions');
var fs = require('fs');
var minions = new Minions(['node']);
var extend = require('util')._extend;
var uuid = require('node-uuid');

/**
 *  the constructor - in mongodb terms use this to create a 'collection'.
 *
 *  @param {String} baseName : the name of this collection
 *
 *	examples:
 *		var DB = new aNoBase('DB');
 * 
 *
 */
var aNoBase = function(baseName, uuidName) {
	// this.idcount = 0;
	this.name = (typeof baseName === 'string') ? baseName : 'noname';
	this.uuidName = (typeof uuidName === 'string') ? uuidName : '_id';
	this.numberOfEntries = 0;
	this.store = {};
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
aNoBase.prototype.find = function(query, opts) {
	var thisNodeBase = this;
	var errors = null;
	var results = [];
	var options = minions.defaultTo(opts, { skip:0, limit: false, noclone: false });	
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
	function doResult(doc) {
		skip--;
		if (typeof limit === 'number' && limit === results.length ) return false;
		if ( skip > -1 ) return true;		
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
		for (var i in this.store) {
			added = doResult(this.store[i]);
			if (added === false) break;
		}
	} else if (typeof query === 'string' && typeof this.store[query] !== 'undefined') {
		doResult(this.store[query]);
	} else if (typeof query === 'function') {
		for (var i in this.store) {
			if (query(this.store[i]) === true) {
				added = doResult(this.store[i]);
				if (added === false) break;
			}
		}
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
				if (doc[n] !== query[n]) return false;
			}
			return true;
		};
		for (var i in this.store) {
			if (_flexQuery(this.store[i], query) === true) {
				added = doResult(this.store[i]);
				if (added === false) break;
			}
		}
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
aNoBase.prototype.add = function(document, opts) {
	var thisNodeBase = this;
	var options = (typeof opts === 'object') ? opts : { overwrite: false };
	if (typeof options.overwrite !== 'boolean') options.overwrite = false;
	var errors = null;
	function doAdd(doc) {
		doc[thisNodeBase.uuidName] = thisNodeBase.nbid(doc[thisNodeBase.uuidName]);
		if (typeof thisNodeBase.store[doc[thisNodeBase.uuidName]] === 'undefined') thisNodeBase.numberOfEntries++;
		if (typeof thisNodeBase.store[doc[thisNodeBase.uuidName]] === 'undefined' || options.overwrite === true) {
			thisNodeBase.store[doc[thisNodeBase.uuidName]] = doc;
		}
	};
	if (document instanceof Array != true) {
		document = [ document ];
	}
	var L = document.length;
	for (var y = 0; y < L; y++) {
		doAdd(document[y]);
	}
	return { errors: errors, results: document };
};


/**
 *  get the number of stored objects
 *
 *	examples:
 *		DB.count();
 *
 */
aNoBase.prototype.count = function() {
	return this.numberOfEntries;
};


/**
 *  force a new active count of stored objects
 *
 *	examples:
 *		DB.recount();
 *
 */
aNoBase.prototype.recount = function() {
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
aNoBase.prototype.exists = function(query) {
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
aNoBase.prototype.wipe = function() {
	this.numberOfEntries = 0;
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
aNoBase.prototype.remove = function(query, opts) {
	var thisNodeBase = this;
	var errors = null;
	var results = [];
	var options = minions.defaultTo(opts, { skip:0, limit: false, noclone: false });	
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
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
		delete thisNodeBase.store[index];
		thisNodeBase.numberOfEntries--;
		return true;
	};
	var answer = this.find(query, options);
	if (answer.errors !== null) {
		errors = answer.errors;
	} else {
		for (var n=0; n < answer.results.length; n++) {
			doDelete(answer.results[n][thisNodeBase.uuidName]);
		}
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
aNoBase.prototype.update = function(query, upDocument, opts) {
	var thisNodeBase = this;
	var errors = null;
	var results = [];
	var options = minions.defaultTo(opts, { skip:0, limit: false });	
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
	function doUpdate(index, newAttributes) {
		skip--;
		if ( skip > -1	|| (typeof limit === 'number' && limit === results.length ) ) return;
		// thisNodeBase.updateIndices(thisNodeBase.store[index], true);
		var res = minions.extendDeep(false, thisNodeBase.store[index], newAttributes);
		results.push(res);
		// thisNodeBase.updateIndices(res);
		return true;
	};
	var answer = this.find(query, options);
	if (answer.errors !== null) {
		errors = answer.errors;
	} else {
		for (var n=0; n < answer.results.length; n++) {
			doUpdate(answer.results[n][thisNodeBase.uuidName], upDocument);
		}
	}
	return { errors: errors, results: results };
};


/**
 *  create a unique identifier.
 *
 *  @param {string || mongoDB.ObjectId} id : 
 *
 */
aNoBase.prototype.nbid = function(id) {
	// this.idcount++;
	if (typeof id === 'string') return id;
	if (typeof id === 'object') {
		if (typeof id.toHexString === 'function') return id.toHexString();
		else if (typeof id.toString === 'function') return id.toString();
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
aNoBase.prototype.fixedLengthNumber = function(num, length) {
	var fixed = '';
	var nullCount = length - num.toString().length;
	while (fixed.length < length) fixed += '0';
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
aNoBase.prototype.dumpToFile = function(filepath, callback) {
	var thisNodeBase = this;
	var completeDB = JSON.stringify(thisNodeBase.store);
	fs.writeFile(
		filepath,
		completeDB,
		{
			encoding: 'utf8'
		},
		function(err) {
			if (typeof callback === 'function') callback(err);
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
aNoBase.prototype.readFromFileDump = function(filepath, mode, callback) {
	var thisNodeBase = this;
	mode = minions.defaultTo(mode, 'replace');
	if (mode === 'replace') this.wipe();
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
				for (var key in completeDB) {
					thisNodeBase.add(completeDB[key], { overwrite: true });
				}
			}
			if (typeof callback === 'function') callback(err, err2, content);
		}
	);	
	return true;
};







console.log('[NoBase] store available');
module.exports = aNoBase;




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
/* aNoBase.prototype.addIndex = function(key, callback) {
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
/* aNoBase.prototype.updateIndices = function(document, removed) {	
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
// aNoBase.prototype.getIndexedDocuments = function(key, value, callback) {	
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
