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

	Handles both intro and level music
*/

import * as cseries from '../CSeries/cseries.js';
import { audioContext } from './SoundManager.js';

export class Music {
	static #_instance = null;
	
	static reserved_music_slots = 2;
	
	static MusicSlot = {
		Intro: 0,
		Level: 1
	};
	
	static instance() {
		if (!Music.#_instance) {
			Music.#_instance = new Music();
		}
		return Music.#_instance;
	}
	
	constructor() {
		this.music_slots = new Array(Music.reserved_music_slots).fill(null).map(() => new Slot());
		this.playlist = [];
		this.song_number = 0;
		this.random_order = false;
		this.marathon_1_song_index = cseries.NONE;
		
		this.masterGain = audioContext.createGain();
		this.masterGain.gain.value = 1;
		this.masterGain.connect(audioContext.destination);
	}
	
	// --- Setup / playback ---
	SetupIntroMusic(url) {
		const introSlot = this.music_slots[Music.MusicSlot.Intro];
		
		fetch(url)
			.then(response => {
				if (!response.ok) throw new Error(`Failed to load audio: ${response.statusText}`);
				return response.arrayBuffer();
			})
			.then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
			.then(audioBuffer => {
				introSlot.setAudioBuffer(audioBuffer);
			})
			.catch(err => {
				console.error("SetupIntroMusic failed:", err);
			});
		// Return immediately regardless of load outcome
	}
	
	RestartIntroMusic() {
		const introSlot = this.music_slots[Music.MusicSlot.Intro];
		
		const waitUntilReady = () => {
			if (introSlot.isInit()) {
				if (!introSlot.playing() && introSlot.setParameters(true, 1)) {
					introSlot.play();
				}
			} else {
				requestAnimationFrame(waitUntilReady); // Try again next frame
			}
		};
		
		waitUntilReady();
	}
	
	Load(file, loop, volume) {
		const slot = new Slot();
		slot.setRouting(this.masterGain);
		return slot.load(fileUrl, loop, volume).then(() => {
			this.music_slots.push(slot);
			return this.music_slots.length - 1;
		});
	}
	
	Play(index) {
		if (this.music_slots[index]) this.music_slots[index].play();
	}
	
	// --- State queries ---
	Playing(index = cseries.NONE) {
		// Stub
		return false;
	}
	
	IsInit(index) {
		// Stub
		return false;
	}
	
	GetVolume(index) {
		return this.music_slots[index]?.getVolume() ?? 0;
	}
	
	// --- Control ---
	SetVolume(index, volume) {
		this.music_slots[index]?.setVolume(volume);
	}
	
	Pause(index = cseries.NONE) {
		if (index == cseries.NONE) this.music_slots.forEach(slot => slot.pause());
		else this.music_slots[index]?.pause();
	}
	
	Fade(limitVolume, duration /*seconds*/, stopOnNoVolume = true, index = cseries.NONE) {
		const fadeFn = slot => slot?.fade(limitVolume, duration, stopOnNoVolume);
		if (index === -1) this.music_slots.forEach(fadeFn);
		else fadeFn(this.music_slots[index]);
	}
	
	Idle() {
		// Stub
	}
	
	StopInGameMusic() {
		// Stub
	}
	
	StopLevelMusic() {
		// Stub
	}
	
	// --- Playlist logic ---
	ClearLevelMusic() {
		// Stub
	}
	
	PushBackLevelMusic(file) {
		// Stub
	}
	
	SeedLevelMusic() {
		// Stub
	}
	
	SetClassicLevelMusic(song_index) {
		// Stub
	}
	
	HasClassicLevelMusic() {
		// Stub
		return this.marathon_1_song_index >= 0;
	}
	
	// --- Config ---
	LevelMusicRandom(fRandom) {
		this.random_order = fRandom;
	}
}

class Slot {
	constructor() {
		this.audioBuffer = null;
		this.source = null;
		this.gainNode = audioContext.createGain();
		this.gainNode.gain.value = 1;
		this.loop = false;
		this.volume = 1;
		this.connected = false;
		this._isPlaying = false;
	}
	
	setAudioBuffer(buffer) {
		this.audioBuffer = buffer;
		this._isPlaying = false;
	}
	
	isInit() {
		return !!this.audioBuffer;
	}
	
	setRouting(parentGain) {
		if (!this.connected) {
			this.gainNode.connect(parentGain);
			this.connected = true;
		}
	}
	
	async load(url, loop = false, volume = 1.0) {
		this.loop = loop;
		this.volume = volume;
		const response = await fetch(url);
		const arrayBuffer = await response.arrayBuffer();
		this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	}
	
	play() {
		if (!this.audioBuffer || this._isPlaying) return;
		
		this.source = audioContext.createBufferSource();
		this.gainNode.gain.value = this.volume;
		
		this.source.buffer = this.audioBuffer;
		this.source.loop = this.loop;
		
		this.source.connect(this.gainNode).connect(audioContext.destination);
		this.source.start();
		
		this._isPlaying = true;
		
		this.source.onended = () => {
			this._isPlaying = false;
		};
	}
	
	playing() {
		return this._isPlaying;
	}
	
	pause() {
		this.stopSource();
	}
	
	stopSource() {
		if (this.source) {
			this.source.stop();
			this.source.disconnect();
			this.source = null;
		}
	}
	
	setParameters(loop, volume) {
		this.loop = loop;
		this.volume = Math.max(0, Math.min(1, volume));
		return true; // TODO: consider refactor as it's always true
	}
	
	fade(targetVolume, duration, stopWhenZero = true) {
		const now = audioContext.currentTime;
		const current = this.gainNode.gain.value;
		this.gainNode.gain.cancelScheduledValues(now);
		this.gainNode.gain.setValueAtTime(current, now);
		this.gainNode.gain.linearRampToValueAtTime(targetVolume, now + duration);
		if (stopWhenZero && targetVolume === 0) {
			setTimeout(() => this.pause(), duration * 1000.0 /* expects ms */);
		}
	}
	
	getVolume() {
		return this.gainNode.gain.value;
	}
	
	setVolume(volume) {
		this.volume = volume;
		this.gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
	}
}
