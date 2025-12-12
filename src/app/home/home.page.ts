import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  RefresherCustomEvent, IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonList, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonFooter, IonButton, IonIcon, IonFab, IonFabButton, IonFabList, IonButtons, IonTabBar, IonTabButton, IonLabel,
  IonImg,
  IonMenuButton,
  IonMenu,
  IonBadge,
  IonAvatar,
  IonModal,
  AlertController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

import { DataService } from '../services/data.service';
import { addIcons } from 'ionicons';
import { logoIonic, heart, home, personCircleOutline, cameraOutline, personCircle } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { FirebaseService, UserData } from '../services/firebase.service';
import { AppPlayerData, ChapterInterface, CompletedRivers, GamesInterface, Seasons } from '../interfaces/chapter-interface';
import { AppConstants } from '../shared/constants/app-constants';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonFooter,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonFabList,
    IonButtons,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonImg,
    IonMenu,
    IonMenuButton,
    IonBadge,
    IonAvatar,
    AvatarComponent,
    IonBadge,
    IonModal
  ],
})
export class HomePage {
  public country: string = AppConstants.DEFAULT_COUNTRY;
  public country_code: string = AppConstants.DEFAULT_COUNTRY_CODE;
  public dataService = inject(DataService);
  public authService = inject(AuthService);
  private firebaseService = inject(FirebaseService);
  private router = inject(Router)
  public currentUser: UserData | undefined;
  // public journeyProgress: number = 0;
  public challengeProgress: number = 0;
  public appPlayerData: AppPlayerData | undefined;
  public chapterId: number = 1;
  public gameId: number = 1;
  public campaignId: number = 1;
  public gameInfo: GamesInterface | undefined;
  public chapterInfo: ChapterInterface | undefined;
  public journeyProgressData: any;
  public challengeProgressData: any;
  completedRivers: CompletedRivers | undefined;
  public currentSeason: Seasons | undefined;
  public nextSeason: Seasons | undefined;
  isModalOpen: boolean = false;
  // imageUrl: string = '';
  constructor(
    private alertController: AlertController,
  ) {
    addIcons({ personCircleOutline, cameraOutline, home, personCircle, heart, logoIonic });
  }
  
  async ionViewWillEnter() {
    this.currentUser = this.authService.getUserProfileFromLocal();
    if (this.currentUser) {
      this.journeyProgressData = this.dataService.getLevel(this.currentUser.exp || 0);
    } else {
      await this.askUserToLocationPermission();
      this.currentUser = this.authService.makeGuestUserProfile(this.country, this.country_code);
      this.journeyProgressData = this.dataService.getLevel(this.currentUser.exp || 0);
    }
    this.currentSeason = await this.firebaseService.getCurrentSeason();
    this.nextSeason = await this.firebaseService.getNextActiveSeason();
    this.initHomePage();
  }

  async askUserToLocationPermission() {
    try {
      const permStatus = await Geolocation.checkPermissions();
      if (permStatus.location !== 'granted') {
        const requestPerm = await Geolocation.requestPermissions();
        if (requestPerm.location !== 'granted') {
          // If location permission is not granted, show an alert
          await this.showPermissionDeniedAlert();
          console.warn('User denied location permission');
          return;
        }
      }

      // Now permission granted, get current position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 5000,
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      // Fetch country details using your API
      this.authService.getLocationDetails(lat, lon).subscribe({
        next: (value: any) => {
          if (value && value.country) {
            this.country = value.country || AppConstants.DEFAULT_COUNTRY;
            this.country_code = value.country_code || AppConstants.DEFAULT_COUNTRY_CODE;
            if(this.currentUser){
              this.currentUser.country = this.country;
              this.currentUser.country_code = this.country_code;
              this.authService.saveUserProfileInLocal(this.currentUser);
            }
          }
          // Check if the country and country_code are null or undefined
          if (!this.country || !this.country_code) {
            this.showLocationErrorAlert();
          }
        },
        error: (err) => console.error('Location API error:', err),
      });

    } catch (error) {
      console.error('Error getting location:', error);
      await this.showPermissionDeniedAlert();
    }
  }

  initHomePage() {
    this.dataService.getChapterByIdFromJsonFile(this.chapterId).subscribe({
      next: (value: any) => {
        if (value) {
          this.chapterInfo = value;
          if (this.chapterInfo) {
            this.completedRivers = this.dataService.getCompletedRiverQuestionsFromLocal();
            this.challengeProgress = this.completedRivers.questions.filter((CRQ) => CRQ.correct).length;
            this.appPlayerData = this.dataService.getAppPlayerDataFromLocal();
            
            const allCompletedCampaignsIdsByUser: number[] = this.appPlayerData.completedCampaignsIds.sort();
            const allCompletedCampaignsByUser = this.appPlayerData.completedCampaigns.sort((a, b) => a.id - b.id);
            const lastIndexOf = allCompletedCampaignsByUser.length - 1;
            const lastCompletedCampaignInfo = allCompletedCampaignsByUser[lastIndexOf];
            if (lastCompletedCampaignInfo) {
              this.gameId = lastCompletedCampaignInfo.gameId || this.gameId;
              this.campaignId = allCompletedCampaignsIdsByUser[allCompletedCampaignsIdsByUser.length - 1] || this.campaignId;
            }
            this.gameInfo = this.chapterInfo.games.find((game) => game.gameId == this.gameId);
            if (this.gameInfo) {
              const currentGameTotalCampaigns = this.gameInfo.campaigns.length;
              const currentGameCompletedCampaignsByUser = allCompletedCampaignsByUser.filter((c) => c.gameId == this.gameId);
              const currentGameTotalCompletedCampaignsByUser = currentGameCompletedCampaignsByUser.length;
              if (currentGameTotalCampaigns) {
                const isGameCompleted = currentGameTotalCampaigns == currentGameTotalCompletedCampaignsByUser;
                if (isGameCompleted) {
                  this.gameId = this.gameId + 1;
                }
              }
            }
          }
        }
      },
      error: (err: any) => console.error('FAILD_TO_FETCH_CHAPTER_INFO', err)
    });
  }

  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 3000);
  }
  

  goToHowTo() {
    if (this.currentUser) {
      if (this.currentUser.isChallengeStart) {
        if (this.currentSeason) {
          const CS = this.currentSeason;
          const now = new Date();
          if (now.getTime() < this.currentSeason.startDate.toMillis()) {
            this.isModalOpen = true;
          } else {
            if (this.currentUser.mySeasons && this.currentUser.mySeasons.length > 0) {
              const MYS = this.currentUser.mySeasons.find((s) => s.id == CS.id);
              if (MYS == undefined) {
                this.currentUser.mySeasons.push({ id: CS.id, startDate: new Date().getTime() });
              }
            } else {
              this.currentUser.mySeasons = [];
              this.currentUser.mySeasons.push({ id: CS.id, startDate: new Date().getTime() });
            }
            this.authService.saveUserProfileInLocal(this.currentUser);
            if (this.authService.isGuest(this.currentUser) == false) {
              this.firebaseService.updateUser(this.currentUser.uid, { mySeasons: this.currentUser.mySeasons });
            }
            this.router.navigateByUrl('tabs/home/question-river');
          }
        }
      } else {
        this.router.navigateByUrl('tabs/home/how-to');
      }
    }
  }

  goToGame() {
    /* if(this.appPlayerData) {
      this.appPlayerData.completedCampaignsIds.includes();
    } */
    this.router.navigate(['tabs/home/game', this.chapterId, this.gameId]);
  }
  goToGoldCoin() {
    this.router.navigate(['tabs/home/gold-coins']);
  }

  yProgressWidth(): string {
    const p = (this.challengeProgress / AppConstants.GAME_CHALLENGE_TOTAL_QUESTIONS * 100);
    return `${p}%`;
  }

  xProgressWidth(): string {
    const o = this.journeyProgressData.exp || 0;
    const t = this.journeyProgressData.nextLevelExp || 500;
    const p = o / t * 100;
    return `${p}%`;
  }

  getFlag() {
    const code = this.currentUser ? this.currentUser.country_code : AppConstants.DEFAULT_COUNTRY_CODE;
    return this.dataService.getFlagUrl(code);
  }

  setOpen(x: boolean) {
    this.isModalOpen = x;
  }

  async showPermissionDeniedAlert() {
    const alert = await this.alertController.create({
      header: 'Location Permission Denied',
      message: 'In order to proceed, please enable location access in your device settings.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  async showLocationErrorAlert() {
    const alert = await this.alertController.create({
      header: 'Location Error',
      message: 'We could not retrieve your location. Please check your location settings and try again.',
      buttons: ['OK'],
    });
    await alert.present();
  }
}
