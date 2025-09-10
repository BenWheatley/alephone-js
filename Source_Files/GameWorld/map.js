/*
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

/*
#include "csmacros.h"
#include "world.h"
#include "dynamic_limits.h"

using std::vector;

// ---------- constants
*/
export const TICKS_PER_SECOND = 30;
const TICKS_PER_MINUTE = (60 * TICKS_PER_SECOND);

const MAP_INDEX_BUFFER_SIZE = 8192;
/* TODO: WORLD_ONE is defined in world.h which I've not yet converted to js
const MINIMUM_SEPARATION_FROM_WALL = (WORLD_ONE / 4);
const MINIMUM_SEPARATION_FROM_PROJECTILE = ((3 * WORLD_ONE) / 4);
*/
const TELEPORTING_MIDPOINT = (TICKS_PER_SECOND / 2);
const TELEPORTING_DURATION = (2 * TELEPORTING_MIDPOINT);

// These arrays are the absolute limits, and are used only by the small memory allocating
//  arrays. 
const MAXIMUM_LEVELS_PER_MAP = 128;

const LEVEL_NAME_LENGTH = (64 + 2);

import * as shape_descriptors from '../RenderMain/shape_descriptors.js';

/*
enum // damage types
{
	_damage_explosion,
	_damage_electrical_staff,
	_damage_projectile,
	_damage_absorbed,
	_damage_flame,
	_damage_hound_claws,
	_damage_alien_projectile,
	_damage_hulk_slap,
	_damage_compiler_bolt,
	_damage_fusion_bolt,
	_damage_hunter_bolt,
	_damage_fist,
	_damage_teleporter,
	_damage_defender,
	_damage_yeti_claws,
	_damage_yeti_projectile,
	_damage_crushing,
	_damage_lava,
	_damage_suffocation,
	_damage_goo,
	_damage_energy_drain,
	_damage_oxygen_drain,
	_damage_hummer_bolt,
	_damage_shotgun_projectile,
	NUMBER_OF_DAMAGE_TYPES
};

enum // damage flags
{
	_alien_damage= 0x1 // will be decreased at lower difficulty levels
};

struct damage_definition
{
	int16 type, flags;
	
	int16 base, random;
	_fixed scale;
};
const int SIZEOF_damage_definition = 12;

// ---------- saved objects (initial map locations, etc.)

// #define MAXIMUM_SAVED_OBJECTS 384

enum // map object types
{
	_saved_monster,	// .index is monster type
	_saved_object,	// .index is scenery type
	_saved_item,	// .index is item type
	_saved_player,	// .index is team bitfield
	_saved_goal,	// .index is goal number
	_saved_sound_source // .index is source type, .facing is sound volume
};

enum // map object flags
{
	_map_object_is_invisible= 0x0001, // initially invisible
	_map_object_is_platform_sound= 0x0001,
	_map_object_hanging_from_ceiling= 0x0002, // used for calculating absolute .z coordinate
	_map_object_is_blind= 0x0004, // monster cannot activate by sight
	_map_object_is_deaf= 0x0008, // monster cannot activate by sound
	_map_object_floats= 0x0010, // used by sound sources caused by media
	_map_object_is_network_only= 0x0020 // for items only
	
	// top four bits is activation bias for monsters
};

#define DECODE_ACTIVATION_BIAS(f) ((f)>>12)
#define ENCODE_ACTIVATION_BIAS(b) ((b)<<12)

struct map_object // 16 bytes
{
	int16 type; // _saved_monster, _saved_object, _saved_item, ...
	int16 index;
	int16 facing;
	int16 polygon_index;
	world_point3d location; // .z is a delta
	
	uint16 flags;
};
const int SIZEOF_map_object = 16;

// Due to misalignments, these have different sizes
typedef world_point2d saved_map_pt;
typedef struct line_data saved_line;
typedef struct polygon_data saved_poly;
typedef struct map_annotation saved_annotation;
typedef struct map_object saved_object;
typedef struct static_data saved_map_data;

// ---------- map loading/new game structures

enum { // entry point types- this is per map level (int32).
	_single_player_entry_point= 0x01,
	_multiplayer_cooperative_entry_point= 0x02,
	_multiplayer_carnage_entry_point= 0x04,
	_kill_the_man_with_the_ball_entry_point = 0x08, // was _capture_the_flag_entry_point, even though Bungie used it for KTMWTB
	_king_of_hill_entry_point= 0x10,
	_defense_entry_point= 0x20,
	_rugby_entry_point= 0x40,
	_capture_the_flag_entry_point = 0x80
};

struct entry_point 
{
	int16 level_number;
	char level_name[64+2];
};

#define MAXIMUM_PLAYER_START_NAME_LENGTH 32

struct player_start_data 
{
	int16 team;
	int16 identifier; // [weapon_switch_flag.1] [UNUSED.1] [identifier.14]
	int16 color;
	char name[MAXIMUM_PLAYER_START_NAME_LENGTH+1]; // PLAYER_NAME_LENGTH+1
};

enum {
	_player_start_doesnt_auto_switch_weapons_flag= 0x8000
};

const uint16 player_start_identifier_mask = (1<<14) - 1;

int16 player_identifier_value(int16 identifier);
int16 player_start_identifier_value(const player_start_data * const p);
bool player_identifier_doesnt_auto_switch_weapons(int16 identifier);
bool player_start_doesnt_auto_switch_Weapons(const player_start_data * const p);
void set_player_start_doesnt_auto_switch_weapons_status(player_start_data * const p, bool v);

// inline definitions for relevant player_start_data flags
inline int16 player_identifier_value(int16 identifier)
{ return identifier & player_start_identifier_mask; }

inline int16 player_start_identifier_value(const player_start_data * const p)
{ return (p)->identifier & player_start_identifier_mask; }

inline bool player_identifier_doesnt_auto_switch_weapons(int16 identifier)
{ return TEST_FLAG(identifier, _player_start_doesnt_auto_switch_weapons_flag); }

inline bool player_start_doesnt_auto_switch_Weapons(const player_start_data * const p)
{ return TEST_FLAG(p->identifier, _player_start_doesnt_auto_switch_weapons_flag); }

inline void set_player_start_doesnt_auto_switch_weapons_status(player_start_data * const p, bool v)
{	SET_FLAG(p->identifier, _player_start_doesnt_auto_switch_weapons_flag, v); }
// end - inline definitions for relevant player_start_data flags

struct directory_data {
	int16 mission_flags;
	int16 environment_flags;
	int32 entry_point_flags;
	char level_name[LEVEL_NAME_LENGTH];
};
const int SIZEOF_directory_data = 74;

// ---------- map annotations

// #define MAXIMUM_ANNOTATIONS_PER_MAP 20
#define MAXIMUM_ANNOTATION_TEXT_LENGTH 64

struct map_annotation
{
	int16 type; // turns into color, font, size, style, etc...
	
	world_point2d location; // where to draw this (lower left)
	int16 polygon_index; // only displayed if this polygon is in the automap
	
	char text[MAXIMUM_ANNOTATION_TEXT_LENGTH];
};
const int SIZEOF_map_annotation = 72;

struct map_annotation *get_next_map_annotation(int16 *count);

// ---------- ambient sound images

// #define MAXIMUM_AMBIENT_SOUND_IMAGES_PER_MAP 64

// non-directional ambient component
struct ambient_sound_image_data // 16 bytes
{
	uint16 flags;
	
	int16 sound_index;
	int16 volume;

	int16 unused[5];
};
const int SIZEOF_ambient_sound_image_data = 16;

// ---------- random sound images

// #define MAXIMUM_RANDOM_SOUND_IMAGES_PER_MAP 64

enum // sound image flags
{
	_sound_image_is_non_directional= 0x0001 // ignore direction
};

// possibly directional random sound effects
struct random_sound_image_data // 32 bytes
{
	uint16 flags;
	
	int16 sound_index;
	
	int16 volume, delta_volume;
	int16 period, delta_period;
	angle direction, delta_direction;
	_fixed pitch, delta_pitch;
	
	// only used at run-time; initialize to NONE
	int16 phase;
	
	int16 unused[3];
};
const int SIZEOF_random_sound_image_data = 32;

// ---------- object structure
// LP change: made this settable from the resource fork
#define MAXIMUM_OBJECTS_PER_MAP (get_dynamic_limit(_dynamic_limit_objects))

// SLOT_IS_USED(), SLOT_IS_FREE(), MARK_SLOT_AS_FREE(), MARK_SLOT_AS_USED() macros are also used for monsters, effects and projectiles
#define SLOT_IS_USED(o) ((o)->flags&(uint16)0x8000)
#define SLOT_IS_FREE(o) (!SLOT_IS_USED(o))
#define MARK_SLOT_AS_FREE(o) ((o)->flags&=(uint16)~0xC000)
#define MARK_SLOT_AS_USED(o) ((o)->flags=((o)->flags|(uint16)0x8000)&(uint16)~0x4000)

#define OBJECT_WAS_RENDERED(o) ((o)->flags&(uint16)0x4000)
#define SET_OBJECT_RENDERED_FLAG(o) ((o)->flags|=(uint16)0x4000)
#define CLEAR_OBJECT_RENDERED_FLAG(o) ((o)->flags&=(uint16)~0x4000)

// this field is only valid after transmogrify_object_shape is called; in terms of our pipeline, that
//	means that it’s only valid if OBJECT_WAS_RENDERED returns true *and* was cleared before
//	the last call to render_scene() ... this means that if OBJECT_WAS_RENDERED returns false,
//	the monster and projectile managers will probably call transmogrif_object_shape themselves.
//	for reasons beyond this scope of this comment to explain, the keyframe cannot be frame zero!
//	also, when any of the flags below are set, the phase of the .sequence field can be examined
//	to determine exactly how many ticks the last frame took to animate (that is, .sequence.phase
//	is not reset until the next loop).
#define OBJECT_WAS_ANIMATED(o) ((o)->flags&(uint16)_obj_animated)
#define GET_OBJECT_ANIMATION_FLAGS(o) ((o)->flags&(uint16)0x3c00)
#define SET_OBJECT_ANIMATION_FLAGS(o,n) { (o)->flags&= (uint16)~0x3c00; (o)->flags|= (n); }
enum // object was animated flags
{
	_obj_not_animated= 0x0000, // nothing happened
	_obj_animated= 0x2000, // a new frame was reached
	_obj_keyframe_started= 0x1000, // the key-frame was reached
	_obj_last_frame_animated= 0x0800, // sequence complete, returning to first frame
	_obj_transfer_mode_finished= 0x0400 // transfer mode phase is about to loop
};

#define GET_OBJECT_SCALE_FLAGS(o) (((o)->flags)&OBJECT_SCALE_FLAGS_MASK)
enum // object scale flags
{
	_object_is_enlarged= 0x0200,
	_object_is_tiny= 0x0100,

	OBJECT_SCALE_FLAGS_MASK= _object_is_enlarged|_object_is_tiny
};

#define OBJECT_IS_MEDIA_EFFECT(o) ((o)->flags&128)
#define SET_OBJECT_IS_MEDIA_EFFECT(o) ((o)->flags|= 128)

// ignored by renderer if INVISIBLE
#define OBJECT_IS_INVISIBLE(o) ((o)->flags&(uint16)32)
#define OBJECT_IS_VISIBLE(o) (!OBJECT_IS_INVISIBLE(o))
#define SET_OBJECT_INVISIBILITY(o,v) ((void)((v)?((o)->flags|=(uint16)32):((o)->flags&=(uint16)~32)))

// call get_object_dimensions(object_index, &radius, &height) for SOLID objects to get their dimensions
#define OBJECT_IS_SOLID(o) ((o)->flags&(uint16)16)
#define SET_OBJECT_SOLIDITY(o,v) ((void)((v)?((o)->flags|=(uint16)16):((o)->flags&=(uint16)~16)))

#define GET_OBJECT_STATUS(o) ((o)->flags&(uint16)8)
#define SET_OBJECT_STATUS(o,v) ((v)?((o)->flags|=(uint16)8):((o)->flags&=(uint16)~8))
#define TOGGLE_OBJECT_STATUS(o) ((o)->flags^=(uint16)8)

#define GET_OBJECT_OWNER(o) ((o)->flags&(uint16)7)
#define SET_OBJECT_OWNER(o,n) { assert((n)>=0&&(n)<=7); (o)->flags&= (uint16)~7; (o)->flags|= (n); }
enum // object owners (8)
{
	_object_is_normal, // normal
	_object_is_scenery, // impassable scenery
	_object_is_monster, // monster index in .permutation
	_object_is_projectile, // active projectile index in .permutation
	_object_is_effect, // explosion or something; index in .permutation
	_object_is_item, // .permutation is item type
	_object_is_device, // status given by bit in flags field, device type in .permutation
	_object_is_garbage // will be removed by garbage collection algorithms
};

// because of sign problems, we must rip out the values before we modify them; frame is in [0,16), phase is in [0,4096) ... this is for shape animations
#define GET_SEQUENCE_FRAME(s) ((s)>>12)
#define GET_SEQUENCE_PHASE(s) ((s)&4095)
#define BUILD_SEQUENCE(f,p) (((f)<<12)|(p))

enum // object transfer modes (high-level)
{
	_xfer_normal,
	_xfer_fade_out_to_black, // reduce ambient light until black, then tint-fade out
	_xfer_invisibility,
	_xfer_subtle_invisibility,
	_xfer_pulsate, // only valid for polygons
	_xfer_wobble, // only valid for polygons
	_xfer_fast_wobble, // only valid for polygons
	_xfer_static,
	_xfer_50percent_static,
	_xfer_landscape,
	_xfer_smear, // repeat pixel(0,0) of texture everywhere
	_xfer_fade_out_static,
	_xfer_pulsating_static,
	_xfer_fold_in, // appear
	_xfer_fold_out, // disappear
	_xfer_horizontal_slide,
	_xfer_fast_horizontal_slide,
	_xfer_vertical_slide,
	_xfer_fast_vertical_slide,
	_xfer_wander,
	_xfer_fast_wander,
	_xfer_big_landscape,
	_xfer_reverse_horizontal_slide,
	_xfer_reverse_fast_horizontal_slide,
	_xfer_reverse_vertical_slide,
	_xfer_reverse_fast_vertical_slide,
	_xfer_2x,				  // scales texture by 2x
	_xfer_4x,				  // scales texture by 4x
	
	NUMBER_OF_TRANSFER_MODES
};

struct object_location
{
	struct world_point3d p;
	int16 polygon_index;
	
	angle yaw, pitch;
	
	uint16 flags;
};

struct object_data // 32 bytes
{
	// these fields are in the order of a world_location3d structure, but are missing the pitch and velocity fields
	world_point3d location;
	int16 polygon;

	angle facing;
	
	// this is not really a shape descriptor: (and this is the only place in the game where you
	//	find this pseudo-shape_descriptor type) the collection is valid, as usual, but the
	//	shape index is an index into the animated shape array for that collection.
	shape_descriptor shape;

	uint16 sequence; // for shape animation
	uint16 flags; // [used_slot.1] [rendered.1] [animated.4] [unused.4] [invisible.1] [solid.1] [status.1] [owner.3]
	int16 transfer_mode, transfer_period; // if NONE take from shape data
	int16 transfer_phase; // for transfer mode animations
	int16 permutation; // usually index into owner array
	
	int16 next_object; // or NONE
	int16 parasitic_object; // or NONE

	// used when playing sounds
	_fixed sound_pitch;
};
const int SIZEOF_object_data = 32;

// ------------ endpoint definition

#define ENDPOINT_IS_SOLID(e) ((e)->flags&1)
#define SET_ENDPOINT_SOLIDITY(e,s) ((s)?((e)->flags|=1):((e)->flags&=~(uint16)1))

#define ENDPOINT_IS_TRANSPARENT(e) ((e)->flags&4)
#define SET_ENDPOINT_TRANSPARENCY(e,s) ((s)?((e)->flags|=4):((e)->flags&=~(uint16)4))

// false if all polygons sharing this endpoint have the same height
#define ENDPOINT_IS_ELEVATION(e) ((e)->flags&2)
#define SET_ENDPOINT_ELEVATION(e,s) ((s)?((e)->flags|=2):((e)->flags&=~(uint16)2))

struct endpoint_data // 16 bytes
{
	uint16 flags;
	world_distance highest_adjacent_floor_height, lowest_adjacent_ceiling_height;
	
	world_point2d vertex;
	world_point2d transformed;
	
	int16 supporting_polygon_index;
};
const int SIZEOF_endpoint_data = 16;

// For loading plain points:
const int SIZEOF_world_point2d = 4;

// ------------ line definition

#define SOLID_LINE_BIT 0x4000
#define TRANSPARENT_LINE_BIT 0x2000
#define LANDSCAPE_LINE_BIT 0x1000
#define ELEVATION_LINE_BIT 0x800
#define VARIABLE_ELEVATION_LINE_BIT 0x400
#define LINE_HAS_TRANSPARENT_SIDE_BIT 0x200
#define LINE_IS_DECORATIVE_BIT 0x100

#define SET_LINE_SOLIDITY(l,v) ((v)?((l)->flags|=(uint16)SOLID_LINE_BIT):((l)->flags&=(uint16)~SOLID_LINE_BIT))
#define LINE_IS_SOLID(l) ((l)->flags&SOLID_LINE_BIT)

#define SET_LINE_TRANSPARENCY(l,v) ((v)?((l)->flags|=(uint16)TRANSPARENT_LINE_BIT):((l)->flags&=(uint16)~TRANSPARENT_LINE_BIT))
#define LINE_IS_TRANSPARENT(l) ((l)->flags&TRANSPARENT_LINE_BIT)

#define SET_LINE_LANDSCAPE_STATUS(l,v) ((v)?((l)->flags|=(uint16)LANDSCAPE_LINE_BIT):((l)->flags&=(uint16)~LANDSCAPE_LINE_BIT))
#define LINE_IS_LANDSCAPED(l) ((l)->flags&LANDSCAPE_LINE_BIT)

#define SET_LINE_ELEVATION(l,v) ((v)?((l)->flags|=(uint16)ELEVATION_LINE_BIT):((l)->flags&=(uint16)~ELEVATION_LINE_BIT))
#define LINE_IS_ELEVATION(l) ((l)->flags&ELEVATION_LINE_BIT)

#define SET_LINE_VARIABLE_ELEVATION(l,v) ((v)?((l)->flags|=(uint16)VARIABLE_ELEVATION_LINE_BIT):((l)->flags&=(uint16)~VARIABLE_ELEVATION_LINE_BIT))
#define LINE_IS_VARIABLE_ELEVATION(l) ((l)->flags&VARIABLE_ELEVATION_LINE_BIT)

#define SET_LINE_HAS_TRANSPARENT_SIDE(l,v) ((v)?((l)->flags|=(uint16)LINE_HAS_TRANSPARENT_SIDE_BIT):((l)->flags&=(uint16)~LINE_HAS_TRANSPARENT_SIDE_BIT))
#define LINE_HAS_TRANSPARENT_SIDE(l) ((l)->flags&LINE_HAS_TRANSPARENT_SIDE_BIT)

struct line_data // 32 bytes
{
	int16 endpoint_indexes[2];
	uint16 flags; // no permutation field

	world_distance length;
	world_distance highest_adjacent_floor, lowest_adjacent_ceiling;
	
	// the side definition facing the clockwise polygon which references this side, and the side
	//	definition facing the counterclockwise polygon (can be NONE)
	int16 clockwise_polygon_side_index, counterclockwise_polygon_side_index;
	
	// a line can be owned by a clockwise polygon, a counterclockwise polygon, or both (but never two of the same) (can be NONE)
	int16 clockwise_polygon_owner, counterclockwise_polygon_owner;
	
	int16 unused[6];

	// decorative lines always pass projectiles through their transparent sides
	bool is_decorative() const {
		return flags & LINE_IS_DECORATIVE_BIT;
	}

	void set_decorative(bool b) {
		if (b) flags |= LINE_IS_DECORATIVE_BIT;
		else flags &= ~LINE_IS_DECORATIVE_BIT;
	}
};
const int SIZEOF_line_data = 32;

// --------------- side definition

enum // side flags
{
	_control_panel_status= 0x0001,
	_side_is_control_panel= 0x0002,
	_side_is_repair_switch= 0x0004, // must be toggled to exit level
	_side_is_destructive_switch= 0x0008, // uses an item
	_side_is_lighted_switch= 0x0010, // switch must be lighted to use
	_side_switch_can_be_destroyed= 0x0020, // projectile hits toggle and destroy this switch
	_side_switch_can_only_be_hit_by_projectiles= 0x0040,
	_side_item_is_optional= 0x0080, // in Marathon, switches still work without items
	_side_is_m1_lighted_switch = 0x0100, // in Marathon, lighted switches must be above 50% (unlike M2, 75%)

	_editor_dirty_bit= 0x4000, // used by the editor...
	_reserved_side_flag = 0x8000 // some maps written by an old map editor
								 // (Pfhorte?) set lots of side flags; use this
								 // to detect and correct
};

enum // control panel side types
{
	_panel_is_oxygen_refuel,
	_panel_is_shield_refuel,
	_panel_is_double_shield_refuel,
	_panel_is_triple_shield_refuel,
	_panel_is_light_switch, // light index in .permutation
	_panel_is_platform_switch, // platform index in .permutation
	_panel_is_tag_switch, // tag in .permutation (NONE is tagless)
	_panel_is_pattern_buffer,
	_panel_is_computer_terminal,
	NUMBER_OF_CONTROL_PANELS
};

#define SIDE_IS_CONTROL_PANEL(s) ((s)->flags & _side_is_control_panel)
#define SET_SIDE_CONTROL_PANEL(s, t) ((void)((t) ? (s->flags |= (uint16) _side_is_control_panel) : (s->flags &= (uint16)~_side_is_control_panel)))

#define GET_CONTROL_PANEL_STATUS(s) (((s)->flags & _control_panel_status) != 0)
#define SET_CONTROL_PANEL_STATUS(s, t) ((t) ? (s->flags |= (uint16) _control_panel_status) : (s->flags &= (uint16)~_control_panel_status))
#define TOGGLE_CONTROL_PANEL_STATUS(s) ((s)->flags ^= _control_panel_status)

#define SIDE_IS_REPAIR_SWITCH(s) ((s)->flags & _side_is_repair_switch)
#define SET_SIDE_IS_REPAIR_SWITCH(s, t) ((t) ? (s->flags |= (uint16) _side_is_repair_switch) : (s->flags &= (uint16)~_side_is_repair_switch))

// Flags used by Vulcan
#define SIDE_IS_DIRTY(s) ((s)->flags&_editor_dirty_bit)
#define SET_SIDE_IS_DIRTY(s, t) ((t)?(s->flags|=(uint16)_editor_dirty_bit):(s->flags&=(uint16)~_editor_dirty_bit))

enum // side types (largely redundant; most of this could be guessed for examining adjacent polygons)
{
	_full_side, // primary texture is mapped floor-to-ceiling
	_high_side, // primary texture is mapped on a panel coming down from the ceiling (implies 2 adjacent polygons)
	_low_side, // primary texture is mapped on a panel coming up from the floor (implies 2 adjacent polygons)
	_composite_side, // primary texture is mapped floor-to-ceiling, secondary texture is mapped into it (i.e., control panel)
	_split_side // primary texture is mapped onto a panel coming down from the ceiling, secondary texture is mapped on a panel coming up from the floor
};

struct side_texture_definition
{
	world_distance x0, y0;
	shape_descriptor texture;
};

struct side_exclusion_zone
{
	world_point2d e0, e1, e2, e3;
};

struct side_data // size platform-dependant
{
	int16 type;
	uint16 flags;
	
	struct side_texture_definition primary_texture;
	struct side_texture_definition secondary_texture;
	struct side_texture_definition transparent_texture; // not drawn if .texture==NONE

	// all sides have the potential of being impassable; the exclusion zone is the area near the side which cannot be walked through
	struct side_exclusion_zone exclusion_zone;

	int16 control_panel_type; // Only valid if side->flags & _side_is_control_panel
	int16 control_panel_permutation; // platform index, light source index, etc...
	
	int16 primary_transfer_mode; // These should be in the side_texture_definition..
	int16 secondary_transfer_mode;
	int16 transparent_transfer_mode;

	int16 polygon_index, line_index;

	int16 primary_lightsource_index;	
	int16 secondary_lightsource_index;
	int16 transparent_lightsource_index;

	int32 ambient_delta;

	int16 unused[1];
};
const int SIZEOF_side_data = 64;

// ----------- polygon definition

#define MAXIMUM_VERTICES_PER_POLYGON 8

// LP/AlexJLS change: added Marathon 1 polygon damage and glue stuff
enum // polygon types
{
	_polygon_is_normal,
	_polygon_is_item_impassable,
	_polygon_is_monster_impassable,
	_polygon_is_hill, // for king-of-the-hill
	_polygon_is_base, // for capture the flag, rugby, etc. (team in .permutation)
	_polygon_is_platform, // platform index in .permutation
	_polygon_is_light_on_trigger, // lightsource index in .permutation
	_polygon_is_platform_on_trigger, // polygon index in .permutation
	_polygon_is_light_off_trigger, // lightsource index in .permutation
	_polygon_is_platform_off_trigger, // polygon index in .permutation
	_polygon_is_teleporter, // .permutation is polygon_index of destination
	_polygon_is_zone_border,
	_polygon_is_goal,
	_polygon_is_visible_monster_trigger,
	_polygon_is_invisible_monster_trigger,
	_polygon_is_dual_monster_trigger,
	_polygon_is_item_trigger, // activates all items in this zone
	_polygon_must_be_explored,
	_polygon_is_automatic_exit, // if success conditions are met, causes automatic transport too next level
	_polygon_is_minor_ouch,
	_polygon_is_major_ouch,
	_polygon_is_glue,
	_polygon_is_glue_trigger,
	_polygon_is_superglue
};

#define POLYGON_IS_DETACHED_BIT 0x4000
#define POLYGON_IS_DETACHED(p) ((p)->flags&POLYGON_IS_DETACHED_BIT)
#define SET_POLYGON_DETACHED_STATE(p, v) ((v)?((p)->flags|=POLYGON_IS_DETACHED_BIT):((p)->flags&=~POLYGON_IS_DETACHED_BIT))

struct horizontal_surface_data // should be in polygon structure
{
	world_distance height;
	int16 lightsource_index;
	shape_descriptor texture;
	int16 transfer_mode, transfer_mode_data;
	
	world_point2d origin;
};

struct polygon_data // 128 bytes
{
	int16 type;
	uint16 flags;
	int16 permutation;

	uint16 vertex_count;
	int16 endpoint_indexes[MAXIMUM_VERTICES_PER_POLYGON]; // clockwise
	int16 line_indexes[MAXIMUM_VERTICES_PER_POLYGON];
	
	shape_descriptor floor_texture, ceiling_texture;
	world_distance floor_height, ceiling_height;
	int16 floor_lightsource_index, ceiling_lightsource_index;
	
	int32 area; // in world_distance^2 units
	
	int16 first_object;
	
	// precalculated impassability information; each polygon has a list of lines and points that anything big (i.e., monsters but not projectiles) inside it must check against when ending a move inside it.
	int16 first_exclusion_zone_index;
	int16 line_exclusion_zone_count;
	int16 point_exclusion_zone_count;

	int16 floor_transfer_mode;
	int16 ceiling_transfer_mode;
	
	int16 adjacent_polygon_indexes[MAXIMUM_VERTICES_PER_POLYGON];
	
	// a list of polygons within WORLD_ONE of us
	int16 first_neighbor_index;
	int16 neighbor_count;
	
	world_point2d center;
	
	int16 side_indexes[MAXIMUM_VERTICES_PER_POLYGON];
	
	world_point2d floor_origin, ceiling_origin;
	
	int16 media_index;
	int16 media_lightsource_index;
	
	// NONE terminated list of _saved_sound_source indexes which must be checked while a listener is inside this polygon (can be none)
	int16 sound_source_indexes;
	
	// either can be NONE
	int16 ambient_sound_image_index;
	int16 random_sound_image_index;
	
	int16 unused[1];
};
const int SIZEOF_polygon_data = 128;

// ----------- static light definition

struct saved_lighting_function_specification // 7*2 == 14 bytes
{
	int16 function;
	
	int16 period, delta_period;
	uint16 intensity_hi, intensity_lo, delta_intensity_hi, delta_intensity_lo;
};

struct saved_static_light_data // 8*2 + 6*14 == 100 bytes
{
	int16 type;
	uint16 flags;

	int16 phase; // initializer, so lights may start out-of-phase with each other
	
	struct saved_lighting_function_specification primary_active, secondary_active, becoming_active;
	struct saved_lighting_function_specification primary_inactive, secondary_inactive, becoming_inactive;
	
	int16 tag;
	
	int16 unused[4];
};
const int SIZEOF_saved_static_light_data = 100;

// ---------- random placement data structures..

enum // game difficulty levels
{
	_wuss_level,
	_easy_level,
	_normal_level,
	_major_damage_level,
	_total_carnage_level,
	NUMBER_OF_GAME_DIFFICULTY_LEVELS
};


enum // for difficulty level names (moved here so it is in a common header file)
{
	kDifficultyLevelsStringSetID	= 145
};

// ---------- new object frequency structures.

#define MAXIMUM_OBJECT_TYPES 64

enum // flags for object_frequency_definition
{
	_reappears_in_random_location= 0x0001
};

struct object_frequency_definition
{
	uint16 flags;
	
	int16 initial_count;   // number that initially appear. can be greater than maximum_count
	int16 minimum_count;   // this number of objects will be maintained.
	int16 maximum_count;   // can’t exceed this, except at the beginning of the level.
	
	int16 random_count;    // maximum random occurences of the object
	uint16 random_chance;    // in (0, 65535]
};
const int SIZEOF_object_frequency_definition = 12;

// ---------- map

enum // mission flags
{
	_mission_none= 0x0000,
	_mission_extermination= 0x0001,
	_mission_exploration= 0x0002,
	_mission_retrieval= 0x0004,
	_mission_repair= 0x0008,
	_mission_rescue= 0x0010,
	_mission_exploration_m1= 0x0020,
	_mission_rescue_m1= 0x0040,
	_mission_repair_m1= 0x0080
};

enum // environment flags
{
	_environment_normal= 0x0000,
	_environment_vacuum= 0x0001, // prevents certain weapons from working, player uses oxygen
	_environment_magnetic= 0x0002, // motion sensor works poorly
	_environment_rebellion= 0x0004, // makes clients fight pfhor
	_environment_low_gravity= 0x0008, // low gravity
	_environment_glue_m1= 0x0010, // handle glue polygons like Marathon 1
	_environment_ouch_m1= 0x0020, // the floor is lava
	_environment_rebellion_m1= 0x0040,  // use Marathon 1 rebellion (don't strip items/health)
	_environment_song_index_m1 = 0x0080, // play music
	_environment_terminals_stop_time = 0x0100, // solo only
	_environment_activation_ranges = 0x0200, // Marathon 1 monster activation limits
	_environment_m1_weapons = 0x0400,    // multiple weapon pickups on TC; low gravity grenades
        
	_environment_network= 0x2000,	// these two pseudo-environments are used to prevent items 
	_environment_single_player= 0x4000 // from arriving in the items.c code.
};

// current map number is in player->map
struct static_data
{
	int16 environment_code;
	
	int16 physics_model;
	int16 song_index;
	int16 mission_flags;
	int16 environment_flags;
	
	bool ball_in_play; // true if there's a ball in play
	bool unused1;
	int16 unused[3];

	char level_name[LEVEL_NAME_LENGTH];
	uint32 entry_point_flags;
};
const unsigned int SIZEOF_static_data = 88;

enum // game options..
{
	_multiplayer_game= 0x0001, // multi or single?
	_ammo_replenishes= 0x0002, // Does or doesn't
	_weapons_replenish= 0x0004, // Weapons replenish?
	_specials_replenish= 0x0008, // Invisibility, Ammo?
	_monsters_replenish= 0x0010, // Monsters are lazarus..
	_motion_sensor_does_not_work= 0x00020, // Motion sensor works
	_overhead_map_is_omniscient=  0x0040, // Only show teammates on overhead map
	_burn_items_on_death= 0x0080, // When you die, you lose everything but the initial crap..
	_live_network_stats= 0x0100,
	_game_has_kill_limit= 0x0200,  // Game ends when the kill limit is reached.
	_force_unique_teams= 0x0400, // every player must have a unique team
	_dying_is_penalized= 0x0800, // time penalty for dying
	_suicide_is_penalized= 0x1000, // time penalty for killing yourselves
	_overhead_map_shows_items= 0x2000,
	_overhead_map_shows_monsters= 0x4000,
	_overhead_map_shows_projectiles= 0x8000
};

enum // cheat flags
  {
    _allow_crosshair = 0x0001,
    _allow_tunnel_vision = 0x0002,
    _allow_behindview = 0x0004,
    _disable_carnage_messages = 0x0008,
    _disable_saving_level = 0x0010,
    _allow_overlay_map = 0x0020
  };

enum // specifies how the user completed the level. saved in dynamic_data
{
	_level_unfinished, 
	_level_finished,
	_level_failed
};

// Game types!
enum {
	_game_of_kill_monsters,		// single player & combative use this
	_game_of_cooperative_play,	// multiple players, working together
	_game_of_capture_the_flag,	// A team game.
	_game_of_king_of_the_hill,
	_game_of_kill_man_with_ball,
	_game_of_defense,
	_game_of_rugby,
	_game_of_tag,
	_game_of_custom,
	NUMBER_OF_GAME_TYPES
};

#define GET_GAME_TYPE() (dynamic_world->game_information.game_type)
#define GET_GAME_OPTIONS() (dynamic_world->game_information.game_options)
#define GET_GAME_PARAMETER(x) (dynamic_world->game_information.parameters[(x)])

//
//	Single player game:
//		game_type= _game_of_kill_monsters;
//		game_options= 0
//

struct game_data 
{
	// Used for the net game, decrement each tick.  Used for the
	//  single player game-> set to INT32_MAX, and decremented over time, so
	//  that you know how long it took you to solve the game.
	int32 game_time_remaining;  
	int16 game_type; // One of previous enum's
	int16 game_options;
        int16 cheat_flags;
	int16 kill_limit;
	int16 initial_random_seed;
	int16 difficulty_level;
	int16 parameters[2]; // Use these later. for now memset to 0
};

struct dynamic_data
{
	// ticks since the beginning of the game
	int32 tick_count;
	
	// the real seed is static in WORLD.C; must call set_random_seed()
	uint16 random_seed;
	
	// This is stored in the dynamic_data so that it is valid across
	// saves.
	struct game_data game_information;
	
	int16 player_count;
	int16 speaking_player_index;
	
	int16 unused;
	int16 platform_count;
	int16 endpoint_count;
	int16 line_count;
	int16 side_count;
	int16 polygon_count;
	int16 lightsource_count;
	int16 map_index_count;
	int16 ambient_sound_image_count, random_sound_image_count;
	
	// statistically unlikely to be valid
	int16 object_count;
	int16 monster_count;
	int16 projectile_count;
	int16 effect_count;
	int16 light_count;
	
	int16 default_annotation_count;
	int16 personal_annotation_count;
	
	int16 initial_objects_count;
	
	int16 garbage_object_count;

	// used by move_monsters() to decide who gets to generate paths, etc.	
	int16 last_monster_index_to_get_time, last_monster_index_to_build_path;

	// variables used by new_monster() to adjust for different difficulty levels
	int16 new_monster_mangler_cookie, new_monster_vanishing_cookie;
	
	// number of civilians killed by players; periodically decremented
	int16 civilians_killed_by_players;

	// used by the item placement stuff
	int16 random_monsters_left[MAXIMUM_OBJECT_TYPES];
	int16 current_monster_count[MAXIMUM_OBJECT_TYPES];
	int16 random_items_left[MAXIMUM_OBJECT_TYPES];
	int16 current_item_count[MAXIMUM_OBJECT_TYPES];

	int16 current_level_number;   // what level the user is currently exploring.
	
	int16 current_civilian_causalties, current_civilian_count;
	int16 total_civilian_causalties, total_civilian_count;
	
	world_point2d game_beacon;
	int16 game_player_index;
};
const unsigned int SIZEOF_dynamic_data = 604;

// ---------- map globals

// Turned some of these lists into variable arrays;
// took over their maximum numbers as how many of them

extern struct static_data *static_world;
extern struct dynamic_data *dynamic_world;

extern vector<object_data> ObjectList;
#define objects (ObjectList.data())

// extern struct object_data *objects;

extern vector<endpoint_data> EndpointList;
#define map_endpoints (EndpointList.data())
#define MAXIMUM_ENDPOINTS_PER_MAP (EndpointList.size())

extern vector<line_data> LineList;
#define map_lines (LineList.data())
#define MAXIMUM_LINES_PER_MAP (LineList.size())

extern vector<side_data> SideList;
#define map_sides (SideList.data())
#define MAXIMUM_SIDES_PER_MAP (SideList.size())

extern vector<polygon_data> PolygonList;
#define map_polygons (PolygonList.data())
#define MAXIMUM_POLYGONS_PER_MAP (PolygonList.size())

// extern struct polygon_data *map_polygons;
// extern struct side_data *map_sides;
// extern struct line_data *map_lines;
// extern struct endpoint_data *map_endpoints;

extern vector<ambient_sound_image_data> AmbientSoundImageList;
#define MAXIMUM_AMBIENT_SOUND_IMAGES_PER_MAP (AmbientSoundImageList.size())
#define ambient_sound_images (AmbientSoundImageList.data())

extern vector<random_sound_image_data> RandomSoundImageList;
#define MAXIMUM_RANDOM_SOUND_IMAGES_PER_MAP (RandomSoundImageList.size())
#define random_sound_images (RandomSoundImageList.data())

// extern struct ambient_sound_image_data *ambient_sound_images;
// extern struct random_sound_image_data *random_sound_images;

extern vector<int16> MapIndexList;
#define map_indexes (MapIndexList.data())

// extern int16 *map_indexes;

extern vector<uint8> AutomapLineList;
#define automap_lines (AutomapLineList.data())

extern vector<uint8> AutomapPolygonList;
#define automap_polygons (AutomapPolygonList.data())

// extern byte *automap_lines;
// extern byte *automap_polygons;

extern vector<map_annotation> MapAnnotationList;
#define MAXIMUM_ANNOTATIONS_PER_MAP (MapAnnotationList.size())
#define map_annotations (MapAnnotationList.data())

extern vector<map_object> SavedObjectList;
#define MAXIMUM_SAVED_OBJECTS (SavedObjectList.size())
#define saved_objects (SavedObjectList.data())

// extern struct map_annotation *map_annotations;
// extern struct map_object *saved_objects;

#define ADD_LINE_TO_AUTOMAP(i) (automap_lines[(i)>>3] |= (byte) 1<<((i)&0x07))
#define CLEAR_LINE_FROM_AUTOMAP(i) (automap_lines[(i)>>3] &= ~((byte) 1<<((i&0x07))))
#define LINE_IS_IN_AUTOMAP(i) ((automap_lines[(i)>>3]&((byte)1<<((i)&0x07)))?(true):(false))

#define ADD_POLYGON_TO_AUTOMAP(i) (automap_polygons[(i)>>3] |= (byte) 1<<((i)&0x07))
#define CLEAR_POLYGON_FROM_AUTOMAP(i) (automap_polygons[(i)>>3] &= ~((byte) 1<<((i&0x07))))
#define POLYGON_IS_IN_AUTOMAP(i) ((automap_polygons[(i)>>3]&((byte)1<<((i)&0x07)))?(true):(false))

// Whether or not Marathon 2/oo landscapes had been loaded (switch off for Marathon 1 compatibility)
extern bool LandscapesLoaded;

// The index number of the first texture loaded (should be the main wall texture);
// needed for infravision fog when landscapes are switched off
extern short LoadedWallTexture;

// ---------- prototypes/MARATHON.C

void initialize_marathon(void);

void leaving_map(void);
// LP: added whether a savegame is being restored (skip Pfhortran init if that's the case)
bool entering_map(bool restoring_saved);

// ZZZ: now returns <whether anything changed, real-mode elapsed time>
// (used to return only the latter)
std::pair<bool, int16> update_world(void);

// ZZZ: these really don't go here, but they live in marathon2.cpp where update_world() lives.....
void reset_intermediate_action_queues();
void set_prediction_wanted(bool inPrediction);

// Called to activate lights, platforms, etc. (original polygon may be NONE)
void changed_polygon(short original_polygon_index, short new_polygon_index, short player_index);

short calculate_damage(struct damage_definition *damage);
void cause_polygon_damage(short polygon_index, short monster_index);

short calculate_level_completion_state();
short calculate_classic_level_completion_state(void);

// ---------- prototypes/MAP.C

void allocate_map_memory(void);
void initialize_map_for_new_game(void);
void initialize_map_for_new_level(void);

void mark_environment_collections(short environment_code, bool loading);
void mark_map_collections(bool loading);
bool collection_in_environment(short collection_code, short environment_code);

bool valid_point2d(world_point2d *p);
bool valid_point3d(world_point3d *p);

void reconnect_map_object_list(void);
short new_map_object2d(world_point2d *location, short polygon_index, shape_descriptor shape, angle facing);
short new_map_object3d(world_point3d *location, short polygon_index, shape_descriptor shape, angle facing);
short new_map_object(struct object_location *location, shape_descriptor shape);
short attach_parasitic_object(short host_index, shape_descriptor shape, angle facing);
void remove_parasitic_object(short host_index);
bool translate_map_object(short object_index, world_point3d *new_location, short new_polygon_index);
short find_new_object_polygon(world_point2d *parent_location, world_point2d *child_location, short parent_polygon_index);
void remove_map_object(short index);


// ZZZ additions in support of prediction:
// removes the object at object_index from the polygon with index in object's 'polygon' field
extern void remove_object_from_polygon_object_list(short object_index);
extern void remove_object_from_polygon_object_list(short object_index, short polygon_index);

// schedules object at object_index for later insertion into a polygon object list.  it'll be inserted
// before the object with index index_to_precede (which had better be in the list or be scheduled for insertion
// by the time perform_deferred_polygon_object_list_manipulations() is called, else A1 will assert).
extern void deferred_add_object_to_polygon_object_list(short object_index, short index_to_precede);

// actually does the insertions scheduled by deferred_add_object_to_polygon_object_list().  uses the polygon
// index each scheduled object has _when this function is called_, not whatever polygon index it had when
// deferred_add_object_to_polygon_object_list() was called!
extern void perform_deferred_polygon_object_list_manipulations();



struct shape_and_transfer_mode
{
	// extended shape descriptor
	short collection_code, low_level_shape_index;
	
	short transfer_mode;
	_fixed transfer_phase; // [0,FIXED_ONE]
	
	// Needed for animated models: which frame in an individual sequence (0, 1, 2, ...)
	short Frame, NextFrame;
	
	// Needed for animated models: which tick in a frame, and total ticks per frame
	short Phase, Ticks;
};

void get_object_shape_and_transfer_mode(world_point3d *camera_location, short object_index, struct shape_and_transfer_mode *data);
void get_object_shape_and_transfer_mode(world_point3d *camera_location, object_data* object, shape_and_transfer_mode *data);
void set_object_shape_and_transfer_mode(short object_index, shape_descriptor shape, short transfer_mode);
void animate_object(short object_index); // assumes ∂t==1 tick
void animate_object(object_data* data, int16_t object_index);
bool randomize_object_sequence(short object_index, shape_descriptor shape);

world_location3d* get_object_sound_location(short object_index);
void play_object_sound(short object_index, short sound_code, bool local_sound = false);
void play_polygon_sound(short polygon_index, short sound_code);
void play_side_sound(short side_index, short sound_code, _fixed pitch, bool soft_rewind = false);
void play_world_sound(short polygon_index, world_point3d *origin, short sound_code);

void handle_random_sound_image(void);

void initialize_map_for_new_player(void);
void generate_map(short level);

short world_point_to_polygon_index(world_point2d *location);
short clockwise_endpoint_in_line(short polygon_index, short line_index, short index);

short find_adjacent_polygon(short polygon_index, short line_index);
short find_flooding_polygon(short polygon_index);
short find_adjacent_side(short polygon_index, short line_index);
short find_shared_line(short polygon_index1, short polygon_index2);
bool line_is_landscaped(short polygon_index, short line_index, world_distance z);
short find_line_crossed_leaving_polygon(short polygon_index, world_point2d *p0, world_point2d *p1);
bool point_in_polygon(short polygon_index, world_point2d *p);
void find_center_of_polygon(short polygon_index, world_point2d *center);

int32 point_to_line_segment_distance_squared(world_point2d *p, world_point2d *a, world_point2d *b);
int32 point_to_line_distance_squared(world_point2d *p, world_point2d *a, world_point2d *b);

_fixed closest_point_on_line(world_point2d *e0, world_point2d *e1, world_point2d *p, world_point2d *closest_point);
void closest_point_on_circle(world_point2d *c, world_distance radius, world_point2d *p, world_point2d *closest_point);

_fixed find_line_intersection(world_point2d *e0, world_point2d *e1, world_point3d *p0,
	world_point3d *p1, world_point3d *intersection);
_fixed find_floor_or_ceiling_intersection(world_distance h, world_point3d *p0, world_point3d *p1, world_point3d *intersection);

void ray_to_line_segment(world_point2d *p0, world_point2d *p1, angle theta, world_distance d);

void push_out_line(world_point2d *e0, world_point2d *e1, world_distance d, world_distance line_length);
bool keep_line_segment_out_of_walls(short polygon_index, world_point3d *p0,
	world_point3d *p1, world_distance maximum_delta_height, world_distance height, world_distance *adjusted_floor_height,
	world_distance *adjusted_ceiling_height, short *supporting_polygon_index);

_fixed get_object_light_intensity(short object_index);

bool line_has_variable_height(short line_index);

void recalculate_map_counts(void);

bool change_polygon_height(short polygon_index, world_distance new_floor_height,
	world_distance new_ceiling_height, struct damage_definition *damage);

bool line_is_obstructed(short polygon_index1, world_point2d *p1, short polygon_index2, world_point2d *p2);
bool point_is_player_visible(short max_players, short polygon_index, world_point2d *p, int32 *distance);
bool point_is_monster_visible(short polygon_index, world_point2d *p, int32 *distance);

void turn_object_to_shit(short garbage_object_index);

void random_point_on_circle(world_point3d *center, short center_polygon_index,
	world_distance radius, world_point3d *random_point, short *random_polygon_index);

void calculate_line_midpoint(short line_index, world_point3d *midpoint);

void *get_map_structure_chunk(long chunk_size);
void reallocate_map_structure_memory(long size);

// ---------- prototypes/MAP_ACCESSORS.C

// LP changed: previously inline; now de-inlined for less code bulk
// When the index is out of range,
// the geometry ones make failed asserts,
// while the sound ones return null pointers.

object_data *get_object_data(
	const short object_index);

polygon_data *get_polygon_data(
	const short polygon_index);

line_data *get_line_data(
	const short line_index);

side_data *get_side_data(
	const short side_index);

endpoint_data *get_endpoint_data(
	const short endpoint_index);

short *get_map_indexes(
	const short index,
	const short count);

ambient_sound_image_data *get_ambient_sound_image_data(
	const short ambient_sound_image_index);

random_sound_image_data *get_random_sound_image_data(
	const short random_sound_image_index);

// ---------- prototypes/MAP_CONSTRUCTORS.C

short new_map_endpoint(world_point2d *where);
short duplicate_map_endpoint(short old_endpoint_index);
short new_map_line(short a, short b, short poly_a, short poly_b, short side_a, short side_b);
short duplicate_map_line(short old_line_index);
short new_map_polygon(short *line_indexes, short line_count, short floor_height,
	short ceiling_height, short floor_texture, short ceiling_texture, short lightsource_index);
void recalculate_side_type(short side_index);
short new_side(short polygon_index, short line_index);

void precalculate_map_indexes(void);

void touch_polygon(short polygon_index);
void recalculate_redundant_polygon_data(short polygon_index);
void recalculate_redundant_endpoint_data(short endpoint_index);
void recalculate_redundant_line_data(short line_index);
void recalculate_redundant_side_data(short side_index, short line_index);

void calculate_endpoint_polygon_owners(short endpoint_index, short *first_index, short *index_count);
void calculate_endpoint_line_owners(short endpoint_index, short *first_index, short *index_count);

void guess_side_lightsource_indexes(short side_index);

void set_map_index_buffer_size(long length);

// LP: routines for packing and unpacking the data from streams of bytes

uint8 *unpack_endpoint_data(uint8 *Stream, endpoint_data* Objects, size_t Count);
uint8 *pack_endpoint_data(uint8 *Stream, endpoint_data* Objects, size_t Count);
uint8 *unpack_line_data(uint8 *Stream, line_data* Objects, size_t Count);
uint8 *pack_line_data(uint8 *Stream, line_data* Objects, size_t Count);
uint8 *unpack_side_data(uint8 *Stream, side_data* Objects, size_t Count);
uint8 *pack_side_data(uint8 *Stream, side_data* Objects, size_t Count);
uint8 *unpack_polygon_data(uint8 *Stream, polygon_data* Objects, size_t Count);
uint8 *pack_polygon_data(uint8 *Stream, polygon_data* Objects, size_t Count);

uint8 *unpack_map_annotation(uint8 *Stream, map_annotation* Objects, size_t Count);
uint8 *pack_map_annotation(uint8 *Stream, map_annotation* Objects, size_t Count);
uint8 *unpack_map_object(uint8 *Stream, map_object* Objects, size_t Count, int version);
uint8 *pack_map_object(uint8 *Stream, map_object* Objects, size_t Count);
uint8 *unpack_object_frequency_definition(uint8 *Stream, object_frequency_definition* Objects, size_t Count);
uint8 *pack_object_frequency_definition(uint8 *Stream, object_frequency_definition* Objects, size_t Count);
uint8 *unpack_static_data(uint8 *Stream, static_data* Objects, size_t Count);
uint8 *pack_static_data(uint8 *Stream, static_data* Objects, size_t Count);

uint8 *unpack_ambient_sound_image_data(uint8 *Stream, ambient_sound_image_data* Objects, size_t Count);
uint8 *pack_ambient_sound_image_data(uint8 *Stream, ambient_sound_image_data* Objects, size_t Count);
uint8 *unpack_random_sound_image_data(uint8 *Stream, random_sound_image_data* Objects, size_t Count);
uint8 *pack_random_sound_image_data(uint8 *Stream, random_sound_image_data* Objects, size_t Count);

uint8 *unpack_dynamic_data(uint8 *Stream, dynamic_data* Objects, size_t Count);
uint8 *pack_dynamic_data(uint8 *Stream, dynamic_data* Objects, size_t Count);
uint8 *unpack_object_data(uint8 *Stream, object_data* Objects, size_t Count);
uint8 *pack_object_data(uint8 *Stream, object_data* Objects, size_t Count);

uint8 *unpack_damage_definition(uint8 *Stream, damage_definition* Objects, size_t Count);
uint8 *pack_damage_definition(uint8 *Stream, damage_definition* Objects, size_t Count);

//
//	map_indexes, automap_lines, and automap_polygons do not have any special
//	packing and unpacking routines, because the packing/unpacking of map_indexes is
//	relatively simple, and because the automap lines and polygons need no such processing.
//

// ---------- prototypes/PLACEMENT.C

// LP: this one does unpacking also
void load_placement_data(uint8 *_monsters, uint8 *_items);
struct object_frequency_definition *get_placement_info(void);
void place_initial_objects(void);
void recreate_objects(void);
void object_was_just_added(short object_class, short object_type);
void object_was_just_destroyed(short object_class, short object_type);
short get_random_player_starting_location_and_facing(short max_player_index, short team, struct object_location *location);

void mark_all_monster_collections(bool loading);
void load_all_monster_sounds(void);

// ---------- prototypes/GAME_DIALOGS.C

// --------- prototypes/LIGHTSOURCE.C

void update_lightsources(void);
short new_lightsource_from_old(short old_source);
void entered_polygon(short index);
void left_polygon(short index);
// Only send _light_turning_on, _light_turning_off, _light_toggle
void change_light_state(size_t lightsource_index, short state);

// ---------- prototypes/DEVICES.C

void mark_control_panel_shapes(bool load);
void initialize_control_panels_for_level(void); 
void update_control_panels(void);

bool control_panel_in_environment(short control_panel_type, short environment_code);

void change_device_state(short device_index, bool active);
short new_device(world_point2d *location, short initial_polygon_index, 
	short type, short extra_data, bool active);
void update_action_key(short player_index, bool triggered);

bool untoggled_repair_switches_on_level(bool only_last_switch = false);

void assume_correct_switch_position(short switch_type, short permutation, bool new_state);

void try_and_toggle_control_panel(short polygon_index, short line_index, short projectile_index);

bool line_side_has_control_panel(short line_index, short polygon_index, short *side_index_with_panel);

// ---------- prototypes/GAME_WAD.C

struct map_identifier {
	uint32 scenario_checksum;
	short level_index;
};

void set_to_default_map(void);

// Return true if it finds the file, and it sets the mapfile to that file.
// Otherwise it returns false, meaning that we need have the file sent to us.
bool use_map_file(uint32 checksum);
bool load_level_from_map(short level_index);
uint32 get_current_map_checksum(void);
bool select_map_to_use(void);

// Call with location of NULL to get the number of start locations for a
// given team or player
short get_player_starting_location_and_facing(short team, short index, 
	struct object_location *location);

bool get_indexed_entry_point(struct entry_point *entry_point, short *index, int32 type);
bool get_entry_points(vector<entry_point> &vec, int32 type);

bool new_game(short number_of_players, bool network, 
	struct game_data *game_information,
	struct player_start_data *player_start_information, 
	struct entry_point *entry_point);
bool goto_level(struct entry_point *entry, short number_of_players, player_start_data* player_start_information);

class InfoTree;
void parse_mml_texture_loading(const InfoTree& root);
void reset_mml_texture_loading();

// find_line_crossed leaving polygon could be sped up considerable by reversing the search direction in some circumstances

//find_line_crossed_leaving_polygon() does weird things when walking along a gridline
//keep_line_segment_out_of_walls() can slide the player slowly along a wall

#include "cseries.h"
#include "map.h"
#include "FilmProfile.h"
#include "interface.h"
#include "monsters.h"
#include "preferences.h"
#include "projectiles.h"
#include "effects.h"
#include "player.h"
#include "platforms.h"
#include "lightsource.h"
#include "lua_script.h"
#include "media.h"
#include "scenery.h"
#include "SoundManager.h"
#include "Console.h"
#include "InfoTree.h"
#include "flood_map.h"

// ---------- constants

#define DEFAULT_MAP_MEMORY_SIZE (128*KILO)

// ---------- globals

// LP: modified texture-environment management so as to be easier to handle with XML

const int NUMBER_OF_ENVIRONMENTS = 5;
const int NUMBER_OF_ENV_COLLECTIONS = 7;

static short Environments[NUMBER_OF_ENVIRONMENTS][NUMBER_OF_ENV_COLLECTIONS] = 
{
	{_collection_walls1, _collection_scenery1, NONE, NONE, NONE, NONE, NONE},	// Lh'owon Water
	{_collection_walls2, _collection_scenery2, NONE, NONE, NONE, NONE, NONE},	// Lh'owon Lava
	{_collection_walls3, _collection_scenery3, NONE, NONE, NONE, NONE, NONE},	// Lh'owon Sewage
	{_collection_walls4, _collection_scenery4, NONE, NONE, NONE, NONE, NONE},	// Jjaro (originally to be Pathways or Marathon)
	{_collection_walls5, _collection_scenery5, NONE, NONE, NONE, NONE, NONE}	// Pfhor
};

// ---------- map globals

// Turned some of these lists into variable arrays;
// took over their maximum numbers as how many of them

struct static_data *static_world = NULL;
struct dynamic_data *dynamic_world = NULL;

// These are allocated here because the numbers of these objects vary as a game progresses.
vector<effect_data> EffectList(MAXIMUM_EFFECTS_PER_MAP);
vector<object_data> ObjectList(MAXIMUM_OBJECTS_PER_MAP);
vector<monster_data> MonsterList(MAXIMUM_MONSTERS_PER_MAP);
vector<projectile_data> ProjectileList(MAXIMUM_PROJECTILES_PER_MAP);
// struct object_data *objects = NULL;
// struct monster_data *monsters = NULL;
// struct projectile_data *projectiles = NULL;

vector<endpoint_data> EndpointList;
vector<line_data> LineList;
vector<side_data> SideList;
vector<polygon_data> PolygonList;
vector<platform_data> PlatformList;
// struct polygon_data *map_polygons = NULL;
// struct side_data *map_sides = NULL;
// struct line_data *map_lines = NULL;
// struct endpoint_data *map_endpoints = NULL;
// struct platform_data *platforms = NULL;

vector<ambient_sound_image_data> AmbientSoundImageList;
vector<random_sound_image_data> RandomSoundImageList;
// struct ambient_sound_image_data *ambient_sound_images = NULL;
// struct random_sound_image_data *random_sound_images = NULL;

vector<int16> MapIndexList;
// short *map_indexes = NULL;

vector<uint8> AutomapLineList;
vector<uint8> AutomapPolygonList;
// byte *automap_lines = NULL;
// byte *automap_polygons = NULL;

vector<map_annotation> MapAnnotationList;
// struct map_annotation *map_annotations = NULL;

vector<map_object> SavedObjectList;
// struct map_object *saved_objects = NULL;
struct item_placement_data *placement_information = NULL;
*/
export let game_is_networked = false;
/*
// This could be a handle
struct map_memory_data {
	byte *memory;
	int32 size;
	int32 index;
};

// static struct map_memory_data map_structure_memory;

// LP addition: growable list of intersected objects
static vector<short> IntersectedObjects;

// Whether or not Marathon 2/oo landscapes had been loaded (switch off for Marathon 1 compatibility)
bool LandscapesLoaded = true;

// The index number of the first texture loaded (should be the main wall texture);
// needed for infravision fog when landscapes are switched off
short LoadedWallTexture = NONE;

// ---------- private prototypes

static short _new_map_object(shape_descriptor shape, angle facing);

// ZZZ: factored out some functionality for prediction, but ended up not using this stuff,
// so am not "publishing" it via map.h yet.
// SB: Blah.
void remove_object_from_polygon_object_list(short object_index, short polygon_index);
// The second infers the polygon_index from the object's "polygon" member field.
void add_object_to_polygon_object_list(short object_index, short polygon_index);
inline void add_object_to_polygon_object_list(short object_index)
{ add_object_to_polygon_object_list(object_index, get_object_data(object_index)->polygon); }

short _find_line_crossed_leaving_polygon(short polygon_index, world_point2d *p0, world_point2d *p1, bool *last_line);

// ---------- code

// Accessors moved here to shrink the code

object_data *get_object_data(
	const short object_index)
{
	struct object_data *object = GetMemberWithBounds(objects,object_index,MAXIMUM_OBJECTS_PER_MAP);
	
	vassert(object, csprintf(temporary, "object index #%d is out of range", object_index));
	vassert(SLOT_IS_USED(object), csprintf(temporary, "object index #%d is unused", object_index));
	
	return object;
}

polygon_data *get_polygon_data(
	const short polygon_index)
{
	assert(map_polygons);	
	struct polygon_data *polygon = GetMemberWithBounds(map_polygons,polygon_index,dynamic_world->polygon_count);
	
	vassert(polygon, csprintf(temporary, "polygon index #%d is out of range", polygon_index));
	
	return polygon;
}

line_data *get_line_data(
	const short line_index)
{
	assert(map_lines);
	struct line_data *line = GetMemberWithBounds(map_lines,line_index,dynamic_world->line_count);
	
	vassert(line, csprintf(temporary, "line index #%d is out of range", line_index));
	
	return line;
}

side_data *get_side_data(
	const short side_index)
{
	assert(map_sides);
	struct side_data *side = GetMemberWithBounds(map_sides,side_index,dynamic_world->side_count);
	
	vassert(side, csprintf(temporary, "side index #%d is out of range", side_index));
	
	return side;
}

endpoint_data *get_endpoint_data(
	const short endpoint_index)
{
	assert(map_endpoints);
	struct endpoint_data *endpoint = GetMemberWithBounds(map_endpoints,endpoint_index,dynamic_world->endpoint_count);

	vassert(endpoint, csprintf(temporary, "endpoint index #%d is out of range", endpoint_index));
	
	return endpoint;
}

short *get_map_indexes(
	const short index,
	const short count)
{
	assert(map_indexes);
	short *map_index = GetMemberWithBounds(map_indexes,static_cast<unsigned short>(index),static_cast<unsigned short>(dynamic_world->map_index_count)-count+1);
	
	// vassert(map_index, csprintf(temporary, "map_indexes(#%d,#%d) are out of range", index, count));
	
	return map_index;
}

ambient_sound_image_data *get_ambient_sound_image_data(
	const short ambient_sound_image_index)
{
	return GetMemberWithBounds(ambient_sound_images,ambient_sound_image_index,dynamic_world->ambient_sound_image_count);
}

random_sound_image_data *get_random_sound_image_data(
	const short random_sound_image_index)
{
	return GetMemberWithBounds(random_sound_images,random_sound_image_index,dynamic_world->random_sound_image_count);
}

void allocate_map_memory(
	void)
{
	assert(NUMBER_OF_COLLECTIONS<=MAXIMUM_COLLECTIONS);
	
	static_world= new static_data;
	dynamic_world= new dynamic_data;
	obj_clear(*static_world);
	obj_clear(*dynamic_world);

	// monsters= new monster_data[MAXIMUM_MONSTERS_PER_MAP];
	// projectiles= new projectile_data[MAXIMUM_PROJECTILES_PER_MAP];
	// objects= new object_data[MAXIMUM_OBJECTS_PER_MAP];
	// effects= new effect_data[MAXIMUM_EFFECTS_PER_MAP];
	// lights= new light_data[MAXIMUM_LIGHTS_PER_MAP];
	// medias= new media_data[MAXIMUM_MEDIAS_PER_MAP];
	// assert(objects&&monsters&&effects&&projectiles&&lights&&medias);

	// obj_clear(map_structure_memory);
	// reallocate_map_structure_memory(DEFAULT_MAP_MEMORY_SIZE);
	
	// platforms= new platform_data[MAXIMUM_PLATFORMS_PER_MAP];
	// assert(platforms);

	// ambient_sound_images= new ambient_sound_image_data[MAXIMUM_AMBIENT_SOUND_IMAGES_PER_MAP];
	// random_sound_images= new random_sound_image_data[MAXIMUM_RANDOM_SOUND_IMAGES_PER_MAP];
	// assert(ambient_sound_images && random_sound_images);
	
	// map_annotations= new map_annotation[MAXIMUM_ANNOTATIONS_PER_MAP];
	// saved_objects= new map_object[MAXIMUM_SAVED_OBJECTS];
	// assert(map_annotations && saved_objects);

	allocate_player_memory();
}

void initialize_map_for_new_game(
	void)
{
	obj_clear(*dynamic_world);

	initialize_players();
	initialize_monsters();
}

void initialize_map_for_new_level(
	void)
{
	short total_civilians, total_causalties;
	uint32 tick_count;
	uint16 random_seed;
	short player_count;
	struct game_data game_information;

	// The player count, tick count, and random seed must persist..
	// And the game information! (ajr)
	player_count= dynamic_world->player_count;
	tick_count= dynamic_world->tick_count;
	random_seed= dynamic_world->random_seed;
	total_civilians= dynamic_world->total_civilian_count + dynamic_world->current_civilian_count;
	total_causalties= dynamic_world->total_civilian_causalties + dynamic_world->current_civilian_causalties;
	game_information= dynamic_world->game_information;
	obj_clear(*dynamic_world);
	dynamic_world->game_information= game_information;
	dynamic_world->player_count= player_count;
	dynamic_world->tick_count= tick_count;
	dynamic_world->random_seed= random_seed;
	dynamic_world->total_civilian_count= total_civilians;
	dynamic_world->total_civilian_causalties= total_causalties;
	dynamic_world->speaking_player_index= NONE;
	dynamic_world->garbage_object_count= 0;

	obj_clear(*static_world);
	Console::instance()->clear_saves();
	
	// Clear all these out -- supposed to be none of the contents of these when starting a level.
	objlist_clear(automap_lines, AutomapLineList.size());
	objlist_clear(automap_polygons, AutomapPolygonList.size());
	objlist_clear(EffectList.data(), EffectList.size());
	objlist_clear(projectiles,  ProjectileList.size());
	objlist_clear(monsters,  MonsterList.size());
	objlist_clear(objects,  ObjectList.size());

	// Note that these pointers just point into a larger structure, so this is not a bad thing
	// map_polygons= NULL;
	// map_sides= NULL;
	// map_lines= NULL;
	// map_endpoints= NULL;
	// automap_lines= NULL;
	// automap_polygons= NULL;
}

static bool map_collections[NUMBER_OF_COLLECTIONS];
static bool media_effects[NUMBER_OF_EFFECT_TYPES];

void mark_map_collections(bool loading)
{
	if (loading)
	{

		for (int collection = 0; collection < NUMBER_OF_COLLECTIONS; collection++)
		{
			map_collections[collection] = false;
		}

		// walls/floors/ceilings
		for (int n = 0; n < dynamic_world->polygon_count; n++)
		{
			polygon_data *polygon = map_polygons + n;
			int coll;
			coll = GET_DESCRIPTOR_COLLECTION(polygon->floor_texture);
			if (coll >= 0 && coll < NUMBER_OF_COLLECTIONS)
				map_collections[coll] = true;

			coll = GET_DESCRIPTOR_COLLECTION(polygon->ceiling_texture);
			if (coll >= 0 && coll < NUMBER_OF_COLLECTIONS)
				map_collections[coll] = true;
			
			for (int i = 0; i < polygon->vertex_count; i++)
			{
				short side_index = polygon->side_indexes[i];
				if (side_index == NONE) continue;
				side_data *side = get_side_data(side_index);
				switch (side->type)
				{
				case _full_side:
					coll = GET_DESCRIPTOR_COLLECTION(side->primary_texture.texture);
					if (coll >= 0 && coll < NUMBER_OF_COLLECTIONS)
						map_collections[coll] = true;
					break;
				case _split_side:
					coll = GET_DESCRIPTOR_COLLECTION(side->secondary_texture.texture);
					if (coll >= 0 && coll < NUMBER_OF_COLLECTIONS)
						map_collections[coll] = true;
					// fall through to the high side case
				case _high_side:
					coll = GET_DESCRIPTOR_COLLECTION(side->primary_texture.texture);
					if (coll >= 0 && coll < NUMBER_OF_COLLECTIONS)
						map_collections[coll] = true;
					break;
				case _low_side:
					coll = GET_DESCRIPTOR_COLLECTION(side->primary_texture.texture);
					if (coll >= 0 && coll < NUMBER_OF_COLLECTIONS)
						map_collections[coll] = true;
				}

				coll = GET_DESCRIPTOR_COLLECTION(side->transparent_texture.texture);
				if (coll >= 0 && coll < NUMBER_OF_COLLECTIONS)
					map_collections[coll] = true;
				
			}
		}

		// media textures and effects
		for (int media_effect = 0; media_effect < NUMBER_OF_EFFECT_TYPES; media_effect++)
		{
			media_effects[media_effect] = false;
		}

		for (int media_index = 0; media_index < MAXIMUM_MEDIAS_PER_MAP; ++media_index)
		{
			if (get_media_data(media_index))
			{
				short collection;
				if (get_media_collection(media_index, collection))
				{
					map_collections[collection] = true;
				}

				for (int detonation_type = 0; detonation_type < NUMBER_OF_MEDIA_DETONATION_TYPES; detonation_type++)
				{
					short detonation_effect;
					get_media_detonation_effect(media_index, detonation_type, &detonation_effect);
					if (detonation_effect >= 0 && detonation_effect < NUMBER_OF_EFFECT_TYPES)
						media_effects[detonation_effect] = true;
				}
			}
		}

		// scenery
		for (int object_index = 0; object_index < dynamic_world->initial_objects_count; object_index++)
		{
			if (saved_objects[object_index].type == _saved_object)
			{
				short collection;
				if (get_scenery_collection(saved_objects[object_index].index, collection))
				{
					map_collections[collection] = true;
				}

				if (get_damaged_scenery_collection(saved_objects[object_index].index, collection))
				{
					map_collections[collection] = true;
				}
			}
		}


		for (int collection = 0; collection < NUMBER_OF_COLLECTIONS; collection++)
		{
			if (map_collections[collection])
			{
				mark_collection_for_loading(collection);
			}
		}


		for (int media_effect = 0; media_effect < NUMBER_OF_EFFECT_TYPES; media_effect++)
		{
			if (media_effects[media_effect])
			{
				mark_effect_collections(media_effect, true);
			}
		}


	} else { // not loading
		for (int collection = 0; collection < NUMBER_OF_COLLECTIONS; collection++)
		{
			if (map_collections[collection])
			{
				mark_collection_for_unloading(collection);
			}
		}

		for (int media_effect = 0; media_effect < NUMBER_OF_EFFECT_TYPES; media_effect++)
		{
			mark_effect_collections(media_effect, false);
		}
		
	}
}

bool collection_in_environment(
	short collection_code,
	short environment_code)
{
	short collection_index= GET_COLLECTION(collection_code);
	bool found= false;
	int i;
	
	if (!(environment_code>=0 && environment_code<NUMBER_OF_ENVIRONMENTS)) return false;
	assert(collection_index>=0 && collection_index<NUMBER_OF_COLLECTIONS);
	
	for (i= 0; i<NUMBER_OF_ENV_COLLECTIONS; ++i)
	{
		if (Environments[environment_code][i]==collection_index) {
			found= true;
			break;
		}
	}
	
	return found;
}

// mark all of the shape collections belonging to a given environment code for loading or
	unloading
void mark_environment_collections(
	short environment_code,
	bool loading)
{
	short i;
	short collection;
	
	if (!(environment_code>=0&&environment_code<NUMBER_OF_ENVIRONMENTS)) return;

	// LP change: modified to use new collection-environment management;
	// be sure to set "loaded wall texture" to the first one loaded
	LoadedWallTexture = NONE;
	
	// for (i= 0; (collection= environment_definitions[environment_code].shape_collections[i])!=NONE; ++i)
	for (i= 0; i<NUMBER_OF_ENV_COLLECTIONS; ++i)
	{
		collection = Environments[environment_code][i];
		if (collection != NONE)
		{
			if (LoadedWallTexture == NONE) LoadedWallTexture = collection;
			loading ? mark_collection_for_loading(collection) : mark_collection_for_unloading(collection);
		}
	}
	if (LoadedWallTexture == NONE) LoadedWallTexture = 0;
	
	// Don't load/unload if M1 compatible...
	if (LandscapesLoaded)
		loading ? mark_collection_for_loading(_collection_landscape1+static_world->song_index) :
			mark_collection_for_unloading(_collection_landscape1+static_world->song_index);
}

// make the object list and the map consistent
void reconnect_map_object_list(
	void)
{
	short i;
	struct object_data *object;
	struct polygon_data *polygon;

	// wipe first_object links from polygon structures
	for (polygon=map_polygons,i=0;i<dynamic_world->polygon_count;--i,++polygon)
	{
		polygon->first_object= NONE;
	}
	
	// connect objects to their polygons
	for (object=objects,i=0;i<MAXIMUM_OBJECTS_PER_MAP;++i,++object)
	{
		if (SLOT_IS_USED(object))
		{
			polygon= get_polygon_data(object->polygon);
			
			object->next_object= polygon->first_object;
			polygon->first_object= i;
		}
	}
}

bool valid_point2d(
	world_point2d *p)
{
	return world_point_to_polygon_index(p)==NONE ? false : true;
}

bool valid_point3d(
	world_point3d *p)
{
	short polygon_index= world_point_to_polygon_index((world_point2d *)p);
	bool valid= false;
	
	if (polygon_index!=NONE)
	{
		struct polygon_data *polygon= get_polygon_data(polygon_index);
		
		if (p->z>polygon->floor_height&&p->z<polygon->ceiling_height)
		{
			valid= true;
		}
	}
	
	return valid;
}

short new_map_object(
	struct object_location *location,
	shape_descriptor shape)
{
	struct polygon_data *polygon= get_polygon_data(location->polygon_index);
	world_point3d p= location->p;
	short object_index;
	
	p.z= ((location->flags&_map_object_hanging_from_ceiling) ? polygon->ceiling_height : polygon->floor_height) + p.z;
	
	object_index= new_map_object3d(&p, location->polygon_index, shape, location->yaw);
	if (object_index!=NONE)
	{
		struct object_data *object= get_object_data(object_index);
		
		if (location->flags&_map_object_is_invisible)
			SET_OBJECT_INVISIBILITY(object, true);
	}
	
	return object_index;
}

short new_map_object2d(
	world_point2d *location,
	short polygon_index,
	shape_descriptor shape,
	angle facing)
{
	world_point3d location3d;
	struct polygon_data *polygon;

	polygon= get_polygon_data(polygon_index);
	location3d.x= location->x, location3d.y= location->y, location3d.z= polygon->floor_height;
	
	return new_map_object3d(&location3d, polygon_index, shape, facing);
}

short new_map_object3d(
	world_point3d *location,
	short polygon_index,
	shape_descriptor shape,
	angle facing)
{
	short object_index;

	object_index= _new_map_object(shape, facing);
	if (object_index!=NONE)
	{
		struct polygon_data *polygon= get_polygon_data(polygon_index);
		struct object_data *object= get_object_data(object_index);
	
		// initialize object polygon and location	
		object->polygon= polygon_index;
		object->location= *location;

		// insert at head of linked list
		object->next_object= polygon->first_object;
		polygon->first_object= object_index;
	}
	
	return object_index;
}

// can be NONE if there is no direct route between the two points or the child point is not in any polygon
short find_new_object_polygon(
	world_point2d *parent_location,
	world_point2d *child_location,
	short parent_polygon_index)
{
	short child_polygon_index= parent_polygon_index;
	
	if (child_polygon_index!=NONE)
	{
		short line_index;
		
		do
		{
			line_index= find_line_crossed_leaving_polygon(child_polygon_index, parent_location, child_location);
			if (line_index!=NONE)
			{
				child_polygon_index= find_adjacent_polygon(child_polygon_index, line_index);
			}
		}
		while (line_index!=NONE&&child_polygon_index!=NONE);
	}
	
	return child_polygon_index;
}

short attach_parasitic_object(
	short host_index,
	shape_descriptor shape,
	angle facing)
{
	struct object_data *host_object, *parasite_object;
	short parasite_index;

	// walk this object’s parasite list until we find the last parasite and then attach there
	for (host_object= get_object_data(host_index);
			host_object->parasitic_object!=NONE;
			host_index= host_object->parasitic_object, host_object= get_object_data(host_index))
		;
	parasite_index= _new_map_object(shape, facing);
	assert(parasite_index!=NONE);
	
	parasite_object= get_object_data(parasite_index);
	parasite_object->location= host_object->location;
	host_object->parasitic_object= parasite_index;
	
	// So that it will have the same size scaling as its host object
	SET_FLAG(parasite_object->flags, _object_is_enlarged, TEST_FLAG(host_object->flags, _object_is_enlarged));
	SET_FLAG(parasite_object->flags, _object_is_tiny, TEST_FLAG(host_object->flags, _object_is_tiny));
		
	return parasite_index;
}

void remove_parasitic_object(
	short host_index)
{
	struct object_data *host= get_object_data(host_index);
	struct object_data *parasite= get_object_data(host->parasitic_object);

	host->parasitic_object= NONE;
	MARK_SLOT_AS_FREE(parasite);
}

// look up the index yourself
void remove_map_object(
	short object_index)
{
	short *next_object;
	struct object_data *object= get_object_data(object_index);
	struct polygon_data *polygon= get_polygon_data(object->polygon);
	
	next_object= &polygon->first_object;
	while (*next_object!=object_index) next_object= &get_object_data(*next_object)->next_object;

	if (object->parasitic_object!=NONE) 
	{
		struct object_data *parasite= get_object_data(object->parasitic_object);
		
		MARK_SLOT_AS_FREE(parasite);
	}

	L_Invalidate_Object(object_index);
	*next_object= object->next_object;
	MARK_SLOT_AS_FREE(object);
}



// remove the object from the old_polygon’s object list
void
remove_object_from_polygon_object_list(short object_index, short polygon_index)
{
	struct object_data* object = get_object_data(object_index);

	polygon_data* polygon= get_polygon_data(polygon_index);
	short* next_object= &polygon->first_object;

	assert(*next_object != NONE);

	while (*next_object!=object_index)
	{
		next_object= &get_object_data(*next_object)->next_object;
		assert(*next_object != NONE);
	}

	*next_object= object->next_object;

	object->polygon= NONE;
}

void
remove_object_from_polygon_object_list(short object_index)
{
	remove_object_from_polygon_object_list(object_index, get_object_data(object_index)->polygon);
}



// add the object to the new_polygon’s object list
void
add_object_to_polygon_object_list(short object_index, short polygon_index)
{
	struct object_data* object = get_object_data(object_index);
	struct polygon_data* polygon= get_polygon_data(polygon_index);

	object->next_object= polygon->first_object;
	polygon->first_object= object_index;

	object->polygon= polygon_index;
}

typedef std::pair<short, short>	DeferredObjectListInsertion;
typedef std::list<DeferredObjectListInsertion> DeferredObjectListInsertionList;
static DeferredObjectListInsertionList sDeferredObjectListInsertions;

void
deferred_add_object_to_polygon_object_list(short object_index, short index_to_precede)
{
	sDeferredObjectListInsertions.push_back(DeferredObjectListInsertion(object_index, index_to_precede));
}



void
perform_deferred_polygon_object_list_manipulations()
{
	// Loop while the list of insertions is non-empty (we may need to make multiple passes)
	while(!sDeferredObjectListInsertions.empty())
	{
		// Pass over the list of insertions, inserting whatever we can.
		bool something_changed = false;

		for(DeferredObjectListInsertionList::iterator i = sDeferredObjectListInsertions.begin(); i != sDeferredObjectListInsertions.end(); )
		{
			short object_to_insert_index = (*i).first;
			short object_index_to_precede = (*i).second;
			object_data* object = get_object_data(object_to_insert_index);
			polygon_data* polygon = get_polygon_data(object->polygon);

			// Find object index we're supposed to predece... and insert the object before it
			short* next_object_index_p = &(polygon->first_object);
			bool inserted = false;

			while(!inserted)
			{
				if(*next_object_index_p == object_index_to_precede)
				{
					object->next_object = *next_object_index_p;
					*next_object_index_p = object_to_insert_index;
					inserted = true;
				}

				if(*next_object_index_p == NONE)
					break;

				next_object_index_p = &(get_object_data(*next_object_index_p)->next_object);

			} // Insert object before object it's supposed to precede

			// Each branch of this if() will increment i
			if(inserted)
			{
				// Most concise way to correctly remove-and-increment
				sDeferredObjectListInsertions.erase(i++);
				something_changed = true;
			}
			else
				// Perhaps we were trying to insert before another object that's scheduled for insertion.
				// In that case, maybe by the time we come around again, the other object will be inserted.
				// For now, we leave the insertion pending.
				++i;

		} // Pass over the list of insertions, inserting whatever we can.

		// We must make progress, otherwise my algorithm is flawed (we'd loop forever).  Progress here
		// is performing insertions into the polygon object lists and removing the corresponding deferred
		// insertions from the insertion list.
		assert(something_changed);

	} // Loop while the list of insertions is non-empty

} // perform_deferred_polygon_object_list_manipulations



// if a new polygon index is supplied, it will be used, otherwise we’ll try to find the new polygon index ourselves
bool translate_map_object(
	short object_index,
	world_point3d *new_location,
	short new_polygon_index)
{
	short line_index;
	struct object_data *object= get_object_data(object_index);
	short old_polygon_index= object->polygon;
	bool changed_polygons= false;
	
	// if new_polygon is NONE, find out what polygon the new_location is in
	if (new_polygon_index==NONE)
	{
		new_polygon_index= old_polygon_index;
		do
		{
			line_index= find_line_crossed_leaving_polygon(new_polygon_index, (world_point2d *)&object->location, (world_point2d *)new_location);
			if (line_index!=NONE) new_polygon_index= find_adjacent_polygon(new_polygon_index, line_index);
			if (new_polygon_index==NONE)
			{
				*(world_point2d *)new_location= get_polygon_data(old_polygon_index)->center;
				new_polygon_index= old_polygon_index;
				changed_polygons= true; // tell the caller we switched polygons, even though we didn’t
				break;
			}
		}
		while (line_index!=NONE);
	}
	
	// if we changed polygons, update the old and new polygon’s linked lists of objects
	if (old_polygon_index!=new_polygon_index)
	{
		remove_object_from_polygon_object_list(object_index, old_polygon_index);
		add_object_to_polygon_object_list(object_index, new_polygon_index);		
		changed_polygons= true;
	}
	object->location= *new_location;

	// move (no saving throw) all parasitic objects along with their host
	while (object->parasitic_object!=NONE)
	{
		object= get_object_data(object->parasitic_object);
		object->polygon= new_polygon_index;
		object->location= *new_location;
	}

	return changed_polygons;
}

void get_object_shape_and_transfer_mode(
	world_point3d* camera_location,
	short object_index,
	struct shape_and_transfer_mode* data)
{
	get_object_shape_and_transfer_mode(camera_location, get_object_data(object_index), data);
}

void get_object_shape_and_transfer_mode(
	world_point3d *camera_location,
	object_data* object,
	shape_and_transfer_mode *data)
{
	struct shape_animation_data *animation;
	angle theta;
	short view;
	
	animation= get_shape_animation_data(object->shape);
	// Added bug-outs in case of incorrect data; turned asserts into these tests:
	if (!animation)
	{
		data->collection_code = NONE; // Deliberate bad value
		return;
	}
	else if (!(animation->frames_per_view>=1))
	{
		data->collection_code = NONE; // Deliberate bad value
		return;
	}
	// assert(animation->frames_per_view>=1);
	
	// get correct base shape
	// LP change: made long-distance friendly
	theta= arctangent(int32(object->location.x) - int32(camera_location->x), int32(object->location.y) - int32(camera_location->y)) - object->facing;
	switch (animation->number_of_views)
	{
		case _unanimated:
		case _animated1:
			view= 0;
			break;
		
		case _animated3to4: // front, quarter and side views only
		case _animated4:
			switch (FACING4(theta))
			{
				case 0: view= 3; break; // 90° (facing left)
				case 1: view= 0; break; // 0° (facing forward)
				case 2: view= 1; break; // -90° (facing right)
				case 3: view= 2; break; // ±180° (facing away)
				default:
					data->collection_code = NONE; // Deliberate bad value
					return;
			}
			break;

		case _animated3to5:
		case _animated5:
			theta+= HALF_CIRCLE;
			switch (FACING5(theta))
			{
				case 0: view= 4; break;
				case 1: view= 3; break;
				case 2: view= 2; break;
				case 3: view= 1; break;
				case 4: view= 0; break;
				default:
					data->collection_code = NONE; // Deliberate bad value
					return;
			}
			break;
		
		case _animated2to8:			
		case _animated5to8:
		case _animated8:
			switch (FACING8(theta))
			{
				case 0: view= 3; break; // 135° (facing left)
				case 1: view= 2; break; // 90° (facing left)
				case 2: view= 1; break; // 45° (facing left)
				case 3: view= 0; break; // 0° (facing forward)
				case 4: view= 7; break; // -45° (facing right)
				case 5: view= 6; break; // -90° (facing right)
				case 6: view= 5; break; // -135° (facing right)
				case 7: view= 4; break; // ±180° (facing away)
				default:
					data->collection_code = NONE; // Deliberate bad value
					return;
			}
			break;
		
		default:
			data->collection_code = NONE; // Deliberate bad value
			return;
	}

	// fill in the structure (transfer modes in the animation override transfer modes in the object
	data->collection_code= GET_DESCRIPTOR_COLLECTION(object->shape);
	short Frame = GET_SEQUENCE_FRAME(object->sequence);
	data->Frame = Frame;
	
	// Guess next frame
	short NextFrame = Frame + 1;
	if (NextFrame >= animation->frames_per_view)
		NextFrame = animation->loop_frame;
	data->NextFrame = NextFrame;
	
	// Work out the phase in the cycle; be sure to start a cycle with 0 and not 1
	short Phase = GET_SEQUENCE_PHASE(object->sequence);
	short Ticks = animation->ticks_per_frame;
	if (Phase >= Ticks) Phase -= Ticks;
	data->Phase = Phase;
	data->Ticks = Ticks;
	
	// What bitmap, etc.
	data->low_level_shape_index= animation->low_level_shape_indexes[view*animation->frames_per_view + Frame];
	if (animation->transfer_mode==_xfer_normal && object->transfer_mode!=NONE)
	{
		data->transfer_mode= object->transfer_mode;
		data->transfer_phase= object->transfer_period ? INTEGER_TO_FIXED(object->transfer_phase)/object->transfer_period : 0;

//		if (object->transfer_mode==_xfer_fold_out) dprintf("#%d/#%d==%x", object->transfer_phase, object->transfer_period, data->transfer_phase);
	}
	else
	{
		data->transfer_mode= animation->transfer_mode;
		data->transfer_phase= (animation->transfer_mode!=_xfer_normal && animation->transfer_mode_period) ? INTEGER_TO_FIXED(object->transfer_phase)/animation->transfer_mode_period : 0;
	}
}

bool randomize_object_sequence(
	short object_index,
	shape_descriptor shape)
{
	struct object_data *object= get_object_data(object_index);
	struct shape_animation_data *animation;
	bool randomized= false;
	
	animation= get_shape_animation_data(shape);
	if (!animation) return false;
	
	switch (shapes.shapes_file_is_m1() ? _unanimated : animation->number_of_views)
	{
		case _unanimated:
			object->shape= shape;
			object->sequence= BUILD_SEQUENCE(global_random()%animation->frames_per_view, 0);
			randomized= true;
			break;
	}
	
	return randomized;
}

void set_object_shape_and_transfer_mode(
	short object_index,
	shape_descriptor shape,
	short transfer_mode)
{
	struct object_data *object= get_object_data(object_index);

	if (object->shape!=shape)
	{
		struct shape_animation_data *animation= get_shape_animation_data(shape);
		// Quit if a nonexistent animation
		// assert(animation);
		if (!animation) return;
		
		object->shape= shape;
		if (animation->transfer_mode!=_xfer_normal || object->transfer_mode==NONE) object->transfer_phase= 0;
		object->sequence= BUILD_SEQUENCE(0, 1);
		SET_OBJECT_ANIMATION_FLAGS(object, _obj_not_animated);
		
		play_object_sound(object_index, animation->first_frame_sound);
	}
	
	if (transfer_mode!=NONE)
	{
		if (object->transfer_mode!=transfer_mode)
		{
			object->transfer_mode= transfer_mode;
			object->transfer_phase= 0;
		}
	}
}

void animate_object(short object_index)
{
	animate_object(get_object_data(object_index), object_index);
}

// no longer called by RENDER.C; must be called by monster, projectile or effect controller; now assumes ∂t==1 tick
void animate_object(
	object_data* object,
	int16_t sound_id)
{
	struct shape_animation_data *animation;
	short animation_type= _obj_not_animated;

	if (!OBJECT_IS_INVISIBLE(object)) // invisible objects don’t have valid .shape fields
	{
		animation= get_shape_animation_data(object->shape);
		if (!animation) return;
	
		// if this animation has frames, animate it		
		if (animation->frames_per_view>=1 && animation->number_of_views!=_unanimated)
		{
			short frame, phase;
			
			// LP change: added some idiot-proofing to the ticks-per-frame value
			if (animation->ticks_per_frame <= 0)
				animation->ticks_per_frame = 1;
		
			frame= GET_SEQUENCE_FRAME(object->sequence);
			phase= GET_SEQUENCE_PHASE(object->sequence);

			if (sound_id != NONE && !frame && (!phase || phase>=animation->ticks_per_frame)) play_object_sound(sound_id, animation->first_frame_sound);
	
			// phase is left unadjusted if it goes over ticks_per_frame until the next call
			if (phase>=animation->ticks_per_frame) phase-= animation->ticks_per_frame;
			if ((phase+= 1)>=animation->ticks_per_frame)
			{
				frame+= 1;
				if (!film_profile.keyframe_fix)
				{
					animation_type|= _obj_animated;
					if (frame==animation->key_frame)
					{
						animation_type|= _obj_keyframe_started;
						if (animation->key_frame_sound!=NONE && sound_id != NONE) play_object_sound(sound_id, animation->key_frame_sound);
					}
					if (frame>=animation->frames_per_view)
					{
						frame= animation->loop_frame;
						animation_type|= _obj_last_frame_animated;
						if (animation->last_frame_sound!=NONE && sound_id != NONE) play_object_sound(sound_id, animation->last_frame_sound);
					}
				}
				else
				{
					// LP change: interchanged these two so that
					// 1: keyframe 0 would get recognized
					// 2: to keep the timing correct in the nonzero case
					// LP change: inverted the order yet again to get more like Moo,
					// but this time, added detection of cases
					// keyframe = 0 and keyframe = [frames per view]
					// Inverted the order yet again (!) to supporess Hunter death bug
					animation_type|= _obj_animated;
					if (frame>=animation->frames_per_view)
					{
						frame= animation->loop_frame;
						animation_type|= _obj_last_frame_animated;
						if (animation->last_frame_sound!=NONE && sound_id != NONE) play_object_sound(sound_id, animation->last_frame_sound);
					}
					short offset_frame = frame + animation->frames_per_view; // LP addition
					if (frame==animation->key_frame || offset_frame==animation->key_frame)
					{
						animation_type|= _obj_keyframe_started;
						if (animation->key_frame_sound!=NONE && sound_id != NONE) play_object_sound(sound_id, animation->key_frame_sound);
					}
				}
			}
	
			object->sequence= BUILD_SEQUENCE(frame, phase);
		}
		
		// if this object has a transfer animation, update the transfer animation counter
		{
			short period= (animation->transfer_mode==_xfer_normal && object->transfer_mode!=NONE) ? object->transfer_period : animation->transfer_mode_period;
			
			if (period)
			{
				if ((object->transfer_phase+= 1)>=period)
				{
					animation_type|= _obj_transfer_mode_finished;
					object->transfer_phase= 0;
				}
			}
		}
		
		SET_OBJECT_ANIMATION_FLAGS(object, animation_type);
	}

	// This allows you to animate parasites of objects that are invisible (though
	//  it is questionable if you would ever want to do that)
	// if this object has any parasites, animate those too
	if (object->parasitic_object!=NONE) animate_object(object->parasitic_object);
}

void calculate_line_midpoint(
	short line_index,
	world_point3d *midpoint)
{
	struct line_data *line= get_line_data(line_index);
	struct world_point2d *e0= &get_endpoint_data(line->endpoint_indexes[0])->vertex;
	struct world_point2d *e1= &get_endpoint_data(line->endpoint_indexes[1])->vertex;
	
	midpoint->x= (e0->x+e1->x)>>1;
	midpoint->y= (e0->y+e1->y)>>1;
	midpoint->z= (line->lowest_adjacent_ceiling+line->highest_adjacent_floor)>>1;
}

bool point_in_polygon(
	short polygon_index,
	world_point2d *p)
{
	struct polygon_data *polygon= get_polygon_data(polygon_index);
	bool point_inside= true;
	short i;
	
	for (i=0;i<polygon->vertex_count;++i)
	{
		struct line_data *line= get_line_data(polygon->line_indexes[i]);
		bool clockwise= line->endpoint_indexes[0]==polygon->endpoint_indexes[i];
		world_point2d *e0= &get_endpoint_data(line->endpoint_indexes[0])->vertex;
		world_point2d *e1= &get_endpoint_data(line->endpoint_indexes[1])->vertex;
		int32 cross_product= (p->x-e0->x)*(e1->y-e0->y) - (p->y-e0->y)*(e1->x-e0->x);
		
		if ((clockwise && cross_product>0) || (!clockwise && cross_product<0))
		{
			point_inside= false;
			break;
		}
	}
	
	return point_inside;
}

short clockwise_endpoint_in_line(
	short polygon_index,
	short line_index,
	short index)
{
	struct line_data *line= get_line_data(line_index);
	bool line_is_clockwise= true;

	if (line->clockwise_polygon_owner!=polygon_index)
	{
		// LP change: get around some Pfhorte bugs
		line_is_clockwise= false;
	}
	
	switch (index)
	{
		case 0:
			index= line_is_clockwise ? 0 : 1;
			break;
		case 1:
			index= line_is_clockwise ? 1 : 0;
			break;
		default:
			assert(false);
			break;
	}

	return line->endpoint_indexes[index];
}

short world_point_to_polygon_index(
	world_point2d *location)
{
	short polygon_index;
	struct polygon_data *polygon;
	
	for (polygon_index=0,polygon=map_polygons;polygon_index<dynamic_world->polygon_count;++polygon_index,++polygon)
	{
		if (!POLYGON_IS_DETACHED(polygon))
		{
			if (point_in_polygon(polygon_index, location)) break;
		}
	}
	if (polygon_index==dynamic_world->polygon_count) polygon_index= NONE;

	return polygon_index;
}

// return the polygon on the other side of the given line from the given polygon (i.e., return the polygon adjacent to line_index which isn’t polygon_index).  can return NONE.
short find_adjacent_polygon(
	short polygon_index,
	short line_index)
{
	struct line_data *line= get_line_data(line_index);
	short new_polygon_index;
	
	if (polygon_index==line->clockwise_polygon_owner)
	{
		new_polygon_index= line->counterclockwise_polygon_owner;
	}
	else
	{
		// LP change: get around some Pfhorte bugs
		new_polygon_index= line->clockwise_polygon_owner;
	}
	
	assert(new_polygon_index!=polygon_index);
	
	return new_polygon_index;
}

static short find_flooding_polygon_helper(short parent, short polygon_index)
{
	auto* polygon = get_polygon_data(polygon_index);

	for (auto i = 0; i < polygon->vertex_count; ++i)
	{
		auto adjacent_index = polygon->adjacent_polygon_indexes[i];
		if (adjacent_index != NONE && adjacent_index != parent)
		{
			auto *adjacent = get_polygon_data(adjacent_index);
			if (adjacent->type == _polygon_is_major_ouch ||
				adjacent->type == _polygon_is_minor_ouch)
			{
				return adjacent_index;
			}
		}
	}

	if (film_profile.m1_platform_flood)
	{
		for (auto i = 0; i < polygon->vertex_count; ++i)
		{
			auto adjacent_index = polygon->adjacent_polygon_indexes[i];
			if (adjacent_index != NONE && adjacent_index != parent)
			{
				auto* adjacent = get_polygon_data(adjacent_index);
				if (adjacent->type == _polygon_is_platform)
				{
					auto* platform = get_platform_data(adjacent->permutation);
					if (platform && PLATFORM_IS_FLOODED(platform))
					{
						auto index = find_flooding_polygon_helper(polygon_index, adjacent_index);
						if (index != NONE)
						{
							return index;
						}
					}
				}
			}
		}
	}

	return NONE;
}

// Find the polygon whose attributes we'll mimic on a flooded platform
short find_flooding_polygon(
	short polygon_index)
{
	return find_flooding_polygon_helper(NONE, polygon_index);
}

short find_adjacent_side(
	short polygon_index,
	short line_index)
{
	struct line_data *line= get_line_data(line_index);
	short side_index;
	
	if (line->clockwise_polygon_owner==polygon_index)
	{
		side_index= line->clockwise_polygon_side_index;
	}
	else
	{
		assert(line->counterclockwise_polygon_owner==polygon_index);
		side_index= line->counterclockwise_polygon_side_index;
	}
	
	return side_index;
}

bool line_is_landscaped(
	short polygon_index,
	short line_index,
	world_distance z)
{
	bool landscaped= false;
	short side_index= find_adjacent_side(polygon_index, line_index);
	
	if (side_index!=NONE)
	{
		struct line_data *line= get_line_data(line_index);
		struct side_data *side= get_side_data(side_index);
		
		switch (side->type)
		{
			case _full_side:
				landscaped= side->primary_transfer_mode==_xfer_landscape;
				break;
			case _split_side: // render _low_side first
				if (z<line->highest_adjacent_floor)
				{
					landscaped= side->secondary_transfer_mode==_xfer_landscape;
					break;
				}
			case _high_side:
				landscaped= z>line->lowest_adjacent_ceiling ?
					side->primary_transfer_mode==_xfer_landscape :
					side->transparent_transfer_mode==_xfer_landscape;
				break;
			case _low_side:
				landscaped= z<line->highest_adjacent_floor ?
					side->primary_transfer_mode==_xfer_landscape :
					side->transparent_transfer_mode==_xfer_landscape;
				break;
			
			default:
				assert(false);
				break;
		}
	}

	return landscaped;
}

// return the line_index where the two polygons meet (or NONE if they don’t meet)
short find_shared_line(
	short polygon_index1,
	short polygon_index2)
{
	struct polygon_data *polygon= get_polygon_data(polygon_index1);
	short shared_line_index= NONE;
	short i;
	
	for (i=0;i<polygon->vertex_count;++i)
	{
		struct line_data *line= get_line_data(polygon->line_indexes[i]);
		if (line->clockwise_polygon_owner==polygon_index2||line->counterclockwise_polygon_owner==polygon_index2)
		{
			shared_line_index= polygon->line_indexes[i];
			break;
		}
	}
	
	return shared_line_index;
}

_fixed get_object_light_intensity(
	short object_index)
{
	struct object_data *object= get_object_data(object_index);
	struct polygon_data *polygon= get_polygon_data(object->polygon);

	return get_light_intensity(polygon->floor_lightsource_index);
}

// returns the line_index of the line we intersected to leave this polygon, or NONE if destination is in the given polygon
short find_line_crossed_leaving_polygon(
	short polygon_index,
	world_point2d *p0, // origin (not necessairly in polygon_index)
	world_point2d *p1) // destination (not necessairly in polygon_index)
{
	struct polygon_data *polygon= get_polygon_data(polygon_index);
	short intersected_line_index= NONE;
	short i;
	
	for (i= 0; i<polygon->vertex_count; ++i)
	{
		// e1 is clockwise from e0
		world_point2d *e0= &get_endpoint_data(polygon->endpoint_indexes[i])->vertex;
		world_point2d *e1= &get_endpoint_data(polygon->endpoint_indexes[i==polygon->vertex_count-1?0:i+1])->vertex;
		
		// if e0p1 cross e0e1 is negative, p1 is on the outside of edge e0e1 (a result of zero means p1 is on the line e0e1)
		if ((p1->x-e0->x)*(e1->y-e0->y) - (p1->y-e0->y)*(e1->x-e0->x) > 0)
		{
			// if p0e1 cross p0p1 is positive, p0p1 crosses e0e1 to the left of e1
			if ((e1->x-p0->x)*(p1->y-p0->y) - (e1->y-p0->y)*(p1->x-p0->x) <= 0)
			{
				// if p0e0 cross p0p1 is negative or zero, p0p1 crosses e0e1 on or to the right of e0
				if ((e0->x-p0->x)*(p1->y-p0->y) - (e0->y-p0->y)*(p1->x-p0->x) >= 0)
				{
					intersected_line_index= polygon->line_indexes[i];
					break;
				}
			}
		}
	}
	
	return intersected_line_index;
}

// calculate the 3d intersection of the line segment p0p1 with the line e0e1
_fixed find_line_intersection(
	world_point2d *e0,
	world_point2d *e1,
	world_point3d *p0,
	world_point3d *p1,
	world_point3d *intersection)
{
	world_distance dx, dy, dz, line_dx, line_dy;
	int32 numerator, denominator;
	_fixed t;
	
	// calculate line deltas
	dx= p1->x-p0->x, dy= p1->y-p0->y, dz= p1->z-p0->z;
	line_dx= e1->x-e0->x, line_dy= e1->y-e0->y;
	
	// calculate the numerator and denominator to compute t; our basic strategy here is to shift the numerator up by eight bits and the denominator down by eight bits, yeilding a fixed number in [0,FIXED_ONE] for t.  this won’t work if the numerator is greater than or equal to 2^24, or the numerator is less than 2^8.  the first case can’t be fixed in any decent way and shouldn’t happen if we have small deltas.  the second case is approximated with a denominator of 1 or -1 (depending on the sign of the old denominator, although notice here that numbers in [1,2^8) will get downshifted to zero and then set to one, while numbers in (-2^8,-1] will get downshifted to -1 and left there)
	numerator= line_dx*(e0->y-p0->y) + line_dy*(p0->x-e0->x);
	denominator= line_dx*dy - line_dy*dx;
	while (numerator>=(1<<24)||numerator<=((-1)<<24)) numerator>>= 1, denominator>>= 1;
	assert(numerator<(1<<24));
	numerator<<= 8;
	if (!(denominator>>= 8)) denominator= 1;
	t= numerator/denominator;
	
	intersection->x = p0->x + FIXED_INTEGERAL_PART(int32(1LL*t*dx));
	intersection->y = p0->y + FIXED_INTEGERAL_PART(int32(1LL*t*dy));
	intersection->z = p0->z + FIXED_INTEGERAL_PART(int32(1LL*t*dz));
	
	return t;
}

// closest_point may be the same as p; if we’re within 1 of our source point in either direction assume that we are actually at the source point
_fixed closest_point_on_line(
	world_point2d *e0,
	world_point2d *e1,
	world_point2d *p,
	world_point2d *closest_point)
{
	world_distance line_dx, line_dy, dx, dy;
	world_point2d calculated_closest_point;
	int32 numerator, denominator;
	_fixed t;
	
	// calculate dx,dy and line_dx,line_dy
	dx= p->x-e0->x, dy= p->y-e0->y;
	line_dx= e1->x-e0->x, line_dy= e1->y-e0->y;
	
	// same comment as above for calculating t; this is not wholly accurate
	numerator= line_dx*dx + line_dy*dy;
	denominator= line_dx*line_dx + line_dy*line_dy;
	while (numerator>=(1<<23)||numerator<=(-1<<23)) numerator>>= 1, denominator>>= 1;
	numerator<<= 8;
	if (!(denominator>>= 8)) denominator= 1;
	t= numerator/denominator;

	// if we’ve only changed by ±1 in x and y, return the original p to avoid sliding down
		the edge on successive calls
	calculated_closest_point.x= e0->x + FIXED_INTEGERAL_PART(t*line_dx);
	calculated_closest_point.y= e0->y + FIXED_INTEGERAL_PART(t*line_dy);
	switch (calculated_closest_point.x-p->x)
	{
		case -1:
		case 0:
		case 1:
			switch (calculated_closest_point.y-p->y)
			{
				case -1:
				case 0:
				case 1:
					calculated_closest_point= *p;
					break;
			}
	}
	*closest_point= calculated_closest_point;

	return t;
}

void closest_point_on_circle(
	world_point2d *c,
	world_distance radius,
	world_point2d *p,
	world_point2d *closest_point)
{
	world_distance dx= p->x - c->x;
	world_distance dy= p->y - c->y;
	world_distance magnitude= isqrt(dx*dx + dy*dy);

	if (magnitude)
	{
		closest_point->x= c->x + (dx*radius)/magnitude;
		closest_point->y= c->y + (dy*radius)/magnitude;
	}
	else
	{
		*closest_point= *p;
	}
}

void find_center_of_polygon(
	short polygon_index,
	world_point2d *center)
{
	struct polygon_data *polygon= get_polygon_data(polygon_index);
	int32 x= 0, y= 0;
	short i;
	
	for (i=0;i<polygon->vertex_count;++i)
	{
		world_point2d *p= &get_endpoint_data(polygon->endpoint_indexes[i])->vertex;
		
		x+= p->x, y+= p->y;
	}
	
    // polygon->vertex_count could possibly be zero, unsure of what to do here
    // making a note.
	center->x= x/polygon->vertex_count;
	center->y= y/polygon->vertex_count;
}

// calculate 3d intersection of the line p0p1 with the plane z=h
_fixed find_floor_or_ceiling_intersection(
	world_distance h,
	world_point3d *p0,
	world_point3d *p1,
	world_point3d *intersection)
{
	_fixed t;
	world_distance dx, dy, dz;
	
	dx= p1->x-p0->x, dy= p1->y-p0->y, dz= p1->z-p0->z;
	t= dz ? INTEGER_TO_FIXED(h-p0->z)/dz : 0; // if dz==0, return (p0.x,p0.y,h)
	
	intersection->x= p0->x + FIXED_INTEGERAL_PART(int32(1LL*t*dx));
	intersection->y= p0->y + FIXED_INTEGERAL_PART(int32(1LL*t*dy));
	intersection->z= h;
	
	return t;
}

enum // keep out states
{
	_first_line_pass,
	_second_line_pass, // if _first_line_pass yeilded more than one collision we have to go back and make sure we don’t hit anything (or only hit one thing which we hit the first time)
	_second_line_pass_made_contact, // we’ve already hit one thing we hit last time, if we hit anything else then we abort
	_aborted, // if we hit two lines on the second pass, we give up
	_point_pass // checking against all points (and hit as many as we can)
};

// returns height at clipped p1
bool keep_line_segment_out_of_walls(
	short polygon_index, // where we started
	world_point3d *p0,
	world_point3d *p1,
	world_distance maximum_delta_height, // the maximum positive change in height we can tolerate
	world_distance height, // the height of the object being moved
	world_distance *adjusted_floor_height,
	world_distance *adjusted_ceiling_height,
	short *supporting_polygon_index)
{
	struct polygon_data *polygon= get_polygon_data(polygon_index);
	short *indexes= get_map_indexes(polygon->first_exclusion_zone_index, polygon->line_exclusion_zone_count+polygon->point_exclusion_zone_count);
	int32 line_collision_bitmap;
	bool clipped= false;
	short state;
	short i;

	// Skip the whole thing if exclusion-zone indexes were not found
	if (!indexes)
	{
		polygon->line_exclusion_zone_count = 0;
		polygon->point_exclusion_zone_count = 0;
		return clipped;
	}

//	if (polygon_index==23) dprintf("#%d lines, #%d endpoints at %p", polygon->line_exclusion_zone_count, polygon->point_exclusion_zone_count, indexes);

	state= _first_line_pass;
	line_collision_bitmap= 0;
	*supporting_polygon_index= polygon_index;
	*adjusted_floor_height= polygon->floor_height;
	*adjusted_ceiling_height= polygon->ceiling_height;
	do
	{
		for (i=0;i<polygon->line_exclusion_zone_count&&state!=_aborted;++i)
		{
			short signed_line_index= indexes[i];
			short unsigned_line_index= signed_line_index<0 ? -signed_line_index-1 : signed_line_index;
			
			// If there is some map-index screwup...
			if (unsigned_line_index >= dynamic_world->line_count)
				continue;
			
			struct line_data *line= get_line_data(unsigned_line_index);
			short side_index= signed_line_index<0 ? line->counterclockwise_polygon_side_index : line->clockwise_polygon_side_index;
	
//			if (unsigned_line_index==104) dprintf("checking against #%d", unsigned_line_index);
				
			if (side_index!=NONE)
			{
				struct side_exclusion_zone *zone= &get_side_data(side_index)->exclusion_zone;

				if ((p1->x-zone->e0.x)*(zone->e1.y-zone->e0.y) - (p1->y-zone->e0.y)*(zone->e1.x-zone->e0.x) > 0 &&
					(p1->x-zone->e2.x)*(zone->e0.y-zone->e2.y) - (p1->y-zone->e2.y)*(zone->e0.x-zone->e2.x) > 0 &&
					(p1->x-zone->e1.x)*(zone->e3.y-zone->e1.y) - (p1->y-zone->e1.y)*(zone->e3.x-zone->e1.x) > 0)
				{
					short adjacent_polygon_index= signed_line_index<0 ? line->clockwise_polygon_owner : line->counterclockwise_polygon_owner;
					struct polygon_data *adjacent_polygon= adjacent_polygon_index==NONE ? NULL : get_polygon_data(adjacent_polygon_index);
					world_distance lowest_ceiling;
					world_distance highest_floor;

					if (adjacent_polygon) {
						lowest_ceiling= adjacent_polygon->ceiling_height<polygon->ceiling_height ? adjacent_polygon->ceiling_height : polygon->ceiling_height;
						highest_floor= adjacent_polygon->floor_height>polygon->floor_height ? adjacent_polygon->floor_height : polygon->floor_height;
					} else {
						lowest_ceiling = highest_floor = 0;
					}

					// if a) this line is solid, b) the new polygon is farther than maximum_delta height above our feet, or c) the new polygon is lower than the top of our head then we can’t move into the new polygon
					if (LINE_IS_SOLID(line) || adjacent_polygon == NULL ||
						adjacent_polygon->floor_height-p1->z>maximum_delta_height ||
						adjacent_polygon->ceiling_height-p1->z<height ||
						lowest_ceiling-highest_floor<height)
					{
					//	if (unsigned_line_index==104) dprintf("inside solid line #%d (%p) in polygon #%d", unsigned_line_index, line, polygon_index);
						
						switch (state)
						{
							case _first_line_pass:
								// first pass: set the flag and do the clip
								line_collision_bitmap|= 1<<i;
								closest_point_on_line(&zone->e0, &zone->e1, (world_point2d*)p1, (world_point2d*)p1);
								clipped= true;
								break;
							
							case _second_line_pass:
								if (line_collision_bitmap&(1<<i))
								{
									// we hit this line before, change states (we can only hit one thing we hit before)
									closest_point_on_line(&zone->e0, &zone->e1, (world_point2d*)p1, (world_point2d*)p1);
									state= _second_line_pass_made_contact;
								}
								else
								{
									// forget it; we hit something we didn’t hit the first time
									state= _aborted;
								}
								break;
							
							case _second_line_pass_made_contact:
								// we have no tolerance for hitting two things during the second pass
								state= _aborted;
								break;
							
							default:
								assert(false);
						}
					}
					else
					{
						if (adjacent_polygon->floor_height>*adjusted_floor_height) {
							*adjusted_floor_height= adjacent_polygon->floor_height;
							*supporting_polygon_index= adjacent_polygon_index;
						}
						if (adjacent_polygon->ceiling_height>*adjusted_ceiling_height) {
							*adjusted_ceiling_height= adjacent_polygon->ceiling_height;
						}
					}
				}
			}
		}
		
		switch (state)
		{
			case _first_line_pass:
				state= _second_line_pass; break;
			case _second_line_pass:
			case _second_line_pass_made_contact:
				state= _point_pass; break;
		}
	}
	while (state==_second_line_pass);

	// if we didn’t abort while clipping lines, try clipping against points...
	if (state!=_aborted)
	{
		for (i=0;i<polygon->point_exclusion_zone_count;++i)
		{
			short endpoint_index = indexes[polygon->line_exclusion_zone_count+i];
			
			// If there is some map-index screwup...
			if (endpoint_index < 0 || endpoint_index >= dynamic_world->endpoint_count)
				continue;
			
			struct endpoint_data *endpoint= get_endpoint_data(endpoint_index);
			world_distance dx= endpoint->vertex.x-p1->x;
			world_distance dy= endpoint->vertex.y-p1->y;
			int32 distance_squared= dx*dx+dy*dy;
			
//			switch (indexes[polygon->line_exclusion_zone_count+i])
//			{
//				case 34:
//				case 35:
//					dprintf("endpoint#%d is %d away", indexes[polygon->line_exclusion_zone_count+i], distance_squared);
//			}
			
			if (distance_squared<MINIMUM_SEPARATION_FROM_WALL*MINIMUM_SEPARATION_FROM_WALL)
			{
				if (endpoint->highest_adjacent_floor_height-p1->z>maximum_delta_height ||
					endpoint->lowest_adjacent_ceiling_height-p1->z<height ||
					ENDPOINT_IS_SOLID(endpoint))
				{
					closest_point_on_circle(&endpoint->vertex, MINIMUM_SEPARATION_FROM_WALL, (world_point2d*)p1, (world_point2d*)p1);
					clipped= true;
				}
				else
				{
					if (endpoint->highest_adjacent_floor_height>*adjusted_floor_height) *adjusted_floor_height= endpoint->highest_adjacent_floor_height, *supporting_polygon_index= endpoint->supporting_polygon_index;
					if (endpoint->lowest_adjacent_ceiling_height>*adjusted_ceiling_height) *adjusted_ceiling_height= endpoint->lowest_adjacent_ceiling_height;
				}
			}
		}
	}

	if (state==_aborted) p1->x= p0->x, p1->y= p0->y;
	return clipped;
}

// take the line e0e1 and destructively move it perpendicular to itself ("to the left" when looking along e0e1) by the given distance d
void push_out_line(
	world_point2d *e0,
	world_point2d *e1,
	world_distance d,
	world_distance line_length)
{
	world_distance line_dx, line_dy;
	world_distance dx, dy;
	
	// if line_length is zero, calculate it
	if (!line_length) {
		line_length= distance2d(e0, e1);
		if (!line_length)
			return;
	}
	
	// calculate dx, dy (a vector of length d perpendicular (outwards) to the line e0e1
	line_dx= e1->x-e0->x, line_dy= e1->y-e0->y;
	dx= - (d*line_dy)/line_length, dy= (d*line_dx)/line_length;
	
	// adjust the line
	e0->x+= dx, e0->y+= dy;
	e1->x+= dx, e1->y+= dy;
}

// given the ray p0,theta,d, calculate a point p1 such that p1 is on the ray but still inside the [-32k,32k] bounds of our map. p0 can be the same as p1
void ray_to_line_segment(
	world_point2d *p0,
	world_point2d *p1,
	angle theta,
	world_distance d)
{
	short dx= cosine_table[theta], dy= sine_table[theta];
	int32 x= (int32)p0->x + (int32)((d*dx)>>TRIG_SHIFT);
	int32 y= (int32)p0->y + (int32)((d*dy)>>TRIG_SHIFT);
	
	if (x<INT16_MIN) x= INT16_MIN, y= (int32)p0->y + (dy*(INT16_MIN-p0->x))/dx;
	if (x>INT16_MAX) x= INT16_MAX, y= (int32)p0->y + (dy*(INT16_MAX-p0->x))/dx;
	if (y<INT16_MIN) y= INT16_MIN, x= (int32)p0->x + (dx*(INT16_MIN-p0->y))/dy;
	if (y>INT16_MAX) y= INT16_MAX, x= (int32)p0->x + (dx*(INT16_MAX-p0->y))/dy;

	p1->x= x;
	p1->y= y;
}

// computes the squared distance from p to the line segment e0e1
int32 point_to_line_segment_distance_squared(
	world_point2d *p,
	world_point2d *a,
	world_point2d *b)
{
	world_distance abx= b->x-a->x, aby= b->y-a->y;
	world_distance apx= p->x-a->x, apy= p->y-a->y;
	world_distance bpx= p->x-b->x, bpy= p->y-b->y;
	int32 distance;
	
	// if AB dot BP is greather than or equal to zero, d is the distance between B and P
	if (abx*bpx+aby*bpy>=0)
	{
		distance= bpx*bpx + bpy*bpy;
	}
	else
	{
		// if BA dot AP is greather than or equal to zero, d is the distance between A and P (we don’t calculate BA and use -AB instead
		if (abx*apx+aby*apy<=0)
		{
			distance= apx*apx + apy*apy;
		}
		else
		{
			distance= point_to_line_distance_squared(p, a, b);
		}
	}
	
	return distance;
}

int32 point_to_line_distance_squared(
	world_point2d *p,
	world_point2d *a,
	world_point2d *b)
{
	world_distance abx= b->x-a->x, aby= b->y-a->y;
	world_distance apx= p->x-a->x, apy= p->y-a->y;
	int32 signed_numerator;
	uint32 numerator, denominator;
	
	// numerator is absolute value of the cross product of AB and AP, denominator is the magnitude of AB squared
	signed_numerator= apx*aby - apy*abx;
	numerator= std::abs(signed_numerator);
	denominator= abx*abx + aby*aby;

	// before squaring numerator we make sure that it is smaller than fifteen bits (and we adjust the denominator to compensate).  if denominator==0 then we make it ==1.
	while (numerator>=(1<<16)) numerator>>= 1, denominator>>= 2;
	if (!denominator) denominator= 1;
	
	return (numerator*numerator)/denominator;
}

struct map_annotation *get_next_map_annotation(
	short *count)
{
	struct map_annotation *annotation= (struct map_annotation *) NULL;

	if (*count<dynamic_world->default_annotation_count) annotation= map_annotations + (*count)++;
	
	return annotation;
}

// for saving or whatever; finds the highest used index plus one for objects, monsters, projectiles and effects
void recalculate_map_counts(
	void)
{
	struct object_data *object;
	struct monster_data *monster;
	struct projectile_data *projectile;
	struct effect_data *effect;
	struct light_data *light;
	size_t count;
	
	// LP: fixed serious bug in the counting logic
	
	for (count=MAXIMUM_OBJECTS_PER_MAP,object=objects+MAXIMUM_OBJECTS_PER_MAP-1;
			count>0&&(!SLOT_IS_USED(object));
			--count,--object)
		;
	dynamic_world->object_count= static_cast<int16>(count);
	
	for (count=MAXIMUM_MONSTERS_PER_MAP,monster=monsters+MAXIMUM_MONSTERS_PER_MAP-1;
			count>0&&(!SLOT_IS_USED(monster));
			--count,--monster)
		;
	dynamic_world->monster_count= static_cast<int16>(count);
	
	for (count=MAXIMUM_PROJECTILES_PER_MAP,projectile=projectiles+MAXIMUM_PROJECTILES_PER_MAP-1;
			count>0&&(!SLOT_IS_USED(projectile));
			--count,--projectile)
		;
	dynamic_world->projectile_count= static_cast<int16>(count);
	
	for (count=MAXIMUM_EFFECTS_PER_MAP,effect=EffectList.data()+MAXIMUM_EFFECTS_PER_MAP-1;
			count>0&&(!SLOT_IS_USED(effect));
			--count,--effect)
		;
	dynamic_world->effect_count= static_cast<int16>(count);
	
	for (count=MAXIMUM_LIGHTS_PER_MAP,light=lights+MAXIMUM_LIGHTS_PER_MAP-1;
			count>0&&(!SLOT_IS_USED(light));
			--count,--light)
		;
	dynamic_world->light_count= static_cast<int16>(count);
}

bool change_polygon_height(
	short polygon_index,
	world_distance new_floor_height,
	world_distance new_ceiling_height,
	struct damage_definition *damage)
{
	bool legal_change;
	
	// returns false if a monster prevented the given change from ocurring (and probably did damage to him or maybe even caused him to pop)
	legal_change= legal_polygon_height_change(polygon_index, new_floor_height, new_ceiling_height, damage);

	// if this was a legal change, adjust all objects (handle monsters separately)	
	if (legal_change)
	{
		struct polygon_data *polygon= get_polygon_data(polygon_index);
		short object_index= polygon->first_object;

		// Change the objects heights...		
		while (object_index!=NONE)
		{
			struct object_data *object= get_object_data(object_index);
			
			if (OBJECT_IS_VISIBLE(object))
			{
				switch (GET_OBJECT_OWNER(object))
				{
					case _object_is_monster:
						adjust_monster_for_polygon_height_change(object->permutation, polygon_index, new_floor_height, new_ceiling_height);
						break;
					
					default:
						if (object->location.z==polygon->floor_height) object->location.z= new_floor_height;
						break;
				}
			}
			
			object_index= object->next_object;
		}

		// slam the polygon heights, directly
		polygon->floor_height= new_floor_height;
		polygon->ceiling_height= new_ceiling_height;
		
		// the highest_adjacent_floor, lowest_adjacent_ceiling and supporting_polygon_index fields of all of this polygon’s endpoints and lines are potentially invalid now.  to assure that they are correct, recalculate them using the appropriate redundant functions. to do things quickly, slam them yourself.  only these three fields of are invalid, nothing else is effected by the height change.
	}
	
	return legal_change;
}

// we used to check to see that the point in question was within the player’s view cone, but that was queer because stuff would appear behind him all the time (which was completely inconvient when this happened to monsters)
// Added max_players, because this could be called during initial player creation, when dynamic_world->player_count was not valid.
bool point_is_player_visible(
	short max_players,
	short polygon_index,
	world_point2d *p,
	int32 *distance)
{
	short player_index;
	bool visible= false;
	
	*distance= INT32_MAX; // infinite
	for (player_index=0;player_index<max_players;++player_index)
	{
		struct player_data *player= get_player_data(player_index);
		struct monster_data *monster= get_monster_data(player->monster_index);
		struct object_data *object= get_object_data(monster->object_index);

		if (!line_is_obstructed(object->polygon, (world_point2d*)&object->location, polygon_index, p))
		{
			int32 this_distance= guess_distance2d((world_point2d*)&object->location, p);
			
			if (*distance>this_distance) *distance= this_distance;
			visible= true;
		}
	}
	
	return visible;
}

bool point_is_monster_visible(
	short polygon_index,
	world_point2d *p,
	int32 *distance)
{
	size_t  object_count;
	
	*distance = INT32_MAX; // infinite
	
	// LP change:
	IntersectedObjects.clear();
	possible_intersecting_monsters(&IntersectedObjects, LOCAL_INTERSECTING_MONSTER_BUFFER_SIZE, polygon_index, false);
	object_count = IntersectedObjects.size();
	
	for (size_t i=0;i<object_count;++i)
	{
		// LP change:
		struct object_data *object= get_object_data(IntersectedObjects[i]);
		int32 this_distance;
		
		this_distance = guess_distance2d((world_point2d*)&object->location, p);
		if (*distance>this_distance) *distance= this_distance;
	}

	return *distance!=INT32_MAX;
}

bool line_is_obstructed(
	short polygon_index1,
	world_point2d *p1,
	short polygon_index2,
	world_point2d *p2)
{
	short polygon_index= polygon_index1;
	bool obstructed= false;
	short line_index;
	
	do
	{
		bool last_line = false;
		if (film_profile.line_is_obstructed_fix)
		{
			line_index = find_line_crossed_leaving_polygon(polygon_index, (world_point2d *)p1, (world_point2d *)p2);
		}
		else
		{
			line_index= _find_line_crossed_leaving_polygon(polygon_index, (world_point2d *)p1, (world_point2d *)p2, &last_line);
		}

		if (line_index!=NONE)
		{
			if (last_line && polygon_index==polygon_index2) break;
			if (!LINE_IS_SOLID(get_line_data(line_index)))
			{
				// transparent line, find adjacent polygon
				polygon_index= find_adjacent_polygon(polygon_index, line_index);
				assert(polygon_index!=NONE);
			}
			else
			{
				obstructed= true; // non-transparent line
			}
			if (last_line)
			{
				if (polygon_index==polygon_index2) break;
				obstructed= true;
				break;
			}
		}
		else
		{
			// the polygon we ended up in is different than the polygon the caller thinks the destination point is in; this probably means that the source is on a different level than the caller, but it could also easily mean that we’re dealing with weird boundary conditions of find_line_crossed_leaving_polygon()
			if (polygon_index!=polygon_index2) 
			{
				obstructed= true;
				if (film_profile.line_is_obstructed_fix)
				{
					polygon_data* polygon = get_polygon_data(polygon_index);
					polygon_data* polygon2 = get_polygon_data(polygon_index2);
					for (int i = 0; i < polygon->vertex_count; ++i)
					{
						for (int j = 0; j < polygon2->vertex_count; ++j)
						{
							if (polygon->endpoint_indexes[i] == polygon2->endpoint_indexes[j])
							{
								// if our destination polygon shares any endpoints with our actual destination, we're ok
								obstructed = false;
								break;
							}
						}
					}
				}
			}
		}
	}
	while (!obstructed&&line_index!=NONE);

	return obstructed;
}

#define MAXIMUM_GARBAGE_OBJECTS_PER_MAP (get_dynamic_limit(_dynamic_limit_garbage))
#define MAXIMUM_GARBAGE_OBJECTS_PER_POLYGON (get_dynamic_limit(_dynamic_limit_garbage_per_polygon))

void turn_object_to_shit( // garbage that is, garbage
	short garbage_object_index)
{
	struct object_data *garbage_object= get_object_data(garbage_object_index);
	struct polygon_data *polygon= get_polygon_data(garbage_object->polygon);
	short garbage_objects_in_polygon, random_garbage_object_index = 0, object_index;

	struct object_data *object;
	
	// count the number of garbage objects in this polygon
	garbage_objects_in_polygon= 0;
	for (object_index=polygon->first_object;object_index!=NONE;object_index=object->next_object)
	{
		object= get_object_data(object_index);
		if (GET_OBJECT_OWNER(object)==_object_is_garbage)
		{
			random_garbage_object_index= object_index;
			garbage_objects_in_polygon+= 1;
		}
	}
	
	if (garbage_objects_in_polygon>MAXIMUM_GARBAGE_OBJECTS_PER_POLYGON)
	{
		// there are too many garbage objects in this polygon, remove the last (oldest?) one in the linked list
		remove_map_object(random_garbage_object_index);
	}
	else
	{
		// see if we have overflowed the maximum allowable garbage objects per map; if we have then remove an existing piece of shit to make room for the new one (this sort of removal could be really obvious... but who pays attention to dead bodies anyway?)
	  if (dynamic_world->garbage_object_count>=MAXIMUM_GARBAGE_OBJECTS_PER_MAP)
	    {
			// find a garbage object to remove, and do so (we’re certain that many exist)
			for (object_index= garbage_object_index, object= garbage_object;
					SLOT_IS_FREE(object) || GET_OBJECT_OWNER(object)!=_object_is_garbage;
					object_index= (object_index==MAXIMUM_OBJECTS_PER_MAP-1) ? 0 : (object_index+1), object= objects+object_index)
				;
			remove_map_object(object_index);
		}
		else
		{
			dynamic_world->garbage_object_count+= 1;
		}
	}
	
	SET_OBJECT_OWNER(garbage_object, _object_is_garbage);
}

// find an (x,y) and polygon_index for a random point on the given circle, at the same height as the center point
void random_point_on_circle(
	world_point3d *center,
	short center_polygon_index,
	world_distance radius,
	world_point3d *random_point,
	short *random_polygon_index)
{
	world_distance adjusted_floor_height, adjusted_ceiling_height, supporting_polygon_index; // not used
	
	*random_point= *center;
	translate_point2d((world_point2d *)random_point, radius, global_random()&(NUMBER_OF_ANGLES-1));
	keep_line_segment_out_of_walls(center_polygon_index, center, random_point, 0, WORLD_ONE/12,
		&adjusted_floor_height, &adjusted_ceiling_height, &supporting_polygon_index);
	*random_polygon_index= find_new_object_polygon((world_point2d *)center,
		(world_point2d *)random_point, center_polygon_index);
	if (*random_polygon_index!=NONE)
	{
		struct polygon_data *center_polygon= get_polygon_data(center_polygon_index);
		struct polygon_data *random_polygon= get_polygon_data(*random_polygon_index);
		
		if (center_polygon->floor_height!=random_polygon->floor_height) *random_polygon_index= NONE;
	}
}

// ---------- private code

// returns the line_index of the line we intersected to leave this polygon, or NONE if destination is in the given polygon
short _find_line_crossed_leaving_polygon(
	short polygon_index,
	world_point2d *p0, // origin (not necessairly in polygon_index)
	world_point2d *p1, // destination (not necessairly in polygon_index)
	bool *last_line) // set if p1 is on the line leaving the last polygon
{
	struct polygon_data *polygon= get_polygon_data(polygon_index);
	short intersected_line_index= NONE;
	short i;
	
	for (i= 0; i<polygon->vertex_count; ++i)
	{
		// e1 is clockwise from e0
		world_point2d *e0= &get_endpoint_data(polygon->endpoint_indexes[i])->vertex;
		world_point2d *e1= &get_endpoint_data(polygon->endpoint_indexes[i==polygon->vertex_count-1?0:i+1])->vertex;
		int32 not_on_line;
		
		// if e0p1 cross e0e1 is negative, p1 is on the outside of edge e0e1 (a result of zero means p1 is on the line e0e1)
		if ((not_on_line= (p1->x-e0->x)*(e1->y-e0->y) - (p1->y-e0->y)*(e1->x-e0->x)) >= 0)
		{
			// if p0e1 cross p0p1 is positive, p0p1 crosses e0e1 to the left of e1
			if ((e1->x-p0->x)*(p1->y-p0->y) - (e1->y-p0->y)*(p1->x-p0->x) <= 0)
			{
				// if p0e0 cross p0p1 is negative or zero, p0p1 crosses e0e1 on or to the right of e0
				if ((e0->x-p0->x)*(p1->y-p0->y) - (e0->y-p0->y)*(p1->x-p0->x) >= 0)
				{
					intersected_line_index= polygon->line_indexes[i];
					*last_line= !not_on_line;
					break;
				}
			}
		}
	}
	
	return intersected_line_index;
}

static short _new_map_object(
	shape_descriptor shape,
	angle facing)
{
	struct object_data *object;
	short object_index;
	
	for (object_index=0,object=objects;object_index<MAXIMUM_OBJECTS_PER_MAP;++object_index,++object)
	{
		if (SLOT_IS_FREE(object))
		{
			// initialize the object_data structure.  the defaults result in a normal (i.e., scenery), non-solid object.  the rendered, animated and status flags are initially clear.
			object->polygon= NONE;
			object->shape= shape;
			object->facing= facing;
			object->transfer_mode= NONE;
			object->transfer_phase= 0;
			object->permutation= 0;
			object->sequence= 0;
			object->flags= 0;
			object->next_object= NONE;
			object->parasitic_object= NONE;
			object->sound_pitch= FIXED_ONE;
			
			MARK_SLOT_AS_USED(object);
				
			// Objects with a shape of UNONE are invisible.
			if(shape==UNONE)
			{
				SET_OBJECT_INVISIBILITY(object, true);
			}
	
			break;
		}
	}
	if (object_index==MAXIMUM_OBJECTS_PER_MAP) object_index= NONE;
	
	return object_index;
}

bool line_has_variable_height(
	short line_index)
{
	struct line_data *line= get_line_data(line_index);
	struct polygon_data *polygon;

	if(line->clockwise_polygon_owner != NONE)
	{
		if(line->counterclockwise_polygon_owner != NONE)
		{
			polygon= get_polygon_data(line->counterclockwise_polygon_owner);
			if (polygon->type==_polygon_is_platform)
			{
				return true;
			}
		}
		
		polygon= get_polygon_data(line->clockwise_polygon_owner);
		if (polygon->type==_polygon_is_platform)
		{
			return true;
		}		
	}
	
	return false;
}

// ---------- sound code

world_location3d* get_object_sound_location(short object_index) {

	struct object_data* object = get_object_data(object_index);

	switch (GET_OBJECT_OWNER(object)) {
	case _object_is_monster:
		return (world_location3d*)&get_monster_data(object->permutation)->sound_location;
	case _object_is_effect:
	{
		auto object_owner_index = get_effect_data(object->permutation)->data;
		auto object_owner = GetMemberWithBounds(objects, object_owner_index, MAXIMUM_OBJECTS_PER_MAP);
		if (object_owner_index != NONE && object_owner && SLOT_IS_USED(object_owner)) return get_object_sound_location(object_owner_index);
	}
	[[fallthrough]];
	default:
		return (world_location3d*)&object->location;
	}
}

void play_object_sound(
	short object_index,
	short sound_code,
	bool local_sound)
{
	struct object_data *object= get_object_data(object_index);
	SoundManager::instance()->PlaySound(sound_code, local_sound ? 0 : get_object_sound_location(object_index), local_sound ? NONE : object_index, object->sound_pitch);
}

void play_polygon_sound(
	short polygon_index,
	short sound_code)
{
	struct polygon_data *polygon= get_polygon_data(polygon_index);
	world_location3d source;
	
	find_center_of_polygon(polygon_index, (world_point2d *)&source.point);
	source.point.z= polygon->floor_height;
	source.polygon_index= polygon_index;
	
	SoundManager::instance()->PlaySound(sound_code, &source, NONE);
}

void play_side_sound(
	short side_index,
	short sound_code,
	_fixed pitch,
	bool soft_rewind)
{
	struct side_data *side= get_side_data(side_index);
	world_location3d source;

	calculate_line_midpoint(side->line_index, &source.point);
	source.polygon_index= side->polygon_index;

	SoundManager::instance()->PlaySound(sound_code, &source, NONE, pitch, soft_rewind);
}

void play_world_sound(
	short polygon_index,
	world_point3d *origin,
	short sound_code)
{
	world_location3d source;
	
	source.point= *origin;
	source.polygon_index= polygon_index;
	SoundManager::instance()->PlaySound(sound_code, &source, NONE);
}

world_location3d *_sound_listener_proc(
	void)
{
	return (world_location3d *) (current_player && (get_game_state() == _game_in_progress) ?
		&current_player->camera_location :
//		&get_object_data(get_monster_data(current_player->monster_index)->object_index)->location :
		nullptr);
}

// stuff floating on top of media is above it
uint16 _sound_obstructed_proc(
	world_location3d *source)
{
	world_location3d *listener= _sound_listener_proc();
	uint16 flags= 0;
	
	if (listener)
	{
		if (line_is_obstructed(source->polygon_index, (world_point2d *)&source->point,
			listener->polygon_index, (world_point2d *)&listener->point))
		{
			flags|= _sound_was_obstructed;
		}
		else
		{
			struct polygon_data *source_polygon= get_polygon_data(source->polygon_index);
			struct polygon_data *listener_polygon= get_polygon_data(listener->polygon_index);
			bool source_under_media= false, listener_under_media= false;
			
			// LP change: idiot-proofed the media handling
			if (source_polygon->media_index!=NONE)
			{
				media_data *media = get_media_data(source_polygon->media_index);
				if (media)
				{
					if (source->point.z<media->height)
					{
						source_under_media= true;
					}
				}
			}
			
			if (listener_polygon->media_index!=NONE)
			{
				media_data *media = get_media_data(listener_polygon->media_index);
				if (media)
				{
					if (listener->point.z<media->height)
					{
						listener_under_media= true;
					}
				}
			}
			
			if (source_under_media)
			{
				if (!listener_under_media || source_polygon->media_index!=listener_polygon->media_index)
				{
					flags|= _sound_was_media_obstructed;
				}
				else
				{
					flags|= _sound_was_media_muffled;
				}
			}
			else
			{
				if (listener_under_media)
				{
					flags|= _sound_was_media_obstructed;
				}
			}
		}
	}
	
	return flags;
}

// for current player
void _sound_add_ambient_sources_proc(
	void *data,
	add_ambient_sound_source_proc_ptr add_one_ambient_sound_source)
{
	struct world_location3d *listener= _sound_listener_proc();
	
	if (listener)
	{
		struct polygon_data *listener_polygon= get_polygon_data(listener->polygon_index);
		struct media_data *media= listener_polygon->media_index!=NONE ? get_media_data(listener_polygon->media_index) : (struct media_data *) NULL;
		short *indexes= get_map_indexes(listener_polygon->sound_source_indexes, 0);
		world_location3d source;
		bool under_media= false;
		short index;
		
		// add ambient sound image
		if (media && listener->point.z<media->height)
		{
			// if we’re under media don’t play the ambient sound image
			add_one_ambient_sound_source((struct ambient_sound_data *)data, (world_location3d *) NULL, listener,
				get_media_sound(listener_polygon->media_index, _media_snd_ambient_under), MAXIMUM_SOUND_VOLUME);
			under_media= true;
		}
		else
		{
			// if we have an ambient sound image, play it
			if (listener_polygon->ambient_sound_image_index!=NONE)
			{
				struct ambient_sound_image_data *image= get_ambient_sound_image_data(listener_polygon->ambient_sound_image_index);
				
				// LP change: returning NULL means this is invalid; do some editing if necessary
				if (image)
					add_one_ambient_sound_source((struct ambient_sound_data *)data, (world_location3d *) NULL, listener, image->sound_index, image->volume);
				else
					listener_polygon->ambient_sound_image_index = NONE;
			}

			// if we’re over media, play that ambient sound image
			if (media && (media->height>=listener_polygon->floor_height || !MEDIA_SOUND_OBSTRUCTED_BY_FLOOR(media)))
			{
				source= *listener, source.point.z= media->height;
				add_one_ambient_sound_source((struct ambient_sound_data *)data, &source, listener,
					get_media_sound(listener_polygon->media_index, _media_snd_ambient_over), MAXIMUM_SOUND_VOLUME);
			}
		}

		// add ambient sound image from platform
		if (listener_polygon->type==_polygon_is_platform)
		{
			struct platform_data *platform= get_platform_data(listener_polygon->permutation);
			
			if (PLATFORM_IS_ACTIVE(platform) && PLATFORM_IS_MOVING(platform))
			{
				source= *listener, source.point.z= listener_polygon->floor_height;
				add_one_ambient_sound_source((struct ambient_sound_data *)data, &source, listener,
					get_platform_moving_sound(listener_polygon->permutation), MAXIMUM_SOUND_VOLUME);
			}
		}

		// add ambient sound sources
		// do only if indexes were found
		if (indexes)
		{
		while ((index= *indexes++)!=NONE && index < MAXIMUM_SAVED_OBJECTS)
		{
			struct map_object *object= saved_objects + index; // gross, sorry
			struct polygon_data *polygon= get_polygon_data(object->polygon_index);
			struct media_data *media= polygon->media_index!=NONE ? get_media_data(polygon->media_index) : (struct media_data *) NULL;
			short sound_type= object->index;
			short sound_volume= object->facing;
			bool active= true;

			if (sound_volume<0)
			{
				sound_volume= get_light_intensity(-sound_volume)>>8;
			}
			
			// yaw, pitch are irrelevant
			source.point= object->location;
			source.polygon_index= object->polygon_index;
			if (object->flags&_map_object_hanging_from_ceiling)
			{
				source.point.z+= polygon->ceiling_height;
			}
			else
			{
				if ((object->flags&_map_object_floats) && media)
				{
					source.point.z+= media->height;
				}
				else
				{
					source.point.z+= polygon->floor_height;
				}
			}
			
			// adjust source if necessary (like, for a platform)
			if (object->flags&_map_object_is_platform_sound)
			{
				if (polygon->type==_polygon_is_platform && PLATFORM_IS_MOVING(get_platform_data(polygon->permutation)))
				{
					sound_type= get_platform_moving_sound(polygon->permutation);
					source.point.z= listener->point.z; // always on our level
				}
				else
				{
					active= false;
				}
			}

			// .index is environmental sound type, .facing is volume
			// CB: added check for media != NULL because it sometimes crashed here when being underwater
			if (active && (!under_media || (media && source.point.z<media->height && polygon->media_index==listener_polygon->media_index)))
			{
				add_one_ambient_sound_source((struct ambient_sound_data *)data, &source, listener, sound_type, sound_volume);
			}
		}
		}
	}
}

void handle_random_sound_image(
	void)
{
	struct polygon_data *polygon= get_polygon_data(current_player->camera_polygon_index);
	
	if (polygon->random_sound_image_index!=NONE)
	{
		struct random_sound_image_data *image= get_random_sound_image_data(polygon->random_sound_image_index);
		
		// LP change: returning NULL means this is invalid; do some editing if necessary
		if (image)
		{
		// play a random sound
		if (!image->phase)
		{
			short volume= image->volume;
			angle direction= image->direction;
			_fixed pitch= image->pitch;
			
			if (image->delta_volume) volume+= local_random()%image->delta_volume;
			if (image->delta_direction) direction= NORMALIZE_ANGLE(direction + local_random()%image->delta_direction);
			if (image->delta_pitch) pitch+= local_random()%image->delta_pitch;

			SoundManager::instance()->DirectPlaySound(SoundManager::instance()->RandomSoundIndexToSoundIndex(image->sound_index), (image->flags & _sound_image_is_non_directional) ? NONE : direction, volume, pitch);
		}
		
		// lower phase and reset if necessary
		if ((image->phase-= 1)<0)
		{
			image->phase= image->period;
			if (image->delta_period) image->phase+= local_random()%image->delta_period;
		}
		}
		else
			polygon->random_sound_image_index = NONE;
	}
}


// XML elements for parsing the texture-loading specification
// Uses an attribute for loading the landscapes
// and a subelement for specifying which texture in an environment

short **OriginalEnvironments = NULL;

void reset_mml_texture_loading()
{
	LandscapesLoaded = true;
	if (OriginalEnvironments) {
		for (int i = 0; i < NUMBER_OF_ENVIRONMENTS; i++) {
			for (int j = 0; j < NUMBER_OF_ENV_COLLECTIONS; j++)
				Environments[i][j] = OriginalEnvironments[i][j];
			free(OriginalEnvironments[i]);
		}
		free(OriginalEnvironments);
		OriginalEnvironments = NULL;
	}
}

void parse_mml_texture_loading(const InfoTree& root)
{
	// back up old values first
	if (!OriginalEnvironments) {
		OriginalEnvironments = (short **) malloc(sizeof(short *) * NUMBER_OF_ENVIRONMENTS);
		assert(OriginalEnvironments);
		for (int i = 0; i < NUMBER_OF_ENVIRONMENTS; i++) {
			OriginalEnvironments[i] = (short *) malloc(sizeof(short) * NUMBER_OF_ENV_COLLECTIONS);
			assert(OriginalEnvironments[i]);
			for (int j = 0; j < NUMBER_OF_ENV_COLLECTIONS; j++)
				OriginalEnvironments[i][j] = Environments[i][j];
		}
	}
	
	root.read_attr("landscapes", LandscapesLoaded);
	
	for (const InfoTree &env : root.children_named("texture_env"))
	{
		int16 index, which, coll;
		if (env.read_indexed("index", index, NUMBER_OF_ENVIRONMENTS) &&
			env.read_indexed("which", which, NUMBER_OF_ENV_COLLECTIONS) &&
			env.read_indexed("coll", coll, MAXIMUM_COLLECTIONS, true))
		{
			Environments[index][which] = coll;
		}
	}
}
*/
