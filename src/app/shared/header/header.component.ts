import { Component, OnInit, inject, Input, effect, Signal, signal, WritableSignal, computed } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { IonHeader, IonToolbar, IonButtons, IonMenuButton, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { DataService } from 'src/app/services/data.service';
import { UserData } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonMenuButton, IonButton, NgIf],
})
export class HeaderComponent implements OnInit {
  @Input() menuButton: boolean = true;
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  public dataService: DataService = inject(DataService);
  public userProfile: UserData | undefined;

  constructor() {}

  // queueRegenStart() {
  //   queueMicrotask(() => {
  //     this.dataService.startCountdown(20)
  //   });
  // }

  // addOneLife() {
  //   queueMicrotask(() => {
  //     const currentUser = this.authService.getUserProfileFromLocal();
  //     if (currentUser) {
  //       currentUser.lives += 1;
  //       this.authService.saveUserProfileInLocal(currentUser);
  //       this.dataService.noOfLives.update((n) => n + 1);
  //       this.firebaseService.updateUser(currentUser.uid, currentUser);
  //     }
  //   })
  // }

  ngOnInit() { }

  // shouldStartRegen = computed(() =>
  //   this.currentUser!.lives < 3 && this.dataService.counterEnded() === false
  // );

  // shouldAddOneLife = computed(() =>
  //   this.userProfile!.lives < 3 && this.dataService.counterEnded() === true
  // );

  get currentUser() {
    return this.authService.getUserProfileFromLocal();
  }

  get currentHealth() {
    return Math.ceil(this.dataService.currentLifeProgress());
  }
  goToGoldCoin() {
    this.router.navigate(['tabs/home/gold-coins']);
  }

  goToLives() {
    this.router.navigate(['tabs/lives']);
  }

}
