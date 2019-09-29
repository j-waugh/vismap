# Plugins/vismap2_menu.rb - loads Plugins/vismap2/vismap2.rb on opening SketchUp
# Copyright 2009, Martin Rinehart

require 'sketchup'

def show_hide_vismap()
	if file_loaded?( "vismap2.rb" )
		Vismap.toggle_dialogs()
	else
		pathname = Sketchup.find_support_file( 'vismap2.rb', 'Plugins/vismap2/' )
		load( pathname )
	end
		
end

unless file_loaded?( "vismap2.rb" )
	UI.menu("Plugins").add_item( "VisMap v2" ) { show_hide_vismap() }
	show_hide_vismap()
	file_loaded( "vismap2.rb" )
end

# end of Plugins/vismap2_menu.rb
