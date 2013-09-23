/*
	a nodeJS in-process document store
	- synchronous
	
	
	
*/

var Minions = require('minions');

global.minions = new Minions(['node']);


/**
 *  the constructor - in mongodb terms use this to create a 'collection'.
 *
 *  @param {Object} query : 
 *  @param {Object} opts : 
 *  @param {Object} callback : a callback function that will receive errors and results as arrays
 *
 *	examples:
 *		vws.bla = new aNodeBase('bla');
 *
 *
 */
var aNodeBase = function(baseName, storetype) {
	this.storetype = 'memory';
	this.store = {};
	this.name = (typeof baseName === 'string') ? baseName : 'noname';
	this.find = this._FIND_memory;
	this.add = this._ADD_memory;
	this.update = this._UPDATE_memory;
	this.remove = this._REMOVE_memory;
};


/**
 *  getting documents from the store.
 *
 *  @param {Object} query : 
 *  @param {Object} opts : 
 *  @param {Object} callback : a callback function that will receive errors and results as arrays
 *
 *	examples:
 *		// finding by single id
 *		bla.find('test_id_001', {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		// get everything
 *		bla.find(true, {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		// finding by array of ids
 *		bla.find(['test_id_001','test_id_002'], {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		// finding by function. will get EVERY document from the store. expected is a true||false return value.
 *		bla.find(function(doc) { return doc.blubb === 'somethingWeWantToFind'; }, {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		
 *
 */
aNodeBase.prototype._FIND_memory = function(query, opts, callback) {
	var thisNodeBase = this;
	var errors = null;
	var results = [];
	var options = minions.defaultTo(opts, { skip:0, limit: false });	
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
	function doResult(doc) {
		skip--;
		if (typeof limit === 'number' && limit === results.length ) return false;
		if ( skip > -1 ) return true;		
		var clone = minions.cloneObject(doc);
		results.push(clone);
		return true;
	};
	if (typeof query === 'boolean' && query === true) {
		for (var i in this.store) {
			var added = doResult(this.store[i]);
			if (added === false) break;
		}
	} else if (typeof query === 'string' && typeof this.store[query] !== 'undefined') {
		doResult(this.store[query]);
	} else if (typeof query === 'function') {
		for (var i in this.store) {
			if (query(this.store[i]) === true) {
				doResult(this.store[i]);
			}
		}
	}
	// console.log('###################################################');
	// console.log(results);	
	// console.log('++++++++++++++++++++++++++++++');
	if (typeof callback === 'function') callback(errors, results);
	return { errors: errors, results: results };
};


/**
 *  add documents to the store.
 *
 *  @param {Object} query : 
 *  @param {Object} opts : 
 *  @param {Object} callback : a callback function that will receive errors and results as arrays
 *
 *	examples:
 *		// adding a new document (with a set _id for testing.. )
 *		bla.add({ _id: 'test_id_001', blubb: 'something', blee: 'else', bibb: new Buffer(100) }, {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		// adding multiple new documents
 *		bla.add([ { _id: 'test_id_002', file: new Buffer(100) }, { _id: 'test_id_003', file: new Buffer(100) } ], {}, function(errors, results) { console.log(errors); console.log(results); } );
 *
 */
aNodeBase.prototype._ADD_memory = function(document, opts, callback) {
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
 *  delete documents from the store.
 *
 *  @param {Object} query : 
 *  @param {Object} opts : 
 *  @param {Object} callback : a callback function that will receive errors and results as arrays
 *
 *	examples:
 *		// delete a document by id
 *		bla.delete('test_id_001', {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		// deleting multiple documents
 *		bla.delete([ 'test_id_001', 'test_id_001' ], {}, function(errors, results) { console.log(errors); console.log(results); } );
 *
 */
aNodeBase.prototype._REMOVE_memory = function(query, opts, callback) {
	var thisNodeBase = this;
	var errors = null;
	var results = [];
	var options = minions.defaultTo(opts, { skip:0, limit: false });	
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
	function doDelete(index) {
		skip--;
		if ( skip > -1	|| (typeof limit === 'number' && limit === results.length ) ) return;
		var clone = minions.cloneObject(thisNodeBase.store[index]);
		results.push(clone);
		delete thisNodeBase.store[index];
		return true;
	};
	// use internal find
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
 *  @param {Object} query : 
 *  @param {Object} opts : 
 *  @param {Object} callback : a callback function that will receive errors and results as arrays
 *
 *	examples:
 *		// update a document by id
 *		bla.update('test_id_001', { thing: 'update test single' }, {}, function(errors, results) { console.log(errors); console.log(results); } );
 *		// updating multiple documents by array of ids
 *		bla.update([ 'test_id_001','test_id_002' ], { thing: 'update test multi' } , {}, function(errors, results) { console.log(errors); console.log(results); } );
 *
 */
aNodeBase.prototype._UPDATE_memory = function(query, upDocument, opts, callback) {
	var thisNodeBase = this;
	var errors = null;
	var results = [];
	var options = minions.defaultTo(opts, { skip:0, limit: false });	
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
	function doUpdate(index, newAttributes) {
		skip--;
		if ( skip > -1	|| (typeof limit === 'number' && limit === results.length ) ) return;
		var res = minions.extendDeep(false, thisNodeBase.store[index], newAttributes);
		results.push(res);
		return true;
	};
	// use internal find
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
 *  @param {Object} query : 
 *  @param {Object} opts : 
 *  @param {Object} callback : a callback function that will receive errors and results as arrays
 */
aNodeBase.prototype.nbid = function(id) {
	if (typeof id === 'string') return id;
	if (typeof id === 'object') {
		if (typeof id.toHexString === 'function') return id.toHexString();
		else if (typeof id.toString === 'function') return id.toString();
	}
	return this.name + minions.randomString(12, true, true, true);
};



console.log('[aNodeBase] store available');
module.exports = aNodeBase;