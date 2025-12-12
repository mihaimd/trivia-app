import { Injectable } from '@angular/core';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private sounds: Record<string, HTMLAudioElement> = {};

  constructor(private dataService: DataService) {
    // Preload sounds
    this.sounds['timer'] = new Audio('assets/sounds/timer1.mp3');
    this.sounds['correct'] = new Audio('assets/sounds/correct.mp3');
    this.sounds['wrong'] = new Audio('assets/sounds/wrong.mp3');
  }
  play(soundName: string) {
    console.warn(`play sound: ${soundName}`);
    if (this.isSoundEnabled()) {
      const audio = this.sounds[soundName];
      if (audio) {
        if (!audio.paused) {
          audio.pause(); // pause any ongoing audio before playing
          audio.currentTime = 0;
        }
        audio.play().catch(() => {
          console.warn(`Unable to play sound: ${soundName}`);
        });
      }
    }
  }
  stop(soundName: string) {
    const audio = this.sounds[soundName];
    if (audio) {
      audio.pause();
      audio.currentTime = 0; // Reset the audio to the start
    }
  }
  isSoundEnabled(): boolean {
    return this.dataService.getAppSettings().sound;
  }
}
