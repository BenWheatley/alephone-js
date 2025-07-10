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

#include "cseries.h"
#include "shell.h"
#include "InfoTree.h"

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

function logMessage(const char* inDomain, int inLevel, const char* inFile, int inLine, const char* inMessage, ...) {
    va_list theVarArgs;
    va_start(theVarArgs, inMessage);
    logMessageV(inDomain, inLevel, inFile, inLine, inMessage, theVarArgs);
    va_end(theVarArgs);
}

function logMessageNMT(const char* inDomain, int inLevel, const char* inFile, int inLine, const char* inMessage, ...) {
	va_list theVarArgs;
	va_start(theVarArgs, inMessage);
	logMessageV(inDomain, inLevel, inFile, inLine, inMessage, theVarArgs);
	va_end(theVarArgs);
}

// domains are currently unused; idea is that eventually different logs can be routed to different
// files, different domains can have different levels of detail, etc.
// Something like network.h would declare extern const char* NetworkLoggingDomain;, and some
// .cpp would (obviously) provide it - then files that want to log in that domain would put
// static const char* logDomain = NetworkLoggingDomain; so that all logging calls (via the macros)
// would end up in the Network logging domain instead of the Global domain.  (Also this way creates
// an identifier that the compiler can spell-check etc., which you wouldn't get with
// static const char* logDomain = "Network"; or the like.
void
TopLevelLogger::logMessageV(const char* inDomain, int inLevel, const char* inFile, int inLine, const char* inMessage, va_list inArgs) {
    // Obviously eventually this will be settable more dynamically...
    // Also eventually some logged messages could be posted in a dialog in addition to appended to the file.
    if(sOutputFile != NULL && inLevel < loggingThreshhold) {
        char	stringBuffer[kStringBufferSize];
        auto& log_data = getLogData();

        size_t firstDepthToPrint = log_data.mMostRecentCommonStackDepth;
    /*
        // This was designed to give a little context when coming back from deep stacks, but it seems
        // rather annoying to me in practice.  (Maybe should be set to only kick in for bigger stack depth differences,
        // or after a certain number of entries at deeper depths, etc.)
        if(mMostRecentlyPrintedStackDepth != mMostRecentCommonStackDepth && firstDepthToPrint > 0)
            firstDepthToPrint--;
    */
        for(size_t depth = firstDepthToPrint; depth < log_data.mContextStack.size(); depth++) {
            string	theString(depth * 2, ' ');
    
            theString += "while ";
            theString += log_data.mContextStack[depth];
            
            fprintf(sOutputFile, "%s\n", theString.c_str());
			fprintf(stderr, "%s\n", theString.c_str());
        }
        
        vsnprintf(stringBuffer, kStringBufferSize, inMessage, inArgs);
    
        string	theString(log_data.mContextStack.size() * 2, ' ');
        
        theString += stringBuffer;
        
		theString += "\n";
        
        fprintf(sOutputFile, "%s", theString.c_str());
		fprintf(stderr, "%s", theString.c_str());
                
        log_data.mMostRecentCommonStackDepth = log_data.mContextStack.size();
        log_data.mMostRecentlyPrintedStackDepth = log_data.mContextStack.size();
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
