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

export function FLOOR(value, floor) {
    return Math.max(value, floor);
}

export function CEILING(value, ceiling) {
    return Math.min(value, ceiling);
}

export function M2_PIN(value, floor, ceiling) {
    return (value < floor) ? floor : (value > ceiling) ? ceiling : value;
}

export function A1_PIN(value, floor, ceiling) {
    return CEILING(FLOOR(value, floor), ceiling);
}

export function PIN(value, floor, ceiling) {
    return (film_profile.inexplicable_pin_change) ? A1_PIN(value, floor, ceiling) : M2_PIN(value, floor, ceiling);
}

export function SGN(x) {
    return (x < 0) ? -1 : (x > 0) ? 1 : 0;
}

export function FLAG(bit) {
    return 1 << bit;
}

export function TEST_FLAG32(flags, bit) {
    return (flags & FLAG(bit)) !== 0;
}

// TODO: I think all the things using this are themselves unused, but I'm not sure yet. Look again once it runs.
export function SET_FLAG32(flags, bit, value) {
    if (value) {
        flags |= FLAG(bit);
    } else {
        flags &= ~FLAG(bit);
    }
    return flags;
}

export function FLAG16(bit) {
    return 1 << bit;
}

export function TEST_FLAG16(flags, bit) {
    return (flags & FLAG16(bit)) !== 0;
}

// TODO: I think all the things using this are themselves unused, but I'm not sure yet. Look again once it runs.
function SET_FLAG16(flags, bit, value) {
    if (value) {
        flags |= FLAG16(bit);
    } else {
        flags &= ~FLAG16(bit);
    }
    return flags;
}

export function TEST_FLAG(obj, flag) {
    return obj & flag;
}

export function SET_FLAG(obj, flag, value) {
    if (value) {
        obj |= flag;
    } else {
        obj &= ~flag;
    }
    return obj;
}

export function RECTANGLE_WIDTH(rectptr) {
    return rectptr.right - rectptr.left;
}

export function RECTANGLE_HEIGHT(rectptr) {
    return rectptr.bottom - rectptr.top;
}

export function NextPowerOfTwo(n) {
    let p = 1;
    while (p < n) {
        p <<= 1;
    }
    return p;
}
