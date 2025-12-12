import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ViewChildren,
  QueryList,
  inject,
  AfterViewInit,
  effect,
  signal,
  OnDestroy,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  ModalController,
} from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { GlowDirective } from 'src/app/directives/glow.directive';
import { DataService } from 'src/app/services/data.service';
import { addIcons } from 'ionicons';
import {
  DragDropModule,
  CdkDragMove,
  CdkDragEnd,
} from '@angular/cdk/drag-drop';
import { interval, take, delay } from 'rxjs';
import { SkillsComponent } from 'src/app/shared/skills/skills.component';
import {
  AppPlayerData,
  ChapterInterface,
  CompletedCampaigns,
  CurrentCampaignPercentage,
  QuestionInterface,
} from 'src/app/interfaces/chapter-interface';
import { AppConstants } from 'src/app/shared/constants/app-constants';
import { LevelupComponent } from 'src/app/shared/levelup/levelup.component';
import { FirebaseService, UserData } from 'src/app/services/firebase.service';
import { AuthService } from 'src/app/services/auth.service';
import { AdLoadInfo, AdMob, AdOptions, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-campain0',
  templateUrl: './campain0.page.html',
  styleUrls: ['./campain0.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonGrid,
    IonRow,
    IonCol,
    CommonModule,
    FormsModule,
    DragDropModule,
    GlowDirective,
  ],
})
export class Campain0Page implements OnInit, AfterViewInit, OnDestroy {
  bubbles = ['a', 'b', 'c'];
  dragOver = false;
  public questions: QuestionInterface[] = [];
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  public dataService = inject(DataService);
  private chapterId: number = 1;
  private gameId: number = 1;
  private campaignId: number = 0;
  private droppedOnTarget: number = 0;
  public starScreen: boolean = false;
  public score = signal(0);
  public currentExperience = 0;
  public currentTimeBonus = 0;
  public currentTotal = 0;
  public chapterInfo: ChapterInterface | undefined;
  public appPlayerData: AppPlayerData;
  public isGameCompleted: boolean = false;
  public currentUser: UserData | undefined;
  public currentCampaignPercentage: CurrentCampaignPercentage | undefined;
  public isClickedContinue: boolean = false;

  @ViewChildren('draggable') draggable!: QueryList<ElementRef>;
  @ViewChild('target') target!: ElementRef;
  @ViewChild('progress', { static: true }) progress!: ElementRef;
  // @ViewChild('stars') stars!: ElementRef;
  @ViewChild('star1') star1!: ElementRef;
  @ViewChild('star2') star2!: ElementRef;
  @ViewChild('star3') star3!: ElementRef;

  constructor(
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private firebaseService: FirebaseService,
    private authService: AuthService
  ) {
    effect((): void => {
      this.dataService.campaignScore();
    });
    this.appPlayerData = this.dataService.getAppPlayerDataFromLocal();
    this.currentUser = this.authService.getUserProfileFromLocal();    
  }

  ngOnInit() {
    const XPARAMS = this.route.snapshot.params;
    this.chapterId = parseInt(XPARAMS['chapterId']);
    this.gameId = parseInt(XPARAMS['gameId']);
    this.campaignId = parseInt(XPARAMS['campaignId']);
    this.starScreen = XPARAMS['starScreen'] === 'true';
    this.dataService.calculatePercentageOfCurrentCampaign(this.campaignId).then((currentCampaignPercentage) => {
      this.currentCampaignPercentage = currentCampaignPercentage;
      const visitedQuestions = JSON.parse(localStorage.getItem(AppConstants.LK_VISIT_CAMPAIGN_QUESTIONS) || '[]');
      this.questions = this.currentCampaignPercentage.questions.filter((q) => !visitedQuestions.includes(q.id));
      this.droppedOnTarget = this.questions.length;
      if (this.starScreen) { this.triggerProgress(); }
    });
  }

  onDragMoved(event: CdkDragMove, points: any) {
    const isOverlap = this.checkOverlap(
      event.source.element.nativeElement,
      this.target.nativeElement
    );    
    isOverlap
      ? this.target.nativeElement.classList.add('shake')
      : this.target.nativeElement.classList.remove('shake');
    event.source.element.nativeElement.children[0].classList.add('draggging');
    event.source.element.nativeElement.children[1].classList.add('draggging');
  }

  onDragEnded(event: CdkDragEnd, question: any) {
    const draggedEl = event.source.element.nativeElement;
    const targetEl = this.target.nativeElement;

    const isDroppedOnTarget = this.checkOverlap(draggedEl, targetEl);

    if (isDroppedOnTarget) {
      this.droppedOnTarget--;
      draggedEl.classList.add('dropped');
      targetEl.classList.remove('shake');
      const qId = draggedEl.getAttribute('id');
      if (qId) {
        this.droppedOnTarget === this.draggable.length
          ? this.questionDetail(
            this.gameId,
            this.campaignId,
            parseInt(qId, 10),
            true
          )
          : this.questionDetail(
            this.gameId,
            this.campaignId,
            parseInt(qId, 10)
          );
      }

      // You can trigger logic here: drop zone logic, emit event, etc.
    }
  }

  checkOverlap(el1: HTMLElement, el2: HTMLElement): boolean {
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();

    return !(
      r1.right < r2.left ||
      r1.left > r2.right ||
      r1.bottom < r2.top ||
      r1.top > r2.bottom
    );
  }

  questionDetail(
    gameId: number,
    campaignId: number,
    id: number,
    last: boolean = false
  ) {
    const visitedQuestions = JSON.parse(localStorage.getItem(AppConstants.LK_VISIT_CAMPAIGN_QUESTIONS) || '[]');
    if (visitedQuestions.includes(id) == false) { visitedQuestions.push(id); localStorage.setItem(AppConstants.LK_VISIT_CAMPAIGN_QUESTIONS, JSON.stringify(visitedQuestions)); }
    this.router.navigate(
      ['tabs/home/q-detail', '1', gameId, campaignId, id, last, false],
      { replaceUrl: true }
    );
  }

  triggerProgress() {
    this.progress.nativeElement.style.height = '0%';
    const proc =
      (this.dataService.correctNumber() * 100) / this.questions.length;
    /* debugger; */
    setTimeout(() => {
      this.progress.nativeElement.style.height = `${proc}%`;
    }, 1000);
  }

  async ngAfterViewInit(): Promise<void> {    
    if (this.starScreen) {
      interval(60) // every 200ms
        .pipe(take(this.dataService.campaignScore() + 1)) // emit 21 numbers (0 to 20)
        .subscribe((val) => (this.currentExperience = val));
      interval(60) // every 200ms
        .pipe(delay(2000), take(this.dataService.timeBonus() + 1)) // emit 21 numbers (0 to 20)
        .subscribe((val) => (this.currentTimeBonus = val));
      interval(60) // every 200ms
        .pipe(
          delay(4000),
          take(
            this.dataService.timeBonus() + this.dataService.campaignScore() + 1
          )
        ) // emit 21 numbers (0 to 20)
        .subscribe((val) => (this.currentTotal = val));
      this.showAd();
      localStorage.removeItem(AppConstants.LK_VISIT_CAMPAIGN_QUESTIONS);
      setTimeout(() => {
        const OBTAIN_PERCENTAGE = this.currentCampaignPercentage?.obtainPercentage || 0;
        if (OBTAIN_PERCENTAGE >= 75) {
          this.star1.nativeElement.classList.add('star__1');
          this.star2.nativeElement.classList.add('star__2');
          this.star3.nativeElement.classList.add('star__3');
          if (this.currentUser && this.currentUser.skill == AppConstants.SKILL1) {
            this.showLevelUpDailog();
          }
        } else if (OBTAIN_PERCENTAGE >= 50) {
          this.star1.nativeElement.classList.add('star__1');
          this.star2.nativeElement.classList.add('star__2');
          this.star3.nativeElement.classList.add('darkstar__3');
        } else if (OBTAIN_PERCENTAGE >= 0) {
          this.star1.nativeElement.classList.add('star__1');
          this.star2.nativeElement.classList.add('darkstar__2');
          this.star3.nativeElement.classList.add('darkstar__3');
        }
      }, 3000);
      this.draggable.forEach((el: ElementRef) => {
        el.nativeElement.style.display = 'none';
      });
    }
  }
  
  async backToStory() {
    const exp = this.dataService.campaignScore();
    this.dataService.getChapterByIdFromJsonFile(this.chapterId).subscribe({
      next: async (response: any) => {
        if (response) {
          this.chapterInfo = response;
          if (this.chapterInfo != undefined) {
            const game = this.chapterInfo.games.find((game) => game.gameId == this.gameId);
            if (game != undefined) {
              if (this.appPlayerData.completedCampaignsIds != undefined) {
                this.isGameCompleted = game.campaigns.filter((c) => this.appPlayerData.completedCampaignsIds.includes(c.id)).length == game.campaigns.length;
              }
              const campaign = game.campaigns.find((c) => c.id == this.campaignId);
              if (campaign != undefined) {
                const CCCP = await this.dataService.calculatePercentageOfCurrentCampaign(this.campaignId);
                const updateCompletedCampaigns: CompletedCampaigns = {
                  id: this.campaignId,
                  chapterId: this.chapterId,
                  gameId: this.gameId,
                  exp: exp,
                  title: campaign.title,
                  timeBonus: CCCP.timeBonus,
                  correctAnswers: CCCP.correctAnswers,
                  totalQuestions: CCCP.totalQuestion,
                  totalPoints: CCCP.totalPoints,
                  time: new Date().getTime(),
                };
                this.dataService.updateAppPlayerDataToLocal(AppConstants.LK_COMPLETED_CAMPAIGNS, updateCompletedCampaigns);
                if (this.currentUser) {
                  this.currentUser.exp = this.currentUser.exp + updateCompletedCampaigns.exp;
                  this.currentUser.level = this.dataService.reachingLevel(this.currentUser.exp);
                  this.currentUser.lastActive = this.firebaseService.getFbTimestamp();
                  this.currentUser.timeBonus = this.currentUser.timeBonus + updateCompletedCampaigns.timeBonus;
                  this.currentUser.isJourneyStarted = true;
                  this.authService.saveUserProfileInLocal(this.currentUser);
                  if (!this.authService.isGuest(this.currentUser)) {
                    await this.firebaseService.updateUser(this.currentUser.uid, this.currentUser).then(()=>this.isClickedContinue=false).catch((err:any)=>{ console.error('ERR_IN_UPDATE_USER::',err); this.isClickedContinue=false; });
                    await this.firebaseService.updateCompletedCampaignsByUid(this.currentUser.uid, updateCompletedCampaigns);
                  }
                  this.initWritableSignal();
                }
              }
            }
          }
        }
      },
    });
  }

  initWritableSignal() {
    this.dataService.campaignScore.set(0);
    this.dataService.correctNumber.set(0);
    this.dataService.timeBonus.set(0);
    this.dataService.currentGameInfo.set(undefined);
    if (this.isGameCompleted) {
      this.gameId += 1;
    }
    if (this.currentUser && this.dataService.reachingLevel(this.currentUser.exp) >= AppConstants.SKILL_UNLOCK_LEVEL) {
      this.openSkillModal().then((res)=>{
        this.router.navigate([`tabs/home/game`, this.chapterId, this.gameId], { replaceUrl: true });
      }).catch((reason:any)=>{
        this.router.navigate([`tabs/home/game`, this.chapterId, this.gameId], { replaceUrl: true });
      });
    } else {
      this.router.navigate([`tabs/home/game`, this.chapterId, this.gameId], { replaceUrl: true });
    }
  }

  async openSkillModal(): Promise<any> {
    if (this.currentUser) {
      var skill = this.currentUser.skill;
      if (!skill) {
        const modal = await this.modalCtrl.create({
          component: SkillsComponent,
          cssClass: 'skill-gaining-modal',
        });
        modal.present();
        const { data, role } = await modal.onWillDismiss();
        if (role === 'confirm') {
          this.currentUser.skill = data;
          if (this.currentUser) {
            if (this.authService.isGuest(this.currentUser)) {
              this.authService.saveUserProfileInLocal(this.currentUser);
            } else {
              this.firebaseService.updateUser(this.currentUser.uid, { skill: data });
            }
          }
        }
        return { data, role };
      }
    }
    return null;
  }

  async exitCampaign() {
    const alertButtons = [
      {
        text: 'STAY',
        role: 'cancel',
        cssClass: 'ask-btn-success',
      },
      {
        text: 'EXIT',
        role: 'confirm',
        cssClass: 'ask-btn-danger',
        handler: () => {
          localStorage.removeItem(AppConstants.LK_VISIT_CAMPAIGN_QUESTIONS);
          this.router.navigate([`tabs/home/game`, this.chapterId, this.gameId]);
        },
      },
    ];
    const alert = await this.alertController.create({
      header: 'Exit Campaign 🚸',
      message: 'The score for the current Campaign will be lost',
      buttons: alertButtons,
      mode: 'ios',
    });
    await alert.present();
  }

  async showLevelUpDailog(): Promise<any> {
    const modal = await this.modalCtrl.create({
      component: LevelupComponent,
      cssClass: 'level-up-modal',
    });
    modal.present();
    const { data, role } = await modal.onWillDismiss();
    return { data, role };
  }

  async showAd() {
    await AdMob.initialize();
    if (this.dataService.canShowAds(AppConstants.SOLO)) {
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
  }

  ngOnDestroy(): void { }
}
