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
#include "world.h"
*/
const NUM_SDL_REAL_MOUSE_BUTTONS = 5;
const NUM_SDL_MOUSE_BUTTONS = 7;   		  // two scroll-wheel buttons
export const AO_SCANCODE_BASE_MOUSE_BUTTON = 400; // this is button 1's pseudo-keysym
export const AO_SCANCODE_MOUSESCROLL_UP = 405;    // stored as mouse button 6
export const AO_SCANCODE_MOUSESCROLL_DOWN = 406;  // stored as mouse button 7

import * as cseries from '../CSeries/cseries.js';

/*
#include "player.h"
*/
import * as shell from '../shell.js';
/*
#include "preferences.h"
*/
import * as screen from '../RenderOther/screen.js';
import { audioContext } from '../Sound/SoundManager.js';

// Global variables
let mouse_active = false;
let button_mask = 0; // Mask of enabled buttons
let mouselook_delta = { yaw: 0, pitch: 0 };
let snapshot_delta_scrollwheel = 0.0;
let snapshot_delta_x = 0.0;
let snapshot_delta_y = 0.0;

// Initialize in-game mouse handling

export function enter_mouse(type) {
	if (type !== shell._keyboard_or_game_pad) {
		const canvas = document.getElementById("glCanvas");
		canvas.requestPointerLock(); // Will fail if this wasn't invoked by user action
		mouse_active = true;
		mouselook_delta = { yaw: 0, pitch: 0 };
		snapshot_delta_scrollwheel = 0;
		snapshot_delta_x = 0;
		snapshot_delta_y = 0;
		button_mask = 0;
	}
}

// Shutdown in-game mouse handling

export function exit_mouse(type) {
	if (type !== shell._keyboard_or_game_pad) {
		document.exitPointerLock();
		mouse_active = false;
	}
}

function MIX(start, end, factor) {
	return (start * (1.0 - factor)) + (end * factor);
}

// Take a snapshot of the current mouse state
export function mouse_idle(type) {
	if (!mouse_active) return;

	let dx = snapshot_delta_x;
	let dy = -snapshot_delta_y;

	snapshot_delta_x = 0;
	snapshot_delta_y = 0;

	if (TEST_FLAG(input_preferences.modifiers, 'invert_mouse'))
		dy = -dy;

	const angle_per_scaled_delta = 128 / 66;

	let sx = angle_per_scaled_delta * input_preferences.sens_horizontal;
	let sy = angle_per_scaled_delta * input_preferences.sens_vertical * (input_preferences.classic_vertical_aim ? 0.25 : 1.0);

	if (input_preferences.mouse_accel_type == _mouse_accel_classic) {
		sx *= MIX(1.0, (1 / 32.0) * Math.abs(dx * sx), input_preferences.mouse_accel_scale);
		sy *= MIX(1.0, (1 / (input_preferences.classic_vertical_aim ? 8.0 : 32.0)) * Math.abs(dy * sy), input_preferences.mouse_accel_scale);
	}

	const dyaw = sx * x;
	const dpitch = sy * y;

	mouselook_delta = { yaw: dyaw, pitch: dpitch };
}

/*
fixed_yaw_pitch pull_mouselook_delta()
{
	auto delta = mouselook_delta;
	mouselook_delta = {0, 0};
	return delta;
}
*/
export let currentMouseButtons = 0;
/*
void
mouse_buttons_become_keypresses(Uint8* ioKeyMap)
{
		uint8 buttons = currentMouseButtons;
		uint8 orig_buttons = buttons;
		buttons &= button_mask;				// Mask out disabled buttons

        for(int i = 0; i < NUM_SDL_REAL_MOUSE_BUTTONS; i++) {
            ioKeyMap[AO_SCANCODE_BASE_MOUSE_BUTTON + i] =
                (buttons & SDL_BUTTON(i+1)) ? SDL_PRESSED : SDL_RELEASED;
        }
		ioKeyMap[AO_SCANCODE_MOUSESCROLL_UP] = (snapshot_delta_scrollwheel > 0) ? SDL_PRESSED : SDL_RELEASED;
		ioKeyMap[AO_SCANCODE_MOUSESCROLL_DOWN] = (snapshot_delta_scrollwheel < 0) ? SDL_PRESSED : SDL_RELEASED;
		snapshot_delta_scrollwheel = 0;

        button_mask |= ~orig_buttons;		// A button must be released at least once to become enabled
}

*/
export function hide_cursor() {
	document.body.style.cursor = 'none';
}

export function show_cursor() {
	document.body.style.cursor = 'default';
}

function mouse_scroll(event) {
	let up = event.deltaY < 0;
	snapshot_delta_scrollwheel += up ? 1 : -1;
	console.log(snapshot_delta_scrollwheel);
	shell.push_event(event);
}

function mouse_moved(event) {
	snapshot_delta_x += event.movementX;
	snapshot_delta_y += event.movementY;
	console.log(snapshot_delta_x + ", "+ snapshot_delta_y);
	shell.push_event(event);
}

// === DOM Event Bindings ===

window.addEventListener("mousemove", (event) => {
	if (!mouse_active || document.pointerLockElement !== document.body) return;
	mouse_moved(event);
});

window.addEventListener("wheel", (event) => {
	mouse_scroll(event);
});

window.addEventListener("mousedown", event => {
	currentMouseButtons |= (1 << event.button);
	shell.push_event(event);
});

window.addEventListener("mouseup", event => {
	currentMouseButtons &= ~(1 << event.button);
	shell.push_event(event);
});

window.addEventListener('click', async () => {
	await audioContext.resume();
return; // TODO: re-enable full screen after debugging, it's annoying to have to exit immediately all the tiime
	try {
		const canvas = document.getElementById("canvasContainer");
		await canvas.requestFullscreen();
	} catch (err) {
		console.error(`Error enabling fullscreen: ${err.message}`);
	};
}, { once: true });

document.addEventListener('fullscreenchange', () => {
	const canvas = document.getElementById("canvasContainer");
	
	if (document.fullscreenElement === canvas) {
		// TODO: figure out how to actually change resolution and not just scale this container to fit
		//setCanvasContainerSize(window.screen.width, window.screen.height);
		canvas.classList.remove('game_frame');
	} else {
		setCanvasContainerSize(800, 600);
		canvas.classList.add('game_frame');
	}
});

function setCanvasContainerSize(width, height) {
	const list = ["canvasContainer", "glCanvas", "2DCanvas"].map(item => document.getElementById(item));
	canvas.width = width;
	canvas.height = height;
	canvas.style.width = `${canvas.width}px`;
	canvas.style.height = `${canvas.height}px`;
}