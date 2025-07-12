/*
	Copyright (C) 1991-2001 and beyond by Bo Lindbergh
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

// Need this here
#include "cstypes.h"

export const PIXEL8_MAXIMUM_COLORS = 256;
export const PIXEL16_MAXIMUM_COMPONENT = 31;
export const PIXEL32_MAXIMUM_COMPONENT = 255;
export const NUMBER_OF_COLOR_COMPONENTS = 3;

/*
	note that the combiner macros expect input values in the range
		0x0000 through 0xFFFF
	while the extractor macros return output values in the ranges
		0x00 through 0x1F (in the 16-bit case)
		0x00 through 0xFF (in the 32-bit case)
 */
 
function RGBCOLOR_TO_PIXEL16(r, g, b) {
	return ((r >> 1) & 0x7C00) | ((g >> 6) & 0x03E0) | ((b >> 11) & 0x001F);
}

function RED16(p) {
    return (p >> 10) & 0x1F;
}

function GREEN16(p) {
    return (p >> 5) & 0x1F;
}

function BLUE16(p) {
    return p & 0x1F;
}

function RGBCOLOR_TO_PIXEL32(r, g, b) {
    return ((r << 8) & 0x00FF0000) | ((g) & 0x00000FF00) | ((b >> 8) & 0x000000FF);
}

function RED32(p) {
    return (p >> 16) & 0xFF;
}

function GREEN32(p) {
    return (p >> 8) & 0xFF;
}

function BLUE32(p) {
    return p & 0xFF;
}
