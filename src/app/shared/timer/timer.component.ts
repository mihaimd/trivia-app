import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core'; 
import { delay } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { SoundService } from 'src/app/services/sound.service';
import { AppConstants } from '../constants/app-constants';
import { UserData } from 'src/app/services/firebase.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
  standalone: true
})
export class TimerComponent implements OnInit, OnChanges {
  @Input() answerChosen: boolean = false;
  @Input() isRiverQuestion: boolean = false;
  @Input() totalTimeBonus: number = 0;
  @Output() timeUp = new EventEmitter<boolean>();
  @Output() timeLeft = new EventEmitter<number>();
  @Output() timeBonusLeft = new EventEmitter<number>();
  public initTime: number = 0;
  public totalTime: number = 20;
  private intervalId: any;

  constructor(
    private sound: SoundService,
    private authService: AuthService    
  ) { }

  ngOnInit() {
    const currentUser = this.authService.getUserProfileFromLocal();
    if(currentUser) {
      if(currentUser.skill == AppConstants.SKILL1) {
        this.totalTime += 10;
        this.totalTime += this.totalTimeBonus;
      }
      this.runAnimation();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes) {
      if(changes['answerChosen'] && changes['answerChosen'].currentValue === true) {
        clearInterval(this.intervalId);
        this.sound.stop('timer');
        this.timeLeft.emit(this.totalTime - this.initTime);
      }
    }
  }

  runAnimation() {
    this.intervalId = setInterval(() => {
      this.sound.play('timer');
      if(this.initTime === this.totalTime) {
        this.timeUp.emit(true);
        clearInterval(this.intervalId);
        this.sound.stop('timer');
      }
      this.initTime++;
      this.timeBonusLeft.emit(this.totalTime - this.initTime);
    }, 1000);
  }
}
