import { Component, OnInit, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { IonItem, IonLabel, IonButton, IonHeader, IonTitle, IonToolbar, IonSpinner, IonChip, IonAvatar, IonRow, IonGrid, IonCol, IonContent } from '@ionic/angular/standalone';
import { User } from 'firebase/auth';
import { UserData } from '../services/firebase.service';
import { AuthService } from '../services/auth.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-lives',
  templateUrl: './lives.component.html',
  styleUrls: ['./lives.component.scss'],
  standalone: true,
  imports: [NgFor, IonItem, IonLabel, IonButton, IonHeader, IonTitle, IonToolbar, IonSpinner, IonChip, IonAvatar, IonRow, IonGrid, IonCol, IonContent],
})
export class LivesComponent implements OnInit {
  public productBundles: any[] = [
    { id: 'lives_5', name: 'Small', description: 'Get 5 extra lives to keep playing!', coins: 5, lives: 1 },
    { id: 'lives_5', name: 'Medium', description: 'Get 5 extra lives to keep playing!', coins: 10, lives: 3 },
    { id: 'lives_15', name: 'Large', description: 'Get 15 extra lives and save more!', coins: 20, lives: 7 },
    { id: 'lives_30', name: 'Economy', description: 'Get 30 extra lives for the ultimate gaming experience!', coins: 40 },
  ];
  private authService: AuthService = inject(AuthService);
  private alertCtrl: AlertController = inject(AlertController);
  private router: Router = inject(Router);
  private firebaseService: FirebaseService = inject(FirebaseService);

  constructor() { }

  ngOnInit() {
  }

  get currentUser(): UserData | undefined {
    return this.authService.getUserProfileFromLocal();
  }


  async buy(product: any) {
    if (this.currentUser && this.currentUser.totalGoldCoins >= product.coins) {
      this.currentUser.lives += product.lives;
      this.currentUser.totalGoldCoins -= product.coins;
      this.authService.saveUserProfileInLocal(this.currentUser);
      if (!this.authService.isGuest(this.currentUser)) {
        await this.firebaseService.updateUser(this.currentUser.uid, this.currentUser).then(() => true).catch((err: any) => { console.error('ERR_IN_UPDATE_USER::', err); return false; });
      }
      this.showAlertForLogin('Success', `You have successfully purchased ${product.lives} lives!`);
    } else {
      this.showAlertForLogin('Insufficient Coins', 'You do not have enough gold coins to make this purchase. Please acquire more coins and try again.');
    }

  }

  async showAlertForLogin(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            console.log('Login Handle Action confirmed'); // Custom handler logic for OK
          },
        },
      ]
    });
    await alert.present();
  }

}
