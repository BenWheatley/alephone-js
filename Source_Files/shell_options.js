/*
struct ShellOptions {
	std::unordered_map<int, bool> parse(int argc, char** argv, bool ignore_unknown_args = false);

	bool nosound;
	bool debug;

	bool skip_intro;
	bool editor;

	std::vector<std::string> files;

	std::string output;
};

#include "FileHandler.h"
#include "Logging.h"
#include "csstrings.h"
*/
export let shell_options;
/*
struct ShellOptionsOption {
	bool match(const std::string& s) {
		if (s[0] == '-') {
			if (s[1] == '-') {
				return long_name == s.substr(2);
			} else if (short_name.size()) {
				return short_name == s.substr(1);
			}
		}

		return false;
	}
	
	std::string short_name;
	std::string long_name;
	std::string help;
};

static int help_tab_stop = 33;

static std::string spaces(int num_spaces)
{
	std::string s;
	for (auto i = 0; i < num_spaces; ++i) {
		s += " ";
	}
	return s;
}

static std::ostream& operator<<(std::ostream& s, const ShellOptionsOption& o) {
	if (o.help.size())
	{
		auto num_spaces = help_tab_stop - 12 - o.long_name.size();
		
		s << "\t[";
		if (o.short_name.size())
		{
			num_spaces -= 4;
			num_spaces -= o.short_name.size();
			s << "-" << o.short_name << " | ";
		}
		
		s << "--" << o.long_name << "]" << spaces(num_spaces) << o.help << "\n";
	}

	return s;
}

struct ShellOptionsCommand : public ShellOptionsOption {
	std::function<void()> command;
};

struct ShellOptionsFlag : public ShellOptionsOption {
	bool& flag;
};

struct ShellOptionsString : public ShellOptionsOption {
	std::string& string;
};

static std::string ignore;

static const std::vector<ShellOptionsCommand> shell_options_commands {
	{"h", "help", "Display this help message", print_usage},
	{"v", "version", "Display the game version", print_version}
};

static const std::vector<ShellOptionsFlag> shell_options_flags {
	{"d", "debug", "Allow saving of core files", shell_options.debug},
	{"s", "nosound", "Do not access the sound card", shell_options.nosound},
	{"Q", "skip-intro", "Skip intro screens", shell_options.skip_intro},
	{"e", "editor", "Use editor prefs; jump directly to map", shell_options.editor},
};

static const std::vector<ShellOptionsString> shell_options_strings {
	{"o", "output", "With -e, output to [file] and exit on quit", shell_options.output},
	{"NSDocumentRevisionsDebugMode", "", "", ignore} // annoying Xcode argument
};

std::unordered_map<int, bool> ShellOptions::parse(int argc, char** argv, bool ignore_unknown_args)
{
    std::vector<std::string> args;
    while (argc > 0)
    {
        if (strncmp(*argv, "-C", 2) == 0)
        {
            args.push_back(*argv + 2);
        }
        else
        {
            args.push_back(*argv);
        }

        --argc;
        ++argv;
    }

	std::unordered_map<int, bool> results;

    for (int i = 0; i < args.size(); i++)
    {
		const auto& arg = args[i];
		bool found = false;

		for (auto command : shell_options_commands)
		{
			if (command.match(arg))
			{
				command.command();
				exit(0);
			}
		}

		for (auto flag : shell_options_flags)
		{
			if (flag.match(arg))
			{
				found = true;
				flag.flag = true;
				break;
			}
		}

		for (auto option : shell_options_strings)
		{
			if (option.match(arg))
			{
				if (i < args.size() - 1 && args[i + 1][0] != '-')
				{
					found = true;
					results.insert({ i++ + 1, true });
                    option.string = args[i];
                }
                else
                {
					logFatal("%s requires an additional argument", arg.c_str());
                    printf("%s requires an additional argument\n", arg.c_str());
                    print_usage();
                    exit(1);
                }
			}
		}

		if (!found)
		{
			if (arg[0] != '-')
			{
				FileSpecifier f(arg);
				if (f.Exists())
				{
					if (!f.IsDir()) {
						shell_options.files.push_back(arg);
					}

					found = true;
				}
			}

			if (!found && !ignore_unknown_args)
			{
				logFatal("Unrecognized argument '%s'.", arg.c_str());
				printf("Unrecognized argument '%s'.\n", arg.c_str());
				print_usage();
				exit(1);
			}
		}

		results.insert({ i + 1, found });
	}

	return results;
}

void print_version()
{
	char app_name_version[256];
	expand_app_variables(app_name_version, "Aleph One $appLongVersion$");
	std::cout << app_name_version << std::endl;
}

void print_usage()
{
	std::ostringstream oss;

	oss << "\nUsage: " << " [options] [directory] [file]\n";

	for (auto command : shell_options_commands)
	{
		oss << command;
	}

	for (auto flag : shell_options_flags)
	{
		oss << flag;
	}

	for (auto option : shell_options_strings)
	{
		oss << option;
	}

	oss << "\tdirectory" << spaces(help_tab_stop - strlen("directory") - 8)
		<< "Directory containing scenario data files\n"
		
		<< "\tfile" << spaces(help_tab_stop - strlen("file") - 8)
		<< "Saved game to load or film to play\n"
		<< "\n"
		<< "You can also use the ALEPHONE_DATA environment variable to specify\n"
		<< "the data directory.\n";

	std::cout << oss.str();
}
*/
