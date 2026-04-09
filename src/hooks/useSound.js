// src/hooks/useSound.js
import { useEffect, useRef } from "react";
import { Audio } from "expo-av";

// Global sound instance so music persists across screens
let bgMusic = null;
let isMusicEnabled = true;

export async function initAudio() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false, // respects silent switch
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (e) {
    console.log("Audio init error:", e);
  }
}

export async function startMusic() {
  try {
    if (!isMusicEnabled) return;
    if (bgMusic) {
      await bgMusic.playAsync();
      return;
    }
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/sounds/background.mp3"),
      {
        isLooping: true,
        volume: 0.4,
        shouldPlay: true,
      },
    );
    bgMusic = sound;
  } catch (e) {
    console.log("Music start error:", e);
  }
}

export async function stopMusic() {
  try {
    if (bgMusic) {
      await bgMusic.pauseAsync();
    }
  } catch (e) {
    console.log("Music stop error:", e);
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

// Sound effects
export async function playSound(type) {
  // We'll use simple Haptics for now since sound effects
  // require additional audio files
  // You can add sound effect files later
}
