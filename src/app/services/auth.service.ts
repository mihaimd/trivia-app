// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, user, GoogleAuthProvider, signInWithPopup, signInWithCredential } from '@angular/fire/auth';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { FacebookAuthProvider, User, UserCredential } from 'firebase/auth';
import { Observable, of, map, BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UserData } from './firebase.service';
import { environment } from 'src/environments/environment';
import { AppConstants } from '../shared/constants/app-constants';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Timestamp } from 'firebase/firestore';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  defaultAvatar: string = AppConstants.DEFAULT_AVATAR;
  user$: Observable<User | null>;
  guestUserSubject = new BehaviorSubject<UserData | null>(null);
  isUserLogout = new BehaviorSubject<boolean>(false);


  constructor(
    private auth: Auth,
    private alertController: AlertController,
    private http: HttpClient
  ) {
    // user() returns an observable of the Firebase user state
    this.user$ = user(this.auth);
  }
  
  async signInWithCredentialNative() {
    console.log("TRY_TO_GOOGLE_LOGIN_A");
    const user = await GoogleAuth.signIn();
    console.log("TRY_TO_GOOGLE_LOGIN_B");
    const credential = GoogleAuthProvider.credential(user.authentication.idToken); // Get the idToken from GoogleAuth    
    console.log("TRY_TO_GOOGLE_LOGIN_C");
    return await signInWithCredential(this.auth, credential); // Firebase sign-in    
  }

  async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(this.auth, provider);
  }
  
  async signInWithFacebook(): Promise<UserCredential> {
    const provider = new FacebookAuthProvider();
    provider.setCustomParameters({
      'scope': 'email,public_profile'
    });
    return await signInWithPopup(this.auth, provider);
  }

  signUp(email: string, password: string): Promise<any> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  login(email: string, password: string): Promise<any> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  // Check if guest
  isGuest(currentUser: UserData): boolean {    
    return (currentUser.providerId!=GoogleAuthProvider.PROVIDER_ID && currentUser.providerId!=FacebookAuthProvider.PROVIDER_ID);
  }

  generateSixDigitNumber() {
    return Math.floor(100000 + Math.random() * 900000);
  }
  // Make Guest User Profile
  makeGuestUserProfile(country: string, country_code: string) {    
    const userData: UserData = {
      displayName: `Player ${this.generateSixDigitNumber()}`,
      uid: `${new Date().getTime()}`,
      email: null,
      emailVerified: false,
      phoneNumber: null,
      providerId: null,
      photoURL: this.defaultAvatar,
      exp: 0,
      level: 0,
      lastActive: Timestamp.fromDate(new Date()),
      timeBonus: 0,
      country: country,
      country_code: country_code,
      skill: '',
      adsRemoved: false,
      totalGoldCoins: 0,
      isJourneyStarted: false,
      lives: 0
    };
    this.saveUserProfileInLocal(userData);
    return userData;
  }

  getUserProfileFromLocal(): UserData | undefined {
    const userData = localStorage.getItem(AppConstants.LK_APP_PLAYER_PROFILE);
    if(userData==null) { return undefined; }
    return JSON.parse(userData);
  }

  saveUserProfileInLocal(userData: UserData): UserData {
    localStorage.setItem(AppConstants.LK_APP_PLAYER_PROFILE, JSON.stringify(userData));
    this.guestUserSubject.next(userData);
    return userData;
  }

  /**
   * Get location details (country, state, city) by latitude and longitude
   */
  getLocationDetails(lat: number, lng: number): Observable<{ country: string | null; country_code: string | null, state: string | null; city: string | null }> {
    const url = `${environment.geocodeApiUrl}?latlng=${lat},${lng}&key=${environment.geocodingApiKey}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        if (!res.results || res.results.length === 0) {
          return { country: null, country_code: null, state: null, city: null };
        }

        let country = null;
        let country_code = null;
        let state = null;
        let city = null;

        const addressComponents = res.results[0].address_components;

        for (const comp of addressComponents) {          
          if (comp.types.includes('country')) {
            country = comp.long_name;
            country_code = comp.short_name;
          }
          if (comp.types.includes('administrative_area_level_1')) {
            state = comp.long_name;
          }
          if (comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')) {
            city = comp.long_name;
          }
        }

        return { country, country_code, state, city };
      })
    );
  }
}
