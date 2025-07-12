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

export const MACHINE_TICKS_PER_SECOND = 1000;

let epoch = performance.now(); // initial reference time

/* a knob to play the game in "slow motion" to debug timing sensitive features.
   this is not a preferences option because of the cheating potential, and
   because of the awesome breakage that will occur at very large values */
const TIME_SKEW = 1;

export function machine_tick_count() {
	const now = performance.now(); // high-res time in milliseconds (float)

	if (now < epoch) {
		console.warn("Time went backwards!");
		epoch = now;
	}

	return Math.floor((now - epoch) / TIME_SKEW);
}
