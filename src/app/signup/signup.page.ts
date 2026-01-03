import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonAvatar,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
  MenuController,
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { FirebaseService, UserData } from '../services/firebase.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { logoFacebook, logoGoogle } from 'ionicons/icons';
import { DataService } from '../services/data.service';
import { GoogleAuth, User } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { Auth, signInWithCredential } from '@angular/fire/auth';
import { AppConstants } from '../shared/constants/app-constants';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonButton,
    IonIcon,
    IonAvatar,
    IonCardContent,
    CommonModule,
    FormsModule,
    IonSpinner
  ],
})
export class SignupPage implements OnInit {
  country: string = AppConstants.DEFAULT_COUNTRY;
  country_code: string = AppConstants.DEFAULT_COUNTRY_CODE;
  spinner: string | null;
  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private firebaseService: FirebaseService,
    private router: Router,
    private alertController: AlertController,
    private menuCtrl: MenuController
  ) {
    addIcons({ logoGoogle, logoFacebook });
    this.spinner = null;
  }
  /* ============codetrix-studio/capacitor-google-auth START============ */
  async ngOnInit() {
    this.menuCtrl.enable(false);
    this.askUserToLocationPermission();
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

  async signInWithGoogle() {
    this.spinner = 'Google';
    // First, ask for location permission before attempting sign-in
    await this.askUserToLocationPermission();
    if (this.country && this.country_code) {
      if (Capacitor.isNativePlatform()) {
        const result = await this.authService.signInWithCredentialNative();
        const { user } = result;
        if (user) {
          this.spinner = null;
          const userData: UserData = this.makeDataForUsersCollection(result);
          this.createUser(userData);
        } else {
          this.spinner = null;
        }
      } else {
        this.handleSignInWithGoogleWeb();
      }
    } else {
      // Handle the case where country or country_code is not available
      console.warn('Country or country code is not available');
      this.spinner = null;
    }
  }
  /* ============codetrix-studio/capacitor-google-auth END============ */

  /* async onSignup(email: string, password: string, name: string) {
    const cred = await this.authService.signUp(email, password);
    const user = cred.user;
  } */

  handleSignInWithGoogleWeb() {
    this.authService
      .signInWithGoogle()
      .then((result) => {
        const { user } = result;
        if (user) {
          const userData: UserData = this.makeDataForUsersCollection(result);
          this.createUser(userData);
        } else {
          this.spinner = null;
        }
      })
      .catch((reason: any) => {
        console.error('WEB_LOGIN_WITH_GOOGLE::', reason);
        this.spinner = null;
      });
  }

  async signInWithFacebook() {
    this.spinner = 'Facebook';
    // Ask for location permission before attempting sign-in
    await this.askUserToLocationPermission();
    if (this.country && this.country_code) {
      this.authService
        .signInWithFacebook()
        .then((result) => {
          console.log("NATIVE_LOGIN_WITH_FACEBOOK::", result);
          const { user } = result;
          if (user) {
            const userData: UserData = this.makeDataForUsersCollection(result);
            this.createUser(userData);
          } else {
            this.spinner = null;
          }
        })
        .catch((reason: any) => {
          console.error('NATIVE_LOGIN_WITH_FACEBOOK::', reason);
          this.spinner = null;
        });
    } else {
      // Handle the case where country or country_code is not available
      console.warn('Country or country code is not available');
      this.spinner = null;
    }
  }

  async playAsGuest() {
    this.dataService.initLocalStorage();
    this.spinner = 'Guest';
    await this.askUserToLocationPermission();
    if (this.country && this.country_code) {
      const userData = this.authService.makeGuestUserProfile(this.country, this.country_code);
      this.goToHome(userData);
    } else {
      // Handle the case where country or country_code is not available
      console.warn('Country or country code is not available');
    }
  }

  makeDataForUsersCollection(result: UserCredential): UserData {
    const { providerId, user } = result;
    var userData: UserData = {
      displayName: user.displayName,
      email: user.email,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      uid: user.uid,
      providerId: providerId,
      photoURL: user.photoURL || AppConstants.DEFAULT_AVATAR,
      exp: 0,
      level: 0,
      timeBonus: 0,
      country: this.country,
      country_code: this.country_code,
      skill: '',
      adsRemoved: false,
      lastActive: this.firebaseService.getFbTimestamp(),
      isChallengeStart: false,
      totalGoldCoins: 0,
      isJourneyStarted: false,
      lives: 0
    };
    return userData;
  }

  async createUser(userData: UserData) {
    userData.country = this.country || userData.country;
    userData.country_code = this.country_code || userData.country_code;
    const USER_SUB = this.firebaseService.getUser(userData.uid).subscribe({
      next: (userDataFromFirebase) => {
        USER_SUB.unsubscribe();
        if (userDataFromFirebase) {
          const userData = this.authService.saveUserProfileInLocal(userDataFromFirebase);
          this.goToHome(userData);
        } else {
          this.firebaseService.createUser(userData).then(() => {
            this.authService.saveUserProfileInLocal(userData);
            this.goToHome(userData);
          }).catch((reason: any) => console.error('ERROR_IN_CREATING_USER::', reason));
        }
      }, error: (err: any) => {
        console.error('ERROR_FROM_FB_GET_USER_COL', err);
        this.spinner = null;
      }
    });
  }

  async goToHome(userData: UserData) {
    try {
      if(!this.authService.isGuest(userData)) {
        const [ccDone, crDone] = await Promise.all([
          this.syncCC(),
          this.syncCRQ()
        ]);
        console.log("Sync completed:", ccDone, crDone);
      }


      this.menuCtrl.enable(true);
      this.spinner = null;

      this.authService.guestUserSubject.next(userData);
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
        next: (userData) => {
          SUB_CC.unsubscribe();
          if (userData[0]?.completedCampaigns) {
            var completedCampaignsIds: number[] = [];
            userData[0]?.completedCampaigns.forEach((cc) => { completedCampaignsIds.push(cc.id); });
            this.dataService.saveAppPlayerDataInLocal({ completedCampaigns: userData[0]?.completedCampaigns, completedCampaignsIds });
            resolve(true);
          } else {
            resolve(true);
          }
        }, error: (err: any) => {
          SUB_CC.unsubscribe();
          console.error('SIGNUP_PAGE_ERROR_IN_FETCH_CC_FR_FB::', err);
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
