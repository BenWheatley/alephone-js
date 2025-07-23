/*

	Copyright (C) 1991-2001 and beyond by Bo Lindbergh
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

import * as cstrings from './csstrings.js';

export const infoError = 0;
export const fatalError = 1;
export const infoNoError = 2;

export function alert_user_fatal(resid, item, error) {
	alert_user(fatalError, resid, item, error);
	// Original code called halt() here, but that's not sensible in JS
}

export function alert_out_of_memory(error) {
	alert_user_fatal(128, 14, error);
}

export function alert_bad_extra_file(error) {
	alert_user_fatal(128, 5, error);
}

export function alert_corrupted_map(error) {
	alert_user_fatal(128, 23, error);
}

/*
#include "cstypes.h"

#include "cseries.h"

#include "Logging.h"

#include "sdl_dialogs.h"
#include "sdl_widgets.h"
*/

export function alert_user(...args) {
	if (args.length === 2) {
		alert_user_2(...args);
	} else {
		alert_user_4(...args);
	}
}

function alert_user_2(message, severity) {
	const title = {
		[fatalError]: "Error",
		[infoNoError]: "Information",
		[infoError]: "Warning"
	}[severity];
	window.alert(`${title}:\n\n${message}`);
}

function alert_user_4(severity, resid, item, error) {
	let str = cseries.getcstr(resid, item);
	const msg = `${str} (error ${error})`;
	if (severity == infoError) {
		Logging.logError(`alert (ID=${error}): ${str}`);
	} else if (severity == fatalError) {
		Logging.logFatal(`fatal alert (ID=${error}): ${str}`);
	}
	alert_user(msg, severity);
}

export function launch_url_in_browser(urlString) {
	window.open(urlString, '_blank');
}

/*

void vhalt(const char *message)
{
	stop_recording();
        logFatal("vhalt: %s", message);
	GetCurrentLogger()->flush();
	shutdown_application();
	alert(message + ", " + fatalError);
	abort();
}

*/
