// Complete replacement for font handling; we don't need to render to a GL texture, we have *the web*

export function initialize_fonts() {
	// would do e.g. the following if I need to render the fonts *within* canvas; as is, I expect to do anything that has text as an HTML div tag:
	// const font = new FontFace('Courier Prime', 'url(./data/CourierPrime.ttf)');
	
	// I am only keeping this method at all because of the possibility I change my mind
	
	// Notes: ProFontAO.ttf replaces Monaco
}
