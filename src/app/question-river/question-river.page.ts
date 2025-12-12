import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonFooter,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
  IonButton,
  IonButtons,
  IonSpinner,
  AlertController,
  IonModal,
} from '@ionic/angular/standalone';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  logoIonic,
  heart,
  home,
  personCircleOutline,
  cameraOutline,
  personCircle,
  checkmarkOutline,
  closeOutline,
  closeCircle,
  checkmarkCircle,
} from 'ionicons/icons';
import {
  CompletedRivers,
  CompletedRiversQuestions,
  Message,
  MySeasons,
  QuestionInterface,
  Seasons,
  UserAnswerd,
} from '../interfaces/chapter-interface';
import { FirebaseService, UserData } from '../services/firebase.service';
import { Timestamp } from 'firebase/firestore';
import { AppConstants } from '../shared/constants/app-constants';
import { delay, Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AdLoadInfo, AdMob, AdOptions, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-question-river',
  templateUrl: './question-river.page.html',
  styleUrls: ['./question-river.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonFooter,
    IonFab,
    IonFabButton,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonButton,
    IonButtons,
    IonSpinner,
    IonModal
  ],
})
export class QuestionRiverPage implements OnInit {
  public showRefSpinner: boolean = false;
  public showSpinner: boolean = true;
  public showEmptyList: boolean = false;
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private firebaseService = inject(FirebaseService);
  readonly router = inject(Router);
  private date = new Date();
  public formattedDate = '';
  public dailyQuestions: QuestionInterface[] = [];
  public completedRiverFromLocal: CompletedRivers | undefined;
  public currentUser: UserData | undefined;
  public currentSeason: Seasons | undefined;
  public myCurrentSeason: MySeasons | undefined;
  public isAdRunning: boolean = false;
  constructor(private alertController: AlertController) {
    addIcons({
      home,
      personCircle,
      personCircleOutline,
      cameraOutline,
      heart,
      logoIonic,
      checkmarkOutline,
      checkmarkCircle,
      closeOutline,
      closeCircle,
    });
    this.formattedDate = this.date.toISOString().split('T')[0];
    this.currentUser = this.authService.getUserProfileFromLocal();
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.showAd();
    this.completedRiverFromLocal = this.dataService.getCompletedRiverQuestionsFromLocal();
    this.firebaseService.getActiveSeason().subscribe((season) => {
      if (season) {
        this.currentSeason = season;
        const totalAvailable = this.firebaseService.getUserAvailableQuestions(season);
        this.firebaseService.getSeasonQuestions(season, totalAvailable).subscribe({
          next: (questions) => {
            if (questions) {
              if (this.currentUser) {
                this.currentUser.mySeasons = this.currentUser.mySeasons || [] as MySeasons[];
                if (this.currentSeason) {
                  const CS = this.currentSeason;
                  this.myCurrentSeason = this.currentUser.mySeasons.find((s) => s.id == CS.id);
                }
                this.dailyQuestions = questions;
                this.dailyQuestions = this.dailyQuestions
                  .map((question) => {
                    const USER_ANSWERD = this.chekUserIsAnswerd(question);
                    return {
                      ...question,
                      isAnswerdByUser: USER_ANSWERD.isAnswerdByUser || false,
                      answerWasCorrect: USER_ANSWERD.answerWasCorrect || false,
                      answerdTime: USER_ANSWERD.answerdTime || 0,
                      answerIs: USER_ANSWERD.answerIs || '',
                      timeBonus: USER_ANSWERD.timeBonus || 0,
                      status: USER_ANSWERD.status
                    };
                  }).sort((a, b) => a.answerdTime - b.answerdTime);
                this.showSpinner = false;
              }
            }
          },
          error: (err: any) => {
            this.showSpinner = false;
            console.error('ERROR_GET_DAILY_QUESTIONS_::', err);
          },
        });
      }
    });
  }

  isStartSeason(): boolean {
    if (this.currentSeason) {
      const currenttime = new Date().getTime();
      return currenttime >= this.currentSeason.startDate.toMillis();
    }
    return false;
  }

  refresh(ev: any) {
    this.showRefSpinner = true;
    this.ngOnInit();
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
      this.showRefSpinner = false;
    }, 3000);
  }

  onIonInfinite(e: InfiniteScrollCustomEvent) {
    // setTimeout(() => {
    //   // Logic you want to run after 3 seconds    
    //   e.target.complete();
    // }, 3000);
  }
  selectedQuestion: QuestionInterface | undefined;
  questionDetail(question: QuestionInterface) {
    this.selectedQuestion = question;
    if (this.isAdRunning == false) {
      if (question.status!='CORRECT' && question.status!='TRY_AGAIN') {
        this.router.navigate(['tabs/home/q-detail/', 0, 0, 0, question.id, true, true]);
      } else {
        if (this.currentUser) {
          const totalGoldCoins = this.currentUser.totalGoldCoins || 0;
          if (totalGoldCoins >= AppConstants.TRY_AGAIN_LIMIT_FOR_CHALLENGE) {
            this.currentUser.totalGoldCoins = this.currentUser.totalGoldCoins - AppConstants.TRY_AGAIN_LIMIT_FOR_CHALLENGE;
            this.authService.saveUserProfileInLocal(this.currentUser);
            if(!this.authService.isGuest(this.currentUser)) {
              this.firebaseService.updateUser(this.currentUser.uid, { totalGoldCoins: this.currentUser.totalGoldCoins });
            }
            this.router.navigate(['tabs/home/q-detail/', 0, 0, 0, this.selectedQuestion.id, true, true]);
          } else {
            this.router.navigate(['tabs/home/gold-coins']);
          }
        }
      }
    }
  }
  checkUserCanPlay(question: QuestionInterface): string {
    const now = Date.now();

    // Convert Firestore Timestamp or string to Date
    const questionDate =
      typeof question.date === 'string'
        ? new Date(question.date)
        : new Date(question.date.toDate());
    const questionTime = questionDate.getTime();

    // 1️⃣ Already answered check
    const CRQ = this.completedRiverFromLocal ? this.completedRiverFromLocal.questions : [];
    const alreadyAnswered = CRQ.find((rq)=> rq.questionId === question.id);
    if(alreadyAnswered) {
      if(alreadyAnswered.correct) { return 'CORRECT'; } else { return 'TRY_AGAIN'; }
    }
    
    /* const alreadyAnswered = this.completedRiverFromLocal?.questions?.some(
      (item) => item.questionId === question.id
    );
    if (alreadyAnswered) return false; */

    // 2️⃣ Handle season and user start
    if (this.myCurrentSeason && this.currentSeason) {
      const seasonStart = this.currentSeason.startDate.toMillis();
      const userStart = this.myCurrentSeason.startDate;

      // 🕓 Case: user joined after season start
      if (userStart > seasonStart) {
        // const daysLate = Math.floor((userStart - seasonStart) / (1000 * 60 * 60 * 24));

        // ⏱️ If the question is from before the user joined
        if (questionTime < userStart) {
          // Only active for 24 hours after joining
          const joinGraceEnd = userStart + 24 * 60 * 60 * 1000;
          if (now <= joinGraceEnd) {
            return 'ACTIVE';
          } else {
            return 'TRY_AGAIN';
          }
        }

        // ⏱️ If question released after user joined → normal 24-hour rule
        const hoursSinceQuestion = (now - questionTime) / (1000 * 60 * 60);
        if (hoursSinceQuestion > 24) {
          return 'TRY_AGAIN';
        }
        return 'ACTIVE';
      }
    }

    // 3️⃣ User started on or before season start → normal 24-hour rule
    const hoursSinceQuestion = (now - questionTime) / (1000 * 60 * 60);
    if (hoursSinceQuestion > 24) {
      return 'TRY_AGAIN';
    }
    return 'ACTIVE';
  }

  chekUserIsAnswerd(question: QuestionInterface): QuestionInterface {
    if (this.completedRiverFromLocal != undefined) {
      const CRQ = this.completedRiverFromLocal.questions.find((item) => item.questionId == question.id);
      if (CRQ != undefined) {
        question.isAnswerdByUser = true;
        question.answerWasCorrect = CRQ.correct;
        question.answerIs = CRQ.answer;
        question.answerdTime = CRQ.datetime;
        question.timeBonus = CRQ.timeBonus;
      }
    }
    question.status = this.checkUserCanPlay(question);
    return question;
  }

  getAnswerBtnText(q: QuestionInterface) {
    if (q.isAnswerdByUser) {
      if (q.answerWasCorrect) {
        return 'Answer';
      } else {
        return 'Try Again For 5';
      }
    }
    return 'Try Again For 5';
  }

  /* async presentAlertForTryWithGoldCoin() {
    const alertButtons = [
      {
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          console.log('Alert canceled');
        },
      },
      {
        text: 'OK',
        role: 'Confirm',
        handler: () => {
          console.log('Alert confirmed');
          this.onConfirm();
        },
      },
    ];

    const alert = await this.alertController.create({
      mode: 'ios',
      header: 'Retry Available',
      subHeader: 'Requires 5 Gold Coins',
      message: 'Would you like to spend 5 gold coins to attempt this question again?',
      buttons: alertButtons,
    });
    await alert.present();
  } */

  /* onConfirm() {
    if(this.currentUser && this.selectedQuestion) {
      if(this.currentUser.totalGoldCoins) {
        if(this.currentUser.totalGoldCoins>=5) {
          this.router.navigate(['tabs/home/q-detail/', 0, 0, 0, this.selectedQuestion.id, true, true]);
        } else {
          this.router.navigate(['tabs/home/gold-coins']);
        }
      } else {
        this.router.navigate(['tabs/home/gold-coins']);
      }
    }
  } */

  async showAd() {
    await AdMob.initialize();
    if (this.dataService.canShowAds(AppConstants.CHALLENGE)) {
      this.isAdRunning = true;
      await this.interstitial();
    }
  }

  async interstitial(): Promise<void> {
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => { });

    const options: AdOptions = {
      adId: environment.admob.androidInterstitialAdUnitId,
      isTesting: true
    };
    await AdMob.prepareInterstitial(options);
    await AdMob.showInterstitial();
    this.isAdRunning = false;
  }
}
