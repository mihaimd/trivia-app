import { Component, OnInit } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-levelup',
  templateUrl: './levelup.component.html',
  styleUrls: ['./levelup.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon]
})
export class LevelupComponent  implements OnInit {
  selectedSkill: string|null;
  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
  ) {
    addIcons({ closeCircle });
    this.selectedSkill = '';
    const currentUser = this.authService.getUserProfileFromLocal();
    if(currentUser) {
      this.selectedSkill = currentUser.skill;
    }
  }

  ngOnInit() {}

  closeModal(data:any|null, role: string = 'cancel') {
    this.modalCtrl.dismiss(data, role);
  }
}
