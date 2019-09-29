// Plugins/vismap2/vismap2_main.js

var
	layer_cbs = [], // left of layer names
	rc_cbs = [], // main checkbox array
	scene_cbs = [],	// above scene numbers
	size_cb = 12; // default checkbox size, in pixels
	
var middle_row = document.getElementById( 'middle_row' ); // full body <div>

// these are the checkboxes in the array
function add_checkbox( cell, i, id_suffix, handler ) {
	var cb = document.createElement( 'input' );
	cb.id = i + '_' + id_suffix;
	cb.type = 'checkbox';
	cb.style.height = size_cb + 'px';
	cb.style.width = size_cb + 'px';
 	cell.appendChild( cb );
	cb.onclick = handler;
}
function btn_refresh() {

	cursor( 'wait' );
	top.btn_refresh();
	if ( ! top.error() ) {
		createInnerTable(); 
	} else { errorReport(); }
	cursor( 'default' );
}

function createInnerTable() { // Inner table = the center frame

	var
		cell, 	// a cell being created/populated
		cl, 	// column (in rw/cl loops)
		i,	 	// loop counter
		itbl, 	// the inner table
		row, 	// a row being created/populated
		rw 		// row (in rw/cl loops)

	var nrows = top.vismap.model.layers.length;
	var ncols = top.vismap.model.scenes.length;
	var rc = 0, // row color
		cc = 0; // column color
	
	var colors = [
		'#ffffff',
		'#e0e0ff'
	];
	

  	itbl = document.createElement( 'table' );
	  	itbl.align = 'center';
  		itbl.style.backgroundColor = '#f0f0ff';
	  	itbl.border=0;
  		itbl.cellPadding=0;
		itbl.cellSpacing=0;
	  	itbl.style.height='100%'; itbl.style.width='100%';
  	
  	row = itbl.insertRow(0); // top row: scenes' checkboxes
	cell = row.insertCell( 0 );
	cell.style.background = '#f0fff8'
	cell = row.insertCell( 1 );
	cell.style.background = '#f0fff8'
  	for ( i = 0; i < ncols; i++ ) {
  		cell = row.insertCell(i+2);
		if ( (i%5) == 4 ) { cell.style.borderRight='1px solid #000000'; }
		if ( i == 0 ) { cell.style.borderLeft='1px solid #000000'; }
		cell.style.borderTop = '1px solid #000000';
		if ( i == (ncols-1) ) { cell.style.borderRight='1px solid #000000'; }
  		add_checkbox( cell, i, 'scenes_cb', handle_scene_click );
  	}

  	row = itbl.insertRow(1); // 2nd row, scene numbers
	cell = row.insertCell( 0 );
	cell.style.background = '#f0fff8';
	cell = row.insertCell( 1 );
	cell.style.background = '#f0fff8'
  	for ( i = 0; i < ncols; i++ ) {
  		cell = row.insertCell(i+2);
		cell.id = i + '_sceneNumber';
  		cell.align='center';
		cell.style.background = colors[ i % 2 ];
		cell.style.fontSize = ( size_cb + 1 ) + 'px';
		if ( (i%5) == 4 ) { cell.style.borderRight='1px solid #000000'; }
		if ( i == 0 ) { cell.style.borderLeft='1px solid #000000'; }
		if ( i == (ncols-1) ) { cell.style.borderRight='1px solid #000000'; }
  		cell.innerHTML = '' + ( i + 1 );
  	}

  	for ( rw = 0; rw < nrows; rw++ ) { // array rows

  		row = itbl.insertRow(rw+2);
  		cell = row.insertCell(0); // layer checkbox
		cell.style.background = colors[ rc ];
		cell.style.borderLeft = '1px solid #000000';
  		add_checkbox( cell, rw, 'layers_cb', handle_layer_click );
		if ( (rw%3) == 0 ) { cell.style.borderTop='1px solid #000000'; }
		if ( rw == (nrows-1) ) { cell.style.borderBottom='1px solid #000000'; }

  		cell = row.insertCell(1); // layer name
  		cell.align = 'left';
		cell.id = rw + '_layerName';
		cell.style.fontSize = (size_cb + 2) + 'px';
		cell.style.background = colors[ rc ];
		if ( (rw%3) == 0 ) { cell.style.borderTop='1px solid #000000'; }
  		cell.innerHTML = top.vismap.model.sortedLayers[rw].name;
		if ( rw == (nrows-1) ) { cell.style.borderBottom='1px solid #000000'; }

  		for ( cl = 0; cl < ncols; cl++ ) {
  			cell = row.insertCell(cl+2);
			cell.style.background = colors[ rc ]; 
			if ( cl == 0 ) { cell.style.borderLeft = '1px solid #000000'; }
			if ( (rw%3) == 0 ) { cell.style.borderTop='1px solid #000000'; }
			add_checkbox( cell, rw*ncols + cl, 'rc_cb',	handle_click );
			if ( (cl%5) == 4 ) { cell.style.borderRight='1px solid #000000'; }
			if ( rw == (nrows-1) ) 
				{ cell.style.borderBottom = '1px solid #000000'; }
			if ( cl == (ncols-1) ) 
				{ cell.style.borderRight = '1px solid #000000'; }
  		}
		
		if ( (rw%3) == 2 ) { rc = (rc==0) ? 1 : 0; } 

  	} // end of loop over layers

	div = document.getElementById( 'middle_row' );
	while ( div.hasChildNodes() ) { // empty the div
		div.removeChild( div.firstChild );
	}
	div.appendChild( itbl );
	
	createUIrefs();
	
} // end of createInnerTable()

// stored in layer_cbs[], rc_cbs[] and scene_cbs[]
function createUIrefs() {
    get_layer_cbs();
    get_rc_cbs();
    get_scene_cbs();
}

function cursor( type ) { 
	document.body.style.cursor = type;
}

function errorReport() {

	document.body.innerHTML =
		'<h1> Error Analyzing Model </h1>' +
		'<p> Reported ' + top.vismap.model.vis +
		'<p> Try Window/Model Info/Statistics Purge Unused' +
		'<br> and then try Vismap again.' 
	return;
}

// these are the checkboxes left of the layer names
function get_layer_cbs() {
	var layer, lno;
	for ( layer in top.vismap.model.layers ) {
		lno = parseInt( layer );
		layer_cbs[ lno ] = 
			document.getElementById( lno + '_layers_cb' );
	}
}

// these are the checkboxes in the array
function get_rc_cbs() {
	var cl, col, id, row, rw, n;
	for ( row in top.vismap.model.layers ) {
		rw = parseInt( row );
		for ( col in top.vismap.model.scenes ) {
			cl = parseInt( col );
			n = rw*top.vismap.model.scenes.length + cl;
			id = num_given_rc(rw, cl) + '_rc_cb';
			rc_cbs[ n ] = 
				document.getElementById( id );
			rc_cbs[ n ].checked = top.checked( rw, cl );
		}
	}
}

// these are the checkboxes above the scene numbers
function get_scene_cbs() {
	var scene, sno;
	for ( scene in top.vismap.model.scenes ) {
		sno = parseInt( scene );
		scene_cbs[sno] = document.getElementById( sno + '_scenes_cb' );
	}
}

// on unchecking an individual box, uncheck its scene/layer boxes
var handle_click = function() { 
	var n = parseInt( this.id );

	if ( rc_cbs[n].checked ) return;

	var where = rc_given_num( n );
	var row = where[0];
	var col = where[1];

	scene_cbs[ col ].checked = false;
	layer_cbs[ row ].checked = false;

} // end of handle_click()

// Check (or uncheck) every checkbox in a row
var handle_layer_click = function( ) {
	var r = parseInt( this.id );

	var base = r * top.vismap.model.scenes.length;
	var stop = base + top.vismap.model.scenes.length;
	for ( i = base; i < stop; i++ ) {
		rc_cbs[ i ].checked = layer_cbs[ r ].checked;
		if ( ! rc_cbs[i].checked ) {
			scene_cbs[ rc_given_num(i)[1] ].checked = false;
		}
	}

} // end of handle_layer_click()

// Check (or uncheck) every checkbox in a column
var handle_scene_click = function() {
	var col = parseInt( this.id );
	for ( i = 0; i < top.vismap.model.layers.length; i++ ) {
		j = col + i*top.vismap.model.scenes.length;
		rc_cbs[ j ].checked = scene_cbs[ col ].checked;
		if ( ! rc_cbs[j].checked ) {
			layer_cbs[ rc_given_num(j)[0] ].checked = false;
		}
	} 
}

// index into the "vis" array for a given layer and scene #
function num_given_rc( r, c ) {
	return r * top.vismap.model.scenes.length + c;
}

// layer and scene for a given index
function rc_given_num( num ) {
	var len = top.vismap.model.scenes.length;
	return [ Math.round(( num / len ) - 0.5), num % len ];
}

// called by bigger, "B", and smaller, "s", buttons
function resize( amt ) {
	size_cb += amt;
	createInnerTable();
}
// end of Plugins/vismap2/vismap2_main.js