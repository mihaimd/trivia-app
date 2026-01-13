import { Component, OnInit, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { IonItem, IonLabel, IonButton, IonHeader, IonTitle, IonToolbar, IonSpinner, IonChip, IonAvatar, IonRow, IonGrid, IonCol, IonContent } from '@ionic/angular/standalone';
import { User } from 'firebase/auth';
import { UserData } from '../services/firebase.service';
import { AuthService } from '../services/auth.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { DataService } from '../services/data.service';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-lives',
  templateUrl: './lives.component.html',
  styleUrls: ['./lives.component.scss'],
  standalone: true,
  imports: [NgFor, IonItem, IonLabel, IonButton, IonHeader, IonTitle, IonToolbar, IonSpinner, IonChip, IonAvatar, IonRow, IonGrid, IonCol, IonContent],
})
export class LivesComponent implements OnInit {
  public productBundles: any[] = [
    { id: 'lives_5', name: 'Health potion', description: 'Restores or adds 100 health instantly', coins: 5, lives: 1, image: 'potion.webp' },
    { id: 'lives_5', name: 'Holy health potion', description: 'Makes hero invincible for 24 hours', coins: 10, lives: 3, image: 'potion2.webp' }
  ];
  private authService: AuthService = inject(AuthService);
  private alertCtrl: AlertController = inject(AlertController);
  private router: Router = inject(Router);
  private firebaseService: FirebaseService = inject(FirebaseService);
  private dataService: DataService = inject(DataService);

  constructor() { }

  ngOnInit() {
  }

  get currentUser(): UserData | undefined {
    return this.authService.getUserProfileFromLocal();
  }


  async buy(product: any) {
    if (this.currentUser && this.currentUser.totalGoldCoins >= product.coins) {
      this.currentUser.totalGoldCoins -= product.coins;
      this.authService.saveUserProfileInLocal(this.currentUser);
      if (!this.authService.isGuest(this.currentUser)) {
        await this.firebaseService.updateUser(this.currentUser.uid, this.currentUser).then(() => true).catch((err: any) => { console.error('ERR_IN_UPDATE_USER::', err); return false; });
      }
      this.dataService.time.set(0);
      this.dataService.counterEnded$.pipe(
        take(1)
      ).subscribe(() => {
        this.dataService.lifeCounterRunning.set(false);
        this.dataService.currentLifeProgress.update((v) => v + 100);
        this.showAlertForLogin('Success', `You have successfully purchased one ${product.name}!`);
      });
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
