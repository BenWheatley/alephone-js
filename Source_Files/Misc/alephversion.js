/*
	Copyright (C) 2002 and beyond by the "Aleph One" developers
 
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

export const A1JS_DISPLAY_NAME = "Aleph One JS";

// TODO: version/date version should come from config file. Also, these are used to test things like plugin compatibility with the canonical Aleph One, which won't really make sense going forward.
export const A1JS_DISPLAY_VERSION = "1.0.0";
export const A1JS_DISPLAY_DATE_VERSION = "2025-07-13";
export const A1JS_DATE_VERSION = "20250713";

export const A1JS_DISPLAY_PLATFORM = "Web/JS";

export const A1JS_VERSION_STRING = A1JS_DISPLAY_PLATFORM + " " + A1JS_DISPLAY_DATE_VERSION + " " + A1JS_DISPLAY_VERSION;

export const A1JS_HOMEPAGE_URL = "https://github.com/BenWheatley/alephone-js";

// TODO: I don't know if I'll be able to make net play work at all, but it's definitely not going to be on *my* hosts if I do, so continue to ref the lhowon ones
export const A1_METASERVER_HOST = "metaserver.lhowon.org";
export const A1_METASERVER_LOGIN_URL = "https://metaserver.lhowon.org/metaclient/login";
export const A1_METASERVER_SIGNUP_URL = "https://metaserver.lhowon.org/metaclient/signup";
export const A1_METASERVER_SETTINGS_URL = "https://metaserver.lhowon.org/metaclient/settings";
export const A1_LEADERBOARD_URL = "https://stats.lhowon.org/";
export const A1_STATSERVER_ADD_URL = "https://stats.lhowon.org/statclient/add";
