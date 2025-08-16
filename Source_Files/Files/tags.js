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

	Sunday, July 3, 1994 5:33:15 PM

	This is a list of all of the tags used by code that uses the wad file format. 
	One tag, KEY_TAG, has special meaning, and KEY_TAG_SIZE must be set to the 
	size of an index entry.  Each wad can only have one index entry.  You can get the
	index entry from a wad, or from all of the wads in the file easily.
	
	Marathon uses the KEY_TAG as the name of the level.
*/

import { FOUR_CHARS_TO_INT, NONE } from '../CSeries/cstypes.js';

export const MAXIMUM_LEVEL_NAME_SIZE = 64;

export const Typecode = {
	_typecode_unknown: NONE,
	_typecode_creator: 0,
	_typecode_scenario: 1,
	_typecode_savegame: 2,
	_typecode_film: 3,
	_typecode_physics: 4,
	_typecode_shapes: 5,
	_typecode_sounds: 6,
	_typecode_patch: 7,
	_typecode_images: 8,
	_typecode_preferences: 9,
	_typecode_music: 10,
	_typecode_theme: 11,	// pseudo type code
	_typecode_netscript: 12,	// ZZZ pseudo typecode
	_typecode_shapespatch: 13,
	_typecode_movie: 14,
	_typecode_application: 15,
	NUMBER_OF_TYPECODES: 16
};

/* Other tags */
export const POINT_TAG = FOUR_CHARS_TO_INT('PNTS');
export const LINE_TAG = FOUR_CHARS_TO_INT('LINS');
export const SIDE_TAG = FOUR_CHARS_TO_INT('SIDS');
export const POLYGON_TAG = FOUR_CHARS_TO_INT('POLY');
export const LIGHTSOURCE_TAG = FOUR_CHARS_TO_INT('LITE');
export const ANNOTATION_TAG = FOUR_CHARS_TO_INT('NOTE');
export const OBJECT_TAG = FOUR_CHARS_TO_INT('OBJS');
export const GUARDPATH_TAG = FOUR_CHARS_TO_INT('p\x8cth');
export const MAP_INFO_TAG = FOUR_CHARS_TO_INT('Minf');
export const ITEM_PLACEMENT_STRUCTURE_TAG = FOUR_CHARS_TO_INT('plac');
export const DOOR_EXTRA_DATA_TAG = FOUR_CHARS_TO_INT('door');
export const PLATFORM_STATIC_DATA_TAG = FOUR_CHARS_TO_INT('plat');
export const ENDPOINT_DATA_TAG = FOUR_CHARS_TO_INT('EPNT');
export const MEDIA_TAG = FOUR_CHARS_TO_INT('medi');
export const AMBIENT_SOUND_TAG = FOUR_CHARS_TO_INT('ambi');
export const RANDOM_SOUND_TAG = FOUR_CHARS_TO_INT('bonk');
export const TERMINAL_DATA_TAG = FOUR_CHARS_TO_INT('term');

/* Save/Load game tags. */
export const PLAYER_STRUCTURE_TAG = FOUR_CHARS_TO_INT('plyr');
export const DYNAMIC_STRUCTURE_TAG = FOUR_CHARS_TO_INT('dwol');
export const OBJECT_STRUCTURE_TAG = FOUR_CHARS_TO_INT('mobj');
export const DOOR_STRUCTURE_TAG = FOUR_CHARS_TO_INT('door');
export const MAP_INDEXES_TAG = FOUR_CHARS_TO_INT('iidx');
export const AUTOMAP_LINES = FOUR_CHARS_TO_INT('alin');
export const AUTOMAP_POLYGONS = FOUR_CHARS_TO_INT('apol');
export const MONSTERS_STRUCTURE_TAG = FOUR_CHARS_TO_INT('mOns');
export const EFFECTS_STRUCTURE_TAG = FOUR_CHARS_TO_INT('fx  ');
export const PROJECTILES_STRUCTURE_TAG = FOUR_CHARS_TO_INT('bang');
export const PLATFORM_STRUCTURE_TAG = FOUR_CHARS_TO_INT('PLAT');
export const WEAPON_STATE_TAG = FOUR_CHARS_TO_INT('weap');
export const TERMINAL_STATE_TAG = FOUR_CHARS_TO_INT('cint');
export const LUA_STATE_TAG = FOUR_CHARS_TO_INT('slua');

/* Save metadata tags */
export const SAVE_META_TAG = FOUR_CHARS_TO_INT('SMET');
export const SAVE_IMG_TAG = FOUR_CHARS_TO_INT('SIMG');

/* Physix model tags */
export const MONSTER_PHYSICS_TAG = FOUR_CHARS_TO_INT('MNpx');
export const EFFECTS_PHYSICS_TAG = FOUR_CHARS_TO_INT('FXpx');
export const PROJECTILE_PHYSICS_TAG = FOUR_CHARS_TO_INT('PRpx');
export const PHYSICS_PHYSICS_TAG = FOUR_CHARS_TO_INT('PXpx');
export const WEAPONS_PHYSICS_TAG = FOUR_CHARS_TO_INT('WPpx');

export const M1_MONSTER_PHYSICS_TAG = FOUR_CHARS_TO_INT('mons');
export const M1_EFFECTS_PHYSICS_TAG = FOUR_CHARS_TO_INT('effe');
export const M1_PROJECTILE_PHYSICS_TAG = FOUR_CHARS_TO_INT('proj');
export const M1_PHYSICS_PHYSICS_TAG = FOUR_CHARS_TO_INT('phys');
export const M1_WEAPONS_PHYSICS_TAG = FOUR_CHARS_TO_INT('weap');

/* Embedded shapes */
export const SHAPE_PATCH_TAG = FOUR_CHARS_TO_INT('ShPa');

/* Embedded scripts */
export const MMLS_TAG = FOUR_CHARS_TO_INT('MMLS');
export const LUAS_TAG = FOUR_CHARS_TO_INT('LUAS');

/* Preferences Tags */
export const prefGRAPHICS_TAG = FOUR_CHARS_TO_INT('graf');
export const prefSERIAL_TAG = FOUR_CHARS_TO_INT('serl');
export const prefNETWORK_TAG = FOUR_CHARS_TO_INT('netw');
export const prefPLAYER_TAG = FOUR_CHARS_TO_INT('plyr');
export const prefINPUT_TAG = FOUR_CHARS_TO_INT('inpu');
export const prefSOUND_TAG = FOUR_CHARS_TO_INT('snd ');
export const prefENVIRONMENT_TAG = FOUR_CHARS_TO_INT('envr');
