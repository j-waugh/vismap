# Plugins/vismap2/vismap2.rb - layer/scene visibility map, v 2.0
# copyright 2009, Martin Rinehart

require 'sketchup'

=begin
Key structure to understand get/setVisibles is the "vis" ("V"s and "I"s). This is a string of "V"s and "I"s, such as "VVIVIIVVI...". "V" == "V"isible; "I" == "I"nvisible. There is one "V" or "I" for each layer/scene intersection. 

If there are 5 scenes, the first five letters in the string are the "V/I" settings of the five scenes in the first layer; the second five letters are the five scenes in the second layer, and so on. Another way to look at it is that these are the checkboxes--"V" if checked, "I" if not--in the map, read as a Western language: left-to-right and top-to-bottom.
=end

module Vismap

# Reload extension by running this method from the Ruby Console:
#   Example::HelloWorld.reload
#   def self.reload
#     original_verbose = $VERBOSE
#     $VERBOSE = nil
#     pattern = File.join(__dir__, '**/*.rb')
#     Dir.glob(pattern).each { |file|
#       # Cannot use `Sketchup.load` because its an alias for `Sketchup.require`.
#       load file
# 	}.size
#   ensure
#     $VERBOSE = original_verbose
#   end

class Vismap_Model

	def initialize()
		@model = Sketchup.active_model
		@layers = @model.layers
		@scenes = @model.pages
	end

	def layers()
		return @layers
	end

	def layer_names()
		names = []
		@layers.each { |lr| names.push(lr.name) }
		return names
	end

	def scenes
		return @scenes
	end
	
	def scene_names()
		names = []
		@scenes.each { |s| names.push(s.name) }
		return names
	end
    
    def scene_json()
        return Vismap.namesJson( self.scene_names )
    end

    # return "VIVV...", one "V"isbl or "I"nvisbl for each scene in each layer
    def getVisibles()
    	answer = 'V' * (@scenes.count*@layers.length)
    	i = 0
    	@scenes.each do |s|
			if(s.layers != nil)
			s.layers.each do |lr|
				loc = Vismap.locate( lr.name, layer_names() ) * @scenes.count
				loc += Vismap.locate( s.name, scene_names() )
				answer[loc..loc] = "I"
			end
			end

			i += 1
    	end
    	return answer

    end # getVisibles()

    # JSON to send to webdialog
    def getJson()
    	ret = '{ '
		begin
			ret += 'layers:' + Vismap.namesJson( self.layer_names )
			ret += ', scenes:' + Vismap.namesJson( self.scene_names )
			vis = self.getVisibles()
			ret += ", vis:'" + vis + "'"
			ret += ' }'
		rescue
			errMsg = $!.to_s
			errMsg.gsub!( '<', '&lt;' )
			vis = 'vis:\"Error - ' + errMsg + '\"'
			ret = '{ layers:\"\", scenes:\"\",' + vis + ' }'
		end
    	return ret

    end # getJson()

	# given "VI" string (see getVisibles) sets visibilities
	def setVisibles( vis )

		sn = 0 # scene number
		@scenes.each do |s|

			ln = 0 # layer number
			@layers.each do |lr|

				vn = ln*@scenes.count + sn # vis number
				v_or_i = vis[vn..vn]

				s.set_visibility( @layers[ln], v_or_i == 'V' )
				ln += 1

			end # layers.each

			sn += 1

		end # scenes.each

	end # of setVisibles()

end # of class Model

class Bitmap
=begin
JavaScript returns the new list of Visibles and Invisibles as a bit map encoded in a string. The first three characters encode the length of the string. Each following character encodes six bits of the map. CHR(48) == 000000; CHR(49) == 000001; CHR(50) == 000010; CHR(51) == 000011; etc.
=end
	@@vismap_powers = [ 32, 16, 8, 4, 2, 1 ]
	@@base = 48

	def initialize( map )
		@map = map
		self.getLength() # sets @length
		self.getVis()    # sets @vis
	end # end of initialize()
	
	def length()
		return @length
	end
	
	def vis()
		return @vis
	end
	
	def getVis()
		@vis = ''
		bits = @map[3,@map.length - 3].codepoints
		(0..bits.length-1).each do |i|
			word = bits[i]
			word -= @@base;
			@vis += self.getVisFromWord( word )
			@vis = @vis[0, @length]
		end
	end
	
	def getVisFromWord( word )
		v = ''
		@@vismap_powers.each do |p|
			v += ( p & word ) > 0 ? 'V' : 'I'
		end
		return v
	end
	
	def getLength()
		@length = 64 * 64 * ( @map[0].codepoints[0] - @@base )
		@length += 64 * ( @map[1].codepoints[0] - @@base )
		@length += @map[2].codepoints[0] - @@base;
	end
	
end # of class Bitmap

def self.check( len )
	nlrs = $vismap_model.layers().length
	nsns = $vismap_model.scenes().count 
	ok = ( len == (nlrs * nsns) )
	
	UI::messagebox(
		"Wrong number of layers and/or scenes \n" +
		"Click \"Get Data\" and try again." ) if ( !ok ) 
			
	return ok
end

def self.launchWebDialogs

	$vismap_wd_main = UI::WebDialog.new( "Layer/Scene Visibility Map v2", true, 
			'vismap2_v1.0', 650, 500, 0, 0, true )
			
    $vismap_wd_main.add_action_callback( "refresh" ) do |js_wd, msg|
		reloadModel()
    	json = $vismap_model.getJson()
    	script = 'rubyReturned( "' + json + '" );'
		# puts; puts script
    	$vismap_wd_main.execute_script( script )
        
        json = $vismap_model.scene_json
        script = 'rubyReturned( "' + json + '");'
		# puts; puts script
        $wd_scenes.execute_script( script )

    end # add_action_callback()
	
    $vismap_wd_main.add_action_callback( "newVis" ) do |js_wd, msg|

		reloadModel()
		
		unless msg.nil?() 
			map = Bitmap.new( msg )
			$vismap_model.setVisibles( map.vis ) if 
				Vismap.check( map.length() ) 
		end
				
	end # of newVis()
	
	$vismap_wd_main.set_on_close { $wd_scenes.close() } 
	
	pathname = 
		Sketchup.find_support_file( 'vismap2.html', 'Plugins/vismap2/' )
    $vismap_wd_main.set_file( pathname  )
	
    $vismap_wd_main.show()
	
	launchSceneWebDialog()
	
end # launchWebDialogs()

def self.launchSceneWebDialog()

	$wd_scenes = UI::WebDialog.new( "Scene List, VisMap v2", true,
		'vismap2_scenes_v1.0', 250, 500, 650, 0, true )
		
	pathname = Sketchup.find_support_file( 'vismap2_scene_list.html',
		'Plugins/vismap2' )
	$wd_scenes.set_file( pathname )
	
	$wd_scenes.show()
	
end # launchSceneWebDialog()

def self.reloadModel()
	$vismap_model = Vismap_Model.new
end

# true if any member of array matches item
def self.is_in( item, array )
	return self.locate( item, array ) > -1
end

# index of item in array (-1 == not found)
def self.locate( item, array )
	i = 0
	array.each do |a|
		return i if (a == item)
		i += 1
	end
	return -1
end

# convert array of names to JSON array
def self.namesJson( names )

	ret = '[ '
	start = true
	names.each do |n|
		unless start
			ret += ', '
		else
			start = false
		end
		ret += quote( n )	
	end
	ret += ' ]'
	return ret

end # namesJson()

# convert name (which may contain embedded quotes) to name in quotes
def self.quote( name )
	name.gsub!( '"', '\"' )
	name.gsub!( "'", "\'" )
	return "'" + name + "'"
end

def self.toggle_dialogs()
	if $vismap_wd_main && $vismap_wd_main.visible?
		$vismap_wd_main.close()
	else
		launchWebDialogs()
	end
end

end # module Vismap

# end of Plugins/vismap2/vismap2.rb