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
	
	File-handler classes
	by Loren Petrich,
	August 11, 2000

	These are designed to provide some abstract interfaces to file and directory objects.
	
	Most of these routines return whether they had succeeded;
	more detailed error codes are API-specific.
	Attempted to support stdio I/O directly, but on my Macintosh, at least,
	the performance was much poorer. This is possibly due to "fseek" having to
	actually read the file or something.
	
	Merged all the Macintosh-specific code into these base classes, so that
	it will be selected with a preprocessor statement when more than one file-I/O
	API is supported.

Dec 7, 2000 (Loren Petrich):
	Added a MacOS-specific file-creation function that allows direct specification
	of type and creator codes

Jan 25, 2002 (Br'fin (Jeremy Parsons)):
	Added TARGET_API_MAC_CARBON for Carbon.h
	Rearranged initializers in DirectorySpecifier constructor to appease compiler warnings

March 18, 2002 (Br'fin (Jeremy Parsons)):
	Added FileSpecifier::SetParentToResources for Carbon
*/

import * as resource_manager from './resource_manager.js';

/*
// For the filetypes
#include "tags.h"

// Returned by .GetError() for unknown errors
constexpr int unknown_filesystem_error = -1;

*/

export const ENOENT = 2;

export class OpenedFile {
	// Stub
}
/*
// Abstraction for opened files; it does reading, writing, and closing of such files, without doing anything to the files' specifications
class OpenedFile
{
	// This class will need to set the refnum and error value appropriately 
	friend class FileSpecifier;
	friend class opened_file_device;
	
public:
	bool IsOpen();
	bool Close();
	
	bool GetPosition(int32& Position);
	bool SetPosition(int32 Position);
	
	bool GetLength(int32& Length);
	bool SetLength(int32 Length);
	
	bool Read(int32 Count, void *Buffer);
	bool Write(int32 Count, void *Buffer);
		
	OpenedFile();
	~OpenedFile() {Close();}	// Auto-close when destroying

	int GetError() {return err;}
	SDL_RWops *GetRWops() {return f;}
	SDL_RWops *TakeRWops();		// Hand over SDL_RWops

private:
	SDL_RWops *f;	// File handle
	int err;		// Error code
	bool is_forked;
	int32 fork_offset, fork_length;
};

class opened_file_device {
public:
	typedef char char_type;
	typedef boost::iostreams::seekable_device_tag category;
	std::streamsize read(char* s, std::streamsize n);
	std::streamsize write(const char* s, std::streamsize n);
	std::streampos seek(boost::iostreams::stream_offset off, std::ios_base::seekdir way);

	opened_file_device(OpenedFile& f);

private:
	OpenedFile& f;
};
*/

// Abstraction for loaded resources; this object will release that resource when it finishes. MacOS resource handles will be assumed to be locked.
export class LoadedResource {
	constructor() {
		this.p = null; // Byte array? Original is `void *`
		this.size = 0;
	}
	
	IsLoaded() {
		return this.p != null;
	}
	
	Unload() {
		this.p = null;
		this.size = 0;
	}
	
	GetLength() {
		return this.size;
	}
	
	GetPointer(DoDetach = false) {
		let ret = this.p;
		if (DoDetach)
			this.Detach();
		return ret;
	}
	
	// C++ says: Make resource from raw resource data; the caller gives up ownership of the pointed to memory block
	SetData(data, length) {
		this.Unload();
		this.p = data;
		this.size = length;
	}
	
	// C++ says: Detaches an allocated resource from this object (keep private to avoid memory leaks)
	Detach() {
		this.p = null;
		this.size = 0;
	}

}

export class OpenedResourceFile {
	constructor(dataView = null) {
		this.err = 0;
		this.f = dataView; // DataView
		this.saved_f = null; // DataView
	}
	
	// TODO: when everything works, see if I can get rid of push/pop because I started this about 24 years after resource forks became obsolete
	// TODO: confusing comments for original Push/Pop:
	// Pushing and popping the current file -- necessary in the MacOS version, since resource forks are globally open with one of them the current top one.
	// vs.
	// Pushing and popping are unnecessary for the MacOS versions of Get() and Check()

	Push() {
		this.saved_f = resource_manager.cur_res_file();
		if (this.saved_f !== this.f)
			resource_manager.use_res_file(this.f);
		this.err = 0;
		return true;
	}
	
	Pop() {
		if (this.f !== this.saved_f) {
			resource_manager.use_res_file(this.saved_f);
		}
		this.err = 0;
		return true;
	}

	// Check simply checks if a resource is present; returns whether it is or not
	// id is 4-bytes from FOUR_CHARS_TO_INT
	Check(Type, ID) {
		this.Push();
		const result = resource_manager.has_1_resource(Type, ID);
		this.err = result ? 0 : ENOENT;
		this.Pop();
		return result;
	}

	// Get loads a resource; returns what used to be stored in rsrc ptr, !=null -> success
	Get(Type, ID, rsrc) {
		this.Push();
		const result = resource_manager.get_1_resource(Type, ID, rsrc);
		this.err = (result != null) ? 0 : ENOENT;
		this.Pop();
		return result;
	}
	
	// Overload with 4 characters
	GetChars(t1, t2, t3, t4, id, rsrc) {
		return this.Get(FOUR_CHARS_TO_INT(t1, t2, t3, t4), id, rsrc);
	}

	// Whether file is open
	IsOpen() {
		return this.f != null;
	}

	// Close the file
	Close() {
		this.f = null;
		this.err = 0;
		return true;
	}

	// TODO: implement according to original
	Open(dataView) {
		this.f = dataView;
		this._isOpen = true;
		return true;
	}

	// Return current error code
	GetError() {
		return this.err;
	}
}

/*
// Directories are treated like files
#define DirectorySpecifier FileSpecifier

// Directory entry, returned by FileSpecifier::ReadDirectory()
struct dir_entry {
	dir_entry() : is_directory(false), date(0) {}
	dir_entry(const string& n, bool is_dir, TimeType d = 0) : name(n), is_directory(is_dir), date(d) {}

	bool operator<(const dir_entry &other) const
	{
		if (is_directory == other.is_directory)
			return name < other.name;
		else	// Sort directories before files
			return is_directory > other.is_directory;
	}

	bool operator==(const dir_entry& other) const {
		return is_directory == other.is_directory && name == other.name;
	}

	string name;		// Entry name
	bool is_directory;	// Entry is a directory (plain file otherwise)
	TimeType date;          // modification date
};

*/

// Minimal JS equivalent for the old CPP FileSpecifier
export class FileSpecifier {
	constructor(url) {
		this.url = url;
		this.data = null; // Will hold DataView
		this.is_forked = false;
		this.fork_offset = 0;
		this.fork_length = 0;
	}

	async Open(OFile) {
		if (OFile instanceof OpenedResourceFile) {
			return await this.Open_OpenedResourceFile(OFile);
		} else if (OFile instanceof OpenedFile) {
			return await this.Open_OpenedFile(OFile);
		} else {
			throw new TypeError("OFile must be an instance of OpenedFile or OpenedResourceFile");
		}
	}
	
	// FileSpecifier::Open(OpenedFile &OFile, bool Writable)
	async Open_OpenedFile() {
		try {
			const response = await fetch(this.url);
			if (!response.ok) return false;
			const buffer = await response.arrayBuffer();
			this.data = new DataView(buffer);
		} catch (e) {
			return false;
		}
		
		// Try to detect AppleSingle
		const appleSingleDecodeAttempt = resource_manager.is_applesingle(this.data, false);
		if (appleSingleDecodeAttempt != null) {
			this.is_forked = true;
			this.fork_offset = appleSingleDecodeAttempt.offset;
			this.fork_length = appleSingleDecodeAttempt.dataLength;
			return true;
		}
	
		// Try to detect MacBinary
		const macbinaryDecodeAttempt = resource_manager.is_macbinary(this.data);
		if (macbinaryDecodeAttempt != null) {
			this.is_forked = true;
			this.fork_offset = 128;
			this.fork_length = macbinaryDecodeAttempt.dataLength;
			return true;
		}
		
		// Default case: start at beginning
		this.fork_offset = 0;
		this.fork_length = this.data.length;
		return true;
	}
	
	// FileSpecifier::Open(OpenedResourceFile &OFile, bool Writable)
	async Open_OpenedResourceFile(OFile) {
		OFile.Close();
		
		const f = await resource_manager.open_res_file(this); // this = FileSpecifier instance
		OFile.f = f;
		
		this.err = f ? 0 : 'unknown_filesystem_error';
		return !!f;
	}
	
	GetPath() {
		return this.url;
	}
	
	IsOpen() {
		return this.f != null;
	}
	
	Close() {
		this.f = null;
		return true;
	}
}

/*
// Abstraction for file specifications; designed to encapsulate both directly-specified paths and MacOS FSSpecs
class FileSpecifier
{	
public:
	// The typecodes here are the symbolic constants defined in tags.h (_typecode_creator, etc.)
	
	// Get the name (final path element) as a C string:
	// assumes enough space to hold it if getting (max. 256 bytes)
	void GetName(char *Name) const;
	
	//   Looks in all directories in the current data search
	//   path for a file with the relative path "NameWithPath" and
	//   sets the file specifier to the full path of the first file
	//   found.
	// "NameWithPath" follows Unix-like syntax: <dirname>/<dirname>/<dirname>/filename
	// A ":" will be translated into a "/" in the MacOS.
	// Returns whether or not the setting was successful
	bool SetNameWithPath(const char *NameWithPath);
	bool SetNameWithPath(const char* NameWithPath, const DirectorySpecifier& Directory);

	void SetTempName(const FileSpecifier& other);

	// Move the directory specification
	void ToDirectory(DirectorySpecifier& Dir);
	void FromDirectory(DirectorySpecifier& Dir);

	// These functions take an appropriate one of the typecodes used earlier;
	// this is to try to cover the cases of both typecode attributes
	// and typecode suffixes.
	bool Create(Typecode Type);
	
	// Opens a file:
	bool OpenForWritingText(OpenedFile& OFile); // converts LF to CRLF on Windows
	
	// Opens either a MacOS resource fork or some imitation of it:
	bool Open(OpenedResourceFile& OFile, bool Writable=false);
	
	// These calls are for creating dialog boxes to set the filespec
	// A null pointer means an empty string
	bool ReadDirectoryDialog();
	bool ReadDialog(Typecode Type, const char *Prompt=NULL);
	bool WriteDialog(Typecode Type, const char *Prompt=NULL, const char *DefaultName=NULL);
	
	// Write dialog box for savegames (must be asynchronous, allowing the sound
	// to continue in the background)
	bool WriteDialogAsync(Typecode Type, char *Prompt=NULL, char *DefaultName=NULL);
	
	// Check on whether a file exists, and its type
	bool Exists();
	bool IsDir();
	
	// Gets the modification date
	TimeType GetDate();
	
	// Returns _typecode_unknown if the type could not be identified;
	// the types returned are the _typecode_stuff in tags.h
	Typecode GetType();
	
	// Copy file contents
	bool CopyContents(FileSpecifier& File);
	
	// Delete file
	bool Delete();

	// Rename file
	bool Rename(const FileSpecifier& Destination);

	// Copy file specification
	const FileSpecifier &operator=(const FileSpecifier &other);

	// hide extensions known to Aleph One
	static std::string HideExtension(const std::string& filename);

	FileSpecifier();
	FileSpecifier(const string &s) : name(s), err(0) {canonicalize_path();}
	FileSpecifier(const char *s) : name(s), err(0) {canonicalize_path();}
	FileSpecifier(const FileSpecifier &other) : name(other.name), err(other.err) {}

	bool operator==(const FileSpecifier &other) const {return name == other.name;}
	bool operator!=(const FileSpecifier &other) const {return name != other.name;}

	void SetToLocalDataDir();		// Per-user directory (for temporary files)
	void SetToPreferencesDir();		// Directory for preferences (per-user)
	void SetToSavedGamesDir();		// Directory for saved games (per-user)
	void SetToQuickSavesDir();		// Directory for auto-named saved games (per-user)
	void SetToImageCacheDir();		// Directory for image cache (per-user)
	void SetToRecordingsDir();		// Directory for recordings (per-user)

	void AddPart(const string &part);
	FileSpecifier &operator+=(const FileSpecifier &other) {AddPart(other.name); return *this;}
	FileSpecifier &operator+=(const string &part) {AddPart(part); return *this;}
	FileSpecifier &operator+=(const char *part) {AddPart(string(part)); return *this;}
	FileSpecifier operator+(const FileSpecifier &other) const {FileSpecifier a(name); a.AddPart(other.name); return a;}
	FileSpecifier operator+(const string &part) const {FileSpecifier a(name); a.AddPart(part); return a;}
	FileSpecifier operator+(const char *part) const {FileSpecifier a(name); a.AddPart(string(part)); return a;}

	void SplitPath(string &base, string &part) const;
	void SplitPath(DirectorySpecifier &base, string &part) const {string b; SplitPath(b, part); base = b;}

	bool CreateDirectory();
	
	// Return directory contents (following symlinks), excluding dot-prefixed files
	bool ReadDirectory(vector<dir_entry> &vec);
	vector<dir_entry> ReadDirectory() {vector<dir_entry> vec; ReadDirectory(vec); return vec;}
	
	// Return the names of all entries in a ZIP archive
	bool ReadZIP(vector<string> &vec);
	vector<string> ReadZIP() {vector<string> vec; ReadZIP(vec); return vec;}

	int GetError() const {return err;}

private:
	void canonicalize_path(void);

	string name;	// Path name
	int err;
};

// inserts dir before the search path, then restores the original path
// when going out of scope
class ScopedSearchPath
{
public:
	ScopedSearchPath(const DirectorySpecifier& dir);
	~ScopedSearchPath();

private:
	ScopedSearchPath(const ScopedSearchPath&) = delete;
	ScopedSearchPath& operator=(const ScopedSearchPath&) = delete;

	const DirectorySpecifier d;
};

#include "cseries.h"
#include "shell.h"
#include "interface.h"
#include "screen.h"
#include "tags.h"

#ifdef HAVE_ZZIP
#include "SDL_rwops_zzip.h"
#endif

#define PATH_SEP '/'

#include "sdl_dialogs.h"
#include "sdl_widgets.h"
#include "SoundManager.h" // !

#include "preferences.h"

#ifdef HAVE_NFD
#include "nfd.h"
#endif

namespace io = boost::iostreams;
namespace sys = boost::system;
namespace fs = boost::filesystem;

// From shell_sdl.cpp
extern vector<DirectorySpecifier> data_search_path;
extern DirectorySpecifier local_data_dir, preferences_dir, saved_games_dir, quick_saves_dir, image_cache_dir, recordings_dir;

#ifdef O_BINARY // Microsoft extension
constexpr int o_binary = O_BINARY;
#else
constexpr int o_binary = 0;
#endif

static int to_posix_code_or_unknown(sys::error_code ec)
{
	const auto cond = ec.default_error_condition();
	return cond.category() == sys::generic_category() ? cond.value() : unknown_filesystem_error;
}

static fs::path utf8_to_path(const std::string& utf8) { return utf8; }
static std::string path_to_utf8(const fs::path& path) { return path.native(); }

// utf8_zzip_io(): a zzip I/O handler set with a UTF-8-compatible 'open' handler
#ifdef HAVE_ZZIP
static const zzip_plugin_io_handlers& utf8_zzip_io() { return *zzip_get_default_io(); }
#endif // HAVE_ZZIP

// Opened file

OpenedFile::OpenedFile() : f(NULL), err(0), is_forked(false), fork_offset(0), fork_length(0) {}

bool OpenedFile::IsOpen()
{
	return f != NULL;
}

bool OpenedFile::Close()
{
	if (f) {
		SDL_RWclose(f);
		f = NULL;
		err = 0;
	}
	is_forked = false;
	fork_offset = 0;
	fork_length = 0;
	return true;
}

bool OpenedFile::GetPosition(int32 &Position)
{
	if (f == NULL)
		return false;

	err = 0;
	Position = SDL_RWtell(f) - fork_offset;
	return true;
}

bool OpenedFile::SetPosition(int32 Position)
{
	if (f == NULL)
		return false;

	err = 0;
	if (SDL_RWseek(f, Position + fork_offset, SEEK_SET) < 0)
		err = unknown_filesystem_error;
	return err == 0;
}

bool OpenedFile::GetLength(int32 &Length)
{
	if (f == NULL)
		return false;

	if (is_forked)
		Length = fork_length;
	else {
		int32 pos = SDL_RWtell(f);
		SDL_RWseek(f, 0, SEEK_END);
		Length = SDL_RWtell(f);
		SDL_RWseek(f, pos, SEEK_SET);
	}
	err = 0;
	return true;
}

bool OpenedFile::Read(int32 Count, void *Buffer)
{
	if (f == NULL)
		return false;

	err = 0;
	return (SDL_RWread(f, Buffer, 1, Count) == Count);
}

bool OpenedFile::Write(int32 Count, void *Buffer)
{
	if (f == NULL)
		return false;

	err = 0;
	return (SDL_RWwrite(f, Buffer, 1, Count) == Count);
}


SDL_RWops *OpenedFile::TakeRWops ()
{
	SDL_RWops *taken = f;
	f = NULL;
	Close ();
	return taken;
}

opened_file_device::opened_file_device(OpenedFile& f) : f(f) { }

std::streamsize opened_file_device::read(char* s, std::streamsize n)
{
	return SDL_RWread(f.GetRWops(), s, 1, n);
}

std::streamsize opened_file_device::write(const char* s, std::streamsize n)
{
	return SDL_RWwrite(f.GetRWops(), s, 1, n);
}

std::streampos opened_file_device::seek(io::stream_offset off, std::ios_base::seekdir way)
{
	std::streampos pos;

	switch (way)
	{
	case std::ios_base::beg:
		pos = SDL_RWseek(f.GetRWops(), off + f.fork_offset, SEEK_SET);
		break;
	case std::ios_base::end:
		pos = SDL_RWseek(f.GetRWops(), off, SEEK_END);
		break;
	case std::ios_base::cur:
		pos = SDL_RWseek(f.GetRWops(), off, SEEK_CUR);
		break;
	default:
		break;
	}

	return pos - static_cast<std::streampos>(f.fork_offset);
}

// Opened resource file

OpenedResourceFile::OpenedResourceFile() : f(NULL), saved_f(NULL), err(0) {}

bool OpenedResourceFile::Push()
{
	saved_f = cur_res_file();
	if (saved_f != f)
		use_res_file(f);
	err = 0;
	return true;
}

bool OpenedResourceFile::Pop()
{
	if (f != saved_f)
		use_res_file(saved_f);
	err = 0;
	return true;
}

bool OpenedResourceFile::IsOpen()
{
	return f != NULL;
}

bool OpenedResourceFile::Close()
{
	if (f) {
		close_res_file(f);
		f = NULL;
		err = 0;
	}
	return true;
}


// File specification
//AS: Constructor moved here to fix linking errors
FileSpecifier::FileSpecifier(): err(0) {}
const FileSpecifier &FileSpecifier::operator=(const FileSpecifier &other)
{
	if (this != &other) {
		name = other.name;
		err = other.err;
	}
	return *this;
}

// Create file
bool FileSpecifier::Create(Typecode Type)
{
	Delete();
	// files are automatically created when opened for writing
	err = 0;
	return true;
}

// Create directory
bool FileSpecifier::CreateDirectory()
{
	sys::error_code ec;
	const bool created_dir = fs::create_directory(utf8_to_path(name), ec);
	err = ec.value() == 0 ? (created_dir ? 0 : EEXIST) : to_posix_code_or_unknown(ec);
	return err == 0;
}

#ifdef HAVE_ZZIP
static std::string unix_path_separators(const std::string& input)
{
	if (PATH_SEP == '/') return input;

	std::string output;
	for (std::string::const_iterator it = input.begin(); it != input.end(); ++it) {
		if (*it == PATH_SEP)
			output.push_back('/');
		else
			output.push_back(*it);
	}

	return output;
}
#endif

// Open data file
bool FileSpecifier::OpenForWritingText(OpenedFile& OFile)
{
	OFile.Close();
	OFile.f = SDL_RWFromFile(GetPath(), "w");
	err = OFile.f ? 0 : unknown_filesystem_error;
	return err == 0;
}

// Open resource file
bool FileSpecifier::Open(OpenedResourceFile &OFile, bool Writable)
{
	OFile.Close();

	OFile.f = open_res_file(*this);
	err = OFile.f ? 0 : unknown_filesystem_error;
	if (OFile.f == NULL) {
		return false;
	} else
		return true;
}

// Check for existence of file
bool FileSpecifier::Exists()
{
	// Check whether the file is readable
	err = 0;
	const bool access_ok = access(GetPath(), R_OK) == 0;
	if (!access_ok)
		err = errno;
	
#ifdef HAVE_ZZIP
	if (err)
	{
		// Check whether zzip can open the file (slow!)
		const auto n = unix_path_separators(name);
		ZZIP_FILE* file = zzip_open_ext_io(n.c_str(), O_RDONLY|o_binary, ZZIP_ONLYZIP, nullptr, &utf8_zzip_io());
		if (file)
		{
			zzip_close(file);
			return true;
		}
		else
		{
			return false;
		}
	}
#endif
	return (err == 0);
}

bool FileSpecifier::IsDir()
{
	sys::error_code ec;
	const bool is_dir = fs::is_directory(utf8_to_path(name), ec);
	err = to_posix_code_or_unknown(ec);
	return err == 0 && is_dir;
}

// Get modification date
TimeType FileSpecifier::GetDate()
{
	sys::error_code ec;
	const auto mtime = fs::last_write_time(utf8_to_path(name), ec);
	err = to_posix_code_or_unknown(ec);
	return err == 0 ? mtime : 0;
}

static const char * alephone_extensions[] = {
	".sceA",
	".sgaA",
	".filA",
	".phyA",
	".shpA",
	".sndA",
	0
};

std::string FileSpecifier::HideExtension(const std::string& filename)
{
	if (environment_preferences->hide_extensions)
	{
		const char **extension = alephone_extensions;
		while (*extension)
		{
			if (boost::algorithm::ends_with(filename, *extension))
			{
				return filename.substr(0, filename.length() - strlen(*extension));
			}
			
		++extension;
		}
	}

	return filename;
}

struct extension_mapping
{
	const char *extension;
	bool case_sensitive;
	Typecode typecode;
};

static extension_mapping extensions[] = 
{
	// some common extensions, to speed up building map lists
	{ "dds", false, _typecode_unknown },
	{ "jpg", false, _typecode_unknown },
	{ "png", false, _typecode_unknown },
	{ "bmp", false, _typecode_unknown },
	{ "txt", false, _typecode_unknown },
	{ "ttf", false, _typecode_unknown },

	{ "lua", false, _typecode_netscript }, // netscript, or unknown?
	{ "mml", false, _typecode_unknown }, // no type code for this yet

	{ "sceA", false, _typecode_scenario },
	{ "sgaA", false, _typecode_savegame },
	{ "filA", false, _typecode_film },
	{ "phyA", false, _typecode_physics },
	{ "ShPa", true,  _typecode_shapespatch }, // must come before shpA
	{ "shpA", false, _typecode_shapes },
	{ "sndA", false, _typecode_sounds },

	{ "scen", false, _typecode_scenario },
	{ "shps", false, _typecode_shapes },
	{ "phys", false, _typecode_physics },
	{ "sndz", false, _typecode_sounds },

	{ "mpg", false, _typecode_movie },

	{ "appl", false, _typecode_application },

	{0, false, _typecode_unknown}
};

// Determine file type
Typecode FileSpecifier::GetType()
{

	// if there's an extension, assume it's correct
	const char *extension = strrchr(GetPath(), '.');
	if (extension) {
		extension_mapping *mapping = extensions;
		while (mapping->extension)
		{ 
			if (( mapping->case_sensitive && (strcmp(extension + 1, mapping->extension) == 0)) ||
			    (!mapping->case_sensitive && (strcasecmp(extension + 1, mapping->extension) == 0)))
			{
				return mapping->typecode;
			}
			++mapping;
		}
	}

	// Open file
	OpenedFile f;
	if (!Open(f))
		return _typecode_unknown;
	SDL_RWops *p = f.GetRWops();
	int32 file_length = 0;
	f.GetLength(file_length);

	// Check for Sounds file
	{
		f.SetPosition(0);
		uint32 version = SDL_ReadBE32(p);
		uint32 tag = SDL_ReadBE32(p);
		if ((version == 0 || version == 1) && tag == FOUR_CHARS_TO_INT('s', 'n', 'd', '2'))
			return _typecode_sounds;
	}

	// Check for Map/Physics file
	{
		f.SetPosition(0);
		int version = SDL_ReadBE16(p);
		int data_version = SDL_ReadBE16(p);
		if ((version == 0 || version == 1 || version == 2 || version == 4) && (data_version == 0 || data_version == 1 || data_version == 2)) {
			SDL_RWseek(p, 68, SEEK_CUR);
			int32 directory_offset = SDL_ReadBE32(p);
			if (directory_offset >= file_length)
				goto not_map;
			f.SetPosition(128);
			uint32 tag = SDL_ReadBE32(p);
			// ghs: I do not believe this list is comprehensive
			//      I think it's just what we've seen so far?
			switch (tag) {
			case LINE_TAG:
			case POINT_TAG:
			case SIDE_TAG:
				return _typecode_scenario;
				break;
			case MONSTER_PHYSICS_TAG:
				return _typecode_physics;
				break;
			}
				
		}
not_map: ;
	}

	// Check for Shapes file
	{
		f.SetPosition(0);
		for (int i=0; i<32; i++) {
			uint32 status_flags = SDL_ReadBE32(p);
			int32 offset = SDL_ReadBE32(p);
			int32 length = SDL_ReadBE32(p);
			int32 offset16 = SDL_ReadBE32(p);
			int32 length16 = SDL_ReadBE32(p);
			if (status_flags != 0
			 || (offset != NONE && (offset >= file_length || offset + length > file_length))
			 || (offset16 != NONE && (offset16 >= file_length || offset16 + length16 > file_length)))
				goto not_shapes;
			SDL_RWseek(p, 12, SEEK_CUR);
		}
		return _typecode_shapes;
not_shapes: ;
	}

	// Not identified
	return _typecode_unknown;
}

// Delete file
bool FileSpecifier::Delete()
{
	sys::error_code ec;
	const bool removed = fs::remove(utf8_to_path(name), ec);
	err = ec.value() == 0 ? (removed ? 0 : ENOENT) : to_posix_code_or_unknown(ec);
	return err == 0;
}

bool FileSpecifier::Rename(const FileSpecifier& Destination)
{
	sys::error_code ec;
	fs::rename(utf8_to_path(name), utf8_to_path(Destination.name), ec);
	err = to_posix_code_or_unknown(ec);
	return err == 0;
}

// Set to preferences directory
void FileSpecifier::SetToPreferencesDir()
{
	name = preferences_dir.name;
}

// Set to saved games directory
void FileSpecifier::SetToSavedGamesDir()
{
	name = saved_games_dir.name;
}

// Set to newer saved games directory
void FileSpecifier::SetToQuickSavesDir()
{
	name = quick_saves_dir.name;
}

// Set to image cache directory
void FileSpecifier::SetToImageCacheDir()
{
	name = image_cache_dir.name;
}

// Set to recordings directory
void FileSpecifier::SetToRecordingsDir()
{
	name = recordings_dir.name;
}

static string local_path_separators(const char *path)
{
	string local_path = path;
	if (PATH_SEP == '/') return local_path;
	
	for (size_t k = 0; k  < local_path.size(); ++k) {
		if (local_path[k] == '/') 
			local_path[k] = PATH_SEP;
	}

	return local_path;
}

// Traverse search path, look for file given relative path name
bool FileSpecifier::SetNameWithPath(const char *NameWithPath)
{
	if (*NameWithPath == '\0') {
		err = ENOENT;
		return false;
	}

	FileSpecifier full_path;
	string rel_path = local_path_separators(NameWithPath);

	vector<DirectorySpecifier>::const_iterator i = data_search_path.begin(), end = data_search_path.end();
	while (i != end) {
		full_path = *i + rel_path;
		if (full_path.Exists()) {
			name = full_path.name;
			err = 0;
			return true;
		}
		i++;
	}
	err = ENOENT;
	return false;
}

bool FileSpecifier::SetNameWithPath(const char* NameWithPath, const DirectorySpecifier& Directory) 
{
	if (*NameWithPath == '\0') {
		err = ENOENT;
		return false;
	}
    
	FileSpecifier full_path;
	string rel_path = local_path_separators(NameWithPath);
	
	full_path = Directory + rel_path;
	if (full_path.Exists()) {
		name = full_path.name;
		err = 0;
		return true;
	}

	err = ENOENT;
	return false;
}

void FileSpecifier::SetTempName(const FileSpecifier& other)
{
	name = other.name + fs::unique_path("%%%%%%").string();
}

// Get last element of path
void FileSpecifier::GetName(char *part) const
{
	string::size_type pos = name.rfind(PATH_SEP);
	if (pos == string::npos)
		strcpy(part, name.c_str());
	else
		strcpy(part, name.substr(pos + 1).c_str());
}

// Add part to path name
void FileSpecifier::AddPart(const string &part)
{
	if (name.length() && name[name.length() - 1] == PATH_SEP)
		name += local_path_separators(part.c_str());
	else
		name = name + PATH_SEP + local_path_separators(part.c_str());

	canonicalize_path();
}

// Split path to base and last part
void FileSpecifier::SplitPath(string &base, string &part) const
{
	string::size_type pos = name.rfind(PATH_SEP);
	if (pos == string::npos) {
		base = name;
		part.erase();
	} else if (pos == 0) {
		base = PATH_SEP;
		part = name.substr(1);
	} else {
		base = name.substr(0, pos);
		part = name.substr(pos + 1);
	}
}

// Fill file specifier with base name
void FileSpecifier::ToDirectory(DirectorySpecifier &dir)
{
	string part;
	SplitPath(dir, part);
}

// Set file specifier from directory specifier
void FileSpecifier::FromDirectory(DirectorySpecifier &Dir)
{
	name = Dir.name;
}

// Canonicalize path
void FileSpecifier::canonicalize_path(void)
{
#if !defined(__WIN32__)

	// Replace multiple consecutive '/'s by a single '/'
	while (true) {
		string::size_type pos = name.find("//");
		if (pos == string::npos)
			break;
		name.erase(pos, 1);
	}

#endif

	// Remove trailing '/'
	// ZZZ: only if we're not naming the root directory /
	if (!name.empty() && name[name.size()-1] == PATH_SEP && name.size() != 1)
		name.erase(name.size()-1, 1);
}

// Read directory contents
bool FileSpecifier::ReadDirectory(vector<dir_entry> &vec)
{
	vec.clear();
	
	sys::error_code ec;
	for (fs::directory_iterator it(utf8_to_path(name), ec), end; it != end; it.increment(ec))
	{
		const auto& entry = *it;
		sys::error_code ignored_ec;
		const auto type = entry.status(ignored_ec).type();
		const bool is_dir = type == fs::directory_file;
		
		if (!(is_dir || type == fs::regular_file))
			continue; // skip special or failed-to-stat files
		
		const auto basename = entry.path().filename();
		
		if (!is_dir && basename.native()[0] == '.')
			continue; // skip dot-prefixed regular files
		
		vec.emplace_back(path_to_utf8(basename), is_dir, fs::last_write_time(entry.path(), ignored_ec));
	} 
	
	err = to_posix_code_or_unknown(ec);
	return err == 0;
}

// Copy file contents
bool FileSpecifier::CopyContents(FileSpecifier &source_name)
{
	err = 0;
	OpenedFile src, dst;
	if (source_name.Open(src)) {
		Delete();
		if (Open(dst, true)) {
			const int BUFFER_SIZE = 1024;
			uint8 buffer[BUFFER_SIZE];

			int32 length = 0;
			src.GetLength(length);

			while (length && err == 0) {
				int32 count = length > BUFFER_SIZE ? BUFFER_SIZE : length;
				if (src.Read(count, buffer)) {
					if (!dst.Write(count, buffer))
						err = dst.GetError();
				} else
					err = src.GetError();
				length -= count;
			}
		}
	} else
		err = source_name.GetError();
	if (err)
		Delete();
	return err == 0;
}

// Read ZIP file contents
bool FileSpecifier::ReadZIP(vector<string> &vec)
{
	err = 0;
	vec.clear();
	
#ifdef HAVE_ZZIP
	const auto zip = zzip_dir_open_ext_io(unix_path_separators(name).c_str(), nullptr, nullptr, &utf8_zzip_io());
	if (!zip)
	{
		err = errno;
		return false;
	}
	
	for (ZZIP_DIRENT entry; zzip_dir_read(zip, &entry); )
		vec.emplace_back(entry.d_name);
	
	zzip_dir_close(zip);
	return true;
#else
	err = ENOTSUP;
	return false;
#endif
}

// ZZZ: Filesystem browsing list that lets user actually navigate directories...
class w_directory_browsing_list : public w_list<dir_entry>
{
public:
	w_directory_browsing_list(const FileSpecifier& inStartingDirectory, dialog* inParentDialog)
		: w_list<dir_entry>(entries, 400, 15, 0), parent_dialog(inParentDialog), current_directory(inStartingDirectory), sort_order(sort_by_name)
	{
		refresh_entries();
	}


	w_directory_browsing_list(const FileSpecifier& inStartingDirectory, dialog* inParentDialog, const string& inStartingFile)
	: w_list<dir_entry>(entries, 400, 15, 0), parent_dialog(inParentDialog), current_directory(inStartingDirectory)
	{
		refresh_entries();
		if(entries.size() != 0)
			select_entry(inStartingFile, false);
	}


	void set_directory_changed_callback(action_proc inCallback, void* inArg = NULL)
	{
		directory_changed_proc = inCallback;
		directory_changed_proc_arg = inArg;
	}


	void draw_item(vector<dir_entry>::const_iterator i, SDL_Surface *s, int16 x, int16 y, uint16 width, bool selected) const
	{
		y += font->get_ascent();
		set_drawing_clip_rectangle(0, x, s->h, x + width);

		if(i->is_directory)
		{
			string theName = i->name + "/";
			draw_text(s, theName.c_str (), x, y, selected ? get_theme_color (ITEM_WIDGET, ACTIVE_STATE) : get_theme_color (ITEM_WIDGET, DEFAULT_STATE), font, style, true);
		}
		else
		{
			char date[256];
			tm *time_info = localtime(&i->date);

			if (time_info) 
			{
				strftime(date, 256, "%x %H:%M", time_info);
				int date_width = text_width(date, font, style);
				draw_text(s, date, x + width - date_width, y, selected ? get_theme_color(ITEM_WIDGET, ACTIVE_STATE) : get_theme_color(ITEM_WIDGET, DEFAULT_STATE), font, style);
				set_drawing_clip_rectangle(0, x, s->h, x + width - date_width - 4);
			}
			draw_text(s, FileSpecifier::HideExtension(i->name).c_str (), x, y, selected ? get_theme_color (ITEM_WIDGET, ACTIVE_STATE) : get_theme_color (ITEM_WIDGET, DEFAULT_STATE), font, style, true);
		}

		set_drawing_clip_rectangle(SHRT_MIN, SHRT_MIN, SHRT_MAX, SHRT_MAX);
	}


	bool can_move_up_a_level()
	{
		string base;
		string part;
		current_directory.SplitPath(base, part);
		return (part != string());
	}


	void move_up_a_level()
	{
		string base;
		string part;
		current_directory.SplitPath(base, part);
		if(part != string())
		{
			FileSpecifier parent_directory(base);
			if(parent_directory.Exists())
			{
				current_directory = parent_directory;
				refresh_entries();
				select_entry(part, true);
				announce_directory_changed();
			}
		}
	}


	void item_selected(void)
	{
		current_directory.AddPart(entries[selection].name);

		if(entries[selection].is_directory)
		{
			refresh_entries();
			announce_directory_changed();
		}
		else if (file_selected)
		{
			file_selected(entries[selection].name);
		}
	}

	enum SortOrder {
		sort_by_name,
		sort_by_date,
	};

	void sort_by(SortOrder order)
	{
		sort_order = order;
		refresh_entries();
	}


	const FileSpecifier& get_file() { return current_directory; }
	
	std::function<void(const std::string&)> file_selected;
	
private:
	vector<dir_entry>	entries;
	dialog*			parent_dialog;
	FileSpecifier 		current_directory;
	action_proc		directory_changed_proc;
	void* directory_changed_proc_arg = nullptr;
	SortOrder sort_order = sort_by_name;
	
	struct most_recent
	{
		bool operator()(const dir_entry& a, const dir_entry& b)
		{
			return a.date > b.date;
		}
	};

	void refresh_entries()
	{
		if(current_directory.ReadDirectory(entries))
		{
			if (sort_order == sort_by_name)
			{
				sort(entries.begin(), entries.end());
			}
			else
			{
				sort(entries.begin(), entries.end(), most_recent());
			}
		}
		num_items = entries.size();
		new_items();
	}

	void select_entry(const string& inName, bool inIsDirectory)
	{
		dir_entry theEntryToFind(inName, inIsDirectory);
		vector<dir_entry>::iterator theEntry = find(entries.begin(), entries.end(), theEntryToFind);
		if(theEntry != entries.end())
			set_selection(theEntry - entries.begin());
	}

	void announce_directory_changed()
	{
		if(directory_changed_proc != NULL)
			directory_changed_proc(directory_changed_proc_arg);
	}
};

const char* sort_by_labels[] = {
	"name",
	"date",
	0
};

// common functionality for read and write dialogs
class FileDialog {
public:
	FileDialog() {
	}
	virtual ~FileDialog() = default;

	bool Run() {
		Layout();

		bool result = false;
		if (m_dialog.run() == 0) 
		{
			result = true;
		}

		if (get_game_state() == _game_in_progress) update_game_window();
		return result;
	}

protected:
	void Init(const FileSpecifier& dir, w_directory_browsing_list::SortOrder default_order, std::string filename) {
		m_sort_by_w = new w_select(static_cast<size_t>(default_order), sort_by_labels);
		m_sort_by_w->set_selection_changed_callback(std::bind(&FileDialog::on_change_sort_order, this));
		m_up_button_w = new w_button("UP", std::bind(&FileDialog::on_up, this));
		if (filename.empty()) 
		{
			m_list_w = new w_directory_browsing_list(dir, &m_dialog);
		}
		else
		{
			m_list_w = new w_directory_browsing_list(dir, &m_dialog, filename);
		}
		m_list_w->sort_by(default_order);
		m_list_w->set_directory_changed_callback(std::bind(&FileDialog::on_directory_changed, this));

		dir.GetName(temporary);
		m_directory_name_w = new w_static_text(temporary);
	}

	dialog m_dialog;
	w_select* m_sort_by_w;
	w_button* m_up_button_w;
	w_static_text* m_directory_name_w;
	w_directory_browsing_list* m_list_w;

private:
	virtual void Layout() = 0;


	void on_directory_changed() {
		m_list_w->get_file().GetName(temporary);
		m_directory_name_w->set_text(temporary);

		m_up_button_w->set_enabled(m_list_w->can_move_up_a_level());

		m_dialog.draw();
	}

	void on_change_sort_order() {
		m_list_w->sort_by(static_cast<w_directory_browsing_list::SortOrder>(m_sort_by_w->get_selection()));
	}

	void on_up() {
		m_list_w->move_up_a_level();
	}

};

class ReadFileDialog : public FileDialog
{
public:
	ReadFileDialog(FileSpecifier dir, Typecode type, const char* prompt) : FileDialog(), m_prompt(prompt) {
		w_directory_browsing_list::SortOrder default_order = w_directory_browsing_list::sort_by_name;

		if (!m_prompt) 
		{
			switch(type) 
			{
			case _typecode_savegame:
				m_prompt = "CONTINUE SAVED GAME";
				break;
			case _typecode_film:
				m_prompt = "REPLAY SAVED FILM";
				break;
			default:
				m_prompt = "OPEN FILE";
				break;
			}
		}

		std::string filename;
		switch (type) 
		{
		case _typecode_savegame:
			dir.SetToSavedGamesDir();
			default_order = w_directory_browsing_list::sort_by_date;
			break;
		case _typecode_film:
			dir.SetToRecordingsDir();
			break;
		case _typecode_scenario:
		case _typecode_netscript:
		{
			// Go to most recently-used directory
			DirectorySpecifier theDirectory;
			dir.SplitPath(theDirectory, filename);
			dir.FromDirectory(theDirectory);
			if (!dir.Exists())
				dir.SetToLocalDataDir();
		}
		break;
		default:
			dir.SetToLocalDataDir();
			break;
		}

		Init(dir, default_order, filename);

		m_list_w->file_selected = std::bind(&ReadFileDialog::on_file_selected, this);
	}
	virtual ~ReadFileDialog() = default;
	void Layout() {
		vertical_placer* placer = new vertical_placer;
		placer->dual_add(new w_title(m_prompt), m_dialog);
		placer->add(new w_spacer, true);

#ifndef MAC_APP_STORE
		placer->dual_add(m_directory_name_w, m_dialog);
		
		placer->add(new w_spacer(), true);
#endif

		horizontal_placer* top_row_placer = new horizontal_placer;

		top_row_placer->dual_add(m_sort_by_w->label("Sorted by: "), m_dialog);
		top_row_placer->dual_add(m_sort_by_w, m_dialog);
		top_row_placer->add_flags(placeable::kFill);
		top_row_placer->add(new w_spacer, true);
		top_row_placer->add_flags();
#ifndef MAC_APP_STORE
		top_row_placer->dual_add(m_up_button_w, m_dialog);
#endif
		
		placer->add_flags(placeable::kFill);
		placer->add(top_row_placer, true);
		placer->add_flags();

		placer->dual_add(m_list_w, m_dialog);
		placer->add(new w_spacer, true);

		horizontal_placer* button_placer = new horizontal_placer;
		button_placer->dual_add(new w_button("CANCEL", dialog_cancel, &m_dialog), m_dialog);
		
		placer->add(button_placer, true);
		
		m_dialog.activate_widget(m_list_w);
		m_dialog.set_widget_placer(placer);
	}

	FileSpecifier GetFile() {
		return m_list_w->get_file();
	}
	
private:
	void on_file_selected() {
		m_dialog.quit(0);
	}

	const char* m_prompt;
	std::string m_filename;
};

static std::map<Typecode, const char*> typecode_filters {
    {_typecode_scenario, "sceA"},
    {_typecode_savegame, "sgaA"},
    {_typecode_film, "filA"},
    {_typecode_physics, "phyA"},
    {_typecode_shapes, "shpA"},
    {_typecode_sounds, "sndA"},
    {_typecode_patch, "ShPa"},
    {_typecode_images, "imgA"},
    {_typecode_music, "aif;wav;ogg"},
    {_typecode_movie, "webm"}
};

bool FileSpecifier::ReadDirectoryDialog() //needs native file dialog to work
{
#ifdef HAVE_NFD
	nfdchar_t* outpath;
	auto result = NFD_PickFolder(nullptr, &outpath);

	if (result == NFD_OKAY)
	{
		name = outpath;
		free(outpath);
		return true;
	}
	
#endif
	return false;
}


bool FileSpecifier::ReadDialog(Typecode type, const char *prompt)
{
#ifdef HAVE_NFD
	if (environment_preferences->use_native_file_dialogs)
	{
		// TODO: DRY (this is mostly copied from ReadFileDialog)
		FileSpecifier dir = *this;
		switch (type)
		{
		case _typecode_savegame:
			dir.SetToSavedGamesDir();
			break;
		case _typecode_film:
			dir.SetToRecordingsDir();
			break;
		case _typecode_scenario:
		case _typecode_netscript:
			// I think these should be in ReadFileDialog too, it's just never
			// called on them
		case _typecode_physics:
		case _typecode_shapes:
		case _typecode_sounds:
		case _typecode_images:
		case _typecode_unknown: // used for external resources
		{
			std::string filename;
			DirectorySpecifier theDirectory;
			dir.SplitPath(theDirectory, filename);
			dir.FromDirectory(theDirectory);
			if (!dir.Exists())
			{
				dir.SetToLocalDataDir();
			}
			break;
		}
		default:
			dir.SetToLocalDataDir();
			break;
		}

#if (defined(__APPLE__) && defined(__MACH__))
		// NFD doesn't append a wildcard filter on mac, so if you set ANY
		// filter here, anything without that extension gets grayed out. So, I
		// guess just accept any files
		const char* filters = nullptr;
#else
		auto filters = typecode_filters[type];
#endif

		nfdchar_t* outpath;
		auto result = NFD_OpenDialog(filters, dir.GetPath(), &outpath);
		if (result == NFD_OKAY)
		{
			name = outpath;
			free(outpath);
			return true;
		}
		else
		{
			return false;
		}
	}
	else
	{
#endif
    ReadFileDialog d(*this, type, prompt);
    if (d.Run()) 
    {
        *this = d.GetFile();
        return true;
    } 
    else 
    {
        return false;
    }
#ifdef HAVE_NFD
	}
#endif
}

class w_file_name : public w_text_entry {
public:
	w_file_name(dialog *d, const char *initial_name = NULL) : w_text_entry(31, initial_name), parent(d) {}
	~w_file_name() {}

	void event(SDL_Event & e)
	{
		// Return = close dialog
		if (e.type == SDL_KEYDOWN && e.key.keysym.sym == SDLK_RETURN)
			parent->quit(0);
		w_text_entry::event(e);
	}

private:
	dialog *parent;
};

class WriteFileDialog : public FileDialog
{
public:
	WriteFileDialog(FileSpecifier dir, Typecode type, const char* prompt, const char* default_name) : FileDialog(), m_prompt(prompt), m_default_name(default_name), m_extension(0) {
		if (!m_prompt) 
		{
			switch (type)
			{
			case _typecode_savegame:
				m_prompt = "SAVE GAME";
				break;
			case _typecode_film:
				m_prompt = "SAVE FILM";
				break;
			case _typecode_movie:
				m_prompt = "EXPORT FILM";
				break;
			default:
				m_prompt = "SAVE FILE";
				break;
			}
		}
		
		switch (type) 
		{
		case _typecode_savegame:
			m_extension = ".sgaA";
			break;
		case _typecode_film:
			m_extension = ".filA";
			break;
		default:
			break;
		}

		if (m_extension && boost::algorithm::ends_with(m_default_name, m_extension))
		{
			m_default_name.resize(m_default_name.size() - strlen(m_extension));
		}

		w_directory_browsing_list::SortOrder default_order = w_directory_browsing_list::sort_by_name;
		switch (type) {
		case _typecode_savegame:
		{
			string base;
			string part;
			dir.SplitPath(base, part);
			if (part != string())
			{
				dir = base;
			}
			default_order = w_directory_browsing_list::sort_by_date;
		}
		break;
		case _typecode_film:
		case _typecode_movie:
			dir.SetToRecordingsDir();
			break;
		default:
			dir.SetToLocalDataDir();
			break;
		}

		Init(dir, default_order, m_default_name);

		m_list_w->file_selected = std::bind(&WriteFileDialog::on_file_selected, this, std::placeholders::_1);
	}
	virtual ~WriteFileDialog() = default;
	void Layout() {
		vertical_placer* placer = new vertical_placer;
		placer->dual_add(new w_title(m_prompt), m_dialog);
		placer->add(new w_spacer, true);

#ifndef MAC_APP_STORE
		placer->dual_add(m_directory_name_w, m_dialog);
		
		placer->add(new w_spacer(), true);
#endif

		horizontal_placer* top_row_placer = new horizontal_placer;

		top_row_placer->dual_add(m_sort_by_w->label("Sorted by: "), m_dialog);
		top_row_placer->dual_add(m_sort_by_w, m_dialog);
		top_row_placer->add_flags(placeable::kFill);
		top_row_placer->add(new w_spacer, true);
		top_row_placer->add_flags();
#ifndef MAC_APP_STORE
		top_row_placer->dual_add(m_up_button_w, m_dialog);
#endif
		
		placer->add_flags(placeable::kFill);
		placer->add(top_row_placer, true);
		placer->add_flags();

		placer->dual_add(m_list_w, m_dialog);
		placer->add(new w_spacer, true);

		placer->add_flags(placeable::kFill);
		
		horizontal_placer* file_name_placer = new horizontal_placer;
		m_name_w = new w_file_name(&m_dialog, m_default_name.c_str());
#ifdef MAC_APP_STORE
		file_name_placer->dual_add(m_name_w->label("Name:"), m_dialog);
#else
		file_name_placer->dual_add(m_name_w->label("File Name:"), m_dialog);
#endif
		file_name_placer->add_flags(placeable::kFill);
		file_name_placer->dual_add(m_name_w, m_dialog);

		placer->add_flags(placeable::kFill);
		placer->add(file_name_placer, true);
		placer->add_flags();
		placer->add(new w_spacer, true);

		horizontal_placer* button_placer = new horizontal_placer;
		button_placer->dual_add(new w_button("OK", dialog_ok, &m_dialog), m_dialog);
		button_placer->dual_add(new w_button("CANCEL", dialog_cancel, &m_dialog), m_dialog);
		
		placer->add(button_placer, true);
		
		m_dialog.activate_widget(m_name_w);
		m_dialog.set_widget_placer(placer);
	}

	FileSpecifier GetPath() {
		FileSpecifier dir = m_list_w->get_file();
		std::string base;
		std::string part;
		dir.SplitPath(base, part);

		std::string filename = GetFilename();
		if (part == filename)
		{
			dir = base;
		}

		if (m_extension && !boost::algorithm::ends_with(filename, m_extension))
		{
			filename += m_extension;
		}
		dir.AddPart(filename);
		return dir;
	}

	std::string GetFilename() {
		return m_name_w->get_text();
	}
	
private:
	void on_file_selected(const std::string& filename) {
		m_name_w->set_text(filename.c_str());
		m_dialog.quit(0);
	}

	const char* m_prompt;
	std::string m_default_name;
	const char* m_extension;
	w_file_name* m_name_w;
};

static bool confirm_save_choice(FileSpecifier & file);

bool FileSpecifier::WriteDialog(Typecode type, const char *prompt, const char *default_name)
{
#ifdef HAVE_NFD
	if (environment_preferences->use_native_file_dialogs)
	{
		// TODO: DRY (this is copied from WriteDialog)
		DirectorySpecifier dir = *this;
		switch (type)
		{
		case _typecode_savegame:
		{
			std::string base;
			std::string part;
			dir.SplitPath(base, part);
			if (part != std::string())
			{
				dir = base;
			}
			break;
		}
		case _typecode_film:
		case _typecode_movie:
			dir.SetToRecordingsDir();
			break;
		default:
			dir.SetToLocalDataDir();
			break;
		}
		
		nfdchar_t* outpath;
		auto result = NFD_SaveDialog(typecode_filters[type], dir.GetPath(), &outpath);
		if (result == NFD_OKAY)
		{
			name = outpath;
			free(outpath);
			return true;
		}
		else
		{
			return false;
		}
	}
	else
	{
#endif
again:
	WriteFileDialog d(*this, type, prompt, default_name);
	bool result = false;
	if (d.Run()) 
	{
		if (d.GetFilename().empty())
		{
			play_dialog_sound(DIALOG_ERROR_SOUND);
			goto again;
		}
		
		*this = d.GetPath();
		
		if (!confirm_save_choice(*this))
		{
			goto again;
		}

		result = true;
	}
		
	return result;
#ifdef HAVE_NFD
	}
#endif
}

bool FileSpecifier::WriteDialogAsync(Typecode type, char *prompt, char *default_name)
{
	return FileSpecifier::WriteDialog(type, prompt, default_name);
}

static bool confirm_save_choice(FileSpecifier & file)
{
	// If the file doesn't exist, everything is alright
	if (!file.Exists())
		return true;

	// Construct message
	char name[256];
	file.GetName(name);
	char message[512];
	sprintf(message, "'%s' already exists.", FileSpecifier::HideExtension(std::string(name)).c_str());

	// Create dialog
	dialog d;
	vertical_placer *placer = new vertical_placer;
	placer->dual_add(new w_static_text(message), d);
	placer->dual_add(new w_static_text("Ok to overwrite?"), d);
	placer->add(new w_spacer(), true);

	horizontal_placer *button_placer = new horizontal_placer;
	w_button *default_button = new w_button("YES", dialog_ok, &d);
	button_placer->dual_add(default_button, d);
	button_placer->dual_add(new w_button("NO", dialog_cancel, &d), d);

	placer->add(button_placer, true);

	d.activate_widget(default_button);

	d.set_widget_placer(placer);

	// Run dialog
	return d.run() == 0;
}

ScopedSearchPath::ScopedSearchPath(const DirectorySpecifier& dir) :
	d{dir}
{
	data_search_path.insert(data_search_path.begin(), dir);
}

ScopedSearchPath::~ScopedSearchPath() 
{
	assert(data_search_path.size() && data_search_path.front() == d);
	data_search_path.erase(data_search_path.begin());
}
*/
