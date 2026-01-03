import {
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonAvatar,
  IonCard,
  IonRow,
  IonCol,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonGrid,
  IonFooter,
  IonButtons,
  IonButton,
  IonFab,
  IonFabButton,
  IonTabBar,
  IonTabButton,
  IonLabel,
  AlertController,
  IonItem,
  IonList,
  IonImg,
  IonMenuButton,
  IonSpinner,
  MenuController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  personCircle,
  home,
  sendOutline,
  eye,
  cameraOutline,
  logoGoogle,
  logoFacebook,
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User, UserCredential } from 'firebase/auth';
import { FirebaseService, UserData } from '../services/firebase.service';
import { DataService } from '../services/data.service';
import { AppConstants } from '../shared/constants/app-constants';
import { AppPlayerData, CompletedRivers, Flag } from '../interfaces/chapter-interface';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { CountryDropdownComponent } from '../shared/country-dropdown/country-dropdown.component';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonIcon,
    IonAvatar,
    IonCard,
    IonRow,
    IonCol,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonGrid,
    IonFooter,
    IonButtons,
    IonButton,
    IonFab,
    IonFabButton,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonList,
    IonItem,
    IonImg,
    IonButtons,
    IonMenuButton,
    AvatarComponent,
    CountryDropdownComponent,
    IonSpinner
  ],
})
export class ProfilePage implements OnInit {
  spinner: string | null;
  country: string = AppConstants.DEFAULT_COUNTRY;
  country_code: string = AppConstants.DEFAULT_COUNTRY_CODE;
  public editMode: boolean = false;
  public currentUser: UserData | undefined;
  public avatarsList: string[] = [];
  public flags: Flag[] = [];
  public CRQ: CompletedRivers;
  public CCQ: AppPlayerData;
  constructor(
    public authService: AuthService,
    private firebaseService: FirebaseService,
    public dataService: DataService,
    private menuCtrl: MenuController,
    private router: Router,
    private alertController: AlertController,
  ) {
    addIcons({
      createOutline, home, personCircle, sendOutline, eye, cameraOutline, logoGoogle, logoFacebook
    });
    this.spinner = null;
    this.currentUser = this.authService.getUserProfileFromLocal();
    if (this.currentUser) {
      // this.currentUser.photoURL = this.dataService.getAvatarUrl(this.currentUser.photoURL);
      this.currentUser.level = this.dataService.getLevel(this.currentUser.exp || 0).level;
    }
    this.avatarsList = this.dataService.getAvatars();
    this.CRQ = this.dataService.getCompletedRiverQuestionsFromLocal();
    this.CCQ = this.dataService.getAppPlayerDataFromLocal();
  }

  ngOnInit() { }
  ionViewWillEnter() {
    this.currentUser = this.authService.getUserProfileFromLocal();
    this.CRQ = this.dataService.getCompletedRiverQuestionsFromLocal();
    this.CCQ = this.dataService.getAppPlayerDataFromLocal();
  }
  editUserName() {
    if (this.editMode) {
      this.editMode = false;
      if (this.currentUser) {
        if (this.authService.isGuest(this.currentUser)) {
          this.authService.saveUserProfileInLocal(this.currentUser);
        } else {
          this.firebaseService.updateUser(this.currentUser.uid, { displayName: this.currentUser.displayName });
        }
      }
      Keyboard.hide();
    } else {
      this.editMode = true;
      Keyboard.show();
    }
  }
  onChangeCountry() {
    if (this.currentUser) {
      const selectedCountry = this.currentUser.country_code;
      const flag = this.flags.find((flag) => flag.code == selectedCountry);
      if (flag) { this.currentUser.country = flag.name; }
      if (this.authService.isGuest(this.currentUser)) {
        this.authService.saveUserProfileInLocal(this.currentUser);
      } else {
        this.firebaseService.updateUser(this.currentUser.uid, { country: this.currentUser.country, country_code: this.currentUser.country_code });
      }
    }
  }
  onSelectAvatar(avatarName: string) {
    if (this.currentUser) {
      this.currentUser.photoURL = this.dataService.getAvatarUrl(avatarName);
      this.authService.saveUserProfileInLocal(this.currentUser);
      if (this.authService.isGuest(this.currentUser) == false) {
        this.firebaseService.updateUser(this.currentUser.uid, { photoURL: avatarName });
      }
    }
  }

  getFlag() {
    const code = this.currentUser ? this.currentUser.country_code : AppConstants.DEFAULT_COUNTRY_CODE;
    return this.dataService.getFlagUrl(code);
  }

  async signInWithGoogle() {
    this.authService.isUserLogout.next(true);
    this.spinner = 'Google';
    await this.askUserToLocationPermission();
    if (this.country && this.country_code) {
      if (Capacitor.isNativePlatform()) {
        const result = await this.authService.signInWithCredentialNative();
        const { user } = result;
        if (user) {
          this.makeDataForUsersCollection(result);
        } else {
          this.spinner = null;
        }
      } else {
        this.handleSignInWithGoogleWeb();
      }
    } else {
      // Handle the case where country or country_code is not available
      this.spinner = null;
      this.authService.isUserLogout.next(false);
    }
  }
  async signInWithFacebook() {
    this.spinner = 'Facebook';
    await this.askUserToLocationPermission();
    if (this.country && this.country_code) {
      this.authService
        .signInWithFacebook()
        .then((result) => {
          const { user } = result;
          if (user) {
            this.makeDataForUsersCollection(result);
          }
        })
        .catch((reason: any) => {
          this.spinner = null;
        });
    } else {
      // Handle the case where country or country_code is not available
    }
  }
  async askUserToLocationPermission() {
    try {
      const permStatus = await Geolocation.checkPermissions();
      if (permStatus.location !== 'granted') {
        const requestPerm = await Geolocation.requestPermissions();
        if (requestPerm.location !== 'granted') {
          // If location permission is not granted, show an alert
          await this.showPermissionDeniedAlert();
          return;
        }
      }

      // Now permission granted, get current position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      // Fetch country details using your API
      this.authService.getLocationDetails(lat, lon).subscribe({
        next: (value: any) => {
          if (value) {
            this.country = value.country || this.country;
            this.country_code = value.country_code || this.country_code;
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
  makeDataForUsersCollection(result: UserCredential) {
    if (this.currentUser) {
      const { providerId, user } = result;
      this.currentUser.uid = user.uid;
      this.currentUser.providerId = providerId;
      this.createUser(this.currentUser);
    }
  }
  async createUser(userData: UserData) {
    const USER_SUB = this.firebaseService.getUser(userData.uid).subscribe({
      next: async (userDataFromFirebase) => {
        USER_SUB.unsubscribe();
        if (userDataFromFirebase) {
          this.authService.saveUserProfileInLocal(userDataFromFirebase);
          this.authService.isUserLogout.next(false);
          this.goToHome(userDataFromFirebase, true);
        } else {
          await this.firebaseService.createUser(userData).then(async ()=>{
            if (this.CRQ.questionIds.length > 0) {
              await this.firebaseService.setCompletedRiversByUid(userData.uid, this.CRQ);
            }
            if(this.CCQ.completedCampaigns.length>0) {
              this.CCQ.completedCampaigns.forEach(async (value, index) => {
                this.firebaseService.updateCompletedCampaignsByUid(userData.uid, value).then(()=>{
                  if(index == this.CCQ.completedCampaigns.length-1) {
                    this.authService.saveUserProfileInLocal(userData);
                    this.authService.isUserLogout.next(false);
                    this.goToHome(userData, false);
                  }
                });
              });
            } else {
              this.authService.saveUserProfileInLocal(userData);
              this.authService.isUserLogout.next(false);
              this.goToHome(userData, false);
            }
          });
        }
      }, error: (err: any) => {
        this.authService.isUserLogout.next(false);
        console.error('ERROR_FROM_FB_GET_USER_COL', err);
      }
    });
  }
  handleSignInWithGoogleWeb() {
    this.authService
      .signInWithGoogle()
      .then((result) => {
        const { user } = result;
        if (user) {
          this.makeDataForUsersCollection(result);
        } else {
          this.spinner = null;
        }
      })
      .catch((reason: any) => {
        console.error('WEB_LOGIN_WITH_GOOGLE::', reason);
        this.spinner = null;
      });
  }

  async goToHome(userData: UserData, canSync: boolean) {
    try {
      if (canSync && !this.authService.isGuest(userData)) {
        const [ccDone, crDone] = await Promise.all([
          this.syncCC(),
          this.syncCRQ()
        ]);
        console.log("Sync completed:", ccDone, crDone);
      }

      this.menuCtrl.enable(true);
      this.spinner = null;

      this.authService.isUserLogout.next(false);

      this.router.navigate(['tabs/home'], { replaceUrl: true });

    } catch (err) {
      console.error("Error syncing data:", err);
      this.spinner = null;
    }
  }

  syncCC(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const SUB_CC = this.firebaseService.getCompletedCampaignsByCurrentUser().subscribe({
        next: (completedCampaigns) => {
          SUB_CC.unsubscribe();
          if (completedCampaigns) {
            var completedCampaignsIds: number[] = [];
            completedCampaigns.forEach((cc) => { completedCampaignsIds.push(cc.id); });
            this.dataService.saveAppPlayerDataInLocal({ completedCampaigns, completedCampaignsIds });
            resolve(true);
          } else {
            resolve(true);
          }
        }, error: (err: any) => {
          SUB_CC.unsubscribe();
          reject(false);
        }
      });
    });
  }

  syncCRQ(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const SUB_CR = this.firebaseService.getCompletedRiversByUid().subscribe({
        next: (completedRivers) => {
          SUB_CR.unsubscribe();
          if (completedRivers) {
            this.dataService.setCompletedRiverQuestionsIdsInLocal(completedRivers.questionIds, completedRivers.questions);
            resolve(true);
          } else {
            resolve(true);
          }
        }, error: (err: any) => {
          SUB_CR.unsubscribe();
          console.error('ERROR_IN_FETCH_CRQ_FR_FB::', err);
          reject(false);
        }
      });
    });
  }
}
