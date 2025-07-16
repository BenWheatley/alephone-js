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

const strPROMPTS = 131;
const _save_game_prompt = 0;
const _save_replay_prompt = 1;
const _select_replay_prompt = 2;
const _default_prompt = 3;

// BobbingType equivalent
const BobbingType = Object.freeze({
	none: 0,
	camera_and_weapon: 1,
	weapon_only: 2
});

const NUMBER_OF_KEYS = 21;
const NUMBER_UNUSED_KEYS = 10;

// Input device identifiers
export const _keyboard_or_game_pad = 0;
export const _mouse_yaw_pitch = 1;

const PREFERENCES_NAME_LENGTH = 32;

/*
 *  shell.cpp - Main game loop and input handling
 */

import * as xml from './XML/xml.js';
import * as cseries from './CSeries/cseries.js';
import * as map from './GameWorld/map.js';
import * as preprocess_map_sdl from './Files/preprocess_map_sdl.js';
/*
#include "monsters.h"
#include "player.h"
#include "render.h"
*/
import * as _interface from './Misc/interface.js';
/*
#include "SoundManager.h"
#include "fades.h"
*/
import * as screen from './RenderOther/screen.js';
import { Music } from './Sound/Music.js';
/*
#include "images.h"
#include "vbl.h"
#include "preferences.h"
#include "tags.h" // for scenario file type..
*/
import * as mouse from './Input/mouse.js';
import * as joystick from './Input/joystick.js';
/*
#include "screen_drawing.h"
#include "computer_interface.h"
#include "game_wad.h" // yuck...
#include "game_window.h" // for draw_interface()
#include "extensions.h"
#include "items.h"
*/
import * as interface_menus from './Misc/interface_menus.js';
/*
#include "weapons.h"
#include "lua_script.h"

#include "Crosshairs.h"
#include "OGL_Render.h"
#include "OGL_Blitter.h"
#include "XML_ParseTreeRoot.h"
#include "FileHandler.h"
#include "Plugins.h"
#include "FilmProfile.h"

#include "mytm.h"	// mytm_initialize(), for platform-specific shell_*.h
*/
import * as resource_manager from './Files/resource_manager.js';
import * as import_definitions from './Files/import_definitions.js';
/*
#include "sdl_dialogs.h"
*/
import { initialize_fonts } from './RenderOther/fonts.js';
/*
#include "sdl_widgets.h"
*/
import * as DefaultStringSets from './Misc/DefaultStringSets.js';
/*
#include "TextStrings.h"

#include "OGL_Headers.h"

#include "alephversion.h"

#include "network.h"
#include "Console.h"
#include "Movie.h"
#include "HTTP.h"
#include "WadImageCache.h"

#include "shell_options.h"
*/

export let scenarioName = "";
export let scenario_dir = ""; // TODO: any ref to searching within a data_search_path array, just directly go here without search

/*
// cross-platform static variables
short vidmasterStringSetID = -1; // can be set with MML
short vidmasterLevelOffset = 1; // can be set with MML
*/
function a1_getenv(name) {
	// Return the base URL of the hosting index page plus the supplied folder name
	const base = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
	return base + name + '/';
}
/*

bool handle_open_document(const std::string& filename)
{
	bool done = false;
	FileSpecifier file(filename);
	switch (file.GetType())
	{
	case _typecode_scenario:
		set_map_file(file);
		if (shell_options.editor && handle_edit_map())
		{
			done = true;
		}
		break;
	case _typecode_savegame:
		if (load_and_start_game(file))
		{
			done = true;
		}
		break;
	case _typecode_film:
		if (handle_open_replay(file))
		{
			done = true;
		}
		break;
	case _typecode_physics:
		set_physics_file(file);
		break;
	case _typecode_shapes:
		open_shapes_file(file);
		break;
	case _typecode_sounds:
		SoundManager::instance()->OpenSoundFile(file);
		break;
	default:
		break;
	}
	
	return done;
}
*/
export async function initialize_application()
{
	const canvas = document.getElementById("glCanvas");
	
	if (!canvas) {
		console.error("Canvas element with id 'glCanvas' not found.");
		return;
	}
	
	window.glContext = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	if (!window.glContext) {
		console.error("Unable to initialize WebGL.");
		return;
	}
	
	// TODO: move all the URLSearchParams stuff to shell_options when that's working
	const urlParams = new URLSearchParams(window.location.search);
	scenarioName = urlParams.get("scenario_name") || "Marathon 2";
	scenario_dir = a1_getenv("ALEPHONE_DEFAULT_DATA") + scenarioName + "/";
	
	DefaultStringSets.InitDefaultStringSets();
	
	import_definitions.init_physics_wad_data();
	initialize_fonts();
/*
	load_film_profile(FILM_PROFILE_DEFAULT);
*/
	// Parse MML files
	await LoadBaseMMLScripts(true);
/*
	// Check for presence of strings
	if (!TS_IsPresent(strERRORS) || !TS_IsPresent(strFILENAMES)) {
		throw std::runtime_error("Can't find required text strings (missing MML?)");
	}
	
	Plugins::instance()->enumerate();
	
	// Load preferences
	initialize_preferences();

	WadImageCache::instance()->initialize_cache();

	if (shell_options.nogl)
		graphics_preferences->screen_mode.acceleration = _no_acceleration;
	if (shell_options.force_fullscreen)
		graphics_preferences->screen_mode.fullscreen = true;
	if (shell_options.force_windowed)		// takes precedence over fullscreen because windowed is safer
		graphics_preferences->screen_mode.fullscreen = false;
	write_preferences();

	Plugins::instance()->load_mml(true);

	if (TTF_Init() < 0)
	{
		std::ostringstream oss;
		oss << "Couldn't initialize SDL_ttf (" << TTF_GetError() << ")";

		throw std::runtime_error(oss.str());
	}
	
	HTTPClient::Init();

	// Initialize everything
	mytm_initialize();
	SoundManager::instance()->Initialize(*sound_preferences);
	*/
	initialize_marathon_music_handler();
	/*
	initialize_keyboard_controller();
	initialize_gamma();
	alephone::Screen::instance()->Initialize(&graphics_preferences->screen_mode);
	initialize_marathon();
	initialize_screen_drawing();
	initialize_dialogs();
	initialize_terminal_manager();
	initialize_shape_handler();
	initialize_fades();
	initialize_images_manager();
	load_environment_from_preferences();
*/
	_interface.initialize_game_state();
}

export function shutdown_application()
{
	/* TODO: consider inserting a hook to a save dialog, but this is nothing like a normal app shutdown and existing code is unlikely to help
	For temporary reference only, old code pointed to:
	WadImageCache::instance()->save_cache();

	shutdown_dialogs();
	*/
}

function networking_available()
{
	return false;
}

function initialize_marathon_music_handler() {
	const url = preprocess_map_sdl.get_default_music_spec();
	if (url != null) {
		Music.instance().SetupIntroMusic(url);
	}
}

/*
bool quit_without_saving(void)
{
	dialog d;
	vertical_placer *placer = new vertical_placer;
	placer->dual_add (new w_static_text("Are you sure you wish to"), d);
	placer->dual_add (new w_static_text("cancel the game in progress?"), d);
	placer->add (new w_spacer(), true);
	
	horizontal_placer *button_placer = new horizontal_placer;
	w_button *default_button = new w_button("YES", dialog_ok, &d);
	button_placer->dual_add (default_button, d);
	button_placer->dual_add (new w_button("NO", dialog_cancel, &d), d);
	d.activate_widget(default_button);
	placer->add(button_placer, true);
	d.set_widget_placer(placer);
	return d.run() == 0;
}

// ZZZ: moved level-numbers widget into sdl_widgets for a wider audience.

const int32 AllPlayableLevels = _single_player_entry_point | _multiplayer_carnage_entry_point | _multiplayer_cooperative_entry_point | _kill_the_man_with_the_ball_entry_point | _king_of_hill_entry_point | _rugby_entry_point | _capture_the_flag_entry_point;

short get_level_number_from_user(void)
{
	// Get levels
	vector<entry_point> levels;
	if (!get_entry_points(levels, AllPlayableLevels)) {
		entry_point dummy;
		dummy.level_number = 0;
		strcpy(dummy.level_name, "Untitled Level");
		levels.push_back(dummy);
	}

	// Create dialog
	dialog d;
	vertical_placer *placer = new vertical_placer;
	if (vidmasterStringSetID != -1 && TS_IsPresent(vidmasterStringSetID) && TS_CountStrings(vidmasterStringSetID) > 0) {
		// if we there's a stringset present for it, load the message from there
		int num_lines = TS_CountStrings(vidmasterStringSetID);

		for (size_t i = 0; i < num_lines; i++) {
			bool message_font_title_color = true;
			const char *string = TS_GetCString(vidmasterStringSetID, i);
			if (!strncmp(string, "[QUOTE]", 7)) {
				string = string + 7;
				message_font_title_color = false;
			}
			if (!strlen(string))
				placer->add(new w_spacer(), true);
			else if (message_font_title_color)
				placer->dual_add(new w_static_text(string), d);
			else
				placer->dual_add(new w_static_text(string), d);
		}

	} else {
		// no stringset or no strings in stringset - use default message
		placer->dual_add(new w_static_text("Before proceeding any further, you"), d);
		placer->dual_add(new w_static_text ("must take the oath of the vidmaster:"), d);
		placer->add(new w_spacer(), true);
		placer->dual_add(new w_static_text("\xd2I pledge to punch all switches,"), d);
		placer->dual_add(new w_static_text("to never shoot where I could use grenades,"), d);
		placer->dual_add(new w_static_text("to admit the existence of no level"), d);
		placer->dual_add(new w_static_text("except Total Carnage,"), d);
		placer->dual_add(new w_static_text("to never use Caps Lock as my \xd4run\xd5 key,"), d);
		placer->dual_add(new w_static_text("and to never, ever, leave a single Bob alive.\xd3"), d);
	}

	placer->add(new w_spacer(), true);
	placer->dual_add(new w_static_text("Start at level:"), d);

	w_levels *level_w = new w_levels(levels, &d);
	level_w->set_offset(vidmasterLevelOffset);
	placer->dual_add(level_w, d);
	placer->add(new w_spacer(), true);
	placer->dual_add(new w_button("CANCEL", dialog_cancel, &d), d);

	d.activate_widget(level_w);
	d.set_widget_placer(placer);

	// Run dialog
	short level;
	if (d.run() == 0)		// OK
		// Should do noncontiguous map files OK
		level = levels[level_w->get_selection()].level_number;
	else
		level = NONE;

	// Redraw main menu
	update_game_window();
	return level;
}
*/
// Constants
const TICKS_BETWEEN_EVENT_POLL = 16; // ~60Hz

export function main_event_loop()
{
/*
	uint32 last_event_poll = 0;
	short game_state;

	while ((game_state = get_game_state()) != _quit_game) {
		uint32 cur_time = machine_tick_count();
		bool yield_time = false;
		bool poll_event = false;

		switch (game_state) {
			case _game_in_progress:
			case _change_level:
				if ((get_fps_target() == 0 && get_keyboard_controller_status()) || Console::instance()->input_active() || cur_time - last_event_poll >= TICKS_BETWEEN_EVENT_POLL) {
					poll_event = true;
					last_event_poll = cur_time;
			  } else {				  
					SDL_PumpEvents ();	// This ensures a responsive keyboard control
			  }
				break;

			case GameStates._display_intro_screens:
			case _display_main_menu:
			case _display_chapter_heading:
			case _display_prologue:
			case _display_epilogue:
			case _begin_display_of_epilogue:
			case _display_credits:
			case _display_intro_screens_for_demo:
			case _display_quit_screens:
			case _displaying_network_game_dialogs:
				yield_time = interface_fade_finished();
				poll_event = true;
				break;

			case _close_game:
			case _switch_demo:
			case _revert_game:
				yield_time = poll_event = true;
				break;
		}

		if (poll_event) {
			global_idle_proc();

			SDL_Event event;
			if (yield_time)
			{
				// The game is not in a "hot" state, yield time to other
				// processes but only try for a maximum of 30ms
				if (SDL_WaitEventTimeout(&event, 30))
				{
					process_event(event);
				}
			}

			while (SDL_PollEvent(&event))
			{
				process_event(event);
			}
		}

		execute_timer_tasks(machine_tick_count());
		idle_game_state(machine_tick_count());

		auto fps_target = get_fps_target();
		if (!get_keyboard_controller_status())
		{
			fps_target = 30;
		}
	
		if (game_state == _game_in_progress && fps_target != 0)
		{
			int elapsed_machine_ticks = machine_tick_count() - cur_time;
			int desired_elapsed_machine_ticks = MACHINE_TICKS_PER_SECOND / fps_target;

			if (desired_elapsed_machine_ticks - elapsed_machine_ticks > desired_elapsed_machine_ticks / 3)
			{
				sleep_for_machine_ticks(1);
			}
		}
		else if (game_state != _game_in_progress)
		{
			static auto last_redraw = 0;
			if (machine_tick_count() > last_redraw + TICKS_PER_SECOND / 30)
			{
				update_game_window();
				last_redraw = machine_tick_count();
			}
		}
	}
*/
}
/*
static bool has_cheat_modifiers(void)
{
	SDL_Keymod m = SDL_GetModState();
#if (defined(__APPLE__) && defined(__MACH__))
	return ((m & KMOD_SHIFT) && (m & KMOD_CTRL)) || ((m & KMOD_ALT) && (m & KMOD_GUI));
#else
	return (m & KMOD_SHIFT) && (m & KMOD_CTRL) && !(m & KMOD_ALT) && !(m & KMOD_GUI);
#endif
}

static bool event_has_cheat_modifiers(const SDL_Event &event)
{
	Uint16 m = event.key.keysym.mod;
#if (defined(__APPLE__) && defined(__MACH__))
	return ((m & KMOD_SHIFT) && (m & KMOD_CTRL)) || ((m & KMOD_ALT) && (m & KMOD_GUI));
#else
	return (m & KMOD_SHIFT) && (m & KMOD_CTRL) && !(m & KMOD_ALT) && !(m & KMOD_GUI);
#endif
}

static void process_screen_click(const SDL_Event &event)
{
	int x = event.button.x, y = event.button.y;
	alephone::Screen::instance()->window_to_screen(x, y);
	portable_process_screen_click(x, y, has_cheat_modifiers());
}

static void handle_game_key(const SDL_Event &event)
{
	SDL_Keycode key = event.key.keysym.sym;
	SDL_Scancode sc = event.key.keysym.scancode;
	bool changed_screen_mode = false;
	bool changed_prefs = false;
	bool changed_resolution = false;

	if (Console::instance()->input_active()) {
		switch(key) {
			case SDLK_RETURN:
			case SDLK_KP_ENTER:
				Console::instance()->enter();
				break;
			case SDLK_ESCAPE:
				Console::instance()->abort();
				break;
			case SDLK_BACKSPACE:
				Console::instance()->backspace();
				break;
			case SDLK_DELETE:
				Console::instance()->del();
				break;
			case SDLK_UP:
				Console::instance()->up_arrow();
				break;
			case SDLK_DOWN:
				Console::instance()->down_arrow();
				break;
			case SDLK_LEFT:
				Console::instance()->left_arrow();
				break;
			case SDLK_RIGHT:
				Console::instance()->right_arrow();
				break;
			case SDLK_HOME:
				Console::instance()->line_home();
				break;
			case SDLK_END:
				Console::instance()->line_end();
				break;
			case SDLK_a:
				if (event.key.keysym.mod & KMOD_CTRL)
					Console::instance()->line_home();
				break;
			case SDLK_b:
				if (event.key.keysym.mod & KMOD_CTRL)
					Console::instance()->left_arrow();
				break;
			case SDLK_d:
				if (event.key.keysym.mod & KMOD_CTRL)
					Console::instance()->del();
				break;
			case SDLK_e:
				if (event.key.keysym.mod & KMOD_CTRL)
					Console::instance()->line_end();
				break;
			case SDLK_f:
				if (event.key.keysym.mod & KMOD_CTRL)
					Console::instance()->right_arrow();
				break;
			case SDLK_h:
				if (event.key.keysym.mod & KMOD_CTRL)
					Console::instance()->backspace();
				break;
			case SDLK_k:
				if (event.key.keysym.mod & KMOD_CTRL)
					Console::instance()->forward_clear();
				break;
			case SDLK_n:
				if (event.key.keysym.mod & KMOD_CTRL)
					Console::instance()->down_arrow();
				break;
			case SDLK_p:
				if (event.key.keysym.mod & KMOD_CTRL)
					Console::instance()->up_arrow();
				break;
			case SDLK_t:
				if (event.key.keysym.mod & KMOD_CTRL)
					Console::instance()->transpose();
				break;
			case SDLK_u:
				if (event.key.keysym.mod & KMOD_CTRL)
					Console::instance()->clear();
				break;
			case SDLK_w:
				if (event.key.keysym.mod & KMOD_CTRL)
					Console::instance()->delete_word();
				break;
		}
	}
	else
	{
		if (sc == SDL_SCANCODE_ESCAPE || sc == AO_SCANCODE_JOYSTICK_ESCAPE) // (ZZZ) Quit gesture (now safer)
		{
			if(!player_controlling_game())
				do_menu_item_command(mGame, iQuitGame, false);
			else {
				if(get_ticks_since_local_player_in_terminal() > 1 * TICKS_PER_SECOND) {
					if(!game_is_networked) {
						do_menu_item_command(mGame, iQuitGame, false);
					}
					else {
#if defined(__APPLE__) && defined(__MACH__)
						screen_printf("If you wish to quit, press Command-Q");
#else
						screen_printf("If you wish to quit, press Alt+Q.");
#endif
					}
				}
			}
		}
		else if (input_preferences->shell_key_bindings[_key_volume_up].count(sc))
		{
			changed_prefs = SoundManager::instance()->AdjustVolumeUp(Sound_AdjustVolume());
		}
		else if (input_preferences->shell_key_bindings[_key_volume_down].count(sc))
		{
			changed_prefs = SoundManager::instance()->AdjustVolumeDown(Sound_AdjustVolume());
		}
		else if (input_preferences->shell_key_bindings[_key_switch_view].count(sc))
		{
			walk_player_list();
			render_screen(NONE);
		}
		else if (input_preferences->shell_key_bindings[_key_zoom_in].count(sc))
		{
			if (zoom_overhead_map_in())
				PlayInterfaceButtonSound(Sound_ButtonSuccess());
			else
				PlayInterfaceButtonSound(Sound_ButtonFailure());
		}
		else if (input_preferences->shell_key_bindings[_key_zoom_out].count(sc))
		{
			if (zoom_overhead_map_out())
				PlayInterfaceButtonSound(Sound_ButtonSuccess());
			else
				PlayInterfaceButtonSound(Sound_ButtonFailure());
		}
		else if (input_preferences->shell_key_bindings[_key_inventory_left].count(sc))
		{
			if (player_controlling_game()) {
				PlayInterfaceButtonSound(Sound_ButtonSuccess());
				scroll_inventory(-1);
			} else
				decrement_replay_speed();
		}
		else if (input_preferences->shell_key_bindings[_key_inventory_right].count(sc))
		{
			if (player_controlling_game()) {
				PlayInterfaceButtonSound(Sound_ButtonSuccess());
				scroll_inventory(1);
			} else
				increment_replay_speed();
		}
		else if (input_preferences->shell_key_bindings[_key_toggle_fps].count(sc))
		{
			PlayInterfaceButtonSound(Sound_ButtonSuccess());
			extern bool displaying_fps;
			displaying_fps = !displaying_fps;
		}
		else if (input_preferences->shell_key_bindings[_key_activate_console].count(sc))
		{
			if (game_is_networked) {
#if !defined(DISABLE_NETWORKING)
				Console::instance()->activate_input(InGameChatCallbacks::SendChatMessage, InGameChatCallbacks::prompt());
#endif
				PlayInterfaceButtonSound(Sound_ButtonSuccess());
			} 
			else if (Console::instance()->use_lua_console())
			{
				PlayInterfaceButtonSound(Sound_ButtonSuccess());
				Console::instance()->activate_input(ExecuteLuaString, ">");
			}
			else
			{
				PlayInterfaceButtonSound(Sound_ButtonFailure());
			}
		} 
		else if (input_preferences->shell_key_bindings[_key_show_scores].count(sc))
		{
			PlayInterfaceButtonSound(Sound_ButtonSuccess());
			{
				extern bool ShowScores;
				ShowScores = !ShowScores;
			}
		}	
		else if (sc == SDL_SCANCODE_F1) // Decrease screen size
		{
			if (!graphics_preferences->screen_mode.hud)
			{
				PlayInterfaceButtonSound(Sound_ButtonSuccess());
				graphics_preferences->screen_mode.hud = true;
				changed_screen_mode = changed_prefs = true;
			}
			else
			{
				int mode = alephone::Screen::instance()->FindMode(get_screen_mode()->width, get_screen_mode()->height);
				if (mode < alephone::Screen::instance()->GetModes().size() - 1)
				{
					PlayInterfaceButtonSound(Sound_ButtonSuccess());
					graphics_preferences->screen_mode.width = alephone::Screen::instance()->ModeWidth(mode + 1);
					graphics_preferences->screen_mode.height = alephone::Screen::instance()->ModeHeight(mode + 1);
					graphics_preferences->screen_mode.auto_resolution = false;
					graphics_preferences->screen_mode.hud = false;
					changed_screen_mode = changed_prefs = changed_resolution = true;
				} else
					PlayInterfaceButtonSound(Sound_ButtonFailure());
			}
		}
		else if (sc == SDL_SCANCODE_F2) // Increase screen size
		{
			if (graphics_preferences->screen_mode.hud)
			{
				PlayInterfaceButtonSound(Sound_ButtonSuccess());
				graphics_preferences->screen_mode.hud = false;
				changed_screen_mode = changed_prefs = true;
			}
			else
			{
				int mode = alephone::Screen::instance()->FindMode(get_screen_mode()->width, get_screen_mode()->height);
				int automode = get_screen_mode()->fullscreen ? 0 : 1;
				if (mode > automode)
				{
					PlayInterfaceButtonSound(Sound_ButtonSuccess());
					graphics_preferences->screen_mode.width = alephone::Screen::instance()->ModeWidth(mode - 1);
					graphics_preferences->screen_mode.height = alephone::Screen::instance()->ModeHeight(mode - 1);
					if ((mode - 1) == automode)
						graphics_preferences->screen_mode.auto_resolution = true;
					graphics_preferences->screen_mode.hud = true;
					changed_screen_mode = changed_prefs = changed_resolution = true;
				} else
					PlayInterfaceButtonSound(Sound_ButtonFailure());
			}
		}
		else if (sc == SDL_SCANCODE_F3) // Resolution toggle
		{
			if (!OGL_IsActive()) {
				PlayInterfaceButtonSound(Sound_ButtonSuccess());
				if (graphics_preferences->screen_mode.high_resolution) {
					graphics_preferences->screen_mode.high_resolution = false;
					graphics_preferences->screen_mode.draw_every_other_line = false;
				} else if (!graphics_preferences->screen_mode.draw_every_other_line) {
					graphics_preferences->screen_mode.draw_every_other_line = true;
				} else {
					graphics_preferences->screen_mode.high_resolution = true;
					graphics_preferences->screen_mode.draw_every_other_line = false;
				}
				changed_screen_mode = changed_prefs = true;
			} else
				PlayInterfaceButtonSound(Sound_ButtonFailure());
		}
		else if (sc == SDL_SCANCODE_F4)		// Reset OpenGL textures
		{
			if (OGL_IsActive()) {
				// Play the button sound in advance to get the full effect of the sound
				PlayInterfaceButtonSound(Sound_OGL_Reset());
				OGL_ResetTextures();
			} else
				PlayInterfaceButtonSound(Sound_ButtonInoperative());
		}
		else if (sc == SDL_SCANCODE_F5) // Make the chase cam switch sides
		{
			if (ChaseCam_IsActive())
				PlayInterfaceButtonSound(Sound_ButtonSuccess());
			else
				PlayInterfaceButtonSound(Sound_ButtonInoperative());
			ChaseCam_SwitchSides();
		}
		else if (sc == SDL_SCANCODE_F6) // Toggle the chase cam
		{
			PlayInterfaceButtonSound(Sound_ButtonSuccess());
			ChaseCam_SetActive(!ChaseCam_IsActive());
		}
		else if (sc == SDL_SCANCODE_F7) // Toggle tunnel vision
		{
			PlayInterfaceButtonSound(Sound_ButtonSuccess());
			SetTunnelVision(!GetTunnelVision());
		}
		else if (sc == SDL_SCANCODE_F8) // Toggle the crosshairs
		{
			PlayInterfaceButtonSound(Sound_ButtonSuccess());
			player_preferences->crosshairs_active = !player_preferences->crosshairs_active;
			Crosshairs_SetActive(player_preferences->crosshairs_active);
			changed_prefs = true;
		}
		else if (sc == SDL_SCANCODE_F9) // Screen dump
		{
			dump_screen();
		}
		else if (sc == SDL_SCANCODE_F10) // Toggle the position display
		{
			PlayInterfaceButtonSound(Sound_ButtonSuccess());
			{
				extern bool ShowPosition;
				ShowPosition = !ShowPosition;
			}
		}
		else if (sc == SDL_SCANCODE_F11) // Decrease gamma level
		{
			if (graphics_preferences->screen_mode.gamma_level) {
				PlayInterfaceButtonSound(Sound_ButtonSuccess());
				graphics_preferences->screen_mode.gamma_level--;
				change_gamma_level(graphics_preferences->screen_mode.gamma_level);
				changed_prefs = true;
			} else
				PlayInterfaceButtonSound(Sound_ButtonFailure());
		}
		else if (sc == SDL_SCANCODE_F12) // Increase gamma level
		{
			if (graphics_preferences->screen_mode.gamma_level < NUMBER_OF_GAMMA_LEVELS - 1) {
				PlayInterfaceButtonSound(Sound_ButtonSuccess());
				graphics_preferences->screen_mode.gamma_level++;
				change_gamma_level(graphics_preferences->screen_mode.gamma_level);
				changed_prefs = true;
			} else
				PlayInterfaceButtonSound(Sound_ButtonFailure());
		}
		else
		{
			if (get_game_controller() == _demo)
				set_game_state(_close_game);
		}
	}
	
	if (changed_screen_mode) {
		screen_mode_data temp_screen_mode = graphics_preferences->screen_mode;
		temp_screen_mode.fullscreen = get_screen_mode()->fullscreen;
		change_screen_mode(&temp_screen_mode, true, changed_resolution);
		render_screen(0);
	}

	if (changed_prefs)
		write_preferences();
}

static void process_game_key(const SDL_Event &event)
{
	switch (get_game_state()) {
	case _game_in_progress:
#if defined(__APPLE__) && defined(__MACH__)
		if ((event.key.keysym.mod & KMOD_GUI))
#else
		if ((event.key.keysym.mod & KMOD_ALT) || (event.key.keysym.mod & KMOD_GUI))
#endif
		{
			int item = -1;
			switch (event.key.keysym.sym) {
			case SDLK_p:
				item = iPause;
				break;
			case SDLK_s:
				item = iSave;
				break;
			case SDLK_r:
				item = iRevert;
				break;
			case SDLK_q:
// On Mac, this key will trigger the application menu so we ignore it here
#if !defined(__APPLE__) && !defined(__MACH__)
				item = iQuitGame;
#endif
				break;
			case SDLK_RETURN:
				item = 0;
				toggle_fullscreen();
				break;
			default:
				break;
			}
			if (item > 0)
				do_menu_item_command(mGame, item, event_has_cheat_modifiers(event));
			else if (item != 0)
				handle_game_key(event);
		} else
			handle_game_key(event);
		break;
	case GameStates._display_intro_screens:
	case _display_chapter_heading:
	case _display_prologue:
	case _display_epilogue:
	case _display_credits:
	case _display_quit_screens:
		if (interface_fade_finished())
			force_game_state_change();
		else
			stop_interface_fade();
		break;

	case _display_intro_screens_for_demo:
		stop_interface_fade();
		display_main_menu();
		break;

	case _quit_game:
	case _close_game:
	case _revert_game:
	case _switch_demo:
	case _change_level:
	case _begin_display_of_epilogue:
	case _displaying_network_game_dialogs:
		break;

	case _display_main_menu: 
	{
		if (!interface_fade_finished())
			stop_interface_fade();
		int item = -1;
		switch (event.key.keysym.sym) {
		case SDLK_n:
			item = iNewGame;
			break;
		case SDLK_o:
			item = iLoadGame;
			break;
		case SDLK_g:
			item = iGatherGame;
			break;
		case SDLK_j:
			item = iJoinGame;
			break;
		case SDLK_p:
			item = iPreferences;
			break;
		case SDLK_r:
			item = iReplaySavedFilm;
			break;
		case SDLK_c:
			item = iCredits;
			break;
		case SDLK_q:
			item = iQuit;
			break;
		case SDLK_F9:
			dump_screen();
			break;
		case SDLK_RETURN:
#if defined(__APPLE__) && defined(__MACH__)
			if ((event.key.keysym.mod & KMOD_GUI))
#else
			if ((event.key.keysym.mod & KMOD_GUI) || (event.key.keysym.mod & KMOD_ALT))
#endif
			{
				toggle_fullscreen();
			} else {
				process_main_menu_highlight_select(event_has_cheat_modifiers(event));
			}
			break;
		case SDLK_a:
			item = iAbout;
			break;
		case SDLK_UP:
		case SDLK_LEFT:
			process_main_menu_highlight_advance(true);
			break;
		case SDLK_DOWN:
		case SDLK_RIGHT:
			process_main_menu_highlight_advance(false);
			break;
		case SDLK_TAB:
			process_main_menu_highlight_advance(event.key.keysym.mod & KMOD_SHIFT);
			break;
		case SDLK_UNKNOWN:
			switch (static_cast<int>(event.key.keysym.scancode)) {
				case AO_SCANCODE_BASE_JOYSTICK_BUTTON + SDL_CONTROLLER_BUTTON_DPAD_UP:
				case AO_SCANCODE_BASE_JOYSTICK_BUTTON + SDL_CONTROLLER_BUTTON_DPAD_LEFT:
					process_main_menu_highlight_advance(true);
					break;
				case AO_SCANCODE_BASE_JOYSTICK_BUTTON + SDL_CONTROLLER_BUTTON_DPAD_DOWN:
				case AO_SCANCODE_BASE_JOYSTICK_BUTTON + SDL_CONTROLLER_BUTTON_DPAD_RIGHT:
					process_main_menu_highlight_advance(false);
					break;
				case AO_SCANCODE_BASE_JOYSTICK_BUTTON + SDL_CONTROLLER_BUTTON_A:
					process_main_menu_highlight_select(false);
					break;
				case AO_SCANCODE_BASE_JOYSTICK_BUTTON + SDL_CONTROLLER_BUTTON_GUIDE:
					process_main_menu_highlight_select(true);
					break;
				default:
					break;
			}
			break;
		default:
			break;
		}
		if (item > 0) {
			draw_menu_button_for_command(item);
			do_menu_item_command(mInterface, item, event_has_cheat_modifiers(event));
		}
		break;
	}
	}
}

static void process_event(const SDL_Event &event)
{
	switch (event.type) {
	case SDL_MOUSEMOTION:
		if (get_game_state() == _game_in_progress)
		{
			mouse_moved(event.motion.xrel, event.motion.yrel);
		}
		break;
	case SDL_MOUSEWHEEL:
		if (get_game_state() == _game_in_progress)
		{
			bool up = (event.wheel.y > 0);
#if SDL_VERSION_ATLEAST(2,0,4)
			if (event.wheel.direction == SDL_MOUSEWHEEL_FLIPPED)
				up = !up;
#endif
			mouse_scroll(up);
		}
		break;
	case SDL_MOUSEBUTTONDOWN:
		if (get_game_state() == _game_in_progress) 
		{
			if (!get_keyboard_controller_status())
			{
				resume_game();
			}
			else
			{
				SDL_Event e2;
				memset(&e2, 0, sizeof(SDL_Event));
				e2.type = SDL_KEYDOWN;
				e2.key.keysym.sym = SDLK_UNKNOWN;
				e2.key.keysym.scancode = (SDL_Scancode)(AO_SCANCODE_BASE_MOUSE_BUTTON + event.button.button - 1);
				process_game_key(e2);
			}
		}
		else
			process_screen_click(event);
		break;
	
	case SDL_CONTROLLERBUTTONDOWN:
		if (get_game_state() == _game_in_progress && !get_keyboard_controller_status())
		{
			resume_game();
		}
		else
		{
			joystick_button_pressed(event.cbutton.which, event.cbutton.button, true);
			SDL_Event e2;
			memset(&e2, 0, sizeof(SDL_Event));
			e2.type = SDL_KEYDOWN;
			e2.key.keysym.sym = SDLK_UNKNOWN;
			e2.key.keysym.scancode = (SDL_Scancode)(AO_SCANCODE_BASE_JOYSTICK_BUTTON + event.cbutton.button);
			process_game_key(e2);
		}
		break;
		
	case SDL_CONTROLLERBUTTONUP:
		joystick_button_pressed(event.cbutton.which, event.cbutton.button, false);
		break;
		
	case SDL_CONTROLLERAXISMOTION:
		joystick_axis_moved(event.caxis.which, event.caxis.axis, event.caxis.value);
		break;
	
	case SDL_JOYDEVICEADDED:
		joystick_added(event.jdevice.which);
		break;
			
	case SDL_JOYDEVICEREMOVED:
		if (joystick_removed(event.jdevice.which) && get_game_state() == _game_in_progress);
			pause_game();
		break;
			
	case SDL_KEYDOWN:
		process_game_key(event);
		break;

	case SDL_TEXTINPUT:
		if (Console::instance()->input_active()) {
		    Console::instance()->textEvent(event);
		}
		break;
		
	case SDL_QUIT:
		if (get_game_state() == _game_in_progress)
			do_menu_item_command(mGame, iQuitGame, false);
		else
			set_game_state(_quit_game);
		break;

	case SDL_WINDOWEVENT:
		switch (event.window.event) {
			case SDL_WINDOWEVENT_FOCUS_LOST:
				if (get_game_state() == _game_in_progress && get_keyboard_controller_status() && !Movie::instance()->IsRecording() && shell_options.replay_directory.empty()) {
					pause_game();
				}

				set_game_focus_lost();
				break;
			case SDL_WINDOWEVENT_FOCUS_GAINED:
#if (defined(__APPLE__) && defined(__MACH__))
    			// work around Mojave issue
				static bool gFirstWindow = true;
				if (gFirstWindow) {
					gFirstWindow = false;
					SDL_Window *win = SDL_GetWindowFromID(event.window.windowID);
					if (!MainScreenIsOpenGL() && (SDL_GetWindowFlags(win) & SDL_WINDOW_FULLSCREEN_DESKTOP)) {
						SDL_SetWindowFullscreen(win, 0);
						SDL_SetWindowFullscreen(win, SDL_WINDOW_FULLSCREEN_DESKTOP);
					} else {
						SDL_Window *w2 = SDL_CreateWindow("Loading", 0, 0, 100, 100, 0);
						SDL_RaiseWindow(w2);
						SDL_RaiseWindow(win);
						SDL_DestroyWindow(w2);
					}
				}
#endif
				set_game_focus_gained();
				break;
		}
		break;
	}
	
}

std::string to_alnum(const std::string& input)
{
	std::string output;
	for (std::string::const_iterator it = input.begin(); it != input.end(); ++it)
	{
		if (isalnum(*it))
		{
			output += *it;
		}
	}

	return output;
}
*/
export function dump_screen()
{
	// Generate a timestamped filename
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const filename = `screenshot_${timestamp}.png`;
	
	// Convert content of WebGL context' canvas to data URL
	const dataURL = glContext.canvas.toDataURL('image/png');
	
	// Create a temporary link element to trigger download
	const link = document.createElement('a');
	link.href = dataURL;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

async function _ParseMMLDirectory(dir, load_menu_mml_only) {
	// TODO: JS can't read a directory listing from a web server, as a temporary workaround this semi-hard-coded list is going to make guesses based on what's in `Marathon 2/Scripts/`
	let files = ["Filenames.mml", `${scenarioName}.mml`, "Default Preferences.xml"];
	for (const file of files) {
		await xml.ParseMMLFromFile(new URL(file, dir), load_menu_mml_only);
	};
}

async function LoadBaseMMLScripts(load_menu_mml_only) {
	await _ParseMMLDirectory(new URL('MML/', scenario_dir), load_menu_mml_only);
	await _ParseMMLDirectory(new URL('Scripts/', scenario_dir), load_menu_mml_only);
}

/*			   
bool expand_symbolic_paths_helper(char *dest, const char *src, int maxlen, const char *symbol, DirectorySpecifier& dir)
{
   int symlen = strlen(symbol);
   if (!strncmp(src, symbol, symlen))
   {
	   strncpy(dest, dir.GetPath(), maxlen);
	   dest[maxlen] = '\0';
	   strncat(dest, &src[symlen], maxlen-strlen(dest));
	   return true;
   }
   return false;
}

bool contract_symbolic_paths_helper(char *dest, const char *src, int maxlen, const char *symbol, DirectorySpecifier &dir)
{
   const char *dpath = dir.GetPath();
   int dirlen = strlen(dpath);
   if (!strncmp(src, dpath, dirlen))
   {
	   strncpy(dest, symbol, maxlen);
	   dest[maxlen] = '\0';
	   strncat(dest, &src[dirlen], maxlen-strlen(dest));
	   return true;
   }
   return false;
}

// LP: the rest of the code has been moved to Jeremy's shell_misc.file.

void PlayInterfaceButtonSound(short SoundID)
{
	if (TEST_FLAG(input_preferences->modifiers,_inputmod_use_button_sounds))
		SoundManager::instance()->PlaySound(SoundID, (world_location3d *) NULL, NONE);
}
*/