import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ProgressBarComponent implements OnInit {
  public dataService: DataService = inject(DataService);
  public lifeProgressValue: number = 0;
  public isShaking: boolean = false;
  private prevHp = this.dataService.currentLifeProgress();   // initialized ONCE

  constructor() {
    effect((): void => {
      this.dataService.currentLifeProgress();
      if (this.prevHp > this.dataService.currentLifeProgress()) {
        this.isShaking = true;
        setTimeout(() => {
          this.isShaking = false;
        }, 300);
      }
    });
  }

  ngOnInit() { }

  get lifeProgress() {
    return `calc(98% - ${this.dataService.currentLifeProgress()}%)`;
  }

  get lifeProgressPercentage() {
    return 'Life ' + Math.ceil((this.dataService.currentLifeProgress() * 100) / 100) + '%';
  }

}
