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

*/

// TODO: I think "config.h" is auto-generated, but that's *probably* not what I want when this webapp is working right. While I figure that out, here's the single thing it was including in this file:
const VERSION = "JS-2025-07-12";

const ALEPHONE_LITTLE_ENDIAN = 1; // TODO: this is only used for #ifdef's etc, so refactor out of existence once app actually runs

function PlatformIsLittleEndian() {
	return true;
}
/*
 *  Emulation of MacOS data types and definitions
 */
/* TODO: I'm not sure how to handle these yet, all I know is they need to be endian-aware
#if defined(__APPLE__) && defined(__MACH__)
#else
struct Rect {
	int16 top, left;
	int16 bottom, right;
};

const int noErr = 0;
#endif

constexpr Rect MakeRect(int16 top, int16 left, int16 bottom, int16 right)
	{ return {top, left, bottom, right}; }

constexpr Rect MakeRect(SDL_Rect r)
	{ return {int16(r.y), int16(r.x), int16(r.y + r.h), int16(r.x + r.w)}; }

struct RGBColor {
	uint16 red, green, blue;
};
*/
const kFontIDMonaco = 4;
const kFontIDCourier = 22;

/*
TODO: replace each of these #'s with corresponding JS version below, as files become available:

#include "cscluts.h"
#include "csdialogs.h"
#include "cspaths.h"

export * from './cscluts.js';
export * from './csdialogs.js';
export * from './cspaths.js';*/

export * from './cstypes.js';
export * from './csfonts.js';
export * from './csstrings.js';
export * from './csmacros.js';
export * from './cspixels.js';
export * from './csalerts.js';
export * from './csmisc.js';
