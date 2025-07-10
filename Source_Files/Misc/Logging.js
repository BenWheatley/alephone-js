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

const LogLevel = Object.freeze({
	logFatalLevel: 0,     // program must exit
	logErrorLevel: 10,    // can't do something significant
	logWarningLevel: 20,  // can continue but results could be really screwy
	logAnomalyLevel: 30,  // can continue, results could be off a little, but no big deal
	logNoteLevel: 40,     // something worth mentioning
	logSummaryLevel: 45,  // occasional dumps of aggregate statistics
	logTraceLevel: 50,    // details of actions and logic
	logDumpLevel: 60      // values of data etc.
});

// JS conversion note: change of syntax from GetCurrentLogger().foo() to Logging.foo()

let loggingThreshhold = LogLevel.logNoteLevel; // log messages at or above this level will be squelched // TODO: fix mis-spelling once the app actually works

let logDomain = "global"; // TODO: delete after conversion complete — there is only one domain

function logMessage(domain, level, file, line, message, ...args) {
	// TODO: rm `domain`, `file`, `line` as not sensible in JS land, but only after app actually runs
	if (level < loggingThreshhold) {
		let formattedMessage = formatString(message, args);
		console.log(formattedMessage, args); // We don't *actually need* a real formatter for this, it's debug info, it doesn't need to be pretty
    }
}

void reset_mml_logging()
{
	console.log("reset_mml_logging called but stubbed out"); // TODO: only used by XML parser, so should be deleted eventually
}

function parse_mml_logging()
{
	console.log("parse_mml_logging called but stubbed out — should be deleted once app is running"); // TODO: only used by XML parser, so should be deleted eventually
}
