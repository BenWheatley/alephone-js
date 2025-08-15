/*	Copyright (C) 1991-2001 and beyond by Bungie Studios, Inc.
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

export const systemError = 0;
export const gameError = 1;
export const NUMBER_OF_TYPES = 2;

export const errNone = 0;
export const errMapFileNotSet = 1;
export const errIndexOutOfRange = 2;
export const errTooManyOpenFiles = 3;
export const errUnknownWadVersion = 4;
export const errWadIndexOutOfRange = 5;
export const errServerDied = 6;
export const errUnsyncOnLevelChange = 7;
export const NUMBER_OF_GAME_ERRORS = 8;

let last_type = systemError;
let last_error = 0;

export function set_game_error(type, error_code) {
	last_type = type;
	last_error = error_code;
}

export function get_game_error() {
	return {last_type, last_error};
}

export function error_pending() {
	return (last_error != 0);
}

export function clear_game_error() {
	last_error = 0;
	last_type = 0;
}
