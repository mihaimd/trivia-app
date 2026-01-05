import { Component, NgZone } from '@angular/core';
import { AlertController, IonApp, IonAvatar, IonCard, IonCardContent, IonContent, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuToggle, IonRouterOutlet, IonSplitPane, IonText, Platform } from '@ionic/angular/standalone';
import { DataService } from './services/data.service';
import { FirebaseService, UserData } from './services/firebase.service';
import { AuthService } from './services/auth.service';
import { SettingsService } from './services/settings.service';
import { AppConstants } from './shared/constants/app-constants';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { closeOutline, powerOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from './shared/avatar/avatar.component';
import { SoundService } from './services/sound.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { environment } from 'src/environments/environment';
import { ProductService } from './services/product.service';
// import { Geolocation } from '@capacitor/geolocation';
import "cordova-plugin-purchase";
import { AdMob } from '@capacitor-community/admob';

declare var CdvPurchase: any;
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, CommonModule, IonRouterOutlet, IonSplitPane, IonMenu, IonContent, IonCard, IonCardContent, IonMenuToggle, IonList, IonItem, IonAvatar, IonLabel, IonIcon, IonText, AvatarComponent],
})
export class AppComponent {
  country: string = AppConstants.DEFAULT_COUNTRY;
  country_code: string = AppConstants.DEFAULT_COUNTRY_CODE;
  player: UserData | undefined;
  CAN_SYNC: boolean = true;
  constructor(
    private dataService: DataService,
    private platform: Platform,
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private settings: SettingsService,
    private router: Router,
    private sound: SoundService,
    private productService: ProductService,
    private alertCtrl: AlertController,
    private ngZone: NgZone
  ) {
    addIcons({ closeOutline, powerOutline });
    this.player = this.authService.getUserProfileFromLocal();
    this.authService.isUserLogout.subscribe({
      next: (value: boolean) => {
        if (value) { this.player = undefined; }
        this.CAN_SYNC = value ? false : true;
        this.initGoogleAuth();
      }
    });
    this.authService.guestUserSubject.subscribe({
      next: (u) => {
        if (u) {
          this.player = this.authService.getUserProfileFromLocal();
          if (this.player) {
            this.player.photoURL = this.dataService.getAvatarUrl(this.player.photoURL);
            this.player.flagURL = this.dataService.getFlagUrl(this.player.country_code);
          }
        }
      }
    });
    this.dataService.initLocalStorage();
    this.initGoogleAuth();
  }

  async ngOnInit() {
    localStorage.removeItem(AppConstants.LK_VISIT_CAMPAIGN_QUESTIONS);
    await this.settings.loadSettings();
    this.authService.user$.subscribe({
      next: (user) => {
        if (user) {
          this.firebaseService.getUser(user.uid).subscribe({
            next: (player) => {
              if (player && this.CAN_SYNC) {
                this.player = player;
                this.authService.saveUserProfileInLocal(player);
              }
            }
          });
          this.syncTriviaAppPlayerCompletedCampaigns();
          this.syncTriviaAppPlayerCompletedRivers();
        }
      }
    });
    await AdMob.initialize();

  }

  async ngAfterViewInit() {
    if (this.platform.is('cordova')) {
      CdvPurchase.Logger.console = {
        error: (message: string | unknown) => console.error(message),
        warn: (message: string | unknown) => console.warn(message),
        log: (message: string | unknown) => console.log(message)
      };
      CdvPurchase.store.verbosity = CdvPurchase.LogLevel.ERROR;
      CdvPurchase.store.register([{
        id: AppConstants.PRODUCT_ID_SMALL,
        type: CdvPurchase.ProductType.CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      }, {
        id: AppConstants.PRODUCT_ID_MEDIUM,
        type: CdvPurchase.ProductType.CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      }, {
        id: AppConstants.PRODUCT_ID_LARGE,
        type: CdvPurchase.ProductType.CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      }, {
        id: AppConstants.PRODUCT_ID_ECONOMY,
        type: CdvPurchase.ProductType.CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      }]);

      // Setup event handlers
      CdvPurchase.store.when()
        .productUpdated(() => {
          // updateProductsUI(); //
          this.ngZone.run(() => {
            console.log('Products loaded from the store:', CdvPurchase.store.products);
          });
        })
        .approved((transaction: any) => {
          this.ngZone.run(() => {
            console.log('Purchase approved:', transaction);
            transaction.verify();
          });
        })
        .verified((receipt: any) => {
          this.ngZone.run(() => {
            console.log('Purchase verified:', receipt);
            receipt.finish();
            // updateActiveSubscriptionUI();
            // Get transaction list
            const tx = receipt.sourceReceipt?.transactions?.[0];
            if (!tx) {
              console.warn("No transaction found in receipt");
              return;
            }

            // Extract productId
            const productId = tx.products?.[0]?.id;
            console.log("__Purchased product:", productId);

            if (productId) {
              const coins = this.productService.getCoinsFromProductId(productId);
              this.updateUserGoldCoins(coins);
              this.showPurchaseSuccessAlert(coins);
            }

          });
        });


      await CdvPurchase.store.initialize([{
        platform: CdvPurchase.Platform.APPLE_APPSTORE,
        options: {
          needAppReceipt: true,
        }
      }, {
        platform: CdvPurchase.Platform.GOOGLE_PLAY
      }]);

      CdvPurchase.store.update();
    }
  }

  initGoogleAuth() {
    GoogleAuth.initialize({
      clientId: environment.OAuthClientId,
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
  }

  async syncTriviaAppPlayerCompletedCampaigns() {
    this.firebaseService.getCompletedCampaignsByCurrentUser().subscribe({
      next: (userData) => {
        if (userData[0]?.completedCampaigns && this.CAN_SYNC) {
          var completedCampaignsIds: number[] = [];
          userData[0]?.completedCampaigns.forEach((cc) => { completedCampaignsIds.push(cc.id); });
          this.dataService.saveAppPlayerDataInLocal({completedCampaigns: userData[0]?.completedCampaigns, completedCampaignsIds });
        }
      }
    });
  }
  async syncTriviaAppPlayerCompletedRivers() {
    this.firebaseService.getCompletedRiversByUid().subscribe({
      next: (completedRivers) => {
        if (completedRivers && this.CAN_SYNC) {
          this.dataService.setCompletedRiverQuestionsIdsInLocal(completedRivers.questionIds, completedRivers.questions);
        }
      }
    });
  }

  updateUserGoldCoins(coins: number) {
    console.log(`Gold coins updated by ${coins}`);
    this.player = this.authService.getUserProfileFromLocal();
    if (this.player) {
      this.player.totalGoldCoins = this.player.totalGoldCoins + coins;
      this.authService.saveUserProfileInLocal(this.player);
      if (!this.authService.isGuest(this.player)) {
        this.firebaseService.updateUser(this.player.uid, { totalGoldCoins: this.player.totalGoldCoins });
      }
    }
  }
  async showPurchaseSuccessAlert(coins: number) {
    const alert = await this.alertCtrl.create({
      header: 'Purchase Successful🎉',
      message: `You received ${coins} gold coins!`,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            console.log('Handle Action confirmed'); // Custom handler logic for OK
            this.router.navigate([`tabs/home`]);
          },
        },
      ],
    });
    await alert.present();
  }

  goToMenu(m: number, u: string) {
    localStorage.setItem(AppConstants.LK_ACTIVE_MENU, `${m}`);
    if (localStorage.getItem(AppConstants.LK_TIMER_IS_PLAYING)) {
      localStorage.removeItem(AppConstants.LK_TIMER_IS_PLAYING);
      this.sound.stop('timer');
    }
    this.router.navigate([`tabs/${u}`]);
  }
  activeMenu(m: number) {
    return (parseInt(localStorage.getItem(AppConstants.LK_ACTIVE_MENU) || '1') == m) ? 'activeMenu' : 'filter-gray';
  }
}