import { Component, OnInit, inject, effect, Input, Signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';

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
  private authService: AuthService = inject(AuthService);
  public dataService: DataService = inject(DataService);
  public lifeProgressValue: number = 0;
  public isShaking: boolean = false;
  private prevHp = this.dataService.currentLifeProgress();   // initialized ONCE
  public hours: Signal<number> = computed(() => Math.floor(this.dataService.time() / 3600));
  public minutes: Signal<number> = computed(() => Math.floor((this.dataService.time() % 3600) / 60));
  public seconds: Signal<number> = computed(() => this.dataService.time() % 60);
  private counterRunning: boolean = false;

  constructor() {
    effect((): void => {
      console.log('Health changed from', this.prevHp, 'to', this.dataService.currentLifeProgress());
      if (this.prevHp > this.dataService.currentLifeProgress() && !this.counterRunning) {
        this.isShaking = true;
        setTimeout(() => {
          this.isShaking = false;
        }, 300);
      }
    });

    toObservable(this.dataService.currentLifeProgress)
      .pipe(
        // 2. Only let the signal through when it hits <= 0
        filter(progress => progress <= 0),
        // 3. Optional: Only start the timer ONCE 
        // (removes the subscription after it fires once)
        take(1)
      )
      .subscribe(() => {
        console.log('Progress reached 0 - Starting Timer');
        this.dataService.startCountdown(200)
      });
  }

  ngOnInit() {
    console.log('ngOninit!');
    this.dataService.counterStarted$.pipe(
        // 2. Only let the signal through when it hits <= 0
        // 3. Optional: Only start the timer ONCE 
        // (removes the subscription after it fires once)
        take(1)
      ).subscribe(() => {
      console.log('Timer has started!');
      this.counterRunning = true;
      // Trigger animations, play sounds, or disable buttons here
    });

    this.dataService.timerTick$.subscribe((tick) => {
      console.log('Timer tick:', tick);
      const TOTAL_SECONDS = 200;
      const elapsed = TOTAL_SECONDS - tick;
      const progress = (elapsed / TOTAL_SECONDS) * 100;
      setTimeout(() => {
        this.dataService.currentLifeProgress.set(Math.max(0, Math.min(100, progress)));
      }, 1000);

    });

        this.dataService.counterEnded$.pipe(
        // 2. Only let the signal through when it hits <= 0
        // 3. Optional: Only start the timer ONCE 
        // (removes the subscription after it fires once)
        take(1)
      ).subscribe(() => {
      console.log('Timer has ended!');
      this.counterRunning = false;
      // this.dataService.currentLifeProgress.set(100);
      // Trigger animations, play sounds, or disable buttons here
    });
  }

  queueRegenStart() {
    queueMicrotask(() => {
      this.dataService.startCountdown(20)
    });
  }

  shouldStartRegen = computed(() =>
    this.dataService.currentLifeProgress() <= 0
  );

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
