/*
Based on JOYSTICK.H and JOYSTICK_SDL.CPP in original repo

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
#include "cstypes.h"
*/
// Constants roughly matching the original numeric values (SDL constants not defined in JS)
// TODO: rename when this is finished, there is no SDL in this project
const SDL_CONTROLLER_BUTTON_MAX = 21; // typical max buttons on a controller
const SDL_CONTROLLER_AXIS_MAX = 6;    // typical max axes on a controller
const SDL_CONTROLLER_AXIS_LEFTY = 1;
const SDL_CONTROLLER_AXIS_RIGHTY = 3;
const SDL_CONTROLLER_BUTTON_START = 6;

// this is where we start stuffing button presses into the big keymap array,
// comfortably past SDL2's defined scancodes
const AO_SCANCODE_BASE_JOYSTICK_BUTTON = 415;
const AO_SCANCODE_BASE_JOYSTICK_AXIS_POSITIVE = AO_SCANCODE_BASE_JOYSTICK_BUTTON + SDL_CONTROLLER_BUTTON_MAX;
const AO_SCANCODE_BASE_JOYSTICK_AXIS_NEGATIVE = AO_SCANCODE_BASE_JOYSTICK_AXIS_POSITIVE + SDL_CONTROLLER_AXIS_MAX;
const NUM_SDL_JOYSTICK_BUTTONS = SDL_CONTROLLER_BUTTON_MAX + 2 * SDL_CONTROLLER_AXIS_MAX;

const AO_SCANCODE_JOYSTICK_ESCAPE = AO_SCANCODE_BASE_JOYSTICK_BUTTON + SDL_CONTROLLER_BUTTON_START;

/*
#include "player.h" // for mask_in_absolute_positioning_information
#include "preferences.h"
*/
import * as Logging from '../Misc/Logging.js';

// internal handles
let joystick_active = true;
const axis_values = new Array(SDL_CONTROLLER_AXIS_MAX).fill(0);
const button_values = new Array(NUM_SDL_JOYSTICK_BUTTONS).fill(false);

function enter_joystick() {
	joystick_active = true;
}

function exit_joystick() {
	joystick_active = false;
}

function joystick_added(device_index) {
	// TODO: no-op in JS land, remove it and any calls to it once app is working
}

function joystick_removed(instance_id) {
	// TODO: no-op in JS land, remove it and any calls to it once app is working
	return true;
}
function joystick_axis_moved(instance_id, axis, value) {
	// TODO: Gamepad API [-1, 1], while historical (SDL) API was [-32768, 32767], so this will likely need changes elsewhere, and if something's gone wrong, check this for why
	Logging.logMessage(Logging.Level.note, 0, 0, "Gamepad API [-1, 1], while historical (SDL) API was [-32768, 32767], so this will likely need changes elsewhere, and if something's gone wrong, check this for why");
	
	// Flip Y axes to match historical behavior
	if (axis === 1 || axis === 4) { // LEFTY or RIGHTY
		axis_values[axis] = -value;
	} else {
		axis_values[axis] = value;
	}
	
	// Determine digital button states based on analog threshold
	// TODO: we could make the game better with the option of analog (slow) movement!
	const positiveIndex = AO_SCANCODE_BASE_JOYSTICK_AXIS_POSITIVE - AO_SCANCODE_BASE_JOYSTICK_BUTTON + axis;
	const negativeIndex = AO_SCANCODE_BASE_JOYSTICK_AXIS_NEGATIVE - AO_SCANCODE_BASE_JOYSTICK_BUTTON + axis;
	button_values[positiveIndex] = (value >= 0.5);
	button_values[negativeIndex] = (value <= -0.5);
}

function joystick_button_pressed(instance_id, button, down) {
	if (button >= 0 && button < NUM_SDL_JOYSTICK_BUTTONS) {
		button_values[button] = down;
	}
}

const _flags_yaw = 0;
const _flags_pitch = 1;
const NUMBER_OF_ABSOLUTE_POSITION_VALUES = 2;

const axis_mappings = [
	{ key_binding_index: 2, abs_pos_index: _flags_yaw, negative: true },
	{ key_binding_index: 3, abs_pos_index: _flags_yaw, negative: false },
	{ key_binding_index: 8, abs_pos_index: _flags_pitch, negative: true },
	{ key_binding_index: 9, abs_pos_index: _flags_pitch, negative: false },
];

/** Since JS lacks pointer semantics, negative_out must be passed as an object:
let neg = { value: false };
let axis = axis_mapped_to_action(action_index, neg);
*/
function axis_mapped_to_action(action, negative_out) {
	const codeset = input_preferences.key_bindings[action]; // TODO: needs preferences.h stubbed out at least
	if (!codeset) {
		return -1;
	}
	
	for (let i = 0; i < codeset.length; ++i) {
		const code = codeset[i];
		
		if (code < AO_SCANCODE_BASE_JOYSTICK_AXIS_POSITIVE)
			continue;
		if (code > (AO_SCANCODE_BASE_JOYSTICK_BUTTON + NUM_SDL_JOYSTICK_BUTTONS))
			continue;
		
		let negative = false;
		
		let axis = code - AO_SCANCODE_BASE_JOYSTICK_AXIS_POSITIVE;
		if (code >= AO_SCANCODE_BASE_JOYSTICK_AXIS_NEGATIVE) {
			negative = true;
			axis = code - AO_SCANCODE_BASE_JOYSTICK_AXIS_NEGATIVE;
		}
		
		// TODO: does this actually work in JS-land?
		if (negative_out) {
			negative_out.value = negative;
		}
		
		return axis;
	}
	
	return -1;
}

function joystick_buttons_become_keypresses(ioKeyMap) {
	// if we're not using the joystick, avoid this
	if (!joystick_active) {
		return;
	}
	if (navigator.getGamepads().length==0) {
		return;
	}
	
	const buttons_to_avoid = new Set();
	if (input_preferences.controller_analog) {  // TODO: needs preferences.h stubbed out at least
		// avoid setting buttons mapped to analog aiming
		for (const info of axis_mappings) {
			const negative_out = { value: false };
			const axis = axis_mapped_to_action(info.key_binding_index, negative_out);
			if (axis >= 0) {
				const code = axis + (negative_out.value
					? AO_SCANCODE_BASE_JOYSTICK_AXIS_NEGATIVE
					: AO_SCANCODE_BASE_JOYSTICK_AXIS_POSITIVE);
				buttons_to_avoid.add(code);
			}
		}
	}
	for (let i = 0; i < NUM_SDL_JOYSTICK_BUTTONS; ++i) {
		const code = AO_SCANCODE_BASE_JOYSTICK_BUTTON + i;
		if (!buttons_to_avoid.has(code)) {
			ioKeyMap[code] = button_values[i];
		}
	}
}

function process_joystick_axes(flags) {
	if (!joystick_active) {
		return flags;
	}
	if (navigator.getGamepads.length==0) {
		return flags;
	}
	if (!input_preferences.controller_analog) {
		return flags;
	}
	
	const angular_deltas = new Array(NUMBER_OF_ABSOLUTE_POSITION_VALUES).fill(0);
	
	for (const info of axis_mappings) {
		const negative_out = { value: false };
		const axis = axis_mapped_to_action(info.key_binding_index, negative_out);
		if (axis < 0) {
			continue;
		}
		
		let controller_deadzone = 0;
		let controller_sensitivity = 0;
		
		switch (info.abs_pos_index) {
			case _flags_yaw:
				controller_sensitivity = input_preferences.controller_sensitivity_horizontal;
				controller_deadzone = input_preferences.controller_deadzone_horizontal;
				break;
			case _flags_pitch:
				controller_sensitivity = input_preferences.controller_sensitivity_vertical;
				controller_deadzone = input_preferences.controller_deadzone_vertical;
				break;
		}
		// TODO: new API [-1, 1], vs old [-32768, 32767], so `controller_deadzone` may be broken
		Logging.logMessage(Logging.Level.note, 0, 0, "TODO: new API [-1, 1], vs old [-32768, 32767], so `controller_deadzone` may be broken");
		
		const val = axis_values[axis] * (negative_out.value ? -1 : 1);
		if (val > controller_deadzone) {
			const norm = val * controller_sensitivity;
			const angle_per_norm = 768 / 63;
			const delta = norm * (info.negative ? -1 : 1) * angle_per_norm;
			angular_deltas[info.abs_pos_index] += delta;
		}
	}
	
	// TODO: no longer using fixed point, so `norm`, `dyaw`, `dpitch` may be off by constant factor
	Logging.logMessage(Logging.Level.note, 0, 0, "TODO: no longer using fixed point, so `norm`, `dyaw`, `dpitch` may be off by constant factor");
	
	// return this tick's action flags augmented with movement data
	const dyaw = angular_deltas[_flags_yaw];
	let dpitch = angular_deltas[_flags_pitch] * (input_preferences.controller_aim_inverted ? -1 : 1);
	if (dyaw !== 0 || dpitch !== 0) {
		flags = process_aim_input(flags, { dyaw, dpitch });
	}
	
	return flags;
}
