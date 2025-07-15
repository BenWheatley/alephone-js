// Complete replacement for all XML parsing in Aleph One JS

import * as Logging from '../Misc/Logging.js';
import { parse_mml_stringset } from '../RenderOther/TextStrings.js';

// return value is "has parse_error"
export async function ParseMMLFromFile(url, load_menu_mml_only) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            Logging.logNote(`${response.status} error for MML file at ${url}, this is probably fine as not all search directories exist in all scenario packs`);
            return true;
        }
        const xmlText = await response.text();
        const fileroot = load_xml_from_string(xmlText);
        _ParseAllMML(fileroot, load_menu_mml_only);
    } catch (ex) {
        Logging.logError(`${ex} error for MML file at ${url}`);
        return true;
    }
    return false;
}

function _ParseAllMML(fileroot, load_menu_mml_only) {
    const marathonNodes = fileroot.querySelectorAll("marathon");
    for (const root of marathonNodes) {
        for (const child of root.querySelectorAll("stringset")) parse_mml_stringset(child);
        /* TODO: implement these as I get around to them
        for (const child of root.children_named("interface")) parse_mml_interface(child);
        for (const child of root.children_named("player_name")) parse_mml_player_name(child);
        for (const child of root.children_named("scenario")) parse_mml_scenario(child);
        for (const child of root.children_named("logging")) parse_mml_logging(child);
        for (const child of root.children_named("sounds")) parse_mml_sounds(child);
        for (const child of root.children_named("faders")) parse_mml_faders(child);
        for (const child of root.children_named("player")) parse_mml_player(child);
        if (load_menu_mml_only) continue;

        for (const child of root.children_named("motion_sensor")) parse_mml_motion_sensor(child);
        for (const child of root.children_named("overhead_map")) parse_mml_overhead_map(child);
        for (const child of root.children_named("infravision")) parse_mml_infravision(child);
        for (const child of root.children_named("animated_textures")) parse_mml_animated_textures(child);
        for (const child of root.children_named("control_panels")) parse_mml_control_panels(child);
        for (const child of root.children_named("platforms")) parse_mml_platforms(child);
        for (const child of root.children_named("liquids")) parse_mml_liquids(child);
        for (const child of root.children_named("view")) parse_mml_view(child);
        for (const child of root.children_named("weapons")) parse_mml_weapons(child);
        for (const child of root.children_named("items")) parse_mml_items(child);
        for (const child of root.children_named("damage_kicks")) parse_mml_damage_kicks(child);
        for (const child of root.children_named("monsters")) parse_mml_monsters(child);
        for (const child of root.children_named("scenery")) parse_mml_scenery(child);
        for (const child of root.children_named("landscapes")) parse_mml_landscapes(child);
        for (const child of root.children_named("texture_loading")) parse_mml_texture_loading(child);
        for (const child of root.children_named("opengl")) parse_mml_opengl(child);
        for (const child of root.children_named("software")) parse_mml_software(child);
        for (const child of root.children_named("dynamic_limits")) parse_mml_dynamic_limits(child);
        for (const child of root.children_named("console")) parse_mml_console(child);
        for (const child of root.children_named("default_levels")) parse_mml_default_levels(child);
        */
    }
}

function load_xml_from_string(xmlText) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xmlText, "application/xml");
	const parserError = doc.querySelector("parsererror");
	if (parserError) throw new Error(parserError.textContent);
	return doc;
}