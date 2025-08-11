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

// Select what resource file is to be the source of the color table;
// this is for the benefit of resource-file 
export const CLUTSource_Images = 0;
export const CLUTSource_Scenario = 1;

import * as cseries from '../CSeries/cseries.js';
import { byte_swap_memory, _2byte, _4byte } from '../CSeries/byte_swapping.js';
import * as FileHandler from '../Files/FileHandler.js';
import * as _interface from '../Misc/interface.js';
import * as shell from '../shell.js';
import * as screen from './screen.js';
import * as wad from '../Files/wad.js';
import { DataViewReader } from '../Misc/DataViewReader.js';
/*
#include "screen_drawing.h"
*/
import * as Logging from '../Misc/Logging.js';
/*
#include "render.h"
#include "OGL_Render.h"
#include "OGL_Blitter.h"
*/
import * as screen_definitions from './screen_definitions.js';
/*
#include "Plugins.h"
*/
const _images_file_delta16 = 1000;
const _images_file_delta32 = 2000;
const _scenario_file_delta16 = 10000;
const _scenario_file_delta32 = 20000;

const _PICT = cseries.FOUR_CHARS_TO_INT('PICT');
const _pict = cseries.FOUR_CHARS_TO_INT('pict');

class image_file_t {
	constructor() {
		this.rsrc_file = new FileHandler.OpenedResourceFile();
		this.wad_file = new FileHandler.OpenedFile();
		this.wad_hdr = null; // TODO = new FileHandler.wad_header();
		
		this.file = null;
	}

	//  Open/close image file
	async open_file(url) {
		// Try to open as a resource file
		this.file = new FileHandler.FileSpecifier(url);
		const was_opened = await this.file.Open(this.rsrc_file);
		/*
		if (!was_opened) {
			// This failed, maybe it's a wad file (M2 Win95 style)
			if (!await wad.open_wad_file_for_reading(url, this.wad_file) ||
				!await wad.read_wad_header(this.wad_file, this.wad_hdr)) {
	
				wad_file.Close();
				return false;
			}
		} else if (!this.wad_file || !this.wad_file.IsOpen()) {
			if (await wad.open_wad_file_for_reading(url, this.wad_file)) {
				if (!await wad.read_wad_header(this.wad_file, this.wad_hdr)) {
					wad_file.Close();
				}
			}
		}*/
	
		return true;
	}
	
	is_open() {
		// TODO: refactor this out
		// it's redundant in JS, the old callbacks were ~ "do you have a file handler"
		return true;
	}

	determine_pict_resource_id(base_id, delta16, delta32) {
		let actual_id = base_id;
		let done = false;
		let bit_depth = 32;
		
		while (!done) {
			let next_bit_depth;
			
			actual_id = base_id;
			switch (bit_depth) {
				case 8:
					next_bit_depth = 0;
					break;
				
				case 16:
					next_bit_depth = 8;
					actual_id += delta16;
					break;
				
				case 32:
					next_bit_depth = 16;
					actual_id += delta32;
					break;
				
				default:
					throw new Error("Invalid bit depth in determine_pict_resource_id");
			}
			
			if (this.has_pict(actual_id))
				done = true;
			
			if (!done) {
				if (next_bit_depth)
					bit_depth = next_bit_depth;
				else {
					// Didn't find it. Return the 8 bit version and bail..
					done = true;
				}
			}
		}
		
		return actual_id;
	}

	has_pict(id) {
		return this.has_rsrc(_PICT, _PICT, id) || this.has_rsrc(_PICT, _pict, id);
	}

	has_clut(id) {
		// TODO: Check presence of clut resource
		return false;
	}

	get_pict(id, rsrc) { // original used a pointer: LoadedResource &rsrc
		let result = this.get_rsrc(_PICT, _PICT, id, rsrc)
			|| this.get_rsrc(_PICT, _pict, id, rsrc);
		
		return result;
	}

	get_clut(id) { // original used a pointer: LoadedResource &rsrc
		// TODO: Load clut resource
		return null;
	}

	get_snd(id) { // original used a pointer: LoadedResource &rsrc
		// TODO: Load sound resource
		return null;
	}

	get_text(id) { // original used a pointer: LoadedResource &rsrc
		// TODO: Load text resource
		return null;
	}

	has_rsrc(rsrc_type, wad_type, id) {
		// TODO: Generic check for resource presence
		return false;
	}
	
	has_rsrc(rsrc_type, wad_type, id) {
		// Check for resource in resource file
		if (this.rsrc_file.IsOpen()) {
			if (this.rsrc_file.Check(rsrc_type, id))
				return true;
		}
		
		// Check for resource in wad file
		if (this.wad_file.IsOpen()) {
		// Note: original used &wad_hdr, so be sure of return-by-mutation-value here
			const d = read_indexed_wad_from_file(this.wad_file, this.wad_hdr, id, true);
			if (d) {
				let success = false;
				let len; // Note: original used &len, hence these shenanigans. I don't think I need it?
				if (wad.extract_type_from_wad(d, wad_type, (l) => { len = l; }))
					success = true;
				return success;
			}
		}
		
		return false;
	}
	
	get_rsrc(rsrc_type, wad_type, id, rsrc) { // original used a pointer: LoadedResource &rsrc
		// Get resource from resource file
		let result = null;
		if (this.rsrc_file.IsOpen()) this.rsrc_file.Get(rsrc_type, id, rsrc);
		if (result != null) return result;
		
		// Get resource from wad file
/* TODO: continue converting this CPP into JS
		wad_data *d = read_indexed_wad_from_file(wad_file, &wad_hdr, id, true);
		if (d) {
			bool success = false;
			size_t raw_length;
			void *raw = extract_type_from_wad(d, wad_type, &raw_length);
			if (raw)
			{
				if (rsrc_type == FOUR_CHARS_TO_INT('P','I','C','T'))
				{
					if (wad_type == FOUR_CHARS_TO_INT('P','I','C','T'))
					{
						void *pict_data = malloc(raw_length);
						memcpy(pict_data, raw, raw_length);
						rsrc.SetData(pict_data, raw_length);
						success = true;
					}
					else
					{
						size_t clut_length;
						void *clut_data = extract_type_from_wad(d, FOUR_CHARS_TO_INT('c','l','u','t'), &clut_length);
						success = make_rsrc_from_pict(raw, raw_length, rsrc, clut_data, clut_length);
					}
				}
				else if (rsrc_type == FOUR_CHARS_TO_INT('c','l','u','t'))
					success = make_rsrc_from_clut(raw, raw_length, rsrc);
				else if (rsrc_type == FOUR_CHARS_TO_INT('s','n','d',' '))
				{
					void *snd_data = malloc(raw_length);
					memcpy(snd_data, raw, raw_length);
					rsrc.SetData(snd_data, raw_length);
					success = true;
				}
				else if (rsrc_type == FOUR_CHARS_TO_INT('T','E','X','T'))
				{
					void *text_data = malloc(raw_length);
					memcpy(text_data, raw, raw_length);
					rsrc.SetData(text_data, raw_length);
					success = true;
				}
			}
			return success;
		}
*/
		
		return result;
	}

	make_rsrc_from_pict(data, length, rsrc, clut_data, clut_length) { // original used a pointer: LoadedResource &rsrc
		// TODO: Create LoadedResource from pict data
		return false;
	}

	make_rsrc_from_clut(data, length, rsrc) { // original used a pointer: LoadedResource &rsrc
		// TODO: Create LoadedResource from clut data
		return false;
	}
}

let ImagesFile = new image_file_t();
let ScenarioFile = new image_file_t();
let ExternalResourcesFile = new image_file_t();
let ShapesImagesFile = new image_file_t();
let SoundsImagesFile = new image_file_t();

/*
#include "screen_drawing.h"

// From screen_drawing_sdl.cpp
extern bool draw_clip_rect_active;
extern screen_rectangle draw_clip_rect;

extern bool shapes_file_is_m1();
*/

//  Uncompress picture data, returns size of compressed image data that was read
// Uncompress (and endian-correct) scan line compressed by PackBits RLE algorithm
function unpack_bits(src, row_bytes, dst) {
	// Read source count
	let src_count;
	if (row_bytes > 250) {
		src_count = (src[0] << 8) | src[1];
		src = src.subarray(2);
	} else {
		src_count = src[0];
		src = src.subarray(1);
	}
	
	while (src_count > 0) {
		
		// Read flag/count byte
		let c = (src[0] << 24) >> 24; // int8 cast
		src = src.subarray(1);
		src_count--;
		
		if (c < 0) {
			// RLE compressed run
			let size = -c + 1;
			let data;
			if (dst.BYTES_PER_ELEMENT === 1) {
				data = src[0];
				src = src.subarray(1);
				src_count--;
			} else {
				data = (src[0] << 8) | src[1];
				src = src.subarray(2);
				src_count -= 2;
			}
			for (let i = 0; i < size; i++) {
				dst[i] = data;
			}
			dst = dst.subarray(size);
			
		} else {
			// Uncompressed run
			let size = c + 1;
			for (let i = 0; i < size; i++) {
				let data;
				if (dst.BYTES_PER_ELEMENT === 1) {
					data = src[0];
					src = src.subarray(1);
					src_count--;
				} else {
					data = (src[0] << 8) | src[1];
					src = src.subarray(2);
					src_count -= 2;
				}
				dst[0] = data;
				dst = dst.subarray(1);
			}
		}
	}
	return src;
}

// 8-bit picture, one scan line at a time
function uncompress_rle8(src, row_bytes, dst, dst_pitch, height) {
	let start = src;
	for (let y = 0; y < height; y++) {
		src = unpack_bits(src, row_bytes, dst);
		dst = dst.subarray(dst_pitch);
	}
	return src.byteOffset - start.byteOffset; // C++ did pointer arithmetic here
}

// 16-bit picture, one scan line at a time, 16-bit chunks
function uncompress_rle16(src, row_bytes, dst /*Uint8Array*/, dst_pitch, height) {
	let start = src;
	for (let y = 0; y < height; y++) {
		src = unpack_bits(src, row_bytes, new Uint16Array(dst.buffer, dst.byteOffset, dst.length / 2)); // TODO: I'm not sure, is new Uint16Array correct here? C++ was `(uint16 *)dst` so it might?
		dst = dst.subarray(dst_pitch);
	}
	return src.byteOffset - start.byteOffset; // C++ did pointer arithmetic here
}

function copy_component_into_surface(src, dst, count, component) {
	if (true /*PlatformIsLittleEndian()*/) {
		dst = dst.subarray(2 - component);
	} else {
		dst = dst.subarray(component + 1);
	}
	while (count--) {
		dst[0] = src[0];
		src = src.subarray(1);
		dst = dst.subarray(4);
	}
}

// 32-bit picture, one scan line, one component at a time
function uncompress_rle32(src, row_bytes, dst, dst_pitch, height) {
	let tmp = new Uint8Array(row_bytes);
	if (!tmp)
		return -1;
	tmp.fill(0);

	let start = src;

	let width = row_bytes / 4;
	for (let y = 0; y < height; y++) {
		src = unpack_bits(src, row_bytes, tmp);

		// "tmp" now contains "width" bytes of red, followed by "width"
		// bytes of green and "width" bytes of blue, so we have to copy them
		// into the surface in the right order
		copy_component_into_surface(tmp.subarray(0, width), dst, width, 0);
		copy_component_into_surface(tmp.subarray(width, width * 2), dst, width, 1);
		copy_component_into_surface(tmp.subarray(width * 2, width * 3), dst, width, 2);

		dst = dst.subarray(dst_pitch);
	}

	return src.byteOffset - start.byteOffset; // C++ did pointer arithmetic here
}

function uncompress_picture(src, row_bytes, dst, dst_pitch, depth, height, pack_type) {
	// Depths <8 have to be color expanded to depth 8 after uncompressing,
	// so we uncompress into a temporary buffer
	let orig_dst = dst;
	let orig_dst_pitch = dst_pitch;
	if (depth < 8) {
		dst = new Uint8Array(row_bytes * height);
		dst_pitch = row_bytes;
		if (!dst)
			return -1;
	}
	
	let data_size = 0;
	
	// Used in two places, original C++ had a goto:
	function no_packing() {
		let p = src;
		let q = dst;
		for (let y = 0; y < height; y++) {
			q.set(p.subarray(0, Math.min(row_bytes, dst_pitch)));
			p = p.subarray(row_bytes);
			q = q.subarray(dst_pitch);
		}
		data_size = row_bytes * height;
		if (depth === 16)
			byte_swap_memory(dst, _2byte, dst_pitch * height / 2);
		else if (depth === 32)
			byte_swap_memory(dst, _4byte, dst_pitch * height / 4);
	}
	
	if (row_bytes < 8) {
		
		// Uncompressed data
		let p = src;
		let q = dst;
		for (let y = 0; y < height; y++) {
			q.set(p.subarray(0, Math.min(row_bytes, dst_pitch)));
			p = p.subarray(row_bytes);
			q = q.subarray(dst_pitch);
		}
		data_size = row_bytes * height;
		
	} else {
		
		// Compressed data
		if (depth <= 8) {
			
			// Indexed color
			if (pack_type === 1) {
				no_packing();
			} else {
				data_size = uncompress_rle8(src, row_bytes, dst, dst_pitch, height);
			}
			
		} else {
			
			// Direct color
			if (pack_type === 0) {
				if (depth === 16)
					pack_type = 3;
				else if (depth === 32)
					pack_type = 4;
			}
			switch (pack_type) {
				case 1: // No packing
					no_packing();
					break;
				case 3: // Run-length encoding by 16-bit chunks
					data_size = uncompress_rle16(src, row_bytes, dst, dst_pitch, height);
					break;
				case 4: // Run-length encoding one component at a time
					data_size = uncompress_rle32(src, row_bytes, dst, dst_pitch, height);
					break;
				default:
					console.error(`Unimplemented packing type ${pack_type} (depth ${depth}) in PICT resource`);
					data_size = -1;
					break;
			}
		}
	}
	
	// Color expansion 1/2/4->8 bits
	if (depth < 8) {
		let p = dst;
		let q = orig_dst;
		
		// Source and destination may have different alignment restrictions,
		// don't run off the right of either
		let x_max = row_bytes;
		while (x_max * 8 / depth > orig_dst_pitch)
			x_max--;
		
		switch (depth) {
			case 1:
				for (let y = 0; y < height; y++) {
					for (let x = 0; x < x_max; x++) {
						let b = p[x];
						q[x*8+0] = (b & 0x80) ? 0x01 : 0x00;
						q[x*8+1] = (b & 0x40) ? 0x01 : 0x00;
						q[x*8+2] = (b & 0x20) ? 0x01 : 0x00;
						q[x*8+3] = (b & 0x10) ? 0x01 : 0x00;
						q[x*8+4] = (b & 0x08) ? 0x01 : 0x00;
						q[x*8+5] = (b & 0x04) ? 0x01 : 0x00;
						q[x*8+6] = (b & 0x02) ? 0x01 : 0x00;
						q[x*8+7] = (b & 0x01) ? 0x01 : 0x00;
					}
					p = p.subarray(row_bytes);
					q = q.subarray(orig_dst_pitch);
				}
				break;
			case 2:
				for (let y = 0; y < height; y++) {
					for (let x = 0; x < x_max; x++) {
						let b = p[x];
						q[x*4+0] = (b >> 6) & 0x03;
						q[x*4+1] = (b >> 4) & 0x03;
						q[x*4+2] = (b >> 2) & 0x03;
						q[x*4+3] = b & 0x03;
					}
					p = p.subarray(row_bytes);
					q = q.subarray(orig_dst_pitch);
				}
				break;
			case 4:
				for (let y = 0; y < height; y++) {
					for (let x = 0; x < x_max; x++) {
						let b = p[x]; // uint8
						q[x*2+0] = (b >> 4) & 0x0f;
						q[x*2+1] = b & 0x0f;
					}
					p = p.subarray(row_bytes);
					q = q.subarray(orig_dst_pitch);
				}
				break;
		}
		// free(dst); // no-op in JS
	}

	return data_size;
}

/*
int get_pict_header_width(LoadedResource &rsrc)
{
	SDL_RWops *p = SDL_RWFromMem(rsrc.GetPointer(), (int) rsrc.GetLength());
	if (p)
	{
		SDL_RWseek(p, 8, SEEK_CUR);
		int width = SDL_ReadBE16(p);
		SDL_RWclose(p);
		return width;
	}
	return -1;
}
*/

async function picture_to_surface(rsrc) {
	let s = null; // was std::unique_ptr, now will hold an ImageBitmap
	
	if (!rsrc.IsLoaded())
		return s;
	
	// Open stream to picture resource
	let uint8 = rsrc.GetPointer(); // Uint8Array
	let buffer = uint8.buffer;
	let dv = new DataView(buffer, uint8.byteOffset, uint8.byteLength);
	let p = new DataViewReader(dv); // big-endian by default
	p.skip(6); // picSize/top/left
	let pic_height = p.readUint16();
	let pic_width = p.readUint16();
	
	let done = false;
	while (!done) {
		let opcode = p.readUint16();
		switch (opcode) {
			case 0x0000:	// NOP
			case 0x0011:	// VersionOp
			case 0x001c:	// HiliteMode
			case 0x001e:	// DefHilite
			case 0x0038:	// FrameSameRect
			case 0x0039:	// PaintSameRect
			case 0x003a:	// EraseSameRect
			case 0x003b:	// InvertSameRect
			case 0x003c:	// FillSameRect
			case 0x02ff:	// Version
				break;
			
			case 0x00ff:	// OpEndPic
				done = true;
				break;
			
			case 0x0001: {	// Clipping region
				let size = p.readUint16();
				if (size & 1) size++;
				p.skip(size - 2);
				break;
			}
			
			case 0x0003:	// TxFont
			case 0x0004:	// TxFace
			case 0x0005:	// TxMode
			case 0x0008:	// PnMode
			case 0x000d:	// TxSize
			case 0x0015:	// PnLocHFrac
			case 0x0016:	// ChExtra
			case 0x0023:	// ShortLineFrom
			case 0x00a0:	// ShortComment
				p.skip(2);
				break;
			
			case 0x0006:	// SpExtra
			case 0x0007:	// PnSize
			case 0x000b:	// OvSize
			case 0x000c:	// Origin
			case 0x000e:	// FgColor
			case 0x000f:	// BgColor
			case 0x0021:	// LineFrom
				p.skip(4);
				break;
			
			case 0x001a:	// RGBFgCol
			case 0x001b:	// RGBBkCol
			case 0x001d:	// HiliteColor
			case 0x001f:	// OpColor
			case 0x0022:	// ShortLine
				p.skip(6);
				break;
			
			case 0x0002:	// BkPat
			case 0x0009:	// PnPat
			case 0x000a:	// FillPat
			case 0x0010:	// TxRatio
			case 0x0020:	// Line
			case 0x0030:	// FrameRect
			case 0x0031:	// PaintRect
			case 0x0032:	// EraseRect
			case 0x0033:	// InvertRect
			case 0x0034:	// FillRect
				p.skip(8);
				break;
			
			case 0x0c00:	// HeaderOp
				p.skip(24);
				break;
			
			case 0x00a1: {	// LongComment
				p.skip(2);
				let size = p.readUint16();
				if (size & 1) size++;
				p.skip(size);
				break;
			}
			
			case 0x0098:	// Packed CopyBits
			case 0x0099:	// Packed CopyBits with clipping region
			case 0x009a:	// Direct CopyBits
			case 0x009b: {	// Direct CopyBits with clipping region
				// 1. PixMap
				if (opcode === 0x009a || opcode === 0x009b)
					p.skip(4); // pmBaseAddr
				let row_bytes = p.readUint16(); // the upper 2 bits are flags
				let is_pixmap = ((row_bytes & 0x8000) !== 0);
				row_bytes &= 0x3fff;
				let top = p.readUint16();
				let left = p.readUint16();
				let height = p.readUint16() - top;
				let width = p.readUint16() - left;
				let pack_type, pixel_size;
				if (is_pixmap) {
					p.skip(2); // pmVersion
					pack_type = p.readUint16();
					p.skip(14); // packSize/hRes/vRes/pixelType
					pixel_size = p.readUint16();
					p.skip(16); // cmpCount/cmpSize/planeBytes/pmTable/pmReserved
				} else {
					pack_type = 0;
					pixel_size = 1;
				}
				
				// Allocate surface for picture. Always 32 bit in JS-land.
				let bm = new Uint8ClampedArray(width * height * 4);
				bm.fill(255); // The original in this case had no alpha channel here, this has the same effect
				
				// 2. ColorTable
				let colors = null;
				if (is_pixmap && (opcode === 0x0098 || opcode === 0x0099)) {
					colors = new Array(256);
					p.skip(4); // ctSeed
					let flags = p.readUint16();
					let num_colors = p.readUint16() + 1;
					for (let i = 0; i < num_colors; i++) {
						let value = p.readUint16() & 0xff;
						if (flags & 0x8000)
							value = i;
						colors[value] = {
							r: p.readUint16() >> 8,
							g: p.readUint16() >> 8,
							b: p.readUint16() >> 8,
							a: 0xff
						};
					}
				}
				
				// 3. source/destination Rect and transfer mode
				p.skip(18);
				
				// 4. clipping region
				if (opcode === 0x0099 || opcode === 0x009b) {
					let rgn_size = p.readUint16();
					p.skip(rgn_size - 2);
				}
				
				// 5. graphics data
				const bm_pitch = width * 4;
				let data_size = uncompress_picture(rsrc.GetPointer().subarray(p.tell()), row_bytes, bm, bm_pitch, pixel_size, height, pack_type);
				if (data_size < 0) {
					done = true;
					break;
				}
				if (data_size & 1) data_size++;
				p.skip(data_size);
				
				// If there's already a surface, throw away the decoded image
				// (actually, we could have skipped this entire opcode, but the
				// only way to do this is to decode the image data).
				// So we only draw the first image we encounter.
				if (s) {
					// SDL_FreeSurface(bm);
				} else {
					s = new ImageData(bm, width, height);
				}
				break;
			}
			
			case 0x8200: {	// Compressed QuickTime image (we only handle JPEG compression)
				// 1. Header
				let opcode_size = p.readUint32();
				if (opcode_size & 1)
					opcode_size++;
				let opcode_start = p.tell();
				p.skip(26); // version/matrix (hom. part)
				let offset_x = p.readInt16();
				p.skip(2);
				let offset_y = p.readInt16();
				p.skip(6);	// matrix (remaining part)
				let matte_size = p.readUint32();
				p.skip(22); // matteRec/mode/srcRect/accuracy
				let mask_size = p.readUint32();
				
				// 2. Matte image description
				if (matte_size) {
					let matte_id_size = p.readUint32();
					p.skip(matte_id_size - 4);
				}
				
				// 3. Matte data
				p.skip(matte_size);
				
				// 4. Mask region
				p.skip(mask_size);
				
				// 5. Image description
				let id_start = p.tell();
				let id_size = p.readUint32();
				let codec_type = p.readUint32();
				
				if (codec_type !== FOUR_CHARS_TO_INT('jpeg')) {
					console.error(`Unsupported codec type ${codec_type}`);
					done = true;
					break;
				}
				
				p.skip(36); // resvd1/resvd2/dataRefIndex/version/revisionLevel/vendor/temporalQuality/spatialQuality/width/height/hRes/vRes
				let data_size = p.readUint32();
				
				p.seek(id_start + id_size);
				
				// 6. Compressed image data
				let img = p.readBytes(data_size);
				if (img == null) {
					done = true;
					break;
				}
				// Ben note: eww, surely this can be made much better? Do I have to convert jpeglib to JS to make this less insane?
				const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
				const bm = await createImageBitmap(blob);
				const offscreen_canvas = new OffscreenCanvas(bm.width, bm.height);
				const offscreen_canvas_ctx = canvas.getContext('2d');
				offscreen_canvas_ctx.drawImage(bm, 0, 0);
				const decodedImageData = ctx.getImageData(0, 0, bm.width, bm.height);
				
				// Copy image (band) into surface
				if (bm) {
					let dst_rect = { x: offset_x, y: offset_y, w: bm.w, h: bm.h };
					console.log("TODO: solve blitting with custom rect");
					// SDL_BlitSurface(bm, null, s.get(), dst_rect);
					s = new ImageData(bm, width, height);
				}
				
				p.seek(opcode_start + opcode_size);
				break;
			}
			
			default:
				if (opcode >= 0x0300 && opcode < 0x8000)
					p.skip((opcode >> 8) * 2);
				else if (opcode >= 0x8000 && opcode < 0x8100)
					break;
				else {
					console.error(`Unimplemented opcode ${opcode.toString(16)} in PICT resource`);
					done = true;
				}
				break;
		}
	}
	
	return s;
}


/*
//  Rescale surface to given dimensions

template <class T>
static void rescale(T *src_pixels, int src_pitch, T *dst_pixels, int dst_pitch, int width, int height, uint32 dx, uint32 dy)
{
	// Brute-force rescaling, no interpolation
	uint32 sy = 0;
	for (int y=0; y<height; y++) {
		T *p = src_pixels + src_pitch / sizeof(T) * (sy >> 16);
		uint32 sx = 0;
		for (int x=0; x<width; x++) {
			dst_pixels[x] = p[sx >> 16];
			sx += dx;
		}
		dst_pixels += dst_pitch / sizeof(T);
		sy += dy;
	}
}

SDL_Surface *rescale_surface(SDL_Surface *s, int width, int height)
{
	if (s == NULL)
		return NULL;

	SDL_Surface *s2 = SDL_CreateRGBSurface(SDL_SWSURFACE, width, height, s->format->BitsPerPixel, s->format->Rmask, s->format->Gmask, s->format->Bmask, s->format->Amask);
	if (s2 == NULL)
		return NULL;

	uint32 dx = (s->w << 16) / width;
	uint32 dy = (s->h << 16) / height;

	switch (s->format->BytesPerPixel) {
		case 1:
			rescale((pixel8 *)s->pixels, s->pitch, (pixel8 *)s2->pixels, s2->pitch, width, height, dx, dy);
			break;
		case 2:
			rescale((pixel16 *)s->pixels, s->pitch, (pixel16 *)s2->pixels, s2->pitch, width, height, dx, dy);
			break;
		case 4:
			rescale((pixel32 *)s->pixels, s->pitch, (pixel32 *)s2->pixels, s2->pitch, width, height, dx, dy);
			break;
	}

	if (s->format->palette)
		SDL_SetPaletteColors(s2->format->palette, s->format->palette->colors, 0, s->format->palette->ncolors);

	return s2;
}

//  Tile surface to fill given dimensions

template <class T>
static void tile(T *src_pixels, int src_pitch, T *dst_pixels, int dst_pitch, int src_width, int src_height, int dst_width, int dst_height)
{
	T *p = src_pixels;
	int sy = 0;
	for (int y=0; y<dst_height; y++) {
		int sx = 0;
		for (int x=0; x<dst_width; x++) {
			dst_pixels[x] = p[sx];
			sx++;
			if (sx == src_width)
				sx = 0;
		}
		dst_pixels += dst_pitch / sizeof(T);
		sy++;
		if (sy == src_height) {
			sy = 0;
			p = src_pixels;
		} else
			p += src_pitch / sizeof(T);
	}
}

SDL_Surface *tile_surface(SDL_Surface *s, int width, int height)
{
	if (s == NULL)
		return NULL;

	SDL_Surface *s2 = SDL_CreateRGBSurface(SDL_SWSURFACE, width, height, s->format->BitsPerPixel, s->format->Rmask, s->format->Gmask, s->format->Bmask, s->format->Amask);
	if (s2 == NULL)
		return NULL;

	switch (s->format->BytesPerPixel) {
		case 1:
			tile((pixel8 *)s->pixels, s->pitch, (pixel8 *)s2->pixels, s2->pitch, s->w, s->h, width, height);
			break;
		case 2:
			tile((pixel16 *)s->pixels, s->pitch, (pixel16 *)s2->pixels, s2->pitch, s->w, s->h, width, height);
			break;
		case 3:
			tile((pixel8 *)s->pixels, s->pitch, (pixel8 *)s2->pixels, s2->pitch, s->w * 3, s->h, width * 3, height);
			break;
		case 4:
			tile((pixel32 *)s->pixels, s->pitch, (pixel32 *)s2->pixels, s2->pitch, s->w, s->h, width, height);
			break;
	}

	if (s->format->palette)
		SDL_SetPaletteColors(s2->format->palette, s->format->palette->colors, 0, s->format->palette->ncolors);

	return s2;
}
*/
//  Draw picture resource centered on screen
function draw_picture_surface(picture) {
	// TODO: replace this stub into a complete conversion of the cpp in the following comment
	if (!picture) return;
	
	const canvasWidth = window._2DContext.canvas.width;
	const canvasHeight = window._2DContext.canvas.height;
	const x = (canvasWidth - picture.width) / 2;
	const y = (canvasHeight - picture.height) / 2;
	window._2DContext.putImageData(picture, x, y);
}
/*
static void draw_picture_surface(std::shared_ptr<SDL_Surface> s)
{
	if (!s)
		return;
	_set_port_to_intro();
	SDL_Surface *video = draw_surface;

	// Default source rectangle
	SDL_Rect src_rect = {0, 0, MIN(s->w, 640), MIN(s->h, 480)};

	// Center picture on screen
	SDL_Rect dst_rect = {(video->w - src_rect.w) / 2, (video->h - src_rect.h) / 2, s->w, s->h};
	if (dst_rect.x < 0)
		dst_rect.x = 0;
	if (dst_rect.y < 0)
		dst_rect.y = 0;

	// Clip if desired (only used for menu buttons)
	if (draw_clip_rect_active) {
		src_rect.w = dst_rect.w = draw_clip_rect.right - draw_clip_rect.left;
		src_rect.h = dst_rect.h = draw_clip_rect.bottom - draw_clip_rect.top;
		src_rect.x = draw_clip_rect.left - (640 - s->w) / 2;
		src_rect.y = draw_clip_rect.top - (480 - s->h) / 2;
		dst_rect.x += draw_clip_rect.left- (640 - s->w) / 2;
		dst_rect.y += draw_clip_rect.top - (480 - s->h) / 2;
	} else {
			// Clear destination to black
			SDL_FillRect(video, NULL, SDL_MapRGB(video->format, 0, 0, 0));
	}
	
	SDL_BlitSurface(s.get(), &src_rect, video, &dst_rect);
	_restore_port();
}
*/
async function draw_picture(rsrc) {
	draw_picture_surface(await picture_to_surface(rsrc));
}
/*
//  Get system color table

struct color_table *build_8bit_system_color_table(void)
{
	// 6*6*6 RGB color cube
	color_table *table = new color_table;
	table->color_count = 6*6*6;
	int index = 0;
	for (int red=0; red<6; red++) {
		for (int green=0; green<6; green++) {
			for (int blue=0; blue<6; blue++) {
				uint8 r = red * 0x33;
				uint8 g = green * 0x33;
				uint8 b = blue * 0x33;
				table->colors[index].red = (r << 8) | r;
				table->colors[index].green = (g << 8) | g;
				table->colors[index].blue = (b << 8) | b;
				index++;
			}
		}
	}
	return table;
}

//  Scroll image across screen

const SCROLLING_SPEED = (csmisc.MACHINE_TICKS_PER_SECOND / 20);

void scroll_full_screen_pict_resource_from_scenario(int pict_resource_number, bool text_block)
{
	// Convert picture resource to surface, free resource
	LoadedResource rsrc;
	get_picture_resource_from_scenario(pict_resource_number, rsrc);
	auto s = picture_to_surface(rsrc);
	if (!s)
		return;

	// Find out in which direction to scroll
	int picture_width = s->w;
	int picture_height = s->h;
	int screen_width = 640;
	int screen_height = 480;
	bool scroll_horizontal = picture_width > screen_width;
	bool scroll_vertical = picture_height > screen_height;

	if (scroll_horizontal || scroll_vertical) {

		// Flush events
		SDL_FlushEvents(SDL_FIRSTEVENT, SDL_LASTEVENT);

		// Prepare source and destination rectangles
		SDL_Rect src_rect = {0, 0, scroll_horizontal ? screen_width : picture_width, scroll_vertical ? screen_height : picture_height};
		SDL_Rect dst_rect = {0, 0, screen_width, screen_height};

		// Scroll loop
		bool done = false, aborted = false;
		uint32 start_tick = machine_tick_count();
		do {

			int32 delta = (machine_tick_count() - start_tick) / (text_block ? (2 * SCROLLING_SPEED) : SCROLLING_SPEED);
			if (scroll_horizontal && delta > picture_width - screen_width) {
				delta = picture_width - screen_width;
				done = true;
			}
			if (scroll_vertical && delta > picture_height - screen_height) {
				delta = picture_height - screen_height;
				done = true;
			}

			// Blit part of picture
			src_rect.x = scroll_horizontal ? delta : 0;
			src_rect.y = scroll_vertical ? delta : 0;
			_set_port_to_intro();
			SDL_BlitSurface(s.get(), &src_rect, draw_surface, &dst_rect);
			_restore_port();
			draw_intro_screen();

			// Give system time
			global_idle_proc();
			yield();

			// Check for events to abort
			SDL_Event event;
			if (SDL_PollEvent(&event)) {
				switch (event.type) {
					case SDL_MOUSEBUTTONDOWN:
					case SDL_KEYDOWN:
					case SDL_CONTROLLERBUTTONDOWN:
						aborted = true;
						break;
				}
			}

		} while (!done && !aborted);
	}
}
*/
//  Initialize image manager, open Images file
export async function initialize_images_manager() {
	let file = null;

	file = new URL(shell.scenario_dir + cseries.getcstr(_interface.strFILENAMES, _interface.filenameIMAGES));
	
	let opened = await ImagesFile.open_file(file);
	if (!opened) {
        alert("Images file could not be opened");
	}
}

/*
//  Set map file to load images from

void set_scenario_images_file(FileSpecifier &file)
{
	ScenarioFile.open_file(file);
}

void unset_scenario_images_file()
{
	ScenarioFile.close_file();
}

void set_shapes_images_file(FileSpecifier &file)
{
	ShapesImagesFile.open_file(file);
}

void set_external_resources_images_file(FileSpecifier &file)
{
    // fail here, instead of above, if Images is missing
	if (!file.Exists() || !ExternalResourcesFile.open_file(file))
	{
		file.SetNameWithPath(getcstr(temporary, strFILENAMES, filenameEXTERNAL_RESOURCES));
		if ((!file.Exists() || !ExternalResourcesFile.open_file(file)) &&
			!ImagesFile.is_open())
		{
			alert_bad_extra_file();
		}
	}
}

void set_sounds_images_file(FileSpecifier &file)
{
	SoundsImagesFile.open_file(file);
}

bool image_file_t::is_open(void)
{
	return rsrc_file.IsOpen() || wad_file.IsOpen();
}

bool image_file_t::has_clut(int id)
{
	return has_rsrc(FOUR_CHARS_TO_INT('c','l','u','t'), FOUR_CHARS_TO_INT('c','l','u','t'), id);
}

bool image_file_t::get_clut(int id, LoadedResource &rsrc)
{
	return get_rsrc(FOUR_CHARS_TO_INT('c','l','u','t'), FOUR_CHARS_TO_INT('c','l','u','t'), id, rsrc);
}

bool image_file_t::get_snd(int id, LoadedResource &rsrc)
{
	return get_rsrc(FOUR_CHARS_TO_INT('s','n','d',' '), FOUR_CHARS_TO_INT('s','n','d',' '), id, rsrc);
}

bool image_file_t::get_text(int id, LoadedResource &rsrc)
{
	return get_rsrc(FOUR_CHARS_TO_INT('T','E','X','T'), FOUR_CHARS_TO_INT('t','e','x','t'), id, rsrc);
}
*/
//  Get/draw image from Images file

export function get_picture_resource_from_images(base_resource, PictRsrc) {
/* TODO: all branches needs testing */
	if (ImagesFile.is_open()) {
		const id = ImagesFile.determine_pict_resource_id(base_resource, _images_file_delta16, _images_file_delta32);
		let result = ImagesFile.get_pict(id, PictRsrc);
		if (result != null) return result;
	}

	if (ExternalResourcesFile.is_open()) {
		let result = ExternalResourcesFile.get_pict(base_resource, PictRsrc);
		if (result != null) return result;
	}

	if (ShapesImagesFile.is_open()) {
		let result = ShapesImagesFile.get_pict(base_resource, PictRsrc);
		if (result != null) return result;
	}
	return null;
}

/*
bool get_sound_resource_from_images(int resource_number, LoadedResource &SoundRsrc)
{
    bool found = false;
    
    if (!found && ImagesFile.is_open())
        found = ImagesFile.get_snd(resource_number, SoundRsrc);
    if (!found && SoundsImagesFile.is_open())
    {
        // Marathon 1 case: only one sound used for intro
        if (resource_number == 1111 || resource_number == 1114)
            found = SoundsImagesFile.get_snd(1240, SoundRsrc);
    }
    
    return found;
}

bool images_picture_exists(int base_resource)
{
	if (shapes_file_is_m1() && (base_resource == MAIN_MENU_BASE || base_resource == MAIN_MENU_BASE+1))
        return true;
    
    LoadedResource PictRsrc;
    return get_picture_resource_from_images(base_resource, PictRsrc);
}

// In the first Marathon, the main menu is drawn from multiple
// shapes in collection 10, instead of a single image. We handle
// this special case by creating the composite images in code,
// and returning these surfaces when the picture is requested.

static auto m1_menu_unpressed = std::shared_ptr<SDL_Surface>(nullptr, SDL_FreeSurface);
static auto m1_menu_pressed = std::shared_ptr<SDL_Surface>(nullptr, SDL_FreeSurface);

static void create_m1_menu_surfaces(void)
{
    if (m1_menu_unpressed || m1_menu_pressed)
        return;
    
    auto s = std::unique_ptr<SDL_Surface>(nullptr);
	if (PlatformIsLittleEndian()) {
    	s.reset(SDL_CreateRGBSurface(SDL_SWSURFACE, 640, 480, 32, 0x000000ff, 0x0000ff00, 0x00ff0000, 0));
	} else {
    	s.reset(SDL_CreateRGBSurface(SDL_SWSURFACE, 640, 480, 32, 0xff000000, 0x00ff0000, 0x0000ff00, 0));
	}
    if (!s)
        return;

    SDL_FillRect(s.get(), NULL, SDL_MapRGB(s->format, 0, 0, 0));
    
    SDL_Rect src, dst;
    src.x = src.y = 0;

    // in comments you can see how the hard-coded numbers were arrived at for
    // Marathon--but for third party scenarios, the math doesn't work, so
    // hard-code the offsets instead
    
//    int top = 0;
//    int bottom = s->h;
    
    SDL_Surface *logo = get_shape_surface(0, 10);
    if (!logo)
    {
        // did it fail because we haven't loaded the menu shapes?
        mark_collection_for_loading(10);
        load_collections(false, false);
        logo = get_shape_surface(0, 10);
    }
    if (logo)
    {
        src.w = dst.w = logo->w;
        src.h = dst.h = logo->h;
//        dst.x = (s->w - logo->w)/2;
//        dst.y = 0;
        dst.x = 75;
        dst.y = 0;
        SDL_BlitSurface(logo, &src, s.get(), &dst);
//        top += logo->h;
        SDL_FreeSurface(logo);
    }
    
    SDL_Surface *credits = get_shape_surface(19, 10);
    if (credits)
    {
        src.w = dst.w = credits->w;
        src.h = dst.h = credits->h;
//        dst.x = (s->w - credits->w)/2;
//        dst.y = s->h - credits->h;
        dst.x = 191;
        dst.y = 466;
        SDL_BlitSurface(credits, &src, s.get(), &dst);
//        bottom -= credits->h;
        SDL_FreeSurface(credits);
    }
    
    SDL_Surface *widget = get_shape_surface(1, 10);
    if (widget)
    {
        src.w = dst.w = widget->w;
        src.h = dst.h = widget->h;
//        dst.x = (s->w - widget->w)/2;
//        dst.y = top + (bottom - top - widget->h)/2;
        dst.x = 102;
        dst.y = 117;
        SDL_BlitSurface(widget, &src, s.get(), &dst);
        SDL_FreeSurface(widget);
    }
    m1_menu_unpressed = std::move(s);
    
    // now, add pressed buttons to copy of this surface
    s.reset(SDL_ConvertSurface(m1_menu_unpressed.get(), m1_menu_unpressed.get()->format, SDL_SWSURFACE));
    
    std::vector<std::pair<int, int> > button_shapes;
    button_shapes.push_back(std::pair<int, int>(_new_game_button_rect, 11));
    button_shapes.push_back(std::pair<int, int>(_load_game_button_rect, 12));
    button_shapes.push_back(std::pair<int, int>(_gather_button_rect, 3));
    button_shapes.push_back(std::pair<int, int>(_join_button_rect, 4));
    button_shapes.push_back(std::pair<int, int>(_prefs_button_rect, 5));
    button_shapes.push_back(std::pair<int, int>(_replay_last_button_rect, 6));
    button_shapes.push_back(std::pair<int, int>(_save_last_button_rect, 7));
    button_shapes.push_back(std::pair<int, int>(_replay_saved_button_rect, 8));
    button_shapes.push_back(std::pair<int, int>(_credits_button_rect, 9));
    button_shapes.push_back(std::pair<int, int>(_quit_button_rect, 10));
    button_shapes.push_back(std::pair<int, int>(_center_button_rect, 2));
    for (std::vector<std::pair<int, int> >::const_iterator it = button_shapes.begin(); it != button_shapes.end(); ++it)
    {
        screen_rectangle *r = get_interface_rectangle(it->first);
        SDL_Surface *btn = get_shape_surface(it->second, 10);
        if (btn)
        {
            src.w = dst.w = btn->w;
            src.h = dst.h = btn->h;
            dst.x = r->left;
            dst.y = r->top;
            SDL_BlitSurface(btn, &src, s.get(), &dst);
            SDL_FreeSurface(btn);
        }
    }
    
    m1_menu_pressed = std::move(s);
}

static bool m1_draw_full_screen_pict_resource_from_images(int pict_resource_number)
{
    if (!shapes_file_is_m1())
        return false;
    if (pict_resource_number == MAIN_MENU_BASE)
    {
        create_m1_menu_surfaces();
        draw_picture_surface(m1_menu_unpressed);
        return true;
    }
    else if (pict_resource_number == MAIN_MENU_BASE+1)
    {
        create_m1_menu_surfaces();
        draw_picture_surface(m1_menu_pressed);
        return true;
    }
    return false;
}
*/
export function draw_full_screen_pict_resource_from_images(pict_resource_number) {
	// TODO: properly convert draw_full_screen_pict_resource_from_images to JS, this method at the moment is just a stub
	let PictRsrc = new FileHandler.LoadedResource();
	let result = get_picture_resource_from_images(pict_resource_number, PictRsrc);
	if (PictRsrc != null) {
		draw_picture(PictRsrc);
	}
}
/*
void draw_full_screen_pict_resource_from_images(int pict_resource_number)
{
	if (m1_draw_full_screen_pict_resource_from_images(pict_resource_number))
		return;
    
    LoadedResource PictRsrc;
    if (get_picture_resource_from_images(pict_resource_number, PictRsrc))
        draw_picture(PictRsrc);
}

//  Get/draw image from scenario

bool get_picture_resource_from_scenario(int base_resource, LoadedResource &PictRsrc)
{
	bool found = false;

	if (!found && ScenarioFile.is_open())
	{
		auto id = ScenarioFile.determine_pict_resource_id(base_resource, _scenario_file_delta16, _scenario_file_delta32);
		found = Plugins::instance()->get_resource(FOUR_CHARS_TO_INT('P','I','C','T'), id, PictRsrc);
		if (!found)
		{
			found = ScenarioFile.get_pict(ScenarioFile.determine_pict_resource_id(base_resource, _scenario_file_delta16, _scenario_file_delta32), PictRsrc);
		}
	}
	
    if (!found && ShapesImagesFile.is_open())
	{
		found = Plugins::instance()->get_resource(FOUR_CHARS_TO_INT('P','I','C','T'), base_resource, PictRsrc);

		if (!found)
		{
			found = ShapesImagesFile.get_pict(base_resource, PictRsrc);
		}
	}
    
    return found;
}

bool scenario_picture_exists(int base_resource)
{
    LoadedResource PictRsrc;
    return get_picture_resource_from_scenario(base_resource, PictRsrc);
}

void draw_full_screen_pict_resource_from_scenario(int pict_resource_number)
{
	LoadedResource PictRsrc;
	if (get_picture_resource_from_scenario(pict_resource_number, PictRsrc))
        draw_picture(PictRsrc);
}

//  Get sound resource from scenario

bool get_sound_resource_from_scenario(int resource_number, LoadedResource &SoundRsrc)
{
	bool found = false;
    
    if (!found && ScenarioFile.is_open())
	{
		found = Plugins::instance()->get_resource(FOUR_CHARS_TO_INT('s','n','d',' '), resource_number, SoundRsrc);
		if (!found)
		{
			found = ScenarioFile.get_snd(resource_number, SoundRsrc);
		}
	}
	
    if (!found && SoundsImagesFile.is_open())
	{
        // Marathon 1 case: only one sound used for chapter screens
		found = Plugins::instance()->get_resource(FOUR_CHARS_TO_INT('s','n','d', ' '), 1240, SoundRsrc);

		if (!found)
		{
			found = SoundsImagesFile.get_snd(1240, SoundRsrc);
		}
	}
    
    return found;
}

// LP: do the same for text resources

bool get_text_resource_from_scenario(int resource_number, LoadedResource &TextRsrc)
{
	if (!ScenarioFile.is_open())
		return false;

	auto success = Plugins::instance()->get_resource(FOUR_CHARS_TO_INT('T','E','X','T'), resource_number, TextRsrc);

	if (!success)
	{
		success = ScenarioFile.get_text(resource_number, TextRsrc);
	}
	
	return success;
}

//  Calculate color table for image

struct color_table *calculate_picture_clut(int CLUTSource, int pict_resource_number)
{
	struct color_table *picture_table = NULL;

    // with TRUE_COLOR_ONLY turned on, specific cluts don't matter
    picture_table = build_8bit_system_color_table();
    build_direct_color_table(picture_table, 32);
    
	return picture_table;
}

//  Convert picture and CLUT data from wad file to PICT resource

bool image_file_t::make_rsrc_from_pict(void *data, size_t length, LoadedResource &rsrc, void *clut_data, size_t clut_length)
{
	if (length < 10)
		return false;

	// Extract size and depth
	uint8 *p = (uint8 *)data;
	int height = (p[4] << 8) + p[5];
	int width = (p[6] << 8) + p[7];
	int depth = (p[8] << 8) + p[9];
	if (depth != 8 && depth != 16)
		return false;

	// 8-bit depth requires CLUT
	if (depth == 8) {
		if (clut_data == NULL || clut_length != 6 + 256 * 6)
			return false;
	}

	// size(2), rect(8), versionOp(2), version(2), headerOp(26)
	int output_length = 2 + 8 + 2 + 2 + 26;
	int row_bytes;
	if (depth == 8) {
		// opcode(2), pixMap(46), colorTable(8+256*8), srcRect/dstRect/mode(18), data(variable)
		row_bytes = width;
		output_length += 2 + 46 + 8+256*8 + 18;
	} else {
		// opcode(2), pixMap(50), srcRect/dstRect/mode(18), data(variable)
		row_bytes = width * 2;
		output_length += 2 + 50 + 18;
	}
	// data(variable), opEndPic(2)
	output_length += row_bytes * height + 2;

	// Allocate memory for Mac PICT resource
	void *pict_rsrc = malloc(output_length);
	if (pict_rsrc == NULL)
		return false;
	memset(pict_rsrc, 0, output_length);

	// Convert pict tag to Mac PICT resource
	uint8 *q = (uint8 *)pict_rsrc;

	// 1. PICT header
	q[0] = output_length >> 8;
	q[1] = output_length;
	memcpy(q + 2, p, 8);
	q += 10;

	// 2. VersionOp/Version/HeaderOp
	q[0] = 0x00; q[1] = 0x11; // versionOp
	q[2] = 0x02; q[3] = 0xff; // version
	q[4] = 0x0c; q[5] = 0x00; // headerOp
	q[6] = 0xff; q[7] = 0xfe; // header version
	q[11] = 0x48; // hRes
	q[15] = 0x48; // vRes
	memcpy(q + 18, p, 8);
	q += 30;

	// 3. opcode
	if (depth == 8) {
		q[0] = 0x00; q[1] = 0x98;	// PackBitsRect
		q += 2;
	} else {
		q[0] = 0x00; q[1] = 0x9a;	// DirectBitsRect
		q += 6; // skip pmBaseAddr
	}

	// 4. PixMap
	q[0] = (row_bytes >> 8) | 0x80;
	q[1] = row_bytes;
	memcpy(q + 2, p, 8);
	q[13] = 0x01; // packType = unpacked
	q[19] = 0x48; // hRes
	q[23] = 0x48; // vRes
	q[27] = (depth == 8 ? 0 : 0x10); // pixelType
	q[29] = depth; // pixelSize
	q[31] = (depth == 8 ? 1 : 3); // cmpCount
	q[33] = (depth == 8 ? 8 : 5); // cmpSize
	q += 46;

	// 5. ColorTable
	if (depth == 8) {
		q[7] = 0xff; // ctSize
		q += 8;
		uint8 *p = (uint8 *)clut_data + 6;
		for (int i=0; i<256; i++) {
			q++;
			*q++ = i;	// value
			*q++ = *p++;	// red
			*q++ = *p++;
			*q++ = *p++;	// green
			*q++ = *p++;
			*q++ = *p++;	// blue
			*q++ = *p++;
		}
	}

	// 6. source/destination Rect and transfer mode
	memcpy(q, p, 8);
	memcpy(q + 8, p, 8);
	q += 18;

	// 7. graphics data
	memcpy(q, p + 10, row_bytes * height);
	q += row_bytes * height;

	// 8. OpEndPic
	q[0] = 0x00;
	q[1] = 0xff;

	rsrc.SetData(pict_rsrc, output_length);
	return true;
}

bool image_file_t::make_rsrc_from_clut(void *data, size_t length, LoadedResource &rsrc)
{
	const size_t input_length = 6 + 256 * 6;	// 6 bytes header, 256 entries with 6 bytes each
	const size_t output_length = 8 + 256 * 8;	// 8 bytes header, 256 entries with 8 bytes each

	if (length != input_length)
		return false;

	// Allocate memory for Mac CLUT resource
	void *clut_rsrc = malloc(output_length);
	if (clut_rsrc == NULL)
		return false;
	memset(clut_rsrc, 0, output_length);

	// Convert clut tag to Mac CLUT resource
	uint8 *p = (uint8 *)data;
	uint8 *q = (uint8 *)clut_rsrc;

	// 1. Header
	q[6] = p[0]; // color count
	q[7] = p[1];
	p += 6;
	q += 8;

	// 2. Color table
	for (int i=0; i<256; i++) {
		q++;
		*q++ = i;		// value
		*q++ = *p++;	// red
		*q++ = *p++;
		*q++ = *p++;	// green
		*q++ = *p++;
		*q++ = *p++;	// blue
		*q++ = *p++;
	}

	rsrc.SetData(clut_rsrc, output_length);
	return true;
}

std::unique_ptr<SDL_Surface, decltype(&SDL_FreeSurface)> find_title_screen(FileSpecifier& file)
{
	image_file_t image_file;
	if (image_file.open_file(file))
	{
		for (auto i = 2; i >= 0; --i)
		{
			LoadedResource title_screen;
			if (image_file.get_pict(INTRO_SCREEN_BASE + i + _images_file_delta32, title_screen))
			{
				return picture_to_surface(title_screen);
			}
			
			if (image_file.get_pict(INTRO_SCREEN_BASE + i + _images_file_delta16, title_screen))
			{
				return picture_to_surface(title_screen);
			}
			
			if (image_file.get_pict(INTRO_SCREEN_BASE + i, title_screen))
			{
				return picture_to_surface(title_screen);
			}
		}
	}

	return std::unique_ptr<SDL_Surface, decltype(&SDL_FreeSurface)>(nullptr, SDL_FreeSurface);
}

std::unique_ptr<SDL_Surface, decltype(&SDL_FreeSurface)> find_m1_title_screen(FileSpecifier& file)
{
	image_file_t shapes_file;
	if (shapes_file.open_file(file))
	{
		LoadedResource title_screen;
		if (shapes_file.get_pict(1114, title_screen))
		{
			return picture_to_surface(title_screen);
		}
	}

	return std::unique_ptr<SDL_Surface, decltype(&SDL_FreeSurface)>(nullptr, SDL_FreeSurface);
}
*/
