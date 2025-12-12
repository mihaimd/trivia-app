import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
  IonFab,
  IonFabButton,
  IonRouterOutlet,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  home,
  homeOutline,
  personCircle,
  personCircleOutline,
  settings,
  settingsOutline,
  trophy,
  trophyOutline,
} from 'ionicons/icons';
import { AppConstants } from '../shared/constants/app-constants';
import { SoundService } from '../services/sound.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonIcon,
    IonFab,
    IonFabButton,
    CommonModule,
    FormsModule,
    IonRouterOutlet
  ],
})
export class TabsPage implements OnInit {
  constructor(
    private router: Router,
    private sound: SoundService
  ) {
    addIcons({
      home,
      homeOutline,
      personCircle,
      personCircleOutline,
      trophy,
      trophyOutline,
      alertCircleOutline,
      settings,
      settingsOutline,
    });
  }

  ngOnInit() {}
  onFabClick() {}
  animateTabClick(m: number, event: MouseEvent) {
    localStorage.removeItem(AppConstants.LK_VISIT_CAMPAIGN_QUESTIONS);
    localStorage.setItem(AppConstants.LK_ACTIVE_MENU, `${m}`);
    if(localStorage.getItem(AppConstants.LK_TIMER_IS_PLAYING)) {
      localStorage.removeItem(AppConstants.LK_TIMER_IS_PLAYING);
      this.sound.stop('timer');
    }
    if(m==1) { this.router.navigate(['tabs/home']); }
  }
}
