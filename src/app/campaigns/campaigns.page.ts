import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { listCircle, star, starHalf } from 'ionicons/icons';
import { DataService } from '../services/data.service';
import { CompletedCampaigns } from '../interfaces/chapter-interface';
import { Router } from '@angular/router';
import { FirebaseService, UserData } from '../services/firebase.service';
import { AuthService } from '../services/auth.service';
import { AppConstants } from '../shared/constants/app-constants';

@Component({
  selector: 'app-campaigns',
  templateUrl: './campaigns.page.html',
  styleUrls: ['./campaigns.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonIcon,
    IonNote,
    IonLabel,
    IonButton,
    CommonModule,
    FormsModule,
    IonButtons,
    IonMenuButton,
    IonSpinner
  ],
})
export class CampaignsPage implements OnInit {
  completedCampaigns: CompletedCampaigns[] = [];
  showSpinner: boolean = true;
  currentUser: UserData | undefined;
  constructor(
    public dataService: DataService,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router,
    private alertCtrl: AlertController,
  ) {
    addIcons({ star, starHalf, listCircle });
    this.currentUser = this.authService.getUserProfileFromLocal();
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.completedCampaigns = this.dataService.getAppPlayerCampaignsWhereNotHaveStart(3);
    this.showSpinner = false;
  }

  playCampaign(cc: CompletedCampaigns) {
    this.showTryAgainAlert(cc);
  }
  async showTryAgainAlert(cc: CompletedCampaigns) {

    const alert = await this.alertCtrl.create({
      header: 'Replay',
      message: `Try again for ${AppConstants.TRY_AGAIN_LIMIT_FOR_JOURNEY} gold coins!`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel', // This button will have a 'cancel' role
          handler: () => {
            console.log('Action cancelled'); // Custom handler logic
          },
        },
        {
          text: 'OK',
          handler: () => {
            console.log('Action confirmed'); // Custom handler logic for OK
            this.onClickOk(cc);
          },
        },
      ],
    });
    await alert.present();
  }

  onClickOk(cc: CompletedCampaigns) {
    if (this.currentUser) {
      if (this.currentUser.totalGoldCoins >= AppConstants.TRY_AGAIN_LIMIT_FOR_JOURNEY) {
        this.currentUser.totalGoldCoins = this.currentUser.totalGoldCoins - AppConstants.TRY_AGAIN_LIMIT_FOR_JOURNEY;
        this.authService.saveUserProfileInLocal(this.currentUser);
        if (!this.authService.isGuest(this.currentUser)) {
          this.firebaseService.updateUser(this.currentUser.uid, { totalGoldCoins: this.currentUser.totalGoldCoins });
        }
        this.router.navigate([`tabs/home/campain0/${cc.chapterId}/${cc.gameId}/${cc.id}/false`], { replaceUrl: true });
      } else {
        this.router.navigate([`tabs/home/gold-coins`], { replaceUrl: true });
      }
    }
  }
}
