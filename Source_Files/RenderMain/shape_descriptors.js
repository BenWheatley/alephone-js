/*
SHAPE_DESCRIPTORS.H

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

// shape_descriptor is 16 bits: [clut.3] [collection.5] [shape.8]

const DESCRIPTOR_SHAPE_BITS = 8;
const DESCRIPTOR_COLLECTION_BITS = 5;
const DESCRIPTOR_CLUT_BITS = 3;

const MAXIMUM_COLLECTIONS = 1 << DESCRIPTOR_COLLECTION_BITS;
const MAXIMUM_SHAPES_PER_COLLECTION = 1 << DESCRIPTOR_SHAPE_BITS;
const MAXIMUM_CLUTS_PER_COLLECTION = 1 << DESCRIPTOR_CLUT_BITS;

const Collections = Object.freeze({
	_collection_interface: 0, // 0
	_collection_weapons_in_hand: 1,
	_collection_juggernaut: 2,
	_collection_tick: 3,
	_collection_rocket: 4, // Explosion Effects
	_collection_hunter: 5,
	_collection_player: 6,
	_collection_items: 7,
	_collection_trooper: 8,
	_collection_fighter: 9,
	_collection_defender: 10,
	_collection_yeti: 11,
	_collection_civilian: 12,
	_collection_civilian_fusion: 13, // formerly _collection_madd
	_collection_enforcer: 14,
	_collection_hummer: 15,
	_collection_compiler: 16,
	_collection_walls1: 17,  // Lh'owon water
	_collection_walls2: 18,  // Lh'owon lava
	_collection_walls3: 19,  // Lh'owon sewage
	_collection_walls4: 20,  // Jjaro
	_collection_walls5: 21,  // Pfhor
	_collection_scenery1: 22,  // Lh'owon water
	_collection_scenery2: 23,  // Lh'owon lava
	_collection_scenery3: 24,  // Lh'owon sewage
	_collection_scenery4: 25,  // Jjaro pathways
	_collection_scenery5: 26,  // Pfhor alien
	_collection_landscape1: 27, // Lh'owon day
	_collection_landscape2: 28, // Lh'owon night
	_collection_landscape3: 29, // Lh'owon moon
	_collection_landscape4: 30, // outer space
	_collection_cyborg: 31,

	NUMBER_OF_COLLECTIONS: 32
});

/* ---------- macros */

const GET_DESCRIPTOR_SHAPE = (d) => (d & (MAXIMUM_SHAPES_PER_COLLECTION - 1));
const GET_DESCRIPTOR_COLLECTION = (d) =>
	((d >> DESCRIPTOR_SHAPE_BITS) & ((1 << (DESCRIPTOR_COLLECTION_BITS + DESCRIPTOR_CLUT_BITS)) - 1));
const BUILD_DESCRIPTOR = (collection, shape) => ((collection << DESCRIPTOR_SHAPE_BITS) | shape);
const BUILD_COLLECTION = (collection, clut) => (collection | (clut << DESCRIPTOR_COLLECTION_BITS));
const GET_COLLECTION_CLUT = (collection) => ((collection >> DESCRIPTOR_COLLECTION_BITS) & (MAXIMUM_CLUTS_PER_COLLECTION - 1));
const GET_COLLECTION = (collection) => (collection & (MAXIMUM_COLLECTIONS - 1));
