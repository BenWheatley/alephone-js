/*
 *  Logging.cpp - facilities for flexible logging

	Copyright (C) 2003 and beyond by Woody Zenfell, III
	and the "Aleph One" developers.
 
	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	This license is contained in the file "COPYING",
	which is included with this source code; it is available online at
	http://www.gnu.org/licenses/gpl.html


	Jan. 16, 2003 (Woody Zenfell): Created.

	May 21, 2003 (Woody Zenfell): being a little more defensive about NULL file pointer.
*/

export const Level = Object.freeze({
	fatal: 0,     // program must exit
	error: 10,    // can't do something significant
	warning: 20,  // can continue but results could be really screwy
	anomaly: 30,  // can continue, results could be off a little, but no big deal
	note: 40,     // something worth mentioning
	summary: 45,  // occasional dumps of aggregate statistics
	trace: 50,    // details of actions and logic
	dump: 60      // values of data etc.
});

// JS conversion note: change of syntax from GetCurrentLogger().foo() to Logging.foo()

export let loggingThreshhold = Level.note; // log messages at or above this level will be squelched // TODO: fix mis-spelling once the app actually works

export function logMessage(level, file, line, message, ...args) {
	// TODO: rm `file`, `line` as not sensible in JS land, but only after app actually runs
	if (level < loggingThreshhold) {
		console.log(message, args); // We don't *actually need* a real formatter for this, it's debug info, it doesn't need to be pretty
    }
}

export function reset_mml_logging()
{
	console.log("reset_mml_logging called but stubbed out"); // TODO: only used by XML parser, so should be deleted eventually
}

export function parse_mml_logging()
{
	console.log("parse_mml_logging called but stubbed out — should be deleted once app is running"); // TODO: only used by XML parser, so should be deleted eventually
}
