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

void system_alert_user(const char* message, short severity)
{
	NSAlert *alert = [NSAlert new];
	if (severity == infoError) 
	{
		[alert setMessageText: @"Warning"];
		[alert setAlertStyle: NSWarningAlertStyle];
	}
	else
	{
		[alert setMessageText: @"Error"];
		[alert setAlertStyle: NSCriticalAlertStyle];
	}
	[alert setInformativeText: [NSString stringWithUTF8String: message]];
	[alert runModal];
	[alert release];
}

bool system_alert_choose_scenario(char *chosen_dir)
{
	NSOpenPanel *panel = [NSOpenPanel openPanel];
	[panel setCanChooseFiles:NO];
	[panel setCanChooseDirectories:YES];
	[panel setAllowsMultipleSelection:NO];
	[panel setTitle:@"Choose Scenario"];
	[panel setMessage:@"Select a scenario to play:"];
	[panel setPrompt:@"Choose"];
	
	if (!chosen_dir)
		return false;
	
	if ([panel runModal] != NSFileHandlingPanelOKButton)
		return false;
	
	return [[[panel URL] path] getCString:chosen_dir maxLength:256 encoding:NSUTF8StringEncoding];
}

#include "cseries.h"

#include "Logging.h"

#include "sdl_dialogs.h"
#include "sdl_widgets.h"

//  Display alert message

#ifdef __MACOSX__
extern bool system_alert_choose_scenario(char *chosen_dir);
#else
void system_alert_user(const char* message, short severity)
{
#if defined(__WIN32__)
	UINT type;
	if (severity == infoError) {
		type = MB_ICONWARNING|MB_OK;
	} else {
		type = MB_ICONERROR|MB_OK;
	}
	MessageBoxW(NULL, utf8_to_wide(message).c_str(), severity == infoError ? L"Warning" : L"Error", type);
#else
	fprintf(stderr, "%s: %s\n", severity == infoError ? "INFO" : "FATAL", message);
#endif	
}

#if defined(__WIN32__)
// callback to set starting location for Win32 "choose scenario" dialog
static int CALLBACK browse_callback_proc(HWND hwnd, UINT msg, LPARAM lparam, LPARAM lpdata)
{
	WCHAR wcwd[MAX_PATH];
	switch (msg)
	{
		case BFFM_INITIALIZED:
			if (GetCurrentDirectoryW(MAX_PATH, wcwd))
			{
				SendMessageW(hwnd, BFFM_SETEXPANDED, TRUE, (LPARAM)wcwd);
				SendMessageW(hwnd, BFFM_SETSELECTIONW, TRUE, (LPARAM)wcwd);
			}
	}
	return 0;
}
#endif

bool system_alert_choose_scenario(char *chosen_dir)
{
#if defined(__WIN32__)
	BROWSEINFOW bi = { 0 };
	wchar_t path[MAX_PATH];
	bi.lpszTitle = L"Select a scenario to play:";
	bi.pszDisplayName = path;
	bi.lpfn = browse_callback_proc;
	bi.ulFlags = BIF_RETURNONLYFSDIRS | BIF_NEWDIALOGSTYLE | 0x00000200; // no "New Folder" button
	LPITEMIDLIST pidl = SHBrowseForFolderW(&bi);
	if (pidl)
	{
		SHGetPathFromIDListW(pidl, path);
		const int chars_written = WideCharToMultiByte(CP_UTF8, 0, path, -1, chosen_dir, 256, NULL, NULL);
		LPMALLOC pMalloc = NULL;
		SHGetMalloc(&pMalloc);
		pMalloc->Free(pidl);
		pMalloc->Release();
		return chars_written > 0;
	}
#endif
	return false;
}
#endif

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
/*
bool alert_choose_scenario(char *chosen_dir)
{
	return system_alert_choose_scenario(chosen_dir);
}
*/

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
	system_alert_user(message, fatalError);
	abort();
}

*/
