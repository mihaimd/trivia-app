import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, signal, WritableSignal, effect } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { AppPlayerData, AppSettingInterface, CampaignInterface, Chapter, CompletedCampaigns, CompletedRivers, CompletedRiversQuestions, CurrentCampaignPercentage, Flag, GameLevels, GamesInterface, PercentageWithStars, QuestionInterface } from '../interfaces/chapter-interface';
import { Message } from '../interfaces/chapter-interface';
import { AppConstants } from '../shared/constants/app-constants';
import { environment } from 'src/environments/environment';
import { UserData } from './firebase.service';
import { AuthService } from './auth.service';
import { ModalController } from '@ionic/angular/standalone';
import { CountryDropdownComponent } from '../shared/country-dropdown/country-dropdown.component';
import config from 'capacitor.config';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class DataService {
  public currentChapter: WritableSignal<Chapter> = signal({ id: 0, campaigns: [] });
  public currentGameInfo: WritableSignal<GamesInterface | undefined> = signal(undefined);
  public currentLifeProgress: WritableSignal<number> = signal(100);
  public currentPowerProgress: WritableSignal<number> = signal(0);
  public noOfLives: WritableSignal<number> = signal(0);
  public time: WritableSignal<number> = signal(1);
  public counterEnded: WritableSignal<boolean> = signal(false);
  // public currentCampaignQuestions: WritableSignal<QuestionInterface[]> = signal([]);
  public campaignScore: WritableSignal<number> = signal(0);
  public correctNumber: WritableSignal<number> = signal(0);
  public timeBonus: WritableSignal<number> = signal(0);
  private counterStartedSource = new Subject<void>();
  private counterEndedSource = new Subject<void>();
  public counterStarted$ = this.counterStartedSource.asObservable();
  public counterEnded$ = this.counterEndedSource.asObservable();
  private timerTickSource = new Subject<number>();
  public timerTick$ = this.timerTickSource.asObservable();
  public lifeCounterRunning: WritableSignal<boolean> = signal(false);
  private rafId: number = 0;
  private debounceTimeout: any;
  public gameLevels = [
    { level: 0, haveExp: 500 },
    { level: 1, haveExp: 1200 },
    { level: 2, haveExp: 3000 },
    { level: 3, haveExp: 5000 },
    { level: 4, haveExp: 7500 },
    { level: 5, haveExp: 9000 },
    { level: 6, haveExp: 12500 },
    { level: 7, haveExp: 15000 },
    { level: 8, haveExp: 17500 },
    { level: 9, haveExp: 20000 },
  ];
  syncAppPlayerDataSubject = new BehaviorSubject<boolean>(false);
  syncAppPlayerCompletedRiverDataSubject = new BehaviorSubject<boolean>(false);
  private readonly flagsPath = '../../assets/flags/flags.json';
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private modalCtrl: ModalController
  ) {
    effect(() => {
      const progress = this.currentLifeProgress();

      // If health is lost, start/reset the 30s 'silence' timer
      if (progress <= 99 && !this.lifeCounterRunning()) {
        this.restartDebounceTimer(progress);
      }
    });

  }

  private restartDebounceTimer(progress: number) {
    // Clear any existing 30s timer (this IS the debounce)
    if (this.debounceTimeout) clearTimeout(this.debounceTimeout);

    this.debounceTimeout = setTimeout(() => {
      console.log('30s passed. Starting recovery.');
      const missing = 100 - progress;
      this.startCountdown(missing * 2 * 60);
    }, 10000);
  }

  public initLocalStorage() {
    this.updateAppPlayerDataToLocal(AppConstants.LK_COMPLETED_CAMPAIGNS, undefined);
    this.updateAppPlayerDataToLocal(AppConstants.LK_COMPLETED_CAMPAIGNS_IDS, undefined);
    this.getAppSettings();
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders().set('Accept', 'application/json');
    headers = headers.set('Content-Type', 'application/json');
    return headers;
  }


  public uploadImage(body: any) {
    return new Promise((resolve, reject) => {
      const headers = this.getHeaders();
      var options = { headers };
      this.http.post(environment.apiUploadUrl, body, options).subscribe({
        next: (response: any) => {
          resolve(response);
        },
        error: (err: any) => { console.error(err); reject(err); }
      });
    });
  }

  /** 
   * Get all flags from JSON 
   */
  public getAllFlags(): Observable<Flag[]> {
    return this.http.get<Flag[]>(this.flagsPath);
  }

  /**
   * Get single flag by code (like 'IN' or 'US')
   */
  public getFlagByCode(code: string): Observable<Flag | null> {
    return this.getAllFlags().pipe(
      map((flags: Flag[]) => {
        const found = flags.find(f => f.code.toUpperCase() === code.toUpperCase());
        return found || null;
      })
    );
  }

  /**
   * Get flag URL directly (for <img [src]="flagUrl" />)
   */
  public getFlagUrl(code: string): string {
    code = code ? code : AppConstants.DEFAULT_COUNTRY_CODE.toLowerCase();
    return `assets/flags/${code.toLowerCase()}.webp`;
  }

  public getChapterByIdFromJsonFile(id: number) {
    return this.http.get(`../../assets/data/chapter${id}.json`);
  }

  public getQuestionsByCampaignIdFromJsonFile(campaignId: number): Promise<QuestionInterface[] | []> {
    return new Promise((resolve, reject) => {
      this.http.get(`../../assets/data/questionsByCampaign${campaignId}.json`).subscribe({
        next: (response: any) => {
          const questions: QuestionInterface[] = response || [];
          // this.currentCampaignQuestions.set(questions);
          resolve(questions);
        },
        error: (err: any) => { console.error(err); reject(err); }
      });
    });
  }

  public getQuestionsByIdFromJsonFile(id: number, campaignId: number): Promise<QuestionInterface | undefined> {
    return new Promise((resolve, reject) => {
      this.http.get(`../../assets/data/questionsByCampaign${campaignId}.json`).subscribe({
        next: (response: any) => {
          const questions: QuestionInterface[] = response || [];
          const question: QuestionInterface | undefined = questions.find((question) => question.id == id);
          if (question != undefined) { resolve(question); } else { reject(undefined); }
        },
        error: (err: any) => { console.error(err); reject(err); }
      });
    });
  }

  async calculatePercentageOfCurrentCampaign(id: number): Promise<CurrentCampaignPercentage> {
    const questions = await this.getQuestionsByCampaignIdFromJsonFile(id);
    var totalPoints = 0;
    questions.map((q) => totalPoints += q.pts);
    const obtainPercentage = this.campaignScore() / totalPoints * 100;
    return {
      timeBonus: this.timeBonus(),
      correctAnswers: this.correctNumber(),
      totalQuestion: questions.length,
      totalPoints,
      obtainPercentage,
      questions
    };
  }

  public reachingLevel(exp: number): number {
    if (exp >= 20000) { return 10; }
    else if (exp >= 17500) { return 9; }
    else if (exp >= 15000) { return 8; }
    else if (exp >= 12500) { return 7; }
    else if (exp >= 9000) { return 6; }
    else if (exp >= 7500) { return 5; }
    else if (exp >= 5000) { return 4; }
    else if (exp >= 3000) { return 3; }
    else if (exp >= 1200) { return 2; }
    else if (exp >= 500) { return 1; }
    return 0;
  }

  public getAppPlayerDataFromLocal(): AppPlayerData {
    const appPlayerData: AppPlayerData = JSON.parse(localStorage.getItem(AppConstants.LK_APP_PLAYER_DATA) || '{}');
    return appPlayerData;
  }

  public updateAppPlayerDataToLocal(key: string, data: any | undefined) {
    const appPlayerData = this.getAppPlayerDataFromLocal();
    if (appPlayerData.completedCampaigns == undefined) {
      Object.assign(appPlayerData, { completedCampaigns: [] });
    }
    if (appPlayerData.completedCampaignsIds == undefined) {
      Object.assign(appPlayerData, { completedCampaignsIds: [] });
    }
    if (data != undefined) {
      if (key == AppConstants.LK_COMPLETED_CAMPAIGNS) {
        const itemIndex = appPlayerData.completedCampaigns.findIndex((item) => item.id == data.id);
        if (itemIndex >= 0) {
          appPlayerData.completedCampaigns[itemIndex] = data;
        } else {
          appPlayerData.completedCampaigns.push(data);
        }
        if (appPlayerData.completedCampaignsIds.includes(data.id) == false) {
          appPlayerData.completedCampaignsIds.push(data.id);
        }
      }
    }
    localStorage.setItem(AppConstants.LK_APP_PLAYER_DATA, JSON.stringify(appPlayerData));
  }

  public saveAppPlayerDataInLocal(appPlayerData: AppPlayerData) {
    localStorage.setItem(AppConstants.LK_APP_PLAYER_DATA, JSON.stringify(appPlayerData));
    this.syncAppPlayerDataSubject.next(true);
  }

  public makeArrayUnique(arr: number[]): number[] {
    return [...new Set(arr)];
  }

  /* public setTotalExp(exp: number) {
    localStorage.setItem(AppConstants.LK_EXP, `${exp}`);
  }
  public getTotalExp() {
    return parseInt(localStorage.getItem(AppConstants.LK_EXP)||'0');
  }  
  public updateTotalExp(exp: number) {
    const total = this.getTotalExp() + exp;
    this.setItemInLocal(AppConstants.LK_EXP, total);
  } */
  /* public getTotalTimeBonus() {
    return parseInt(localStorage.getItem(AppConstants.LK_TIME_BONUS)||'0');
  } */
  /* public setTotalTimeBonus(timeBonus: number) {
    return localStorage.setItem(AppConstants.LK_TIME_BONUS, `${timeBonus}`);
  } */
  /* public updateTotalTimeBonus(timeBonus: number) {
    const total = this.getTotalTimeBonus() + timeBonus;
    this.setTotalTimeBonus(total);
  } */
  calTotalTimeBonusFromLocal(): number {
    var totalTimeBonus = 0;
    const appPlayerData: AppPlayerData = this.getAppPlayerDataFromLocal();
    if (appPlayerData.completedCampaigns) {
      appPlayerData.completedCampaigns.map((cc) => {
        totalTimeBonus += cc.timeBonus
      });
    }
    return totalTimeBonus;
  }
  // public getSkill(): string|null {
  //   return localStorage.getItem(AppConstants.LK_SKILL);
  // }
  // public setSkill(skill: string) {
  //   localStorage.setItem(AppConstants.LK_SKILL, skill);
  // }
  public getItemFromLocal(key: string): any | any[] { return JSON.parse(localStorage.getItem(key) || '[]'); }
  public setItemInLocal(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  public calPercentage(exp: number, totalPoints: number): PercentageWithStars {
    const percentage = (exp / totalPoints * 100);
    return { percentage: percentage, stars: this.getStars(percentage) };
  }
  public getStars(percentage: number): number {
    if (percentage >= 75) return 3;
    if (percentage >= 50) return 2;
    if (percentage >= 0) return 1;
    return 0;
  }

  public getAppPlayerCampaignsWhereNotHaveStart(n: number = 1): CompletedCampaigns[] | [] {
    const appPlayerData: AppPlayerData = this.getAppPlayerDataFromLocal();
    if (appPlayerData.completedCampaigns == undefined) return [];
    return appPlayerData.completedCampaigns
      .sort((a, b) => a.id - b.id)
      .filter(cc => {
        const { stars } = this.calPercentage(cc.exp, cc.totalPoints);
        return stars < n;
      });
  }

  public filterCompletedCampaignsWhereNotHave(stars: number, completedCampaigns: CompletedCampaigns[]): CompletedCampaigns[] | [] {
    var p = 100;
    if (stars == 3) { p = 100; } else if (stars == 2) { p = 75; } else { p = 50; }
    return completedCampaigns.filter((cc) => this.calPercentage(cc.exp, cc.totalPoints).percentage <= p);
  }

  public getAvatars() {
    var avatars: string[] = [];
    for (let p = AppConstants.TOTAL_PNG_AVATARS; p > 0; p--) {
      avatars.push(`${p}.png`);
    }
    return avatars;
  }
  public getAvatarUrl(avatarName: string | null) {
    if (avatarName == null) return `assets/avatars/${AppConstants.DEFAULT_AVATAR}`;
    if (avatarName.length > 0 && avatarName.includes('assets/avatars')) return avatarName;
    return avatarName.length > 0 && !avatarName.includes('http') ? `assets/avatars/${avatarName}` : avatarName;
  }
  public getAppSettings(): AppSettingInterface {
    const appSettings = localStorage.getItem(AppConstants.LK_SETTING);
    if (appSettings == null) {
      const appSetting: AppSettingInterface = {
        sound: true,
        notification: true,
        fontSize: 'normal'
      };
      localStorage.setItem(AppConstants.LK_SETTING, JSON.stringify(appSetting));
      return appSetting;
    } else {
      return JSON.parse(appSettings);
    }
  }

  public getLevel(exp: number): GameLevels {
    let level = 0;
    let nextLevelExp = 0;
    // Find which level the current EXP falls into
    for (let i = 0; i < this.gameLevels.length; i++) {
      const current = this.gameLevels[i];
      const next = this.gameLevels[i + 1];
      if (exp < current.haveExp) {
        level = i;
        nextLevelExp = current.haveExp;
        break;
      } else if (!next) {
        // For levels beyond level 10
        const extraExp = AppConstants.SUB_SEQUENT_LEVEL_EVENRY;
        const extraLevel = Math.floor((exp - current.haveExp) / extraExp);
        level = current.level + extraLevel + 1;
        nextLevelExp = current.haveExp + extraExp * (extraLevel + 1);
        break;
      }
    }

    // Calculate progress % for progress bar
    let prevExp = 0;
    for (let i = 0; i < this.gameLevels.length; i++) {
      if (this.gameLevels[i].level === level - 1) {
        prevExp = this.gameLevels[i].haveExp;
        break;
      }
    }
    if (level === 0) prevExp = 0;

    const progressPercent = Math.min(100, Math.floor(((exp - prevExp) / (nextLevelExp - prevExp)) * 100));

    return { level, exp, nextLevelExp, progressPercent };
  }

  getCompletedRiverQuestionsFromLocal(): CompletedRivers {
    const data = localStorage.getItem(AppConstants.LK_COMPLETED_RIVERS);
    if (!data) {
      return { questionIds: [], questions: [] };
    }
    return JSON.parse(data);
  }


  setCompletedRiverQuestionsIdsInLocal(questionIds: number[], questions: CompletedRiversQuestions[]) {
    if (Array.isArray(questionIds) && questionIds.every(id => typeof id === 'number')) {
      localStorage.setItem(AppConstants.LK_COMPLETED_RIVERS, JSON.stringify({ questionIds, questions }));
      this.syncAppPlayerCompletedRiverDataSubject.next(true);
    }
  }

  updateCompletedRiverQuestionsIdsInLocal(questionIds: number[], questions: CompletedRiversQuestions[]): CompletedRivers {
    const riverQuestions = this.getCompletedRiverQuestionsFromLocal();
    const localQIds = riverQuestions.questionIds;
    const localQuestions = riverQuestions.questions;

    // Merge & remove duplicate IDs
    const qIds = Array.from(new Set([...localQIds, ...questionIds]));

    // Merge questions without duplicate questionId
    const allQuestions = [...localQuestions];
    questions.forEach((q, qi) => {
      const have = allQuestions.some(x => x.questionId === q.questionId);
      const haveIndex = allQuestions.findIndex((x) => x.questionId === q.questionId);
      if (haveIndex > 0) {
        allQuestions[haveIndex] = q;
      } else {
        allQuestions.push(q);
      }
    });

    const data: CompletedRivers = { questionIds: qIds, questions: allQuestions };
    localStorage.setItem(AppConstants.LK_COMPLETED_RIVERS, JSON.stringify(data));
    return data;
  }

  canShowAdsOld(gameType: string): boolean {
    const currentUser = this.authService.getUserProfileFromLocal();
    const adsRemoved = currentUser ? currentUser.adsRemoved : false;
    if (adsRemoved) return false;
    const appPlayerData = this.getAppPlayerDataFromLocal();
    const completedRiverQuestions = this.getCompletedRiverQuestionsFromLocal();
    if (gameType == AppConstants.SOLO) {
      const totalCompletedCampaigns = appPlayerData.completedCampaignsIds.length || 0;
      return (totalCompletedCampaigns % AppConstants.SOLO_ADS_PLAY_EACH_CAMPAIGN === 0);
    } else if (gameType == AppConstants.CHALLENGE) {
      const totalCompletedQuestions = completedRiverQuestions.questionIds.length;
      return (totalCompletedQuestions % AppConstants.CHALLENGE_ADS_PLAY_EACH_QUESTION === 0);
    }
    return true;
  }

  canShowAds(gameType: string): boolean {
    const currentUser = this.authService.getUserProfileFromLocal();
    const adsRemoved = currentUser ? currentUser.adsRemoved : false;
    if (adsRemoved) return false;

    const appPlayerData = this.getAppPlayerDataFromLocal();
    const completedRiverQuestions = this.getCompletedRiverQuestionsFromLocal();

    if (gameType === AppConstants.SOLO) {
      const totalCompletedCampaigns = appPlayerData?.completedCampaignsIds?.length || 0;
      const lastAdCampaign = Number(localStorage.getItem('lastAdCampaign') || '0');

      if (
        totalCompletedCampaigns >= 0 &&
        totalCompletedCampaigns % AppConstants.SOLO_ADS_PLAY_EACH_CAMPAIGN === 0 &&
        totalCompletedCampaigns !== lastAdCampaign
      ) {
        localStorage.setItem('lastAdCampaign', totalCompletedCampaigns.toString());
        return true;
      }

      return false;
    }

    if (gameType === AppConstants.CHALLENGE) {
      const totalCompletedQuestions = completedRiverQuestions?.questionIds?.length || 0;
      const lastAdQuestionCount = Number(localStorage.getItem('lastAdQuestionCount') || '0');

      if (
        totalCompletedQuestions >= 0 &&
        totalCompletedQuestions % AppConstants.CHALLENGE_ADS_PLAY_EACH_QUESTION === 0 &&
        totalCompletedQuestions !== lastAdQuestionCount
      ) {
        localStorage.setItem('lastAdQuestionCount', totalCompletedQuestions.toString());
        return true;
      }

      return false;
    }

    return false;
  }



  async showCountryDropdown() {
    const modal = await this.modalCtrl.create({
      component: CountryDropdownComponent,
    });
    modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm') { }
    return { data, role };
  }

  getCoinsForBundle(productId: string): number {
    // Map productId to the number of coins
    switch (productId) {
      case `${config.appId}.smallbundle`:
        return AppConstants.GOLD_COINS_SMALL;
      case `${config.appId}.mediumbundle`:
        return AppConstants.GOLD_COINS_MEDIUM;
      case `${config.appId}.largebundle`:
        return AppConstants.GOLD_COINS_LARGE;
      case `${config.appId}.economybundle`:
        return AppConstants.GOLD_COINS_ECONOMY;
      default:
        return 0;
    }
  }

  startCountdown(seconds: number) {
    const end = Date.now() + seconds * 1000;
    localStorage.setItem('endTime', String(end));
    this.counterStartedSource.next();
    this.runTimer();
  }

  runTimer() {
    let lastEmittedSecond = -1; // Track the last second we emitted
    const tick = () => {
      const end = Number(localStorage.getItem('endTime'));
      const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));

      this.time.set(remaining);

      if (remaining !== lastEmittedSecond) {
        this.timerTickSource.next(remaining);
        lastEmittedSecond = remaining;
      }

      if (remaining > 0) {
        this.rafId = requestAnimationFrame(tick); // battery-friendly & OS-safe
      } else {
        this.stopCounter(); // Auto-stop when done
      }
    };

    tick();
  }

  stopCounter() {
    cancelAnimationFrame(this.rafId);
    localStorage.removeItem('endTime');
    this.time.set(0);
    this.counterEndedSource.next();
    this.lifeCounterRunning.set(false);
  }

}