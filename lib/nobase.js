/*
	a very simple non-persistant in-process document store for nodejs .	
	
	attention! this is still very early development.. anything might change!
	
*/

var Minions = require('minions');
var fs = require('fs');
var minions = new Minions(['node']);
var extend = require('util')._extend;

/**
 *  the constructor - in mongodb terms use this to create a 'collection'.
 *
 *  @param {String} baseName : the name of this collection
 *  @param {String} storetype : ignored
 *
 *	examples:
 *		var DB = new aNoBase('DB');
 * 
 *
 */
var aNoBase = function(baseName, storetype) {
	this.storetype = 'memory';
	this.store = {};
	// this.indices = {};
	this.name = (typeof baseName === 'string') ? baseName : 'noname';
	this.find = this._FIND_memory;
	this.add = this._ADD_memory;
	this.update = this._UPDATE_memory;
	this.remove = this._REMOVE_memory;
	this.count = this._COUNT_memory;
	this.wipe = this._WIPE_memory;
	this.exists = this._EXISTS_memory;
	this.dumpToFile = this._DUMPTOFILE_memory;
	this.readFromFileDump = this._READFROMFILEDUMP_memory;
};


/**
 *  getting documents from the store.
 *
 *  @param {Object || String || Array} query : 
 *  @param {Object} opts : 
 *  @param {Function} callback : OPTIONAL - it all works synchronously! a callback function that will receive errors and results as arrays
 *
 *	examples:
 *		// finding by single id
 *		DB.find('test_id_001', {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		// get everything
 *		DB.find(true, {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		// finding by array of ids
 *		DB.find(['test_id_001','test_id_002'], {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		// finding by function. will get EVERY document from the store. expected is a true||false return value.
 *		DB.find(function(doc) { return doc.blubb === 'somethingWeWantToFind'; }, {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		
 *
 */
aNoBase.prototype._FIND_memory = function(query, opts, callback) {
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
	} else if (typeof query === 'object') {
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
	if (typeof callback === 'function') callback(errors, results);
	return { errors: errors, results: results };
};



/**
 *  add documents to the store.
 *
 *  @param {Object} document : 
 *  @param {Object} opts : 
 *  @param {Function} callback : OPTIONAL - it all works synchronously! a callback function that will receive errors and results as arrays
 *
 *	examples:
 *		// adding a new document (with a set _id for testing.. )
 *		DB.add({ _id: 'test_id_001', blubb: 'something', blee: 'else', bibb: new Buffer(100) }, {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		// adding multiple new documents
 *		DB.add([ { _id: 'test_id_002', file: new Buffer(100) }, { _id: 'test_id_003', file: new Buffer(100) } ], {}, function(errors, results) { console.log(errors); console.log(results); } );
 *
 */
aNoBase.prototype._ADD_memory = function(document, opts, callback) {
	var thisNodeBase = this;
	var options = minions.defaultTo(opts, { overwrite: false });	
	var errors = null;
	var results = [];
	function doAdd(doc) {
		doc._id = thisNodeBase.nbid(doc._id);
		var key = doc._id;
		if (typeof thisNodeBase.store[key] === 'undefined' || options.overwrite === true) {
			thisNodeBase.store[key] = doc;
			results.push(doc);
			// thisNodeBase.updateIndices(doc);
		}
	}
	if (typeof document === 'object') {
		if (document instanceof Array) {
			for (var y = 0; y < document.length; y++) {
				doAdd(document[y]);
			}
		} else {
			doAdd(document);
		}
	} else {
		var thisError = new Error('document (first parameter) must be an object');
		errors = [ thisError ];
	}
	if (typeof callback === 'function') callback(errors, results);
	return { errors: errors, results: results };
};


/**
 *  get the number of stored objects
 *
 *	examples:
 *		// delete a document by id
 *		DB.count();
 *
 */
aNoBase.prototype._COUNT_memory = function() {
	return minions.objectSize(this.store);
};


/**
 *  check if an object exists
 *
 *	examples:
 *		// checks if any document matches the given condition
 *		var documentExists = DB.idExists(function(doc) { return (doc.name === 'joe'); });
 *
 */
aNoBase.prototype._EXISTS_memory = function(query) {
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
aNoBase.prototype._WIPE_memory = function() {
	return this.store = {};
};


/**
 *  delete documents from the store.
 *
 *  @param {Object || String || Array} query : 
 *  @param {Object} opts : 
 *  @param {Function} callback : OPTIONAL - it all works synchronously! a callback function that will receive errors and results as arrays
 *
 *	examples:
 *		// delete a document by id
 *		DB.remove('test_id_001', {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		// deleting multiple documents
 *		DB.remove([ 'test_id_001', 'test_id_001' ], {}, function(errors, results) { console.log(errors); console.log(results); } );
 *
 */
aNoBase.prototype._REMOVE_memory = function(query, opts, callback) {
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
		return true;
	};
	var answer = this._FIND_memory(query, options);
	if (answer.errors !== null) {
		errors = answer.errors;
	} else {
		for (var n=0; n < answer.results.length; n++) {
			doDelete(answer.results[n]._id);
		}
	}
	if (typeof callback === 'function') callback(errors, results);
	return { errors: errors, results: results };
};


/**
 *  update documents in the store.
 *
 *  @param {Object || String || Array} query : 
 *  @param {Object} upDocument : 
 *  @param {Object} opts : 
 *  @param {Function} callback : OPTIONAL - it all works synchronously! a callback function that will receive errors and results as arrays
 *
 *	examples:
 *		// update a document by id
 *		DB.update('test_id_001', { thing: 'update test single' }, {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		// updating multiple documents by array of ids
 *		DB.update([ 'test_id_001','test_id_002' ], { thing: 'update test multi' } , {}, function(errors, results) { console.log(errors); console.log(results); } );
 *
 */
aNoBase.prototype._UPDATE_memory = function(query, upDocument, opts, callback) {
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
	var answer = this._FIND_memory(query, options);
	if (answer.errors !== null) {
		errors = answer.errors;
	} else {
		for (var n=0; n < answer.results.length; n++) {
			doUpdate(answer.results[n]._id, upDocument);
		}
	}
	if (typeof callback === 'function') callback(errors, results);
	return { errors: errors, results: results };
};


/**
 *  create a unique identifier.
 *
 *  @param {string || mongoDB.ObjectId} id : 
 *
 */
aNoBase.prototype.nbid = function(id) {
	if (typeof id === 'string') return id;
	if (typeof id === 'object') {
		if (typeof id.toHexString === 'function') return id.toHexString();
		else if (typeof id.toString === 'function') return id.toString();
	}
	return this.name + minions.randomString(12, true, true, true);
};


/**
 *  dump all content into a json file
 *
 *  @param {string} filepath 
 *  @param {Function} callback : async, so you HAVE TO WAIT FOR THIS TO RETURN!
 *
 */
aNoBase.prototype._DUMPTOFILE_memory = function(filepath, callback) {
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
aNoBase.prototype._READFROMFILEDUMP_memory = function(filepath, mode, callback) {
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
