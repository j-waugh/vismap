// vismap2.js - layer/scene visibility map
// copyright 2009, Martin Rinehart

// This is the javascript loaded by the frameset.

/*
This file:
	classes
		CharMap - convert 'VIIVVI ...' to string-encoded bitmap
		Layer - one per layer, w/name, lowerName, original row index
		Sixer - returns, chops off, six 'VIIVVI's at a time
	support functions
	click handlers
	UI builders
	
Within all groups: alphabetical order.
	
Basic idea: initial display forces user to click "Get Data from Model". (Why not just do it? Mac incompatible timing issues.)

Starts by calling "refresh()" Ruby callback function. "refresh()" is called again whenever user clicks "Get Data from Model".

"refresh" gathers its data, then calls support function "rubyReturns()" with a JSON representation of the vismap.model's layers, scenes and visibilities. JavaScript creates custom UI, one row per layer and one column per scene, all checkboxes. 

User fusses w/checkboxes (checked == visible). User clicks "Send Data to Model".

JavaScript calls Ruby callback "newVis()" with visibilities (in string-encoded bitmap). Ruby adjusts vismap.model appropriately.
*/

var vismap = {}; // get the rest of the data out of the global namespace

// vismap.model filled in with JSON from Ruby

// "classes"

function CharMap( s, c ) {
// Called with a String ("VIIVVIIVVV...") and a char ("V"), this creates CharMap.map, a bitmap locating the chars (1001100111...). The bitmap is encoded in another string, 6 bits per char. The first three chars encode the length, in bits, of the bitmap.

	var X = [ 32, 16, 8, 4, 2, 1 ];
	var Base = 48;
	
	this.matchChar = c;
	this.s6 = new Sixer( s );
	this.map = '';
	
	var e;
	
	try { // encode six bits at a time into characters
		while (true ) {
			this.map += encode( this.s6.next(), this.matchChar );
		}
	}
	catch( e ) {} // the Sixer has run dry
	
	size = encodeNumber( s.length ); // 3-char string
	
	this.map = size + this.map;

	function encode( str, c ) {
		var ret = '';
		var word = 0;
		for ( var i = 0; i < 6; i++ ) {
			if ( str.charAt(i) == c ) { word += X[i]; }
		}
		// alert( 'in encode(), working on ' + str + ', word= ' + word );
		return encodeChar( word );
	}
	
	function encodeChar( n ) { return String.fromCharCode( n + Base ); }
	
	function encodeNumber( n ) {
		var low6 = n & 63; // 00000011111
		n = n >>> 6;
		var middle6 = n & 63;
		var hi6 = n >>> 6;
		return encodeChar( hi6 ) + encodeChar( middle6 ) + encodeChar( low6 );
	}
	
} // end of class CharMap

// this little guy remembers where a row started, before sorting
function Layer( name, row ) {
	this.name = name;
	this.originalRow = row;
	this.lowerName = name.toLowerCase();
}

// passed to the sort() method to compare by lowercase names
Layer.compareLower = function( a, b ) {
	var x = a.lowerName, y = b.lowerName;
	if ( x == y ) return 0;
	return x < y ? -1 : 1;
}

// probably useless after debugging
Layer.prototype.toString = function() { return 'Layer: ' + this.name + '-' + this.originalRow; }

// Called with a string, Sixer chops off and returns 6 characters at a time from the left. The last chars are padded with blanks to length 6. When the string is empty, Sixer throws "well ran dry".
function Sixer( str ) {

	this.string = str;
	
	this.next = function() {
		if ( this.string == '' ) throw "well ran dry";
		return this.lpop();
	}
	
	// grab, and then chop off, six chars at a time from the left
	this.lpop = function() {
		var ret = this.string.substr( 0, 6 );
		if ( ret.length < 6 ) {
			this.string = ''; // runs well dry
			return (ret + '      ').substr( 0, 6 ); // always returns 6 chars
		} else {
			this.string = this.string.substr( 6 ); // chops off first 6 chars
			return ret;
		}
	} // end of Sixer.lpop()
	
} // end of class Sixer

// SUPPORT FUNCTIONS

function checked( row, col ) { // is intersection visible?
	var rno = vismap.model.sortedLayers[ row ].originalRow;
	var cno = rno * vismap.model.scenes.length + col;
	return vismap.model.vis.substring( cno, cno+1 ) == 'V';
}

// called this way by Ruby if the SketchUp model is broken
function error() {
	return vismap.model.vis.substring(0,1) == 'E';
}

// One "V" or "I" for each checkbox in the array (read left-to-right, top-to-bottom)
function getVis() { // assembles new string of 'V's and 'I's
	var vis = [];
	
	for ( lr in vismap.model.layers ) {
		var lrn = parseInt( lr );
		var str = '';
		for ( sn in vismap.model.scenes ) {
			var snn = parseInt( sn );
			var cbn = main.num_given_rc( lrn, snn );
			str += main.rc_cbs[ cbn ].checked ? 'V' : 'I';
		}
		vis[ vismap.model.sortedLayers[lrn].originalRow ] = str;
	} // end of layer loop
	return vis.join('');
} // end of getVis()

// called by "Get Data from Model" buttons
function rubyCalled( callback_name, message ) {
	if ( (typeof message) == 'undefined' ) message = '';
	url = 'skp:' + callback_name + '@' + message;
  	location.href = url; // the real deal
	// rubyReturned( "{ layers:[ 'Layer0', 'basement', 'ground_floor', 'garage', 'second_floor', 'stairs', 'roof' ], scenes:[ 'outside, aerial', 'outside, front door', 'livingroom', 'diningroom', 'bedroom', 'garage' ], vis:'VVVVVVVVIIIVVVVVIVVVVVVVVVIVVVIIVVVIVVIIIV' }" ); // used to test in Opera
}

// called from Ruby
function rubyReturned( json ) {
	eval( 'vismap.model = ' + json );  // whats_in_model();
	
	// add array of Layer objects, in vismap.model order
	vismap.model.layerObjects = [];
	for ( i in vismap.model.layers ) {
		vismap.model.layerObjects[i] = new Layer( vismap.model.layers[i], i ); }	
	// create and sort array of Layer objects, sorted by lowercase name
	vismap.model.sortedLayers = [];
	for ( i in vismap.model.layerObjects ) {
		vismap.model.sortedLayers[i] = vismap.model.layerObjects[i]; }
	vismap.model.sortedLayers.sort( Layer.compareLower );
	
	for ( i in vismap.model.sortedLayers ) {
		vismap.model.sortedLayers[i].sortedRow = i; }
	
} // end of rubyReturned()

// grow/shrink the scene list
function scene_resize( amt ) {
	var span;
	
	span = document.getElementById( 'sceneList' );
	vismap.sceneSize += amt;
	span.style.fontSize = vismap.sceneSize + 'px';
}

/* debugging
whats_in_model = function() {
	alert( 'layers = ' + vismap.model.layers + '\n' +
		'scenes = ' + vismap.model.scenes + '\n' +
		'vis = ' + vismap.model.vis );
}
// */

// CLICK HANDLERS
var btn_download = function() { // "Send Data to Model"

	if ( ! vismap.model ) {
		alert( 'There is no data to send.' );
		return;
	}
	var vis = getVis();
	var map = new CharMap( vis, "V" ).map;
	rubyCalled( 'newVis', map ); 
}

var btn_refresh = function() { // "Get Data from Model"
  	rubyCalled( 'refresh' );
}

// end of vismap2.js