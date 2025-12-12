import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  volumeMediumOutline,
  volumeMuteOutline,
  notificationsOutline,
  notificationsOffOutline,
  textOutline,
  volumeHighOutline,
  logOutOutline,
  powerOutline,
} from 'ionicons/icons';
import { AppSettingInterface } from '../interfaces/chapter-interface';
import { DataService } from '../services/data.service';
import { AppConstants } from '../shared/constants/app-constants';
import { AuthService } from '../services/auth.service';
import { AlertController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { SettingsService } from '../services/settings.service';
import { UserData } from '../services/firebase.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class SettingsPage implements OnInit {
  currentUser: UserData | undefined;
  appSettings: AppSettingInterface;  
  constructor(
    public dataService: DataService,
    public authService: AuthService,
    private alertController: AlertController,
    private settings: SettingsService,
    public router: Router,
  ) {
    addIcons({
      volumeMediumOutline,
      volumeHighOutline,
      volumeMuteOutline,
      notificationsOutline,
      notificationsOffOutline,
      textOutline,
      logOutOutline,
      powerOutline,
    });
    this.appSettings = this.dataService.getAppSettings();
  }
  ionViewWillEnter() {
    this.currentUser = this.authService.getUserProfileFromLocal();
  }
  async ngOnInit() {
    await this.settings.loadSettings();
    this.appSettings.fontSize = this.settings.getFontSize();
  }

  async changeFontSize() {
    await this.settings.setFontSize(this.appSettings.fontSize);
    this.dataService.setItemInLocal(AppConstants.LK_SETTING, this.appSettings);
  }
  
  toggleSound() {
    this.appSettings.sound = !this.appSettings.sound;
    this.dataService.setItemInLocal(AppConstants.LK_SETTING, this.appSettings);
  }
  
  toggleNotifications() {
    this.appSettings.notification = !this.appSettings.notification;
    this.dataService.setItemInLocal(AppConstants.LK_SETTING, this.appSettings);
  }

  async logout() {
    const alertButtons = [
      {
        text: 'CANCEL',
        role: 'cancel',
        handler: () => {
        },
      },
      {
        text: 'OK',
        role: 'confirm',
        handler: () => {
          localStorage.clear();
          this.authService.logout().then(() => {
            // this.authService.guestUserSubject.next(null);
            this.authService.isUserLogout.next(true);
            // localStorage.clear();
            this.dataService.initLocalStorage();
            this.router.navigate(['tabs/home'],{replaceUrl: true});
          }).catch((reason: any) => console.error(reason));
        },
      },
    ];
    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: alertButtons,
      mode: 'ios'
    });
    await alert.present();
  }
}
