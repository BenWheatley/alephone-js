// This one file was written by Ben, not AI, examining main.cpp and replacing it with what seems to makes sense for a JS webapp (i.e. it's not starting off by loading any files)

import * as shell from './shell.js';

function main() {
	console.log(
		"Original code by Bungie Software <http://www.bungie.com/>\n" +
		"Additional work by Loren Petrich, Chris Pruett, Rhys Hill et al.\n" +
		"TCP/IP networking by Woody Zenfell\n" +
		"SDL port by Christian Bauer <Christian.Bauer@uni-mainz.de>\n" +
		"Mac OS X/SDL version by Chris Lovell, Alexander Strange, and Woody Zenfell\n" +
		"JS rewrite, Ben Wheatley\n" +
		"\nThis is free software with ABSOLUTELY NO WARRANTY.\n" +
		"You are welcome to redistribute it under certain conditions.\n" +
		"For details, see the file COPYING.\n"
	);
	shell.initialize_application();
	shell.main_event_loop();
}
