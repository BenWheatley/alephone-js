/*  Copyright (C) 1991-2001 and beyond by Bo Lindbergh
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

export const styleNormal = 0;
export const styleBold = 1;
export const styleItalic = 2;
export const styleUnderline = 4;
export const styleOutline = 8;
export const styleShadow = 16;

export class TextSpec {
  constructor(font, style, size, adjust_height, normal, oblique, bold, bold_oblique) {
    this.font = font; // int16, so I guess an ID of some kind?
    this.style = style;
    this.size = size;
    this.adjust_height = adjust_height;
    
    // TODO: originally paths to fonts, not sure what they'll be in JS land
    this.normal = normal;
    this.oblique = oblique;
    this.bold = bold;
    this.bold_oblique = bold_oblique;
  }
}
