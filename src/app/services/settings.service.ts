import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private currentFontSize: 'small' | 'normal' | 'large' = 'normal';
  constructor() { }

  async loadSettings() {
    const saved = await Preferences.get({ key: 'fontSize' });
    if (saved.value) this.setFontSize(saved.value as any);
  }

  async setFontSize(size: 'small' | 'normal' | 'large') {
    this.currentFontSize = size;
    document.documentElement.style.setProperty(
      '--app-font-size',
      `var(--font-size-${size})`
    );
    await Preferences.set({ key: 'fontSize', value: size });
  }

  getFontSize() {
    return this.currentFontSize;
  }
}
