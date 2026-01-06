import { Component, OnInit, inject, effect, Input } from '@angular/core';
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
  @Input() barClass: string = 'gradient';
  @Input() barText: string = 'Health';
  @Input() barWidth: string = '280px';
  @Input() barJustify: string = 'center';
  public dataService: DataService = inject(DataService);
  public lifeProgressValue: number = 0;
  public isShaking: boolean = false;
  private prevHp = this.dataService.currentLifeProgress();   // initialized ONCE

  constructor() {
    effect((): void => {
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
    return `calc(100% - ${this.dataService.currentLifeProgress()}%)`;
  }

  get lifeProgressPercentage() {
    return this.barText + ' ' + Math.ceil((this.dataService.currentLifeProgress() * 100) / 100) + '%';
  }

  get powerProgress() {
    return `${this.dataService.currentPowerProgress()}`;
  }

  get powerProgressWidth() {
    return `calc(100% - ${this.dataService.currentPowerProgress()}%)`;
  }

  get powerProgressPercentage() {
    return `${this.barText} ${this.dataService.currentPowerProgress()}%`;
  }

}
