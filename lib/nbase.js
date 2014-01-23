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
 *		var DB = new Nbase('DB');
 * 
 *
 */
var Nbase = function(baseName, uuidName) {
	// this.idcount = 0;
	this.name = (typeof baseName === 'string') ? baseName : 'noname';
	this.keySeperator = '.';
	this.uuidName = (typeof uuidName === 'string') ? uuidName : '_id';
	this.entryCount = 0;
	this.store = {};
	this.index = {};
	this.insertCount = 0;
};


Nbase.prototype.uuid = function() {
	this.insertCount += 1;
	return uuid.v1().toString();
};





/**
 *  add items to the store.
 *
 *  @param {Object} document : 
 *  @param {Object} opts : 
 *
 *	examples:
 *		// adding a new document (with a set _id for testing.. )
 *		var done = DB.add({ _id: 'test_id_001', blubb: 'something', blee: 'else', bibb: new Buffer(100) }, {}); console.log(done.errors); console.log(done.results); 
 *		// adding multiple new items
 *		var done = DB.add([ { _id: 'test_id_002', file: new Buffer(100) }, { _id: 'test_id_003', file: new Buffer(100) } ], {}); console.log(done.errors); console.log(done.results); 
 *
 */
Nbase.prototype.add = function(items, opts, callback) {
	var thisNbase = this;
	if (typeof opts === 'function') {
		callback = opts;
		var options = {
			overwrite: true
		}
	} else {
		var options = minions.defaultTo(opts, { overwrite: true });
	}
	var errors = null;
	if (items instanceof Array !== true) {
		items = [ items ];
	}
	var L = items.length;
	for (var y = 0; y < L; y++) {
		thisNbase.addItem(items[y]);
	}
	// todo : make this async!
	if (typeof callback === 'function') {
		callback(errors, items);
	}
	return this;
};

Nbase.prototype.addItem = function(item, callback) {
	var thisNbase = this;
	if (typeof item[thisNbase.uuidName] === 'undefined') {
		item[thisNbase.uuidName] = this.uuid();
	}
	var lin = this.linearize('', item);
	// console.log('---LIN---');
	// console.log(lin);
	this.index[lin[thisNbase.uuidName]] = Object.keys(lin);
	this.entryCount+=1;
	for (var key in lin) {
		if (typeof this.store[key] !== 'object') {
			this.store[key] = {};
		}
		this.store[key][lin[thisNbase.uuidName]] = (typeof lin[key] === 'undefined') ? {} : lin[key];
	}
	if (typeof callback === 'function') {
		callback(null, item);
	}
	return this;
};




Nbase.prototype.reconstruct = function(id, fields) {
	if (typeof this.index[id] === 'undefined') {
		return false;
	}
	var lin = {};
	var keys = this.index[id];
	for (var n = 0; n < keys.length; n++) {
		if (typeof fields === 'undefined' || fields.length === 0 || fields.indexOf(keys) > -1) {
			lin[keys[n]] = this.store[keys[n]][id];
		}
	}
	var rec = this.objectize(lin);
	return rec;
};


Nbase.prototype._get = function(id, fields) {
	return this.reconstruct(id, fields);
};

Nbase.prototype.exists = function(query, callback) {
	var thisNbase = this;
	// console.log('query:' + query);
	if (typeof query === 'string') {
		if (typeof callback === 'function') {
			callback(null, (typeof this.index[query] === 'object'));
		}
		return this;
	}
	this.find(
		query, 
		{ limit: 1, skip: 0, fields: [ thisNbase.uuidName ] },
		function(err, res) {
			if (typeof callback === 'function') {
				callback(err, (res.length === 1));
			}
		}
	);
	return this;
};


/**
 *  empty the datastore
 *
 */
Nbase.prototype.wipe = function(callback) {
	this.entryCount = 0;
	this.store = {};
	if (typeof callback === 'function') {
		callback(null, this.store);
	}
	return this;
};


/**
 *  get the number of stored objects
 *
 *	examples:
 *		DB.count();
 *
 */
Nbase.prototype.count = function() {
	return this.entryCount;
};


/**
 *  force a new active count of stored objects
 *
 *	examples:
 *		DB.recount();
 *
 */
Nbase.prototype.recount = function() {
	this.entryCount = Object.keys(this.store).length;
	return this.entryCount;
};


/**
 *  delete items from the store.
 *
 *  @param {Object || String || Array} query : 
 *  @param {Object} opts : 
 *
 *	examples:
 *		// delete a document by id
 *		var done = DB.remove('test_id_001', {}; console.log(done.errors); console.log(done.results); 
 *		// deleting multiple items
 *		var done = DB.remove([ 'test_id_001', 'test_id_001' ], {}); console.log(done.errors); console.log(done.results); 
 *
 */
Nbase.prototype._removeByIndex = function(indexArray, limit, skip, callback) {
	var thisNbase = this;
	var results = [];
	for (var i=0; i<indexArray.length; i+=1) {
		skip--;
		if ( skip > -1	|| (typeof limit === 'number' && limit === results.length ) ) return;
		// console.log('--> ' + indexArray[i]);
		var toDelete = thisNbase._get(indexArray[i]);
		results.push(toDelete);
		var keys = thisNbase.index[indexArray[i]];
		if (typeof keys === 'object') {
			for (var n = 0; n < keys.length; n++) {
				delete thisNbase.store[keys[n]][indexArray[i]];
			}
			delete thisNbase.index[indexArray[i]];
			thisNbase.entryCount+=-1;
		} else {
			console.log('NOT FOUND : ' + indexArray[i]);
		}
	}
	if (typeof callback === 'function') {
		callback(null, results);
	}
	return this;
};


Nbase.prototype.remove = function(query, opts, callback) {
	var thisNbase = this;
	if (typeof opts === 'function') {
		callback = opts;
		var options = {
			skip: 0,
			limit: false
		}
	} else {
		var options = minions.defaultTo(opts, { skip:0, limit: false });
	}
	var errors = null;
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
	options.fields = [ thisNbase.uuidName ];
	var answer = this.find(
		query, 
		options,
		function(err, res) {
			var indexArray = [];
			if (err !== null) {
				errors = err;
			} else {
				// console.log(res);
				for (var n=0; n < res.length; n++) {
					indexArray.push(res[n]);
				}
			}
			thisNbase._removeByIndex(indexArray, limit, skip, callback);
		}
	);	
	return this;
};


Nbase.prototype.__find = function(query, opts, callback) {
	if (typeof opts === 'function') {
		callback = opts;
		var options = {
			skip: 0,
			limit: false
		}
	} else {
		var options = minions.defaultTo(opts, { skip:0, limit: false });
	}
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
	var results = [];
	for (var key in query) {
		for (var id in this.store[key]) {
			if (
				(
					typeof query[key] === 'number' 
					|| typeof query[key] === 'string' 
					|| typeof query[key] === 'boolean'
				)
				&&
				this.store[key][id] !== query[key]
			) {
				continue;
			} else if (
				typeof query[key] === 'function'
				&& query[key](this.store[key][id]) === false
			) {
				continue;
			} else if (
				query[key] instanceof Array
				&& query[key].indexOf(this.store[key][id]) === -1
			) {
				continue;
			}
			if (options.skip > 0) {
				options.skip+=-1;
				continue;
			}
			if (limit !== false) {
				options.limit += -1;
				if (options.limit < 1) {
					break;
				}
			}
			if (options.fields.length === 1 && options.fields[0] === thisNbase.uuidName) {
				results.push(id);
			} else {
				results.push(this._get(id, options.fields));
			}
		}
	}
	if (typeof callback === 'function') {
		callback(null, results);
	}
	return this;
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
Nbase.prototype.find = function(query, opts, callback) {
	var thisNbase = this;
	var errors = null;
	var results = [];
	if (typeof opts === 'function') {
		callback = opts;
		var options = {
			skip: 0,
			limit: false,
			fields: []
		}
	} else {
		if (typeof opts === 'undefined') {
			opts = {};
		}
		var options = minions.extendDeep(true, opts, { skip:0, limit: false, fields:[] });
	}
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
	function doResult(id) {
		// console.log('ADD TO RESULT: ' + id);
		skip--;
		if (typeof limit === 'number' && limit === results.length ) return false;
		if ( skip > -1 ) return true;
		if (options.fields.length === 1 && options.fields[0] === thisNbase.uuidName) {
			results.push(id);
		} else {
			results.push(thisNbase._get(id, options.fields));
		}
		return true;
	};
	var added = false;
	if (typeof query === 'boolean' && query === true) {
		for (var i in this.index) {
			added = doResult(i);
			if (added === false) break;
		}
	} else if (typeof query === 'string' && typeof this.index[query] !== 'undefined') {
		doResult(query);
	} else if (typeof query === 'function') {
		for (var i in this.index) {
			var item = thisNbase._get(i);
			if (query(item) === true) {
				added = doResult(i);
				if (added === false) break;
			}
		}
	} else if (typeof query === 'object' && query instanceof Array) {
		// ---[[[ query by list of _ids
		for (var n=0; n<query.length; n+=1) {
			if (typeof this.index[query[n]] !== 'undefined') {
				doResult(query[n]);
			}
		}
	} else if (typeof query === 'object') {
		// ---[[[ query object for flexQuery
		function _flexQuery(fieldName, value, resultsObject) {
			// console.log(arguments);
			// console.log(thisNbase.store[fieldName]);
			if (fieldName === thisNbase.uuidName) {
				if (typeof thisNbase.index[value] !== 'undefined') {
					resultsObject[value] = true;
					// console.log('id match');
				}
			} else {
				for (var id in thisNbase.store[fieldName]) {
					if (thisNbase.store[fieldName][id] === value) {
						resultsObject[id] = true;
					}
				}
			}
			return resultsObject;
		};
		var matches = {};
		for (var fieldName in query) {
			matches = _flexQuery(fieldName, query[fieldName], matches);
		}
		for (var i in matches) {
			added = doResult(i);
			if (added === false) break;
		}
	}
	if (typeof callback === 'function') {
		callback(errors, results);
	}
	return this;
};


Nbase.prototype._updateByIndex = function(indexArray, updates, limit, skip, callback) {
	var thisNbase = this;
	var results = [];
	for (var i=0; i<indexArray.length; i+=1) {
		skip--;
		if ( skip > -1	|| (typeof limit === 'number' && limit === results.length ) ) return;
		// console.log('');
		// console.log('-- UPDATE --> ' + indexArray[i]);
		for (var key in updates) {
			if (typeof thisNbase.store[key] === 'undefined') {
				thisNbase.store[key] = {};
			}
			// console.log(thisNbase.store[key][indexArray[i]] + ' => ' + updates[key]);
			if (typeof thisNbase.store[key][indexArray[i]] === 'undefined') {
				thisNbase.index[indexArray[i]].push(key);
			}
			thisNbase.store[key][indexArray[i]] = (typeof updates[key] === 'function') ? updates[key]() : updates[key];
		}
		results.push(thisNbase._get(indexArray[i]));
	}
	if (typeof callback === 'function') {
		callback(null, results);
	}
	return this;
};

/*

complex queries

db.find(
	{
		$or: {
			'e.e_a': true,
			'e.e_b': Nbase.below(4).and.above(2)
		},
		$extend: {
			'e_wrong': {
				'e.e_a: Nbase.(false).
			}
		}
	},
	f(e,r) {
	}
);

db.update(
	{
	},
	{
		'e.e_a': true,
		'e.e_b': Nbase.inc(4)
	}

*/

Nbase.prototype.update = function(query, updates, opts, callback) {
	var thisNbase = this;
	if (typeof opts === 'function') {
		callback = opts;
		var options = {
			skip: 0,
			limit: false
		}
	} else {
		var options = minions.defaultTo(opts, { skip:0, limit: false });
	}
	var errors = null;
	var limit = (typeof options.limit === 'number') ? options.limit : false;
	var skip = (typeof options.skip === 'number') ? options.skip : 0;
	options.fields = [ thisNbase.uuidName ];
	var answer = this.find(
		query, 
		options,
		function(err, res) {
			var indexArray = [];
			if (err !== null) {
				errors = err;
			} else {
				// console.log(res);
				for (var n=0; n < res.length; n++) {
					indexArray.push(res[n]);
				}
			}
			thisNbase._updateByIndex(indexArray, updates, limit, skip, callback);
		}
	);	
	return this;
};


Nbase.prototype.linearize = function(baseId, obj) {
	var linear = {};
	if (baseId.length > 0) baseId += this.keySeperator;
	for (var i in obj) {
		var branchId = baseId + i;
		if (typeof obj[i] === 'number') {
			linear[branchId] = copy(obj[i]);
		} else if (typeof obj[i] === 'string') {
			linear[branchId] = copy(obj[i]);
		} else if (typeof obj[i] === 'boolean') {
			linear[branchId] = copy(obj[i]);
		} else if (typeof obj[i] === 'function') {
			continue;
		} else if (typeof obj[i] === 'object' && Buffer.isBuffer(obj[i])) {
			linear[branchId] = new Buffer(obj[i]);
		} else if (typeof obj[i] === 'object') {
			var subLinears = this.linearize(branchId, obj[i]);
			for (var subId in subLinears) {
				linear[subId] = subLinears[subId];
			}
		}
	}
	return linear;
};


Nbase.prototype.objectize = function(linear) {
	var obj = {};	
	for (var i in linear) {
		var idParts = i.split(this.keySeperator);
		// idParts.shift();
		if (idParts.length > 0) {
			obj = deepAssign(obj, idParts, linear[i]);
		} else {
			obj = copy(linear[i]);
		}
	}
	return obj;
};




module.exports = Nbase;
// ===================================================
// ===================================================
// ===================================================
// ===================================================



function deepAssign(baseObj, keys, deepValue) {
	var step = baseObj;
	while (keys.length > 0) {
		var key = keys.shift();
		if (keys.length > 0) {
			if (typeof step[key] !== 'object') {
				step[key] = {};
			}
		} else {
			step[key] = copy(deepValue);
		}
		step = step[key];
	}
	return baseObj;
};

function clone(source) {
  if (typeof source === 'undefined') {
		return void 0;
	} else if (source === null) {
		return null;
	} else if (source instanceof Array) {
		var clone = [];
		for (var f = 0; f < source.length; f++) clone.push(copy(source[f]));
	} else if (typeof source.constructor !== 'undefined' && typeof source.constructor.name === 'string' && source.constructor.name === 'ObjectID') { 
    var clone = new source.constructor("" + source);
  } else if (typeof source.constructor === 'function' && source.constructor.name !== 'Object') {
		var clone = new source.constructor(source);
	} else {
		var clone = {};
	  for (var f in source) clone[f] = copy(source[f]);
  }
	return clone;
};


function copy(source) {
	if (typeof source === 'undefined') return void 0;
	else if (typeof source === 'number') return Number(source);
	else if (typeof source === 'string') return String(source);
	else if (typeof source === 'object') return clone(source);
	else if (typeof source === 'function') return source.valueOf();
	else if (typeof source === 'boolean') return Boolean(source.valueOf());
	else return source;
};

















// tests

/* var DB = new Nbase('test', '_uuid');
DB.add(
	[ { a: 'something', b: 'else', c: new Buffer(100) } ],
	function(err, res) {
		console.log('---1---');
		console.log(arguments);
		var uuid = Object.keys(DB.index)[0];
		var query = { 'a': 'something' };
		DB.remove(
			query,
			function(err, res) {
				console.log('---2---');
				console.log(arguments);
			}
		);
		// DB.find(
			// query,
			// function(err, res) {
				// console.log('---2---');
				// console.log(arguments);
				// var query = { '_uuid': uuid };
				// DB.find(
					// query,
					// function(err, res) {
						// console.log('---3---');
						// console.log(arguments);
						// DB.exists(
							// { 'a': 'something' },
							// function(err, res) {
								// console.log('---4---');
								// console.log(arguments);
							// }
						// );
					// }
				// );
			// }
		// );
	}
);
 */