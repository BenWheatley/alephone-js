/*  Copyright (C) 1991-2001 and beyond by Bungie Studios, Inc.
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

	Created for non-duplication of code between mac and SDL ports.
	(Loren Petrich and others)
*/

import { Music } from './Sound/Music.js';

let chat_input_mode = false;

// Called regularly during event loops
export function global_idle_proc() {
	Music.instance().Idle();
//	SoundManager::instance()->Idle(); TODO: replace this CPP line with JS when SoundManager has been converted
}
