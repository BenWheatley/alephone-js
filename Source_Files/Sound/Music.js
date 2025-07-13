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

/*
#include "Decoder.h"
#include "FileHandler.h"
#include "Random.h"
#include "SoundManager.h"
#include "MusicPlayer.h"

class Music
{
public:
	static Music *instance() { 
		static Music *m_instance = nullptr;
		if (!m_instance) 
			m_instance = new Music(); 
		return m_instance; 
	}

	static constexpr int reserved_music_slots = 2;
	enum MusicSlot {
		Intro = 0,
		Level = 1
	};

	bool SetupIntroMusic(FileSpecifier &file) { return music_slots[MusicSlot::Intro].Open(&file); }
	void RestartIntroMusic();

	void Fade(float limitVolume, short duration, bool stopOnNoVolume = true, int index = NONE);
	void Pause(int index = NONE);
	bool Playing(int index = NONE);
	int Load(FileSpecifier& file, bool loop, float volume);
	void Play(int index) { music_slots[index].Play(); }
	void Idle();
	bool IsInit(int index) const { return music_slots.size() > index && music_slots[index].IsInit(); }
	float GetVolume(int index) const { return music_slots[index].GetVolume(); }
	void SetVolume(int index, float volume) { music_slots[index].SetVolume(volume); }
	void StopLevelMusic() { music_slots[MusicSlot::Level].Close(); }
	void StopInGameMusic();
	void ClearLevelMusic();
	void PushBackLevelMusic(const FileSpecifier& file);
	void LevelMusicRandom(bool fRandom) { random_order = fRandom; }
	void SeedLevelMusic();
	void SetClassicLevelMusic(short song_index);
	bool HasClassicLevelMusic() const { return marathon_1_song_index >= 0; }
private:
	class Slot {
	private:
		std::shared_ptr<MusicPlayer> musicPlayer;
		std::shared_ptr<StreamDecoder> decoder;
		FileSpecifier music_file;
		uint64_t music_fade_start = 0;
		uint32 music_fade_duration = 0;
		float music_fade_limit_volume;
		float music_fade_start_volume;
		bool music_fade_stop_no_volume;
		MusicParameters parameters;
	public:
		void Fade(float limitVolume, short duration, bool stopOnNoVolume = true);
		bool Playing() const { return IsInit() && musicPlayer && musicPlayer->IsActive(); }
		bool Open(FileSpecifier* file);
		void Pause();
		void Close();
		bool SetParameters(bool loop, float volume);
		void Play();
		float GetLimitFadeVolume() const { return music_fade_limit_volume; }
		bool IsInit() const { return decoder != nullptr; }
		bool IsFading() const { return music_fade_start; }
		bool StopPlayerAfterFadeOut() const { return music_fade_stop_no_volume; }
		void StopFade() { music_fade_start = 0; }
		void SetVolume(float volume);
		float GetVolume() const { return parameters.volume; }
		std::pair<bool, float> ComputeFadingVolume() const;
	};

	std::vector<Slot> music_slots;

	Music();
	FileSpecifier* GetLevelMusic();
	bool LoadLevelMusic();

	// level music
	short marathon_1_song_index;
	std::vector<FileSpecifier> playlist;
	size_t song_number;
	bool random_order;
	GM_Random randomizer;
};

#include "interface.h"
#include "OpenALManager.h"

Music::Music() :
	marathon_1_song_index(NONE),
	song_number(0),
	random_order(false),
	music_slots(reserved_music_slots)
{
}

bool Music::Slot::Open(FileSpecifier *file)
{
	if (decoder)
	{
		if (file && *file == music_file)
		{
			return true;
		}

		Close();
	}

	if (file)
	{
		decoder = StreamDecoder::Get(*file);
		music_file = *file;
	}
	
	return decoder != nullptr;
}

void Music::RestartIntroMusic()
{
	auto& introSlot = music_slots[MusicSlot::Intro];
	if (introSlot.IsInit() && !introSlot.Playing() && introSlot.SetParameters(true, 1)) introSlot.Play();
}

void Music::Pause(int index)
{
	if (index != NONE) music_slots[index].Pause();
	else
	{
		for (auto& slot : music_slots) {
			slot.Pause();
		}

		music_slots.resize(reserved_music_slots);
	}
}

void Music::Fade(float limitVolume, short duration, bool stopOnNoVolume, int index)
{
	if (index != NONE) music_slots[index].Fade(limitVolume, duration, stopOnNoVolume);
	else
	{
		for (auto& slot : music_slots) {
			slot.Fade(limitVolume, duration, stopOnNoVolume);
		}
	}
}

void Music::Slot::Fade(float limitVolume, short duration, bool stopOnNoVolume)
{
	if (Playing())
	{
		auto currentVolume = musicPlayer->GetParameters().volume;
		if (currentVolume == limitVolume) return;

		music_fade_start_volume = currentVolume;
		music_fade_limit_volume = limitVolume;
		music_fade_start = SoundManager::GetCurrentAudioTick();
		music_fade_duration = duration;
		music_fade_stop_no_volume = stopOnNoVolume;
	}
}

int Music::Load(FileSpecifier& file, bool loop, float volume)
{
	music_slots.resize(music_slots.size() + 1);
	int index = music_slots.size() - 1;
	auto& slot = music_slots[index];
	return slot.Open(&file) && slot.SetParameters(loop, volume) ? index : NONE;
}

bool Music::Playing(int index)
{
	if (index != NONE) return music_slots[index].Playing();
	else 
	{
		for (auto& slot : music_slots) {
			if (slot.Playing()) return true;
		}

		return false;
	}
}

void Music::Idle()
{
	if (!SoundManager::instance()->IsInitialized() || !SoundManager::instance()->IsActive() || OpenALManager::Get()->IsPaused()) return;

	if (get_game_state() == _game_in_progress && !music_slots[MusicSlot::Level].Playing() && LoadLevelMusic()) {
		music_slots[MusicSlot::Level].Play();
	}

	for (int i = 0; i < music_slots.size(); i++) {

		auto& slot = music_slots.at(i);
		if (slot.IsInit() && slot.IsFading()) {
			auto volumeResult = slot.ComputeFadingVolume();
			bool fadeIn = volumeResult.first;
			float vol = fadeIn ? std::min(volumeResult.second, slot.GetLimitFadeVolume()) : std::max(volumeResult.second, slot.GetLimitFadeVolume());
			slot.SetVolume(vol);
			if (vol == slot.GetLimitFadeVolume()) slot.StopFade();
			if (vol <= 0 && slot.StopPlayerAfterFadeOut()) slot.Pause();
		} 
	}
}

std::pair<bool, float> Music::Slot::ComputeFadingVolume() const
{
	bool fadeIn = music_fade_limit_volume > music_fade_start_volume;
	auto elapsed = SoundManager::GetCurrentAudioTick() - music_fade_start;
	float volume = ((float)elapsed / music_fade_duration) * (fadeIn ? music_fade_limit_volume : 1 - music_fade_limit_volume);
	volume = fadeIn ? volume + music_fade_start_volume : music_fade_start_volume - volume;
	return { fadeIn, volume };
}

void Music::Slot::SetVolume(float volume)
{
	SetParameters(parameters.loop, volume);
}

void Music::Slot::Pause()
{
	if (Playing()) musicPlayer->AskStop();
	StopFade();
}

void Music::Slot::Close()
{
	Pause();
	musicPlayer.reset();
	decoder.reset();
}

bool Music::Slot::SetParameters(bool loop, float volume)
{
	parameters.loop = loop;
	parameters.volume = std::max(std::min(volume, 1.f), 0.f);
	if (musicPlayer) musicPlayer->UpdateParameters(parameters);
	return true;
}

void Music::Slot::Play()
{
	if (!OpenALManager::Get() || Playing()) return;
	musicPlayer = OpenALManager::Get()->PlayMusic(decoder, parameters);
}

bool Music::LoadLevelMusic()
{
	FileSpecifier* level_song_file = GetLevelMusic();
	auto& slot = music_slots[MusicSlot::Level];
	return slot.Open(level_song_file) && slot.SetParameters(playlist.size() == 1, 1);
}

void Music::SeedLevelMusic()
{
	song_number = 0;
	randomizer.z ^= SoundManager::GetCurrentAudioTick();
	randomizer.SetTable();
}

void Music::SetClassicLevelMusic(short song_index)
{
	if (playlist.size())
	{
		return;
	}
	
    if (song_index < 0)
        return;
    
    FileSpecifier file;
    sprintf(temporary, "Music/%02d.ogg", song_index);
    file.SetNameWithPath(temporary);
    if (!file.Exists())
    {
        sprintf(temporary, "Music/%02d.mp3", song_index);
        file.SetNameWithPath(temporary);
    }
    if (!file.Exists())
        return;
    
    PushBackLevelMusic(file);
    marathon_1_song_index = song_index;
}

void Music::ClearLevelMusic()
{
	playlist.clear(); 
	marathon_1_song_index = NONE; 
	music_slots[MusicSlot::Level].SetParameters(true, 1);
}

void Music::StopInGameMusic()
{
	for (int i = MusicSlot::Level; i < music_slots.size(); i++)
	{
		music_slots[i].Close();
	}
}

void Music::PushBackLevelMusic(const FileSpecifier& file)
{
	playlist.push_back(file);

	if (playlist.size() > 1)
	{
		music_slots[MusicSlot::Level].SetParameters(false, 1);
	}
}

FileSpecifier* Music::GetLevelMusic()
{
	// No songs to play
	if (playlist.empty()) return 0;

	size_t NumSongs = playlist.size();
	if (NumSongs == 1) return &playlist[0];

	if (random_order)
		song_number = randomizer.KISS() % NumSongs;

	// Get the song number to within range if playing sequentially;
	// if the song number gets too big, then it's reset back to the first one
	if (song_number >= NumSongs) song_number = 0;

	return &playlist[song_number++];
}
*/
