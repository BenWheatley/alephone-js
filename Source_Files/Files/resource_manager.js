// resource_manager.js
// Converted from resource_manager.cpp
// NOTE: This file uses direct translations from C++ to JS. No idiomatic JS changes have been applied.

import { logNote, logAnomaly, logTrace, logDump } from '../Misc/Logging.js';
import { LoadedResource } from './FileHandler.js'; // All (and only) args/vars named rsrc, are of type LoadedResource

export function is_applesingle(dataView, rsrc_fork) {
    const dv = dataView;

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

    const header = new Uint8Array(data.buffer, data.byteOffset, Math.min(128, data.byteLength));
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
        logAnomaly("CRC checksum failed");
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

// Resource file structure
class res_file_t {
    constructor(arg = null) {
        // Map of all resource types found in file
        // elements: {uint32: {int: uint32}}
        this.types = new Map();
        this.offset = 0;

        if (arg === null) {
            // Default constructor: f = NULL
            this.f = null;
        } else if (arg instanceof res_file_t) {
            // from (const res_file_t &other)
            this.f = arg.f;
        } else if (arg instanceof DataView) {
            // from (SDL_RWops *file)
            this.f = arg;
        } else {
            throw new Error("Unexpected argument type for res_file_t");
        }
    }

    read_map() {
        let file_size = this.f.byteLength;
        let fork_start = 0;

        if (file_size < 16) {
            if (file_size === 0) logNote("file has zero length");
            else logAnomaly(`file too small (${file_size} bytes) to be valid`);
            return false;
        }

        let result;
        if ((result = is_applesingle(this.f, true))) {
            logTrace("file is_applesingle");
            fork_start = result.offset;
            file_size = fork_start + result.length;
        } else if ((result = is_macbinary(new Uint8Array(this.f.buffer)))) {
            logTrace("file is_macbinary");
            fork_start = 128 + ((result.data_length + 0x7f) & ~0x7f);
            file_size = fork_start + result.rsrc_length;
        } else {
            logTrace("file is raw resource fork format");
        }

        this.offset = fork_start;
        const data_offset = this.f.getUint32(this.offset, false) + fork_start; this.offset += 4;
        const map_offset = this.f.getUint32(this.offset, false) + fork_start; this.offset += 4;
        const data_size = this.f.getUint32(this.offset, false); this.offset += 4;
        const map_size = this.f.getUint32(this.offset, false); this.offset += 4;

        logDump(`resource header: data offset ${data_offset}, map_offset ${map_offset}, data_size ${data_size}, map_size ${map_size}`);

        if (data_offset >= file_size || map_offset >= file_size ||
            data_offset + data_size > file_size || map_offset + map_size > file_size) {
            logTrace("file's resource header corrupt");
            return false;
        }

        this.offset = map_offset + 24;
        const type_list_offset = map_offset + this.f.getUint16(this.offset, false); this.offset += 2;
        if (type_list_offset >= file_size) {
            logTrace("file's resource map header corrupt");
            return false;
        }

        this.offset = type_list_offset;
        const num_types = this.f.getUint16(this.offset, false) + 1; this.offset += 2;
        for (let i = 0; i < num_types; i++) {
            const type = this.f.getUint32(this.offset, false); this.offset += 4;
            const num_refs = this.f.getUint16(this.offset, false) + 1; this.offset += 2;
            const ref_list_offset = type_list_offset + this.f.getUint16(this.offset, false); this.offset += 2;

            if (ref_list_offset >= file_size) {
                logTrace("file's resource type list corrupt");
                return false;
            }

            const id_map = new Map();
            this.types.set(type, id_map);

            const cur = this.offset;
            this.offset = ref_list_offset;
            for (let j = 0; j < num_refs; j++) {
                const id = this.f.getUint16(this.offset, false); this.offset += 2;
                this.offset += 2; // skip
                const rsrc_data_offset = data_offset + (this.f.getUint32(this.offset, false) & 0x00ffffff); this.offset += 4;
                if (rsrc_data_offset >= file_size) {
                    logTrace("file's resource reference list corrupt");
                    return false;
                }
                id_map.set(id, rsrc_data_offset);
                this.offset += 4;
            }
            this.offset = cur;
        }
        return true;
    }

    count_resources(type) {
        const id_map = this.types.get(type);
        return id_map ? id_map.size : 0;
    }

    // TODO: I think this isn't used, but wait until app actually works before actually seeing if I can remove it
    get_resource_id_list(type, ids) {
        const id_map = this.types.get(type);
        if (id_map) {
            for (const id of id_map.keys()) {
                ids.push(id);
            }
        }
    }

    get_resource(type, id, rsrc) {
        rsrc.Unload();
        const id_map = this.types.get(type);
        if (id_map && id_map.has(id)) {
            const offset = id_map.get(id);
            this.offset = offset;
            const size = this.f.getUint32(this.offset, false); this.offset += 4;
            const data = new Uint8Array(this.f.buffer, this.offset, size); this.offset += size;
            rsrc.p = data;
            rsrc.size = size;
            return true;
        }
        return false;
    }

    // TODO: test this thoroughly, I'm not at all convinced right now
    get_ind_resource(type, index, rsrc) {
        rsrc.Unload();
        const id_map = this.types.get(type);
        if (id_map) {
            if (index < 1 || index > id_map.size) return false;
            const iter = Array.from(id_map.entries());
            const offset = iter[index - 1][1];
            this.offset = offset;
            const size = this.f.getUint32(this.offset, false); this.offset += 4;
            const data = new Uint8Array(this.f.buffer, this.offset, size); this.offset += size;
            rsrc.p = data;
            rsrc.size = size;
            return true;
        }
        return false;
    }

    has_resource(type, id) {
        const id_map = this.types.get(type);
        return id_map ? id_map.has(id) : false;
    }
}

// List of open resource files
const res_file_list = [];
let cur_res_file_t = null;

function find_res_file_t(f) {
    for (let i = 0; i < res_file_list.length; ++i) {
        if (res_file_list[i].f === f)
            return i;
    }
    return -1;
}

// external resources: terminals for Marathon 1
const ExternalResources = new OpenedResourceFile();

function set_external_resources_file(f) {
    f.Open(ExternalResources);
}

// Arg was SDL_RWops, so should now be DataView
function open_res_file_from_rwops(f) {
    if (f) {
        const r = new res_file_t(f);
        if (r.read_map()) {
            res_file_list.push(r);
            cur_res_file_t = res_file_list.length - 1;
            logNote("success, using this resource data (file is %p)", f);
        } else {
            // Error reading resource map, but this wasn't logged in original, just cleaned up memory
            return null;
        }
    } else {
        logNote("file could not be opened");
    }
    return f;
}

async function open_res_file_from_path(inPath) {
	const url = inPath;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch resource file from ${url}: ${response.status}`);
	}
	const buffer = await response.arrayBuffer();
	const dataView = new DataView(buffer);
	const file = {
		data: new Uint8Array(buffer),
		dataView: dataView
	};
	return new res_file_t(file);
}

// Original arg type {FileSpecifier: file}
function open_res_file(file) {
    logTrace(`opening resource file ${file.GetPath()}`);

    const rsrc_file_name = file.GetPath() + ".rsrc";
    const resources_file_name = file.GetPath() + ".resources";
    const darwin_rsrc_file_name = file.GetPath() + "/..namedfork/rsrc";

    // Open file, try <name>.rsrc first, then <name>.resources, then <name>/rsrc then <name>
    let f = open_res_file_from_path(rsrc_file_name);
    if (!f) f = open_res_file_from_path(resources_file_name);
    if (!f) f = open_res_file_from_path(file.GetPath());
    if (!f) f = open_res_file_from_path(darwin_rsrc_file_name);

    return f;
}

function close_res_file(file) {
    if (!file) return;
    const i = find_res_file_t(file);
    if (i !== -1) {
        res_file_list.splice(i, 1);
        cur_res_file_t = res_file_list.length ? res_file_list.length - 1 : null;
    }
}

// Returns DataView for current resource file
function cur_res_file() {
    const r = res_file_list[cur_res_file_t];
    if (!(r)) logError(`Expected to get something from cur_res_file(), actually got ${r} when accessing ${res_file_list} with index ${cur_res_file_t}`);
    return r.f;
}

function use_res_file(file) {
    const i = find_res_file_t(file);
    assert(i !== -1);
    cur_res_file_t = i;
}

function count_1_resources(type) {
    return res_file_list[cur_res_file_t].count_resources(type);
}

function get_resource_id_list(type, ids) {
    ids.length = 0;
    if (!res_file_list.length) return;
    for (let i = cur_res_file_t; i >= 0; --i)
        res_file_list[i].get_resource_id_list(type, ids);
}

function get_1_resource(type, id, rsrc) {
    return res_file_list[cur_res_file_t].get_resource(type, id, rsrc);
}

function get_resource(type, id, rsrc) {
    if (!res_file_list.length) return false;
    for (let i = cur_res_file_t; i >= 0; --i) {
        if (res_file_list[i].get_resource(type, id, rsrc))
            return true;
    }
    return false;
}

function has_1_resource(type, id) {
    return res_file_list[cur_res_file_t].has_resource(type, id);
}

function has_resource(type, id) {
    if (!res_file_list.length) return false;
    for (let i = cur_res_file_t; i >= 0; --i) {
        if (res_file_list[i].has_resource(type, id))
            return true;
    }
    return false;
}
