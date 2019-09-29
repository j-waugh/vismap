// Plugins/vismap2/vismap2_scene_list.js

var defsize = 14; // font size, in pixels
var num; // loop counter
var names; // array of names
var htmlNames; // names in HTML
var span = document.getElementById( 'title' );
var rubysMsg; // json scene names array

// prevents HTML renderer from breaking scene names on spaces
function nospace( txt ) {
	return txt.replace( new RegExp(' ','g'), '&nbsp;' );
}

function resize( amt ) {
    defsize += amt;
    top.main.document.body.style.fontSize = defsize + 'px';
    setSceneList();
}

function rubyReturned( message ) {
    rubysMsg = message;
    setSceneList()
}

function setSceneList() {
    eval( 'names = ' + rubysMsg );
    htmlNames = '';
    for ( n in names ) {
        num = parseInt( n );
        htmlNames += ( num + 1 ) + ': ' + nospace( names[num] ) + '<br>';
    }
	
	top.main.document.body.style.fontSize = defsize + 'px';
    top.main.document.body.innerHTML = htmlNames;
}

// end of Plugins/vismap2/vismap2_scene_list.js
