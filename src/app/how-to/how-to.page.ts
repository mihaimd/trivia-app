import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardTitle, IonCardHeader, IonButton, IonFab, IonFabButton, IonIcon, IonFooter, IonButtons, IonMenuButton, IonModal } from '@ionic/angular/standalone';
import { logoIonic, heart, home, personCircleOutline, cameraOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { FirebaseService, UserData } from '../services/firebase.service';
import { Seasons } from '../interfaces/chapter-interface';

@Component({
  selector: 'app-how-to',
  templateUrl: './how-to.page.html',
  styleUrls: ['./how-to.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonCard, IonCardContent, IonCardTitle, IonCardHeader, IonButton, IonFab, IonFabButton, IonIcon, IonFooter, IonButtons, IonMenuButton, IonModal]
})
export class HowToPage implements OnInit {

  readonly router = inject(Router);
  isModalOpen: boolean = false;
  public currentSeason: Seasons | undefined;
  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
  ) {
    addIcons({ personCircleOutline, cameraOutline, home, heart, logoIonic });
  }

  ngOnInit() {
    this.firebaseService.getActiveSeason().subscribe((season) => {
      if (season) {
        this.currentSeason = season;
      }
    });
  }

  goToQuestions(): void {
    if (this.currentSeason) {
      const CS = this.currentSeason;
      const now = new Date();
      if (now.getTime() < this.currentSeason.startDate.toMillis()) {
        this.isModalOpen = true;
      } else {
        const currentUser = this.authService.getUserProfileFromLocal();
        if (currentUser) {
          currentUser.isChallengeStart = true;
          if (currentUser.mySeasons && currentUser.mySeasons.length > 0) {
            const MYS = currentUser.mySeasons.find((s) => s.id == CS.id);
            if (MYS == undefined) {
              currentUser.mySeasons.push({ id: CS.id, startDate: new Date().getTime() });
            }
          } else {
            currentUser.mySeasons = [];
            currentUser.mySeasons.push({ id: CS.id, startDate: new Date().getTime() });
          }
          this.authService.saveUserProfileInLocal(currentUser);
          if (this.authService.isGuest(currentUser) == false) {
            this.firebaseService.updateUser(currentUser.uid, { isChallengeStart: true, mySeasons: currentUser.mySeasons });
          }
          this.router.navigateByUrl('tabs/home/question-river');
        }
      }
    }
  }

  setOpen(x: boolean) {
    this.isModalOpen = x;
  }

}
