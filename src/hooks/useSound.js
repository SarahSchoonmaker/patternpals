// src/hooks/useSound.js
import { Audio } from "expo-av";

let bgMusic = null;
let isMusicEnabled = true;

export async function initAudio() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true, // play even on silent
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    console.log("Audio mode set");
  } catch (e) {
    console.log("Audio init error:", e.message);
  }
}

export async function startMusic() {
  try {
    if (!isMusicEnabled) {
      console.log("Music disabled");
      return;
    }
    if (bgMusic) {
      console.log("Resuming existing music");
      const status = await bgMusic.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await bgMusic.playAsync();
      }
      return;
    }
    console.log("Creating new sound...");
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/sounds/background.mp3"),
      {
        isLooping: true,
        volume: 1.0,
        shouldPlay: true,
      },
    );
    bgMusic = sound;
    console.log("Music playing!");
  } catch (e) {
    console.log("Music start error:", e.message);
  }
}

export async function stopMusic() {
  try {
    if (bgMusic) {
      await bgMusic.pauseAsync();
      console.log("Music paused");
    }
  } catch (e) {
    console.log("Music stop error:", e.message);
  }
}

export async function toggleMusic() {
  isMusicEnabled = !isMusicEnabled;
  if (isMusicEnabled) {
    await startMusic();
  } else {
    await stopMusic();
  }
  return isMusicEnabled;
}

export function getMusicEnabled() {
  return isMusicEnabled;
}
