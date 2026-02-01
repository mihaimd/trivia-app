import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardTitle,
  IonCardContent,
  IonFooter,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButtons,
  IonButton,
  AlertController,
  Platform,
} from '@ionic/angular/standalone';
import { AnswersComponent } from '../shared/answers/answers.component';
import { DataService } from '../services/data.service';
import { addIcons } from 'ionicons';
import {
  logoIonic,
  heart,
  home,
  personCircleOutline,
  cameraOutline,
  personCircle,
} from 'ionicons/icons';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AppSettingInterface,
  CompletedRiversQuestions,
  Option,
  QuestionInterface,
} from '../interfaces/chapter-interface';
import { FirebaseService, UserData } from '../services/firebase.service';
import { AuthService } from '../services/auth.service';
import { SoundService } from '../services/sound.service';
import { AppConstants } from '../shared/constants/app-constants';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-q-detail',
  templateUrl: './q-detail.page.html',
  styleUrls: ['./q-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonCard,
    IonCardTitle,
    IonCardContent,
    AnswersComponent,
    IonFooter,
    IonFab,
    IonFabButton,
    IonIcon,
    IonButtons,
    IonButton,
  ],
})
export class QDetailPage implements OnInit, OnDestroy {
  dataService = inject(DataService);
  private firebaseService = inject(FirebaseService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  isCorrect: boolean = false;
  private lastQuestion: boolean = false;
  private chapterId: number = 0;
  private gameId: number = 0;
  private campaignId: number = 0;
  private questionId: number = 0;
  answerChosen: boolean = false;
  questionInfo: QuestionInterface | undefined;
  isRiverQuestion: boolean = false;
  currentUser: UserData | undefined;
  appSettings: AppSettingInterface;

  private intervalId: any | undefined;
  public initTime: number = 0;
  public totalTime: number = 20;
  constructor(
    private sound: SoundService
  ) {
    addIcons({
      home,
      personCircle,
      personCircleOutline,
      cameraOutline,
      heart,
      logoIonic,
    });
    this.currentUser = this.authService.getUserProfileFromLocal();
    this.appSettings = this.dataService.getAppSettings();
    this.runAnimation();
  }

  async ngOnInit() {
    if (this.dataService.lifeCounterRunning()) {
      this.dataService.stopCounter();
    }

    if (this.currentUser && this.currentUser.infiniteHealthUntil && this.currentUser.infiniteHealthUntil < new Date().getTime()) {
      this.currentUser.infiniteHealthUntil = 0;
      this.authService.saveUserProfileInLocal(this.currentUser);
    }

    const XPARAMS = this.route.snapshot.params;
    // Accessing required params
    this.chapterId = parseInt(XPARAMS['chapterId'] || `${this.chapterId}`);
    this.gameId = parseInt(XPARAMS['gameId'] || `${this.gameId}`);
    this.campaignId = parseInt(XPARAMS['campaignId'] || `${this.campaignId}`);
    this.questionId = parseInt(XPARAMS['questionId'] || `${this.questionId}`);
    this.lastQuestion = XPARAMS['lastQuestion'] === 'false' ? false : true;
    this.isRiverQuestion = XPARAMS['isRiverQuestion'] === 'true';
    if (this.isRiverQuestion) {
      this.firebaseService.getRiverQuestionByDocId(this.questionId).subscribe({
        next: (questionInfo) => {
          if (questionInfo) {
            this.questionInfo = questionInfo;
          }
        },
      });
    } else {
      this.questionInfo = await this.dataService.getQuestionsByIdFromJsonFile(
        this.questionId,
        this.campaignId
      );
    }
  }

  checkTryAgainType(): string | null {
    if (localStorage.getItem('tryAgainType')) {
      const type = localStorage.getItem('tryAgainType');
      return type;
    } else {
      return 'none';
    }
  }

  runAnimation() {
    if (this.currentUser) {
      if (this.currentUser.skill == AppConstants.SKILL1) {
        this.totalTime = this.totalTime + AppConstants.SKILL1_EXTRA_SEC;
      }
      localStorage.setItem(AppConstants.LK_TIMER_IS_PLAYING, '1');
      this.intervalId = setInterval(() => {
        if (localStorage.getItem(AppConstants.LK_TIMER_IS_PLAYING) == null) {
          clearInterval(this.intervalId);
          this.sound.stop('timer');
        } else {
          this.sound.play('timer');
          if (this.initTime === this.totalTime) {
            this.timeUp(true);
          } else {
            this.initTime++;
          }
        }
      }, 1000);
    }
  }

  async timeUp(over: boolean) {
    clearInterval(this.intervalId);
    this.sound.stop('timer');
    if (over && !this.answerChosen) {
      // this.location.back();
      if (this.isRiverQuestion) {
        this.saveRiverQuestionState('', 0, 0);
        this.router.navigate(['tabs/home/question-river'], { replaceUrl: true });
      } else {
        const visitedQuestions = JSON.parse(
          localStorage.getItem(AppConstants.LK_VISIT_CAMPAIGN_QUESTIONS) || '[]'
        );
        this.lastQuestion = (await this.dataService.getQuestionsByCampaignIdFromJsonFile(this.campaignId)).filter((q) => !visitedQuestions.includes(q.id)).length == 0;
        this.router.navigate(['tabs/home/campain0', this.chapterId, this.gameId, this.campaignId, `${this.lastQuestion}`], { replaceUrl: true });
      }
    }
  }

  timeLeft(left: number) {
    clearInterval(this.intervalId);
    this.sound.stop('timer');
    if (this.isCorrect) {
      if (this.isRiverQuestion) {
        if (this.currentUser) { this.currentUser.timeBonus = this.currentUser.timeBonus + left; }
      } else {
        this.dataService.timeBonus.update((current: number) => current + (Math.ceil(left * 0.2)));
      }
    }
  }

  onAnswerChosen(
    e: MouseEvent,
    option: Option,
    pts: number | undefined,
    answersOptions: Option[]
  ) {
    clearInterval(this.intervalId);
    this.sound.stop('timer');
    if (this.answerChosen) {
      return;
    }
    this.answerChosen = true;
    this.isCorrect = option.correct;
    const clickedElement = e.currentTarget as HTMLElement;
    const correctAnswerIndex = answersOptions.findIndex(
      (v: any) => v.correct == true
    );
    if (option.correct) {
      this.sound.play('correct');
      clickedElement.classList.add('green');
      this.dataService.correctNumber.update((v: number) => v + 1);
      if (pts) {
        this.dataService.campaignScore.update((v: number) => v + pts);
        setTimeout(() => {
          this.dataService.currentPowerProgress.update((current: number) => {
            let newProgress = current + pts!;
            return newProgress;
          });
        }, 2000);
      }
    } else {
      if (this.dataService.currentPowerProgress() > 0) {
        setTimeout(() => {
          this.dataService.currentPowerProgress.set(0);
        }, 2000);
      }

      this.sound.play('wrong');
      clickedElement.classList.add('red');
      if (!this.isRiverQuestion) {
        const correctAnswerOptionElement = document.getElementById(
          `optionx${correctAnswerIndex}`
        );
        if (correctAnswerOptionElement != null) {
          correctAnswerOptionElement.classList.add('green');
        }
      }

      if (pts) {
        if (this.currentUser && !this.currentUser.infiniteHealthUntil) {
          setTimeout(() => {
            this.dataService.currentLifeProgress.update((current: number) => current - pts);
          }, 2000); // do nothing
        }
      }
    }
    this.timeLeft(this.totalTime - this.initTime);
    setTimeout(async () => {
      this.sound.stop('timer');
      if (this.currentUser) {
        if (this.isRiverQuestion) {
          this.saveRiverQuestionState(option.label, pts, (this.totalTime - this.initTime));
        } else {
          const visitedQuestions = JSON.parse(
            localStorage.getItem(AppConstants.LK_VISIT_CAMPAIGN_QUESTIONS) ||
            '[]'
          );
          this.lastQuestion =
            (
              await this.dataService.getQuestionsByCampaignIdFromJsonFile(
                this.campaignId
              )
            ).filter((q) => !visitedQuestions.includes(q.id)).length == 0;
          this.router.navigate(
            [
              'tabs/home/campain0',
              this.chapterId,
              this.gameId,
              this.campaignId,
              this.lastQuestion,
            ],
            { replaceUrl: true }
          );
        }
      }
    }, 1300);
  }

  saveRiverQuestionState(answer: string, pts: number | undefined, timeLeft: number = 0) {
    if (this.currentUser) {
      const completedRiversQuestions: CompletedRiversQuestions = {
        questionId: this.questionId,
        answer: answer,
        pts: pts || 0,
        datetime: new Date().getTime(),
        correct: this.isCorrect,
        timeBonus: this.isCorrect && this.checkTryAgainType() === 'none' ? timeLeft : 0,
        tryAgainAd: this.checkTryAgainType() === 'ad' ? true : false,
        tryAgainGold: this.checkTryAgainType() === 'gold' ? true : false,
      };
      localStorage.removeItem('tryAgainType');
      this.dataService.updateCompletedRiverQuestionsIdsInLocal(
        [this.questionId],
        [completedRiversQuestions]
      );
      if (this.isCorrect) {
        this.currentUser.exp = this.currentUser.exp + completedRiversQuestions.pts;
      }
      this.authService.saveUserProfileInLocal(this.currentUser);
      if (!this.authService.isGuest(this.currentUser)) {
        const completedRivers = this.dataService.getCompletedRiverQuestionsFromLocal();
        const uid = this.currentUser.uid;
        this.firebaseService.updateUser(uid, this.currentUser).then(() => { }).catch((reason: any) => { console.error('FAILD_TO_UPDATE_USERS_INFO::', reason); });
        this.firebaseService.setCompletedRiversByUid(uid, completedRivers).catch((reason: any) => { console.error('FAILD_TO_UPDATE_COMPLETED_RIVERS::', reason); });
      }
      this.router.navigate(['tabs/home/question-river'], {
        replaceUrl: true,
      });
    }
  }

  ngOnDestroy() { localStorage.removeItem(AppConstants.LK_TIMER_IS_PLAYING); }
}
