/* cspaths.h

	Copyright (C) 2017 and beyond by Jeremiah Morris
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

/* The following are commented out rather than deleted, because while they don't make any sense in JS-land, I need to be able to find this message when their names cause a JS runtime or compile-time error:
export const CSPathType = Object.freeze({
	kPathLocalData: 0,
	kPathDefaultData: 1,
	kPathLegacyData: 2,
	kPathBundleData: 3,
	kPathLogs: 4,
	kPathPreferences: 5,
	kPathLegacyPreferences: 6,
	kPathScreenshots: 7,
	kPathSavedGames: 8,
	kPathQuickSaves: 9,
	kPathImageCache: 10,
	kPathRecordings: 11
});
*/

export function get_application_name() {
	return "Aleph One JS";
}
