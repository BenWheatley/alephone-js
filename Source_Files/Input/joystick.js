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
const SDL_CONTROLLER_BUTTON_MAX = 15; // typical max buttons on a controller
const SDL_CONTROLLER_AXIS_MAX = 6;    // typical max axes on a controller
const SDL_CONTROLLER_AXIS_LEFTY = 1;
const SDL_CONTROLLER_AXIS_RIGHTY = 4;

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

function joystick_added(int device_index) {
	// TODO: no-op in JS land, remove it and any calls to it once app is working
}

function joystick_removed(instance_id) {
	// TODO: no-op in JS land, remove it and any calls to it once app is working
	return true;
}
function joystick_axis_moved(instance_id, axis, value) {

	// TODO: Gamepad API [-1, 1], while historical (SDL) API was [-32768, 32767], so this will likely need changes elsewhere, and if something's gone wrong, check this for why
	Logging.logMessage(logDomain, LogLevel.logWarningLevel, 0, 0, "Gamepad API [-1, 1], while historical (SDL) API was [-32768, 32767], so this will likely need changes elsewhere, and if something's gone wrong, check this for why");
	
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
/*
	if (button >= 0 && button < NUM_SDL_JOYSTICK_BUTTONS)
		button_values[button] = down;
*/
}
/*
enum {
	_flags_yaw,
	_flags_pitch,
	NUMBER_OF_ABSOLUTE_POSITION_VALUES
};

typedef struct AxisInfo {
	int key_binding_index;
	int abs_pos_index;
	bool negative;
	
} AxisInfo;

static const std::vector<AxisInfo> axis_mappings = {
	{ 2, _flags_yaw, true },
	{ 3, _flags_yaw, false },
	{ 8, _flags_pitch, true },
	{ 9, _flags_pitch, false }
};

static int axis_mapped_to_action(int action, bool* negative) {
	auto codeset = input_preferences->key_bindings[action];
	for (auto it = codeset.begin(); it != codeset.end(); ++it) {
		const SDL_Scancode code = *it;
		
		if (code < AO_SCANCODE_BASE_JOYSTICK_AXIS_POSITIVE)
			continue;
		if (code > (AO_SCANCODE_BASE_JOYSTICK_BUTTON + NUM_SDL_JOYSTICK_BUTTONS))
			continue;
		
		*negative = false;
		int axis = code - AO_SCANCODE_BASE_JOYSTICK_AXIS_POSITIVE;
		if (code >= AO_SCANCODE_BASE_JOYSTICK_AXIS_NEGATIVE) {
			*negative = true;
			axis = code - AO_SCANCODE_BASE_JOYSTICK_AXIS_NEGATIVE;
		}
		return axis;
	}
	return -1;
}

void joystick_buttons_become_keypresses(Uint8* ioKeyMap) {
    // if we're not using the joystick, avoid this
    if (!joystick_active)
        return;
	if (navigator.getGamepads().length==0)
		return;

	std::set<int> buttons_to_avoid;
	if (input_preferences->controller_analog) {
		// avoid setting buttons mapped to analog aiming
		for (auto it = axis_mappings.begin(); it != axis_mappings.end(); ++it) {
			const AxisInfo info = *it;
			bool negative = false;
			int axis = axis_mapped_to_action(info.key_binding_index, &negative);
			if (axis >= 0) {
				buttons_to_avoid.insert(axis + (negative ? AO_SCANCODE_BASE_JOYSTICK_AXIS_NEGATIVE : AO_SCANCODE_BASE_JOYSTICK_AXIS_POSITIVE));
			}
		}
	}

	for (int i = 0; i < NUM_SDL_JOYSTICK_BUTTONS; ++i) {
		int code = AO_SCANCODE_BASE_JOYSTICK_BUTTON + i;
		if (buttons_to_avoid.count(code) == 0)
			ioKeyMap[code] = button_values[i];
    }
	
    return;
}

int process_joystick_axes(int flags) {
    if (!joystick_active)
        return flags;
	if (navigator.getGamepads.length==0)
		return flags;
	if (!input_preferences->controller_analog)
		return flags;
	
	float angular_deltas[NUMBER_OF_ABSOLUTE_POSITION_VALUES] = { 0, 0 };
	for (auto it = axis_mappings.begin(); it != axis_mappings.end(); ++it) {
		const AxisInfo info = *it;
		bool negative = false;
		int axis = axis_mapped_to_action(info.key_binding_index, &negative);
		if (axis < 0)
			continue;

		short controller_deadzone = 0;
		_fixed controller_sensitivity = 0;
		switch (info.abs_pos_index)
		{
			case _flags_yaw:
				controller_sensitivity = input_preferences->controller_sensitivity_horizontal;
				controller_deadzone = input_preferences->controller_deadzone_horizontal;
				break;
			case _flags_pitch:
				controller_sensitivity = input_preferences->controller_sensitivity_vertical;
				controller_deadzone = input_preferences->controller_deadzone_vertical;
				break;
		}
		
		int val = axis_values[axis] * (negative ? -1 : 1);
		if (val > controller_deadzone) {
			float norm = val/32767.f * (static_cast<float>(controller_sensitivity) / FIXED_ONE);
			constexpr float angle_per_norm = 768/63.f;
			angular_deltas[info.abs_pos_index] += norm * (info.negative ? -1.0 : 1.0) * angle_per_norm;
		}
	}
	
	// return this tick's action flags augmented with movement data
	const fixed_angle dyaw = static_cast<fixed_angle>(angular_deltas[_flags_yaw] * FIXED_ONE);
	const fixed_angle dpitch = static_cast<fixed_angle>(angular_deltas[_flags_pitch] * FIXED_ONE) * (input_preferences->controller_aim_inverted ? -1 : 1);

	if (dyaw != 0 || dpitch != 0)
		flags = process_aim_input(flags, {dyaw, dpitch});
	return flags;
}
*/
