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
#include "cstypes.h"

#include "cseries.h"
#include "FileHandler.h"
*/

import * as Logging from '../Misc/Logging.js';

export function is_applesingle(data, rsrc_fork) {
	const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
	
	// Check header
	const id = dv.getUint32(0, false);      // Big-endian
	const version = dv.getUint32(4, false); // Big-endian
	if (id != 0x00051600 || version != 0x00020000) return null;
	
	// Find fork
	const req_id = rsrc_fork ? 2 : 1;
	let base = 0x18;
	const num_entries = dv.getUint16(base, false); // Big-endian
	base += 2;
	for (let i = 0; i < num_entries; i++) {
		const entry_id = dv.getUint32(base, false); // Big-endian
		const ofs      = dv.getUint32(base + 4, false); // Big-endian
		const len      = dv.getUint32(base + 8, false); // Big-endian
		if (entry_id === req_id) {
			return {offset: ofs, length: len};
		}
		base += 12;
	}
	
	return null;
}

export function is_macbinary(data) {
	// This recognizes up to macbinary III (0x81)
	if (data.length < 128) return null;

	const header = data.subarray(0, 128);
	if (header[0] !== 0 || header[1] > 63 || header[74] !== 0 || header[123] > 0x81) {
		return null;
	}

	// Check CRC
	let crc = 0;
	for (let i = 0; i < 124; i++) {
		let bits = header[i] << 8;
		for (let j = 0; j < 8; j++) {
			if ((bits ^ crc) & 0x8000)
				crc = (crc << 1) ^ 0x1021;
			else
				crc <<= 1;
			crc &= 0xFFFF; // To make it act like it's a 16 bit number again
			bits <<= 1;
		}
	}

	const expected_crc = (header[124] << 8) | header[125];
	if (crc !== expected_crc) {
		Logging.logAnomaly("CRC checksum failed");
		return null;
	}

	// Extract data fork and resource fork lengths
	const data_length =
		(header[83] << 24) |
		(header[84] << 16) |
		(header[85] << 8) |
		header[86];

	const rsrc_length =
		(header[87] << 24) |
		(header[88] << 16) |
		(header[89] << 8) |
		header[90];

	return {data_length: data_length, rsrc_length: rsrc_length};
}

/*
// Structure for open resource file
struct res_file_t {
	res_file_t() : f(NULL) {}
	res_file_t(SDL_RWops *file) : f(file) {}
	res_file_t(const res_file_t &other) {f = other.f;}
	~res_file_t() {}

	const res_file_t &operator=(const res_file_t &other)
	{
		if (this != &other)
			f = other.f;
		return *this;
	}

	bool read_map(void);
	size_t count_resources(uint32 type) const;
	void get_resource_id_list(uint32 type, vector<int> &ids) const;
	bool get_resource(uint32 type, int id, LoadedResource &rsrc) const;
	bool get_ind_resource(uint32 type, int index, LoadedResource &rsrc) const;
	bool has_resource(uint32 type, int id) const;

	SDL_RWops *f;		// Opened resource file

	typedef map<int, uint32> id_map_t;			// Maps resource ID to offset to resource data
	typedef map<uint32, id_map_t> type_map_t;	// Maps resource type to ID map

	type_map_t types;	// Map of all resource types found in file
};


// List of open resource files
static list<res_file_t *> res_file_list;
static list<res_file_t *>::iterator cur_res_file_t;


static list<res_file_t *>::iterator find_res_file_t(SDL_RWops *f)
{
	list<res_file_t *>::iterator i, end = res_file_list.end();
	for (i=res_file_list.begin(); i!=end; i++) {
		res_file_t *r = *i;
		if (r->f == f)
			return i;
	}
	return res_file_list.end();
}

// external resources: terminals for Marathon 1
OpenedResourceFile ExternalResources;

void set_external_resources_file(FileSpecifier& f)
{
	f.Open(ExternalResources);
}

bool res_file_t::read_map(void)
{
	SDL_RWseek(f, 0, SEEK_END);
	uint32 file_size = SDL_RWtell(f);
	SDL_RWseek(f, 0, SEEK_SET);
	uint32 fork_start = 0;

        if(file_size < 16) {
            if(file_size == 0)
                logNote("file has zero length");
            else
                logAnomaly("file too small (%d bytes) to be valid", file_size);
            return false;
        }

	// Determine file type (AppleSingle and MacBinary II files are handled transparently)
	int32 offset, data_length, rsrc_length;
	if (is_applesingle(f, true, offset, rsrc_length)) {
                logTrace("file is_applesingle");
		fork_start = offset;
		file_size = offset + rsrc_length;
	} else if (is_macbinary(f, data_length, rsrc_length)) {
                logTrace("file is_macbinary");
		fork_start = 128 + ((data_length + 0x7f) & ~0x7f);
		file_size = fork_start + rsrc_length;
	}
        else
                logTrace("file is raw resource fork format");

	// Read resource header
	SDL_RWseek(f, fork_start, SEEK_SET);
	uint32 data_offset = SDL_ReadBE32(f) + fork_start;
	uint32 map_offset = SDL_ReadBE32(f) + fork_start;
	uint32 data_size = SDL_ReadBE32(f);
	uint32 map_size = SDL_ReadBE32(f);
        logDump("resource header: data offset %d, map_offset %d, data_size %d, map_size %d", data_offset, map_offset, data_size, map_size);

	// Verify integrity of resource header
	if (data_offset >= file_size || map_offset >= file_size ||
	    data_offset + data_size > file_size || map_offset + map_size > file_size) {
		logTrace("file's resource header corrupt");
		return false;
	}

	// Read map header
	SDL_RWseek(f, map_offset + 24, SEEK_SET);
	uint32 type_list_offset = map_offset + SDL_ReadBE16(f);
	//uint32 name_list_offset = map_offset + SDL_ReadBE16(f);
	//printf(" type_list_offset %d, name_list_offset %d\n", type_list_offset, name_list_offset);

	// Verify integrity of map header
	if (type_list_offset >= file_size) {
		logTrace("file's resource map header corrupt");
		return false;
	}

	// Read resource type list
	SDL_RWseek(f, type_list_offset, SEEK_SET);
	int num_types = SDL_ReadBE16(f) + 1;
	for (int i=0; i<num_types; i++) {

		// Read type list item
		uint32 type = SDL_ReadBE32(f);
		int num_refs = SDL_ReadBE16(f) + 1;
		uint32 ref_list_offset = type_list_offset + SDL_ReadBE16(f);
		//printf("  type %c%c%c%c, %d refs\n", type >> 24, type >> 16, type >> 8, type, num_refs);

		// Verify integrity of item
		if (ref_list_offset >= file_size) {
			logTrace("file's resource type list corrupt");
			return false;
		}

		// Create ID map for this type
		id_map_t &id_map = types[type];

		// Read reference list
		uint32 cur = SDL_RWtell(f);
		SDL_RWseek(f, ref_list_offset, SEEK_SET);
		for (int j=0; j<num_refs; j++) {

			// Read list item
			int id = SDL_ReadBE16(f);
			SDL_RWseek(f, 2, SEEK_CUR);
			uint32 rsrc_data_offset = data_offset + (SDL_ReadBE32(f) & 0x00ffffff);
			//printf("   id %d, rsrc_data_offset %d\n", id, rsrc_data_offset);

			// Verify integrify of item
			if (rsrc_data_offset >= file_size) {
				logTrace("file's resource reference list corrupt");
				return false;
			}

			// Add ID to map
			id_map[id] = rsrc_data_offset;

			SDL_RWseek(f, 4, SEEK_CUR);
		}
		SDL_RWseek(f, cur, SEEK_SET);
	}
	return true;
}

SDL_RWops*
open_res_file_from_rwops(SDL_RWops* f) {
    if (f) {

            // Successful, create res_file_t object and read resource map
            res_file_t *r = new res_file_t(f);
            if (r->read_map()) {

                    // Successful, add file to list of open files
                    res_file_list.push_back(r);
                    cur_res_file_t = --res_file_list.end();
                    
                    // ZZZ: this exists mostly to help the user understand (via logContexts) which of
                    // potentially several copies of a resource fork is actually being used.
                    logNote("success, using this resource data (file is %p)", f);

            } else {

                    // Error reading resource map
                    delete r;
                    SDL_RWclose(f);
                    return NULL;
            }
    }
    else
            logNote("file could not be opened");
    return f;
}

static SDL_RWops*
open_res_file_from_path(const char* inPath) 
{
	return open_res_file_from_rwops(SDL_RWFromFile(inPath, "rb"));
}

SDL_RWops *open_res_file(FileSpecifier &file)
{
    logContext("opening resource file %s", file.GetPath());

    string rsrc_file_name = file.GetPath();
    string resources_file_name = rsrc_file_name;
    string darwin_rsrc_file_name = rsrc_file_name;
    rsrc_file_name += ".rsrc";
    resources_file_name += ".resources";
    darwin_rsrc_file_name += "/..namedfork/rsrc";

    SDL_RWops* f = NULL;

    // Open file, try <name>.rsrc first, then <name>.resources, then <name>/rsrc then <name>
    if (f == NULL)
            f = open_res_file_from_path(rsrc_file_name.c_str());
    if (f == NULL)
            f = open_res_file_from_path(resources_file_name.c_str());
    if (f == NULL)
	   f = open_res_file_from_path(file.GetPath());
    if (f == NULL)
	   f = open_res_file_from_path(darwin_rsrc_file_name.c_str());

    return f;
}



void close_res_file(SDL_RWops *file)
{
	if (file == NULL)
		return;

	// Find file in list
	list<res_file_t *>::iterator i = find_res_file_t(file);
	if (i != res_file_list.end()) {

		// Remove it from the list, close the file and delete the res_file_t
		res_file_t *r = *i;
		SDL_RWclose(r->f);
		res_file_list.erase(i);
		delete r;

		cur_res_file_t = res_file_list.empty() ? decltype(cur_res_file_t){} : --res_file_list.end();
	}
}


SDL_RWops *cur_res_file(void)
{
	res_file_t *r = *cur_res_file_t;
	assert(r);
	return r->f;
}


void use_res_file(SDL_RWops *file)
{
	list<res_file_t *>::iterator i = find_res_file_t(file);
	assert(i != res_file_list.end());
	cur_res_file_t = i;
}


size_t res_file_t::count_resources(uint32 type) const
{
	type_map_t::const_iterator i = types.find(type);
	if (i == types.end())
		return 0;
	else
		return i->second.size();
}

size_t count_1_resources(uint32 type)
{
	return (*cur_res_file_t)->count_resources(type);
}

size_t count_resources(uint32 type)
{
	if (!res_file_list.size())
		return 0;
	size_t count = 0;
	list<res_file_t *>::const_iterator i = cur_res_file_t, begin = res_file_list.begin();
	while (true) {
		count += (*i)->count_resources(type);
		if (i == begin)
			break;
		i--;
	}
	return count;
}

void res_file_t::get_resource_id_list(uint32 type, vector<int> &ids) const
{
	type_map_t::const_iterator i = types.find(type);
	if (i != types.end()) {
		id_map_t::const_iterator j, end = i->second.end();
		for (j=i->second.begin(); j!=end; j++)
			ids.push_back(j->first);
	}
}

void get_1_resource_id_list(uint32 type, vector<int> &ids)
{
	ids.clear();
	(*cur_res_file_t)->get_resource_id_list(type, ids);
}

void get_resource_id_list(uint32 type, vector<int> &ids)
{
	ids.clear();
	if (!res_file_list.size())
		return;
	list<res_file_t *>::const_iterator i = cur_res_file_t, begin = res_file_list.begin();
	while (true) {
		(*i)->get_resource_id_list(type, ids);
		if (i == begin)
			break;
		i--;
	}
}

bool res_file_t::get_resource(uint32 type, int id, LoadedResource &rsrc) const
{
	rsrc.Unload();

	// Find resource in map
	type_map_t::const_iterator i = types.find(type);
	if (i != types.end()) {
		id_map_t::const_iterator j = i->second.find(id);
		if (j != i->second.end()) {

			// Found, read data size
			SDL_RWseek(f, j->second, SEEK_SET);
			uint32 size = SDL_ReadBE32(f);

			// Allocate memory and read data
			void *p = malloc(size);
			if (p == NULL)
				return false;
			SDL_RWread(f, p, 1, size);
			rsrc.p = p;
			rsrc.size = size;

//			fprintf(stderr, "get_resource type %c%c%c%c, id %d -> data %p, size %d\n", type >> 24, type >> 16, type >> 8, type, id, p, size);
			return true;
		}
	}
	return false;
}

bool get_1_resource(uint32 type, int id, LoadedResource &rsrc)
{
	return (*cur_res_file_t)->get_resource(type, id, rsrc);
}

bool get_resource(uint32 type, int id, LoadedResource &rsrc)
{
	if (!res_file_list.size())
		return false;
	list<res_file_t *>::const_iterator i = cur_res_file_t, begin = res_file_list.begin();
	while (true) {
		bool found = (*i)->get_resource(type, id, rsrc);
		if (found)
			return true;
		if (i == begin)
			break;
		i--;
	}
	return false;
}

bool res_file_t::get_ind_resource(uint32 type, int index, LoadedResource &rsrc) const
{
	rsrc.Unload();

	// Find resource in map
	type_map_t::const_iterator i = types.find(type);
	if (i != types.end()) {
		if (index < 1 || index > int(i->second.size()))
			return false;
		id_map_t::const_iterator j = i->second.begin();
		for (int k=1; k<index; k++)
			++j;

		// Read data size
		SDL_RWseek(f, j->second, SEEK_SET);
		uint32 size = SDL_ReadBE32(f);

		// Allocate memory and read data
		void *p = malloc(size);
		if (p == NULL)
			return false;
		SDL_RWread(f, p, 1, size);
		rsrc.p = p;
		rsrc.size = size;

//		fprintf(stderr, "get_ind_resource type %c%c%c%c, index %d -> data %p, size %d\n", type >> 24, type >> 16, type >> 8, type, index, p, size);
		return true;
	}
	return false;
}

bool get_1_ind_resource(uint32 type, int index, LoadedResource &rsrc)
{
	return (*cur_res_file_t)->get_ind_resource(type, index, rsrc);
}

bool get_ind_resource(uint32 type, int index, LoadedResource &rsrc)
{
	if (!res_file_list.size())
		return false;
	list<res_file_t *>::const_iterator i = cur_res_file_t, begin = res_file_list.begin();
	while (true) {
		bool found = (*i)->get_ind_resource(type, index, rsrc);
		if (found)
			return true;
		if (i == begin)
			break;
		i--;
	}
	return false;
}

bool res_file_t::has_resource(uint32 type, int id) const
{
	type_map_t::const_iterator i = types.find(type);
	if (i != types.end()) {
		id_map_t::const_iterator j = i->second.find(id);
		if (j != i->second.end())
			return true;
	}
	return false;
}

bool has_1_resource(uint32 type, int id)
{
	return (*cur_res_file_t)->has_resource(type, id);
}

bool has_resource(uint32 type, int id)
{
	if (!res_file_list.size())
		return false;
	list<res_file_t *>::const_iterator i = cur_res_file_t, begin = res_file_list.begin();
	while (true) {
		if ((*i)->has_resource(type, id))
			return true;
		if (i == begin)
			break;
		i--;
	}
	return false;
}
*/
