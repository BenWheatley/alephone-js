/*

	Copyright (C) 1991-2001 and beyond by Bungie Studios, Inc.
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

	Text-String Collection
	by Loren Petrich,
	April 20, 2000
	
	This is the implementation of my replacement for MacOS STR# resources
*/

import * as Logging from '../Misc/Logging.js';

const StringSetRoot = new Map(); // {int: {int: string}}

// Set up a string in the repository; a repeated call will replace an old string
function TS_PutCString(ID, Index, String) {
	if (Index >= 0) {
		if (!StringSetRoot.has(ID)) {
			StringSetRoot.set(ID, new Map());
		}
		StringSetRoot.get(ID).set(Index, String);
	}
}

// Returns a pointer to a string; if the ID and the index do not point to a valid string,  this function will then return null
function TS_GetCString(ID, Index) {
	const set = StringSetRoot.get(ID);
	if (!set) return null;
	return set.get(Index) || null;
}

// Checks on the presence of a string set
function TS_IsPresent(ID) {
	return StringSetRoot.has(ID);
}

// Count the strings (contiguous from index zero)
// TODO: refactor this away, it ought to be redundant in JS-land. Actually, the entire concept of a string set is redundant…
function TS_CountStrings(ID) {
	const set = StringSetRoot.get(ID);
	if (!set) return 0;
	return set.size;
}

// Deletes a string, should one ever want to do that
function TS_DeleteString(ID, Index) {
	const set = StringSetRoot.get(ID);
	if (set) {
		set.delete(Index);
	}
}

// Deletes the stringset with some ID
function TS_DeleteStringSet(ID) {
	StringSetRoot.delete(ID);
}

// Deletes all of the stringsets
function TS_DeleteAllStrings() {
	StringSetRoot.clear();
}

function reset_mml_stringset() {
	// no reset
}

void parse_mml_stringset(const InfoTree& root)
{
	Logging.logMessage(Logging.Level.error, 0, 0, "parse_mml_stringset is stupid but was called anyway. I suggest replacing this whole thing with a more sensible JSON thing once the app actually runs.");
}

// Write output as a C string;
// Returns how many characters resulted.
// Needs at least (OutMaxLen + 1) characters allocated.

size_t DeUTF8_C(const char *InString, size_t InLen, char *OutString, size_t OutMaxLen)
{
	size_t Len = DeUTF8(InString,InLen,OutString,OutMaxLen);
	OutString[Len] = 0;
	return Len;
}
