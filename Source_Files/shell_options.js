import * as alephversion from './Misc/alephversion.js';

export let shell_options = {
	nosound: false,
	skip_intro: false,
	editor: false,
	scenario_name: 'Marathon 2'
};

export function parse() {
	const params = new URLSearchParams(window.location.search);

	for (const [key, value] of params.entries()) {
		switch (key) {
			case 'h':
			case 'help':
				show_options_help();
				break;

			case 'v':
			case 'version':
				alert(`Version: ${alephversion.A1JS_VERSION_STRING}`);
				break;

			case 's':
			case 'nosound':
				shell_options.nosound = true;
				break;

			case 'Q':
			case 'skip-intro':
				shell_options.skip_intro = true;
				break;

			case 'e':
			case 'editor':
				shell_options.editor = true;
				break;
				
			case 'scenario_name':
				shell_options.scenario_name = value;
				break;

			default:
				// Unknown param — ignore silently
				break;
		}
	}
}

function show_options_help() {
	const helpText = `
Usage: index.html?[options-separated-by-&]

Options:
  h or help\t\t\tDisplay this help message
  v or version\t\t\tDisplay the game version
  s or nosound\t\tDo not access the sound card
  Q or skip-intro\t\tSkip intro screens
  e or editor\t\t\tUse editor prefs; jump directly to map
  
  scenario_name={put name here without braces}\t\tLoad a named scenario pack in the ALEPHONE_DEFAULT_DATA folder
`;

	alert(helpText);
}
