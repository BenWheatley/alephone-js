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

// Menus available during the game
const mGame = 128;
const iPause = 1;
const iSave = 2;
const iRevert = 3;
const iCloseGame = 4;
const iQuitGame = 5;

// Menu interface...
const mInterface = 129;
const iNewGame = 1;
const iLoadGame = 2;
const iGatherGame = 3;
const iJoinGame = 4;
const iPreferences = 5;
const iReplayLastFilm = 6;
const iSaveLastFilm = 7;
const iReplaySavedFilm = 8;
const iCredits = 9;
const iQuit = 10;
const iCenterButton = 11;
const iPlaySingletonLevel = 12;
const iAbout = 13;

/* This is the menu with nothing in the title, so that it doesn't show up */
/* when the menu bar is drawn atexit.. */
const mFakeEmptyMenu = 130;
