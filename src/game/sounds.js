/**
 * Sound Manager for Desbrava RPG
 * Using royalty-free assets from Pixabay/OpenGameArt
 */

const SOUND_URLS = {
  click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  attack: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
  damage: "https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3",
  victory: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
  defeat: "https://assets.mixkit.co/active_storage/sfx/1001/1001-preview.mp3",
  levelUp: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  faith: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"
};

class SoundManager {
  constructor() {
    this.sounds = {};
    if (typeof window !== "undefined") {
      Object.entries(SOUND_URLS).forEach(([key, url]) => {
        this.sounds[key] = new Audio(url);
        this.sounds[key].volume = 0.4;
      });
    }
  }

  play(key) {
    if (this.sounds[key]) {
      this.sounds[key].currentTime = 0;
      this.sounds[key].play().catch(e => console.log("Autoplay blocked or audio error:", e));
    }
  }
}

export const sounds = new SoundManager();
