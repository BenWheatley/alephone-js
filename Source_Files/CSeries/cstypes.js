/* Copyright (C) 1991-2001 and beyond by Bo Lindbergh
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

export const NONE = -1;
export const UNONE = 65535;

// Minimum and maximum values for these types
export const INT16_MAX = 32767;
export const UINT16_MAX = 65535;
export const INT16_MIN = (-INT16_MAX-1);
export const INT32_MAX = 2147483647;
export const INT32_MIN = (-INT32_MAX-1);

/* TODO: any references to "_fixed;" are a fixed point (16.16) type; not sure how to handle in JS at the moment
#define FIXED_FRACTIONAL_BITS 16
#define INTEGER_TO_FIXED(i) ((_fixed)(i)<<FIXED_FRACTIONAL_BITS)
#define FIXED_INTEGERAL_PART(f) ((f)>>FIXED_FRACTIONAL_BITS)
*/

// Binary powers
export const MEG = 0x100000;
export const KILO = 0x400;

// Construct four-character-code
/*#define FOUR_CHARS_TO_INT(a,b,c,d) (((uint32)(a) << 24) | ((uint32)(b) << 16) | ((uint32)(c) << 8) | (uint32)(d))*/
