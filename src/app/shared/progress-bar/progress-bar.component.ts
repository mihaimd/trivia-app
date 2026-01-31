import { Component, OnInit, inject, effect, Input, Signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, debounceTime } from 'rxjs/operators';

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
  @Output() progressBarClicked = new EventEmitter<string>();
  private authService: AuthService = inject(AuthService);
  public dataService: DataService = inject(DataService);
  public lifeProgressValue: number = 0;
  public isShaking: boolean = false;
  private prevHp = this.dataService.currentLifeProgress();   // initialized ONCE
  public hours: Signal<number> = computed(() => Math.floor(this.dataService.time() / 3600));
  public minutes: Signal<number> = computed(() => Math.floor((this.dataService.time() % 3600) / 60));
  public seconds: Signal<number> = computed(() => this.dataService.time() % 60);
  private totalSeconds: number = 0;
  private missingPoints: number = 0;

  constructor() {
    effect((): void => {
      if (this.prevHp > this.dataService.currentLifeProgress() && !this.dataService.lifeCounterRunning()) {
        this.isShaking = true;
        setTimeout(() => {
          this.isShaking = false;
        }, 300);
      }

      if(this.dataService.currentLifeProgress() < 100 && !this.dataService.lifeCounterRunning()) {
        this.missingPoints = 100 - this.dataService.currentLifeProgress();
        this.totalSeconds = this.missingPoints * 2 * 60;
      }

    //     this.totalSeconds = this.missingPoints * 2 * 60;
    });

    // toObservable(this.dataService.currentLifeProgress)
    //   .pipe(
    //     filter(progress => progress <= 99),
    //     debounceTime(30000),
    //     take(1)
    //   )
    //   .subscribe((progress) => {
    //     console.log('cucu');
    //     const time = new Date().getTime() / 1000;
    //     localStorage.setItem('lastHpZeroTime', time.toString());
    //     this.missingPoints = 100 - progress;

    //     this.totalSeconds = this.missingPoints * 2 * 60;

    //     this.dataService.startCountdown(this.totalSeconds);
    //   });
  }

  

  ngOnInit() {
    console.log('ngOninit!');
    this.dataService.counterStarted$.pipe(
      // 2. Only let the signal through when it hits <= 0
      // 3. Optional: Only start the timer ONCE 
      // (removes the subscription after it fires once)
      // take(1)
    ).subscribe(() => {
      console.log('Timer has started!');
      this.dataService.lifeCounterRunning.set(true);
      // Trigger animations, play sounds, or disable buttons here
    });

    this.dataService.timerTick$.subscribe((tick) => {
      if (this.missingPoints > 0) {
        const elapsed = this.totalSeconds - tick;

        // Calculate progress: Start Point + (Percent of time passed * amount to recover)
        const startPoint = 100 - this.missingPoints;
        const progressGained = (elapsed / this.totalSeconds) * this.missingPoints;
        const finalValue = startPoint + progressGained;

        this.dataService.currentLifeProgress.set(Math.min(100, finalValue));
      }

    });

    this.dataService.counterEnded$.pipe(
      // 2. Only let the signal through when it hits <= 0
      // 3. Optional: Only start the timer ONCE 
      // (removes the subscription after it fires once)
      take(1)
    ).subscribe(() => {
      debugger;
      console.log('Timer has ended!');
      this.dataService.lifeCounterRunning.set(false);
      // this.dataService.currentLifeProgress.set(100);
      // Trigger animations, play sounds, or disable buttons here
    });
  }

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

  progressBarTapped() {
    if(this.barText==='Power') {
      this.progressBarClicked.emit('power');
    }
  }

}
