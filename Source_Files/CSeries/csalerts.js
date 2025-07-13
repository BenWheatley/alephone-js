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

export const infoError = 0;
export const fatalError = 1;
export const infoNoError = 2;

/*
void alert_user_fatal(short resid, short item, int error)
{
	alert_user(fatalError, resid, item, error);
	halt();
}
void alert_out_of_memory(int error) { alert_user_fatal(128, 14, error); }
void alert_bad_extra_file(int error) { alert_user_fatal(128, 5, error); }
void alert_corrupted_map(int error) { alert_user_fatal(128, 23, error); }



#undef assert
#ifdef DEBUG
#define assert(what) ((what) ? (void)0 : _alephone_assert(__FILE__,__LINE__,"Assertion failed: " #what))
#define vassert(what,message) ((what) ? (void)0 : _alephone_assert(__FILE__,__LINE__,(message)))
#define warn(what) ((what) ? (void)0 : _alephone_warn(__FILE__,__LINE__,"Assertion failed: " #what))
#define vwarn(what,message) ((what) ? (void)0 : _alephone_warn(__FILE__,__LINE__,(message)))
#else
#define assert(what) ((void) 0)
#define vassert(what,message) ((void) 0)
#define warn(what) ((void) 0)
#define vwarn(what,message) ((void) 0)
#endif

// "fast code" assert: disabled by default, enabled under DEBUG_FAST_CODE
#ifdef DEBUG_FAST_CODE
#define fc_assert(what) assert(what)
#define fc_vassert(what,message) vassert(what,message)
#else
#define fc_assert(what) ((void) 0)
#define fc_vassert(what,message) ((void) 0)
#endif

#endif

#import <Cocoa/Cocoa.h>
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

void system_launch_url_in_browser(const char *url)
{
	NSURL *urlref = [NSURL URLWithString:[NSString stringWithUTF8String:url]];
	[[NSWorkspace sharedWorkspace] openURL:urlref];
}

#include "cseries.h"

#include "Logging.h"

#include "sdl_dialogs.h"
#include "sdl_widgets.h"

#if defined(__WIN32__)
#else
#include <sys/wait.h>
#endif

//  Display alert message

#ifdef __MACOSX__
extern void system_alert_user(const char*, short);
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

#ifdef __MACOSX__
extern void system_launch_url_in_browser(const char *url);
#else
void system_launch_url_in_browser(const char *url)
{
#if defined(__WIN32__)
	ShellExecuteW(NULL, L"open", utf8_to_wide(url).c_str(), NULL, NULL, SW_SHOWNORMAL);
#else
	pid_t pid = fork();
	if (pid == 0)
	{
		// try xdg-open first, fallback to sensible-browser
		execlp("xdg-open", "xdg-open", url, NULL);
		execlp("sensible-browser", "sensible-browser", url, NULL);
		exit(0);  // in case exec fails
	}
	else if (pid > 0)
	{
		int childstatus;
		wait(&childstatus);
	}
#endif
}
#endif

const int MAX_ALERT_WIDTH = 320;

extern void update_game_window(void);
extern bool MainScreenVisible(void);

void alert_user(const char *message, short severity) 
{
#ifndef A1_NETWORK_STANDALONE_HUB

	if (!MainScreenVisible()) {
		std::string title;
		uint32 box_type;
		switch (severity) {
			case fatalError:
				title = "Error";
				box_type = SDL_MESSAGEBOX_ERROR;
				break;
			case infoNoError:
				title = "Information";
				box_type = SDL_MESSAGEBOX_INFORMATION;
				break;
			case infoError:
			default:
				title = "Warning";
				box_type = SDL_MESSAGEBOX_WARNING;
				break;
		}
	SDL_ShowSimpleMessageBox(box_type, title.c_str(), message, NULL);
  } else {

	std::string title;
	std::string box_button;
	switch (severity) {
		case fatalError:
			title = "ERROR";
			box_button = "QUIT";
			break;
		case infoNoError:
			title = "INFORMATION";
			box_button = "OK";
			break;
		case infoError:
		default:
			title = "WARNING";
			box_button = "OK";
			break;
	}

    dialog d;
    vertical_placer *placer = new vertical_placer;
    placer->dual_add(new w_title(title.c_str()), d);
    placer->add(new w_spacer, true);
    
    // Wrap lines
    uint16 style;
    font_info *font = get_theme_font(MESSAGE_WIDGET, style);
    char *t = strdup(message);
    char *p = t;

    while (strlen(t)) {
      unsigned i = 0, last = 0;
      int width = 0;
      while (i < strlen(t) && width < MAX_ALERT_WIDTH) {
	width = text_width(t, i, font, style);
	if (t[i] == ' ')
	  last = i;
	i++;
      }
      if (i != strlen(t))
	t[last] = 0;
      placer->dual_add(new w_static_text(t), d);
      if (i != strlen(t))
	t += last + 1;
      else
	t += i;
    }
    free(p);
    placer->add(new w_spacer, true);
    w_button *button = new w_button(box_button.c_str(), dialog_ok, &d);
    placer->dual_add (button, d);
    d.set_widget_placer(placer);

    d.activate_widget(button);

    d.run();
    if (severity != fatalError && top_dialog == NULL)
      update_game_window();
  }

#endif

  if (severity == fatalError) exit(1);
}

void alert_user(short severity, short resid, short item, int error)
{
  char str[256];
  getcstr(str, resid, item);
  char msg[300];
  sprintf(msg, "%s (error %d)", str, error);
  if (severity == infoError) {
    logError("alert (ID=%hd): %s", error, str);
  } else if (severity == fatalError) {
    logFatal("fatal alert (ID=%hd): %s", error, str);
  }
  alert_user(msg, severity);
}

bool alert_choose_scenario(char *chosen_dir)
{
	return system_alert_choose_scenario(chosen_dir);
}

void launch_url_in_browser(const char *url)
{
	fprintf(stderr, "System launch url: %s\n", url);
	system_launch_url_in_browser(url);
}


extern "C" void debugger(const char *message);

//  Jump into debugger (and return)

void pause_debug(void)
{
        logNote("pause_debug called");
	fprintf(stderr, "pause\n");
}


//  Display message

void vpause(const char *message)
{
        logWarning("vpause: %s", message);
	fprintf(stderr, "vpause %s\n", message);
}


//  Jump into debugger (and don't return)

void halt(void)
{
        logFatal("halt called");
	fprintf(stderr, "halt\n");
	abort();
}


//  Display message and halt

extern void stop_recording();
extern void shutdown_application();

void vhalt(const char *message)
{
	stop_recording();
        logFatal("vhalt: %s", message);
	GetCurrentLogger()->flush();
	shutdown_application();
	system_alert_user(message, fatalError);
	abort();
}


//  Assertion failed

static char assert_text[256];

void _alephone_assert(const char *file, int32 line, const char *what)
{
	vhalt(csprintf(assert_text, "%s:%d: %s", file, line, what));
}

void _alephone_warn(const char *file, int32 line, const char *what)
{
	vpause(csprintf(assert_text, "%s:%d: %s", file, line, what));
}

*/
