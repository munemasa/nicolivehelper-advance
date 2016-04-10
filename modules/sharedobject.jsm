/* -*- mode: js2;-*- */

var EXPORTED_SYMBOLS = ["NicoLiveCommentReflector", "NicoLiveMylistData", "NLHstorage"];

var NLHstorage = {
    _storage: {},

    set: function( name, value ){
	this._storage[name] = value;
    },
    get: function( name, defvalue ){
	if( this._storage[name] ){
	    return this._storage[name];
	}
	return defvalue;
    }
};

var NicoLiveCommentReflector = {};

var NicoLiveMylistData = {};
