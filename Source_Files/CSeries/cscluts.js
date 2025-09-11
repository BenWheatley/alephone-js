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

export class rgb_color {
  constructor(r, g, b) {
    // NOTE: C++ version used uint16, JS will use bytes, so if everything's gone beyond white that's probably what caused it
    this.r = r;
    this.g = g;
    this.b = b;
  }
}

export class color_table {
  constructor(colorCount) {
    this.colorCount = colorCount;
    // 256 palette entries * 4 channels (RGBA)
    this.colors = new Uint8ClampedArray(256 * 4);
  }
  
  setColor(index, rgb, alpha = 255 /* original didn't have explicit alpha channel, but I probably want to */) {
    const base = i * 4;
    this.colors[base] = color.r & 0xFF;
    this.colors[base + 1] = color.g & 0xFF;
    this.colors[base + 2] = color.b & 0xFF;
    this.colors[base + 3] = alpha;
  }
  
  getColorBytes(index) {
    const base = index * 4;
    return this.colors.subarray(base, base + 4);
  }
}
