import { Component, OnInit, inject, Input } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { IonHeader, IonToolbar, IonButtons, IonMenuButton, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';

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


  constructor() { }

  ngOnInit() { }

  get currentUser() {
    return this.authService.getUserProfileFromLocal();
  }

  goToGoldCoin() {
    this.router.navigate(['tabs/home/gold-coins']);
  }

  goToLives() {
    this.router.navigate(['tabs/lives']);
  }

}
