import * as shell from '../shell.js';

// DOM Event Bindings

window.addEventListener("keydown", (event) => {
	if (event.repeat) {
		return;
	}
	shell.push_event(event);
});

window.addEventListener("keyup", (event) => {
	shell.push_event(event);
});

// Enumeration of key codes

/* Surprises:
	"IntlBackslash", "Quote", "IntlRo",
	"Fn" (missing in SDL, but no events fired in JS anyway?),
	"F17" etc (I don't have a big enough keyboard)
	`SCANCODE_NUMLOCKCLEAR = "NumLock";` -> varies by platform in SDL, NumLock on Mac, clear on Win?
	`SCANCODE_VOLUMEUP = "VolumeUp";` varies by browser and version! "AudioVolumeUp" on Chrome, ditto for VolumeDown, VolumeMute
	`SCANCODE_APPLICATION = "ContextMenu";` -> unsure if correct
	`SCANCODE_APOSTROPHE = "Quote";` -> unsure if correct
*/

export const SCANCODE_UNKNOWN = 0; // Number, not string

export const SCANCODE_A = "KeyA";
export const SCANCODE_B = "KeyB";
export const SCANCODE_C = "KeyC";
export const SCANCODE_D = "KeyD";
export const SCANCODE_E = "KeyE";
export const SCANCODE_F = "KeyF";
export const SCANCODE_G = "KeyG";
export const SCANCODE_H = "KeyH";
export const SCANCODE_I = "KeyI";
export const SCANCODE_J = "KeyJ";
export const SCANCODE_K = "KeyK";
export const SCANCODE_L = "KeyL";
export const SCANCODE_M = "KeyM";
export const SCANCODE_N = "KeyN";
export const SCANCODE_O = "KeyO";
export const SCANCODE_P = "KeyP";
export const SCANCODE_Q = "KeyQ";
export const SCANCODE_R = "KeyR";
export const SCANCODE_S = "KeyS";
export const SCANCODE_T = "KeyT";
export const SCANCODE_U = "KeyU";
export const SCANCODE_V = "KeyV";
export const SCANCODE_W = "KeyW";
export const SCANCODE_X = "KeyX";
export const SCANCODE_Y = "KeyY";
export const SCANCODE_Z = "KeyZ";

export const SCANCODE_1 = "Digit1";
export const SCANCODE_2 = "Digit2";
export const SCANCODE_3 = "Digit3";
export const SCANCODE_4 = "Digit4";
export const SCANCODE_5 = "Digit5";
export const SCANCODE_6 = "Digit6";
export const SCANCODE_7 = "Digit7";
export const SCANCODE_8 = "Digit8";
export const SCANCODE_9 = "Digit9";
export const SCANCODE_0 = "Digit0";

export const SCANCODE_RETURN = "Enter";
export const SCANCODE_ESCAPE = "Escape";
export const SCANCODE_BACKSPACE = "Backspace";
export const SCANCODE_TAB = "Tab";
export const SCANCODE_SPACE = "Space";

export const SCANCODE_MINUS = "Minus";
export const SCANCODE_EQUALS = "Equal";
export const SCANCODE_LEFTBRACKET = "BracketLeft";
export const SCANCODE_RIGHTBRACKET = "BracketRight";
export const SCANCODE_BACKSLASH = "Backslash";

export const SCANCODE_SEMICOLON = "Semicolon";
export const SCANCODE_APOSTROPHE = "Quote";
export const SCANCODE_GRAVE = "Backquote";
export const SCANCODE_COMMA = "Comma";
export const SCANCODE_PERIOD = "Period";
export const SCANCODE_SLASH = "Slash";

export const SCANCODE_CAPSLOCK = "CapsLock";

export const SCANCODE_F1 = "F1";
export const SCANCODE_F2 = "F2";
export const SCANCODE_F3 = "F3";
export const SCANCODE_F4 = "F4";
export const SCANCODE_F5 = "F5";
export const SCANCODE_F6 = "F6";
export const SCANCODE_F7 = "F7";
export const SCANCODE_F8 = "F8";
export const SCANCODE_F9 = "F9";
export const SCANCODE_F10 = "F10";
export const SCANCODE_F11 = "F11";
export const SCANCODE_F12 = "F12";

export const SCANCODE_HOME = "Home";
export const SCANCODE_PAGEUP = "PageUp";
export const SCANCODE_DELETE = "Delete";
export const SCANCODE_END = "End";
export const SCANCODE_PAGEDOWN = "PageDown";
export const SCANCODE_RIGHT = "ArrowRight";
export const SCANCODE_LEFT = "ArrowLeft";
export const SCANCODE_DOWN = "ArrowDown";
export const SCANCODE_UP = "ArrowUp";

export const SCANCODE_NUMLOCKCLEAR = "NumLock";
export const SCANCODE_KP_DIVIDE = "NumpadDivide";
export const SCANCODE_KP_MULTIPLY = "NumpadMultiply";
export const SCANCODE_KP_MINUS = "NumpadSubtract";
export const SCANCODE_KP_PLUS = "NumpadAdd";
export const SCANCODE_KP_ENTER = "NumpadEnter";
export const SCANCODE_KP_1 = "Numpad1";
export const SCANCODE_KP_2 = "Numpad2";
export const SCANCODE_KP_3 = "Numpad3";
export const SCANCODE_KP_4 = "Numpad4";
export const SCANCODE_KP_5 = "Numpad5";
export const SCANCODE_KP_6 = "Numpad6";
export const SCANCODE_KP_7 = "Numpad7";
export const SCANCODE_KP_8 = "Numpad8";
export const SCANCODE_KP_9 = "Numpad9";
export const SCANCODE_KP_0 = "Numpad0";
export const SCANCODE_KP_PERIOD = "NumpadDecimal";

export const SCANCODE_NONUSBACKSLASH = "IntlBackslash";
export const SCANCODE_APPLICATION = "ContextMenu";
export const SCANCODE_POWER = "Power"; // Chrome only, missing on Firefox
export const SCANCODE_KP_EQUALS = "NumpadEqual";
export const SCANCODE_F13 = "F13";
export const SCANCODE_F14 = "F14";
export const SCANCODE_F15 = "F15";
export const SCANCODE_F16 = "F16";
export const SCANCODE_F17 = "F17";
export const SCANCODE_F18 = "F18";
export const SCANCODE_F19 = "F19";
export const SCANCODE_F20 = "F20";
export const SCANCODE_F21 = "F21";
export const SCANCODE_F22 = "F22";
export const SCANCODE_F23 = "F23";
export const SCANCODE_F24 = "F24";

export const SCANCODE_HELP = "Help"; // On Firefox, might be Insert on Chrome

export const SCANCODE_VOLUMEUP = "VolumeUp"; // Firefox
export const SCANCODE_VOLUMEDOWN = "VolumeDown"; // 
export const SCANCODE_KP_COMMA = "NumpadComma";

export const SCANCODE_INTERNATIONAL3 = "IntlYen";
export const SCANCODE_LANG1 = "Lang1";
export const SCANCODE_LANG2 = "Lang2";

export const SCANCODE_LCTRL = "ControlLeft";
export const SCANCODE_LSHIFT = "ShiftLeft";
export const SCANCODE_LALT = "AltLeft";
export const SCANCODE_LGUI = "MetaLeft";
export const SCANCODE_RCTRL = "ControlRight";
export const SCANCODE_RSHIFT = "ShiftRight";
export const SCANCODE_RALT = "AltRight";
export const SCANCODE_RGUI = "MetaRight";
